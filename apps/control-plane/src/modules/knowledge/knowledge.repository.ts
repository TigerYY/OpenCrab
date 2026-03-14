import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

@Injectable()
export class KnowledgeRepository {
  constructor(private readonly postgresService: PostgresService) {}

  isDbEnabled() {
    return this.postgresService.isConnected();
  }

  async createIndexJob(job: {
    jobId: string;
    workspaceId: string;
    mode: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    retryCount: number;
    maxRetries: number;
    lastError?: string;
    sources: Array<{ type: string; ref: string }>;
  }) {
    await this.postgresService.query(
      `INSERT INTO knowledge_index_jobs
        (job_id, workspace_id, mode, status, sources_json, created_at, updated_at, retry_count, max_retries, last_error)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)`,
      [
        job.jobId,
        job.workspaceId,
        job.mode,
        job.status,
        JSON.stringify(job.sources),
        job.createdAt,
        job.updatedAt,
        job.retryCount,
        job.maxRetries,
        job.lastError ?? null
      ]
    );
  }

  async updateJob(
    jobId: string,
    input: {
      status: string;
      updatedAt: string;
      retryCount: number;
      maxRetries: number;
      lastError?: string;
    }
  ) {
    await this.postgresService.query(
      `UPDATE knowledge_index_jobs
       SET status = $1, updated_at = $2, retry_count = $3, max_retries = $4, last_error = $5
       WHERE job_id = $6`,
      [
        input.status,
        input.updatedAt,
        input.retryCount,
        input.maxRetries,
        input.lastError ?? null,
        jobId
      ]
    );
  }

  async getById(jobId: string) {
    const result = await this.postgresService.query<{
      job_id: string;
      workspace_id: string;
      mode: string;
      status: string;
      sources_json: Array<{ type: string; ref: string }>;
      created_at: string;
      updated_at: string;
      retry_count: number;
      max_retries: number;
      last_error: string | null;
    }>(
      `SELECT job_id, workspace_id, mode, status, sources_json, created_at, updated_at, retry_count, max_retries, last_error
       FROM knowledge_index_jobs
       WHERE job_id = $1
       LIMIT 1`,
      [jobId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    const row = result.rows[0];
    return {
      jobId: row.job_id,
      workspaceId: row.workspace_id,
      mode: row.mode,
      status: row.status,
      sources: row.sources_json,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      lastError: row.last_error ?? undefined
    };
  }

  async list(input: {
    workspaceId?: string;
    status?: string;
    limit: number;
    offset: number;
  }) {
    const values: unknown[] = [];
    const where: string[] = [];
    const add = (condition: string, value: unknown) => {
      values.push(value);
      where.push(condition.replace("?", `$${values.length}`));
    };
    if (input.workspaceId) add("workspace_id = ?", input.workspaceId);
    if (input.status) add("status = ?", input.status);
    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    values.push(input.limit);
    values.push(input.offset);
    const limitParam = `$${values.length - 1}`;
    const offsetParam = `$${values.length}`;

    const result = await this.postgresService.query<{
      job_id: string;
      workspace_id: string;
      mode: string;
      status: string;
      sources_json: Array<{ type: string; ref: string }>;
      created_at: string;
      updated_at: string;
      retry_count: number;
      max_retries: number;
      last_error: string | null;
    }>(
      `SELECT job_id, workspace_id, mode, status, sources_json, created_at, updated_at, retry_count, max_retries, last_error
       FROM knowledge_index_jobs
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ${limitParam}
       OFFSET ${offsetParam}`,
      values
    );
    return result.rows.map((row) => ({
      jobId: row.job_id,
      workspaceId: row.workspace_id,
      mode: row.mode,
      status: row.status,
      sources: row.sources_json,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      lastError: row.last_error ?? undefined
    }));
  }
}
