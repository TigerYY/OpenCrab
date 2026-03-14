import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { WorkspaceService } from "./workspace.service";

@Controller("workspaces")
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  async list() {
    return {
      code: "OK",
      message: "success",
      data: await this.workspaceService.list()
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

  @Post()
  async create(@Body() body: CreateWorkspaceDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.workspaceService.create(body)
    };
  }
}
