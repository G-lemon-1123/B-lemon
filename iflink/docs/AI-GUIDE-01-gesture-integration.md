# 项目负责人指南：手势识别 + 21 号整合

你的模块边界、DSH 提示词、手势事件、独立 demo、整合步骤和审阅方法。

**建议读者：**项目负责人（你）

这份指南只给你一个人看。你不需要会写代码；你负责三件事： **告诉 DSH 做什么、亲眼看结果、把分支和整合版本交出来。** 你比其他成员多承担：手势模块、接口合同、mocks、21 号整合、最终验收。

## 1. 你的角色与边界

### 1.1 你负责

| 工作 | 说明 |
|---|---|
| 手势识别模块 | 摄像头、MediaPipe 手部追踪、光标、捏合、挥手、手丢失、错误状态 |
| 接口合同 | `src/shared/contracts.ts`，所有人只读，你维护 |
| 仓库骨架 | Vite + TypeScript + 五个 demo 入口 + mocks |
| 手势 demo | `/demo/gesture.html` |
| 21 号整合 | 合并五个分支、跑测试、切 mock 兜底、打标签 |
| 最终验收 | 有摄像头/无摄像头、平板/笔记本、隐私、退出后摄像头停止 |

### 1.2 你不负责

- 卡牌流程和场景（成员 C）。
- 情绪模型和表情规则（成员 D）。
- 应用壳、家长角、设置（成员 B）。
- 音效、视觉规范、CI（成员 E）。
- 心理老师的专业内容决定（你和成员 C/D 一起对接，但不能替老师签字）。

### 1.3 你只能改这些目录

```
src/modules/gesture/          # 你的手势模块
demo/gesture.html             # 你的独立演示页
public/models/hand_landmarker.task
public/wasm/                  # 统一 wasm，只有你放
src/shared/contracts.ts       # 你维护，别人只读
src/shared/mocks/             # 你放统一的 mock（或协调各模块）
docs/                         # 你维护 PRD、合同、整合说明
```

**不要直接改别人的模块目录。** 别人的模块挂了，让他自己修，或者 21 号切 mock。

## 2. 开始前准备

### 2.1 建仓库和分支

如果仓库还没建：

**1.** 在 GitHub / GitLab / Gitee 建一个**私有仓库**，名字例如 `xiaobu-planet`。

**2.** 把这份 `docs/` 先提交进去。

**3.** 让成员 B/C/D/E 都 clone 同一个仓库。

**4.** 你建分支：

```
git switch -c feat/gesture
```

不会命令行就用 GitHub Desktop：Clone → New Branch → `feat/gesture`。

### 2.2 在 DSH 打开项目

- 用 DSH 打开这个仓库文件夹。
- 新开一个会话，不要让会话里混着别人的任务。
- 每次开始前，把“通用启动提示”发给 DSH。
- 让 DSH 先读 `docs/PRD.md`、`docs/CONTRACTS.md`、本指南，再开始。

### 2.3 先确认三件事

☐ 仓库里已经有 `docs/PRD.md` 和 `docs/CONTRACTS.md`。

☐ 你有权限 push 自己的分支。

☐ 你的电脑/平板有摄像头；没有也能用合成手测试。

## 3. 通用启动提示（每次新会话先发）

```
你是我的开发助手。项目根目录是 <仓库绝对路径>。
我是项目整合负责人，负责手势识别模块和最终整合。
我只允许你修改：
- src/modules/gesture/
- demo/gesture.html
- public/models/hand_landmarker.task
- public/wasm/
- src/shared/contracts.ts（只有我明确要求时）
- src/shared/mocks/（只有我明确要求时）
- docs/（只有我明确要求时）

先阅读 docs/PRD.md、docs/CONTRACTS.md、docs/AI-GUIDE-01-gesture-integration.md。
先不要改代码：用非技术语言复述任务、边界、验收标准，等我确认。

约束：
- 不要修改其他模块目录、package.json 依赖、vite.config.ts，除非我明确同意。
- 不要使用 CDN；模型和 wasm 必须本地。
- 不要提交儿童照片、视频、同意书、真实试用数据、密钥。
- 每次只做一个小任务；完成后运行 typecheck/test/build。
- 列出改了哪些文件、测试结果、还需要我手动检查什么。
- 如果发现需要改接口或装新依赖，先停下来告诉我。
```

## 4. 任务一：建仓库骨架、合同和 mocks

### 4.1 给 DSH 的提示

