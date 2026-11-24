# 接口合同（CONTRACTS）

五个模块之间的“插座标准”：输入、情景选择、情绪、反馈、自适应与组合方式。

**建议读者：**全体成员；改动前必须经过整合负责人

| 项目 | 内容 |
|---|---|
| 版本 | v1.0（首次冻结） |
| 负责人 | 项目整合负责人（你） |
| 适用对象 | 手势、应用壳、情景、情绪、反馈五个模块 |
| 关联文档 | `docs/PRD.md`、`docs/AI-GUIDE-*.md` |

这是五个模块之间的“插座标准”。**任何人不得擅自修改本文件中的字段、事件名、坐标含义。** 需要新增字段时，先向整合负责人提出，由整合负责人在 `integration` 分支统一修改，并通知所有人。

## 1. 为什么需要合同

五个人用 DSH 并行开发，如果每个人都按自己的习惯写：

- 手势模块输出 `x/y` 像素，情景模块以为是 0–1；
- 情绪模块叫 `score`，应用壳叫 `confidence`；
- 每个人都写一套音效；
- 21 号合并时互相不认。

所以先冻结合同，再让每个人在自己的目录里实现。合同只定义“模块之间怎么说话”，不限制模块内部怎么写。

## 2. 坐标与时间约定

### 2.1 坐标

所有跨模块位置统一为：

```
export type Point = {
  x: number; // 0..1，自拍镜像坐标：x=0 在画面左侧，x=1 在右侧
  y: number; // 0..1，向下为正
};
```

- 已镜像：孩子抬右手，屏幕上的光标向屏幕右侧移动。
- 不传像素；由情景/页面自己映射到 DOM 位置。
- 超出 0–1 时，输出方必须裁剪到 0–1。
- 手势模块负责把 MediaPipe 的坐标转成这个约定，情景模块不再做镜像。

### 2.2 时间

- `t` 使用 `performance.now()` 毫秒。
- 同一帧的多个事件可以有相同 `t`。
- 时间只用于去抖、冷却、动画；不用于给孩子计时。

### 2.3 支持等级

```
export type SupportLevel = 0 | 1 | 2;
// 0 = 多提示（更容易）
// 1 = 标准
// 2 = 少提示（更独立）
```

不给孩子显示“简单/困难”；家长端显示“多提示 / 标准 / 少提示”。

## 3. 输入合同：InputSource

手势、鼠标、触摸、测试机器人全部实现这个接口。

```
export type InputStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'hand-lost'
  | 'error';

export type InputErrorCode =
  | 'permission-denied'
  | 'no-camera'
  | 'camera-busy'
  | 'insecure-context'
  | 'model-load-failed'
  | 'inference-failed'
  | 'unknown';

export type InputEvent =
  | {
      type: 'status';
      status: InputStatus;
      code?: InputErrorCode;
      message?: string;
    }
  | {
      type: 'move';
      at: Point;
      grab: boolean;
      strength: number; // 0..1，捏合强度
      t: number;
    }
  | {
      type: 'grab-start';
      at: Point;
      t: number;
    }
  | {
      type: 'grab-end';
      at: Point;
      t: number;
    }
  | {
      type: 'flip';
      direction: 'left' | 'right';
      at: Point;
      t: number;
    };

export interface InputStartOptions {
  video: HTMLVideoElement;
  preview?: HTMLElement;
}

export interface InputSource {
  start(options: InputStartOptions): Promise<void>;
  stop(): void;
  subscribe(handler: (event: InputEvent) => void): () => void;
  getDebugState(): Record<string, unknown>;
}
```

### 3.1 行为要求

- `start()` 必须由用户点击后调用；内部才请求摄像头。
- `start()` 可以抛错，但更推荐通过 `status: error` 通知界面。
- `stop()` 必须：
  - 停止摄像头轨道；
  - 停止检测循环；
  - 释放/关闭模型；
  - 清空光标状态。
- `subscribe()` 返回取消订阅函数；取消后不再收到事件。
- 同一时间只允许一个 `InputSource` 运行。
- 手势模块不能直接操作情景 DOM；只发事件。
- 情景模块不能 import 手势模块内部文件；只依赖 `InputSource` 类型。

### 3.2 事件语义

