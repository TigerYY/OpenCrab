import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import type {
  ApprovedSkillViewRow,
  SkillPackageRow,
  SkillStatus
} from "./skills.repository";
import { SkillsRepository } from "./skills.repository";
import { SkillsRegistryService } from "./skills-registry.service";
import { CanarySkillDto } from "./dto/canary-skill.dto";
import { CreateSkillPackageDto } from "./dto/create-skill-package.dto";
import { ReviewSkillDto } from "./dto/review-skill.dto";

@Injectable()
export class SkillsService {
  constructor(
    private readonly repository: SkillsRepository,
    private readonly registryService: SkillsRegistryService
  ) {}

  async create(
    input: CreateSkillPackageDto
  ): Promise<SkillPackageRow> {
    if (!this.repository.isDbEnabled()) {
      throw new Error("SKILLS_REQUIRE_DB");
    }
    if (input.sourceType === "registry") {
      if (!input.sourceRef?.includes("@")) {
        throw new BadRequestException("REGISTRY_SOURCE_REF_INVALID");
      }
      const [packageId, version] = input.sourceRef.split("@");
      if (!packageId || !version) {
        throw new BadRequestException("REGISTRY_SOURCE_REF_INVALID");
      }
      if (!input.workspaceId) {
        throw new BadRequestException("REGISTRY_REQUIRES_WORKSPACE_ID");
      }
      const regVersion = await this.registryService.resolvePackageVersion(
        packageId,
        version
      );
      const shortId = Math.random().toString(36).slice(2, 8);
      const skillId = `reg_${packageId}_${regVersion.version}_${shortId}`;
      return this.repository.create({
        skillId,
        sourceType: "registry",
        version: regVersion.version,
        riskLevel: input.riskLevel ?? null,
        status: "imported",
        workspaceId: input.workspaceId,
        registryRef: input.sourceRef
      }) as Promise<SkillPackageRow>;
    }
    const version = input.version ?? "1.0.0";
    const skillId = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return this.repository.create({
      skillId,
      sourceType: input.sourceType,
      version,
      riskLevel: input.riskLevel ?? null,
      status: "imported",
      workspaceId: input.workspaceId ?? null,
      registryRef: null
    }) as Promise<SkillPackageRow>;
  }

  async getById(skillId: string): Promise<SkillPackageRow> {
    if (!this.repository.isDbEnabled()) {
      throw new Error("SKILLS_REQUIRE_DB");
    }
    const row = await this.repository.getById(skillId);
    if (!row) throw new NotFoundException("SKILL_NOT_FOUND");
    return row;
  }

  async list(filters?: {
    sourceType?: string;
    status?: string;
    workspaceId?: string;
  }): Promise<SkillPackageRow[]> {
    if (!this.repository.isDbEnabled()) return [];
    return this.repository.list(filters);
  }

  async review(skillId: string, input: ReviewSkillDto): Promise<SkillPackageRow> {
    if (!this.repository.isDbEnabled()) {
      throw new Error("SKILLS_REQUIRE_DB");
    }
    const pkg = await this.repository.getById(skillId);
    if (!pkg) throw new NotFoundException("SKILL_NOT_FOUND");
    if (pkg.status !== "imported") {
      throw new Error("SKILL_NOT_IMPORTED");
    }
    await this.repository.addReviewRecord(
      skillId,
      input.reviewer,
      input.decision,
      input.comment
    );
    const newStatus: SkillStatus =
      input.decision === "approved" ? "reviewed" : "rejected";
    await this.repository.updateStatus(skillId, newStatus);
    const updated = await this.repository.getById(skillId);
    return updated!;
  }

  async approve(skillId: string): Promise<SkillPackageRow> {
    if (!this.repository.isDbEnabled()) {
      throw new Error("SKILLS_REQUIRE_DB");
    }
    const pkg = await this.repository.getById(skillId);
    if (!pkg) throw new NotFoundException("SKILL_NOT_FOUND");
    if (pkg.status !== "reviewed") {
      throw new Error("SKILL_MUST_BE_REVIEWED");
    }
    await this.repository.updateStatus(skillId, "approved");
    const updated = await this.repository.getById(skillId);
    return updated!;
  }

  async canary(skillId: string, input: CanarySkillDto): Promise<SkillPackageRow> {
    if (!this.repository.isDbEnabled()) {
      throw new Error("SKILLS_REQUIRE_DB");
    }
    const pkg = await this.repository.getById(skillId);
    if (!pkg) throw new NotFoundException("SKILL_NOT_FOUND");
    if (pkg.status !== "approved") {
      throw new Error("SKILL_MUST_BE_APPROVED");
    }
    await this.repository.addReleasePlan(
      skillId,
      input.workspaceScope,
      input.rolloutPercent ?? 100
    );
    await this.repository.updateStatus(skillId, "canary");
    const updated = await this.repository.getById(skillId);
    return updated!;
  }

  async release(skillId: string): Promise<SkillPackageRow> {
    if (!this.repository.isDbEnabled()) {
      throw new Error("SKILLS_REQUIRE_DB");
    }
    const pkg = await this.repository.getById(skillId);
    if (!pkg) throw new NotFoundException("SKILL_NOT_FOUND");
    if (pkg.status !== "canary" && pkg.status !== "approved") {
      throw new Error("SKILL_MUST_BE_CANARY_OR_APPROVED");
    }
    await this.repository.updateStatus(skillId, "released");
    const updated = await this.repository.getById(skillId);
    return updated!;
  }

  async rollback(skillId: string): Promise<SkillPackageRow> {
    if (!this.repository.isDbEnabled()) {
      throw new Error("SKILLS_REQUIRE_DB");
    }
    const pkg = await this.repository.getById(skillId);
    if (!pkg) throw new NotFoundException("SKILL_NOT_FOUND");
    if (pkg.status !== "released" && pkg.status !== "canary") {
      throw new Error("SKILL_MUST_BE_RELEASED_OR_CANARY");
    }
    await this.repository.updateStatus(skillId, "rolledback");
    const updated = await this.repository.getById(skillId);
    return updated!;
  }

  async getApprovedView(workspaceId: string): Promise<ApprovedSkillViewRow[]> {
    if (!this.repository.isDbEnabled()) return [];
    return this.repository.getApprovedView(workspaceId);
  }
}
