-- Phase 3 E3: Skill registry (organization-level catalog)
CREATE TABLE IF NOT EXISTS skill_registry_packages (
  package_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_registry_versions (
  id BIGSERIAL PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES skill_registry_packages(package_id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  source_ref TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(package_id, version)
);

CREATE INDEX IF NOT EXISTS idx_skill_registry_versions_package ON skill_registry_versions(package_id);
CREATE INDEX IF NOT EXISTS idx_skill_registry_versions_status ON skill_registry_versions(status);

ALTER TABLE skill_packages ADD COLUMN IF NOT EXISTS registry_ref TEXT;

-- Seed one package and one published version for E2E/smoke
INSERT INTO skill_registry_packages (package_id, name, description, created_at, updated_at)
VALUES ('e2e-registry-pkg', 'E2E Registry Package', 'Sample package for tests', NOW(), NOW())
ON CONFLICT (package_id) DO NOTHING;

INSERT INTO skill_registry_versions (package_id, version, source_ref, status, created_at, updated_at)
VALUES ('e2e-registry-pkg', '1.0.0', 'https://example.com/skill-e2e', 'published', NOW(), NOW())
ON CONFLICT (package_id, version) DO NOTHING;
