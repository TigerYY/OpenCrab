import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { ApprovalService } from "./approval.service";
import { ApprovalDecisionDto } from "./dto/approval-decision.dto";
import { CreateApprovalDto } from "./dto/create-approval.dto";

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

  @Get()
  async list(@Req() req: Request) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalService.list(),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
