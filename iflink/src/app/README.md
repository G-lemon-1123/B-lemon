# 应用壳

| 项目 | 内容 |
|---|---|
| 负责人 | 成员 B |
| 分支 | `feat/shell` |
| 独立 demo | /demo/shell.html |

## 这个目录放什么

路由、首页、家长说明、摄像头授权入口、家长角、设置与本地存储、家长控制条、最终组合五个模块。

## 约定

- 只改本目录（以及上面写明的路径），不要动别人的模块。
- 只通过 `src/shared/contracts.ts` 与别的模块说话，不直接 import 别人的内部实现。
- 需要改合同字段时，先找整合负责人，在 `integration` 分支统一改。
- 不用 CDN；不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 交分支前按 `docs/HANDOFF-TEMPLATE.md` 在本目录写一份 `HANDOFF.md`。

## 只允许改

```
src/app/
demo/shell.html
src/shared/adaptive/
```

应用壳负责最终组合，其他模块不直接改主页面；壳里没有真实模块时必须能切 mock 跑通全流程。
