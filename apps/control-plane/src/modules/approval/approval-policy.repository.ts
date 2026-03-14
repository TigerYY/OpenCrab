import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

export interface ApprovalPolicyRow {
  policyId: string;
  workspaceId: string;
  triggerEvent: string;
  riskLevel: string | null;
  approverRule: string;
  timeoutMinutes: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ApprovalPolicyRepository {
  constructor(private readonly postgresService: PostgresService) {}

  isDbEnabled() {
    return this.postgresService.isConnected();
  }

  async create(row: Omit<ApprovalPolicyRow, "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    await this.postgresService.query(
      `INSERT INTO approval_policies
        (policy_id, workspace_id, trigger_event, risk_level, approver_rule, timeout_minutes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        row.policyId,
        row.workspaceId,
        row.triggerEvent,
        row.riskLevel ?? null,
        row.approverRule,
        row.timeoutMinutes ?? 1440,
        now,
        now
      ]
    );
    return { ...row, createdAt: now, updatedAt: now };
  }

  async getByPolicyId(policyId: string): Promise<ApprovalPolicyRow | null> {
    const result = await this.postgresService.query<ApprovalPolicyRow>(
      `SELECT
        policy_id as "policyId",
        workspace_id as "workspaceId",
        trigger_event as "triggerEvent",
        risk_level as "riskLevel",
        approver_rule as "approverRule",
        timeout_minutes as "timeoutMinutes",
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM approval_policies
       WHERE policy_id = $1
       LIMIT 1`,
      [policyId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    return result.rows[0];
  }

  async update(
    policyId: string,
    updates: { approverRule?: string; timeoutMinutes?: number }
  ) {
    const now = new Date().toISOString();
    const sets: string[] = ["updated_at = $2"];
    const values: unknown[] = [policyId, now];
    let i = 3;
    if (updates.approverRule !== undefined) {
      sets.push(`approver_rule = $${i++}`);
      values.push(updates.approverRule);
    }
    if (updates.timeoutMinutes !== undefined) {
      sets.push(`timeout_minutes = $${i++}`);
      values.push(updates.timeoutMinutes);
    }
    await this.postgresService.query(
      `UPDATE approval_policies SET ${sets.join(", ")} WHERE policy_id = $1`,
      values
    );
  }

  async delete(policyId: string) {
    await this.postgresService.query(
      "DELETE FROM approval_policies WHERE policy_id = $1",
      [policyId]
    );
  }

  async list(workspaceId?: string): Promise<ApprovalPolicyRow[]> {
    if (workspaceId) {
      const result = await this.postgresService.query<ApprovalPolicyRow>(
        `SELECT
          policy_id as "policyId",
          workspace_id as "workspaceId",
          trigger_event as "triggerEvent",
          risk_level as "riskLevel",
          approver_rule as "approverRule",
          timeout_minutes as "timeoutMinutes",
          created_at as "createdAt",
          updated_at as "updatedAt"
         FROM approval_policies
         WHERE workspace_id = $1
         ORDER BY created_at DESC`,
        [workspaceId]
      );
      return result.rows;
    }
    const result = await this.postgresService.query<ApprovalPolicyRow>(
      `SELECT
        policy_id as "policyId",
        workspace_id as "workspaceId",
        trigger_event as "triggerEvent",
        risk_level as "riskLevel",
        approver_rule as "approverRule",
        timeout_minutes as "timeoutMinutes",
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM approval_policies
       ORDER BY created_at DESC
       LIMIT 200`
    );
    return result.rows;
  }
}