```
请先搭建项目骨架，只做基础设施，不实现手势识别：
- Vite + TypeScript + 原生 DOM/CSS
- 有 index.html 和 demo/ 下的五个入口：
  demo/gesture.html、demo/shell.html、demo/cards.html、demo/emotion.html、demo/feedback.html
- 有 src/shared/contracts.ts，内容严格按 docs/CONTRACTS.md
- 有 src/shared/mocks/：
  MockInputSource、PointerInputSource、MockScenarioGame、MockEmotionSource、MockFeedbackService、MockAdaptiveEngine
- 有 src/app/ 的空壳入口，但不要实现完整页面
- 有 package.json 脚本：dev、build、typecheck、test
- 有 .gitignore：node_modules、dist、.env、测试截图
- 不要装任何 UI 框架
- 不要实现手势/情绪/卡牌业务
完成后运行 typecheck 和 build，报告结果。
```

### 4.2 你要检查

☐ `pnpm dev` 能启动，浏览器能打开。

☐ 五个 demo 入口至少在页面里显示“模块占位”。

☐ `pnpm typecheck`、`pnpm build` 通过。

☐ `src/shared/contracts.ts` 和 `docs/CONTRACTS.md` 一致。

☐ 没有多余的框架依赖。

### 4.3 然后让 DSH 提交

```
请只提交这次骨架相关文件，commit message 用：
chore: scaffold modules, contracts and mocks
不要 push 到 main，当前分支是 feat/gesture。
```

## 5. 任务二：接入手势开源底座

### 5.1 原则

不要从零写手部识别。使用 （MIT）的手势底座：

- MediaPipe Hand Landmarker。
- One Euro 平滑、迟滞、防抖。
- 捏合、挥手等手势。
- 合成手测试。
- 摄像头降级。

你只需要把它的输出接到我们的 `InputSource` 合同。

### 5.2 给 DSH 的提示

```
请接入手势开源底座，仍然不要做卡牌/情绪/页面：
- 参考 https://github.com/abouchedidxcode/open-source-hands 的 src/kit。
- 复制到 src/modules/gesture/vendor/hand-gesture-kit/，保留 MIT LICENSE 和署名。
- 按它 README 锁定 @mediapipe/tasks-vision 版本（示例为 1.1.0），不要随意升级。
- 下载 hand_landmarker.task 到 public/models/。
- 把 node_modules/@mediapipe/tasks-vision/wasm 复制到 public/wasm/。
- 实现 src/modules/gesture/index.ts，导出 createGestureInput(): InputSource。
- 不实现任何卡牌逻辑，不修改其他模块。
先列出你准备改的文件和依赖版本，等我确认后再写。
```

### 5.3 你要检查

☐ `public/models/hand_landmarker.task` 存在，大小正常（约 8MB）。

☐ `public/wasm/` 里有 wasm 文件。

☐ `LICENSE` 保留在 vendor 目录。

☐ 没有从 CDN 加载。

☐ 没有改 `package.json` 里无关依赖。

## 6. 任务三：实现手势事件

### 6.1 给 DSH 的提示

```
请实现 GestureInput，严格实现 docs/CONTRACTS.md 的 InputSource：
- start({video, preview})：请求摄像头、加载 HandLandmarker、启动检测。
- stop()：停止摄像头轨道、停止循环、关闭模型、清空状态。
- subscribe(handler)：收到 InputEvent。
- 手掌中心映射为 0..1 自拍镜像坐标；超出裁剪。
- 捏合强度 → grab-start / grab-end，带迟滞，一次捏合只触发一次。
- 张开手掌横向挥手 → flip left/right，带约 700ms 冷却。
- 手丢失约 500ms → status: hand-lost。
- 摄像头拒绝/无设备/模型失败 → status: error，带 code 和可读 message。
- 不做额外平滑（底座已有）。
- 不操作卡牌 DOM，不写音效。
完成后写单元测试：左右手捏合、左右挥手、冷却、手丢失、stop 后不再发事件。
```

### 6.2 推荐参数

| 参数 | 建议值 |
|---|---|
| 捏合按下 | 0.6 |
| 捏合松开 | 0.35 |
| grab-start 稳定 | 120ms |
| 挥手水平位移 | 屏幕宽度约 18% |
| 挥手最长 | 500ms |
| flip 冷却 | 700ms |
| 手丢失 | 500ms |

这些是起点，后面用真实手调。**宁可宽松，不要让孩子觉得系统看不懂。**

### 6.3 你要检查

☐ 打开 demo，点击“开始摄像头”后出现光标。

☐ 捏合能拿起、松开能放下，不会连续触发多次。

☐ 左右挥手各触发一次，不会一次挥手触发好几次。

☐ 手离开画面约半秒后出现“手回来了”的提示。

