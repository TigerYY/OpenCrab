# OpenCrab 标准部署模板（Phase 3 E1）

## 1. 目的

提供一键或脚本化部署控制面 + 管理台 + 依赖，明确健康检查与就绪顺序，便于本地与测试环境复现。

## 2. 前置条件

- Docker 与 Docker Compose 已安装
- 如需持久化：宿主机 5432、6379、3000、8080 端口未被占用（端口可在 `docker-compose.yml` 中修改）

## 3. 启动顺序与依赖

```
postgres (healthy) ──┬──> control-plane (healthy) ──> web-console
redis (healthy) ─────┘
```

- **postgres**：数据库，健康检查为 `pg_isready`。
- **redis**：队列/缓存，健康检查为 `redis-cli ping`。
- **control-plane**：在 postgres 与 redis 均健康后启动，暴露 `GET /api/health`，通过 curl 做健康检查。
- **web-console**：在 control-plane 健康后启动，静态资源由 nginx 提供。

## 4. 使用方式

### 4.1 一键开发环境（推荐本地开发）

在仓库根目录执行一条命令，依次启动 Postgres/Redis（Docker）、Control Plane、Web Console；按 **Ctrl+C** 可同时停止后端与前端。

```bash
npm run dev:all
```

- 若未安装 Docker 或希望跳过数据库：`SKIP_DOCKER=1 npm run dev:all`（仅启动 control-plane 与 web-console，部分 API 可能不可用）。
- 自定义端口：`CONTROL_PLANE_PORT=3001 WEB_CONSOLE_PORT=5174 npm run dev:all`

### 4.2 仅启动基础依赖（与现有开发流程一致）

```bash
docker compose up -d postgres redis
# 然后本地执行：npm run dev:control-plane 与 npm run dev:web-console（或 npm run dev:all 且 SKIP_DOCKER=1）
```

### 4.3 全栈编排（控制面 + 管理台容器化）

```bash
# 在仓库根目录
docker compose up -d --build

# 查看服务状态（确保均为 healthy / running）
docker compose ps
```

- 管理台：http://localhost:8080  
- 控制面 API：http://localhost:3000/api  
- 控制面健康：http://localhost:3000/api/health  

### 4.4 验证

```bash
curl -s http://localhost:3000/api/health
# 应返回 {"code":"OK","data":{"service":"opencrab-control-plane",...}}

# 可选：执行 Phase 2 冒烟（需 control-plane 已就绪）
CONTROL_PLANE_URL=http://localhost:3000 npm run smoke:phase2
```

## 5. 环境变量

| 服务 | 变量 | 说明 |
|------|------|------|
| control-plane | `DATABASE_URL` | PostgreSQL 连接串，compose 默认 `postgresql://opencrab:opencrab@postgres:5432/opencrab` |
| control-plane | `REDIS_URL` | Redis 连接串，compose 默认 `redis://redis:6379` |
| web-console（构建时） | `VITE_API_BASE_URL` | 前端请求 API 的基地址，compose 默认 `http://localhost:3000/api`（浏览器可访问） |

生产或反向代理场景：构建 web-console 时传入 `VITE_API_BASE_URL` 为实际 API 公网或内网地址。

## 6. 健康检查与就绪

- **postgres**：`pg_isready`，间隔 5s，启动宽限 10s。  
- **redis**：`redis-cli ping`，间隔 5s。  
- **control-plane**：`curl -sf http://localhost:3000/api/health`，间隔 10s，启动宽限 15s。  
- **web-console**：无健康检查（静态服务，依赖 control-plane 就绪后启动即可）。

## 7. 常见问题

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| control-plane 反复重启 | 数据库未就绪或 migration 未执行 | 先 `docker compose up -d postgres`，等待 healthy 后再 up control-plane；migration 由控制面启动时自动执行（见 README）。 |
| 前端请求 API 跨域或 404 | 浏览器访问的 API 地址与后端不一致 | 构建 web-console 时设置 `VITE_API_BASE_URL` 为浏览器可访问的 control-plane 地址。 |
| 端口冲突 | 宿主机已占用 3000/8080/5432/6379 | 在 `docker-compose.yml` 中修改各服务 `ports` 映射。 |
| control-plane 启动日志出现 `LegacyRouteConverter Unsupported route path: "/api/*"` | Nest 与 path-to-regexp 新版本对旧式通配符的兼容处理，多为框架内部路由 | 不影响功能，可忽略；若需消除需查 Nest 版本与 path-to-regexp 迁移说明。 |

## 8. 从旧拼写 opencarb 迁移到 opencrab

项目曾将产品名误写为 opencarb，现已统一为 **OpenCrab**（opencrab）。若你此前使用过旧版编排，需做一次切换。

### 8.1 停止并移除旧容器与卷（无数据保留时）

```bash
# 停止并删除旧 opencarb-* 容器
docker compose down

# 若 docker-compose 已改为 opencrab-*，可先按旧名查找并删除
docker ps -a --filter "name=opencarb" -q | xargs -r docker rm -f
docker volume ls -q | grep opencarb | xargs -r docker volume rm
```

然后使用当前仓库的 `docker-compose.yml` 重新启动，将自动创建 **opencrab** 数据库与 **opencrab-** 前缀容器：

```bash
docker compose up -d --build
```

### 8.2 需要保留数据时（PostgreSQL 迁移）

若旧库 `opencarb` 中已有需要保留的数据：

```bash
# 1) 用旧 compose 或旧容器名启动旧库（若已停掉），导出数据
docker exec opencarb-postgres pg_dump -U opencarb -d opencarb -Fc -f /tmp/opencarb.dump
docker cp opencarb-postgres:/tmp/opencarb.dump ./opencarb.dump

# 2) 停止旧容器，改用新 compose 启动新栈（会创建 opencrab 库）
docker compose down
docker compose up -d postgres redis
# 等待 postgres healthy 后执行

# 3) 将 dump 导入到新库 opencrab（新容器名为 opencrab-postgres）
docker cp ./opencarb.dump opencrab-postgres:/tmp/
docker exec opencrab-postgres pg_restore -U opencrab -d opencrab --no-owner --no-acl -Fc /tmp/opencarb.dump
# 若报「数据库已存在」等错误，可先 drop 再 create 库，或参考 pg_restore -C 用法

# 4) 再启动 control-plane 与 web-console
docker compose up -d control-plane web-console
```

Redis 若仅作缓存/队列且无持久化要求，可直接使用新栈的 redis，无需迁移。

### 8.3 本地开发（npm run dev:all）

若使用 `npm run dev:all` 且依赖本地 Docker 的 postgres/redis，请确保：

- 宿主机使用的 `DATABASE_URL` 指向 **opencrab** 库（默认已为 `postgresql://opencrab:opencrab@localhost:5432/opencrab`）。
- 若本地曾为 opencarb 建库，可删除旧库后让新栈自动建 opencrab，或按 8.2 做一次 pg_dump/pg_restore 到 opencrab。

完成上述任一路径后，重新部署即统一使用 **opencrab-\*** 容器与 **opencrab** 数据库。

## 9. 与 Phase 1/2 的差异

- Phase 1/2 本地开发：`docker compose up -d` 仅启动 postgres + redis，控制面与管理台由 `npm run dev:*` 在宿主机运行。  
- 本模板：compose 内同时包含 control-plane 与 web-console 镜像，适合“一键全栈”体验与 CI/测试环境。
