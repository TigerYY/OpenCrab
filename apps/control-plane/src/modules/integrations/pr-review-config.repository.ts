import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

export interface PrReviewConfigRow {
  configId: string;
  workspaceId: string;
  repo: string;
  branch: string | null;
  rulesetId: string | null;
  templateId: string | null;
  writebackPolicy: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PrReviewConfigRepository {
  constructor(private readonly postgres: PostgresService) {}

  isDbEnabled() {
    return this.postgres.isConnected();
  }

  async create(row: Omit<PrReviewConfigRow, "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    await this.postgres.query(
      `INSERT INTO pr_review_configs
        (config_id, workspace_id, repo, branch, ruleset_id, template_id, writeback_policy, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        row.configId,
        row.workspaceId,
        row.repo,
        row.branch ?? null,
        row.rulesetId ?? null,
        row.templateId ?? null,
        row.writebackPolicy ?? "comment",
        now,
        now
      ]
    );
    return { ...row, createdAt: now, updatedAt: now };
  }

  async getById(configId: string): Promise<PrReviewConfigRow | null> {
    const result = await this.postgres.query<PrReviewConfigRow>(
      `SELECT config_id as "configId", workspace_id as "workspaceId", repo, branch,
              ruleset_id as "rulesetId", template_id as "templateId",
              writeback_policy as "writebackPolicy", created_at as "createdAt", updated_at as "updatedAt"
       FROM pr_review_configs WHERE config_id = $1 LIMIT 1`,
      [configId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    return result.rows[0];
  }

  async update(
    configId: string,
    updates: {
      branch?: string | null;
      rulesetId?: string | null;
      templateId?: string | null;
      writebackPolicy?: string;
    }
  ) {
    const now = new Date().toISOString();
    const sets: string[] = ["updated_at = $2"];
    const values: unknown[] = [configId, now];
    let i = 3;
    if (updates.branch !== undefined) {
      sets.push(`branch = $${i++}`);
      values.push(updates.branch);
    }
    if (updates.rulesetId !== undefined) {
      sets.push(`ruleset_id = $${i++}`);
      values.push(updates.rulesetId);
    }
    if (updates.templateId !== undefined) {
      sets.push(`template_id = $${i++}`);
      values.push(updates.templateId);
    }
    if (updates.writebackPolicy !== undefined) {
      sets.push(`writeback_policy = $${i++}`);
      values.push(updates.writebackPolicy);
    }
    await this.postgres.query(
      `UPDATE pr_review_configs SET ${sets.join(", ")} WHERE config_id = $1`,
      values
    );
  }

  async list(workspaceId?: string): Promise<PrReviewConfigRow[]> {
    if (workspaceId) {
      const result = await this.postgres.query<PrReviewConfigRow>(
        `SELECT config_id as "configId", workspace_id as "workspaceId", repo, branch,
                ruleset_id as "rulesetId", template_id as "templateId",
                writeback_policy as "writebackPolicy", created_at as "createdAt", updated_at as "updatedAt"
         FROM pr_review_configs WHERE workspace_id = $1 ORDER BY created_at DESC`,
        [workspaceId]
      );
      return result.rows;
    }
    const result = await this.postgres.query<PrReviewConfigRow>(
      `SELECT config_id as "configId", workspace_id as "workspaceId", repo, branch,
              ruleset_id as "rulesetId", template_id as "templateId",
              writeback_policy as "writebackPolicy", created_at as "createdAt", updated_at as "updatedAt"
       FROM pr_review_configs ORDER BY created_at DESC LIMIT 100`
    );
    return result.rows;
  }

  async delete(configId: string) {
    await this.postgres.query(
      "DELETE FROM pr_review_configs WHERE config_id = $1",
      [configId]
    );
  }
}
