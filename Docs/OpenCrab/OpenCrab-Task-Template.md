# OpenCrab 任务卡模板

用于统一单次开发任务的描述格式，便于 AI IDE 与人类协作者对齐边界、DoD 与验收方式。每个任务尽量在 0.5–2 天内完成，且具备可运行验证。

---

## 模板

```markdown
## 任务：[简短标题]

- **目标**：（一句话说明要达成什么结果）
- **边界**：（在哪些模块/接口/页面内改动；不涉及哪些区域）
- **DoD**：
  - [ ] （列出必须完成项，如：某 API 可用、某测试通过、某文档已更新）
- **验证方法**：（如何证明完成，如：调用某接口返回预期、跑通 smoke、或具体手工步骤）
- **回滚方式**：（若合并或上线后出问题如何回退，如：revert 某 commit、关闭某配置）
- **负责人**：（可选；多人时填写）
- **备注**：（可选；依赖、参考文档、风险提示）
```

---

## 示例

```markdown
## 任务：工作区列表 API 支持按名称过滤

- **目标**：GET /api/workspaces 支持 query 参数 name 的模糊过滤，便于管理台搜索。
- **边界**：仅改 workspace.controller、workspace.repository 与对应 DTO；不改前端与审计。
- **DoD**：
  - [ ] list-workspaces.dto.ts 增加可选 name?: string。
  - [ ] repository 层支持 name 过滤（ILIKE 或等价）。
  - [ ] 现有 workspace 集成测试仍通过；新增一条带 name 的用例。
  - [ ] Phase 1 接口契约文档中 GET /api/workspaces 补充 name 参数说明。
- **验证方法**：curl 带 name=xxx 返回过滤结果；npm run test 通过；npm run smoke:phase1 通过。
- **回滚方式**：revert 本任务提交；前端未依赖 name 参数，无需同步回滚。
- **负责人**：（留空）
- **备注**：参考 OpenCrab-Phase1-Interface-Contract-Pack.md 中 workspace 列表约定。
```

---

## 使用说明

- 从 Phase Backlog 或需求拆出的**单次开发任务**，建议用本模板填一卡再开工。
- 与 `OpenCrab-Engineering-Playbook.md` 中的“执行层五项”一致；DoD 需覆盖 Playbook 中的最小 DoD（build、test、相关 smoke、文档若适用）。
- 提交前需满足 `OpenCrab-Change-Checklist.md` 中的检查项。
