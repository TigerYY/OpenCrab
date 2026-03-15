import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req
} from "@nestjs/common";
import { Request } from "express";

import { ApprovalPolicyService } from "./approval-policy.service";
import { CreateApprovalPolicyDto } from "./dto/create-approval-policy.dto";
import { ImportApprovalPoliciesDto } from "./dto/import-approval-policies.dto";
import { UpdateApprovalPolicyDto } from "./dto/update-approval-policy.dto";

@Controller("approval-policies")
export class ApprovalPolicyController {
  constructor(
    private readonly approvalPolicyService: ApprovalPolicyService
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() body: CreateApprovalPolicyDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalPolicyService.create(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query("workspaceId") workspaceId?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalPolicyService.list(workspaceId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("export")
  async export(
    @Req() req: Request,
    @Query("workspaceId") workspaceId?: string
  ) {
    if (!workspaceId) {
      throw new BadRequestException("workspaceId is required");
    }
    const data = await this.approvalPolicyService.exportBundle(workspaceId);
    return {
      code: "OK",
      message: "success",
      data: { workspaceId, policies: data },
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("import")
  async import(@Req() req: Request, @Body() body: ImportApprovalPoliciesDto) {
    const data = await this.approvalPolicyService.importBundle(
      body.workspaceId,
      body.policies
    );
    return {
      code: "OK",
      message: "success",
      data: { imported: data.length, policies: data },
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get(":policyId")
  async get(
    @Req() req: Request,
    @Param("policyId") policyId: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.approvalPolicyService.getByPolicyId(policyId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Patch(":policyId")
  async update(
    @Req() req: Request,
    @Param("policyId") policyId: string,
    @Body() body: UpdateApprovalPolicyDto
  ) {
    await this.approvalPolicyService.update(policyId, body);
    return {
      code: "OK",
      message: "success",
      data: null,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Delete(":policyId")
  async delete(
    @Req() req: Request,
    @Param("policyId") policyId: string
  ) {
    await this.approvalPolicyService.delete(policyId);
    return {
      code: "OK",
      message: "success",
      data: null,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
