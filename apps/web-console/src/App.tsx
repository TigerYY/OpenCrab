import { FormEvent, useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? "http://localhost:3000/api";
const DEFAULT_WORKSPACE_ID = "ws_default";
const PAGE_SIZE = 5;

type Workspace = { id: string; name: string; createdAt: string };
type AuditEvent = {
  eventType: string;
  workspaceId: string;
  userId: string;
  traceId: string;
  policyDecision?: string;
  resourceRef?: string;
  runtimeMeta?: {
    taskType?: string;
    model?: string;
    adapter?: string;
    fallbackReason?: string;
  };
  createdAt: string;
};
type ApprovalTicket = {
  ticketId: string;
  status: "pending" | "approved" | "rejected";
  approvalType: string;
  reason: string;
  updatedAt: string;
};
type JobItem = {
  jobId: string;
  status: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  queue?: "knowledge.index" | "pr.review";
};
type ConsoleTab = "workspace" | "audit" | "approval" | "jobs";
type DeadLetter = {
  taskKey: string;
  queue: string;
  attempts: number;
  error: string;
  failedAt: string;
};
type RuntimeFallbackStat = {
  fallbackReason: string;
  count: number;
};
type RuntimeFallbackTrendPoint = {
  date: string;
  count: number;
};
type RuntimeFallbackAlert = {
  fallbackReason: string;
  count: number;
  latestAt: string;
};
type RuntimeFallbackAlertResult = {
  windowMinutes: number;
  threshold: number;
  hasAlert: boolean;
  breaches: RuntimeFallbackAlert[];
};

function headers(traceId: string, workspaceId: string) {
  return {
    "Content-Type": "application/json",
    "X-Trace-Id": traceId,
    "X-Workspace-Id": workspaceId,
    "X-Channel-Type": "web"
  };
}

async function api<T>(
  path: string,
  options: RequestInit,
  workspaceId: string
): Promise<T> {
  const traceId = `trc_web_${Date.now()}`;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers(traceId, workspaceId),
      ...(options.headers ?? {})
    }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      typeof json?.message === "string"
        ? json.message
        : Array.isArray(json?.message)
          ? json.message.join("; ")
          : `HTTP ${response.status}`;
    throw new Error(msg);
  }
  return (json.data !== undefined ? json.data : json) as T;
}

