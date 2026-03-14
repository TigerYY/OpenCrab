import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req
} from "@nestjs/common";
import { Request } from "express";

import { SkillsService } from "./skills.service";
import { CanarySkillDto } from "./dto/canary-skill.dto";
import { CreateSkillPackageDto } from "./dto/create-skill-package.dto";
import { ReviewSkillDto } from "./dto/review-skill.dto";

@Controller("skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post("packages")
  async createPackage(
    @Req() req: Request,
    @Body() body: CreateSkillPackageDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.create(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("approved-view")
  async getApprovedView(
    @Req() req: Request,
    @Query("workspaceId") workspaceId: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.getApprovedView(
        workspaceId ?? req.requestContext?.workspaceId ?? "ws_default"
      ),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("packages")
  async listPackages(
    @Req() req: Request,
    @Query("sourceType") sourceType?: string,
    @Query("status") status?: string,
    @Query("workspaceId") workspaceId?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.list({
        sourceType,
        status,
        workspaceId
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("packages/:skillId")
  async getPackage(
    @Req() req: Request,
    @Param("skillId") skillId: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.getById(skillId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("packages/:skillId/review")
  async review(
    @Req() req: Request,
    @Param("skillId") skillId: string,
    @Body() body: ReviewSkillDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.review(skillId, body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("packages/:skillId/approve")
  async approve(
    @Req() req: Request,
    @Param("skillId") skillId: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.approve(skillId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("packages/:skillId/canary")
  async canary(
    @Req() req: Request,
    @Param("skillId") skillId: string,
    @Body() body: CanarySkillDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.canary(skillId, body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("packages/:skillId/release")
  async release(
    @Req() req: Request,
    @Param("skillId") skillId: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.release(skillId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("packages/:skillId/rollback")
  async rollback(
    @Req() req: Request,
    @Param("skillId") skillId: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.skillsService.rollback(skillId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
