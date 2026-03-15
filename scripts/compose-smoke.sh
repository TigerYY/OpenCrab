#!/usr/bin/env bash
# 在 docker compose 全栈启动后执行，校验 control-plane 与 web-console 可访问
set -euo pipefail

BASE="${CONTROL_PLANE_URL:-http://localhost:3000}"
echo "[compose-smoke] CONTROL_PLANE_URL=$BASE"

curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/health" | grep -q 200 || { echo "control-plane health fail"; exit 1; }
echo "[compose-smoke] control-plane OK"

# 若 web-console 在 8080，可选校验（需 curl 可访问宿主机）
WEB="${WEB_CONSOLE_URL:-http://localhost:8080}"
code=$(curl -sS -o /dev/null -w "%{http_code}" "$WEB" 2>/dev/null || true)
if [ "$code" = "200" ]; then
  echo "[compose-smoke] web-console OK"
else
  echo "[compose-smoke] web-console skip (code=$code)"
fi

echo "[compose-smoke] PASS"
