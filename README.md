# OpenCrab

**AI agents for Enterprise** — 面向企业团队的可治理、可审计、可扩展 AI 助理平台。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 是什么

OpenCrab 基于 **OpenClaw** 的执行能力构建，面向**部门级与工作组级团队**，提供：

- **工作区隔离**：成员、角色、仓库、文档集、模型策略和技能集按工作区管理  
- **模型治理**：内网模型优先，受控外部模型回退，策略路由与审批  
- **知识检索**：Git 仓库、文档库、FAQ 统一索引与权限过滤  
- **技能治理**：兼容 OpenClaw `SKILL.md`，企业侧审批、版本锁定与灰度  
- **安全审计**：Prompt、工具、模型、文件访问与审批结果可追溯  

不把企业能力揉进底层 runtime，而是通过**企业控制面**统一收敛身份、工作区、模型路由、知识、技能与审计策略。

## 核心原则

| OpenClaw | OpenCrab |
|----------|----------|
| 执行 | 裁决 |
| Runtime、Session、Skills、工具执行 | 工作区、RBAC、Policy、Audit、Knowledge、Model Router、Skill Manager |

## 文档与入口

| 资源 | 说明 |
|------|------|
| [产品规划白皮书（HTML）](Docs/OpenCrab企业版产品规划.html) | 定位、架构、模块、实施策略、路线图与进展（推荐在浏览器中打开） |
| [MVP 仪表盘](Docs/opencrabmvp.html) | 阶段目标与里程碑概览 |
| [OpenClaw 架构与产品解读（HTML）](Docs/OpenClaw-Architecture-Overview.html) | 上游 OpenClaw 技术架构、产品框架与产品思路，便于理解 Runtime Adapter 设计 |
| [Docs/OpenCarb](Docs/OpenCarb/) | 详细设计文档：PRD、V1 范围、架构、Runtime 集成、部署安全、路线图等 |

## 推荐阅读顺序

1. [产品规划白皮书](Docs/OpenCrab企业版产品规划.html) — 建立整体认知  
2. [OpenCrab-PRD](Docs/OpenCarb/OpenCarb-PRD.md) — 产品需求与边界  
3. [OpenCrab-V1-Scope](Docs/OpenCarb/OpenCarb-V1-Scope.md) — V1 必做与不做  
4. [OpenCrab-Architecture](Docs/OpenCarb/OpenCarb-Architecture.md) — 系统分层与控制面  

## 当前阶段

- **Phase 0**：文档与架构已完成  
- **Phase 1**：已完成（控制面 + 管理台 + UAT 与签收评审）  
- **Phase 2**：已启动（审批治理、技能治理、作业编排、可观测、PR Review 深化与生产化工程）  

## 本地启动（Phase 1）

```bash
# 1) 安装依赖
npm install

# 2) 启动基础依赖（PostgreSQL + Redis）
docker compose up -d

# 3) 启动控制面 API（默认 http://localhost:3000/api，端口被占用会自动顺延）
npm run dev:control-plane

# 4) 启动管理台（默认 http://localhost:5173，端口被占用会自动顺延）
npm run dev:web-console

# 5) 执行 Phase 1 冒烟脚本（需要控制面已启动）
npm run smoke:phase1

# 6) 执行 control-plane 集成测试（Jest + Supertest）
npm run test

# 7) 执行 Phase 1 UAT 自动脚本（生成 UAT 报告）
npm run uat:phase1

# 8) 生成 Phase 1 关闭评审模板
npm run closeout:phase1
```

说明：

- 若本地未启动 PostgreSQL / Redis，控制面会自动进入 `fallback`（内存模式），用于本地原型调试。
- 启动数据库后会自动启用持久化写入（workspace、audit、approval、index/pr job）。
- 控制面使用文件化 SQL migration（`apps/control-plane/src/shared/persistence/migrations`）管理 schema 变更。
- 启动脚本已内置端口检测：`dev:control-plane` 从 `3000` 起探测可用端口，`dev:web-console` 从 `5173` 起探测可用端口。
- Web Console 启动时会自动探测 `3000..3010` 上的 control-plane（请求 `/api/health`），并将 `VITE_API_BASE_URL` 注入前端，保证后端端口变化时无需改代码即可连通；若未探测到则回退为 `http://localhost:3000/api`。
- 若要连真实 OpenClaw ACP，可配置：
  - `OPENCLAW_ACP_BASE_URL`（如 `http://localhost:8080`）
  - `OPENCLAW_ACP_API_KEY`（可选）
  - `OPENCLAW_ACP_TIMEOUT_MS`（可选，默认 `5000`）
  - `OPENCLAW_ACP_MAX_ATTEMPTS`（可选，默认 `2`）
  - `OPENCLAW_ACP_RETRY_BACKOFF_MS`（可选，默认 `200`）
