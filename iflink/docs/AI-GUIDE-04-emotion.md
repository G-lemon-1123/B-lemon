# 成员 D 指南：情绪镜像

四种表情、2 秒校准、匹配环、转头/脸离开处理和无摄像头降级。

**建议读者：**成员 D

这份指南只给成员 D。你不需要会写代码；你负责： **让 DSH 做出四种表情的本地识别与匹配、亲眼看效果、和心理老师确认表情清单、把分支交上来。**

## 1. 你的角色与边界

### 1.1 你负责

| 工作 | 说明 |
|---|---|
| 情绪模型 | MediaPipe Face Landmarker，本地运行 |
| 校准 | 约 2 秒平静脸基线 |
| 四种表情 | 开心、惊讶、难过、生气 |
| 匹配 | 动作分数、阈值、保持时间、匹配环 |
| 异常状态 | 脸离开、转头、光线不足的温和提示 |
| 配置 | `content/expressions.json`，可开关、可调阈值 |
| 独立 demo | `/demo/emotion.html` |
| 无摄像头降级 | mock 模拟四种表情 |
| 专业对接 | 和心理老师确认目标表情、提示语、默认开关 |

### 1.2 你不负责

- 手势识别（项目负责人）。
- 情景选择玩法（成员 C）。
- 应用壳、家长角（成员 B）。
- 音效具体实现（成员 E），你只调用 `FeedbackService`。
- 心理老师的最终专业判断；你负责整理候选、记录意见、配置开关。

### 1.3 你只能改这些目录

```
src/modules/emotion/
content/expressions.json
demo/emotion.html
public/models/face_landmarker.task
```

`public/wasm/` 由整合负责人统一管理；需要更新 wasm 时先问，不要自己放一份。

不要改：

```
src/modules/gesture/
src/modules/cards/
src/app/
src/modules/feedback/
src/shared/contracts.ts
```

- `package.json` 依赖（需要先问整合负责人）

## 2. 四种表情的口径

| 表情 | ID | 主要面部动作 | 儿童提示 | 风险与处理 |
|---|---|---|---|---|
| 开心 | `happy` | 嘴角上扬、脸颊收紧 | “嘴角往上，像在笑” | 最稳定，默认开启 |
| 惊讶 | `surprised` | 张嘴、抬眉、睁大眼 | “张大嘴巴，抬起眉毛” | 较稳定，默认开启 |
| 难过 | `sad` | 嘴角向下、眉毛内侧上抬 | “嘴角往下，眉毛轻轻皱起来” | Demo 开启；标记实验性，正式试用可关闭 |
| 生气 | `angry` | 皱眉、抿嘴、皱鼻 | “皱皱眉头，抿抿嘴” | Demo 开启；可能引发情绪唤醒，正式试用可关闭 |

要求：

- 四种都实现、都能在 demo 中演示。
- Demo 默认四种都展示，方便评审。
- 正式试用前由心理老师确认默认开启哪些。
- 家长/老师设置里可单独关闭任意一种。
- 不增加“害怕”等容易和惊讶混淆的表情。
- “平静”不做评分，做成不评分的呼吸休息。
- 文案说“表情模仿匹配”，不说“AI 判断你的情绪”。

## 3. 技术路线

使用 **MediaPipe Face Landmarker**，只取面部动作分数（blendshapes），不接入黑盒情绪分类器。

原因：

- 可解释：我们知道是哪个动作在起作用。
- 可调：心理老师可以改阈值、关掉不稳定表情。
- 更安全：不给孩子贴“你是生气/难过”的标签。
- 隐私：本地处理，不上传。

### 3.1 推荐动作映射

实际 blendshape 名称以模型输出为准，DSH 要先打印可用名称再实现。

| 表情 | 动作权重建议 |
|---|---|
| 开心 | `mouthSmileLeft`、`mouthSmileRight`、`cheekSquintLeft`、`cheekSquintRight` |
| 惊讶 | `jawOpen`、`browInnerUp`、`eyeWideLeft`、`eyeWideRight` |
| 难过 | `mouthFrownLeft`、`mouthFrownRight`、`browInnerUp` |
| 生气 | `browDownLeft`、`browDownRight`、`mouthPressLeft`、`mouthPressRight`、`noseSneerLeft`、`noseSneerRight` |

### 3.2 匹配流程

**1.** 用户点击开始，请求摄像头。

**2.** 加载 Face Landmarker，运行模式 `VIDEO`，`numFaces: 1`，输出 blendshapes。

**3.** 采集约 2 秒平静脸，保存基线。

**4.** 左右对称动作取平均。

**5.** 减基线并归一化。

**6.** 平滑（EMA 或等价），避免单帧跳动。

**7.** 每种表情加权求分，超过阈值并保持 `holdMs` 才成功。

**8.** 头部偏转超过约 25° 或脸离开时暂停，给温和提示。

**9.** 成功后触发反馈；同一表情有冷却，避免连续重复。

**10.** 退出时停止摄像头、关闭模型。

### 3.3 参数起点