☐ 拒绝摄像头时页面不崩，有鼠标替代。

☐ 点击停止后摄像头灯熄灭。

☐ 控制台没有红色报错。

## 7. 任务四：做手势独立 demo

### 7.1 给 DSH 的提示

```
请实现 demo/gesture.html 和 src/modules/gesture/demo.ts：
- 摄像头预览（镜像）
- 光标圆环
- 捏合强度条
- 当前状态：加载/就绪/手丢失/错误
- 最近一次 flip 的方向
- FPS
- “开始摄像头”“停止”“用鼠标模拟”“合成手自动演示”按钮
- 错误时显示非技术语言提示和下一步
- 不依赖应用壳、卡牌、情绪模块
- 适配平板横屏和手机宽度
完成后运行 typecheck/test/build，并告诉我打开哪个 URL。
```

### 7.2 你要检查

☐ `/demo/gesture.html` 能独立打开。

☐ 不启动摄像头时也有“合成手”演示。

☐ 错误提示是给家长看的，不是代码报错。

☐ 平板上能看清光标和按钮。

☐ 页面不请求外部网络。

## 8. 任务五：让 DSH 审查你的模块

每个任务完成后，不要直接结束，发这段：

```
请作为代码审查员，只审查手势模块这次改动，不要改代码：
1. 是否只改了允许目录；
2. 是否严格实现 docs/CONTRACTS.md 的 InputSource；
3. start/stop 是否成对，stop 是否停止摄像头和模型；
4. 是否有可能在页面隐藏/退出后继续推理；
5. 是否有外部网络请求或 CDN；
6. 是否提交了敏感数据；
7. 运行 typecheck/test/build。
用非技术语言报告，最后列出我需要在浏览器里手动检查的 3 件事。
```

把结果填进 `docs/AI-REVIEW-LOG.md`。

## 9. 怎么上传到 Git

### 9.1 让 DSH 做

```
请查看 git status 和 git diff --stat。
只提交这次任务相关的文件，不要提交 node_modules、dist、.env、截图。
commit message 用：feat(gesture): <一句话>
不要 push 到 main，当前分支是 feat/gesture。
然后告诉我下一步 push 命令。
```

### 9.2 如果 DSH 不能 push

用 GitHub Desktop：

**1.** 打开仓库。

**2.** 确认当前分支是 `feat/gesture`。

**3.** 填 Summary，例如 `feat(gesture): 完成捏合与挥手事件`。

**4.** Commit。

**5.** Push origin。

### 9.3 发起 PR

- 目标分支选 `integration`，不是 `main`。
- 标题写清楚：`feat(gesture): 手势输入模块 v1`。
- 描述里贴：
  - demo 地址；
  - 测试结果；
  - 已知问题；
  - 是否改了合同（应为“无”）。
- 不会用 PR 就告诉整合负责人你的分支名，让他来合。

## 10. 21 号整合：你具体做什么

### 10.1 整合前检查

☐ 五个分支都已 push。

☐ 每个分支有 `HANDOFF.md`（按 `docs/HANDOFF-TEMPLATE.md` 填）。

☐ 每个模块有独立 demo。

☐ 每个人在 `docs/AI-REVIEW-LOG.md` 有记录。

☐ 没有人改 `contracts.ts`（除了你）。

☐ 没有人提交儿童数据。

### 10.2 合并顺序

**1.** 合同 + mocks（已经在 `integration`）。

**2.** 应用壳 `feat/shell`。

**3.** 手势 `feat/gesture`。

**4.** 情景卡牌 `feat/cards`。

**5.** 情绪 `feat/emotion`。

**6.** 反馈/设计/CI `feat/feedback`。

### 10.3 给 DSH 的整合提示

```
今天是整合日，不要新增功能，不要重构。当前分支 integration。
请按顺序把以下分支合并进来：
feat/shell、feat/gesture、feat/cards、feat/emotion、feat/feedback。
只解决我模块目录内的冲突；其他目录的冲突先停下来告诉我，不要猜。
每合一个分支，运行 typecheck 和 test；全部合完运行 build。
如果某模块编译失败，先告诉我失败原因，不要直接删代码。
```

### 10.4 整合后测试

按顺序做：

**1.** 打开主页面，完成首次家长说明。

**2.** 拒绝摄像头 → 鼠标完成一个情景选择。

**3.** 允许摄像头 → 手势完成一个情景选择。

**4.** 选对 → 出现正向反馈，停在家长控制条，不自动下一题。

**5.** 选错 → 卡片回位、更合适答案高亮、解释出现，停在家长控制条。

**6.** 家长长按确认 → 进入下一题；短按不生效。