| 事件 | 何时发 | 注意 |
|---|---|---|
| `status: idle` | 初始/已停止 | 可选 |
| `status: loading` | 开始加载模型 | 界面显示“眼睛准备好了” |
| `status: ready` | 检测到手，可以交互 | 界面隐藏错误 |
| `status: hand-lost` | 连续约 500ms 没检测到手 | 已抓起卡片回位，不发惩罚 |
| `status: error` | 权限/设备/模型错误 | 带 `code` 和可读 `message` |
| `move` | 每帧或每两帧 | 坐标必须裁剪到 0–1 |
| `grab-start` | 捏合按下并保持约 100–150ms | 一次捏合只能触发一次 |
| `grab-end` | 松开 | 带松开位置 |
| `flip` | 张开手掌横向挥动 | 冷却约 700ms；一次挥手只触发一次 |

### 3.3 推荐阈值（可调）

- 捏合按下：约 0.6。
- 捏合松开：约 0.35。
- `grab-start` 稳定时间：120ms。
- 挥手水平位移：约屏幕宽度的 18%。
- 挥手最大持续时间：约 500ms。
- `flip` 冷却：700ms。
- 手丢失：500ms。

具体数值由手势模块在平板上用真实手调；只要事件语义不变，数值可改。

### 3.4 鼠标/触摸实现

应用壳提供 `PointerInputSource`：

- `move`：指针位置 / 容器尺寸。
- `grab-start`：按下。
- `grab-end`：松开。
- `flip`：点击“翻面”按钮或按 `F`。
- 不请求摄像头。

这样情景模块不需要区分输入来源。

## 4. 情绪合同：EmotionSource

```
export type EmotionId = 'happy' | 'surprised' | 'sad' | 'angry';

export interface EmotionExpressionConfig {
  id: EmotionId;
  label: string;
  enabled: boolean;
  weights: Array<{
    blendshape: string; // 例如 mouthSmileLeft
    weight: number;     // 0..1
  }>;
  threshold: number;    // 0..1
  holdMs: number;       // 例如 800
  childHint: string;
  successText: string;
  reviewStatus: 'draft' | 'reviewed';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface EmotionFrame {
  facePresent: boolean;
  yaw: number;              // 头部左右偏转，度数近似
  scores: Record<EmotionId, number>; // 0..1
  active: EmotionId | null; // 当前达到阈值并保持中的表情
  progress: number;         // 0..1，保持进度
  message?: string;         // 给界面的温和提示，如“靠近一点”
}

export interface EmotionStartOptions {
  video: HTMLVideoElement;
}

export interface EmotionSource {
  start(options: EmotionStartOptions): Promise<void>;
  calibrate(durationMs?: number): Promise<void>;
  stop(): void;
  subscribe(handler: (frame: EmotionFrame) => void): () => void;
  getDebugState(): Record<string, unknown>;
  setExpressions(configs: EmotionExpressionConfig[]): void;
  setSupportLevel(level: SupportLevel): void;
}
```

### 4.1 行为要求

- `start()` 由用户点击后调用；内部请求摄像头。
- 同一时间只运行一个情绪模型；与手势模型互斥。
- `calibrate()` 采集平静脸；默认 2000ms。
- `subscribe()` 每帧或每两帧发一次 `EmotionFrame`。
- `stop()` 停止摄像头、模型、循环。
- `setExpressions()` 可在进入页面前配置四种表情；未审核的 `draft` 不得在正式试用中启用。
- `setSupportLevel()` 改变阈值/保持时间策略，但不改变表情定义。
- 失败不抛到全局；用 `message` 或 `active=null` 表示还在尝试。

### 4.2 四种表情

| ID | 显示名 | 主要动作 | 默认 |
|---|---|---|---|
| `happy` | 开心 | 嘴角上扬、脸颊收紧 | 开启 |
| `surprised` | 惊讶 | 张嘴、抬眉、睁大眼 | 开启 |
| `sad` | 难过 | 嘴角向下、眉毛内侧上抬 | 开启，标记实验性 |
| `angry` | 生气 | 皱眉、抿嘴、皱鼻 | 开启，标记实验性 |

- Demo 默认四种都展示。
- 正式试用前由心理老师决定默认开启哪些。
- 所有四种都必须在家长/老师设置里可单独关闭。
- 不接入黑盒“七类情绪分类器”。

### 4.3 校准与匹配

**1.** 采集约 2 秒平静脸。

**2.** 对左右对称动作取平均。

**3.** 减基线并归一化。

