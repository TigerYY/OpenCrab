# OpenCrab 仓库规则（AI Coding 协作边界）

本文档面向在 AI IDE（如 Cursor、Codex）中参与开发的 Agent 与人类协作者，定义任务粒度、修改边界、必读文件与同步顺序，以保证变更可追溯、可回滚且不破坏既有治理文档体系。

---

## 1. 改动前必须先读的文件

在修改下列区域前，必须先阅读对应文档，避免与产品/架构/契约冲突：

| 改动区域 | 必读文档 |
|----------|----------|
| 控制面 API、模块划分、数据模型 | `Docs/OpenCrab/OpenCrab-Architecture.md`、当前 Phase 的 `OpenCrab-PhaseN-Interface-Contract-Pack.md` |
| 工作区、审批、技能、作业、审计、指标、PR review | 对应 Phase 的 Backlog 与 Spec（如 `OpenCrab-Phase2-Skill-Governance-Spec.md`、`OpenCrab-Phase2-PR-Review-Integration-Spec.md`） |
| 部署、环境、健康检查 | `Docs/OpenCrab/OpenCrab-Deployment-Template.md`、`Docs/OpenCrab/OpenCrab-Deployment-Security.md` |
| Runtime 与 OpenClaw 适配 | `Docs/OpenCrab/OpenCrab-Runtime-Integration.md`、`Docs/OpenCrab/OpenCrab-Implementation-Strategy.md` |
| 阶段目标与验收 | `Docs/OpenCrab/OpenCrab-Roadmap.md`、当前 Phase 的 `OpenCrab-PhaseN-Pilot-Acceptance-Pack.md` 或 Closeout-Review |
| 研发流程与 DoD | `Docs/OpenCrab/OpenCrab-Engineering-Playbook.md`、`Docs/OpenCrab/OpenCrab-Change-Checklist.md` |

新增 API 或变更已有 API 契约时，必须同步更新或确认对应 Phase 的 Interface-Contract-Pack（或文档中声明的接口列表）。

---

## 2. 允许 AI 直接修改的区域

- **应用代码**：`apps/control-plane/src/`、`apps/web-console/src/` 下的模块、服务、控制器、DTO、前端组件与页面。
- **测试与脚本**：`apps/control-plane/test/`、`scripts/*.sh`、`scripts/*.mjs`，以及根目录 `package.json` 中已存在的脚本用法。
- **迁移与配置**：`apps/control-plane/src/shared/persistence/migrations/*.sql`、各 app 的 `package.json`、`tsconfig.*.json`、`vite.config.ts` 等工程配置。
- **文档**：`Docs/OpenCrab/` 下与当前改动**直接相关**的文档（如补充接口说明、更新阶段进展）。涉及“产品范围、阶段目标、验收标准”的表述变更，需与仓库负责人确认后再改。

在上述区域内，AI 可在单次任务边界内直接编辑；但单次任务不得同时跨“架构/接口/UI”三大面（见下节）。

---

## 3. 必须人工确认的区域

- **产品与路线图**：`OpenCrab-PRD.md`、`OpenCrab-V1-Scope.md`、`OpenCrab-Roadmap.md`、`OpenCrab-Longterm-Roadmap.md` 的实质性修改（如新增/删除阶段、变更验收标准、扩大或收缩 V1 范围）。
- **治理与规范**：`OpenCrab-Phase2-Skill-Governance-Spec.md`、`OpenCrab-Phase2-PR-Review-Integration-Spec.md` 等 Spec 中“原则、生命周期、审计要求”等条款的变更。
- **CI 与交付门槛**：`.github/workflows/ci.yml` 中步骤的增删、`npm run build/test/smoke` 的语义变更。
- **本仓库规则**：`AGENTS.md`、`Docs/OpenCrab/OpenCrab-Engineering-Playbook.md`、`OpenCrab-Change-Checklist.md`、`OpenCrab-Task-Template.md` 的修改，应由人类决定并合并。

AI 可以**建议**上述文件的修改 diff，但最终是否采纳需人工确认。

---

## 4. 单次任务粒度

- **上限**：一次只做一个闭环任务，不在同一轮中同时改架构层、接口契约、和 UI 行为。
- **建议**：单任务 0.5–2 天内可完成，且具备可运行验证（如通过若干 API、或跑通某条 smoke、或明确手工步骤）。
- **若必须跨多面**：拆成多个小任务，按顺序执行（例如：先接口契约 + 后端 API，再前端/管理台）。

---

## 5. 文档、代码、测试、冒烟之间的同步顺序

1. **接口或行为变更**：先确定契约或 Spec（可在文档中补充/更新），再改代码与测试。
2. **代码与测试**：实现与对应单测/集成测同步完成；提交前 `npm run build`、`npm run test` 必须通过。
3. **影响现有 smoke 时**：修改后跑对应 `npm run smoke:phase1` 或 `smoke:phase2`，失败则修复直至通过。
4. **文档**：若接口、阶段状态、能力边界发生变化，必须在同一变更集中更新相关文档（见 `OpenCrab-Change-Checklist.md`），避免文档与实现脱节。

---

## 6. 何时必须补测试、何时允许仅 smoke/手工验证

- **必须补自动化测试**：新增或修改后端 API、共享业务逻辑、数据模型或状态机；新增或修改与审批/技能/作业/审计相关的核心路径。应补单元测试或集成测试（如 `apps/control-plane/test/`），并在 CI 中运行。
- **允许仅 smoke 或手工验证**：仅文案/样式、仅配置项默认值、仅文档勘误、或仅影响单一前端页面的非关键交互。若改动可能影响现有 smoke，仍须跑通对应 smoke；否则在任务卡中写明手工验证步骤与结果。

---

## 7. 工程约定（简要）

- **控制面**：NestJS 模块化；按 `modules/<domain>/` 组织，每模块含 `*.controller.ts`、`*.service.ts`、`*.repository.ts`（若需持久化）、`dto/`。新增 API 需在对应 Controller 中注册，并考虑鉴权与审计。
- **前端**：React + Vite，`apps/web-console/src/`；请求需考虑后端分页与错误兜底（如 `limit≤50`、数组兜底）。
- **持久化**：Schema 变更通过 `apps/control-plane/src/shared/persistence/migrations/*.sql` 管理，禁止在代码中手写 DDL。
- **命名**：与现有代码风格一致；DTO 与 API 路径与 Interface-Contract-Pack 或 OpenAPI 描述一致。

---

## 8. 参考

- 执行层流程与 DoD：`Docs/OpenCrab/OpenCrab-Engineering-Playbook.md`
- 提交前检查与 PR 说明：`Docs/OpenCrab/OpenCrab-Change-Checklist.md`
- 任务卡格式：`Docs/OpenCrab/OpenCrab-Task-Template.md`
- 文档索引：`Docs/OpenCrab/README.md`
