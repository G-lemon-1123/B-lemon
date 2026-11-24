# 应用壳模块交接单

按 `docs/HANDOFF-TEMPLATE.md` 填写。不包含儿童姓名、照片、联系方式或真实试用数据。

## 基本信息

| 项目 | 内容 |
|---|---|
| 模块 | 应用壳（页面壳、家长流程、设置、本地状态、自适应、家长控制条） |
| 负责人 | 成员 B |
| 分支 | `feat/shell` |
| Demo 地址 | `/demo/shell.html`（本地 `http://127.0.0.1:8000/demo/shell.html`） |
| 交付日期 | 2026-11-24 |
| 当前状态 | 部分可用（五个任务已完成；情景/情绪模块为 mock 或占位，浏览器人工验收待负责人确认） |

## 1. 已完成

- 页面壳与路由：欢迎、家长说明、主页、情景练习、情绪镜子（占位）、小结（占位）、家长角、休息页；顶部栏统一提供返回/休息/静音。
- 首次进入流程按 PRD §5.1：欢迎 →「开始」→ 家长说明 → 主页，不跳过知情说明。
- 家长说明页写清六件事（只在练习时申请摄像头、画面不离开本机、随时可关、鼠标可替代、只做练习、内容与情绪提醒），两个入口按钮；拒绝/失败时显示温和提示并保留鼠标出口。
- **应用壳自身不调用摄像头**：全目录无 `getUserMedia` / `mediaDevices`；摄像头只可能由手势/情绪模块在用户点击后申请。
- 家长角：主页长按约 2 秒进入（短按无效）；四种表情开关、单次情景数量（3/4/5，默认 5）、支持等级（自动/多提示/标准/少提示）、清除练习记录（二次确认，只清进度、不动设置）；隐私说明与非医疗免责声明。
- 自适应引擎 `src/shared/adaptive/`：严格按合同 §6 实现；连续 2 次失败降一级、连续 3 次「少用提示」成功升一级、一次只调一级、家长锁定后只记录不改等级；附 `MockAdaptiveEngine`。
- 家长控制条：只在 `awaiting-parent` 显示，标注「家长」，「下一步」长按 1.2 秒生效，「再试一次」仅在选错后出现，「结束练习」调用 `finish()`；**绝不自动 next()**。
- mock 组合：`MockInputSource`（键盘模拟光标/抓取/翻面，不碰摄像头）、`MockFeedbackService`（只出字幕，静音后字幕仍在）、完整版 `MockScenarioGame`（10 个演示情景，订阅 InputSource 选卡）。
- 开发控件受 URL 开关控制：默认（mock）显示阶段徽章/演示按钮/键盘提示/反馈日志；`?cards=real` 时**全部隐藏**并显示「还没有接上」占位；`?debug=1` 可强制显示。
- 本地状态全部在内存（`src/app/settings.js`），**不使用任何持久化存储**。

## 2. 未完成 / 没做

- ☐ **情绪镜子页仍是占位**（显示「位置已留好」与待接清单）。按本轮范围未实现 MockEmotionSource，需成员 D 提供真实 `EmotionSource` 或后续补 mock。
- ☐ 小结页仍是占位：星星/情景数/表情卡的数字未接（存储已有 `recordScenarioDone` 等接口，待练习闭环后调用）。
- ☐ **情景练习用的是应用壳自建的 mock 状态机**，不是成员 C 的 `src/modules/cards/`。整合时请用 `?cards=real` 切到真实模块。
- ☐ 声音/语音/摄像头预览/减少动态这四项设置未做（本轮范围只有四组：表情、数量、支持等级、清除记录）。语音与音效实现属于成员 E。
- ☐ 平板真机、手机真机的视觉验收（开发环境无浏览器可用，只有逻辑级验证）。

## 3. 怎么运行

本分支**还没有 `package.json` / vite**（骨架提交尚未并入），因此不能用 `pnpm dev`：

```
# 任选一种静态服务器，在仓库根目录执行
python -m http.server 8000
# 或
npx serve -l 8000
```

然后打开：

```
http://127.0.0.1:8000/demo/shell.html
```

