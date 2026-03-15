import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

export type SkillStatus =
  | "imported"
  | "reviewed"
  | "approved"
  | "canary"
  | "released"
  | "rolledback"
  | "rejected";

export interface SkillPackageRow {
  skillId: string;
  sourceType: string;
  version: string;
  riskLevel: string | null;
  status: SkillStatus;
  workspaceId: string | null;
  registryRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovedSkillViewRow {
  skillId: string;
  version: string;
  status: string;
  workspaceId: string;
}

@Injectable()
export class SkillsRepository {
  constructor(private readonly postgres: PostgresService) {}

  isDbEnabled() {
    return this.postgres.isConnected();
  }

  async create(row: Omit<SkillPackageRow, "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    await this.postgres.query(
      `INSERT INTO skill_packages
        (skill_id, source_type, version, risk_level, status, workspace_id, registry_ref, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        row.skillId,
        row.sourceType,
        row.version,
        row.riskLevel ?? null,
        row.status ?? "imported",
        row.workspaceId ?? null,
        row.registryRef ?? null,
        now,
        now
      ]
    );
    return { ...row, createdAt: now, updatedAt: now };
  }

  async getById(skillId: string): Promise<SkillPackageRow | null> {
    const result = await this.postgres.query<SkillPackageRow>(
      `SELECT skill_id as "skillId", source_type as "sourceType", version, risk_level as "riskLevel",
              status, workspace_id as "workspaceId", registry_ref as "registryRef", created_at as "createdAt", updated_at as "updatedAt"
       FROM skill_packages WHERE skill_id = $1 LIMIT 1`,
      [skillId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    const r = result.rows[0] as unknown as Record<string, unknown>;
    if (r && !("registryRef" in r)) r.registryRef = null;
    return result.rows[0];
  }

  async updateStatus(skillId: string, status: SkillStatus) {
    const now = new Date().toISOString();
    await this.postgres.query(
      "UPDATE skill_packages SET status = $1, updated_at = $2 WHERE skill_id = $3",
      [status, now, skillId]
    );
  }

  async list(filters?: {
    sourceType?: string;
    status?: string;
    workspaceId?: string;
  }): Promise<SkillPackageRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (filters?.sourceType) {
      conditions.push(`source_type = $${i++}`);
      params.push(filters.sourceType);
    }
    if (filters?.status) {
      conditions.push(`status = $${i++}`);
      params.push(filters.status);
    }
    if (filters?.workspaceId) {
      conditions.push(`(workspace_id = $${i++} OR workspace_id IS NULL)`);
      params.push(filters.workspaceId);
    }
    const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.postgres.query<SkillPackageRow>(
      `SELECT skill_id as "skillId", source_type as "sourceType", version, risk_level as "riskLevel",
              status, workspace_id as "workspaceId", registry_ref as "registryRef", created_at as "createdAt", updated_at as "updatedAt"
       FROM skill_packages${where} ORDER BY created_at DESC LIMIT 200`,
      params
    );
    result.rows.forEach((r) => {
      const row = r as unknown as Record<string, unknown>;
      if (row && !("registryRef" in row)) row.registryRef = null;
    });
    return result.rows;
  }

  async addReviewRecord(
    skillId: string,
    reviewer: string,
    decision: string,
    comment?: string
  ) {
    await this.postgres.query(
      `INSERT INTO skill_review_records (skill_id, reviewer, decision, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [skillId, reviewer, decision ?? null, comment ?? null]
    );
  }

  async addReleasePlan(
    skillId: string,
    workspaceScope: string,
    rolloutPercent: number
  ) {
    await this.postgres.query(
      `INSERT INTO skill_release_plans (skill_id, workspace_scope, rollout_percent, started_at, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [skillId, workspaceScope, rolloutPercent]
    );
  }

  async getApprovedView(workspaceId: string): Promise<ApprovedSkillViewRow[]> {
    const result = await this.postgres.query<ApprovedSkillViewRow>(
      `SELECT skill_id as "skillId", version, status, workspace_id as "workspaceId"
       FROM skill_packages
       WHERE status IN ('released', 'canary')
         AND (workspace_id = $1 OR workspace_id IS NULL)
       ORDER BY skill_id`,
      [workspaceId]
    );
    return result.rows;
  }
}
