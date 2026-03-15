# OpenCrab Phase 1 UAT 执行报告

- 执行时间: 2026-03-15 02:15:41
- 执行人: Tiger Yang
- 环境: `http://localhost:3000`

## 自动执行结果

- Phase1 Smoke: PASS
- Control-plane Integration Tests: PASS
- Runtime Fallback Alerts Snapshot: captured

## 快照数据（Runtime Fallback Alerts）

```json
{"code":"OK","message":"success","data":{"windowMinutes":60,"threshold":1,"hasAlert":false,"breaches":[]},"traceId":"trc_uat_001"}
```

## 人工验收结论

- 场景A 代码问答: 通过（来源引用可见，主链路稳定）
- 场景B 轻量PR Review: 通过（Webhook 链路可用，结果可追溯）
- 场景C Onboarding问答: 通过（代码与文档定位可用）
- 安全与审批闭环验收: 通过（审计可追踪，审批状态机可用）

## 签收意见

- PM: Tiger Yang
- Tech Lead: Tiger Yang
- Sec: Tiger Yang
- Pilot Reviewer: Tiger Yang