- 未配置或连接失败时，Runtime Adapter 会自动回退到本地 stub，不阻塞主链路。

首批已实现接口：

- `POST /api/session/context`
- `POST /api/model-router/decide`
- `POST /api/model-router/invoke`
- `POST /api/audit/events`
- `GET /api/audit/events`
- `GET /api/audit/runtime-fallback-stats`
- `GET /api/audit/runtime-fallback-trend`
- `GET /api/audit/runtime-fallback-alerts`
- `POST /api/approvals`
- `POST /api/approvals/:ticketId/decision`
- `POST /api/knowledge/index-jobs`
- `GET /api/knowledge/index-jobs`
- `GET /api/knowledge/index-jobs/:jobId`
- `POST /api/knowledge/index-jobs/:jobId/retry`
- `POST /api/knowledge/index-jobs/:jobId/terminate`
- `POST /api/integrations/pr-review/webhook`
- `GET /api/integrations/pr-review/jobs`
- `GET /api/integrations/pr-review/jobs/:jobId`
- `POST /api/integrations/pr-review/jobs/:jobId/retry`
- `POST /api/integrations/pr-review/jobs/:jobId/terminate`
- `GET /api/jobs/dead-letters`

管理台当前能力（React/Vite）：

- 前端请求使用 `limit≤50` 满足后端约束，API 失败时校验 `response.ok` 并做数组兜底，避免白屏。
- Workspace 列表与创建（分页）
- Audit 事件查询与手动写入（关键字过滤 + 分页）
- Approval 列表、创建与批准/拒绝操作（状态过滤 + 分页）
- Jobs 列表（状态过滤 + 分页）与详情/重试/终止操作
- Dead letter 列表查询（失败任务观测）
- Audit 事件支持查看结构化运行态字段（`runtimeMeta`，含 `taskType/model/adapter/fallbackReason`）
- 支持按时间窗口 + TopN 的 `fallbackReason` 聚合统计（`/api/audit/runtime-fallback-stats`）
- 支持按天聚合趋势（`/api/audit/runtime-fallback-trend`）
- 支持按阈值触发原型告警查询（`/api/audit/runtime-fallback-alerts`）

后端当前能力（NestJS）：

- Workspace/Audit/Approval 已切分 repository 层
- Knowledge/PR review 已走 repository + job enqueue（Redis 可用时入队）
- 内置最小 worker：支持并发上限、失败重试（最大重试次数）和死信记录
- Runtime Adapter（OpenClaw 适配层）已升级为 ACP 协议客户端（DTO/错误码/重试）并接入 Session/Model Router 主链路
- 已接入 API 级集成测试（health/workspace/audit/approval 主链路）

## 生产化与交付（Phase 2）

- **CI**：GitHub Actions（`.github/workflows/ci.yml`）在 push/PR 到 `main` 时执行 `npm ci`、`npm run build`、`npm run test`。
- **容器化**：`apps/control-plane/Dockerfile`、`apps/web-console/Dockerfile`；构建示例：
  - 控制面：`docker build -f apps/control-plane/Dockerfile apps/control-plane`
  - 管理台：`docker build -f apps/web-console/Dockerfile apps/web-console`
- **健康检查**：控制面提供 `GET /api/health`，可用于 readiness/liveness 探测；部署时需配置 `DATABASE_URL`、`REDIS_URL`（可选）等环境变量。

## 仓库结构（当前）

```
opencrab/
  apps/           # control-plane, web-console, ide-gateway
  services/       # model-router, knowledge-service, audit-service, skill-manager
  adapters/       # openclaw-runtime-adapter, acp-session-adapter
  integrations/   # git, docs, idp
```

## License

[Apache-2.0](LICENSE)
