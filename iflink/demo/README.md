# 独立 demo 入口

| 项目 | 内容 |
|---|---|
| 负责人 | 五人各自维护自己的一页 |
| 分支 | `各自分支` |
| 独立 demo | `/demo/gesture.html`、`/demo/shell.html`、`/demo/cards.html`、`/demo/emotion.html`、`/demo/feedback.html` |

## 这个目录放什么

每个模块必须能脱离主应用单独打开验证，坏了也不影响别人。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 说明

- 独立 demo 只依赖本模块 + mock，不依赖应用壳装配完成。
- 页面上要能直接看出「这个模块在做什么」，方便 21 号当天逐个演示。
