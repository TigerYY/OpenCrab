-- Phase 2: Persist dead letters for admin actions (retry/replay/ignore/terminate)
CREATE TABLE IF NOT EXISTS dead_letters (
  task_key TEXT PRIMARY KEY,
  queue TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  attempts INTEGER NOT NULL,
  error TEXT NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution TEXT
);

CREATE INDEX IF NOT EXISTS idx_dead_letters_queue ON dead_letters(queue);
CREATE INDEX IF NOT EXISTS idx_dead_letters_resolved ON dead_letters(resolved_at);
