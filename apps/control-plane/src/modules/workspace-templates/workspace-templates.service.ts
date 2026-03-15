import { Injectable, NotFoundException } from "@nestjs/common";

import { CreateWorkspaceTemplateDto } from "./dto/create-workspace-template.dto";
import type { WorkspaceTemplateRow } from "./workspace-templates.repository";
import { WorkspaceTemplatesRepository } from "./workspace-templates.repository";
import { WorkspaceService } from "../workspace/workspace.service";

@Injectable()
export class WorkspaceTemplatesService {
  constructor(
    private readonly repository: WorkspaceTemplatesRepository,
    private readonly workspaceService: WorkspaceService
  ) {}

  async list(workspaceId?: string): Promise<WorkspaceTemplateRow[]> {
    if (this.repository.isDbEnabled()) {
      return this.repository.list(workspaceId);
    }
    return [];
  }

  async getById(templateId: string): Promise<WorkspaceTemplateRow> {
    if (this.repository.isDbEnabled()) {
      const row = await this.repository.getById(templateId);
      if (row) return row;
    }
    throw new NotFoundException("TEMPLATE_NOT_FOUND");
  }

  async create(input: CreateWorkspaceTemplateDto): Promise<WorkspaceTemplateRow> {
    if (!this.repository.isDbEnabled()) {
      throw new Error("WORKSPACE_TEMPLATE_REQUIRES_DB");
    }
    await this.workspaceService.getById(input.sourceWorkspaceId);
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return this.repository.create({
      templateId,
      name: input.name,
      sourceWorkspaceId: input.sourceWorkspaceId,
      optionsJson: input.options ?? {}
    });
  }

  async createWorkspaceFromTemplate(
    templateId: string,
    name: string,
    _overrides?: Record<string, unknown>
  ) {
    const template = await this.getById(templateId);
    return this.workspaceService.create({ name });
  }
}