**7.** 家长点“再试一次” → 回到选择；点“结束” → 小结。

**8.** 确认 10 个情景都能从内容文件加载。

**9.** 情绪模式 → 校准 → 四种表情至少各成功一次。

**10.** 转头/遮脸 → 出现温和提示。

**11.** 退出 → 摄像头灯熄灭。

**12.** 刷新 → 设置和进度还在。

**13.** 平板/手机宽度 → 不横向溢出。

**14.** 静音、减少动态 → 生效。

**15.** 浏览器 Network 面板 → 没有外部请求。

**16.** 仓库搜索 → 没有儿童照片/视频/同意书。

### 10.5 如果某模块挂了

- 不要现场重写。
- 用 URL 开关切 mock：`?input=pointer`、`?emotion=mock`、`?cards=mock`。
- 保证主流程能演示。
- 把问题写进 `HANDOFF` 和最终说明。

### 10.6 打标签

```
git tag v0.1.0
git push origin v0.1.0
```

备份一个可运行版本（zip 或 release）。

## 11. 你不懂代码，怎么审别人的模块

你不需要读代码。你按这五步看：

**1.** **打开 demo**：他自己的页面能不能单独跑？

**2.** **按验收清单点**：选对、选错、家长确认、再试一次、表情、退出，是否都正常？

**3.** **看错误提示**：拒绝摄像头、没手、没脸时，是否温和、有出口？

**4.** **看隐私**：退出后摄像头灯是否熄灭？Network 面板有没有外部请求？

**5.** **看交接单**：有没有写清楚已知问题、怎么整合、测试结果？

发现不对，不要自己改。把现象和截图发给对应成员，让他用 DSH 修。

## 12. 禁止事项

- 不要改别人的模块目录。
- 不要改合同字段（除非你作为整合负责人统一改）。
- 不要让 DSH 装新依赖，除非你先确认。
- 不要让 DSH 使用 CDN。
- 不要提交 `node_modules`、`dist`、`.env`、儿童照片、同意书。
- 不要 push 到 `main`。
- 不要使用 `git push --force`、`git reset --hard`、删除分支。
- 不要让孩子单独使用；测试时成人陪同。
- 不要把“识别结果”说成“诊断”或“能力评分”。

## 13. 出问题怎么办

| 现象 | 你做什么 |
|---|---|
| DSH 改到别人目录 | 立即让它撤回，只保留自己目录改动 |
| DSH 想改合同/装依赖 | 停下来，先确认是否真的需要 |
| 摄像头打不开 | 检查 localhost/HTTPS、权限、是否被其他应用占用 |
| 模型加载失败 | 检查模型/wasm 是否在 public，版本是否匹配 |
| 平板很卡 | 降摄像头分辨率/帧率，只加载当前模式模型 |
| 合并冲突 | 只处理自己目录；其他目录停下来找对应成员 |
| DSH 上下文太长 | 新开会话，让它先读 `HANDOFF.md` 和合同 |
| 测试过不了 | 让 DSH 用非技术语言解释失败原因，只修当前问题 |

## 14. 你的验收清单

### 手势模块

☐ `/demo/gesture.html` 可独立运行。

☐ 摄像头启动/停止正常。

☐ 光标跟随。

☐ 捏合抓起/松开。

☐ 左右挥手翻卡事件。

☐ 手丢失提示。

☐ 错误状态有替代出口。

☐ 合成手测试通过。

☐ 单元测试通过。

☐ 无外部请求。

☐ 停止后摄像头灯熄灭。

### 整合

☐ 五个 demo 都能打开。

☐ 主页面完整流程能跑。

☐ 有摄像头/无摄像头两条路径都通。

☐ 10 个情景都能加载。

☐ 选对/选错都有反馈；选错显示更合适答案。

☐ 选完不自动跳；家长长按确认才下一步。

☐ 再试一次/结束练习可用。

☐ 四种表情都能演示。

☐ 设置持久化。

☐ 隐私检查通过。

☐ 已打标签、已备份。

☐ `HANDOFF.md`、`AI-REVIEW-LOG.md` 齐全。

## 15. 你可以直接复制的收尾提示

```
请帮我做最终交付检查：
1. 运行 typecheck/test/build；
2. 列出所有 demo 入口；
3. 检查是否有外部网络请求、CDN、儿童数据；
4. 检查 stop() 是否停止摄像头和模型；
5. 检查 contracts 是否被改动；
6. 检查情景选择在作答后是否停在家长控制条，不会自动 next()；
7. 生成一份给非技术负责人的 10 行交付摘要。
不要新增功能，不要重构。
```
