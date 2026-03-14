import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";
import { ApprovalTicket } from "./approval.service";

@Injectable()
export class ApprovalRepository {
  constructor(private readonly postgresService: PostgresService) {}

  isDbEnabled() {
    return this.postgresService.isConnected();
  }

  async create(ticket: ApprovalTicket) {
    await this.postgresService.query(
      `INSERT INTO approval_tickets
        (ticket_id, job_id, status, approval_type, workspace_id, reason, comment,
         risk_level, approvers_json, timeout_minutes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        ticket.ticketId,
        ticket.jobId,
        ticket.status,
        ticket.approvalType,
        ticket.workspaceId,
        ticket.reason,
        ticket.comment ?? null,
        ticket.riskLevel ?? null,
        ticket.approvers ? JSON.stringify(ticket.approvers) : null,
        ticket.timeoutMinutes ?? null,
        ticket.createdAt,
        ticket.updatedAt
      ]
    );
  }

  async getByTicketId(ticketId: string) {
    const result = await this.postgresService.query<
      ApprovalTicket & { approversJson?: string }
    >(
      `SELECT
        ticket_id as "ticketId",
        job_id as "jobId",
        status,
        approval_type as "approvalType",
        workspace_id as "workspaceId",
        reason,
        comment,
        risk_level as "riskLevel",
        approvers_json as "approversJson",
        decided_by as "decidedBy",
        decided_at as "decidedAt",
        timeout_minutes as "timeoutMinutes",
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM approval_tickets
       WHERE ticket_id = $1
       LIMIT 1`,
      [ticketId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    const row = result.rows[0];
    const approvers = row.approversJson
      ? (JSON.parse(row.approversJson) as string[])
      : undefined;
    return { ...row, approvers } as ApprovalTicket;
  }

  async update(ticket: ApprovalTicket) {
    await this.postgresService.query(
      `UPDATE approval_tickets SET status = $1, comment = $2, updated_at = $3,
        decided_by = $4, decided_at = $5
       WHERE ticket_id = $6`,
      [
        ticket.status,
        ticket.comment ?? null,
        ticket.updatedAt,
        ticket.decidedBy ?? null,
        ticket.decidedAt ?? null,
        ticket.ticketId
      ]
    );
  }

  private mapRow(row: Record<string, unknown>): ApprovalTicket {
    const approvers = row.approversJson
      ? (JSON.parse(row.approversJson as string) as string[])
      : undefined;
    const { approversJson: _, ...rest } = row;
    return { ...rest, approvers } as ApprovalTicket;
  }

  async list(filters?: { workspaceId?: string; status?: string }) {
    let sql = `SELECT
        ticket_id as "ticketId",
        job_id as "jobId",
        status,
        approval_type as "approvalType",
        workspace_id as "workspaceId",
        reason,
        comment,
        risk_level as "riskLevel",
        approvers_json as "approversJson",
        decided_by as "decidedBy",
        decided_at as "decidedAt",
        timeout_minutes as "timeoutMinutes",
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM approval_tickets`;
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (filters?.workspaceId) {
      conditions.push(`workspace_id = $${params.length + 1}`);
      params.push(filters.workspaceId);
    }
    if (filters?.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(filters.status);
    }
    if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += ` ORDER BY created_at DESC LIMIT 200`;
    const result = await this.postgresService.query<Record<string, unknown>>(
      sql,
      params
    );
    return result.rows.map((r) => this.mapRow(r));
  }

  async listPendingPastTimeout(workspaceId?: string): Promise<ApprovalTicket[]> {
    let sql = `SELECT
        ticket_id as "ticketId",
        job_id as "jobId",
        status,
        approval_type as "approvalType",
        workspace_id as "workspaceId",
        reason,
        comment,
        risk_level as "riskLevel",
        approvers_json as "approversJson",
        decided_by as "decidedBy",
        decided_at as "decidedAt",
        timeout_minutes as "timeoutMinutes",
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM approval_tickets
       WHERE status = 'pending'
         AND (created_at + (COALESCE(timeout_minutes, 1440) || ' minutes')::interval) < NOW()`;
    const params: unknown[] = [];
    if (workspaceId) {
      sql += ` AND workspace_id = $1`;
      params.push(workspaceId);
    }
    sql += ` ORDER BY created_at DESC`;
    const result = await this.postgresService.query<Record<string, unknown>>(
      sql,
      params
    );
    return result.rows.map((r) => this.mapRow(r));
  }

  async markStatus(ticketIds: string[], status: string) {
    if (ticketIds.length === 0) return;
    const placeholders = ticketIds.map((_, i) => `$${i + 1}`).join(", ");
    await this.postgresService.query(
      `UPDATE approval_tickets SET status = $${ticketIds.length + 1}, updated_at = $${ticketIds.length + 2}
       WHERE ticket_id IN (${placeholders})`,
      [...ticketIds, status, new Date().toISOString()]
    );
  }
}
