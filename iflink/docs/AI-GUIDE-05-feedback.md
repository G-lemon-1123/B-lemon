# 成员 E 指南：反馈、设计与 QA

音效、语音、字幕、设计变量、无障碍、CI、测试清单和 AI 审核记录。

**建议读者：**成员 E

这份指南只给成员 E。你不需要会写代码；你负责： **让 DSH 做柔和音效、语音字幕、视觉规范、无障碍和 CI，亲眼看效果，把分支交上来。**

## 1. 你的角色与边界

### 1.1 你负责

| 工作 | 说明 |
|---|---|
| 反馈服务 | 音效、语音、字幕、静音，实现 `FeedbackService` |
| 设计变量 | 颜色、字号、按钮尺寸、圆角、焦点态、动效时长 |
| 无障碍 | 大按钮、对比度、键盘、字幕、减少动态 |
| 独立 demo | `/demo/feedback.html` |
| CI | 安装、类型检查、测试、构建 |
| QA 工具 | 测试清单、截图、AI 审核记录 |
| AI 审核记录 | 维护 `docs/AI-REVIEW-LOG.md` |
| 21 号协助 | 帮整合负责人跑验收、记录问题 |

### 1.2 你不负责

- 手势识别（项目负责人）。
- 情景选择规则（成员 C）。
- 情绪模型（成员 D）。
- 应用壳路由/家长角（成员 B）。
- 心理老师的专业内容。

### 1.3 你只能改这些目录

```
src/modules/feedback/
src/shared/design/
tests/e2e/
.github/workflows/
docs/qa/
docs/AI-REVIEW-LOG.md
demo/feedback.html
```

不要改：

```
src/modules/gesture/
src/modules/cards/
src/modules/emotion/
src/app/
src/shared/contracts.ts
```

- `package.json` 依赖（需要先问整合负责人）

## 2. 设计原则

- 低饱和、柔和，不刺眼。
- 一次只出现一个主要动画。
- 不使用高频闪烁、突然放大、爆炸彩带。
- 默认音量约 60%，可静音。
- 语音必须有字幕；语音不可用不影响游戏。
- 成功反馈要快、柔和；失败没有惩罚音。
- 按钮/热区足够大，主要操作不低于 56px。
- 平板横屏优先，手机竖屏可用。
- 尊重 `prefers-reduced-motion`。

## 3. 开始前准备

**1.** Clone 仓库，建分支：

```
git switch -c feat/feedback
```

不会命令行就用 GitHub Desktop。

**2.** 在 DSH 打开仓库，新开会话。

**3.** 先读：

    - `docs/PRD.md`（第 11、14 节）
    - `docs/CONTRACTS.md`（FeedbackService）
    - 本指南

**4.** 把“启动提示”发给 DSH。

## 4. 通用启动提示（每次新会话先发）

```
你是我的开发助手。项目根目录是 <仓库绝对路径>。
我是成员 E，只负责反馈、设计规范、无障碍、CI 和 QA 文档。
我只允许你修改：
- src/modules/feedback/
- src/shared/design/
- tests/e2e/
- .github/workflows/
- docs/qa/
- docs/AI-REVIEW-LOG.md
- demo/feedback.html

先阅读 docs/PRD.md、docs/CONTRACTS.md、docs/AI-GUIDE-05-feedback-qa.md。
先不要改代码：用非技术语言复述任务、边界、验收标准，等我确认。

约束：
- 不要修改其他模块目录、src/shared/contracts.ts、package.json 依赖，除非我明确同意。
- 不要实现手势/情景选择/情绪内部逻辑；只通过 contracts 接口。
- 不要使用 CDN；音效使用 Web Audio 合成，不引入外部音频。
- 不要提交儿童照片、视频、同意书、真实试用数据、密钥。
- 每次只做一个小任务；完成后运行 typecheck/test/build。
- 列出改了哪些文件、测试结果、还需要我手动检查什么。
```

## 5. 任务一：FeedbackService 音效

### 5.1 给 DSH 的提示

