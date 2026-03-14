INSERT INTO workspaces (id, name, created_at)
VALUES ('ws_default', 'Default Workspace', NOW())
ON CONFLICT (id) DO NOTHING;
