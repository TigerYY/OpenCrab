import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req
} from "@nestjs/common";
import { Request } from "express";

import { ApprovalService } from "./approval.service";
import { ApprovalDecisionDto } from "./dto/approval-decision.dto";
import { BatchDecisionDto } from "./dto/batch-decision.dto";
import { CreateApprovalDto } from "./dto/create-approval.dto";
import { ListApprovalQueryDto } from "./dto/list-approval-query.dto";

@Controller("approvals")
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post()
  async create(@Req() req: Request, @Body() body: CreateApprovalDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalService.create(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("timeout")
  async listTimeout(
    @Req() req: Request,
    @Query("workspaceId") workspaceId?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalService.listTimeout(workspaceId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("batch-decision")
  async batchDecision(
    @Req() req: Request,
    @Body() body: BatchDecisionDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalService.batchDecision(
        body.ticketIds,
        body.decision,
        body.comment,
        body.decidedBy
      ),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query() query: ListApprovalQueryDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalService.list({
        workspaceId: query.workspaceId,
        status: query.status
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get(":ticketId")
  async get(
    @Req() req: Request,
    @Param("ticketId") ticketId: string
  ) {
    const ticket = await this.approvalService.getByTicketId(ticketId);
    if (!ticket) throw new NotFoundException("APPROVAL_NOT_FOUND");
    return {
      code: "OK",
      message: "success",
      data: ticket,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post(":ticketId/decision")
  async decide(
    @Req() req: Request,
    @Param("ticketId") ticketId: string,
    @Body() body: ApprovalDecisionDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalService.decide(ticketId, body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
