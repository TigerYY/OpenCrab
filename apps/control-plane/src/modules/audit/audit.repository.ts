import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";
import { CreateAuditEventDto } from "./dto/create-audit-event.dto";

@Injectable()
export class AuditRepository {
  constructor(private readonly postgresService: PostgresService) {}

  isDbEnabled() {
    return this.postgresService.isConnected();
  }

  async create(event: CreateAuditEventDto, createdAt: string) {
    await this.postgresService.query(
      `INSERT INTO audit_events
        (event_type, workspace_id, user_id, trace_id, policy_decision, resource_ref, runtime_meta_json, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
      [
        event.eventType,
        event.workspaceId,
        event.userId,
        event.traceId,
        event.policyDecision ?? null,
        event.resourceRef ?? null,
        event.runtimeMeta ? JSON.stringify(event.runtimeMeta) : null,
        createdAt
      ]
    );
  }

  async list(filters: {
    workspaceId?: string;
    userId?: string;
    eventType?: string;
    traceId?: string;
  }) {
    const whereParts: string[] = [];
    const values: unknown[] = [];
    const push = (condition: string, value: unknown) => {
      values.push(value);
      whereParts.push(condition.replace("?", `$${values.length}`));
    };

    if (filters.workspaceId) push("workspace_id = ?", filters.workspaceId);
    if (filters.userId) push("user_id = ?", filters.userId);
    if (filters.eventType) push("event_type = ?", filters.eventType);
    if (filters.traceId) push("trace_id = ?", filters.traceId);

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const result = await this.postgresService.query<{
      event_type: string;
      workspace_id: string;
      user_id: string;
      trace_id: string;
      policy_decision: string | null;
      resource_ref: string | null;
      runtime_meta_json: {
        taskType?: string;
        model?: string;
        adapter?: string;
        fallbackReason?: string;
      } | null;
      created_at: string;
    }>(
      `SELECT event_type, workspace_id, user_id, trace_id, policy_decision, resource_ref, runtime_meta_json, created_at
       FROM audit_events
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT 200`,
      values
    );
    return result.rows.map((row) => ({
      eventType: row.event_type,
      workspaceId: row.workspace_id,
      userId: row.user_id,
      traceId: row.trace_id,
      policyDecision: row.policy_decision ?? undefined,
      resourceRef: row.resource_ref ?? undefined,
      runtimeMeta: row.runtime_meta_json ?? undefined,
      createdAt: row.created_at
    }));
  }

  async listRuntimeFallbackStats(input: {
    workspaceId?: string;
    days: number;
    topN: number;
  }) {
    const whereParts = [
      "event_type = 'model.invoke.runtime'",
      "created_at >= NOW() - ($1::text || ' days')::interval",
      "COALESCE(runtime_meta_json->>'fallbackReason', '') <> ''",
      "COALESCE(runtime_meta_json->>'fallbackReason', 'none') <> 'none'"
    ];
    const values: unknown[] = [input.days];
    if (input.workspaceId) {
      values.push(input.workspaceId);
      whereParts.push(`workspace_id = $${values.length}`);
    }
    values.push(input.topN);
    const topNParam = `$${values.length}`;
    const whereSql = `WHERE ${whereParts.join(" AND ")}`;
    const result = await this.postgresService.query<{
      fallback_reason: string;
      count: string;
    }>(
      `SELECT runtime_meta_json->>'fallbackReason' AS fallback_reason, COUNT(*)::text AS count
       FROM audit_events
       ${whereSql}
       GROUP BY runtime_meta_json->>'fallbackReason'
       ORDER BY COUNT(*) DESC
       LIMIT ${topNParam}`,
      values
    );
    return result.rows.map((row) => ({
      fallbackReason: row.fallback_reason,
      count: Number(row.count)
    }));
  }

  async listRuntimeFallbackTrend(input: { workspaceId?: string; days: number }) {
    const whereParts = [
      "event_type = 'model.invoke.runtime'",
      "created_at >= NOW() - ($1::text || ' days')::interval",
      "COALESCE(runtime_meta_json->>'fallbackReason', '') <> ''",
      "COALESCE(runtime_meta_json->>'fallbackReason', 'none') <> 'none'"
    ];
    const values: unknown[] = [];
    values.push(input.days);
    if (input.workspaceId) {
      values.push(input.workspaceId);
      whereParts.push(`workspace_id = $${values.length}`);
    }
    const whereSql = `WHERE ${whereParts.join(" AND ")}`;
    const result = await this.postgresService.query<{
      event_date: string;
      count: string;
    }>(
      `SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS event_date, COUNT(*)::text AS count
       FROM audit_events
       ${whereSql}
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY DATE_TRUNC('day', created_at) ASC`,
      values
    );
    return result.rows.map((row) => ({
      date: row.event_date,
      count: Number(row.count)
    }));
  }

  async listRuntimeFallbackAlerts(input: {
    workspaceId?: string;
    windowMinutes: number;
    threshold: number;
  }) {
    const whereParts = [
      "event_type = 'model.invoke.runtime'",
      "created_at >= NOW() - ($1::text || ' minutes')::interval",
      "COALESCE(runtime_meta_json->>'fallbackReason', '') <> ''",
      "COALESCE(runtime_meta_json->>'fallbackReason', 'none') <> 'none'"
    ];
    const values: unknown[] = [input.windowMinutes];
    if (input.workspaceId) {
      values.push(input.workspaceId);
      whereParts.push(`workspace_id = $${values.length}`);
    }
    values.push(input.threshold);
    const thresholdParam = `$${values.length}`;
    const whereSql = `WHERE ${whereParts.join(" AND ")}`;

    const result = await this.postgresService.query<{
      fallback_reason: string;
      count: string;
      latest_at: string;
    }>(
      `SELECT
         runtime_meta_json->>'fallbackReason' AS fallback_reason,
         COUNT(*)::text AS count,
         MAX(created_at)::text AS latest_at
       FROM audit_events
       ${whereSql}
       GROUP BY runtime_meta_json->>'fallbackReason'
       HAVING COUNT(*) >= ${thresholdParam}
       ORDER BY COUNT(*) DESC`,
      values
    );
    return result.rows.map((row) => ({
      fallbackReason: row.fallback_reason,
      count: Number(row.count),
      latestAt: row.latest_at
    }));
  }
}
