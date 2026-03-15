# OpenCrab 文档索引

本目录存放 **OpenCrab** 的产品、架构与开发准备文档，围绕「基于 OpenClaw 打造企业团队级 AI 助理平台」展开。

## 文档列表

| 文档 | 说明 |
|------|------|
| `OpenCrab-PRD.md` | 产品定位、目标用户、核心需求、非目标与成功指标 |
| `OpenCrab-V1-Scope.md` | V1 必做范围、试点建议、验收标准与不做项 |
| `OpenCrab-Architecture.md` | 系统分层、控制面职责与核心数据对象 |
| `OpenCrab-Runtime-Integration.md` | OpenClaw runtime、ACP 与 skills 的复用方式与适配边界 |
| `OpenCrab-Deployment-Security.md` | 内网优先、外部 API 备援的部署拓扑与安全边界 |
| `OpenCrab-Implementation-Strategy.md` | 技术实施策略与复用/自研边界 |
| `OpenCrab-Roadmap.md` | 从试点到规模化复制的路线图 |
| `OpenCrab-Phase1-Execution-Backlog.md` | Phase 1 可执行 backlog：Epic、Story、Checklist、DoD、依赖与 owner |
| `OpenCrab-Phase1-Interface-Contract-Pack.md` | Phase 1 接口契约包：API、事件、错误码、鉴权、版本策略 |
| `OpenCrab-Phase1-Pilot-Acceptance-Pack.md` | Phase 1 试点验收包：UAT 场景、样例、阈值与签收模板 |
| `OpenCrab-Phase1-Ops-Runbook.md` | Phase 1 运行手册：上线、值守、告警、回滚、审批卡单处理 |
| `OpenCrab-Phase1-Execution-Timeline-RACI.md` | Phase 1 排期与责任分工：Sprint 1-3、RACI、风险 owner、冻结点 |
| `OpenCrab-Phase1-UAT-Execution-Report.md` | Phase 1 UAT 自动执行报告（由脚本生成） |
| `OpenCrab-Phase1-Closeout-Review.md` | Phase 1 关闭评审模板（由脚本自动生成骨架） |
| `OpenCrab-Phase2-PRD.md` | Phase 2 产品需求：企业化增强目标、范围、指标与退出条件 |
| `OpenCrab-Phase2-Approval-Design.md` | Phase 2 审批设计：通用审批对象、状态机、数据对象与管理台需求 |
| `OpenCrab-Phase2-Skill-Governance-Spec.md` | Phase 2 技能治理规范：审核、灰度、发布、回滚与 Approved Skill View |
| `OpenCrab-Phase2-Job-Orchestration-Spec.md` | Phase 2 作业编排规范：任务类型、状态机、幂等、重试与死信 |
| `OpenCrab-Phase2-Observability-Metrics-Definition.md` | Phase 2 指标口径：采纳、质量、治理、平台运行与告警阈值 |
| `OpenCrab-Phase2-PR-Review-Integration-Spec.md` | Phase 2 PR review 集成规范：规则、模板、回写与审计归档 |
| `OpenCrab-Phase2-Execution-Backlog.md` | Phase 2 可执行看板：API 契约、迁移计划与任务拆解 |
| `OpenCrab-Phase2-Closeout-Review.md` | Phase 2 关闭评审模板与验收结论 |
| `OpenCrab-Phase3-Execution-Backlog.md` | Phase 3 可执行看板：部署模板、团队模板、技能仓、跨团队复用 |
| `OpenCrab-Phase3-Interface-Contract-Pack.md` | Phase 3 接口契约：模板 API、策略导出/导入、技能仓 API |
| `OpenCrab-Phase3-Pilot-Acceptance-Pack.md` | Phase 3 试点验收包：新团队开通、模板与技能仓验收场景 |
| `OpenCrab-Phase3-Execution-Timeline-RACI.md` | Phase 3 排期与责任分工：Sprint 1-4、RACI、DRI、冻结点 |
| `OpenCrab-Phase3-Operations-Manual.md` | Phase 3 运营手册：新团队开通步骤、策略包导出/导入、检查清单与回滚 |
| `OpenCrab-Deployment-Template.md` | Phase 3 E1 标准部署模板：compose 编排、健康检查、部署说明与常见问题 |
| `OpenCrab-Longterm-Roadmap.md` | 12-18 个月战略总览：能力域地图、Phase 与能力域映射、近程/中远程优先级 |
| `OpenCrab-Phase4-Execution-Backlog.md` | Phase 4 组织级治理可执行看板（骨架） |
| `OpenCrab-Phase4-Interface-Contract-Pack.md` | Phase 4 接口契约方向（骨架） |
| `OpenCrab-Phase5-Execution-Backlog.md` | Phase 5 运营与质量平台可执行看板（骨架） |
| `OpenCrab-Engineering-Playbook.md` | 1–3 人 AI Coding 团队工程手册：治理骨架、三层方法、DoD/验证/回滚 |
| `OpenCrab-Change-Checklist.md` | 变更检查清单：提交前检查、文档同步触发条件、PR 说明模板 |
| `OpenCrab-Task-Template.md` | 单次开发任务卡模板，适配 AI IDE 执行 |

