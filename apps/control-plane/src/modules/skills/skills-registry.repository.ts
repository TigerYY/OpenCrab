import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

export interface SkillRegistryPackageRow {
  packageId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRegistryVersionRow {
  id: number;
  packageId: string;
  version: string;
  sourceRef: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SkillsRegistryRepository {
  constructor(private readonly postgres: PostgresService) {}

  isDbEnabled() {
    return this.postgres.isConnected();
  }

  async listPackages(hasPublished?: boolean): Promise<
    (SkillRegistryPackageRow & { latestVersion?: string; latestStatus?: string })[]
  > {
    if (!this.isDbEnabled()) return [];
    const result = await this.postgres.query<{
      package_id: string;
      name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
      latest_version: string | null;
      latest_status: string | null;
    }>(
      `SELECT p.package_id, p.name, p.description, p.created_at, p.updated_at,
              (SELECT v.version FROM skill_registry_versions v WHERE v.package_id = p.package_id ORDER BY v.created_at DESC LIMIT 1) AS latest_version,
              (SELECT v.status FROM skill_registry_versions v WHERE v.package_id = p.package_id ORDER BY v.created_at DESC LIMIT 1) AS latest_status
       FROM skill_registry_packages p
       ${
         hasPublished === true
           ? "WHERE EXISTS (SELECT 1 FROM skill_registry_versions v2 WHERE v2.package_id = p.package_id AND v2.status = 'published')"
           : hasPublished === false
             ? "WHERE NOT EXISTS (SELECT 1 FROM skill_registry_versions v2 WHERE v2.package_id = p.package_id AND v2.status = 'published')"
             : ""
       }
       ORDER BY p.updated_at DESC LIMIT 200`
    );
    return result.rows.map((r) => ({
      packageId: r.package_id,
      name: r.name,
      description: r.description,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      latestVersion: r.latest_version ?? undefined,
      latestStatus: r.latest_status ?? undefined
    }));
  }

  async listVersions(packageId: string): Promise<SkillRegistryVersionRow[]> {
    if (!this.isDbEnabled()) return [];
    const result = await this.postgres.query<{
      id: number;
      package_id: string;
      version: string;
      source_ref: string | null;
      status: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, package_id, version, source_ref, status, created_at, updated_at
       FROM skill_registry_versions WHERE package_id = $1 ORDER BY created_at DESC`,
      [packageId]
    );
    return result.rows.map((r) => ({
      id: r.id,
      packageId: r.package_id,
      version: r.version,
      sourceRef: r.source_ref,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  async getVersion(
    packageId: string,
    version: string
  ): Promise<SkillRegistryVersionRow | null> {
    if (!this.isDbEnabled()) return null;
    const result = await this.postgres.query<{
      id: number;
      package_id: string;
      version: string;
      source_ref: string | null;
      status: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, package_id, version, source_ref, status, created_at, updated_at
       FROM skill_registry_versions WHERE package_id = $1 AND version = $2 LIMIT 1`,
      [packageId, version]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    const r = result.rows[0];
    return {
      id: r.id,
      packageId: r.package_id,
      version: r.version,
      sourceRef: r.source_ref,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  async getPackage(packageId: string): Promise<SkillRegistryPackageRow | null> {
    if (!this.isDbEnabled()) return null;
    const result = await this.postgres.query<{
      package_id: string;
      name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT package_id, name, description, created_at, updated_at
       FROM skill_registry_packages WHERE package_id = $1 LIMIT 1`,
      [packageId]
    );
    if (!result.rowCount || result.rowCount < 1) return null;
    const r = result.rows[0];
    return {
      packageId: r.package_id,
      name: r.name,
      description: r.description,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
}
