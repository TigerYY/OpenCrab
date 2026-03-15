# OpenCrab Phase 2 PR Review Integration Spec

## 1. 目标

在 `Phase 1` 轻量 webhook/bot 基础上，把 PR review 升级为可配置、可治理、可追溯的企业研发协同能力。

## 2. 集成范围

- GitHub / GitLab 类代码平台
- Review 模板
- 规则集
- 回写策略
- 审计归档

## 3. 设计原则

- PR review 仍由 `OpenCrab` 控制面发起和治理
- Review 结果必须带规则来源和 trace id
- 高风险 review 行为可触发审批或人工复核

## 4. 配置维度

| 维度 | 说明 |
| --- | --- |
| 仓库 | 哪些仓库启用 review |
| 分支 | 哪些分支启用策略 |
| 规则集 | 规范、安全、质量规则 |
| 模板 | review 提示词与输出格式 |
| 回写策略 | 评论、摘要、状态检查 |

## 5. 输入输出

### 输入

- PR 元数据
- diff
- 工作区策略
- review 模板
- 规则集

### 输出

- review 评论
- 风险等级
- 命中规则列表
- 审计事件

## 6. 结果分级

| 等级 | 含义 |
| --- | --- |
| `info` | 提示类建议 |
| `warning` | 建议修正 |
| `critical` | 高风险，需要人工确认 |

## 7. 与审批关系

- 默认 review 结果不走审批
- 命中高风险自动动作时才转人工复核或审批
- 所有关键 review 输出进入审计

## 8. 验收标准

- 支持按仓库/分支配置规则
- review 结果可写回目标代码平台
- review 输出能关联审计与作业系统
