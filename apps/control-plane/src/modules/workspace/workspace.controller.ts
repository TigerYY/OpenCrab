import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { CreateWorkspaceFromTemplateDto } from "./dto/create-workspace-from-template.dto";
import { WorkspaceService } from "./workspace.service";
import { WorkspaceTemplatesService } from "../workspace-templates/workspace-templates.service";

@Controller("workspaces")
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceTemplatesService: WorkspaceTemplatesService
  ) {}

  @Get()
  async list() {
    return {
      code: "OK",
      message: "success",
      data: await this.workspaceService.list()
    };
  }

  @Post("from-template")
  async createFromTemplate(
    @Req() req: Request,
    @Body() body: CreateWorkspaceFromTemplateDto
  ) {
    const workspace = await this.workspaceTemplatesService.createWorkspaceFromTemplate(
      body.templateId,
      body.name,
      body.overrides
    );
    return {
      code: "OK",
      message: "success",
      data: workspace,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post()
  async create(@Body() body: CreateWorkspaceDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.workspaceService.create(body)
    };
  }

  @Get(":workspaceId")
  async getById(@Param("workspaceId") workspaceId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.workspaceService.getById(workspaceId)
    };
  }
}