**4.** 平滑（EMA 或等价）。

**5.** 加权求分，超过阈值并保持 `holdMs` 才成功。

**6.** 头部偏转超过约 25° 时暂停匹配。

**7.** 脸离开超过约 800ms 时给提示并重置保持进度。

**8.** 成功后发一次成功状态；同一表情需要有冷却，避免连续重复。

具体成功事件可以由情绪页面根据 `EmotionFrame.active` 从 `null` 变为某个 ID 且 `progress >= 1` 推导；也可以由情绪模块额外提供成功回调。推荐后者，避免页面重复判断。

### 4.4 无摄像头

情绪模块提供 `MockEmotionSource`：

- 通过 demo 页面按钮模拟四种表情成功。
- 输出 `EmotionFrame`，不请求摄像头。
- 用于 21 号兜底和无设备演示。

## 5. 反馈合同：FeedbackService

```
export type FeedbackCue =
  | 'pick'
  | 'success'
  | 'retry'
  | 'reward'
  | 'calm';

export interface FeedbackService {
  play(cue: FeedbackCue): void;
  speak(text: string): void;
  setMuted(muted: boolean): void;
  onCaption(handler: (text: string) => void): () => void;
}
```

### 5.1 行为要求

- `play` 必须即时，成功反馈不超过 200ms。
- 不使用刺耳、突然放大的音效。
- `speak` 同时触发字幕；语音不可用时字幕仍要出现。
- `setMuted(true)` 后停止音效和语音，但字幕保留。
- 同一时间只播一条语音；新语音取消旧的。
- 提供 `MockFeedbackService`（只 console/字幕）用于其他模块单独开发。

### 5.2 音效建议

- `pick`：很轻的“拿起”声。
- `success`：柔和三音和弦。
- `retry`：非常轻的提示音，不是错误音。
- `reward`：完成场景的短旋律。
- `calm`：呼吸休息的柔和长音。

## 6. 自适应合同：AdaptiveEngine

```
export interface PerformanceSample {
  mode: 'scenario' | 'gesture' | 'emotion';
  success: boolean;
  attempts: number;
  hintUsed: boolean;
  quality?: number; // 0..1，可选：路径稳定性/匹配峰值
}

export interface AdaptiveEngine {
  record(sample: PerformanceSample): void;
  getSupportLevel(): SupportLevel;
  subscribe(handler: (level: SupportLevel) => void): () => void;
  setManualLevel(level: SupportLevel | 'auto'): void;
  reset(): void;
}
```

### 6.1 规则建议

- 连续 2 次失败：向 0 调整一级。
- 连续 3 次成功且少用提示：向 2 调整一级。
- 一次只调整一级。
- 不因用时长短调整。
- 家长可锁定手动等级；锁定后 `record` 仍记录，但不改等级。
- 每次调整都要通知订阅者。

### 6.2 模块如何使用

- 情景模块在每次作答结束调用 `record`。
- 情绪模块在每次匹配结束调用 `record`。
- 应用壳把 `SupportLevel` 通过 `setSupportLevel()` 传给情景/情绪模块。
- 情景/情绪模块不直接改别人的状态。

## 6.3 情景选择合同：ScenarioGame

情景模块不是“拖到目标”，而是“从 2–3 张应对卡里选一张”。家长控制推进，不自动跳转。

```
export type ScenarioPhase =
  | 'idle'
  | 'loading'
  | 'showing-scenario'
  | 'choosing'
  | 'correct'
  | 'incorrect'
  | 'awaiting-parent'
  | 'finished';

export type ScenarioOptionState =
  | 'idle'
  | 'selected'
  | 'correct'
  | 'suggested';

export interface ScenarioOptionView {
  optionId: string;
  text: string;
  state: ScenarioOptionState;
}

export interface ScenarioResult {
  scenarioId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  bestOptionId: string;
  acceptableOptionIds: string[]; // 所有 isCorrect=true 的选项（含 best）
  explanation: string;
  parentTip?: string;
}

export interface ScenarioState {
  phase: ScenarioPhase;
  scenarioId: string | null;
  title: string;
  situationText: string;
  promptText: string;
  options: ScenarioOptionView[];
  result: ScenarioResult | null;
  scenarioIndex: number;
  totalScenarios: number;
  canRetry: boolean;
}

export interface ScenarioGame {
  start(opts: {
    input: InputSource;
    feedback: FeedbackService;
    adaptive?: AdaptiveEngine;
    supportLevel?: SupportLevel;
  }): Promise<void>;
  subscribe(handler: (state: ScenarioState) => void): () => void;
  getState(): ScenarioState;
  next(): void;    // 只能由家长控制条调用；仅在 awaiting-parent
  retry(): void;   // 只能由家长控制条调用；仅在 awaiting-parent 且 canRetry=true
  finish(): void;  // 家长结束练习
  setSupportLevel(level: SupportLevel): void;
  stop(): void;
}
```

