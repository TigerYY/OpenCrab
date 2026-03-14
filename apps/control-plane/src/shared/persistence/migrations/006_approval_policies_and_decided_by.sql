-- Phase 2: Approval policies and ticket extensions (decidedBy, decidedAt, riskLevel, timeout)
CREATE TABLE IF NOT EXISTS approval_policies (
  policy_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  risk_level TEXT,
  approver_rule TEXT NOT NULL,
  timeout_minutes INTEGER NOT NULL DEFAULT 1440,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE approval_tickets
  ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE approval_tickets
  ADD COLUMN IF NOT EXISTS approvers_json JSONB;
ALTER TABLE approval_tickets
  ADD COLUMN IF NOT EXISTS decided_by TEXT;
ALTER TABLE approval_tickets
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;
ALTER TABLE approval_tickets
  ADD COLUMN IF NOT EXISTS timeout_minutes INTEGER;
