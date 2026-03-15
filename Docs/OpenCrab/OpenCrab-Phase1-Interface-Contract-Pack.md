# OpenCrab Phase 1 Interface Contract Pack

## 1. 文档目的

本文定义 `Phase 1` 的最小接口与事件契约，目标是为并行开发、联调和验收提供统一合同。范围只覆盖 `Phase 1 MVP`，不引入 `Phase 2` 的通用审批编排或多环境高级治理。

## 2. 契约原则

- 统一使用 `Model Router` 作为模型访问层主命名。
- 所有请求必须带 `traceId` 与 `workspaceId`。
- 鉴权在控制面完成，`OpenClaw Runtime` 不负责最终权限裁决。
- 接口优先保证最小闭环，不为未来扩展过度设计。

## 3. 通用约定

### 3.1 Header

| Header | 必填 | 说明 |
| --- | --- | --- |
| `Authorization` | 是 | 管理台或服务间鉴权 |
| `X-Trace-Id` | 是 | 全链路追踪 ID |
| `X-Workspace-Id` | 是 | 工作区隔离边界 |
| `X-Channel-Type` | 是 | `ide` / `web` / `pr_webhook` |

### 3.2 通用响应结构

```json
{
  "code": "OK",
  "message": "success",
  "data": {},
  "traceId": "trc_xxx"
}
```

### 3.3 错误码

| 错误码 | 含义 | 建议处理 |
| --- | --- | --- |
| `UNAUTHORIZED` | 鉴权失败 | 重新认证 |
| `FORBIDDEN` | 无工作区或角色权限 | 提示联系管理员 |
| `WORKSPACE_NOT_FOUND` | 工作区不存在 | 检查上下文或配置 |
| `POLICY_BLOCKED` | 命中策略硬拦截 | 返回拦截原因 |
| `PENDING_APPROVAL` | 命中最小审批 | 返回审批单号 |
| `MODEL_ROUTE_FAILED` | 模型路由失败 | 记录并触发回退 |
| `INDEX_NOT_READY` | 知识索引不可用 | 返回来源不足提示 |
| `RUNTIME_EXECUTION_FAILED` | runtime 执行失败 | 记录并提示重试 |

## 4. Session Gateway

### 4.1 创建统一会话上下文

- 接口：`POST /api/session/context`
- 目的：把外部入口请求映射为控制面内部标准 session

#### Request

```json
{
  "userId": "u_123",
  "workspaceId": "ws_001",
  "channelType": "ide",
  "resourceContext": {
    "repo": "repo-a",
    "branch": "feature/demo",
    "filePath": "src/app.ts"
  }
}
```

#### Response

```json
{
  "code": "OK",
  "data": {
    "sessionId": "sess_001",
    "policyContext": {
      "modelPolicyId": "mp_default",
      "toolPolicyId": "tp_default"
    },
    "runtimeSessionRef": "rt_001"
  },
  "traceId": "trc_001"
}
```

#### 验收

- 返回的 `policyContext` 可直接供 `Runtime Adapter` 使用
- 所有入口共享相同 session schema

## 5. Model Router

### 5.1 模型决策接口

- 接口：`POST /api/model-router/decide`
- 目的：根据任务类型与策略返回可执行 deployment

#### Request

```json
{
  "workspaceId": "ws_001",
  "taskType": "qa",
  "sensitivity": "internal",
  "preferredProvider": "local",
  "fallbackAllowed": true
}
```

#### Response

```json
{
  "code": "OK",
  "data": {
    "provider": "local-gateway",
    "deployment": "qwen-internal",
    "decision": "allow",
    "fallbackChain": [
      "qwen-internal",
      "external-claude"
    ]
  },
  "traceId": "trc_002"
}
```

### 5.2 模型执行接口

- 接口：`POST /api/model-router/invoke`
- 目的：执行最终模型请求，并把调用纳入审计

#### 特殊返回

- 若命中最小审批，返回：

```json
{
  "code": "PENDING_APPROVAL",
  "message": "restricted outbound requires approval",
  "data": {
    "approvalTicketId": "apv_001"
  },
  "traceId": "trc_003"
}
```

## 6. Knowledge Service

### 6.1 创建索引任务

- 接口：`POST /api/knowledge/index-jobs`

#### Request

```json
{
  "workspaceId": "ws_001",
  "sources": [
    {"type": "git", "ref": "repo-a"},
    {"type": "docs", "ref": "wiki-space-a"}
  ],
  "mode": "initial"
}
```

### 6.2 查询检索结果

- 接口：`POST /api/knowledge/retrieve`

#### Request

```json
{
  "workspaceId": "ws_001",
  "query": "如何调用内部短信接口",
  "topK": 5
}
```

#### Response

```json
{
  "code": "OK",
  "data": {
    "chunks": [
      {
        "sourceType": "git",
        "sourceRef": "repo-a/src/service/sms.ts",
        "snippet": "sendSms(...)",
        "score": 0.91
      }
    ]
  },
  "traceId": "trc_004"
}
```

#### 验收

- 返回结果必须是“已权限过滤后的片段”
- 返回中必须带来源引用信息

## 7. Audit Service

### 7.1 写入审计事件

- 接口：`POST /api/audit/events`

#### Event Schema

```json
{
  "eventType": "model.invoke",
  "workspaceId": "ws_001",
  "userId": "u_123",
  "traceId": "trc_005",
  "policyDecision": "allow",
  "resourceRef": "repo-a/src/app.ts"
}
```

### 7.2 查询审计事件

- 接口：`GET /api/audit/events`
- 查询维度：`workspaceId`、`userId`、`eventType`、`modelDeployment`、`skillName`、时间区间

## 8. Approval + Job Orchestrator

### 8.1 创建审批单

- 接口：`POST /api/approvals`
- 触发场景：
  - 高风险技能首次启用
  - 受限内容外发到外部模型

### 8.2 审批动作

- 接口：`POST /api/approvals/{ticketId}/decision`

#### Request

```json
{
  "decision": "approved",
  "comment": "allow for pilot"
}
```

### 8.3 作业恢复

- 接口：`POST /api/jobs/{jobId}/resume`
- 语义：
  - `approved` -> `resume`
  - `rejected` -> `terminate`
  - `timeout` -> `terminate`

## 9. PR Webhook

### 9.1 Review 入口

- 接口：`POST /api/integrations/pr-review/webhook`

#### Request

```json
{
  "workspaceId": "ws_001",
  "repo": "repo-a",
  "prNumber": 1024,
  "diffRef": "abc123...def456"
}
```

#### Response

```json
{
  "code": "OK",
  "data": {
    "jobId": "job_pr_001",
    "status": "queued"
  },
  "traceId": "trc_006"
}
```

## 10. 版本与兼容

- `Phase 1` 接口统一以 `v1` 为默认契约版本
- 允许字段新增，不允许字段语义反转
- 任何 breaking change 需要先更新本文档，再更新 `opencrabmvp`

## 11. 联调出口标准

- Session Gateway、Model Router、Knowledge Service、Audit、Approval、PR Webhook 均有最小 happy path
- 所有关键失败场景都有错误码
- 审计与审批事件共享 `traceId`
