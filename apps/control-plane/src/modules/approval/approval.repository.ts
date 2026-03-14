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
        (ticket_id, job_id, status, approval_type, workspace_id, reason, comment, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        ticket.ticketId,
        ticket.jobId,
        ticket.status,
        ticket.approvalType,
        ticket.workspaceId,
        ticket.reason,
        ticket.comment ?? null,
        ticket.createdAt,
        ticket.updatedAt
      ]
    );
  }

  async getByTicketId(ticketId: string) {
    const result = await this.postgresService.query<ApprovalTicket>(
      `SELECT
        ticket_id as "ticketId",
        job_id as "jobId",
        status,
        approval_type as "approvalType",
        workspace_id as "workspaceId",
        reason,
        comment,
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM approval_tickets
       WHERE ticket_id = $1
       LIMIT 1`,
      [ticketId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    return result.rows[0];
  }

  async update(ticket: ApprovalTicket) {
    await this.postgresService.query(
      "UPDATE approval_tickets SET status = $1, comment = $2, updated_at = $3 WHERE ticket_id = $4",
      [ticket.status, ticket.comment ?? null, ticket.updatedAt, ticket.ticketId]
    );
  }

  async list() {
    const result = await this.postgresService.query<ApprovalTicket>(
      `SELECT
        ticket_id as "ticketId",
        job_id as "jobId",
        status,
        approval_type as "approvalType",
        workspace_id as "workspaceId",
        reason,
        comment,
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM approval_tickets
       ORDER BY created_at DESC
       LIMIT 200`
    );
    return result.rows;
  }
}
