import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";

import { AppModule } from "../src/modules/app.module";

const headerSet = {
  "X-Trace-Id": "trc_test_001",
  "X-Workspace-Id": "ws_default",
  "X-Channel-Type": "web"
};

describe("OpenCrab control-plane e2e", () => {
  let app: INestApplication;
  const prevAcpBaseUrl = process.env.OPENCLAW_ACP_BASE_URL;

  beforeAll(async () => {
    process.env.OPENCLAW_ACP_BASE_URL = "http://127.0.0.1:1";
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (typeof prevAcpBaseUrl === "string") {
      process.env.OPENCLAW_ACP_BASE_URL = prevAcpBaseUrl;
    } else {
      delete process.env.OPENCLAW_ACP_BASE_URL;
    }
  });

  it("GET /api/health returns service status", async () => {
    const response = await request(app.getHttpServer()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.code).toBe("OK");
    expect(response.body.data.service).toBe("opencrab-control-plane");
  });

  it("workspace create/list flow works", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/workspaces")
      .set(headerSet)
      .send({ name: "E2E Workspace" });
    expect(createRes.status).toBe(201);
    expect(createRes.body.code).toBe("OK");
    expect(createRes.body.data.id).toMatch(/^ws_/);

    const listRes = await request(app.getHttpServer())
      .get("/api/workspaces")
      .set(headerSet);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
  });

  it("session/model invoke flow works with runtime adapter", async () => {
    const sessionRes = await request(app.getHttpServer())
      .post("/api/session/context")
      .set(headerSet)
      .send({
        userId: "u_e2e",
        workspaceId: "ws_default",
        channelType: "web",
        resourceContext: { repo: "repo-a" }
      });
    expect(sessionRes.status).toBe(201);
    expect(sessionRes.body.data.runtimeSessionRef).toMatch(/^rt_sess_/);

    const invokeRes = await request(app.getHttpServer())
      .post("/api/model-router/invoke")
      .set(headerSet)
      .send({
        workspaceId: "ws_default",
        taskType: "qa",
        prompt: "hello",
        sensitivity: "internal"
      });
    expect(invokeRes.status).toBe(201);
    expect(invokeRes.body.code).toBe("OK");
    expect(invokeRes.body.data.adapter).toMatch(/^openclaw-runtime-adapter-/);
    expect(typeof invokeRes.body.data.fallbackReason).toBe("string");

    const runtimeAuditRes = await request(app.getHttpServer())
      .get("/api/audit/events?workspaceId=ws_default&eventType=model.invoke.runtime")
      .set(headerSet);
    expect(runtimeAuditRes.status).toBe(200);
    expect(Array.isArray(runtimeAuditRes.body.data)).toBe(true);
    expect(runtimeAuditRes.body.data.length).toBeGreaterThan(0);
    expect(runtimeAuditRes.body.data[0].runtimeMeta).toBeDefined();
    expect(runtimeAuditRes.body.data[0].runtimeMeta.adapter).toMatch(
      /^openclaw-runtime-adapter-/
    );

    const fallbackStatsRes = await request(app.getHttpServer())
      .get("/api/audit/runtime-fallback-stats?workspaceId=ws_default&days=7&topN=5")
      .set(headerSet);
    expect(fallbackStatsRes.status).toBe(200);
    expect(Array.isArray(fallbackStatsRes.body.data)).toBe(true);
    expect(fallbackStatsRes.body.data.length).toBeGreaterThan(0);

    const fallbackTrendRes = await request(app.getHttpServer())
      .get("/api/audit/runtime-fallback-trend?workspaceId=ws_default&days=7")
      .set(headerSet);
    expect(fallbackTrendRes.status).toBe(200);
    expect(Array.isArray(fallbackTrendRes.body.data)).toBe(true);
    expect(fallbackTrendRes.body.data.length).toBeGreaterThan(0);

    const fallbackAlertRes = await request(app.getHttpServer())
      .get(
        "/api/audit/runtime-fallback-alerts?workspaceId=ws_default&windowMinutes=120&threshold=1"
      )
      .set(headerSet);
    expect(fallbackAlertRes.status).toBe(200);
    expect(fallbackAlertRes.body.data.hasAlert).toBe(true);
    expect(Array.isArray(fallbackAlertRes.body.data.breaches)).toBe(true);
    expect(fallbackAlertRes.body.data.breaches.length).toBeGreaterThan(0);
  });

  it("audit event create/list flow works", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/audit/events")
      .set(headerSet)
      .send({
        eventType: "model.invoke",
        workspaceId: "ws_default",
        userId: "u_e2e",
        traceId: "trc_event_001"
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.code).toBe("OK");

    const listRes = await request(app.getHttpServer())
      .get("/api/audit/events?workspaceId=ws_default")
      .set(headerSet);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
  });

  it("approval create/decision flow works", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/approvals")
      .set(headerSet)
      .send({
        approvalType: "restricted_outbound",
        workspaceId: "ws_default",
        reason: "e2e"
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.code).toBe("OK");
    const ticketId: string = createRes.body.data.ticketId;

    const decisionRes = await request(app.getHttpServer())
      .post(`/api/approvals/${ticketId}/decision`)
      .set(headerSet)
      .send({ decision: "approved", comment: "e2e approve" });
    expect(decisionRes.status).toBe(201);
    expect(decisionRes.body.data.status).toBe("approved");
    expect(decisionRes.body.data.jobAction).toBe("resume");
  });

  it("approval list with query and timeout and batch-decision work", async () => {
    const create1 = await request(app.getHttpServer())
      .post("/api/approvals")
      .set(headerSet)
      .send({
        approvalType: "batch_test",
        workspaceId: "ws_default",
        reason: "e2e batch"
      });
    expect(create1.status).toBe(201);
    const ticketId1 = create1.body.data.ticketId;

    const listWithQuery = await request(app.getHttpServer())
      .get("/api/approvals?workspaceId=ws_default&status=pending")
      .set(headerSet);
    expect(listWithQuery.status).toBe(200);
    expect(Array.isArray(listWithQuery.body.data)).toBe(true);

    const timeoutRes = await request(app.getHttpServer())
      .get("/api/approvals/timeout?workspaceId=ws_default")
      .set(headerSet);
    expect(timeoutRes.status).toBe(200);
    expect(Array.isArray(timeoutRes.body.data)).toBe(true);

    const batchRes = await request(app.getHttpServer())
      .post("/api/approvals/batch-decision")
      .set(headerSet)
      .send({
        ticketIds: [ticketId1],
        decision: "rejected",
        comment: "e2e batch reject",
        decidedBy: "e2e"
      });
    expect(batchRes.status).toBe(201);
    expect(Array.isArray(batchRes.body.data)).toBe(true);
    expect(batchRes.body.data[0].ticketId).toBe(ticketId1);
    expect(batchRes.body.data[0].ok).toBe(true);
  });

  it("knowledge/pr job enqueue and list APIs work", async () => {
    const indexJobRes = await request(app.getHttpServer())
      .post("/api/knowledge/index-jobs")
      .set(headerSet)
      .send({
        workspaceId: "ws_default",
        mode: "initial",
        sources: [{ type: "git", ref: "repo-a" }]
      });
    expect(indexJobRes.status).toBe(201);
    expect(indexJobRes.body.data.jobId).toMatch(/^idx_/);

    const prJobRes = await request(app.getHttpServer())
      .post("/api/integrations/pr-review/webhook")
      .set(headerSet)
      .send({
        workspaceId: "ws_default",
        repo: "repo-a",
        prNumber: 12,
        diffRef: "abc..def"
      });
    expect(prJobRes.status).toBe(201);
    expect(prJobRes.body.data.jobId).toMatch(/^job_pr_/);
    const prJobId: string = prJobRes.body.data.jobId;

    const listKnowledgeRes = await request(app.getHttpServer())
      .get("/api/knowledge/index-jobs?workspaceId=ws_default&limit=5&offset=0")
      .set(headerSet);
    expect(listKnowledgeRes.status).toBe(200);
    expect(Array.isArray(listKnowledgeRes.body.data)).toBe(true);
    const knowledgeJobId: string = indexJobRes.body.data.jobId;

    const knowledgeDetailRes = await request(app.getHttpServer())
      .get(`/api/knowledge/index-jobs/${knowledgeJobId}`)
      .set(headerSet);
    expect(knowledgeDetailRes.status).toBe(200);
    expect(knowledgeDetailRes.body.data.jobId).toBe(knowledgeJobId);

    const knowledgeRetryRes = await request(app.getHttpServer())
      .post(`/api/knowledge/index-jobs/${knowledgeJobId}/retry`)
      .set(headerSet)
      .send({});
    expect(knowledgeRetryRes.status).toBe(201);
    expect(knowledgeRetryRes.body.data.status).toBe("queued");

    const knowledgeTerminateRes = await request(app.getHttpServer())
      .post(`/api/knowledge/index-jobs/${knowledgeJobId}/terminate`)
      .set(headerSet)
      .send({});
    expect(knowledgeTerminateRes.status).toBe(201);
    expect(knowledgeTerminateRes.body.data.status).toBe("terminated");

    const listPrRes = await request(app.getHttpServer())
      .get("/api/integrations/pr-review/jobs?workspaceId=ws_default&limit=5&offset=0")
      .set(headerSet);
    expect(listPrRes.status).toBe(200);
    expect(Array.isArray(listPrRes.body.data)).toBe(true);

    const prDetailRes = await request(app.getHttpServer())
      .get(`/api/integrations/pr-review/jobs/${prJobId}`)
      .set(headerSet);
    expect(prDetailRes.status).toBe(200);
    expect(prDetailRes.body.data.jobId).toBe(prJobId);

    const prRetryRes = await request(app.getHttpServer())
      .post(`/api/integrations/pr-review/jobs/${prJobId}/retry`)
      .set(headerSet)
      .send({});
    expect(prRetryRes.status).toBe(201);
    expect(prRetryRes.body.data.status).toBe("queued");

    const prTerminateRes = await request(app.getHttpServer())
      .post(`/api/integrations/pr-review/jobs/${prJobId}/terminate`)
      .set(headerSet)
      .send({});
    expect(prTerminateRes.status).toBe(201);
    expect(prTerminateRes.body.data.status).toBe("terminated");

    const deadLettersRes = await request(app.getHttpServer())
      .get("/api/jobs/dead-letters?limit=10&offset=0")
      .set(headerSet);
    expect(deadLettersRes.status).toBe(200);
    expect(Array.isArray(deadLettersRes.body.data)).toBe(true);
  });

  it("approval-policies list and CRUD when DB available", async () => {
    const listRes = await request(app.getHttpServer())
      .get("/api/approval-policies?workspaceId=ws_default")
      .set(headerSet);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const createRes = await request(app.getHttpServer())
      .post("/api/approval-policies")
      .set(headerSet)
      .send({
        workspaceId: "ws_default",
        triggerEvent: "restricted_outbound",
        approverRule: "any",
        timeoutMinutes: 60
      });
    if (createRes.status === 201) {
      const policyId: string = createRes.body.data.policyId;
      const getRes = await request(app.getHttpServer())
        .get(`/api/approval-policies/${policyId}`)
        .set(headerSet);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.triggerEvent).toBe("restricted_outbound");

      await request(app.getHttpServer())
        .patch(`/api/approval-policies/${policyId}`)
        .set(headerSet)
        .send({ timeoutMinutes: 120 });

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/approval-policies/${policyId}`)
        .set(headerSet);
      expect(deleteRes.status).toBe(200);
    }
    expect([201, 500]).toContain(createRes.status);
  });

  it("skills packages and approved-view work", async () => {
    const packagesRes = await request(app.getHttpServer())
      .get("/api/skills/packages")
      .set(headerSet);
    expect(packagesRes.status).toBe(200);
    expect(Array.isArray(packagesRes.body.data)).toBe(true);

    const approvedRes = await request(app.getHttpServer())
      .get("/api/skills/approved-view?workspaceId=ws_default")
      .set(headerSet);
    expect(approvedRes.status).toBe(200);
    expect(Array.isArray(approvedRes.body.data)).toBe(true);
  });

  it("metrics adoption, quality, governance, platform work", async () => {
    const adoptionRes = await request(app.getHttpServer())
      .get("/api/metrics/adoption?workspaceId=ws_default")
      .set(headerSet);
    expect(adoptionRes.status).toBe(200);
    expect(typeof adoptionRes.body.data.wau).toBe("number");

    const qualityRes = await request(app.getHttpServer())
      .get("/api/metrics/quality?workspaceId=ws_default")
      .set(headerSet);
    expect(qualityRes.status).toBe(200);
    expect(typeof qualityRes.body.data.knowledgeHitRate).toBe("number");
    expect(typeof qualityRes.body.data.prReviewSignalAccuracy).toBe("number");

    const governanceRes = await request(app.getHttpServer())
      .get("/api/metrics/governance?workspaceId=ws_default")
      .set(headerSet);
    expect(governanceRes.status).toBe(200);
    expect(typeof governanceRes.body.data.auditCompleteness).toBe("number");

    const platformRes = await request(app.getHttpServer())
      .get("/api/metrics/platform?workspaceId=ws_default")
      .set(headerSet);
    expect(platformRes.status).toBe(200);
    expect(typeof platformRes.body.data.jobSuccessRate).toBe("number");
    expect(typeof platformRes.body.data.modelErrorRate).toBe("number");
  });

  it("pr-review configs list and results work", async () => {
    const configsListRes = await request(app.getHttpServer())
      .get("/api/integrations/pr-review/configs")
      .set(headerSet);
    expect(configsListRes.status).toBe(200);
    expect(Array.isArray(configsListRes.body.data)).toBe(true);

    const resultsRes = await request(app.getHttpServer())
      .get("/api/integrations/pr-review/results?workspaceId=ws_default&limit=5")
      .set(headerSet);
    expect(resultsRes.status).toBe(200);
    expect(Array.isArray(resultsRes.body.data)).toBe(true);

    const createConfigRes = await request(app.getHttpServer())
      .post("/api/integrations/pr-review/configs")
      .set(headerSet)
      .send({
        workspaceId: "ws_default",
        repo: "repo-e2e"
      });
    if (createConfigRes.status === 201) {
      const configId: string = createConfigRes.body.data.configId;
      const getConfigRes = await request(app.getHttpServer())
        .get(`/api/integrations/pr-review/configs/${configId}`)
        .set(headerSet);
      expect(getConfigRes.status).toBe(200);
      await request(app.getHttpServer())
        .delete(`/api/integrations/pr-review/configs/${configId}`)
        .set(headerSet);
    }
    expect([201, 500]).toContain(createConfigRes.status);
  });

  it("unified GET /api/jobs and resume-after-approval format validation work", async () => {
    const listRes = await request(app.getHttpServer())
      .get("/api/jobs?workspaceId=ws_default&limit=5")
      .set(headerSet);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const invalidResumeRes = await request(app.getHttpServer())
      .post("/api/jobs/invalid-no-colon/resume-after-approval")
      .set(headerSet);
    expect(invalidResumeRes.status).toBe(400);
    expect(invalidResumeRes.body.message).toMatch(/JOB_ID_FORMAT_INVALID|JOB_TYPE_INVALID|Bad Request/);
  });

  it("workspace-templates list and create-workspace-from-template when DB available", async () => {
    const listRes = await request(app.getHttpServer())
      .get("/api/workspace-templates")
      .set(headerSet);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const createTplRes = await request(app.getHttpServer())
      .post("/api/workspace-templates")
      .set(headerSet)
      .send({
        name: "e2e-template",
        sourceWorkspaceId: "ws_default"
      });
    if (createTplRes.status === 201) {
      const templateId: string = createTplRes.body.data.templateId;
      const getTplRes = await request(app.getHttpServer())
        .get(`/api/workspace-templates/${templateId}`)
        .set(headerSet);
      expect(getTplRes.status).toBe(200);
      expect(getTplRes.body.data.name).toBe("e2e-template");

      const fromTplRes = await request(app.getHttpServer())
        .post("/api/workspaces/from-template")
        .set(headerSet)
        .send({ templateId, name: "E2E From Template" });
      expect(fromTplRes.status).toBe(201);
      expect(fromTplRes.body.data.id).toMatch(/^ws_/);
      expect(fromTplRes.body.data.name).toBe("E2E From Template");
    }
    expect([201, 500]).toContain(createTplRes.status);
  });
});
