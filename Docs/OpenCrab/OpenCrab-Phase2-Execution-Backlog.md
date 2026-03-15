# OpenCrab Phase 2 执行 Backlog

## 1. 文档目的

本文为 Phase 2 全量开发的可执行看板：冻结 API/数据契约、迁移计划与任务拆解，对齐 [OpenCrab-Phase2-PRD](OpenCrab-Phase2-PRD.md) 退出条件与五条主线（审批、技能、作业、可观测、PR Review）。

## 2. Phase 2 总目标

- 审批治理：可配置策略、超时、批量审批。
- 技能治理：全生命周期与 Approved Skill View。
- 作业编排：统一状态机、死信持久化与处置动作。
- 可观测：四类指标 API 与统一看板。
- PR Review：配置化、分级结果与审批联动。
- 生产化：CI/CD、容器化、日志指标与发布规范。

## 3. API 契约清单（冻结）

### 3.1 审批（Approval）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/approvals` | 列表，支持 workspaceId、status、timeout 过滤 |
| POST | `/api/approvals` | 创建审批单（现有，扩展 riskLevel/approvers） |
| GET | `/api/approvals/:ticketId` | 审批单详情 |
| POST | `/api/approvals/:ticketId/decision` | 决策（现有，扩展 decidedBy/decidedAt） |
| GET | `/api/approval-policies` | 策略列表 |
| POST | `/api/approval-policies` | 创建策略（triggerEvent, approverRule, timeoutMinutes） |
| GET | `/api/approval-policies/:policyId` | 策略详情 |
| PATCH | `/api/approval-policies/:policyId` | 更新策略 |
| DELETE | `/api/approval-policies/:policyId` | 删除策略 |
| GET | `/api/approvals/timeout` | 超时单视图（query: workspaceId） |
| POST | `/api/approvals/batch-decision` | 批量审批（body: ticketIds, decision, comment） |

### 3.2 技能治理（Skills）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skills/packages` | 技能包列表（sourceType, status 过滤） |
| POST | `/api/skills/packages` | 导入技能包 |
| GET | `/api/skills/packages/:skillId` | 技能包详情 |
| POST | `/api/skills/packages/:skillId/review` | 提交审核结果 |
| POST | `/api/skills/packages/:skillId/approve` | 批准 |
| POST | `/api/skills/packages/:skillId/canary` | 灰度（body: workspaceScope, rolloutPercent） |
| POST | `/api/skills/packages/:skillId/release` | 发布 |
| POST | `/api/skills/packages/:skillId/rollback` | 回滚 |
| GET | `/api/skills/approved-view` | Approved Skill View（query: workspaceId，供 runtime 消费） |

### 3.3 作业（Jobs）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/jobs` | 统一作业列表（jobType, status, workspaceId） |
| GET | `/api/jobs/dead-letters` | 死信列表（现有，扩展分页） |
| POST | `/api/jobs/dead-letters/:taskKey/retry` | 死信重试 |
| POST | `/api/jobs/dead-letters/:taskKey/replay` | 死信重放 |
| POST | `/api/jobs/dead-letters/:taskKey/ignore` | 死信忽略 |
| POST | `/api/jobs/dead-letters/:taskKey/terminate` | 死信终止 |
| POST | `/api/jobs/:jobId/resume-after-approval` | 审批通过后恢复（approval-resume） |

### 3.4 可观测（Metrics）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/metrics/adoption` | 采纳指标（WAU, adoption rate, pilot retention） |
| GET | `/api/metrics/quality` | 质量指标（satisfaction, knowledge hit, PR accuracy） |
| GET | `/api/metrics/governance` | 治理指标（audit completeness, approval trigger/timeout, fallback rate） |
| GET | `/api/metrics/platform` | 平台指标（latency P50/P95, job success rate, index freshness, model error rate） |
| 支持 query | workspaceId, from, to, groupBy | 维度与时间窗口 |

### 3.5 PR Review（Integrations）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/integrations/pr-review/configs` | 仓库/分支/规则集配置列表 |
| POST | `/api/integrations/pr-review/configs` | 创建配置 |
| GET | `/api/integrations/pr-review/configs/:configId` | 配置详情 |
| PATCH | `/api/integrations/pr-review/configs/:configId` | 更新配置 |
| GET | `/api/integrations/pr-review/results` | Review 结果列表（含分级 info/warning/critical） |
| 现有 | webhook、jobs 系列 | 保持，扩展 job 状态 waiting_approval 与结果分级 |

## 4. 数据迁移计划

| 迁移文件 | 说明 |
|----------|------|
| `006_approval_policies_and_decided_by.sql` | approval_policies 表；approval_tickets 增加 risk_level, approvers_json, decided_by, decided_at；超时状态 |
| `007_skills_tables.sql` | skill_packages, skill_review_records, skill_release_plans, approved_skill_view 快照表 |
| `008_dead_letters_persist.sql` | dead_letters 表（task_key, queue, payload_json, attempts, error, failed_at, resolved_at, resolution） |
| `009_pr_review_configs.sql` | pr_review_configs 表（repo, branch, ruleset_id, template_id, writeback_policy） |
| `010_metrics_snapshots.sql` | 可选：metrics_snapshots 表用于预聚合；或仅实时查询 audit/jobs 表 |

## 5. 任务拆解（与 Plan Todo 对应）

| Todo ID | 工作项 | 交付物 |
|---------|--------|--------|
| p2-kickoff | 契约冻结与 Phase 1 文案统一 | 本文档、README/MVP 更新 |
| p2-approval | 审批策略与超时与批量审批 | 后端 Policy CRUD、超时逻辑、批量 API；前端策略页、超时视图、批量操作 |
| p2-skills | 技能治理全生命周期 | 后端 skills 模块与 Approved Skill View；前端技能列表与生命周期操作 |
| p2-jobs | 作业状态机与死信 | waiting_approval/retrying；死信持久化与 retry/replay/ignore/terminate；resume-after-approval |
| p2-observability | 四类指标与看板 | metrics 模块四类 API；前端采纳/质量/治理/平台看板 |
| p2-pr-review | PR Review 配置与分级 | configs CRUD；结果分级与审计；高风险触发审批 |
| p2-prod | CI/CD、容器化、日志指标 | GitHub Actions；Dockerfile；结构化日志与指标导出 |
| p2-uat-closeout | Phase 2 验收与收口 | phase2 smoke/UAT 脚本；Closeout 与发布说明 |

## 6. 依赖与顺序

- p2-approval 与 p2-jobs 部分并行（作业需挂接 approval 状态）。
- p2-skills 独立；p2-observability 依赖现有 audit/jobs 数据。
- p2-pr-review 依赖 p2-approval（高风险审批）。
- p2-prod 可与功能开发并行；p2-uat-closeout 最后执行。

## 7. 验收门禁

- 所有新增 API 纳入 e2e 或 smoke。
- 审批超时率、技能回滚可执行率、作业重试成功率、管理台指标覆盖率、PR 规则可解释率满足 Phase 2 PRD 目标。
- 至少 2 个团队可复用、五模块稳定可用（见 PRD 退出条件）。
