# OpenCrab Phase 3 执行 Backlog

## 1. 文档目的

本文为 Phase 3 规模化复制的可执行看板，对齐 [OpenCrab-Roadmap](OpenCrab-Roadmap.md) Phase 3 目标：标准部署模板、团队模板与默认策略、企业私有技能仓、跨团队能力复用。进入条件见 [OpenCrab-Phase2-Closeout-Review](OpenCrab-Phase2-Closeout-Review.md) 第 4 节。

## 2. Phase 3 总目标

- **标准部署模板**：一键或脚本化部署控制面 + 管理台 + 依赖，环境变量与健康检查标准化。
- **团队模板与默认策略**：新工作区可从模板克隆（模型策略、审批策略、技能集、PR 配置）。
- **企业私有技能仓**：技能包集中存储、版本、审批与发布流程，多工作区共享。
- **跨团队能力复用**：策略包、技能包可导出/导入，支持从单团队复制到多团队。

## 3. Epic 与 Story 拆解

### P3-E1：标准部署模板

| ID | Story | DoD | 依赖 |
|----|-------|-----|------|
| P3-E1-S1 | 产出部署文档：Docker Compose 示例、环境变量清单、健康检查与就绪顺序 | 文档经平台评审通过 | 无 |
| P3-E1-S2 | 提供“最小可用”compose 编排（control-plane + web-console + PostgreSQL + Redis） | 本地/测试环境一键启动 | P3-E1-S1 |
| P3-E1-S3 | 健康检查与依赖顺序：DB 就绪后再启动 control-plane，control-plane 就绪后再接入流量 | 文档与编排一致 | P3-E1-S2 |

### P3-E2：团队模板与默认策略

| ID | Story | DoD | 依赖 |
|----|-------|-----|------|
| P3-E2-S1 | 定义“团队模板”数据模型：工作区默认配置 + 模型策略 + 审批策略 + 技能集引用 + PR 配置 | 设计文档冻结 | 无 |
| P3-E2-S2 | 实现模板 CRUD API（创建模板、从工作区生成模板、从模板创建工作区） | API 纳入接口契约，E2E 覆盖 | P3-E2-S1 |
| P3-E2-S3 | 管理台支持“从模板创建工作区”入口 | 可选用模板并创建成功 | P3-E2-S2 |

### P3-E3：企业私有技能仓

| ID | Story | DoD | 依赖 |
|----|-------|-----|------|
| P3-E3-S1 | 技能仓存储与版本模型：集中仓库、版本号、与现有 skills 治理流程打通 | 设计文档冻结 | 无 |
| P3-E3-S2 | 技能包发布与审核流程：从“本地/URL 导入”扩展为“从技能仓拉取指定版本” | API 与 Phase 2 技能治理兼容 | P3-E3-S1 |
| P3-E3-S3 | 管理台技能仓视图：浏览、版本选择、申请引入工作区 | 可完成一次从仓到工作区的引入 | P3-E3-S2 |

### P3-E4：跨团队能力复用

| ID | Story | DoD | 依赖 |
|----|-------|-----|------|
| P3-E4-S1 | 策略包导出/导入：审批策略、模型策略可导出为 JSON/YAML，支持导入到新工作区 | 契约文档与实现一致 | P2 完成 |
| P3-E4-S2 | 多工作区共享技能包：同一技能仓版本可被多个工作区引用，权限与可见性规则明确 | 设计文档与最小实现 | P3-E3 |
| P3-E4-S3 | 运营手册：复制新团队的标准步骤、检查清单、回滚条件 | 文档经 PM/Platform 签收 | P3-E2, P3-E3 |

## 4. 非目标（Phase 3 不做）

- 多租户计费与用量计费。
- 跨区域/多集群部署与同步。
- 开放市场与第三方技能上架审核流程（仅企业私有仓）。

## 5. P3-E1 / P3-E2 可演示验收清单（MVP）

- **部署模板**：`docker compose up -d --build` 可拉起 postgres、redis、control-plane、web-console；健康检查与就绪顺序见 [OpenCrab-Deployment-Template](OpenCrab-Deployment-Template.md)。
- **模板 API**：`GET /api/workspace-templates`、`POST /api/workspace-templates`、`GET /api/workspace-templates/:id`、`POST /api/workspaces/from-template` 或 `POST /api/workspace-templates/:id/create-workspace` 可用；E2E 覆盖模板列表与“从模板创建工作区”。
- **管理台**：Templates 页可查看模板列表、创建模板（基于当前工作区）、从模板创建工作区（选择模板 + 输入名称提交）。

## 6. 验收与退出条件

- 新团队可在标准模板上于 1 个工作日内完成“开通工作区 + 绑定知识源 + 启用技能”。
- 技能与策略可复用，无需逐项重复配置。
- 产品具备从单团队走向多团队部署的文档与自动化基础。