注意：
- **不能直接双击 HTML 打开**：页面用 ES 模块，`file://` 下会被浏览器 CORS 拦截。`demo/shell.html` 里已内置提示，会告诉用户该怎么起服务。
- 可用 URL 参数：`?cards=real|mock`、`?debug=1`、`?input=pointer|gesture`、`?emotion=real|mock`、`?bot=1`。
- 单元测试直接用 Node 跑，不需要装任何依赖：
  ```
  node src/shared/adaptive/adaptive-engine.test.js
  node src/app/components/parent-control-bar.test.js
  node src/app/mocks/mock-services.test.js
  ```

## 4. 怎么整合进主应用

- 入口文件：`src/app/main.js` 导出 `createApp({ root })`；`demo/shell.html` 通过 `<script type="module" src="../src/app/main.js">` 加载。
- 需要注入的依赖（`AppDependencies`）：目前由页面各自取单例——
  - `InputSource`：`src/app/mocks/mock-input-source.js` 的 `getMockInputSource()`（真实手势模块见成员分支 `createGestureInput()`）。
  - `ScenarioGame`：`src/app/mocks/mock-scenario-game.js` 的 `getMockScenarioGame()`。
  - `FeedbackService`：`src/app/mocks/mock-feedback-service.js` 的 `getMockFeedback()`。
  - `AdaptiveEngine`：`src/app/mocks/mock-scenario-game.js` 的 `getMockAdaptive()`（内部用 `src/shared/adaptive/` 的 `createAdaptiveEngine()`）。
  - `EmotionSource`：**未接**，情绪页仍占位。
- 需要替换的 mock：情景 `MockScenarioGame` → 成员 C 的 `ScenarioGame`；反馈 `MockFeedbackService` → 成员 E 的 `FeedbackService`；输入 `MockInputSource` → 成员的真实手势 `InputSource`（或保留 `PointerInputSource` 兜底）。
- 需要打开的 URL 参数：接真实情景模块时用 `?cards=real`；现场手势不稳定时用 `?input=pointer` 兜底。
- 有没有需要整合负责人手动改的配置：**有**。本分支没有 `package.json` / `tsconfig.json` / `vite.config.ts`，需要在整合时由骨架提交提供；`demo/shell.html` 里的 `<script src="../src/app/main.js">` 路径在 vite 下可直接工作（相对路径），无需改。

## 5. 接口变更

☑ 没有改 `docs/CONTRACTS.md` 的字段

☐ 改了

说明：
- 全程未修改 `src/shared/contracts.ts`（本分支不存在该文件），也未改 `docs/CONTRACTS.md`。
- 本模块内部有一份合同的**只读类型/JSDoc 说明**（写在 `src/app/types.js` 之前的 .ts 版本已按负责人要求删除；当前以 JSDoc 注释标注合同字段）。等 `contracts.ts` 进入本分支后，只需把 `import type` 指向它，业务代码不用改。
- mock 上附加了少量**非合同**的胶水方法（`setOptionsBand`、`pickOption`、`pressKey`、`setCursor`），仅用于演示与自动化测试，真实模块不需要它们。

## 6. 测试结果

> 重要：本分支**没有 `package.json`**，因此 `pnpm typecheck` / `pnpm test` / `pnpm build` **均未执行**（不是通过，是没跑）。作为替代，用 Node 内置 `node:test` 跑了三套单元测试，并用一个 DOM 桩跑了全流程逻辑回归。

| 测试 | 结果 | 备注 |
|---|---|---|
| `pnpm typecheck` | **未执行** | 本分支无 `package.json` / TypeScript，无构建工具（按负责人约定不引入） |
| `pnpm test` | **未执行** | 同上；改用 `node <test.js>` 直接运行 |
| `pnpm build` | **未执行** | 同上 |
| 单元测试：AdaptiveEngine | 通过 | 31 条全过（连续失败/成功、边界、锁定、订阅、reset） |
| 单元测试：家长控制条 | 通过 | 14 条全过（仅 awaiting-parent 显示、短按无效、真实 1.2 秒长按、不自动 next） |
| 单元测试：mock 服务 + URL 开关 | 通过 | 26 条全过（事件顺序、字幕规则、10 个情景、状态机、开关） |
| 全流程逻辑回归（DOM 桩） | 通过 | 50 项：五任务流程 + 开关控制 + 违规 API 扫描 |
| 违规 API 扫描 | 通过 | `src/` 下 25 个 .js：无 localStorage/sessionStorage/indexedDB/cookie/caches、无 getUserMedia/mediaDevices、无 fetch/XHR/外部 URL、无 innerHTML/eval |
| demo 手动检查 | **待人工验收** | 开发者环境无法运行浏览器，需负责人按清单逐项点 |
| 无摄像头路径 | 逻辑通过 / **待人工确认** | 壳不申请摄像头；`?cards=real`、拒绝授权路径均有出口 |
| 平板宽度 | **待人工验收** | 已写响应式断点（768px/1100px/360px）与 `overflow-x: hidden`，需真机确认 |
| 退出后摄像头停止 | 不适用 | 应用壳不拥有摄像头；由手势/情绪模块的 `stop()` 负责 |
| 无外部网络请求 | 通过（静态扫描） | 代码中无任何外链；需人工在 DevTools Network 复核 |
| 无儿童数据 | 通过 | 不收集身份信息；不存画面/关键点；无照片视频 |

