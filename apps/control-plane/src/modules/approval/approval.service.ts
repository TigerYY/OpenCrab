import { Injectable, NotFoundException } from "@nestjs/common";

import { RedisService } from "../../shared/persistence/redis.service";
import { ApprovalRepository } from "./approval.repository";
import { ApprovalDecisionDto } from "./dto/approval-decision.dto";
import { CreateApprovalDto } from "./dto/create-approval.dto";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "timeout";

export interface ApprovalTicket {
  ticketId: string;
  jobId: string;
  status: ApprovalStatus;
  approvalType: string;
  workspaceId: string;
  reason: string;
  comment?: string;
  riskLevel?: string;
  approvers?: string[];
  decidedBy?: string;
  decidedAt?: string;
  timeoutMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ApprovalService {
  constructor(
    private readonly approvalRepository: ApprovalRepository,
    private readonly redisService: RedisService
  ) {}

  private readonly tickets: ApprovalTicket[] = [];

  async create(input: CreateApprovalDto) {
    const now = new Date().toISOString();
    const ticket: ApprovalTicket = {
      ticketId: `apv_${Date.now()}`,
      jobId: `job_${Date.now()}`,
      status: "pending",
      approvalType: input.approvalType,
      workspaceId: input.workspaceId,
      reason: input.reason,
      riskLevel: input.riskLevel,
      approvers: input.approvers,
      timeoutMinutes: input.timeoutMinutes ?? 1440,
      createdAt: now,
      updatedAt: now
    };
    if (this.approvalRepository.isDbEnabled()) {
      await this.approvalRepository.create(ticket);
      await this.redisService.set(
        `approval:${ticket.ticketId}`,
        JSON.stringify(ticket),
        3600
      );
      return ticket;
    }

    this.tickets.push(ticket);
    return ticket;
  }

  async decide(ticketId: string, input: ApprovalDecisionDto) {
    const now = new Date().toISOString();
    if (this.approvalRepository.isDbEnabled()) {
      const ticket = await this.approvalRepository.getByTicketId(ticketId);
      if (!ticket) {
        throw new NotFoundException("APPROVAL_NOT_FOUND");
      }
      if (ticket.status !== "pending") {
        throw new NotFoundException("APPROVAL_ALREADY_DECIDED");
      }
      ticket.status = input.decision;
      ticket.comment = input.comment;
      ticket.decidedBy = input.decidedBy ?? "system";
      ticket.decidedAt = now;
      ticket.updatedAt = now;

      await this.approvalRepository.update(ticket);
      await this.redisService.set(
        `approval:${ticket.ticketId}`,
        JSON.stringify(ticket),
        3600
      );
      return {
        ...ticket,
        jobAction: input.decision === "approved" ? "resume" : "terminate"
      };
    }

    const ticket = this.tickets.find((item) => item.ticketId === ticketId);
    if (!ticket) throw new NotFoundException("APPROVAL_NOT_FOUND");
    ticket.status = input.decision;
    ticket.comment = input.comment;
    ticket.decidedBy = input.decidedBy;
    ticket.decidedAt = now;
    ticket.updatedAt = now;

    return {
      ...ticket,
      jobAction: input.decision === "approved" ? "resume" : "terminate"
    };
  }

  async list(filters?: { workspaceId?: string; status?: string }) {
    if (this.approvalRepository.isDbEnabled()) {
      return this.approvalRepository.list(filters);
    }
    let out = this.tickets;
    if (filters?.workspaceId)
      out = out.filter((t) => t.workspaceId === filters.workspaceId);
    if (filters?.status) out = out.filter((t) => t.status === filters.status);
    return out;
  }

  async getByTicketId(ticketId: string): Promise<ApprovalTicket | null> {
    if (this.approvalRepository.isDbEnabled()) {
      return this.approvalRepository.getByTicketId(ticketId);
    }
    return this.tickets.find((t) => t.ticketId === ticketId) ?? null;
  }

  async listTimeout(workspaceId?: string): Promise<ApprovalTicket[]> {
    if (this.approvalRepository.isDbEnabled()) {
      const pendingPast = await this.approvalRepository.listPendingPastTimeout(
        workspaceId
      );
      if (pendingPast.length > 0) {
        await this.approvalRepository.markStatus(
          pendingPast.map((t) => t.ticketId),
          "timeout"
        );
        return pendingPast.map((t) => ({ ...t, status: "timeout" as const }));
      }
      return this.approvalRepository.list({
        ...(workspaceId && { workspaceId }),
        status: "timeout"
      });
    }
    return [];
  }

  async batchDecision(
    ticketIds: string[],
    decision: "approved" | "rejected",
    comment?: string,
    decidedBy?: string
  ) {
    const results: { ticketId: string; ok: boolean; error?: string }[] = [];
    for (const ticketId of ticketIds) {
      try {
        await this.decide(ticketId, {
          decision,
          comment,
          decidedBy: decidedBy ?? "batch"
        });
        results.push({ ticketId, ok: true });
      } catch (e) {
        results.push({
          ticketId,
          ok: false,
          error: e instanceof Error ? e.message : "UNKNOWN"
        });
      }
    }
    return results;
  }
}
