import { Injectable, NotFoundException } from "@nestjs/common";

import { RedisService } from "../../shared/persistence/redis.service";
import { ApprovalRepository } from "./approval.repository";
import { ApprovalDecisionDto } from "./dto/approval-decision.dto";
import { CreateApprovalDto } from "./dto/create-approval.dto";

type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalTicket {
  ticketId: string;
  jobId: string;
  status: ApprovalStatus;
  approvalType: string;
  workspaceId: string;
  reason: string;
  comment?: string;
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
    if (this.approvalRepository.isDbEnabled()) {
      const ticket = await this.approvalRepository.getByTicketId(ticketId);
      if (!ticket) {
        throw new NotFoundException("APPROVAL_NOT_FOUND");
      }
      ticket.status = input.decision;
      ticket.comment = input.comment;
      ticket.updatedAt = new Date().toISOString();

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
    ticket.updatedAt = new Date().toISOString();

    return {
      ...ticket,
      jobAction: input.decision === "approved" ? "resume" : "terminate"
    };
  }

  async list() {
    if (this.approvalRepository.isDbEnabled()) {
      return this.approvalRepository.list();
    }
    return this.tickets;
  }
}
