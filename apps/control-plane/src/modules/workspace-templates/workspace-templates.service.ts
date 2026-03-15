import { Injectable, NotFoundException } from "@nestjs/common";

import { ApprovalPolicyService } from "../approval/approval-policy.service";
import { PrReviewConfigService } from "../integrations/pr-review-config.service";
import { WorkspaceService } from "../workspace/workspace.service";
import { CreateWorkspaceTemplateDto } from "./dto/create-workspace-template.dto";
import type { WorkspaceTemplateRow } from "./workspace-templates.repository";
import { WorkspaceTemplatesRepository } from "./workspace-templates.repository";

@Injectable()
export class WorkspaceTemplatesService {
  constructor(
    private readonly repository: WorkspaceTemplatesRepository,
    private readonly workspaceService: WorkspaceService,
    private readonly approvalPolicyService: ApprovalPolicyService,
    private readonly prReviewConfigService: PrReviewConfigService
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

  async getByIdWithSummary(
    templateId: string
  ): Promise<
    WorkspaceTemplateRow & {
      approvalPoliciesCount?: number;
      prReviewConfigsCount?: number;
    }
  > {
    const row = await this.getById(templateId);
    const out: WorkspaceTemplateRow & { approvalPoliciesCount?: number; prReviewConfigsCount?: number } = { ...row };
    if (this.repository.isDbEnabled()) {
      const [policies, configs] = await Promise.all([
        this.approvalPolicyService.list(row.sourceWorkspaceId),
        this.prReviewConfigService.list(row.sourceWorkspaceId)
      ]);
      out.approvalPoliciesCount = policies.length;
      out.prReviewConfigsCount = configs.length;
    }
    return out;
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
    const workspace = await this.workspaceService.create({ name });
    const sourceWorkspaceId = template.sourceWorkspaceId;

    if (this.repository.isDbEnabled()) {
      const policies = await this.approvalPolicyService.list(sourceWorkspaceId);
      for (const p of policies) {
        await this.approvalPolicyService.create({
          workspaceId: workspace.id,
          triggerEvent: p.triggerEvent,
          riskLevel: p.riskLevel ?? undefined,
          approverRule: p.approverRule,
          timeoutMinutes: p.timeoutMinutes ?? 1440
        });
      }
      const configs = await this.prReviewConfigService.list(sourceWorkspaceId);
      for (const c of configs) {
        await this.prReviewConfigService.create({
          workspaceId: workspace.id,
          repo: c.repo,
          branch: c.branch ?? undefined,
          rulesetId: c.rulesetId ?? undefined,
          templateId: c.templateId ?? undefined,
          writebackPolicy: c.writebackPolicy ?? "comment"
        });
      }
    }
    return workspace;
  }
}
