import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

export interface DeadLetterRow {
  taskKey: string;
  queue: string;
  payload: Record<string, unknown>;
  attempts: number;
  error: string;
  failedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

@Injectable()
export class DeadLetterRepository {
  constructor(private readonly postgres: PostgresService) {}

  isDbEnabled() {
    return this.postgres.isConnected();
  }

  async insert(row: Omit<DeadLetterRow, "resolvedAt" | "resolution">) {
    await this.postgres.query(
      `INSERT INTO dead_letters (task_key, queue, payload_json, attempts, error, failed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (task_key) DO NOTHING`,
      [
        row.taskKey,
        row.queue,
        JSON.stringify(row.payload),
        row.attempts,
        row.error,
        row.failedAt
      ]
    );
  }

  async getByTaskKey(taskKey: string): Promise<DeadLetterRow | null> {
    const result = await this.postgres.query<DeadLetterRow & { payloadJson: unknown }>(
      `SELECT task_key as "taskKey", queue, payload_json as "payloadJson", attempts, error,
              failed_at as "failedAt", resolved_at as "resolvedAt", resolution
       FROM dead_letters WHERE task_key = $1 AND resolved_at IS NULL LIMIT 1`,
      [taskKey]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    const r = result.rows[0];
    return {
      taskKey: r.taskKey,
      queue: r.queue,
      payload: (r.payloadJson ?? {}) as Record<string, unknown>,
      attempts: r.attempts,
      error: r.error,
      failedAt: r.failedAt,
      resolvedAt: r.resolvedAt,
      resolution: r.resolution
    };
  }

  async list(filters: {
    queue?: string;
    limit: number;
    offset: number;
    resolved?: boolean;
  }): Promise<DeadLetterRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (filters.queue) {
      conditions.push(`queue = $${i++}`);
      params.push(filters.queue);
    }
    if (filters.resolved === false) {
      conditions.push("resolved_at IS NULL");
    } else if (filters.resolved === true) {
      conditions.push("resolved_at IS NOT NULL");
    }
    const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    params.push(filters.limit, filters.offset);
    const limitParam = params.length - 1;
    const offsetParam = params.length;
    const result = await this.postgres.query<DeadLetterRow & { payloadJson: unknown }>(
      `SELECT task_key as "taskKey", queue, payload_json as "payloadJson", attempts, error,
              failed_at as "failedAt", resolved_at as "resolvedAt", resolution
       FROM dead_letters${where} ORDER BY failed_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );
    return result.rows.map((r) => ({
      taskKey: r.taskKey,
      queue: r.queue,
      payload: (r.payloadJson ?? {}) as Record<string, unknown>,
      attempts: r.attempts,
      error: r.error,
      failedAt: r.failedAt,
      resolvedAt: r.resolvedAt,
      resolution: r.resolution
    }));
  }

  async markResolved(
    taskKey: string,
    resolution: "retry" | "replay" | "ignore" | "terminate"
  ) {
    await this.postgres.query(
      `UPDATE dead_letters SET resolved_at = NOW(), resolution = $1 WHERE task_key = $2`,
      [resolution, taskKey]
    );
  }
}
