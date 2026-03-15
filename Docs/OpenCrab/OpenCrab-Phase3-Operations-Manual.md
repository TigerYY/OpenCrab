# OpenCrab Phase 3 运营手册

## 1. 文档目的

本文为 Phase 3 规模化复制场景下的运营操作手册，供平台与试点团队执行“新团队开通、模板与策略复用、部署与回滚”时使用。与 [OpenCrab-Phase1-Ops-Runbook](OpenCrab-Phase1-Ops-Runbook.md) 互补，Phase 3 侧重多团队复制与配置复用。

## 2. 新团队开通标准步骤

1. **环境就绪**：按 [OpenCrab-Deployment-Template](OpenCrab-Deployment-Template.md) 完成控制面 + 管理台 + PostgreSQL + Redis 部署；健康检查通过（`GET /api/health` 返回 200）。
2. **选择模板**：在管理台 Templates 页选择已发布的团队模板；可查看策略摘要（审批策略条数、PR Review 配置条数）。
3. **从模板创建工作区**：输入新工作区名称，提交“从模板创建工作区”。新工作区将自动继承源工作区的审批策略与 PR Review 配置。
4. **绑定知识源与入口**：在新工作区下配置知识索引、PR Review 配置（若需调整）、技能启用，与 Phase 2 能力一致。
5. **验证**：确认审批策略列表、PR Review 配置列表与预期一致；执行 `npm run smoke:phase3`（需控制面已启动）做回归验证。

## 3. 策略包导出/导入

- **导出**：管理台 Approval 页点击“导出策略包”，或调用 `GET /api/approval-policies/export?workspaceId=<id>`，保存 JSON 用于版本管理或迁移。
- **导入**：在目标工作区下，Approval 页粘贴导出 JSON（或含 `policies` 数组的结构），点击“导入策略包”；或调用 `POST /api/approval-policies/import`，body：`{ workspaceId, policies: [...] }`。导入后每条策略生成新 policyId，可在管理台编辑或删除。

## 3.1 从技能仓引入技能

- **浏览技能仓**：管理台「技能仓」Tab 调用 `GET /api/skills/registry/packages` 展示包列表；点击某包后调用 `GET /api/skills/registry/packages/:packageId/versions` 展示版本列表。
- **引入到当前工作区**：在版本列表中，对 status=published 的版本点击「引入到当前工作区」；请求 `POST /api/skills/packages`，body：`{ workspaceId, sourceType: "registry", sourceRef: "packageId@version" }`（如 `e2e-registry-pkg@1.0.0`）。成功后该技能包在工作区中为 status=imported，需在 Skills 页继续完成审核、批准、灰度/发布流程。
- **检查项**：仅 published 版本可引入；包或版本不存在返回 404，未发布版本返回 400；引入后可在 Skills 页看到新包并走 Phase 2 技能治理流程。

## 4. 检查清单（新环境首次验证）

- [ ] 技能仓：`GET /api/skills/registry/packages` 返回 200；管理台技能仓页可浏览包与版本，并完成一次「引入到当前工作区」闭环（需 DB 与种子数据）。

- [ ] 控制面、管理台、PostgreSQL、Redis 按部署文档就绪。
- [ ] `GET /api/health` 返回 200，且 DB/Redis 状态正常。
- [ ] 可创建模板、从模板创建工作区，且新工作区含复制后的审批策略与 PR Review 配置。
- [ ] 策略包导出/导入在管理台可完成，且数据一致。
- [ ] `npm run smoke:phase2`、`npm run smoke:phase3` 通过（控制面已启动时）。

## 5. 回滚与异常处理

- **从模板创建的工作区需撤销**：删除该工作区下相关资源（审批策略、PR 配置等）或通过管理台/API 删除工作区（若支持）；数据层面需按实际数据模型执行删除或归档。
- **策略包误导入**：在管理台 Approval 页删除误导入的策略（按 policyId 删除）；或通过 API `DELETE /api/approval-policies/:policyId` 逐条删除。
- **部署或依赖故障**：参考 [OpenCrab-Phase1-Ops-Runbook](OpenCrab-Phase1-Ops-Runbook.md) 的告警与回滚章节；Compose 环境可 `docker compose down` 后按部署文档重新拉起并检查数据卷与配置。

## 6. 参考

- 接口契约：[OpenCrab-Phase3-Interface-Contract-Pack](OpenCrab-Phase3-Interface-Contract-Pack.md)
- 部署模板：[OpenCrab-Deployment-Template](OpenCrab-Deployment-Template.md)
- Phase 1 值守与回滚：[OpenCrab-Phase1-Ops-Runbook](OpenCrab-Phase1-Ops-Runbook.md)
- Phase 3 验收包：[OpenCrab-Phase3-Pilot-Acceptance-Pack](OpenCrab-Phase3-Pilot-Acceptance-Pack.md)
