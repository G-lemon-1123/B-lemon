# 手势识别模块

| 项目 | 内容 |
|---|---|
| 负责人 | 项目负责人（你） |
| 分支 | `feat/gesture` |
| 独立 demo | /demo/gesture.html |

## 这个目录放什么

摄像头、MediaPipe Hand Landmarker、光标、捏合、挥手、手丢失、错误状态；对外只导出 `createGestureInput(): InputSource`。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 只允许改

```
src/modules/gesture/
demo/gesture.html
public/models/hand_landmarker.task
public/wasm/
```

`src/shared/contracts.ts`、`src/shared/mocks/`、`docs/` 只有整合负责人（你）在明确安排时改；`package.json` 依赖变更要先确认。
