# OpenCrab 长期路线图（12-18 个月战略总览）

## 1. 文档目的

本文档为战略版总览，与 [OpenCrab-Roadmap](OpenCrab-Roadmap.md) 主路线图互补：主路线图定义各 Phase 的目标、范围、验收与准入条件；本文档明确 12-18 个月总体目标、能力域地图、Phase 与能力域映射，以及近程/中远程优先级，便于逐步推进而不失整体视野。

## 2. 12-18 个月总体目标

产品面向**部门级、工作组级**客户，组织形态偏**扁平化**（多工作区自治 + 轻中心治理）。后续阶段以「可治理、可审计、可扩展」的**最小可体验**优先，更高阶企业级功能延后至 Phase 7。

- **从单团队可用到多团队可复制**：通过 Phase 3 完成部署模板、团队模板、私有技能仓与跨团队复用；Phase 4 强化团队复制与轻治理（SSO-lite、模板与审计留痕）。
- **从能用到可评估、可增长**：通过 Phase 5 建立工作区级质量闭环与采纳可见性（最小评测、成本/采纳可见、反馈闭环），不做重型运营平台。
- **从单点到跨团队协作**：通过 Phase 6 建设共享目录与协作审批，单点突破一个入口或连接器，支撑扁平化协作。
- **企业扩展包**：Phase 7 在多个部门稳定复用后，再投入组织级治理深化、多租户、计费、HA/容灾与生态市场基础。

整体原则：先证明单团队价值，再复制与轻治理；先让客户体验起来，再按需做企业扩展。能力分类见 [OpenCrab-Phase4plus-Capability-Classification](OpenCrab-Phase4plus-Capability-Classification.md)。

## 3. 能力域地图

| 能力域 | 说明 | 主要归属 Phase |
|--------|------|----------------|
| 工作区与隔离 | 团队工作区、成员/角色/资源隔离 | Phase 0-1 |
| 模型治理 | 内网优先、外发回退、策略路由、审批 | Phase 1-2 |
| 知识能力 | Git/文档/FAQ 索引、检索、权限过滤 | Phase 1 |
| 技能治理 | 审批、灰度、发布、回滚、Approved View | Phase 2 |
| 审计与审批 | 全链路留痕、审批策略、超时、批量 | Phase 1-2 |
| 作业编排 | 异步任务、死信、重试、resume | Phase 2 |
| 可观测性 | 采纳/质量/治理/平台指标、看板、告警 | Phase 2 |
| 部署与交付 | Docker/Compose、健康检查、CI、一键启动 | Phase 3 E1 |
| 团队模板 | 工作区模板、从模板创建、默认策略 | Phase 3 E2 |
| 私有技能仓 | 集中仓库、版本、发布、多工作区共享 | Phase 3 E3 |
| 跨团队复用 | 策略包导出/导入、复制新团队流程 | Phase 3 E4 |
| SSO-lite 与轻治理 | 企业登录（OIDC/SAML）、工作区/策略/技能模板、审计留痕、基础保留 | Phase 4 |
| 质量闭环与采纳 | 最小评测基线、工作区级成本/采纳可见、反馈闭环、轻量版本回溯 | Phase 5 |
| 跨团队协作 | 共享目录、协作审批、单点入口或连接器深化、协作对象模型 | Phase 6 |
| 组织级治理深化 | SCIM、组织级策略、数据分级、KMS/BYOK、合规深化 | Phase 7 |
| 组织级运营与计费 | 运营看板、告警闭环、showback/chargeback、计费/分摊 | Phase 7 |
| 多租户与可靠性 | 多租户、配额、HA、备份恢复、多集群/多地域 | Phase 7 |
| 生态市场基础 | 技能/策略发布、审核、内部分发与市场机制 | Phase 7 |

## 4. Phase 与能力域映射（示意）

```
Phase 0-1: 产品验证、最小闭环 → 工作区、模型、知识、审计、审批、技能基础、PR review
Phase 2: 企业化增强 → 审批治理、技能全生命周期、作业、可观测、PR 深化、CI/容器化
Phase 3: 规模化复制 → 部署模板、团队模板、私有技能仓、跨团队复用
Phase 4: 团队复制与轻治理 → SSO-lite、工作区/策略/技能模板、轻治理与审计留痕
Phase 5: 质量闭环与采纳增长 → 最小评测、工作区级成本/采纳可见、反馈闭环
Phase 6: 跨团队协作网络 → 共享目录、协作审批、单点入口或连接器深化
Phase 7: 企业扩展包 → 组织级治理深化、多租户/计费、HA/容灾、生态市场
```

## 5. Phase 3 延续与 Phase 4+ 划分

- **Phase 3 延续**（当前与近期）：E1 部署模板、E2 团队模板、E3 企业私有技能仓、E4 跨团队能力复用（策略包导出/导入）已交付；E3 已交付，Phase 3 彻底完成，可签收。
- **Phase 4+**：团队复制与轻治理（Phase 4）、质量闭环与采纳增长（Phase 5）、跨团队协作网络（Phase 6）、企业扩展包（Phase 7），依赖 Phase 3 签收后按序推进。Phase 4–6 面向部门级/工作组级最小可体验；Phase 7 为重型企业扩展，在多部门稳定复用后再投入。

## 6. 近程与中远程优先级

- **近程（建议 6-12 个月内聚焦）**：Phase 3 收口（E3/E4）+ Phase 4 团队复制与轻治理（SSO-lite、模板与轻治理）。优先让新团队快速开通并体验可治理、可审计闭环。
- **中远程（12-18 个月及以后）**：Phase 5（质量闭环与采纳增长）→ Phase 6（跨团队协作网络）→ Phase 7（企业扩展包）。可根据试点反馈与资源情况调整投入节奏。
- **原则**：不提前做重型组织级平台；更高阶企业级功能在 Phase 7 按需扩展。能力分类见 [OpenCrab-Phase4plus-Capability-Classification](OpenCrab-Phase4plus-Capability-Classification.md)。

## 7. 风险与资源建议

- **范围膨胀**：严格按 Phase 退出条件与验收标准收口，不提前做下一阶段核心功能。
- **过早平台化**：Phase 4–6 不追求组织级统一治理与多入口并行，先做部门级可体验、可复制。
- **企业扩展投入**：Phase 7 的 SCIM、多租户、计费、HA 属于重投入，建议在 Phase 5–6 验证价值后再加大投入。

资源投入建议与主路线图 [OpenCrab-Roadmap](OpenCrab-Roadmap.md) 第 12 节一致；长期路线执行时可根据每阶段签收结论滚动更新本文档。

## 8. 相关文档

- [OpenCrab-Roadmap](OpenCrab-Roadmap.md)：主路线图，含 Phase 0-7 目标、范围、里程碑、进入条件与验收标准。
- [OpenCrab-Phase4plus-Capability-Classification](OpenCrab-Phase4plus-Capability-Classification.md)：Phase 4+ 能力分类（部门级必需 vs 后移企业能力）。
- [OpenCrab-Phase3-Execution-Backlog](OpenCrab-Phase3-Execution-Backlog.md)：Phase 3 可执行看板。
- [OpenCrab-Phase4-Execution-Backlog](OpenCrab-Phase4-Execution-Backlog.md)：Phase 4 可执行看板（骨架）。
- [OpenCrab-Phase5-Execution-Backlog](OpenCrab-Phase5-Execution-Backlog.md)：Phase 5 可执行看板（骨架）。
