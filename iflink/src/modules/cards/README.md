# 情景卡牌模块

| 项目 | 内容 |
|---|---|
| 负责人 | 成员 C |
| 分支 | `feat/cards` |
| 独立 demo | /demo/cards.html |

## 这个目录放什么

10 个社交情景、每情景 2–3 张应对卡、抓取/拖拽/确认、选对与选错反馈、家长推进；对外只导出 `ScenarioGame` 的实现。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 只允许改

```
src/modules/cards/
content/cards.json
demo/cards.html
```

情景内容全部标记 `draft`，心理老师审核后才改 `reviewed`；不要在代码里写死情景文本。
