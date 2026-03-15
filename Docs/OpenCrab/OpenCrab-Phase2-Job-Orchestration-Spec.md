# OpenCrab Phase 2 Job Orchestration Spec

## 1. 目标

统一承载索引、PR review、审批恢复、批量任务与定时任务，形成 `OpenCrab` 的后台作业系统。

## 2. 适用任务

- 大仓库索引
- 文档增量同步
- PR review 批量处理
- 审批后恢复任务
- 定时体检与指标聚合

## 3. 设计原则

- 作业系统属于 `OpenCrab Control Plane`
- runtime 只消费单次执行任务，不负责作业编排
- 所有作业状态必须可查询、可重试、可终止

## 4. 状态流转

| 状态 | 含义 |
| --- | --- |
| `queued` | 已入队 |
| `running` | 执行中 |
| `waiting_approval` | 等待审批 |
| `retrying` | 自动重试中 |
| `completed` | 完成 |
| `failed` | 失败 |
| `terminated` | 人工或系统终止 |

## 5. 核心字段

| 字段 | 说明 |
| --- | --- |
| `jobId` | 作业 ID |
| `jobType` | 索引、review、approval-resume 等 |
| `workspaceId` | 工作区 |
| `priority` | 优先级 |
| `traceId` | 追踪 ID |
| `retryCount` | 重试次数 |
| `maxRetries` | 最大重试 |

## 6. 幂等要求

- 同一 `sourceRef + triggerRef` 不重复创建索引作业
- 同一 `prNumber + commitSha` 不重复创建 review 结果
- 同一审批单只允许一次恢复动作成功

## 7. 重试与死信

- 默认重试 3 次
- 超过阈值进入死信队列
- 死信任务需由管理员确认是重放、忽略还是终止

## 8. 与审批的关系

- 命中审批时，作业状态切为 `waiting_approval`
- 审批通过后切为 `queued`
- 审批拒绝或超时后切为 `terminated`

## 9. 管理台需求

- 作业列表
- 作业详情
- 重试/终止操作
- 死信任务视图

## 10. 验收标准

- 三类以上任务可统一进作业系统
- 作业状态可追溯到入口和工作区
- 重试和死信行为均可审计
