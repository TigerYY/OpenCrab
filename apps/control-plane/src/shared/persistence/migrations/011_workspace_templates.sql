-- Phase 3 E2: workspace templates for "create workspace from template"
CREATE TABLE IF NOT EXISTS workspace_templates (
  template_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_workspace_id TEXT NOT NULL,
  options_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_templates_source ON workspace_templates(source_workspace_id);
