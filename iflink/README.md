# iFLink · 五号电池 · 小步星球

居家互动网页 MVP：孩子通过摄像头隔空选择社交情景的应对卡牌，并模仿四种基础表情完成「情绪小镜子」练习。目标是让孩子在成人陪伴下愿意完成一次简短练习，而不是被评分。

- 参赛项目：iFLink（五号电池队）
- 当前阶段：v0.5 文档阶段 —— 仓库里只有文档与目录占位，应用代码由各成员在自己的分支上实现
- 不诊断、不治疗、不做能力评分；10 个情景全部是 `draft`，须由心理老师逐条审核

## 仓库结构

```
docs/                      PRD、接口合同、五份成员指南、交接单模板、评审记录、Git 工作流
demo/                      五个独立 demo 的入口（gesture / shell / cards / emotion / feedback）
src/app/                   应用壳：路由、家长说明、授权、家长角、家长控制条（成员 B）
src/modules/gesture/       手势识别：摄像头、光标、捏合、挥手、手丢失（项目负责人）
src/modules/cards/         情景卡牌：10 个情景、应对卡、选对/选错（成员 C）
src/modules/emotion/       情绪镜像：四种表情、校准、匹配（成员 D）
src/modules/feedback/      音效、语音、字幕、无障碍（成员 E）
src/shared/contracts.ts    五个模块之间的接口合同（整合负责人维护，其他人只读）
src/shared/adaptive/       自适应引擎（成员 B）
src/shared/design/         视觉规范与设计令牌（成员 E）
src/shared/mocks/          跨模块共享的 mock（整合负责人）
content/                   内容文件：cards.json（C）、expressions.json（D）
public/models/             本地模型：hand_landmarker.task、face_landmarker.task
public/wasm/               MediaPipe wasm，统一由整合负责人放入
tests/e2e/                 端到端测试（成员 E）
.github/workflows/         CI（成员 E）
```

## 分支

| 分支 | 用途 |
|---|---|
| `main` | 稳定版，只有整合负责人能合 |
| `integration` | 目标分支，所有 `feat/*` 往这里合 |
| `feat/gesture` / `feat/shell` / `feat/cards` / `feat/emotion` / `feat/feedback` | 五个模块各自的工作分支 |

## 开始

```bash
git clone https://github.com/huodianditu/iflink.git
cd iflink
git switch feat/your-branch
```

先读 `docs/README.md` 找到自己那份指南，再读 `docs/PRD.md` 和 `docs/CONTRACTS.md`。分支细节、PR 目标分支、21 号合并顺序见 `docs/GIT-WORKFLOW.md`。

## 规则速记

1. 只改自己目录；跨模块改动先找整合负责人。
2. 只通过合同说话，模块之间不直接 import 内部实现。
3. 每个模块都要有能单独打开的 demo 和一份 `HANDOFF.md`。
4. 不提交儿童照片、视频、同意书、真实试用数据、密钥；不用 CDN。
5. AI 产出必须人工验收，并登记到 `docs/AI-REVIEW-LOG.md`。
