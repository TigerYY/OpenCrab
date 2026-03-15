# OpenCrab Phase 2 Observability Metrics Definition

## 1. 文档目的

本文定义 `Phase 2` 的可观测性与指标口径，用于统一管理台展示、验收和后续运营分析。

## 2. 指标分层

### 2.1 业务采纳指标

| 指标 | 定义 |
| --- | --- |
| `WAU` | 周内至少发起一次有效请求的用户数 |
| `Workspace Adoption Rate` | 使用人数 / 工作区总授权人数 |
| `Pilot Retention` | 连续两周活跃的试点用户比例 |

### 2.2 质量指标

| 指标 | 定义 |
| --- | --- |
| `Answer Satisfaction` | 有反馈样本中的正向评价比例 |
| `Knowledge Hit Rate` | 有来源且被用户认可的回答比例 |
| `PR Review Signal Accuracy` | 有效 review 建议 / review 总建议数 |

### 2.3 治理指标

| 指标 | 定义 |
| --- | --- |
| `Audit Completeness` | 关键事件链完整记录比例 |
| `Approval Trigger Rate` | 命中审批的请求比例 |
| `Approval Timeout Rate` | 超时审批单 / 审批单总数 |
| `External Fallback Rate` | 使用外部模型回退的请求比例 |

### 2.4 平台运行指标

| 指标 | 定义 |
| --- | --- |
| `P50/P95 Latency` | 请求时延分位值 |
| `Job Success Rate` | 作业成功率 |
| `Index Freshness` | 知识源最后成功同步距今时间 |
| `Model Error Rate` | 模型调用失败率 |

## 3. 维度

- 工作区
- 入口类型
- 模型 deployment
- 技能
- 作业类型
- 时间区间

## 4. 告警建议

| 告警 | 阈值 |
| --- | --- |
| 审计完整率下降 | `< 95%` |
| 外部回退率异常升高 | `> 20%` |
| 问答 P95 时延 | `> 20s` |
| 审批超时率 | `> 5%` |

## 5. 管理台最小看板

- 采纳率看板
- 模型与成本看板
- 审批与审计看板
- 作业健康看板
- PR review 效果看板

## 6. 验收标准

- 所有指标有明确计算口径
- 看板指标可追溯到源事件
- 治理指标与审计事件共享 `traceId`