```
请实现 FeedbackService 的音效部分，严格按 docs/CONTRACTS.md：
- play(cue)：pick、success、retry、reward、calm
- 使用 Web Audio 合成，不引入外部音频文件
- 默认音量约 60%，有 master gain 和轻柔压缩
- success 是柔和三音和弦，不超过约 0.6 秒
- retry 是极轻的提示音，不能像错误音；选错显示“更合适的选择”时可以用它
- 选错不播报“错了”，不播错误蜂鸣；解释语用语音+字幕
- 不要刺耳、不要突然放大
- AudioContext 必须在用户点击后 resume
- 提供 setMuted(muted)
- 写测试：静音后不播、重复播放不叠加失控
```

### 5.2 你要检查

☐ 点击后才有声音，页面加载时不自动响。

☐ 成功音柔和、不刺耳。

☐ 重试音不吓人。

☐ 静音后所有音效停止。

☐ 连续成功不会越来越响/叠加。

☐ 没有外部音频文件。

## 6. 任务二：语音与字幕

### 6.1 给 DSH 的提示

```
请实现语音和字幕：
- speak(text)：使用 Web Speech API 中文语音，rate 约 0.9
- 同时通过 onCaption(handler) 发出字幕事件
- 同一时间只播一条语音；新语音取消旧语音
- 浏览器不支持语音时，不报错，只保留字幕
- setMuted(true) 时不播语音，但字幕仍出现
- 语音不可用不能阻塞游戏
- 写测试：字幕顺序、静音行为、重复 speak 不会叠音
```

### 6.2 你要检查

☐ 语音有同步字幕。

☐ 静音后还有字幕。

☐ 连续点击不会叠音。

☐ 浏览器没有中文语音时，游戏还能玩。

☐ 语音内容短、自然，不像机器人念长文。

## 7. 任务三：设计变量与组件规范

### 7.1 给 DSH 的提示

```
请在 src/shared/design/ 建立设计变量和基础组件样式：
- 颜色：低饱和、温暖、对比度足够
- 字体：系统中文字体栈，不引入 CDN 字体
- 字号：正文不小于 16px，儿童提示更大
- 按钮：主要操作不低于 56px
- 圆角、阴影、间距统一
- 焦点态明显，键盘可见
- 动效时长和缓动统一
- 支持 prefers-reduced-motion 和 .reduce-motion
- 提供 demo/feedback.html 展示：
  - 颜色/字号/按钮
  - 音效按钮
  - 语音+字幕
  - 减少动态开关
  - 键盘焦点示例
- 不实现游戏逻辑
```

### 7.2 你要检查

☐ 按钮够大，文字够大。

☐ 颜色不刺眼，对比度可读。

☐ 键盘 Tab 能看到焦点。

☐ 减少动态开关能停止动画。

☐ 不引入外部字体/图标 CDN。

☐ 平板上布局正常。

## 8. 任务四：CI 和测试工具

### 8.1 给 DSH 的提示

```
请建立最小 CI 和测试工具：
- CI 在每次 push/PR 时运行：
  - pnpm install --frozen-lockfile
  - pnpm typecheck
  - pnpm test
  - pnpm build
- 如果平台不是 GitHub，给我对应的 GitLab/Gitee 配置
- 在 tests/e2e/ 放一个最小的冒烟测试（如果环境允许）：
  - 打开首页
  - 打开五个 demo
  - 不要求摄像头
- 在 docs/qa/ 写：
  - 测试清单
  - 目标设备矩阵
  - 隐私检查清单
  - 21 号验收步骤
- 不修改业务模块
```

### 8.2 你要检查

☐ CI 能跑通。

☐ 失败时能看到是哪一步失败。

☐ 测试不需要真实摄像头。

☐ 文档里有平板/笔记本/手机检查项。

☐ 文档里有“无外部请求”“退出后摄像头停止”检查。

## 9. 任务五：AI 审核记录与 QA

### 9.1 给 DSH 的提示

