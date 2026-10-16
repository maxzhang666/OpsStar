# 在你自己的 CI 里调用这个 Star 书架

本项目同时提供两种入口，功能完全相同，按喜好选一种：

- **复合 action** —— 写法是 `uses: maxzhang666/OpsStar@main`，需要自己声明 `runs-on` 和 `on:`
- **可复用工作流** —— 写法是 `uses: .../.github/workflows/sync.yml@main`，声明在 job 上

两种都不需要 fork，也不需要往仓库里拷脚本。下面的示例以复合 action 为主。

## 最小可用

把这个文件复制到你的仓库：`.github/workflows/stars.yml`，改掉 `actor` 就行。

```yaml
name: My Stars

on:
  schedule:
    - cron: '17 3 * * *'        # 每天跑一次；不需要定时就删掉这段
  workflow_dispatch:             # 保留就能在 Actions 页面手动触发

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: maxzhang666/OpsStar@main
        with:
          actor: <你的 GitHub 用户名>   # ← 唯一必填项
```

若想用可复用工作流，把 jobs 部分换成：

```yaml
jobs:
  build:
    uses: maxzhang666/OpsStar/.github/workflows/sync.yml@main
    permissions:
      contents: write
    with:
      actor: <你的 GitHub 用户名>
```

---

## 用法一：最小可用（三行就够）

```yaml
name: My Stars

on:
  schedule:
    - cron: '17 3 * * *'        # 每天跑一次；不需要定时就删掉这段
  workflow_dispatch:             # 保留就能在 Actions 页面手动触发

jobs:
  build:
    uses: maxzhang666/OpsStar/.github/workflows/sync.yml@main
    with:
      actor: <你的 GitHub 用户名>   # ← 唯一必填项
```

跑完站点就发布到**你这个仓库**的 `gh-pages` 分支。

---

## 用法二：自定义标题和语言

```yaml
jobs:
  build:
    uses: maxzhang666/OpsStar/.github/workflows/sync.yml@main
    with:
      actor: <你的 GitHub 用户名>
      title: My Star Shelf
      desc: Repositories I bookmarked in 2026
      lang: en                # en 或 zh-CN
```

---

## 用法三：star 超过 6000 个时才需要 token

匿名请求每小时 60 次，约能翻 6000 个仓库。超过这个量级，去
**Settings → Secrets and variables → Actions** 新建一个 secret（叫什么都行，这里用
`STAR_TOKEN`），填一个只勾 `public_repo` 权限的 PAT。

复合 action 拿不到 `secrets` 上下文，所以要用 `env:` 传（这样日志里仍会被掩码）：

```yaml
      - uses: maxzhang666/OpsStar@main
        env:
          GH_TOKEN: ${{ secrets.STAR_TOKEN }}
        with:
          actor: <你的 GitHub 用户名>
```

用可复用工作流则可以走 `secrets:`：

```yaml
jobs:
  build:
    uses: maxzhang666/OpsStar/.github/workflows/sync.yml@main
    with:
      actor: <你的 GitHub 用户名>
    secrets:
      star_token: ${{ secrets.STAR_TOKEN }}
```

---

## 可选参数一览

| 参数 | 说明 | 默认 |
|---|---|---|
| `actor` | 抓谁的 star | 你的仓库所有者 |
| `limit` | 最多取多少个（调试用） | 全部 |
| `enrich` | 给前 N 个仓库抓语言分布，每个 +1 次请求 | `0`（不抓） |
| `title` | 站点标题 | `Star 书架` |
| `desc` | 站点副标题 | `我 star 过的 GitHub 仓库` |
| `lang` | 界面默认语言 | `zh-CN` |
| `branch` | 站点发布到哪个分支 | `gh-pages` |

> 这些是 OpsStar 脚本的命令行参数。别人调用时通过 `with:` 传同名参数，
> 由工作流负责翻译 —— 你不需要知道命令行怎么写。

---

## 换发布分支

默认发布到 `gh-pages`。如果你已经在用别的分支（比如 `docs/`），或者不想让站点占用
`gh-pages` 这个名字，可以改：

```yaml
jobs:
  build:
    uses: maxzhang666/OpsStar/.github/workflows/sync.yml@main
    permissions:
      contents: write
    with:
      actor: <你的 GitHub 用户名>
      branch: site-output
```

改完之后有一步别忘了：**仓库 Settings → Pages → Source 的分支名要改成同一个**，
否则 workflow 推上去了但 Pages 不会更新。

几点说明：

- 分支名会被 `git check-ref-format` 校验，含空格或 `-` 开头的名字会被直接拒绝并给出提示。
- 可以带斜杠（`pages/site`），但 git 的 ref 是文件式的：**`pages` 和 `pages/site` 不能共存**。
  如果要嵌套名，就别再单独建同名的父分支。
- 每次推送是强推（`--force`）到该分支且只保留一个提交，不会在你的仓库里堆历史。

---

## ⚠️ 两个必须知道的点

**1. 你的工作流必须自己给写权限。** GitHub 不允许被调用的工作流提权，所以调用方
不给 `contents: write`，推送发布分支就会失败。带 `schedule` 定时任务时尤其要注意：

```yaml
jobs:
  build:
    uses: maxzhang666/OpsStar/.github/workflows/sync.yml@main
    permissions:
      contents: write      # ← 没有这行，推送会失败
    with:
      actor: <你的 GitHub 用户名>
```

**2. 先开 Pages，否则站点不会上线。** 仓库 Settings → Pages → Source 选
*Deploy from a branch* → 分支 `gh-pages` → 目录 `/ (root)`。
第一次要手动跑一次 workflow 生成 `gh-pages` 分支，Pages 才能开始托管。

---

## 想改成每天自动跑？

上面示例里的 `schedule` 就是。`cron` 用 UTC 时间，且刻意没用整点（`17 3`）——
整点是 GitHub 的高峰时段，排队容易被延迟。