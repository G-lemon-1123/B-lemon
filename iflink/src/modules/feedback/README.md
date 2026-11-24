# 反馈服务模块

| 项目 | 内容 |
|---|---|
| 负责人 | 成员 E |
| 分支 | `feat/feedback` |
| 独立 demo | /demo/feedback.html |

## 这个目录放什么

五种柔和音效、语音与字幕、静音与减少动态；对外只导出 `FeedbackService` 的实现。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 只允许改

```
src/modules/feedback/
src/shared/design/
tests/e2e/
.github/workflows/
docs/qa/
demo/feedback.html
```

音频、字体都要本地；默认音量适中，静音后字幕仍然可用。