## 7. 已知问题

| 问题 | 影响 | 临时处理 | 计划修吗 |
|---|---|---|---|
| 设置只存内存，刷新恢复默认 | 家长每次打开都要重设 | 本阶段明确要求「不用持久化存储」 | 后续按整合负责人决定是否落盘 |
| 情绪镜子页是占位 | 评审时看不到四种表情 | 页面上写着「位置已留好」与待接清单 | 等成员 D 的 `EmotionSource` |
| 情景练习用 mock，不是真实内容 | 演示内容是团队草稿，非心理老师审核版 | 每个情景标题都带「演示」；接真实模块用 `?cards=real` | 等成员 C 的模块 |
| 双击 HTML 打不开 | 家长可能以为坏了 | `demo/shell.html` 内置了「怎么起服务」的中文提示 | 骨架并入后走 vite 即无此问题 |
| 欢迎页没有顶部栏（含静音入口） | 欢迎页无法静音 | 原代码 `showBack:false` 会隐藏整条栏；按负责人要求**未改动** | 待负责人决定 |
| 光标 y → 卡片的映射靠页面量测 | 页面布局大改时可能不准 | `setOptionsBand` 每次渲染重新量；超出区间不误选 | 真实模块自己做 DOM 命中测试，不需要它 |

## 8. AI 使用与审核

| 项目 | 内容 |
|---|---|
| 使用了哪些 DSH 任务 | AI-GUIDE-02 任务一~五（应用壳与家长流程） |
| AI 生成的代码/文案 | `src/app/` 全部、`demo/shell.html`、`src/shared/adaptive/` 全部、`src/app/mocks/` 全部 |
| 谁做了人工检查 | **待负责人填写**（截至本单填写时，浏览器逐项验收尚未进行） |
| 检查了什么 | 待填：未点击是否请求摄像头、长按 2 秒是否进入家长角、刷新设置是否重置、家长控制条是否只在作答后出现、`?cards=real` 是否隐藏开发控件、手机竖屏是否溢出 |
| 结论 | **待人工验收**（未填「通过」，因为负责人尚未在浏览器逐项确认） |
| 对应 `AI-REVIEW-LOG.md` 行 | 2026-11-24 应用壳五行（任务一~五） |

> 纪律提醒：DSH 自检通过 ≠ 人工验收通过。本单未把任何未发生的检查写成「已通过」。

## 9. 截图 / 录屏

- 桌面：待补
- 平板：待补
- 手机：待补
- 无摄像头路径：待补
- 错误状态：待补

（截图请勿包含儿童正脸、姓名、学校、住址；用成人或合成画面测试。）

## 10. 给 21 号整合负责人的一句话

「应用壳五件事都做完了，**自带 mock 能独立演示**：从主页长按 2 秒进家长角，情景页按方向键移动光标、空格抓起松开即可走完『选卡 → 评价 → 家长确认』。整合时请注意两点：① 本分支没有 `package.json`，需要骨架提交提供构建配置；② 真实模块就位后用 `?cards=real` 切过去，开发控件会自动隐藏。**情绪镜子仍是占位**，21 号前需要成员 D 补上，否则演示时这一页只有说明文字。」

## 11. 负责人签字

| 项目 | 内容 |
|---|---|
| 负责人 | 待签 |
| 日期 | 待填 |
| 我确认没有提交儿童个人数据 | 是 |
| 我确认退出后摄像头会停止 | 不适用（应用壳不拥有摄像头） |
| 我确认没有外部网络请求 | 是（静态扫描确认，建议人工在 DevTools 复核） |