仓库根目录 `AGENTS.md` 为面向 AI Coding 的仓库规则（任务粒度、修改边界、同步顺序、人工确认点）。

Phase 2 代码与交付物已就绪，详见 `OpenCrab-Phase2-Execution-Backlog.md` 与 `OpenCrab-Phase2-Closeout-Review.md`。Phase 3 启动包已产出，满足准入后可进入排期。**Phase 3 已启动**；E1 部署模板与 E2 团队模板 MVP 已交付，详见 `OpenCrab-Deployment-Template.md` 与 `OpenCrab-Phase3-Execution-Backlog.md`。后续路线已扩展至 Phase 4-7，主路线图见 `OpenCrab-Roadmap.md`，战略总览与 Phase 4/5 骨架见 `OpenCrab-Longterm-Roadmap.md` 与上述 Phase 4/5 文档。

## 参考：上游项目

| 资源 | 说明 |
|------|------|
| [OpenClaw 架构与产品解读（HTML）](../OpenClaw-Architecture-Overview.html) | OpenClaw 技术架构、产品框架与产品思路，便于理解复用边界与 Runtime Adapter 设计 |

## 推荐阅读顺序

1. `OpenCrab-PRD.md`
2. `OpenCrab-V1-Scope.md`
3. `OpenCrab-Architecture.md`
4. `OpenCrab-Runtime-Integration.md` 与 `OpenCrab-Deployment-Security.md`
5. `OpenCrab-Roadmap.md`
6. `OpenCrab-Phase1-Execution-Backlog.md`
7. `OpenCrab-Phase1-Interface-Contract-Pack.md`、`OpenCrab-Phase1-Pilot-Acceptance-Pack.md`
8. `OpenCrab-Phase1-Ops-Runbook.md`、`OpenCrab-Phase1-Execution-Timeline-RACI.md`
9. `OpenCrab-Phase2-PRD.md`
10. `OpenCrab-Phase2-Approval-Design.md`、`OpenCrab-Phase2-Skill-Governance-Spec.md`
11. `OpenCrab-Phase2-Job-Orchestration-Spec.md`、`OpenCrab-Phase2-Observability-Metrics-Definition.md`
12. `OpenCrab-Phase2-PR-Review-Integration-Spec.md`
13. `OpenCrab-Phase3-Execution-Backlog.md`、`OpenCrab-Phase3-Interface-Contract-Pack.md`
14. `OpenCrab-Phase3-Pilot-Acceptance-Pack.md`、`OpenCrab-Phase3-Execution-Timeline-RACI.md`
15. `OpenCrab-Longterm-Roadmap.md`（长期路线与能力域）
16. `OpenCrab-Phase4-Execution-Backlog.md`、`OpenCrab-Phase4-Interface-Contract-Pack.md`
17. `OpenCrab-Phase5-Execution-Backlog.md`
18. 使用 AI IDE 或 1–3 人小团队开发时：根目录 `AGENTS.md`，以及 `OpenCrab-Engineering-Playbook.md`、`OpenCrab-Change-Checklist.md`、`OpenCrab-Task-Template.md`

## 下一步建议

- 基于 PRD 细化页面级需求与角色权限矩阵  
- 基于 Architecture 输出技术选型与接口清单  
- 基于 V1-Scope 形成 MVP 开发排期与试点验收表  
- 基于 `OpenCrab-Phase1-Execution-Backlog.md` 导入 Jira / Linear 并启动 Sprint 排期  
- 基于 Phase 1 四件套补齐实名 DRI、试点团队与实际时间窗口  
- 基于 Phase 2 六件套决定企业化增强的进入条件与优先级  
- 完成 Phase 2 签收后，基于 Phase 3 启动包（Backlog、接口契约、验收包、RACI）进入规模化复制排期  
- 后续路线已设计至 Phase 7，见 `OpenCrab-Roadmap.md` 与 `OpenCrab-Longterm-Roadmap.md`；Phase 4/5 骨架就绪后可逐步细化并排期  
- 以 AI IDE 为主开发时，遵循根目录 `AGENTS.md` 与 `OpenCrab-Engineering-Playbook.md`、`OpenCrab-Change-Checklist.md`、`OpenCrab-Task-Template.md` 中的任务粒度与质量门槛  
