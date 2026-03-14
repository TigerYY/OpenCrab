# OpenCarb 技术实施策略

## 1. 文档目的

本文回答一个关键实施问题：`OpenCarb` 在后续产品开发中，应如何基于 `OpenClaw` 的已有成果和代码落地。重点是明确哪些能力适合直接复用，哪些能力必须自研，以及仓库和模块应如何拆分，才能兼顾落地速度、长期维护和上游兼容性。

## 2. 先给结论

不建议“从头重做”，也不建议“长期 fork `OpenClaw` 后深度魔改”。

推荐策略是：

- `OpenClaw` 作为执行内核复用。
- `OpenCarb` 独立仓库实现企业控制面。
- 通过适配层把工作区、权限、审计、模型路由和技能治理映射给 `OpenClaw Runtime`。

一句话概括：

`OpenCarb` 应采用“复用内核，外置控制面”的实施路线。

## 3. 三种实施路线对比

### 3.1 路线 A：完全从零开发

做法：

- 不依赖 `OpenClaw`，从零实现 runtime、session、skills、ACP、工具链和执行框架。

优点：

- 架构完全自主。
- 不受上游演进约束。

缺点：

- 重复建设成本极高。
- 要重做 `OpenClaw` 已经成熟的 runtime 和 skill 体系。
- 首版交付周期过长，不利于 `MVP` 和试点。

结论：

- 不适合作为当前阶段的首选方案。

### 3.2 路线 B：长期 fork 后深度修改 `OpenClaw`

做法：

- `clone` 或 `fork` 一份 `OpenClaw`，直接在原仓内加入企业版逻辑。

优点：

- 前期启动最快。
- 调试集成点较直接。

缺点：

- 企业控制面会和执行内核高度耦合。
- 后续同步 `OpenClaw` 上游更新的成本会迅速升高。
- 一旦权限、审计、模型治理等能力大量侵入 runtime，就很难维持代码边界。

结论：

- 适合作为短期 PoC 验证方式，不适合作为长期产品主路径。

### 3.3 路线 C：独立构建 `OpenCarb`，复用 `OpenClaw` 执行内核

做法：

- `OpenCarb` 独立仓开发。
- 将 `OpenClaw` 作为依赖、子模块、服务依赖或受控 runtime 引入。
- 通过适配层把企业控制语义传递给 `OpenClaw`。

优点：

- 能直接复用成熟 runtime、ACP 和 skills 机制。
- 企业能力和上游 runtime 解耦，便于演进。
- 更适合做部门级/工作组级产品和后续私有化交付。

缺点：

- 前期需要设计清晰的边界和适配层。
- 集成复杂度高于简单 fork。

结论：

- 这是 `OpenCarb` 最合适的长期实施路线。

## 4. 推荐总体策略

### 4.1 基本原则

- 复用 `OpenClaw` 已成熟的执行能力。
- 企业控制面全部由 `OpenCarb` 自己掌握。
- 不让 `OpenCarb` 的权限、审计和审批逻辑侵入到 `OpenClaw` 内部深处。
- 通过稳定的适配边界跟随上游升级。

### 4.2 核心判断

`OpenClaw` 解决的是“agent 如何执行”；`OpenCarb` 解决的是“企业里谁能执行、执行什么、怎么审计、何时审批、如何安全接入模型和知识”。

因此：

- 执行层复用 `OpenClaw`
- 控制层建设 `OpenCarb`

## 5. 复用与自研边界

### 5.1 直接复用的能力

以下内容建议直接复用或尽量兼容复用：

- `OpenClaw Runtime`
- ACP bridge
- skills 目录结构和 `SKILL.md` 规范
- 部分现成工具调用模式
- 会话执行与 skill 调度基础逻辑

### 5.2 必须自研的能力

以下内容不建议塞进 `OpenClaw` 内部，而应由 `OpenCarb` 独立实现：

- 工作区与团队管理
- Identity / RBAC
- Policy Engine
- Audit Service
- Model Proxy / Model Router
- Knowledge Service
- Skill Manager
- 审批流与挂起恢复机制
- Web 管理台

## 6. 模块矩阵

| 模块 | 建议策略 | 原因 |
| --- | --- | --- |
| Agent Runtime | 复用 `OpenClaw` | 已成熟，不值得重做 |
| ACP 接入 | 复用 + 封装 | 保留 IDE 集成能力，同时绑定企业身份 |
| Skills 规范 | 兼容复用 | 沿用生态和现有 skill 结构 |
| Skill 治理 | 自研 | 企业需要审批、签名、版本锁定 |
| 模型调用 | 自研代理 | 需要统一路由、脱敏、审计 |
| 知识检索 | 自研服务 | 需要权限过滤和工作区隔离 |
| 工作区与权限 | 自研 | 企业控制面核心 |
| 审计与审批 | 自研 | 企业采购关键能力 |
| 管理台 | 自研 | `OpenClaw` 不覆盖该类企业控制界面 |

