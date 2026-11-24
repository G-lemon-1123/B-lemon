# 文档索引与手册说明

本目录是「小步星球」MVP v0.5 的全部项目文档，内容与《小步星球_产品需求与团队AI使用指南_v0.5.docx》一致。Word 原件由整合负责人保管，不放进仓库（含内部材料）；本目录的 Markdown 才是团队协作与评审的依据。

| 项目 | 内容 |
|---|---|
| 文档版本 | v0.5 |
| 更新日期 | 2026-11-12 |
| 当前阶段 | 两周 MVP · 文档阶段（只交付文档，不创建应用代码或项目骨架） |
| 文档负责人 | 项目整合负责人 |
| 适用对象 | 项目组、指导老师、心理老师、评审 |
| 开发方式 | 全员使用 DeepSeek Harness（DSH）辅助开发 |

## 仓库文档一览

| 文件 | 内容 | 维护人 | 谁该读 |
|---|---|---|---|
| [PRD.md](PRD.md) | 产品需求文档：定位、范围、10 个情景、四种情绪、家长控制、隐私、技术方案、验收标准 | 整合负责人 | 全员、评审 |
| [CONTRACTS.md](CONTRACTS.md) | 接口合同：InputSource、ScenarioGame、EmotionSource、FeedbackService、AdaptiveEngine | 整合负责人 | 全员；改动前必须经整合负责人 |
| [AI-GUIDE-01-gesture-integration.md](AI-GUIDE-01-gesture-integration.md) | 手势识别 + 21 号整合指南 | 整合负责人 | 你（项目负责人） |
| [AI-GUIDE-02-shell.md](AI-GUIDE-02-shell.md) | 应用壳与家长流程指南 | 成员 B | 成员 B |
| [AI-GUIDE-03-cards.md](AI-GUIDE-03-cards.md) | 手势情景选择指南 | 成员 C | 成员 C |
| [AI-GUIDE-04-emotion.md](AI-GUIDE-04-emotion.md) | 情绪镜像指南 | 成员 D | 成员 D |
| [AI-GUIDE-05-feedback.md](AI-GUIDE-05-feedback.md) | 反馈、设计与 QA 指南 | 成员 E | 成员 E |
| [HANDOFF-TEMPLATE.md](HANDOFF-TEMPLATE.md) | 交接单模板，每个模块交分支时复制到自己目录的 `HANDOFF.md` | 整合负责人 | 全员 |
| [AI-REVIEW-LOG.md](AI-REVIEW-LOG.md) | AI 产出评审记录，每个 AI 产出都要登记 | 整合负责人 | 全员 |
| [GIT-WORKFLOW.md](GIT-WORKFLOW.md) | 分支、目标分支、合并顺序与禁止事项 | 整合负责人 | 全员 |
| [qa/](qa/) | 成员 E 维护的 QA 清单、验收记录 | 成员 E | 成员 E、整合负责人 |

## 四个必须先知道的边界

- **不是诊断、不是治疗。** 本产品是居家互动练习，不做能力评分，不承诺疗效。
- **10 个情景都是候选内容。** 目前全部是 `draft`，必须由心理老师逐条审核，才能改为 `reviewed`。
- **补充材料是模板，不是伦理批件。** 正式招募家庭或做试用前，需由学校/机构伦理或法务确认。
- **AI 产出必须人工验收。** DSH 可以写代码、跑测试，但不能替代人对儿童可用性和隐私的判断。

## 项目速览

| 模块 | 负责人 | 分支 | 只改目录 | 独立 demo |
|---|---|---|---|---|
| 手势识别 | 项目负责人（你） | `feat/gesture` | `src/modules/gesture/`、`demo/gesture.html`、`public/models/hand_landmarker.task`、`public/wasm/` | `/demo/gesture.html` |
| 应用壳 | 成员 B | `feat/shell` | `src/app/`、`demo/shell.html`、`src/shared/adaptive/` | `/demo/shell.html` |
| 情景卡牌 | 成员 C | `feat/cards` | `src/modules/cards/`、`content/cards.json`、`demo/cards.html` | `/demo/cards.html` |
| 情绪镜像 | 成员 D | `feat/emotion` | `src/modules/emotion/`、`content/expressions.json`、`demo/emotion.html`、`public/models/face_landmarker.task` | `/demo/emotion.html` |
| 反馈/QA | 成员 E | `feat/feedback` | `src/modules/feedback/`、`src/shared/design/`、`tests/e2e/`、`.github/workflows/`、`docs/qa/`、`demo/feedback.html` | `/demo/feedback.html` |

共享约定：

- `src/shared/contracts.ts` 由整合负责人维护，其他人只读。
- 各模块在自己的目录提供 mock（例如应用壳用 `src/app/mocks/`）；`src/shared/mocks/` 只放跨模块共享的 mock。
- 应用壳负责最终组合，其他模块不直接改主页面。

## 建议阅读路线

- **项目负责人**：先读 PRD 与合同，再读 `AI-GUIDE-01`；21 号整合时按第三部分的清单执行。
- **成员 B**：读 PRD 第 5、6、10、13 节 + 合同 + `AI-GUIDE-02`。
- **成员 C**：读 PRD 第 7 节 + 合同中的 `ScenarioGame` + `AI-GUIDE-03`。
- **成员 D**：读 PRD 第 8 节 + 合同中的 `EmotionSource` + `AI-GUIDE-04`。
- **成员 E**：读 PRD 第 11、14 节 + 合同 + `AI-GUIDE-05`。

## 文档分发建议

- 每份指南单独发：成员只需要看自己那一份，不需要从头读完整本手册。
- 只改自己的目录：跨模块改动先找整合负责人，不要直接改别人的文件。
- 21 号前推分支：每个人把自己的分支和交接单推上 Git，21 号只做整合和修复。
- 有专业问题找心理老师：10 个情景与选项不要自行改成 `reviewed`。

## 维护规则

1. 只有整合负责人可以改 `PRD.md`、`CONTRACTS.md`、`AI-GUIDE-01`、`HANDOFF-TEMPLATE.md`、`AI-REVIEW-LOG.md`。
2. 成员在自己的分支上只新增自己模块目录下的 `HANDOFF.md`，不改本目录其他文件。
3. 需要改合同字段时，先在群里说明原因，由整合负责人在 `integration` 分支同时更新 `CONTRACTS.md` 与 `src/shared/contracts.ts`，并通知所有人。
4. 如果更新了 Word 手册，必须同步本目录，并在版本记录里加一行；Word 与本目录不一致时，以本目录 + `integration` 分支为准。

## 版本记录

| 版本 | 主要变化 |
|---|---|
| v0.3 | 五模块并行、Git 分支、21 号整合、手势模块指南 |
| v0.4 | 四种情绪、一人一份 AI 指南、交接与审核模板 |
| v0.5 | 10 个社交情景、应对卡选择、家长控制、`ScenarioGame` 合同 |
| 仓库化 | 建 `iflink` 单仓库：`main` / `integration` / 五条 `feat/*` 分支，`docs/` 与 v0.5 Word 对齐 |
