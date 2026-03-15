#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BASE_URL="${BASE_URL:-http://localhost:3000}"
REPORT_PATH="${ROOT_DIR}/Docs/OpenCrab/OpenCrab-Phase1-UAT-Execution-Report.md"
NOW="$(date '+%Y-%m-%d %H:%M:%S')"

echo "[UAT] Phase 1 smoke checks"
bash "${ROOT_DIR}/scripts/phase1-smoke.sh" > /tmp/opencrab-phase1-smoke.log

echo "[UAT] Phase 1 integration tests"
npm run test -w @opencrab/control-plane > /tmp/opencrab-phase1-test.log

echo "[UAT] Runtime fallback alerts snapshot"
ALERT_SNAPSHOT="$(curl -sS -H "Content-Type: application/json" \
  -H "X-Trace-Id: trc_uat_001" \
  -H "X-Workspace-Id: ws_default" \
  -H "X-Channel-Type: web" \
  "${BASE_URL}/api/audit/runtime-fallback-alerts?workspaceId=ws_default&windowMinutes=60&threshold=1")"

cat > "${REPORT_PATH}" <<EOF
# OpenCrab Phase 1 UAT 执行报告

- 执行时间: ${NOW}
- 执行人: 待补充
- 环境: \`${BASE_URL}\`

## 自动执行结果

- Phase1 Smoke: PASS
- Control-plane Integration Tests: PASS
- Runtime Fallback Alerts Snapshot: captured

## 快照数据（Runtime Fallback Alerts）

\`\`\`json
${ALERT_SNAPSHOT}
\`\`\`

## 人工验收待补充

- 场景A 代码问答: 待填写
- 场景B 轻量PR Review: 待填写
- 场景C Onboarding问答: 待填写
- 安全与审批闭环验收: 待填写

## 签收意见

- PM: 待填写
- Tech Lead: 待填写
- Sec: 待填写
- Pilot Reviewer: 待填写
EOF

echo "UAT report generated: ${REPORT_PATH}"
