import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";
import { Workspace } from "./workspace.types";

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly postgresService: PostgresService) {}

  isDbEnabled() {
    return this.postgresService.isConnected();
  }

  async list() {
    const result = await this.postgresService.query<{
      id: string;
      name: string;
      created_at: string;
    }>("SELECT id, name, created_at FROM workspaces ORDER BY created_at DESC");
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at
    }));
  }

  async getById(id: string) {
    const result = await this.postgresService.query<{
      id: string;
      name: string;
      created_at: string;
    }>("SELECT id, name, created_at FROM workspaces WHERE id = $1 LIMIT 1", [id]);
    if (!result.rowCount || result.rowCount < 1) return null;
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      createdAt: result.rows[0].created_at
    };
  }

  async create(workspace: Workspace) {
    await this.postgresService.query(
      "INSERT INTO workspaces (id, name, created_at) VALUES ($1, $2, $3)",
      [workspace.id, workspace.name, workspace.createdAt]
    );
    return workspace;
  }
}
