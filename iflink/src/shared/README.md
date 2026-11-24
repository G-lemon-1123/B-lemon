# 共享层（src/shared/）

这里是五个模块共用的东西。改动会同时影响所有人，所以规则比其他目录严格。

| 路径 | 内容 | 维护人 | 其他人 |
|---|---|---|---|
| `contracts.ts` | 五个模块之间的接口合同：InputSource、ScenarioGame、EmotionSource、FeedbackService、AdaptiveEngine | 整合负责人 | 只读，不得修改 |
| `mocks/` | 跨模块共享的 mock（MockInputSource、PointerInputSource、MockScenarioGame、MockEmotionSource、MockFeedbackService、MockAdaptiveEngine） | 整合负责人 | 只读 |
| `adaptive/` | 自适应引擎 | 成员 B | 只读，通过合同调用 |
| `design/` | 视觉规范与设计令牌 | 成员 E | 只读，引用令牌 |

## 规则

1. `contracts.ts` 的唯一真源是 [`docs/CONTRACTS.md`](../docs/CONTRACTS.md)。两者必须一致；不一致时先停下来，找整合负责人。
2. 需要新增字段或事件时：先在群里说明原因 → 整合负责人在 `integration` 分支同时改 `docs/CONTRACTS.md` 与 `contracts.ts` → 通知全员 → 各分支各自适配。
3. 模块自己的 mock 放在自己目录（例如 `src/app/mocks/`），只有跨模块共用的才放 `mocks/`。
4. 21 号整合当天不允许改合同。

> 当前是文档阶段，`contracts.ts` 尚未创建；它会在整合负责人的「任务一：仓库骨架」提交中出现。