## 7. 推荐仓库组织

### 7.1 仓库策略

推荐采用独立主仓：

- `opencarb/`：企业产品主仓
- `OpenClaw`：作为依赖、子模块、服务镜像或独立 runtime 接入

### 7.2 推荐模块结构

```text
opencarb/
  apps/
    control-plane/
    web-console/
    ide-gateway/
  services/
    model-proxy/
    knowledge-service/
    audit-service/
    skill-manager/
  adapters/
    openclaw-runtime-adapter/
    acp-session-adapter/
  integrations/
    git/
    docs/
    idp/
  docs/
```

### 7.3 为什么不把主逻辑写在 `OpenClaw` 仓库里

- 企业逻辑会污染上游 runtime 边界。
- 难以管理自己产品节奏。
- 升级会变成“大 fork 合并工程”。

## 8. OpenClaw 的接入方式建议

### 8.1 PoC 阶段

可以临时：

- `fork/clone` 一份 `OpenClaw`
- 用于阅读源码、验证 session/ACP/skills 集成点
- 允许保留少量临时 patch

但这一阶段的 patch 不应成为企业版长期主线。

### 8.2 MVP 阶段

推荐：

- `OpenCarb` 独立仓库
- 通过 `Runtime Adapter` 接入 `OpenClaw Runtime`
- 通过 `ACP Adapter` 绑定 IDE 会话与工作区
- 通过 `Approved Skill View` 控制 runtime 可见技能

### 8.3 企业化阶段

进一步收敛为：

- `OpenClaw` 作为受控执行服务
- `OpenCarb` 全面负责模型、知识、策略、审计、审批和控制台
- 上游升级通过兼容矩阵和适配层回归来完成

## 9. 分阶段实施建议

### 9.1 Phase A：技术验证

目标：

- 验证 `OpenClaw Runtime`、ACP 和 skills 的接入边界。
- 验证企业工作区上下文是否能顺利映射到 runtime session。

产出：

- `Runtime Adapter` PoC
- Session 映射原型
- 技能可见性原型

### 9.2 Phase B：MVP

目标：

- 跑通部门级团队的最小闭环。

重点：

- 工作区管理
- 模型代理
- 知识检索
- 审计闭环
- IDE + Web 管理台
- 轻量 PR review

### 9.3 Phase C：企业化增强

目标：

- 让平台具备更强的治理和复制能力。

重点：

- 通用审批流
- 技能灰度和私有技能仓
- 成本和质量看板
- 标准化部署模板

## 10. 升级与维护策略

### 10.1 保持边界稳定

长期只允许以下边界与 `OpenClaw` 耦合：

- Session 适配
- ACP 接入
- Skill 可见性
- 工具包装层
- Runtime 调用协议

### 10.2 建立兼容矩阵

建议维护一份兼容表：

- `OpenCarb` 版本
- 兼容的 `OpenClaw` 版本
- 支持的 ACP 能力
- 支持的 skill 能力

### 10.3 上游升级策略

- 先升级适配环境，不直接改企业主逻辑。
- 用回归测试验证 session、skill、tool、audit 是否仍正常。
- 只有适配层稳定后再进入主版本升级。

## 11. 主要风险与应对

### 风险 1：过早深度 fork

后果：

- 企业版和上游完全绑死。

应对：

- 只允许短期验证期存在临时 fork，正式开发切回独立主仓。

### 风险 2：把控制面做进 runtime

后果：

- 后期难维护、难审计、难升级。

应对：

- 所有权限、审计、审批、模型路由都放在 `OpenCarb` 控制面。

### 风险 3：边界不清导致模块重复

后果：

- 同一个能力在 runtime 和控制面重复实现。

应对：

- 明确一条总规则：执行交给 `OpenClaw`，裁决交给 `OpenCarb`。

## 12. 最终建议

`OpenCarb` 的正确实施方式不是“从零重做”，也不是“长期 fork 后深度改造 `OpenClaw`”，而是：

1. 短期可基于 `OpenClaw` clone/fork 做技术验证。
2. 正式产品开发采用独立 `OpenCarb` 主仓。
3. `OpenClaw` 作为执行内核复用。
4. 企业能力全部外置到 `OpenCarb` 控制面。

这样做的好处是：

- 前期起步快
- 中期边界清晰
- 后期能持续跟进 `OpenClaw` 上游成果
- 更适合企业产品的长期演进和私有化交付