| 参数 | 建议 |
|---|---|
| 校准 | 2000ms |
| 匹配阈值 | 0.55–0.65（可调） |
| 保持时间 | 800ms（可调） |
| 多提示等级 | 阈值更低、保持更短 |
| 少提示等级 | 阈值更高、保持更长 |
| 转头阈值 | 约 25° |
| 脸丢失提示 | 约 800ms |
| 成功冷却 | 约 1200ms |

具体数值必须用真人测试调；不要声称“准确率”。

## 4. 开始前准备

**1.** Clone 仓库，建分支：

```
git switch -c feat/emotion
```

不会命令行就用 GitHub Desktop。

**2.** 在 DSH 打开仓库，新开会话。

**3.** 先读：

    - `docs/PRD.md`（第 8 节）
    - `docs/CONTRACTS.md`（EmotionSource）
    - 本指南

**4.** 把“启动提示”发给 DSH。

## 5. 通用启动提示（每次新会话先发）

```
你是我的开发助手。项目根目录是 <仓库绝对路径>。
我是成员 D，只负责情绪镜像模块、表情配置和 demo。
我只允许你修改：
- src/modules/emotion/
- content/expressions.json
- demo/emotion.html
- public/models/face_landmarker.task

先阅读 docs/PRD.md、docs/CONTRACTS.md、docs/AI-GUIDE-04-emotion.md。
先不要改代码：用非技术语言复述任务、边界、验收标准，等我确认。

约束：
- 不要修改其他模块目录、src/shared/contracts.ts、public/wasm/、package.json 依赖，除非我明确同意。
- 不要接入黑盒情绪分类器；只用 MediaPipe Face Landmarker 的面部动作分数。
- 不要使用 CDN；模型和 wasm 必须本地。
- 不要保存人脸图像、关键点、原始分数。
- 不要提交儿童照片、视频、同意书、真实试用数据、密钥。
- 每次只做一个小任务；完成后运行 typecheck/test/build。
- 列出改了哪些文件、测试结果、还需要我手动检查什么。
```

## 6. 任务一：加载模型与校准

### 6.1 给 DSH 的提示

```
请实现 EmotionSource 的模型和校准部分，先不做完整 UI：
- 严格按 docs/CONTRACTS.md 实现 start/stop/subscribe/calibrate。
- 使用 MediaPipe Face Landmarker，runningMode VIDEO，numFaces 1，outputFaceBlendshapes true。
- 模型路径 public/models/face_landmarker.task，本地加载。
- start 时请求摄像头；stop 时停止摄像头、关闭模型、清空状态。
- calibrate(2000) 采集平静脸，保存基线。
- 先打印/调试输出所有 blendshape 名称，确认可用键名。
- 不保存图像或关键点。
- 写测试：校准前后的分数变化、stop 后不再发帧。
先告诉我你看到的 blendshape 键名，再继续。
```

### 6.2 你要检查

☐ 模型能加载，不请求 CDN。

☐ 校准有进度，约 2 秒。

☐ 停止后摄像头灯熄灭。

☐ 控制台能看到动作名称，不是一堆报错。

☐ 没有保存图像/关键点。

## 7. 任务二：四种表情匹配

### 7.1 给 DSH 的提示

```
请实现四种表情的匹配：
- 从 content/expressions.json 读取 happy/surprised/sad/angry 配置。
- 每种表情有权重、阈值、holdMs、提示语、成功语、enabled、reviewStatus。
- 左右对称动作取平均；减基线、归一化、EMA 平滑。
- 超过阈值并保持 holdMs 才成功；成功后冷却约 1200ms。
- 转头 > 25° 或脸离开时暂停匹配，给温和 message。
- 不出现“AI 判断情绪”的文案。
- 不保存原始分数。
- 写测试：四种表情用合成分数都能成功；脸丢失会重置；转头会暂停。
```

### 7.2 content/expressions.json 建议结构

```
[
  {
    "id": "happy",
    "label": "开心",
    "enabled": true,
    "weights": [
      { "blendshape": "mouthSmileLeft", "weight": 0.35 },
      { "blendshape": "mouthSmileRight", "weight": 0.35 },
      { "blendshape": "cheekSquintLeft", "weight": 0.15 },
      { "blendshape": "cheekSquintRight", "weight": 0.15 }
    ],
    "threshold": 0.6,
    "holdMs": 800,
    "childHint": "嘴角往上，像在笑",
    "successText": "笑起来啦",
    "reviewStatus": "draft"
  }
]
```

四种都要有；难过、生气标记 `reviewStatus: draft` 和实验性说明。Demo 里四种 `enabled: true`，方便评审；正式试用前由心理老师决定哪些默认开启，家长/老师也可以单独关闭。

### 7.3 你要检查

☐ 四种表情都能在 demo 里切换。

☐ 每种表情都有提示语和成功语。

☐ 阈值、保持时间在配置文件里，不写死在代码里。

☐ 脸离开/转头有温和提示。

☐ 没有“诊断/情绪判断”字样。

☐ 没有保存原始分数。

