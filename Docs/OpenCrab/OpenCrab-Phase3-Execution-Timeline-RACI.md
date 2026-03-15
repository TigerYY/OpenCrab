# OpenCrab Phase 3 Execution Timeline RACI

## 1. 文档目的

本文把 Phase 3 规模化复制 Backlog 收敛为可执行排期视图，覆盖 Sprint、角色责任、冻结点与风险 owner。进入条件见 [OpenCrab-Phase2-Closeout-Review](OpenCrab-Phase2-Closeout-Review.md)。

## 2. 时间假设

- Sprint 长度：2 周
- Sprint 数量：4 个（可随资源调整）
- Phase 3 总周期：8–10 周
- 进入条件：Phase 2 签收闭环、Phase 3 启动包齐备

## 3. Sprint Timeline

| Sprint | 周期 | 目标 | 冻结点 |
|--------|------|------|--------|
| Sprint 1 | Week 1-2 | 标准部署模板、Compose 与文档 | 部署文档与编排冻结 |
| Sprint 2 | Week 3-4 | 团队模板数据模型与 API、从模板创建工作区 | 模板 API 契约冻结 |
| Sprint 3 | Week 5-6 | 企业私有技能仓模型与 API、与技能治理打通 | 技能仓契约冻结 |
| Sprint 4 | Week 7-8 | 策略包导出/导入、管理台模板与技能仓视图、验收 | 发布清单与运营手册冻结 |

## 4. Epic 排期与 DRI

| Epic | 内容 | Sprint | DRI | 依赖 | 状态 |
|------|------|--------|-----|------|------|
| P3-E1 | 标准部署模板 | Sprint 1 | Platform / Tech Lead | 无 | 待启动 |
| P3-E2 | 团队模板与默认策略 | Sprint 2 | Backend / PM | P3-E1 | 待启动 |
| P3-E3 | 企业私有技能仓 | Sprint 3 | Backend / AI | P2 技能治理 | 待启动 |
| P3-E4 | 跨团队能力复用 | Sprint 4 | Backend / Platform | P3-E2, P3-E3 | 待启动 |

## 5. RACI

| 工作项 | Responsible | Accountable | Consulted | Informed |
|--------|-------------|-------------|-----------|----------|
| 部署模板与编排 | Platform | Tech Lead | Backend, Sec | PM, 全员 |
| 团队模板 API | Backend | Tech Lead | PM, Frontend | Sec, Platform |
| 技能仓与版本 | Backend, AI | Tech Lead | PM, Platform | Frontend |
| 策略导出/导入 | Backend | Tech Lead | PM, Sec | Platform |
| 管理台模板与技能仓视图 | Frontend | Tech Lead | Backend, PM | 全员 |
| 验收与运营手册 | PM, Platform | PM | Tech Lead, Pilot Admin | 全员 |

## 6. 关键冻结点

### 6.1 Sprint 1 冻结

- 部署文档结构与环境变量清单
- Docker Compose 服务定义与健康检查顺序

### 6.2 Sprint 2 冻结

- 团队模板 API 路径与 Request/Response 契约
- “从模板创建工作区”最小字段集

### 6.3 Sprint 3 冻结

- 技能仓包与版本模型
- 与现有 `/api/skills/packages` 的 sourceType/sourceRef 扩展约定

### 6.4 Sprint 4 冻结

- 策略导出/导入格式
- Phase 3 发布清单与试点验收结论

## 7. 风险 Owner

| 风险 | Owner | 应对 |
|------|-------|------|
| 模板与现网配置漂移 | Tech Lead | 版本化模板、变更审计 |
| 技能仓与多工作区权限边界模糊 | Backend / Sec | 明确“仓只读、工作区可写”的边界 |
| 部署依赖升级导致编排失败 | Platform | 锁定基础镜像与依赖版本，CI 覆盖部署脚本 |

## 8. 每周例会输出

- 上周完成项
- 本周阻塞项
- 风险升级项
- 是否影响冻结点或 Phase 3 验收日期
