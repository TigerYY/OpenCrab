import { Injectable, NotFoundException } from "@nestjs/common";

import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { WorkspaceRepository } from "./workspace.repository";
import { Workspace } from "./workspace.types";

@Injectable()
export class WorkspaceService {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  private readonly workspaces: Workspace[] = [
    {
      id: "ws_default",
      name: "Default Workspace",
      createdAt: new Date().toISOString()
    }
  ];

  async list() {
    if (this.workspaceRepository.isDbEnabled()) {
      return this.workspaceRepository.list();
    }
    return this.workspaces;
  }

  async getById(id: string) {
    if (this.workspaceRepository.isDbEnabled()) {
      const workspace = await this.workspaceRepository.getById(id);
      if (workspace) return workspace;
      throw new NotFoundException("WORKSPACE_NOT_FOUND");
    }

    const workspace = this.workspaces.find((item) => item.id === id);
    if (!workspace) {
      throw new NotFoundException("WORKSPACE_NOT_FOUND");
    }
    return workspace;
  }

  async create(input: CreateWorkspaceDto) {
    const workspace: Workspace = {
      id: `ws_${Date.now()}`,
      name: input.name,
      createdAt: new Date().toISOString()
    };
    if (this.workspaceRepository.isDbEnabled()) {
      return this.workspaceRepository.create(workspace);
    }

    this.workspaces.push(workspace);
    return workspace;
  }
}
