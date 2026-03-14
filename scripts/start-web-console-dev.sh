#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
START_PORT="${WEB_CONSOLE_PORT:-5173}"
PORT_TO_USE="${START_PORT}"

# Probe control-plane on 3000..3010 so frontend can use correct API base
CONTROL_PLANE_PORT=""
for p in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
  if code=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://127.0.0.1:${p}/api/health" 2>/dev/null); then
    if [ "${code}" = "200" ]; then
      CONTROL_PLANE_PORT="${p}"
      break
    fi
  fi
done

if [ -n "${CONTROL_PLANE_PORT}" ]; then
  export VITE_API_BASE_URL="http://localhost:${CONTROL_PLANE_PORT}/api"
  echo "[web-console] control-plane detected at http://localhost:${CONTROL_PLANE_PORT}/api"
else
  echo "[web-console] no control-plane found on 3000..3010; API base will fallback to http://localhost:3000/api"
fi

while lsof -iTCP:"${PORT_TO_USE}" -sTCP:LISTEN -n -P >/dev/null 2>&1; do
  PORT_TO_USE=$((PORT_TO_USE + 1))
done

echo "[web-console] requested port: ${START_PORT}"
echo "[web-console] selected port: ${PORT_TO_USE}"
echo "[web-console] url: http://localhost:${PORT_TO_USE}"

cd "${ROOT_DIR}"
npm run dev -w @opencarb/web-console -- --host 0.0.0.0 --port "${PORT_TO_USE}"
