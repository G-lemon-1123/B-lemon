# 情绪镜像模块

| 项目 | 内容 |
|---|---|
| 负责人 | 成员 D |
| 分支 | `feat/emotion` |
| 独立 demo | /demo/emotion.html |

## 这个目录放什么

开心、惊讶、难过、生气四种表情的校准、匹配、保持判定、无摄像头降级；对外只导出 `EmotionSource` 的实现。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 只允许改

```
src/modules/emotion/
content/expressions.json
demo/emotion.html
public/models/face_landmarker.task
```

模型必须放在 `public/models/` 并本地加载；不要调用云端接口，不要上传画面。