export function App() {
  const [tab, setTab] = useState<ConsoleTab>("workspace");
  const [workspaceId, setWorkspaceId] = useState(DEFAULT_WORKSPACE_ID);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [approvalTickets, setApprovalTickets] = useState<ApprovalTicket[]>([]);
  const [knowledgeJobs, setKnowledgeJobs] = useState<JobItem[]>([]);
  const [prJobs, setPrJobs] = useState<JobItem[]>([]);
  const [deadLetters, setDeadLetters] = useState<DeadLetter[]>([]);
  const [runtimeFallbackStats, setRuntimeFallbackStats] = useState<
    RuntimeFallbackStat[]
  >([]);
  const [runtimeFallbackTrend, setRuntimeFallbackTrend] = useState<
    RuntimeFallbackTrendPoint[]
  >([]);
  const [runtimeFallbackAlerts, setRuntimeFallbackAlerts] =
    useState<RuntimeFallbackAlertResult | null>(null);

  const [workspaceName, setWorkspaceName] = useState("New Workspace");
  const [auditEventType, setAuditEventType] = useState("manual.note");
  const [auditUserId, setAuditUserId] = useState("u_console");
  const [approvalReason, setApprovalReason] = useState("console test");
  const [auditFilter, setAuditFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobItem | null>(null);
  const [workspacePage, setWorkspacePage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const [jobPage, setJobPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statsDays, setStatsDays] = useState(7);
  const [statsTopN, setStatsTopN] = useState(5);
  const [alertWindowMinutes, setAlertWindowMinutes] = useState(60);
  const [alertThreshold, setAlertThreshold] = useState(3);

  const summary = useMemo(
    () => ({
      workspaceCount: workspaces.length,
      auditCount: auditEvents.length,
      pendingApprovalCount: approvalTickets.filter(
        (ticket) => ticket.status === "pending"
      ).length,
      totalJobCount: knowledgeJobs.length + prJobs.length
    }),
    [workspaces, auditEvents, approvalTickets, knowledgeJobs.length, prJobs.length]
  );

  const workspacePageItems = useMemo(() => {
    const start = (workspacePage - 1) * PAGE_SIZE;
    return workspaces.slice(start, start + PAGE_SIZE);
  }, [workspaces, workspacePage]);

  const filteredAudit = useMemo(() => {
    const text = auditFilter.trim().toLowerCase();
    if (!text) return auditEvents;
    return auditEvents.filter(
      (item) =>
        item.eventType.toLowerCase().includes(text) ||
        item.userId.toLowerCase().includes(text)
    );
  }, [auditEvents, auditFilter]);

  const auditPageItems = useMemo(() => {
    const start = (auditPage - 1) * PAGE_SIZE;
    return filteredAudit.slice(start, start + PAGE_SIZE);
  }, [filteredAudit, auditPage]);

  const filteredApprovals = useMemo(() => {
    if (approvalFilter === "all") return approvalTickets;
    return approvalTickets.filter((ticket) => ticket.status === approvalFilter);
  }, [approvalTickets, approvalFilter]);

  const approvalPageItems = useMemo(() => {
    const start = (approvalPage - 1) * PAGE_SIZE;
    return filteredApprovals.slice(start, start + PAGE_SIZE);
  }, [filteredApprovals, approvalPage]);

  const combinedJobs = useMemo(() => {
    const taggedKnowledge = knowledgeJobs.map((item) => ({ ...item, queue: "knowledge.index" }));
    const taggedPr = prJobs.map((item) => ({ ...item, queue: "pr.review" }));
    return [...taggedKnowledge, ...taggedPr].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }, [knowledgeJobs, prJobs]);

  const filteredJobs = useMemo(() => {
    if (jobStatusFilter === "all") return combinedJobs;
    return combinedJobs.filter((job) => job.status === jobStatusFilter);
  }, [combinedJobs, jobStatusFilter]);

  const jobPageItems = useMemo(() => {
    const start = (jobPage - 1) * PAGE_SIZE;
    return filteredJobs.slice(start, start + PAGE_SIZE);
  }, [filteredJobs, jobPage]);

  async function refreshAll() {
    setLoading(true);
    try {
      const [
        ws,
        events,
        approvals,
        knowledge,
        pr,
        dls,
        fallbackStats,
        fallbackTrend,
        fallbackAlerts
      ] =
        await Promise.all([
        api<Workspace[]>("/workspaces", { method: "GET" }, workspaceId),
        api<AuditEvent[]>(
          `/audit/events?workspaceId=${encodeURIComponent(workspaceId)}`,
          { method: "GET" },
          workspaceId
        ),
        api<ApprovalTicket[]>("/approvals", { method: "GET" }, workspaceId),
        api<JobItem[]>(
          `/knowledge/index-jobs?workspaceId=${encodeURIComponent(workspaceId)}&limit=50&offset=0`,
          { method: "GET" },
          workspaceId
        ),
        api<JobItem[]>(
          `/integrations/pr-review/jobs?workspaceId=${encodeURIComponent(workspaceId)}&limit=50&offset=0`,
          { method: "GET" },
          workspaceId
        ),
          api<DeadLetter[]>(
            "/jobs/dead-letters?limit=20&offset=0",
            { method: "GET" },
            workspaceId
          ),
          api<RuntimeFallbackStat[]>(
            `/audit/runtime-fallback-stats?workspaceId=${encodeURIComponent(workspaceId)}&days=${statsDays}&topN=${statsTopN}`,
            { method: "GET" },
            workspaceId
          ),
          api<RuntimeFallbackTrendPoint[]>(
            `/audit/runtime-fallback-trend?workspaceId=${encodeURIComponent(workspaceId)}&days=${statsDays}`,
            { method: "GET" },
            workspaceId
          ),
          api<RuntimeFallbackAlertResult>(
            `/audit/runtime-fallback-alerts?workspaceId=${encodeURIComponent(workspaceId)}&windowMinutes=${alertWindowMinutes}&threshold=${alertThreshold}`,
            { method: "GET" },
            workspaceId
          )
        ]);
      setWorkspaces(Array.isArray(ws) ? ws : []);
      setAuditEvents(Array.isArray(events) ? events : []);
      setApprovalTickets(Array.isArray(approvals) ? approvals : []);
      setKnowledgeJobs(Array.isArray(knowledge) ? knowledge : []);
      setPrJobs(Array.isArray(pr) ? pr : []);
      setDeadLetters(Array.isArray(dls) ? dls : []);
      setRuntimeFallbackStats(Array.isArray(fallbackStats) ? fallbackStats : []);
      setRuntimeFallbackTrend(Array.isArray(fallbackTrend) ? fallbackTrend : []);
      setRuntimeFallbackAlerts(
        fallbackAlerts != null && typeof fallbackAlerts === "object"
          ? fallbackAlerts
          : null
      );
      setMessage("数据已刷新");
    } catch (error) {
      setMessage(`刷新失败: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, statsDays, statsTopN, alertWindowMinutes, alertThreshold]);

  async function createWorkspace(event: FormEvent) {
    event.preventDefault();
    await api<Workspace>(
      "/workspaces",
      { method: "POST", body: JSON.stringify({ name: workspaceName }) },
      workspaceId
    );
    setWorkspaceName("");
    setWorkspacePage(1);
    await refreshAll();
  }

  async function createKnowledgeJob() {
    await api(
      "/knowledge/index-jobs",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          mode: "initial",
          sources: [{ type: "git", ref: "repo-a" }]
        })
      },
      workspaceId
    );
    setJobPage(1);
    await refreshAll();
  }

  async function createPrJob() {
    await api(
      "/integrations/pr-review/webhook",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          repo: "repo-a",
          prNumber: Math.floor(Math.random() * 1000) + 1,
          diffRef: "abc..def"
        })
      },
      workspaceId
    );
    setJobPage(1);
    await refreshAll();
  }

  async function fetchJobDetail(queue: "knowledge.index" | "pr.review", jobId: string) {
    const path =
      queue === "knowledge.index"
        ? `/knowledge/index-jobs/${jobId}`
        : `/integrations/pr-review/jobs/${jobId}`;
    const detail = await api<JobItem>(path, { method: "GET" }, workspaceId);
    setSelectedJobDetail({ ...detail, queue });
    setSelectedJobId(jobId);
  }

  async function retryJob(queue: "knowledge.index" | "pr.review", jobId: string) {
    const path =
      queue === "knowledge.index"
        ? `/knowledge/index-jobs/${jobId}/retry`
        : `/integrations/pr-review/jobs/${jobId}/retry`;
    await api<JobItem>(path, { method: "POST" }, workspaceId);
    await refreshAll();
    await fetchJobDetail(queue, jobId);
  }

  async function terminateJob(queue: "knowledge.index" | "pr.review", jobId: string) {
    const path =
      queue === "knowledge.index"
        ? `/knowledge/index-jobs/${jobId}/terminate`
        : `/integrations/pr-review/jobs/${jobId}/terminate`;
    await api<JobItem>(path, { method: "POST" }, workspaceId);
    await refreshAll();
    await fetchJobDetail(queue, jobId);
  }

  async function createAuditEvent(event: FormEvent) {
    event.preventDefault();
    await api<AuditEvent>(
      "/audit/events",
      {
        method: "POST",
        body: JSON.stringify({
          eventType: auditEventType,
          workspaceId,
          userId: auditUserId,
          traceId: `trc_manual_${Date.now()}`
        })
      },
      workspaceId
    );
    setAuditPage(1);
    await refreshAll();
  }

  async function createApproval(event: FormEvent) {
    event.preventDefault();
    await api<ApprovalTicket>(
      "/approvals",
      {
        method: "POST",
        body: JSON.stringify({
          approvalType: "restricted_outbound",
          workspaceId,
          reason: approvalReason
        })
      },
      workspaceId
    );
    setApprovalReason("");
    setApprovalPage(1);
    await refreshAll();
  }

  async function decideApproval(ticketId: string, decision: "approved" | "rejected") {
    await api<ApprovalTicket>(
      `/approvals/${ticketId}/decision`,
      {
        method: "POST",
        body: JSON.stringify({ decision, comment: "handled in console" })
      },
      workspaceId
    );
    await refreshAll();
  }

  return (
    <main className="page">
      <section className="card">
        <h1>🦀 OpenCarb Phase 1 Console</h1>
        <p>管理台已连接控制面 API，可直接验证 Workspace、Audit、Approval 的主链路。</p>
        <div className="toolbar">
          <label>
            Workspace Header:
            <input
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
            />
          </label>
          <button onClick={() => void refreshAll()} disabled={loading}>
            {loading ? "刷新中..." : "刷新"}
          </button>
        </div>
        <div className="summary">
          <span>Workspace: {summary.workspaceCount}</span>
          <span>Audit Events: {summary.auditCount}</span>
          <span>Pending Approvals: {summary.pendingApprovalCount}</span>
          <span>Total Jobs: {summary.totalJobCount}</span>
        </div>
        {message ? <p className="message">{message}</p> : null}
      </section>

      <section className="tabs">
        <button
          className={tab === "workspace" ? "tab active" : "tab"}
          onClick={() => setTab("workspace")}
        >
          Workspace
        </button>
        <button
          className={tab === "audit" ? "tab active" : "tab"}
          onClick={() => setTab("audit")}
        >
          Audit
        </button>
        <button
          className={tab === "approval" ? "tab active" : "tab"}
          onClick={() => setTab("approval")}
        >
          Approval
        </button>
        <button
          className={tab === "jobs" ? "tab active" : "tab"}
          onClick={() => setTab("jobs")}
        >
          Jobs
        </button>
      </section>

      {tab === "workspace" ? (
        <section className="card">
          <h2>Workspace</h2>
          <form onSubmit={createWorkspace} className="form">
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Workspace name"
            />
            <button type="submit">创建</button>
          </form>
          <ul>
            {workspacePageItems.map((workspace) => (
              <li key={workspace.id}>
                <code>{workspace.id}</code> - {workspace.name}
              </li>
            ))}
          </ul>
          <div className="pager">
            <button onClick={() => setWorkspacePage((p) => Math.max(1, p - 1))}>
              上一页
            </button>
            <span>第 {workspacePage} 页</span>
            <button
              onClick={() =>
                setWorkspacePage((p) =>
                  p * PAGE_SIZE < workspaces.length ? p + 1 : p
                )
              }
            >
              下一页
            </button>
          </div>
        </section>
      ) : null}

      {tab === "audit" ? (
        <section className="card">
          <h2>Audit</h2>
          <form onSubmit={createAuditEvent} className="form">
            <input
              value={auditEventType}
              onChange={(event) => setAuditEventType(event.target.value)}
              placeholder="eventType"
            />
            <input
              value={auditUserId}
              onChange={(event) => setAuditUserId(event.target.value)}
              placeholder="userId"
            />
            <button type="submit">写入</button>
          </form>
          <div className="toolbar">
            <label>
              过滤:
              <input
                value={auditFilter}
                onChange={(event) => {
                  setAuditFilter(event.target.value);
                  setAuditPage(1);
                }}
                placeholder="eventType or userId"
              />
            </label>
            <label>
              窗口(天):
              <select
                value={statsDays}
                onChange={(event) => setStatsDays(Number(event.target.value))}
              >
                <option value={3}>3</option>
                <option value={7}>7</option>
                <option value={14}>14</option>
                <option value={30}>30</option>
              </select>
            </label>
            <label>
              TopN:
              <select
                value={statsTopN}
                onChange={(event) => setStatsTopN(Number(event.target.value))}
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </label>
            <label>
              告警窗口(分):
              <select
                value={alertWindowMinutes}
                onChange={(event) => setAlertWindowMinutes(Number(event.target.value))}
              >
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={120}>120</option>
                <option value={240}>240</option>
              </select>
            </label>
            <label>
              告警阈值:
              <select
                value={alertThreshold}
                onChange={(event) => setAlertThreshold(Number(event.target.value))}
              >
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </label>
          </div>
          <ul>
            {auditPageItems.map((audit, index) => (
              <li key={`${audit.traceId}-${index}`}>
                <div>
                  {audit.eventType} / {audit.userId}
                </div>
                {audit.policyDecision ? (
                  <div>policyDecision: {audit.policyDecision}</div>
                ) : null}
                {audit.resourceRef ? <div>resourceRef: {audit.resourceRef}</div> : null}
                {audit.runtimeMeta ? (
                  <div>
                    runtimeMeta: adapter={audit.runtimeMeta.adapter ?? "none"}, model=
                    {audit.runtimeMeta.model ?? "unknown"}, fallbackReason=
                    {audit.runtimeMeta.fallbackReason ?? "none"}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="card">
            <h2>Runtime Fallback Stats</h2>
            <ul>
              {runtimeFallbackStats.map((item) => (
                <li key={item.fallbackReason}>
                  <code>{item.fallbackReason}</code> - {item.count}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2>Runtime Fallback Trend</h2>
            <ul>
              {runtimeFallbackTrend.map((item) => (
                <li key={item.date}>
                  <code>{item.date}</code> - {item.count}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2>Runtime Fallback Alerts</h2>
            <p>
              status:{" "}
              {runtimeFallbackAlerts?.hasAlert ? "ALERT" : "OK"} (window=
              {runtimeFallbackAlerts?.windowMinutes ?? alertWindowMinutes}m, threshold=
              {runtimeFallbackAlerts?.threshold ?? alertThreshold})
            </p>
            <ul>
              {(runtimeFallbackAlerts?.breaches ?? []).map((item) => (
                <li key={`${item.fallbackReason}-${item.latestAt}`}>
                  <code>{item.fallbackReason}</code> count={item.count} latest=
                  {item.latestAt}
                </li>
              ))}
            </ul>
          </div>
          <div className="pager">
            <button onClick={() => setAuditPage((p) => Math.max(1, p - 1))}>
              上一页
            </button>
            <span>第 {auditPage} 页</span>
            <button
              onClick={() =>
                setAuditPage((p) =>
                  p * PAGE_SIZE < filteredAudit.length ? p + 1 : p
                )
              }
            >
              下一页
            </button>
          </div>
        </section>
      ) : null}

      {tab === "approval" ? (
        <section className="card">
          <h2>Approvals</h2>
          <form onSubmit={createApproval} className="form">
            <input
              value={approvalReason}
              onChange={(event) => setApprovalReason(event.target.value)}
              placeholder="approval reason"
            />
            <button type="submit">创建审批</button>
          </form>
          <div className="toolbar">
            <label>
              状态:
              <select
                value={approvalFilter}
                onChange={(event) => {
                  setApprovalFilter(
                    event.target.value as "all" | "pending" | "approved" | "rejected"
                  );
                  setApprovalPage(1);
                }}
              >
                <option value="all">all</option>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
          </div>
          <ul>
            {approvalPageItems.map((ticket) => (
              <li key={ticket.ticketId}>
                <div>
                  <code>{ticket.ticketId}</code> - {ticket.status}
                </div>
                {ticket.status === "pending" ? (
                  <div className="actions">
                    <button
                      onClick={() => void decideApproval(ticket.ticketId, "approved")}
                    >
                      批准
                    </button>
                    <button
                      onClick={() => void decideApproval(ticket.ticketId, "rejected")}
                    >
                      拒绝
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="pager">
            <button onClick={() => setApprovalPage((p) => Math.max(1, p - 1))}>
              上一页
            </button>
            <span>第 {approvalPage} 页</span>
            <button
              onClick={() =>
                setApprovalPage((p) =>
                  p * PAGE_SIZE < filteredApprovals.length ? p + 1 : p
                )
              }
            >
              下一页
            </button>
          </div>
        </section>
      ) : null}

      {tab === "jobs" ? (
        <section className="card">
          <h2>Jobs</h2>
          <div className="form">
            <button onClick={() => void createKnowledgeJob()}>
              新建 Knowledge Job
            </button>
            <button onClick={() => void createPrJob()}>
              新建 PR Review Job
            </button>
          </div>
          <div className="toolbar">
            <label>
              状态:
              <select
                value={jobStatusFilter}
                onChange={(event) => {
                  setJobStatusFilter(event.target.value);
                  setJobPage(1);
                }}
              >
                <option value="all">all</option>
                <option value="queued">queued</option>
                <option value="running">running</option>
                <option value="completed">completed</option>
                <option value="failed">failed</option>
                <option value="terminated">terminated</option>
              </select>
            </label>
            <label>
              JobId:
              <input
                value={selectedJobId}
                onChange={(event) => setSelectedJobId(event.target.value)}
                placeholder="输入 jobId 查看详情"
              />
            </label>
            <button
              onClick={() => {
                const hit = combinedJobs.find((job) => job.jobId === selectedJobId);
                if (hit?.queue) {
                  void fetchJobDetail(hit.queue, hit.jobId);
                } else {
                  setSelectedJobDetail(null);
                  setMessage("未找到对应 jobId，请先刷新数据");
                }
              }}
            >
              查询详情
            </button>
          </div>
          <ul>
            {jobPageItems.map((job) => (
              <li key={`${job.queue}:${job.jobId}`}>
                <div>
                  <code>{job.jobId}</code> [{job.queue}] - {job.status} (retry{" "}
                  {job.retryCount}/{job.maxRetries})
                </div>
                <div className="actions">
                  <button
                    onClick={() => {
                      if (job.queue) {
                        void fetchJobDetail(job.queue, job.jobId);
                      }
                    }}
                  >
                    详情
                  </button>
                  <button
                    onClick={() => {
                      if (job.queue) {
                        void retryJob(job.queue, job.jobId);
                      }
                    }}
                    disabled={job.status === "running"}
                  >
                    重试
                  </button>
                  <button
                    onClick={() => {
                      if (job.queue) {
                        void terminateJob(job.queue, job.jobId);
                      }
                    }}
                    disabled={
                      job.status === "completed" ||
                      job.status === "failed" ||
                      job.status === "terminated"
                    }
                  >
                    终止
                  </button>
                </div>
                {job.lastError ? <div>lastError: {job.lastError}</div> : null}
              </li>
            ))}
          </ul>
          {selectedJobDetail ? (
            <div className="card">
              <h2>Job Detail</h2>
              <p>
                <code>{selectedJobDetail.jobId}</code> [{selectedJobDetail.queue}] -{" "}
                {selectedJobDetail.status}
              </p>
              <p>
                retry {selectedJobDetail.retryCount}/{selectedJobDetail.maxRetries}
              </p>
              {selectedJobDetail.lastError ? (
                <p>lastError: {selectedJobDetail.lastError}</p>
              ) : null}
            </div>
          ) : null}
          <div className="card">
            <h2>Dead Letters</h2>
            <ul>
              {deadLetters.map((item) => (
                <li key={item.taskKey}>
                  <code>{item.taskKey}</code> [{item.queue}] attempt={item.attempts} error=
                  {item.error}
                </li>
              ))}
            </ul>
          </div>
          <div className="pager">
            <button onClick={() => setJobPage((p) => Math.max(1, p - 1))}>
              上一页
            </button>
            <span>第 {jobPage} 页</span>
            <button
              onClick={() =>
                setJobPage((p) => (p * PAGE_SIZE < filteredJobs.length ? p + 1 : p))
              }
            >
              下一页
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
