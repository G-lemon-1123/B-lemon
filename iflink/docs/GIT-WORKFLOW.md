# Git 工作流（全员必读）

单仓库，不用五个独立仓库。每个人只在自己的分支和目录里工作，`main` 只有整合负责人能合。

## 1. 分支

| 分支 | 用途 | 谁能合 |
|---|---|---|
| `main` | 稳定版，只在整合完成后由整合负责人更新 | 整合负责人 |
| `integration` | 目标分支，所有 `feat/*` 往这里合；21 号整合日在这里工作 | 整合负责人 |
| `feat/gesture` | 手势识别（项目负责人） | 本人 |
| `feat/shell` | 应用壳、家长流程、自适应（成员 B） | 本人 |
| `feat/cards` | 情景卡牌（成员 C） | 本人 |
| `feat/emotion` | 情绪镜像（成员 D） | 本人 |
| `feat/feedback` | 反馈、设计、QA、CI（成员 E） | 本人 |

## 2. 第一天：克隆并切到自己的分支

```bash
git clone https://github.com/huodianditu/iflink.git
cd iflink

# 五条 feat 分支已经建好，直接切过去，不要自己新建
git switch feat/gesture     # 换成你自己的分支名
```

分支已存在时用 `git switch`，**不要**用 `git switch -c`，否则会多出一个同名不同源的分支。

## 3. 每天：提交与推送

```bash
git status                      # 先看清楚改了哪些文件
git add <你的文件>              # 只加自己目录里的文件，不要 git add -A
git commit -m "feat(gesture): 接入摄像头与光标"
git push                        # 第一次用 git push -u origin feat/gesture
```

- 每次只做一个小组件，提交信息写清楚 `类型(模块): 做了什么`。
- 提交前确认 `git status` 里没有别人的目录、没有 `.env`、没有儿童照片/视频。
- 有冲突先 `git pull --rebase`，解完再推；**不要** `git push --force`。

## 4. 交分支（最晚 20 号）

1. 按 `docs/HANDOFF-TEMPLATE.md` 填好自己模块目录下的 `HANDOFF.md`（例如 `src/modules/cards/HANDOFF.md`）。
2. 推上去：`git push`。
3. 在 GitHub 上发 Pull Request：**base 选 `integration`，compare 选你的 `feat/xxx`**，不是 `main`。
4. 不会用 PR 就告诉整合负责人你的分支名，让他来合。

## 5. 21 号整合（只有整合负责人操作）

合并顺序固定：

1. 合同与 mocks
2. 应用壳
3. 手势
4. 情景卡牌
5. 情绪
6. 反馈/设计/CI

每合一个分支：跑 `typecheck` 和 `test`；全部合完跑 `build`。某个模块失败就切 mock 兜底，保证演示完整——21 号不现场重写。

## 6. 禁止事项

- 不改别人的模块目录、不改 `src/shared/contracts.ts`、不改 `package.json` 依赖，除非整合负责人同意。
- 不用 CDN；模型和 wasm 必须本地。
- 不提交儿童照片、视频、同意书、真实试用数据、密钥。
- 不使用 `git push --force`、`git reset --hard`、删除分支。
- 不直接往 `main` 推，也不把 PR 开到 `main`。

## 7. 常用排查

```bash
git branch -vv                 # 看自己在哪个分支、跟踪哪个远端
git log --oneline -10          # 看最近提交
git restore <文件>             # 丢弃还没提交的改动
git stash                      # 临时收起改动，切分支前用
```

改错了不要慌，先 `git status` 和 `git log`，再问整合负责人；不要用 `reset --hard` 自己修。
