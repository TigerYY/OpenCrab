import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const now = new Date().toISOString();

const uatReportPath = resolve(
  root,
  "Docs/OpenCrab/OpenCrab-Phase1-UAT-Execution-Report.md"
);
const closeoutPath = resolve(
  root,
  "Docs/OpenCrab/OpenCrab-Phase1-Closeout-Review.md"
);

const hasUatReport = existsSync(uatReportPath);
const uatSummary = hasUatReport
  ? readFileSync(uatReportPath, "utf8").slice(0, 400)
  : "UAT report not found.";

const content = `# OpenCrab Phase 1 关闭评审（自动模板）

- 生成时间: ${now}
- 生成方式: scripts/generate-phase1-closeout.mjs

## 自动检查项

- UAT 执行报告存在: ${hasUatReport ? "YES" : "NO"}
- 推荐动作: ${hasUatReport ? "进入签收评审" : "先运行 npm run uat:phase1"}

## UAT 摘要（自动截取）

\`\`\`
${uatSummary}
\`\`\`

## Phase 1 验收结论（待人工填写）

- 场景A 代码问答: 待填写
- 场景B 轻量PR Review: 待填写
- 场景C Onboarding问答: 待填写
- 治理与合规: 待填写
- 指标达成: 待填写

## 进入 Phase 2 建议（待人工填写）

- 结论: 待填写
- 风险: 待填写
- 下一阶段 owner: 待填写
`;

writeFileSync(closeoutPath, content, "utf8");
console.log(`Generated closeout template: ${closeoutPath}`);
