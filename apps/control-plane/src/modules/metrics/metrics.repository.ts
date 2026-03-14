import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

@Injectable()
export class MetricsRepository {
  constructor(private readonly postgres: PostgresService) {}

  isDbEnabled() {
    return this.postgres.isConnected();
  }

  async getAdoptionMetrics(workspaceId: string, from: string, to: string) {
    if (!this.isDbEnabled()) {
      return { wau: 0, workspaceAdoptionRate: 0, pilotRetention: 0 };
    }
    const wauRes = await this.postgres.query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id) as count FROM audit_events
       WHERE workspace_id = $1 AND created_at >= $2::timestamptz AND created_at < $3::timestamptz`,
      [workspaceId, from, to]
    );
    const wau = parseInt(wauRes.rows[0]?.count ?? "0", 10);
    return {
      wau,
      workspaceAdoptionRate: 0,
      pilotRetention: 0
    };
  }

  async getGovernanceMetrics(workspaceId: string, from: string, to: string) {
    if (!this.isDbEnabled()) {
      return {
        auditCompleteness: 0,
        approvalTriggerRate: 0,
        approvalTimeoutRate: 0,
        externalFallbackRate: 0
      };
    }
    const totalRes = await this.postgres.query<{ total: string }>(
      `SELECT COUNT(*) as total FROM audit_events
       WHERE workspace_id = $1 AND created_at >= $2::timestamptz AND created_at < $3::timestamptz`,
      [workspaceId, from, to]
    );
    const total = parseInt(totalRes.rows[0]?.total ?? "0", 10);
    const withTraceRes = await this.postgres.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_events
       WHERE workspace_id = $1 AND created_at >= $2::timestamptz AND created_at < $3::timestamptz
         AND trace_id IS NOT NULL AND trace_id != ''`,
      [workspaceId, from, to]
    );
    const withTrace = parseInt(withTraceRes.rows[0]?.count ?? "0", 10);
    const approvalRes = await this.postgres.query<{ pending: string; timeout: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'timeout') as timeout
       FROM approval_tickets
       WHERE workspace_id = $1 AND created_at >= $2::timestamptz AND created_at < $3::timestamptz`,
      [workspaceId, from, to]
    );
    const fallbackRes = await this.postgres.query<{ fallback: string }>(
      `SELECT COUNT(*) as fallback FROM audit_events
       WHERE workspace_id = $1 AND created_at >= $2::timestamptz AND created_at < $3::timestamptz
         AND runtime_meta_json->>'fallbackReason' IS NOT NULL
         AND runtime_meta_json->>'fallbackReason' != ''`,
      [workspaceId, from, to]
    );
    const totalApproval = total; // approximate
    const approvalTotalRes = await this.postgres.query<{ total: string }>(
      `SELECT COUNT(*) as total FROM approval_tickets
       WHERE workspace_id = $1 AND created_at >= $2::timestamptz AND created_at < $3::timestamptz`,
      [workspaceId, from, to]
    );
    const approvalTotal = parseInt(approvalTotalRes.rows[0]?.total ?? "0", 10);
    const timeoutCount = parseInt(approvalRes.rows[0]?.timeout ?? "0", 10);
    const auditCompleteness = total > 0 ? (withTrace / total) * 100 : 0;
    const approvalTimeoutRate =
      approvalTotal > 0 ? (timeoutCount / approvalTotal) * 100 : 0;
    const externalFallback = parseInt(fallbackRes.rows[0]?.fallback ?? "0", 10);
    const externalFallbackRate = total > 0 ? (externalFallback / total) * 100 : 0;
    return {
      auditCompleteness,
      approvalTriggerRate: 0,
      approvalTimeoutRate,
      externalFallbackRate
    };
  }

  async getPlatformMetrics(workspaceId: string, from: string, to: string) {
    if (!this.isDbEnabled()) {
      return {
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        jobSuccessRate: 0,
        indexFreshnessHours: 0,
        modelErrorRate: 0
      };
    }
    const jobRes = await this.postgres.query<{ completed: string; total: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) as total
       FROM knowledge_index_jobs
       WHERE workspace_id = $1 AND created_at >= $2::timestamptz AND created_at < $3::timestamptz`,
      [workspaceId, from, to]
    );
    const completed = parseInt(jobRes.rows[0]?.completed ?? "0", 10);
    const total = parseInt(jobRes.rows[0]?.total ?? "0", 10);
    const jobSuccessRate = total > 0 ? (completed / total) * 100 : 0;
    return {
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      jobSuccessRate,
      indexFreshnessHours: 0,
      modelErrorRate: 0
    };
  }
}
