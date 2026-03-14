ALTER TABLE audit_events
  ADD COLUMN IF NOT EXISTS runtime_meta_json JSONB;
