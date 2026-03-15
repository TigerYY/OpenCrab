import { Injectable, NotFoundException } from "@nestjs/common";

import { ApprovalPolicyRepository } from "./approval-policy.repository";
import type { ApprovalPolicyRow } from "./approval-policy.repository";
import { CreateApprovalPolicyDto } from "./dto/create-approval-policy.dto";
import { UpdateApprovalPolicyDto } from "./dto/update-approval-policy.dto";

@Injectable()
export class ApprovalPolicyService {
  constructor(
    private readonly approvalPolicyRepository: ApprovalPolicyRepository
  ) {}

  async create(input: CreateApprovalPolicyDto): Promise<ApprovalPolicyRow> {
    if (!this.approvalPolicyRepository.isDbEnabled()) {
      throw new Error("APPROVAL_POLICY_REQUIRES_DB");
    }
    const policyId = `pol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return this.approvalPolicyRepository.create({
      policyId,
      workspaceId: input.workspaceId,
      triggerEvent: input.triggerEvent,
      riskLevel: input.riskLevel ?? null,
      approverRule: input.approverRule,
      timeoutMinutes: input.timeoutMinutes ?? 1440
    }) as Promise<ApprovalPolicyRow>;
  }

  async getByPolicyId(policyId: string): Promise<ApprovalPolicyRow> {
    if (!this.approvalPolicyRepository.isDbEnabled()) {
      throw new Error("APPROVAL_POLICY_REQUIRES_DB");
    }
    const policy = await this.approvalPolicyRepository.getByPolicyId(policyId);
    if (!policy) throw new NotFoundException("POLICY_NOT_FOUND");
    return policy;
  }

  async update(
    policyId: string,
    input: UpdateApprovalPolicyDto
  ): Promise<void> {
    if (!this.approvalPolicyRepository.isDbEnabled()) {
      throw new Error("APPROVAL_POLICY_REQUIRES_DB");
    }
    const policy = await this.approvalPolicyRepository.getByPolicyId(policyId);
    if (!policy) throw new NotFoundException("POLICY_NOT_FOUND");
    await this.approvalPolicyRepository.update(policyId, {
      approverRule: input.approverRule,
      timeoutMinutes: input.timeoutMinutes
    });
  }

  async delete(policyId: string): Promise<void> {
    if (!this.approvalPolicyRepository.isDbEnabled()) {
      throw new Error("APPROVAL_POLICY_REQUIRES_DB");
    }
    const policy = await this.approvalPolicyRepository.getByPolicyId(policyId);
    if (!policy) throw new NotFoundException("POLICY_NOT_FOUND");
    await this.approvalPolicyRepository.delete(policyId);
  }

  async list(workspaceId?: string): Promise<ApprovalPolicyRow[]> {
    if (!this.approvalPolicyRepository.isDbEnabled()) {
      return [];
    }
    return this.approvalPolicyRepository.list(workspaceId);
  }

  async exportBundle(workspaceId: string): Promise<
    { triggerEvent: string; riskLevel: string | null; approverRule: string; timeoutMinutes: number }[]
  > {
    if (!this.approvalPolicyRepository.isDbEnabled()) {
      return [];
    }
    const rows = await this.approvalPolicyRepository.list(workspaceId);
    return rows.map((r) => ({
      triggerEvent: r.triggerEvent,
      riskLevel: r.riskLevel,
      approverRule: r.approverRule,
      timeoutMinutes: r.timeoutMinutes ?? 1440
    }));
  }

  async importBundle(
    workspaceId: string,
    policies: { triggerEvent: string; riskLevel?: string; approverRule: string; timeoutMinutes?: number }[]
  ): Promise<ApprovalPolicyRow[]> {
    if (!this.approvalPolicyRepository.isDbEnabled()) {
      throw new Error("APPROVAL_POLICY_REQUIRES_DB");
    }
    const created: ApprovalPolicyRow[] = [];
    for (const p of policies) {
      const row = await this.approvalPolicyRepository.create({
        policyId: `pol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        workspaceId,
        triggerEvent: p.triggerEvent,
        riskLevel: p.riskLevel ?? null,
        approverRule: p.approverRule,
        timeoutMinutes: p.timeoutMinutes ?? 1440
      });
      created.push(row as ApprovalPolicyRow);
    }
    return created;
  }
}
