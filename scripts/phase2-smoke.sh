#!/usr/bin/env bash
# Phase 2 smoke: hit new APIs (approval-policies, skills, metrics, jobs dead-letter actions, pr-review configs)
set -euo pipefail

BASE="${CONTROL_PLANE_URL:-http://localhost:3000}"
H=(-H "X-Trace-Id: phase2" -H "X-Workspace-Id: ws_default" -H "X-Channel-Type: web")

echo "[phase2-smoke] BASE=$BASE"

curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/health" | grep -q 200 || { echo "health fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/approval-policies" | grep -q 200 || { echo "approval-policies list fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/approvals/timeout" | grep -q 200 || { echo "approvals/timeout fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/skills/packages" | grep -q 200 || { echo "skills/packages fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/skills/approved-view?workspaceId=ws_default" | grep -q 200 || { echo "skills/approved-view fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/metrics/adoption?workspaceId=ws_default" | grep -q 200 || { echo "metrics/adoption fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/metrics/quality?workspaceId=ws_default" | grep -q 200 || { echo "metrics/quality fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/metrics/governance?workspaceId=ws_default" | grep -q 200 || { echo "metrics/governance fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/metrics/platform?workspaceId=ws_default" | grep -q 200 || { echo "metrics/platform fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/jobs/dead-letters" | grep -q 200 || { echo "jobs/dead-letters fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/integrations/pr-review/configs" | grep -q 200 || { echo "pr-review/configs fail"; exit 1; }
curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$BASE/api/integrations/pr-review/results?workspaceId=ws_default" | grep -q 200 || { echo "pr-review/results fail"; exit 1; }

echo "[phase2-smoke] PASS"
