# 内容文件

| 项目 | 内容 |
|---|---|
| 负责人 | 成员 C（cards.json）/ 成员 D（expressions.json） |
| 分支 | `feat/cards、feat/emotion` |
| 独立 demo | 随对应 demo |

## 这个目录放什么

`cards.json`：10 个情景与应对卡，含 `status`、`reviewedBy`、`reviewedAt`；`expressions.json`：四种表情的动作权重与儿童提示语。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 说明

内容与代码分离：改文案不用改代码。所有情景默认 `status: draft`，心理老师签字后才改 `reviewed`。不要写真实儿童信息。
