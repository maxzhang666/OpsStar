# 在你自己的 CI 里调用

一个 GitHub Action。把下面这段放进你仓库的 `.github/workflows/stars.yml` 就能用，
不需要 fork 本仓库，也不需要拷任何脚本。

```yaml
name: My Stars

on:
  schedule:
    - cron: '17 3 * * *'        # 每天跑一次；不需要定时就删掉这段
  workflow_dispatch:             # 保留就能在 Actions 页面手动触发

# 推分支需要写权限。action 不能自行提权，必须由调用方给。
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

跑完后站点文件会推到 `gh-pages` 分支（可配置），根目录是 `index.html`、
`app.js`、`app.css`、`i18n.js`、`data.js`、`.nojekyll`，GitHub Pages 可直接托管。

## 与 mawesome 的差别

调用方式相同，都是 `uses:` 引用一个仓库。产出不同：

| | mawesome | 本 action |
|---|---|---|
| 产出 | `data.json` + 渲染后的 `README.md` | 完整页面文件（`index.html` 等） |
| 落地位置 | 提交回当前分支 | 推送到指定分支 |
| Pages | 无法直接托管 | 可直接托管 |

所以 mawesome 生成的仓库不能直接开 Pages，本 action 可以。

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

> 这些参数通过 `with:` 传入同名 key 即可。

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

## 三个必须知道的点

**1. 权限必须自己给。** action 不能自行提权，缺了 `permissions` 推送会失败。
注意它写在**workflow 顶层**，不是 job 里：

```yaml
permissions:
  contents: write      # ← 没有这行，推送会失败
```

**2. 先开 Pages，否则站点不会上线。** 仓库 Settings → Pages → Source 选
*Deploy from a branch* → 分支 `gh-pages` → 目录 `/ (root)`。
第一次要手动跑一次 workflow 生成该分支，Pages 才能开始托管。

**3. 不要让 workflow 自己触发自己。** 别加 `push` 触发器 ——
本action 把产物推到 `gh-pages`，若 Pages 源分支就是 `gh-pages`，
下次运行产生的提交会再次触发 workflow，形成循环。只用 `schedule` 和 `workflow_dispatch`。

---

## 想改成每天自动跑？

上面示例里的 `schedule` 就是。`cron` 用 UTC 时间，且刻意没用整点（`17 3`）——
整点是 GitHub 的高峰时段，排队容易被延迟。