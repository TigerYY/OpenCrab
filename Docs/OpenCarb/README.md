# OpenCarb 文档索引

本目录存放 **OpenCarb** 的产品、架构与开发准备文档，围绕「基于 OpenClaw 打造企业团队级 AI 助理平台」展开。

## 文档列表

| 文档 | 说明 |
|------|------|
| `OpenCarb-PRD.md` | 产品定位、目标用户、核心需求、非目标与成功指标 |
| `OpenCarb-V1-Scope.md` | V1 必做范围、试点建议、验收标准与不做项 |
| `OpenCarb-Architecture.md` | 系统分层、控制面职责与核心数据对象 |
| `OpenCarb-Runtime-Integration.md` | OpenClaw runtime、ACP 与 skills 的复用方式与适配边界 |
| `OpenCarb-Deployment-Security.md` | 内网优先、外部 API 备援的部署拓扑与安全边界 |
| `OpenCarb-Implementation-Strategy.md` | 技术实施策略与复用/自研边界 |
| `OpenCarb-Roadmap.md` | 从试点到规模化复制的路线图 |
| `OpenCarb-Phase1-Execution-Backlog.md` | Phase 1 可执行 backlog：Epic、Story、Checklist、DoD、依赖与 owner |
| `OpenCarb-Phase1-Interface-Contract-Pack.md` | Phase 1 接口契约包：API、事件、错误码、鉴权、版本策略 |
| `OpenCarb-Phase1-Pilot-Acceptance-Pack.md` | Phase 1 试点验收包：UAT 场景、样例、阈值与签收模板 |
| `OpenCarb-Phase1-Ops-Runbook.md` | Phase 1 运行手册：上线、值守、告警、回滚、审批卡单处理 |
| `OpenCarb-Phase1-Execution-Timeline-RACI.md` | Phase 1 排期与责任分工：Sprint 1-3、RACI、风险 owner、冻结点 |
| `OpenCarb-Phase1-UAT-Execution-Report.md` | Phase 1 UAT 自动执行报告（由脚本生成） |
| `OpenCarb-Phase1-Closeout-Review.md` | Phase 1 关闭评审模板（由脚本自动生成骨架） |
| `OpenCarb-Phase2-PRD.md` | Phase 2 产品需求：企业化增强目标、范围、指标与退出条件 |
| `OpenCarb-Phase2-Approval-Design.md` | Phase 2 审批设计：通用审批对象、状态机、数据对象与管理台需求 |
| `OpenCarb-Phase2-Skill-Governance-Spec.md` | Phase 2 技能治理规范：审核、灰度、发布、回滚与 Approved Skill View |
| `OpenCarb-Phase2-Job-Orchestration-Spec.md` | Phase 2 作业编排规范：任务类型、状态机、幂等、重试与死信 |
| `OpenCarb-Phase2-Observability-Metrics-Definition.md` | Phase 2 指标口径：采纳、质量、治理、平台运行与告警阈值 |
| `OpenCarb-Phase2-PR-Review-Integration-Spec.md` | Phase 2 PR review 集成规范：规则、模板、回写与审计归档 |
| `OpenCarb-Phase2-Execution-Backlog.md` | Phase 2 可执行看板：API 契约、迁移计划与任务拆解 |
| `OpenCarb-Phase2-Closeout-Review.md` | Phase 2 关闭评审模板与验收结论 |

Phase 2 代码与交付物已就绪，详见 `OpenCarb-Phase2-Execution-Backlog.md` 与 `OpenCarb-Phase2-Closeout-Review.md`。

## 参考：上游项目

| 资源 | 说明 |
|------|------|
| [OpenClaw 架构与产品解读（HTML）](../OpenClaw-Architecture-Overview.html) | OpenClaw 技术架构、产品框架与产品思路，便于理解复用边界与 Runtime Adapter 设计 |

## 推荐阅读顺序

1. `OpenCarb-PRD.md`
2. `OpenCarb-V1-Scope.md`
3. `OpenCarb-Architecture.md`
4. `OpenCarb-Runtime-Integration.md` 与 `OpenCarb-Deployment-Security.md`
5. `OpenCarb-Roadmap.md`
6. `OpenCarb-Phase1-Execution-Backlog.md`
7. `OpenCarb-Phase1-Interface-Contract-Pack.md`、`OpenCarb-Phase1-Pilot-Acceptance-Pack.md`
8. `OpenCarb-Phase1-Ops-Runbook.md`、`OpenCarb-Phase1-Execution-Timeline-RACI.md`
9. `OpenCarb-Phase2-PRD.md`
10. `OpenCarb-Phase2-Approval-Design.md`、`OpenCarb-Phase2-Skill-Governance-Spec.md`
11. `OpenCarb-Phase2-Job-Orchestration-Spec.md`、`OpenCarb-Phase2-Observability-Metrics-Definition.md`
12. `OpenCarb-Phase2-PR-Review-Integration-Spec.md`

## 下一步建议

- 基于 PRD 细化页面级需求与角色权限矩阵  
- 基于 Architecture 输出技术选型与接口清单  
- 基于 V1-Scope 形成 MVP 开发排期与试点验收表  
- 基于 `OpenCarb-Phase1-Execution-Backlog.md` 导入 Jira / Linear 并启动 Sprint 排期  
- 基于 Phase 1 四件套补齐实名 DRI、试点团队与实际时间窗口  
- 基于 Phase 2 六件套决定企业化增强的进入条件与优先级  
