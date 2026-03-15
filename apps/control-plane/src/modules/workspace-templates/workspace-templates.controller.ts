import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { CreateWorkspaceFromTemplateBodyDto } from "./dto/create-workspace-from-template-body.dto";
import { CreateWorkspaceTemplateDto } from "./dto/create-workspace-template.dto";
import { WorkspaceTemplatesService } from "./workspace-templates.service";

@Controller("workspace-templates")
export class WorkspaceTemplatesController {
  constructor(private readonly service: WorkspaceTemplatesService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query("workspaceId") workspaceId?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.service.list(workspaceId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get(":templateId")
  async getById(
    @Req() req: Request,
    @Param("templateId") templateId: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.service.getByIdWithSummary(templateId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() body: CreateWorkspaceTemplateDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.service.create(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post(":templateId/create-workspace")
  async createWorkspaceFromTemplate(
    @Req() req: Request,
    @Param("templateId") templateId: string,
    @Body() body: CreateWorkspaceFromTemplateBodyDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.service.createWorkspaceFromTemplate(
        templateId,
        body.name,
        body.overrides
      ),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
