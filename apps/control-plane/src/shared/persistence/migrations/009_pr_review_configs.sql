-- Phase 2: PR Review config (repo, branch, ruleset, template, writeback)
CREATE TABLE IF NOT EXISTS pr_review_configs (
  config_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  repo TEXT NOT NULL,
  branch TEXT,
  ruleset_id TEXT,
  template_id TEXT,
  writeback_policy TEXT NOT NULL DEFAULT 'comment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_review_configs_workspace ON pr_review_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pr_review_configs_repo ON pr_review_configs(repo);
