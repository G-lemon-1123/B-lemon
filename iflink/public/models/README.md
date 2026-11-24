# 本地模型文件

| 项目 | 内容 |
|---|---|
| 负责人 | 整合负责人（hand_landmarker.task）/ 成员 D（face_landmarker.task） |
| 分支 | `feat/gesture、feat/emotion` |
| 独立 demo | 各模块 demo |

## 这个目录放什么

`hand_landmarker.task`（约 8MB）、`face_landmarker.task`；模型一律本地加载，不走 CDN。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 说明

模型文件用 Git LFS 或直接提交前先和整合负责人确认；不要把模型换成来源不明的版本。
