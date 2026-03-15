# OpenCrab Phase 3 Interface Contract Pack

## 1. 文档目的

本文定义 Phase 3 规模化复制相关的新增或扩展接口契约，与 Phase 1/2 契约并存。原则：不破坏现有 API 语义，新增路径与版本策略明确。

## 2. 契约原则

- 新增 API 沿用 Phase 1 通用约定：Header（X-Trace-Id, X-Workspace-Id, X-Channel-Type）、统一响应结构、错误码风格。
- 模板与策略包采用“先导出/导入文件，再通过现有或新增 API 应用”的路径，避免过度开放写接口。
- 技能仓与现有 `GET /api/skills/approved-view`、`POST /api/skills/packages` 等兼容，通过 sourceType 或 sourceRef 区分“本地/URL”与“技能仓版本”。

## 3. 团队模板（已实现 MVP）

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/api/workspace-templates` | 模板列表（query: workspaceId 可选） | 已实现 |
| POST | `/api/workspace-templates` | 创建模板（body: name, sourceWorkspaceId, options 可选） | 已实现 |
| GET | `/api/workspace-templates/:templateId` | 模板详情（含 approvalPoliciesCount、prReviewConfigsCount 摘要） | 已实现 |
| POST | `/api/workspace-templates/:templateId/create-workspace` | 从模板创建工作区（body: name, overrides 可选）；新工作区自动复制源工作区审批策略与 PR Review 配置 | 已实现 |
| POST | `/api/workspaces/from-template` | 从模板创建工作区（body: templateId, name, overrides 可选）；同上，复制策略与配置 | 已实现 |

从模板创建工作区时，控制面会自源工作区（sourceWorkspaceId）复制审批策略（approval_policies）与 PR Review 配置（pr_review_configs）至新工作区；需 DB 启用时生效。

## 4. 策略包导出/导入（已实现）

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/api/approval-policies/export?workspaceId=` | 导出审批策略为 JSON（响应 data: { workspaceId, policies: [{ triggerEvent, riskLevel?, approverRule, timeoutMinutes }] }） | 已实现 |
| POST | `/api/approval-policies/import` | 从 JSON 导入到工作区（body: { workspaceId, policies: [...] }），每条策略生成新 policyId | 已实现 |

（模型策略若独立存储，可对称增加 export/import。）

## 5. 技能仓（已实现）

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/api/skills/registry/packages` | 技能仓包列表（query: status 可选，按是否有 published 版本过滤） | 已实现 |
| GET | `/api/skills/registry/packages/:packageId/versions` | 某包版本列表（version、sourceRef、status、createdAt） | 已实现 |
| POST | `/api/skills/packages` | 扩展：sourceType=registry，sourceRef=packageId@version，workspaceId 必填；创建后 status=imported，可继续走审核/批准流程 | 已实现 |

- **sourceRef 格式**：`packageId@version`（如 `e2e-registry-pkg@1.0.0`）。仅 published 版本可被引入；包或版本不存在返回 404，版本未发布返回 400。
- **响应**：沿用统一结构，data 为包列表或版本列表或新建技能包对象。

## 6. 通用约定

与 [OpenCrab-Phase1-Interface-Contract-Pack](OpenCrab-Phase1-Interface-Contract-Pack.md) 一致：同一 Header、同一响应结构、错误码扩展时追加新码并文档化。

## 7. 版本与兼容

- Phase 3 新增路径均置于现有 `/api` 下，不引入 `/v2` 除非有破坏性变更。
- 现有 Phase 2 接口（审批、技能、作业、指标、PR Review）保持不变，Phase 3 仅在其上增加“模板/仓/复用”能力。