```
请创建/维护 docs/AI-REVIEW-LOG.md：
- 表头：日期、模块、AI 产出、使用提示/范围、人工检查、结论
- 预填一行示例，说明怎么填
- 在 docs/qa/ 写“AI 产出审核流程”：
  1. 模块负责人让 DSH 自检
  2. DSH 审查模式检查接口/隐私/摄像头释放
  3. 人工打开 demo 验收
  4. 记录结论
- 不要伪造记录，不要填写未发生的测试
```

### 9.2 你要检查

☐ 每个模块都知道要填。

☐ 记录里没有儿童身份信息。

☐ 没有把“DSH 说通过”直接当人工验收。

☐ 记录能对应到具体日期和模块。

## 10. 让 DSH 审查你的模块

```
请作为代码审查员，只审查反馈/设计/CI 这次改动，不要改代码：
1. 是否只改了允许目录；
2. 是否严格实现 FeedbackService；
3. 是否有外部音频/字体/网络请求；
4. 静音、字幕、减少动态是否有效；
5. 是否有敏感数据；
6. 运行 typecheck/test/build。
用非技术语言报告，并列出我要手动检查的 3 件事。
```

## 11. 上传到 Git

```
请查看 git status 和 git diff --stat。
只提交这次任务相关文件，不要提交 node_modules、dist、.env、截图。
commit message 用：feat(feedback): <一句话>
不要 push 到 main，当前分支是 feat/feedback。
```

用 GitHub Desktop：

**1.** 确认分支 `feat/feedback`。

**2.** Commit。

**3.** Push origin。

**4.** 发起 PR 到 `integration`。

PR 描述写：

- demo 地址；
- CI 结果；
- 测试清单；
- 已知问题；
- 是否改了合同（应为“无”）。

## 12. 21 号协助整合

你不需要合并代码，但要做：

☐ 检查每个分支的 CI/测试结果。

☐ 打开五个 demo，记录是否能跑。

☐ 按 `docs/qa/` 清单做平板/手机检查。

☐ 检查 Network 面板没有外部请求。

☐ 检查退出后摄像头停止。

☐ 检查仓库没有儿童数据。

☐ 把问题写进 `AI-REVIEW-LOG.md` 和交接单。

☐ 帮整合负责人生成最终验收摘要。

## 13. 禁止事项

- 不要改其他模块目录。
- 不要改 `contracts.ts`。
- 不要引入外部音频、字体、图标 CDN。
- 不要装新依赖，除非整合负责人同意。
- 不要伪造 AI 审核记录。
- 不要提交儿童数据、照片、同意书。
- 不要用刺耳音效、闪烁、爆炸动画。
- 不要 push 到 `main`。

## 14. 出问题怎么办

| 现象 | 你做什么 |
|---|---|
| 没有声音 | 检查是否用户点击后才 resume AudioContext |
| 静音无效 | 让 DSH 检查所有播放路径是否都走 master gain |
| 语音叠音 | 让 DSH 加“取消上一条”逻辑 |
| 字幕不出现 | 让 DSH 检查 onCaption 订阅和静音分支 |
| CI 失败 | 让 DSH 逐步跑 typecheck/test/build，定位失败步骤 |
| 平板字体太小 | 让 DSH 调 clamp 字号和按钮尺寸 |
| 动画太多 | 让 DSH 加 reduced-motion 分支 |
| DSH 改到别人目录 | 立即撤回 |

## 15. 你的验收清单

☐ `/demo/feedback.html` 可独立运行。

☐ 五种音效都能播放。

☐ 默认音量适中，可静音。

☐ 语音有字幕。

☐ 静音后字幕仍在。

☐ 减少动态生效。

☐ 按钮/焦点/对比度合格。

☐ 无外部音频/字体/CDN。

☐ CI 通过。

☐ `docs/qa/` 清单齐全。

☐ `docs/AI-REVIEW-LOG.md` 可用。

☐ typecheck/test/build 通过。

☐ `HANDOFF.md` 已填。

## 16. 交接时必须写清楚

按 `docs/HANDOFF-TEMPLATE.md` 填写：

- 分支名。
- demo 地址。
- 音效/语音/字幕/减少动态的测试结果。
- CI 状态。
- 已知问题。
- 是否改了合同（应为“无”）。
