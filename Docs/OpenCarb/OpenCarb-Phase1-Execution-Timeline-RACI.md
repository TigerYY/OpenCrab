# OpenCarb Phase 1 Execution Timeline RACI

## 1. 文档目的

本文把 `Phase 1` backlog 收敛为可执行排期视图，覆盖 `Sprint 1-3`、角色责任、冻结点、风险 owner。当前版本已统一实名到 `Tiger Yang`，后续可按实际团队分工再细化到多位责任人。

## 2. 时间假设

- Sprint 长度：2 周
- Sprint 数量：3 个
- Phase 1 总周期：6 周
- 进入条件：Phase 0 文档与准备包完成

## 3. Sprint Timeline

| Sprint | 周期 | 目标 | 冻结点 |
| --- | --- | --- | --- |
| Sprint 1 | Week 1-2 | Workspace、Session、Model Router 基础闭环 | 接口契约冻结 |
| Sprint 2 | Week 3-4 | Knowledge、Audit、最小审批闭环 | UAT 样例冻结 |
| Sprint 3 | Week 5-6 | IDE/Web/PR 联调、指标、上线准备 | 发布清单冻结 |

## 4. Epic 排期与 DRI

| Epic | 内容 | Sprint | DRI | 依赖 | 状态 |
| --- | --- | --- | --- | --- | --- |
| P1-E1 | Workspace + Session Gateway | Sprint 1 | Tiger Yang | 无 | Ready |
| P1-E2 | Model Router + Policy | Sprint 1 | Tiger Yang | P1-E1 | Ready |
| P1-E3 | Knowledge Index + QA Chain | Sprint 1-2 | Tiger Yang | P1-E1, P1-E2 | Ready |
| P1-E4 | Audit + Minimal Approval | Sprint 2 | Tiger Yang | P1-E1, P1-E2, P1-E3 | Ready |
| P1-E5 | IDE / Web / PR Integration | Sprint 2-3 | Tiger Yang | P1-E3, P1-E4 | Ready |
| P1-E6 | Metrics + Release Readiness | Sprint 3 | Tiger Yang | P1-E4, P1-E5 | Ready |

## 5. RACI

| 工作项 | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| Workspace / Session | Backend | Tech Lead | Platform, PM | Frontend, Sec |
| Model Router / Policy | AI, Backend | Tech Lead | Sec, Platform | PM |
| Knowledge Index / QA | AI, Backend | Tech Lead | PM | Frontend |
| Audit / Minimal Approval | Backend, Sec | Tiger Yang | PM, Frontend | Platform |
| IDE / Web / PR Integration | Frontend, Backend | Tech Lead | AI, PM | Sec |
| Metrics / Release | PM, Platform | PM | Data, Tech Lead | 全员 |

## 6. 关键冻结点

### 6.1 Sprint 1 冻结

- Session context schema
- `Model Router` 决策字段
- 工作区最小角色集

### 6.2 Sprint 2 冻结

- UAT 样例与验收阈值
- 审计事件字段
- 两类最小审批状态机

### 6.3 Sprint 3 冻结

- 发布清单
- 回滚条件
- 试点签收模板

## 7. 风险 Owner

| 风险 | Owner | 应对 |
| --- | --- | --- |
| 内网模型效果不足 | Tiger Yang | 保留受控外部回退 |
| IdP 映射延迟 | Tiger Yang | 先使用本地映射配置 |
| 审批链路卡单 | Tiger Yang | 明确超时和人工终止流程 |
| 知识索引不稳定 | Tiger Yang | 缩小知识源范围，优先核心仓库 |
| PR review 集成延误 | Tiger Yang | 先用 webhook/bot 最小闭环 |

## 8. 每周例会输出

- 上周完成项
- 本周阻塞项
- 风险升级项
- 是否影响冻结点
- 是否影响试点日期

## 9. 开工前待补齐

- 所有 `DRI` 已实名为 `Tiger Yang`
- 试点团队名称
- 试点仓库与文档源清单
- 试点起止日期