## 8. 任务三：情绪 demo 页面

### 8.1 给 DSH 的提示

```
请实现 demo/emotion.html：
- 摄像头预览（镜像）
- 当前目标表情卡
- 匹配环/进度条
- 校准按钮和校准进度
- 四种表情切换
- 调试面板：facePresent、yaw、四种分数、active、progress（可开关）
- 无摄像头时显示 MockEmotionSource 的四个按钮，模拟成功
- 错误提示要温和，给“用鼠标/无摄像头练习”出口
- 适配平板横屏和手机宽度
- 不依赖应用壳/情景选择/手势模块
完成后运行 typecheck/test/build，并告诉我打开哪个 URL。
```

### 8.2 你要检查

☐ `/demo/emotion.html` 能独立打开。

☐ 校准能完成。

☐ 四种表情都能切换并看到匹配环。

☐ 没有摄像头时能用 mock 演示。

☐ 转头/遮脸有提示。

☐ 平板上能看清。

☐ 停止后摄像头灯熄灭。

## 9. 任务四：让 DSH 审查

```
请作为代码审查员，只审查情绪模块这次改动，不要改代码：
1. 是否只改了允许目录；
2. 是否严格实现 EmotionSource；
3. start/stop 是否成对，stop 是否停止摄像头和模型；
4. 是否保存了人脸图像、关键点或原始分数；
5. 是否接了黑盒情绪分类器；
6. 是否有外部网络请求或 CDN；
7. 运行 typecheck/test/build。
用非技术语言报告，并列出我要手动检查的 3 件事。
```

## 10. 怎么验证“能不能用”

不要声称准确率。做小规模功能测试：

- 3 位成人，每种表情做 10 次，在正常室内光线下。
- 记录：成功触发次数、误触发次数、是否需要转头/靠近。
- 目标：启用表情成人能达到约 8/10；达不到的表情先关闭或标记实验性。
- 儿童测试只观察是否愿意玩、是否理解提示；不把结果当临床数据。
- 心理老师可以要求“宁可放过，不可错判”。

把结果写进交接单，不要写成“识别准确率 95%”这种没有依据的话。

## 11. 上传到 Git

```
请查看 git status 和 git diff --stat。
只提交这次任务相关文件，不要提交 node_modules、dist、.env、截图、模型缓存。
commit message 用：feat(emotion): <一句话>
不要 push 到 main，当前分支是 feat/emotion。
```

用 GitHub Desktop：

**1.** 确认分支 `feat/emotion`。

**2.** Commit。

**3.** Push origin。

**4.** 发起 PR 到 `integration`。

PR 描述写：

- demo 地址；
- 四种表情哪些能稳定触发；
- 哪些标记实验性；
- 心理老师确认到哪一步；
- 已知问题；
- 是否改了合同（应为“无”）。

## 12. 禁止事项

- 不要接黑盒“七类情绪分类器”。
- 不要保存人脸图像、关键点、原始分数。
- 不要用“AI 判断你是什么情绪”的文案。
- 不要改其他模块目录。
- 不要改 `contracts.ts`、`public/wasm/`。
- 不要装新依赖，除非整合负责人同意。
- 不要提交儿童数据、照片、同意书。
- 不要用刺耳音效、红叉、倒计时。
- 不要 push 到 `main`。

## 13. 出问题怎么办

| 现象 | 你做什么 |
|---|---|
| 模型加载失败 | 检查模型文件、wasm 版本、路径；不要用 CDN |
| 摄像头打不开 | 检查权限、localhost/HTTPS、是否被占用 |
| 四种表情分数都很低 | 先打印 blendshape 名称，确认键名正确 |
| 总是误触发 | 提高阈值、延长保持、检查校准、转头暂停 |
| 脸离开后卡在成功 | 让 DSH 检查状态重置和冷却 |
| 平板很卡 | 降分辨率/帧率，只加载面部模型 |
| DSH 改到别人目录 | 立即撤回 |
| 不知道表情是否合适 | 带着候选清单问心理老师 |

## 14. 你的验收清单

☐ `/demo/emotion.html` 可独立运行。

☐ 模型本地加载，无外部请求。

☐ 校准 2 秒可完成。

☐ 四种表情都能演示。

☐ 四种都可在配置中开关。

☐ 匹配环/进度可见。

☐ 转头/脸离开会暂停并提示。

☐ 成功后柔和反馈。

☐ 无摄像头可用 mock。

☐ 停止后摄像头灯熄灭。

☐ 没有保存人脸图像/关键点/原始分数。

☐ 没有黑盒情绪分类器。

☐ typecheck/test/build 通过。

☐ `HANDOFF.md` 已填。

## 15. 交接时必须写清楚

按 `docs/HANDOFF-TEMPLATE.md` 填写：

- 分支名。
- demo 地址。
- 四种表情的测试结果（成人小样本）。
- 哪些标记实验性、哪些建议默认关闭。
- 心理老师确认到哪一步。
- 已知问题。
- 是否改了合同（应为“无”）。
