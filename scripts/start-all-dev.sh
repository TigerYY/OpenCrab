#!/usr/bin/env bash
# 一键启动开发环境：postgres + redis -> control-plane -> web-console
# 使用：./scripts/start-all-dev.sh  或  npm run dev:all
# 可选：SKIP_DOCKER=1 跳过 Docker，仅启动 control-plane 与 web-console
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT_DIR}"

# 默认先起 Docker 中的 postgres/redis
SKIP_DOCKER="${SKIP_DOCKER:-0}"
CONTROL_PLANE_PORT="${CONTROL_PLANE_PORT:-3000}"
WEB_CONSOLE_PORT="${WEB_CONSOLE_PORT:-5173}"
WAIT_HEALTH_TIMEOUT="${WAIT_HEALTH_TIMEOUT:-90}"

echo "[start-all-dev] OpenCrab 开发环境一键启动"
echo "[start-all-dev] 工作目录: ${ROOT_DIR}"
echo ""

# ---------- 1. 启动 Postgres 与 Redis ----------
if [ "${SKIP_DOCKER}" != "1" ]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "[start-all-dev] 未检测到 docker，跳过 Postgres/Redis（将仅启动 control-plane 与 web-console）"
  else
    echo "[start-all-dev] 启动 Postgres 与 Redis (docker compose)..."
    docker compose up -d postgres redis 2>/dev/null || true
    echo "[start-all-dev] 等待 Postgres 与 Redis 就绪（最多 ${WAIT_HEALTH_TIMEOUT}s）..."
    waited=0
    while [ "${waited}" -lt "${WAIT_HEALTH_TIMEOUT}" ]; do
      pg_ok=""
      redis_ok=""
      pg_ok=$(docker inspect --format '{{.State.Health.Status}}' opencarb-postgres 2>/dev/null) || true
      redis_ok=$(docker inspect --format '{{.State.Health.Status}}' opencarb-redis 2>/dev/null) || true
      if [ "${pg_ok}" = "healthy" ] && [ "${redis_ok}" = "healthy" ]; then
        echo "[start-all-dev] Postgres 与 Redis 已就绪"
        break
      fi
      sleep 3
      waited=$((waited + 3))
    done
    if [ "${pg_ok:-}" != "healthy" ] || [ "${redis_ok:-}" != "healthy" ]; then
      echo "[start-all-dev] 警告: Postgres/Redis 未在时限内变为 healthy，继续启动应用（部分 API 可能不可用）"
    fi
    echo ""
  fi
else
  echo "[start-all-dev] SKIP_DOCKER=1，跳过 Postgres/Redis"
  echo ""
fi

# 开发环境使用本地 DB/Redis（与 docker-compose 暴露的端口一致）
export DATABASE_URL="${DATABASE_URL:-postgresql://opencarb:opencarb@localhost:5432/opencarb}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# ---------- 2. 启动 Control Plane ----------
echo "[start-all-dev] 启动 Control Plane (port ${CONTROL_PLANE_PORT})..."
(
  export PORT="${CONTROL_PLANE_PORT}"
  npm run dev:control-plane 2>&1
) &
CP_PID=$!
echo "[start-all-dev] Control Plane PID: ${CP_PID}"

echo "[start-all-dev] 等待 Control Plane 健康检查（最多 45s）..."
waited=0
while [ "${waited}" -lt 45 ]; do
  if code=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://127.0.0.1:${CONTROL_PLANE_PORT}/api/health" 2>/dev/null); then
    if [ "${code}" = "200" ]; then
      echo "[start-all-dev] Control Plane 已就绪 (http://localhost:${CONTROL_PLANE_PORT}/api)"
      break
    fi
  fi
  if ! kill -0 "${CP_PID}" 2>/dev/null; then
    echo "[start-all-dev] Control Plane 进程已退出，启动失败"
    exit 1
  fi
  sleep 2
  waited=$((waited + 2))
done
if [ "${waited}" -ge 45 ]; then
  echo "[start-all-dev] 警告: Control Plane 未在 45s 内返回 200，请检查日志"
fi
echo ""

# ---------- 3. 启动 Web Console ----------
echo "[start-all-dev] 启动 Web Console (port ${WEB_CONSOLE_PORT})..."
(
  export CONTROL_PLANE_PORT="${CONTROL_PLANE_PORT}"
  export WEB_CONSOLE_PORT="${WEB_CONSOLE_PORT}"
  npm run dev:web-console 2>&1
) &
WC_PID=$!
echo "[start-all-dev] Web Console PID: ${WC_PID}"

# 等待前端编译并监听
echo "[start-all-dev] 等待 Web Console 就绪（约 5s）..."
sleep 5
if curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://127.0.0.1:${WEB_CONSOLE_PORT}" 2>/dev/null | grep -q 200; then
  echo "[start-all-dev] Web Console 已就绪"
else
  echo "[start-all-dev] Web Console 可能仍在编译，请稍候访问"
fi
echo ""

# ---------- 4. 输出摘要与停止说明 ----------
echo "=============================================="
echo "  开发环境已启动"
echo "=============================================="
echo "  Control Plane:  http://localhost:${CONTROL_PLANE_PORT}/api"
echo "  Web Console:    http://localhost:${WEB_CONSOLE_PORT}"
echo "=============================================="
echo "  停止方式：按 Ctrl+C 将同时停止 Control Plane 与 Web Console"
echo "  或手动: kill ${CP_PID} ${WC_PID}"
echo "=============================================="

cleanup() {
  echo ""
  echo "[start-all-dev] 正在停止 Control Plane 与 Web Console..."
  kill ${CP_PID} ${WC_PID} 2>/dev/null || true
  wait ${CP_PID} ${WC_PID} 2>/dev/null || true
  echo "[start-all-dev] 已退出"
  exit 0
}
trap cleanup INT TERM

# 保持脚本运行直至 Ctrl+C 或两进程退出
wait ${CP_PID} ${WC_PID} 2>/dev/null || true
