import { Injectable, NotFoundException } from "@nestjs/common";

import type { PrReviewConfigRow } from "./pr-review-config.repository";
import { PrReviewConfigRepository } from "./pr-review-config.repository";
import { CreatePrReviewConfigDto } from "./dto/create-pr-review-config.dto";
import { UpdatePrReviewConfigDto } from "./dto/update-pr-review-config.dto";

@Injectable()
export class PrReviewConfigService {
  constructor(
    private readonly configRepository: PrReviewConfigRepository
  ) {}

  async create(input: CreatePrReviewConfigDto): Promise<PrReviewConfigRow> {
    if (!this.configRepository.isDbEnabled()) {
      throw new Error("PR_REVIEW_CONFIG_REQUIRES_DB");
    }
    const configId = `prcfg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return this.configRepository.create({
      configId,
      workspaceId: input.workspaceId,
      repo: input.repo,
      branch: input.branch ?? null,
      rulesetId: input.rulesetId ?? null,
      templateId: input.templateId ?? null,
      writebackPolicy: input.writebackPolicy ?? "comment"
    }) as Promise<PrReviewConfigRow>;
  }

  async getById(configId: string): Promise<PrReviewConfigRow> {
    if (!this.configRepository.isDbEnabled()) {
      throw new Error("PR_REVIEW_CONFIG_REQUIRES_DB");
    }
    const row = await this.configRepository.getById(configId);
    if (!row) throw new NotFoundException("PR_REVIEW_CONFIG_NOT_FOUND");
    return row;
  }

  async update(
    configId: string,
    input: UpdatePrReviewConfigDto
  ): Promise<void> {
    if (!this.configRepository.isDbEnabled()) {
      throw new Error("PR_REVIEW_CONFIG_REQUIRES_DB");
    }
    const row = await this.configRepository.getById(configId);
    if (!row) throw new NotFoundException("PR_REVIEW_CONFIG_NOT_FOUND");
    await this.configRepository.update(configId, {
      branch: input.branch,
      rulesetId: input.rulesetId,
      templateId: input.templateId,
      writebackPolicy: input.writebackPolicy
    });
  }

  async delete(configId: string): Promise<void> {
    if (!this.configRepository.isDbEnabled()) {
      throw new Error("PR_REVIEW_CONFIG_REQUIRES_DB");
    }
    const row = await this.configRepository.getById(configId);
    if (!row) throw new NotFoundException("PR_REVIEW_CONFIG_NOT_FOUND");
    await this.configRepository.delete(configId);
  }

  async list(workspaceId?: string): Promise<PrReviewConfigRow[]> {
    if (!this.configRepository.isDbEnabled()) return [];
    return this.configRepository.list(workspaceId);
  }
}
