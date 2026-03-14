import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

@Injectable()
export class IntegrationsRepository {
  constructor(private readonly postgresService: PostgresService) {}

  isDbEnabled() {
    return this.postgresService.isConnected();
  }

  async createPrReviewJob(job: {
    jobId: string;
    workspaceId: string;
    repo: string;
    prNumber: number;
    diffRef: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    retryCount: number;
    maxRetries: number;
    lastError?: string;
  }) {
    await this.postgresService.query(
      `INSERT INTO pr_review_jobs
        (job_id, workspace_id, repo, pr_number, diff_ref, status, created_at, updated_at, retry_count, max_retries, last_error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        job.jobId,
        job.workspaceId,
        job.repo,
        job.prNumber,
        job.diffRef,
        job.status,
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
      `UPDATE pr_review_jobs
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
      repo: string;
      pr_number: number;
      diff_ref: string;
      status: string;
      created_at: string;
      updated_at: string;
      retry_count: number;
      max_retries: number;
      last_error: string | null;
    }>(
      `SELECT job_id, workspace_id, repo, pr_number, diff_ref, status, created_at, updated_at, retry_count, max_retries, last_error
       FROM pr_review_jobs
       WHERE job_id = $1
       LIMIT 1`,
      [jobId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    const row = result.rows[0];
    return {
      jobId: row.job_id,
      workspaceId: row.workspace_id,
      repo: row.repo,
      prNumber: row.pr_number,
      diffRef: row.diff_ref,
      status: row.status,
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
      repo: string;
      pr_number: number;
      diff_ref: string;
      status: string;
      created_at: string;
      updated_at: string;
      retry_count: number;
      max_retries: number;
      last_error: string | null;
    }>(
      `SELECT job_id, workspace_id, repo, pr_number, diff_ref, status, created_at, updated_at, retry_count, max_retries, last_error
       FROM pr_review_jobs
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ${limitParam}
       OFFSET ${offsetParam}`,
      values
    );
    return result.rows.map((row) => ({
      jobId: row.job_id,
      workspaceId: row.workspace_id,
      repo: row.repo,
      prNumber: row.pr_number,
      diffRef: row.diff_ref,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      lastError: row.last_error ?? undefined
    }));
  }
}
