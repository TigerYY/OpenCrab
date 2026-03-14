#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
COMMON_HEADERS=(
  -H "Content-Type: application/json"
  -H "X-Trace-Id: trc_smoke_001"
  -H "X-Workspace-Id: ws_default"
  -H "X-Channel-Type: web"
)

echo "[1/14] health"
curl -sS "${BASE_URL}/api/health" | sed 's/.*/&/'

echo "[2/14] create workspace"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/workspaces" \
  -d '{"name":"Smoke Workspace"}'

echo "[3/14] create session context"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/session/context" \
  -d '{"userId":"u_smoke","workspaceId":"ws_default","channelType":"web","resourceContext":{"repo":"repo-a"}}'

echo "[4/14] model decide"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/model-router/decide" \
  -d '{"workspaceId":"ws_default","taskType":"qa","sensitivity":"internal","fallbackAllowed":true}'

echo "[5/14] model invoke"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/model-router/invoke" \
  -d '{"workspaceId":"ws_default","taskType":"qa","prompt":"hello","sensitivity":"internal"}'

echo "[6/14] create knowledge index job"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/knowledge/index-jobs" \
  -d '{"workspaceId":"ws_default","mode":"initial","sources":[{"type":"git","ref":"repo-a"}]}'

echo "[7/14] knowledge retrieve"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/knowledge/retrieve" \
  -d '{"workspaceId":"ws_default","query":"how to send sms","topK":3}'

echo "[8/14] create audit event"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/audit/events" \
  -d '{"eventType":"model.invoke","workspaceId":"ws_default","userId":"u_smoke","traceId":"trc_smoke_001"}'

echo "[9/14] create approval ticket"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/approvals" \
  -d '{"approvalType":"restricted_outbound","workspaceId":"ws_default","reason":"smoke"}'

echo "[10/14] pr review webhook"
curl -sS "${COMMON_HEADERS[@]}" -X POST \
  "${BASE_URL}/api/integrations/pr-review/webhook" \
  -d '{"workspaceId":"ws_default","repo":"repo-a","prNumber":12,"diffRef":"abc..def"}'

echo "[11/14] list jobs"
curl -sS "${COMMON_HEADERS[@]}" -X GET \
  "${BASE_URL}/api/knowledge/index-jobs?workspaceId=ws_default&limit=5&offset=0"
echo
curl -sS "${COMMON_HEADERS[@]}" -X GET \
  "${BASE_URL}/api/integrations/pr-review/jobs?workspaceId=ws_default&limit=5&offset=0"

echo "[12/14] list dead letters"
curl -sS "${COMMON_HEADERS[@]}" -X GET \
  "${BASE_URL}/api/jobs/dead-letters?limit=10&offset=0"

echo "[13/14] list runtime fallback stats"
curl -sS "${COMMON_HEADERS[@]}" -X GET \
  "${BASE_URL}/api/audit/runtime-fallback-stats?workspaceId=ws_default&days=7&topN=5"

echo "[14/14] list runtime fallback trend"
curl -sS "${COMMON_HEADERS[@]}" -X GET \
  "${BASE_URL}/api/audit/runtime-fallback-trend?workspaceId=ws_default&days=7"

echo "Phase 1 smoke checks finished."
