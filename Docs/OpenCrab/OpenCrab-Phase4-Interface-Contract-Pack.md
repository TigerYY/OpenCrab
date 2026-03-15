# OpenCrab Phase 4 Interface Contract Pack

## 1. 文档目的

本文定义 Phase 4 团队复制与轻治理相关的新增或扩展接口契约骨架（如 SSO-lite、模板与轻治理）。与 Phase 1/2/3 契约并存；具体 API 在 Phase 4 启动后细化。

## 2. 契约原则

- 新增 API 沿用现有约定：Header（X-Trace-Id, X-Workspace-Id, X-Channel-Type 等）、统一响应结构、错误码风格。
- 组织级资源建议增加组织 ID 或租户上下文，与工作区级 API 区分时采用路径或 query 约定。
- 身份与策略相关接口需考虑与 IdP/SSO 的集成方式，在设计中明确。

## 3. 规划中的能力与 API 方向（待细化）

| 能力 | 方向 | 状态 |
|------|------|------|
| 组织/身份 | 组织列表、组织-工作区映射、角色同步（或与 IdP 回调对接） | 规划 |
| 组织级策略 | 策略继承、合规策略 CRUD、策略生效范围 | 规划 |
| 数据分级/保留 | 策略配置 API、策略在检索/存储中的生效与审计 | 规划 |
| 密钥/敏感数据 | 密钥配置或 KMS 对接、审计事件扩展 | 规划 |

## 4. 通用约定

与 [OpenCrab-Phase1-Interface-Contract-Pack](OpenCrab-Phase1-Interface-Contract-Pack.md) 一致：同一 Header、同一响应结构；错误码扩展时追加新码并文档化。

## 5. 版本与兼容

- Phase 4 新增路径置于现有 `/api` 下，不引入 `/v2` 除非有破坏性变更。
- 现有 Phase 1-3 接口保持不变，Phase 4 在其上增加“组织级”能力与可选上下文。
