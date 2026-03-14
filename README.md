# OpenCrab

**AI agents for Enterprise** — 面向企业团队的可治理、可审计、可扩展 AI 助理平台。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 是什么

OpenCrab 基于 **OpenClaw** 的执行能力构建，面向**部门级与工作组级团队**，提供：

- **工作区隔离**：成员、角色、仓库、文档集、模型策略和技能集按工作区管理  
- **模型治理**：内网模型优先，受控外部模型回退，策略路由与审批  
- **知识检索**：Git 仓库、文档库、FAQ 统一索引与权限过滤  
- **技能治理**：兼容 OpenClaw `SKILL.md`，企业侧审批、版本锁定与灰度  
- **安全审计**：Prompt、工具、模型、文件访问与审批结果可追溯  

不把企业能力揉进底层 runtime，而是通过**企业控制面**统一收敛身份、工作区、模型路由、知识、技能与审计策略。

## 核心原则

| OpenClaw | OpenCrab |
|----------|----------|
| 执行 | 裁决 |
| Runtime、Session、Skills、工具执行 | 工作区、RBAC、Policy、Audit、Knowledge、Model Router、Skill Manager |

## 文档与入口

| 资源 | 说明 |
|------|------|
| [产品规划白皮书（HTML）](Docs/OpenCrab企业版产品规划.html) | 定位、架构、模块、实施策略、路线图与进展（推荐在浏览器中打开） |
| [MVP 仪表盘](Docs/opencrabmvp.html) | 阶段目标与里程碑概览 |
| [Docs/OpenCarb](Docs/OpenCarb/) | 详细设计文档：PRD、V1 范围、架构、Runtime 集成、部署安全、路线图等 |

## 推荐阅读顺序

1. [产品规划白皮书](Docs/OpenCrab企业版产品规划.html) — 建立整体认知  
2. [OpenCrab-PRD](Docs/OpenCarb/OpenCarb-PRD.md) — 产品需求与边界  
3. [OpenCrab-V1-Scope](Docs/OpenCarb/OpenCarb-V1-Scope.md) — V1 必做与不做  
4. [OpenCrab-Architecture](Docs/OpenCarb/OpenCarb-Architecture.md) — 系统分层与控制面  

## 当前阶段

- **Phase 0**：文档与架构已完成，产品规划、架构边界、实施策略与同步页面已就绪  
- **下一步**：MVP 任务拆解、Workspace Service、Runtime Adapter 与 Knowledge Service 原型开发  

## 仓库结构（规划）

```
opencrab/
  apps/           # control-plane, web-console, ide-gateway
  services/       # model-router, knowledge-service, audit-service, skill-manager
  adapters/       # openclaw-runtime-adapter, acp-session-adapter
  integrations/   # git, docs, idp
```

## License

[Apache-2.0](LICENSE)
