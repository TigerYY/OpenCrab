-- Phase 2: Skill governance tables
CREATE TABLE IF NOT EXISTS skill_packages (
  skill_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  version TEXT NOT NULL,
  risk_level TEXT,
  status TEXT NOT NULL DEFAULT 'imported',
  workspace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_review_records (
  id BIGSERIAL PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skill_packages(skill_id),
  reviewer TEXT NOT NULL,
  decision TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_release_plans (
  id BIGSERIAL PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skill_packages(skill_id),
  workspace_scope TEXT NOT NULL,
  rollout_percent INTEGER NOT NULL DEFAULT 100,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_packages_status ON skill_packages(status);
CREATE INDEX IF NOT EXISTS idx_skill_packages_workspace ON skill_packages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_skill_release_plans_skill ON skill_release_plans(skill_id);