### 6.3.1 状态语义

| 状态 | 含义 |
|---|---|
| `showing-scenario` | 展示情景卡和提示，尚未出现答案卡 |
| `choosing` | 答案卡可见，等待孩子选择 |
| `correct` | 选对，播放正向反馈；随后进入 `awaiting-parent` |
| `incorrect` | 选错，卡片回位，显示更合适答案；随后进入 `awaiting-parent` |
| `awaiting-parent` | 等待家长确认下一步/重试/结束 |
| `finished` | 本次练习结束 |

### 6.3.2 行为要求

- `start()` 订阅 `InputSource`，但不请求摄像头（摄像头由 InputSource 自己管理）。
- 答案卡用捏合 `grab-start` 抓起、`move` 拖动、`grab-end` 松开确认。
- 选对/选错后，必须进入 `awaiting-parent`，不得自动 `next()`。
- `next()` 只在 `awaiting-parent` 有效。
- `retry()` 只在 `awaiting-parent` 且 `canRetry=true` 时有效（`canRetry` 仅在选错后为 true）。
- `finish()` 结束本次练习，应用壳显示小结。
- 选错时：
  - 所选卡回位；
  - `bestOptionId` 高亮；
  - 同时列出 `acceptableOptionIds` 作为“也可以”；
  - 不显示红叉、不播放错误音。
- 手丢失时，已抓起卡片回位，不判错。
- 家长控制条由应用壳渲染；情景模块只暴露状态和方法。

## 7. 应用组合

```
export interface AppDependencies {
  input: InputSource;
  scenarioGame: ScenarioGame;
  emotion: EmotionSource;
  feedback: FeedbackService;
  adaptive: AdaptiveEngine;
}
```

应用壳负责：

- 创建真实或 mock 依赖；
- 根据 URL 参数/设置切换；
- 管理页面路由；
- 在同一时间只启动一个摄像头来源；
- 在离开页面时调用 `stop()`。

推荐 URL 开关：

```
?input=gesture | pointer
?emotion=real | mock
?cards=real | mock
?debug=1
?bot=1
```

## 8. 内容合同

### 8.1 情景内容 content/cards.json

```
export interface ScenarioOption {
  optionId: string;
  text: string;
  isCorrect: boolean;
  isBest: boolean;
  feedback: string;    // 选对时给孩子看的短句
  explanation: string; // 为什么这样更合适
}

export interface Scenario {
  scenarioId: string;
  title: string;
  situationText: string;
  illustration: string;
  promptText?: string; // 默认“你会怎么做？”
  options: ScenarioOption[]; // 2–3 个
  parentTip?: string;
  reviewStatus: 'draft' | 'reviewed';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ScenarioSet {
  version: 1;
  scenarios: Scenario[]; // 10 个
}
```

要求：

- 必须有 10 个情景。
- 每个情景 2–3 个选项。
- 至少一个 `isCorrect=true` 且 `isBest=true`。
- 允许多个 `isCorrect=true`，但只有一个 `isBest=true`。
- `feedback` 用于选对；选错时使用 `explanation` 和 `bestOptionId`。
- 未审核内容必须 `draft`。
- 提示短句建议 ≤ 16 字；情景描述建议 ≤ 30 字。
- 具体内容等心理老师确认后更新；程序不得把内容写死在代码里。
- 涉及安全的情景，必须遵循“先离开、找信任的大人”的总规则。

### 8.2 表情内容 content/expressions.json

使用 `EmotionExpressionConfig[]`。

要求：

- 四种表情都提供配置。
- 难过、生气标记实验性。
- 心理老师可改 `enabled`、`threshold`、`holdMs`、提示语。
- 改内容不需要改代码。

## 9. Mock 规则

每个模块必须提供自己的 mock。mock 放在自己的目录里，避免多人改同一个文件；`src/shared/mocks/` 只放跨模块共享的 mock。

