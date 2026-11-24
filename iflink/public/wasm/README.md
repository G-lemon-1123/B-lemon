# MediaPipe wasm

| 项目 | 内容 |
|---|---|
| 负责人 | 整合负责人 |
| 分支 | `feat/gesture` |
| 独立 demo | 手势/情绪 demo |

## 这个目录放什么

`@mediapipe/tasks-vision` 的 wasm 文件，从 `node_modules` 复制到这里统一管理。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 说明

只有整合负责人往这里放文件，避免版本不一致；升级 wasm 必须同步升级依赖版本并通知全员。
