import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import type { SkillRegistryPackageRow, SkillRegistryVersionRow } from "./skills-registry.repository";
import { SkillsRegistryRepository } from "./skills-registry.repository";

@Injectable()
export class SkillsRegistryService {
  constructor(private readonly repository: SkillsRegistryRepository) {}

  async listPackages(hasPublished?: boolean): Promise<
    (SkillRegistryPackageRow & { latestVersion?: string; latestStatus?: string })[]
  > {
    return this.repository.listPackages(hasPublished);
  }

  async listVersions(packageId: string): Promise<SkillRegistryVersionRow[]> {
    const pkg = await this.repository.getPackage(packageId);
    if (!pkg) throw new NotFoundException("REGISTRY_PACKAGE_NOT_FOUND");
    return this.repository.listVersions(packageId);
  }

  async resolvePackageVersion(
    packageId: string,
    version: string
  ): Promise<SkillRegistryVersionRow> {
    const v = await this.repository.getVersion(packageId, version);
    if (!v) throw new NotFoundException("REGISTRY_VERSION_NOT_FOUND");
    if (v.status !== "published") {
      throw new BadRequestException("REGISTRY_VERSION_NOT_PUBLISHED");
    }
    return v;
  }
}
