# OpenCarb Phase 1 Ops Runbook

## 1. 文档目的

本文定义 `Phase 1` 试点期间的运行手册，覆盖上线、值守、告警、回滚、审批卡单和审计追查。目标是让团队在没有完整平台化运维体系前，仍能安全支撑试点。

## 2. 适用范围

- `OpenCarb Control Plane`
- `Model Router`
- `Knowledge Service`
- `Audit Service`
- `Approval / Job Orchestrator`
- `IDE / Web / PR Webhook` 入口

## 3. 值守角色

| 角色 | 职责 |
| --- | --- |
| `Oncall-Backend` | 控制面、策略、审批、审计 |
| `Oncall-AI` | 模型路由、知识问答质量 |
| `Oncall-Platform` | 环境、网络、部署、身份接入 |
| `Oncall-Sec` | 外发拦截、风险事件、审计复核 |
| `PM` | 升级协调、试点沟通 |

## 4. 环境约定

| 环境 | 用途 | 说明 |
| --- | --- | --- |
| `dev` | 开发联调 | 可快速验证接口变更 |
| `staging` | 集成验证 | 与试点配置尽量一致 |
| `pilot` | 试点环境 | 仅接入试点团队 |

## 5. 上线步骤

1. 确认工作区配置与模型白名单已冻结
2. 确认试点仓库与文档源绑定正确
3. 在 `staging` 完成回归验证：
   - 代码问答
   - onboarding 问答
   - PR review webhook
   - 审计查询
   - 两类最小审批
4. 发布到 `pilot`
5. 验证关键链路：
   - Session 创建
   - Model Router 决策
   - Knowledge 检索
   - 审计写入
6. 通知试点团队开始使用

## 6. 回滚条件

出现以下任一情况立即回滚：

- 控制面不可用，无法创建 session
- 模型路由持续失败，且外部回退也不可用
- 审计事件无法写入
- 最小审批触发后任务无法恢复/终止
- 工作区隔离异常

## 7. 回滚步骤

1. 暂停试点入口流量
2. 切回上一版本控制面
3. 保留当前审计与审批数据，不回滚数据层
4. 验证核心链路恢复
5. 向试点团队同步影响范围与恢复时间

## 8. 告警分级

| 等级 | 示例 | 响应要求 |
| --- | --- | --- |
| `P1` | 控制面不可用、工作区越权、审计全量失败 | 15 分钟内响应 |
| `P2` | 模型路由失败率升高、审批卡单 | 30 分钟内响应 |
| `P3` | 单次索引失败、单仓 PR webhook 异常 | 当天处理 |

## 9. 常见故障处理

### 9.1 模型路由失败

- 检查内网模型网关连通性
- 检查 fallback 是否被策略禁用
- 检查 `Model Router` 最近错误日志
- 若外部回退也不可用，临时降级为“仅检索返回，不执行生成”

### 9.2 知识索引失败

- 检查 Git / Docs 连接状态
- 检查最近一次 `IndexJob` 失败原因
- 允许对单个知识源重试，不全量重建

### 9.3 审批卡单

- 检查审批单状态是否超时
- 确认审批人映射是否生效
- 必要时由 `SecurityAdmin` 人工终止挂起任务

### 9.4 PR Webhook 异常

- 检查 webhook 入参是否合法
- 检查 review job 是否成功排队
- 检查回写目标平台是否可访问

## 10. 审计追查流程

1. 获取 `traceId`
2. 查询 `Audit Service`
3. 关联模型调用、知识检索、技能使用、审批结果
4. 输出事件时间线给 `Sec / PM / Tech Lead`

## 11. Day-2 运维动作

- 每日检查：
  - 审计事件完整率
  - 内网模型命中率
  - 索引成功率
  - 审批超时单
- 每周检查：
  - 周活跃率
  - 试点反馈
  - 回滚演练结果

## 12. 值守联系人模板

| 角色 | 姓名 | 联系方式 | 备注 |
| --- | --- | --- | --- |
| Oncall-Backend | Tiger Yang | Tiger Yang | 统一责任人 |
| Oncall-AI | Tiger Yang | Tiger Yang | 统一责任人 |
| Oncall-Platform | Tiger Yang | Tiger Yang | 统一责任人 |
| Oncall-Sec | Tiger Yang | Tiger Yang | 统一责任人 |
| PM | Tiger Yang | Tiger Yang | 统一责任人 |
