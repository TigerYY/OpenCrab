#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
START_PORT="${CONTROL_PLANE_PORT:-3000}"
PORT_TO_USE="${START_PORT}"

while lsof -iTCP:"${PORT_TO_USE}" -sTCP:LISTEN -n -P >/dev/null 2>&1; do
  PORT_TO_USE=$((PORT_TO_USE + 1))
done

echo "[control-plane] requested port: ${START_PORT}"
echo "[control-plane] selected port: ${PORT_TO_USE}"
echo "[control-plane] url: http://localhost:${PORT_TO_USE}/api"

cd "${ROOT_DIR}"
PORT="${PORT_TO_USE}" npm run start:dev -w @opencarb/control-plane
