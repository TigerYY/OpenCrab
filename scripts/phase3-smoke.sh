#!/usr/bin/env bash
# Phase 3 smoke: workspace-templates, from-template, approval-policies export/import
set -euo pipefail

BASE="${CONTROL_PLANE_URL:-http://localhost:3000}"
H=(-H "Content-Type: application/json" -H "X-Trace-Id: phase3" -H "X-Workspace-Id: ws_default" -H "X-Channel-Type: web")

echo "[phase3-smoke] BASE=$BASE"

curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/health" | grep -q 200 || { echo "health fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/workspace-templates" | grep -q 200 || { echo "workspace-templates list fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/approval-policies/export?workspaceId=ws_default" | grep -q 200 || { echo "approval-policies/export fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" -X POST "${H[@]}" -d '{"workspaceId":"ws_default","policies":[]}' "$BASE/api/approval-policies/import" | grep -q 201 || { echo "approval-policies/import fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/skills/registry/packages" | grep -q 200 || { echo "skills/registry/packages fail"; exit 1; }

echo "[phase3-smoke] PASS"
