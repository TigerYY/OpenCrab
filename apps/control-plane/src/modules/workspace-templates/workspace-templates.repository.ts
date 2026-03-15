import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

export interface WorkspaceTemplateRow {
  templateId: string;
  name: string;
  sourceWorkspaceId: string;
  optionsJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class WorkspaceTemplatesRepository {
  constructor(private readonly postgres: PostgresService) {}

  isDbEnabled() {
    return this.postgres.isConnected();
  }

  async list(workspaceId?: string): Promise<WorkspaceTemplateRow[]> {
    if (!this.isDbEnabled()) return [];
    const rows =
      workspaceId != null
        ? await this.postgres.query<{
            template_id: string;
            name: string;
            source_workspace_id: string;
            options_json: unknown;
            created_at: string;
            updated_at: string;
          }>(
            `SELECT template_id, name, source_workspace_id, options_json, created_at, updated_at
             FROM workspace_templates WHERE source_workspace_id = $1 ORDER BY created_at DESC`,
            [workspaceId]
          )
        : await this.postgres.query<{
            template_id: string;
            name: string;
            source_workspace_id: string;
            options_json: unknown;
            created_at: string;
            updated_at: string;
          }>(
            `SELECT template_id, name, source_workspace_id, options_json, created_at, updated_at
             FROM workspace_templates ORDER BY created_at DESC LIMIT 200`
          );
    return rows.rows.map((r) => ({
      templateId: r.template_id,
      name: r.name,
      sourceWorkspaceId: r.source_workspace_id,
      optionsJson: (r.options_json as Record<string, unknown>) ?? {},
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  async getById(templateId: string): Promise<WorkspaceTemplateRow | null> {
    if (!this.isDbEnabled()) return null;
    const result = await this.postgres.query<{
      template_id: string;
      name: string;
      source_workspace_id: string;
      options_json: unknown;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT template_id, name, source_workspace_id, options_json, created_at, updated_at
       FROM workspace_templates WHERE template_id = $1 LIMIT 1`,
      [templateId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    const r = result.rows[0];
    return {
      templateId: r.template_id,
      name: r.name,
      sourceWorkspaceId: r.source_workspace_id,
      optionsJson: (r.options_json as Record<string, unknown>) ?? {},
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  async create(row: Omit<WorkspaceTemplateRow, "createdAt" | "updatedAt">): Promise<WorkspaceTemplateRow> {
    const now = new Date().toISOString();
    await this.postgres.query(
      `INSERT INTO workspace_templates (template_id, name, source_workspace_id, options_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
      [
        row.templateId,
        row.name,
        row.sourceWorkspaceId,
        JSON.stringify(row.optionsJson ?? {}),
        now,
        now
      ]
    );
    return { ...row, createdAt: now, updatedAt: now };
  }
}