| 模块 | Mock | 建议位置 | 用途 |
|---|---|---|---|
| 手势 | `MockInputSource` | `src/modules/gesture/` | 自动移动/抓取/挥手，或键盘控制 |
| 鼠标 | `PointerInputSource` | `src/app/mocks/` | 无摄像头替代 |
| 情景 | `MockScenarioGame` | `src/modules/cards/`；应用壳可自建简化版 | 自动播放正确/错误/家长推进 |
| 情绪 | `MockEmotionSource` | `src/modules/emotion/` | 按钮模拟四种表情成功 |
| 反馈 | `MockFeedbackService` | `src/modules/feedback/` | 不发声，只出字幕 |
| 自适应 | `MockAdaptiveEngine` | `src/shared/adaptive/` | 固定支持等级，便于测试 |

Mock 必须实现与真实实现完全相同的接口。

每个模块的 demo 至少能用 mock 跑通，不依赖其他模块。

## 10. 错误与降级

| 场景 | 模块 | 行为 |
|---|---|---|
| 摄像头拒绝 | 手势/情绪 | `status: error` + `permission-denied`；界面提供鼠标继续 |
| 无摄像头 | 手势/情绪 | `no-camera`；界面提供替代 |
| 非 HTTPS/localhost | 手势/情绪 | `insecure-context`；提示换环境 |
| 摄像头被占用 | 手势/情绪 | `camera-busy`；提示关闭其他应用 |
| 模型加载失败 | 手势/情绪 | `model-load-failed`；重试 + 降级 |
| 手丢失 | 手势 | `hand-lost`；已抓起卡片回位，不判错 |
| 脸丢失/转头 | 情绪 | `facePresent=false` 或 `message`；暂停保持进度 |
| 选错 | 情景 | 进入 `incorrect` → `awaiting-parent`；高亮更合适答案，不自动下一题 |
| 家长未确认 | 情景 | 停在 `awaiting-parent`，不自动跳转 |
| 页面切后台 | 应用壳 | 暂停；回来后重新开始检测 |
| 退出页面 | 应用壳 | 调用 `stop()`，关闭摄像头 |

## 11. 合同测试

整合负责人至少写一个 `contracts.test.ts`：

- 所有 mock 实现满足接口（TypeScript 编译即可）。
- `InputSource` 的事件顺序符合“grab-start → move(grab=true) → grab-end”。
- `ScenarioGame` 选对/选错都进入 `awaiting-parent`，不会自动 `next()`。
- `ScenarioGame` 的 `next()` 只在 `awaiting-parent` 有效。
- `EmotionFrame` 的 scores 在 0–1。
- `AdaptiveEngine` 在连续失败/成功后按规则调整，且不越界。
- `stop()` 后不再发事件。

每个模块自己的测试：

- 手势：合成手、捏合、挥手、手丢失。
- 情景：10 个情景加载、选对/选错、家长推进、重试、手丢失。
- 情绪：校准、四种表情、脸丢失。
- 反馈：静音、字幕、语音队列。
- 应用壳：无摄像头路径、家长控制条、家长角、设置持久化。

## 12. 修改流程

**1.** 任何人发现合同需要改，先在群里说明原因。

**2.** 整合负责人在 `integration` 分支修改 `src/shared/contracts.ts` 和本文件。

**3.** 通知所有人拉取最新合同。

**4.** 各模块在同一天内适配。

**5.** 21 号整合当天冻结合同，不再改字段。

**禁止：**

- 直接改别人的模块目录。
- 私自改事件名/坐标含义。
- 在模块里 import 另一个模块的内部文件。
- 把原始画面、关键点、儿童数据写进日志或 Git。
- 用 CDN 加载模型/wasm。

## 13. 一页速查

```
手/鼠标/机器人 → InputSource → 情景模块
情景模块 → ScenarioGame → 应用壳 → 家长控制条 → next/retry/finish
摄像头 → EmotionSource → 情绪页面
情景/情绪 → FeedbackService → 音效/语音/字幕
情景/情绪 → AdaptiveEngine → 支持等级 → 情景/情绪
应用壳 → 创建真实/mock 依赖，负责路由和摄像头生命周期
```

记住三句话：

**1.** **只通过合同说话。**

**2.** **每个模块都能单独 demo。**

**3.** **坏了就切 mock，21 号不现场重写。**
