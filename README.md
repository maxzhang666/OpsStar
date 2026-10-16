# Star 书架

把 GitHub 上 star 过的仓库抓下来，生成一个可搜索、可筛选的静态列表站，托管在 GitHub Pages 上。

抓取由 GitHub Actions 定时执行，没有服务器、数据库或前端框架。

<p align="center">
  <em>列表页 · 支持语言 / 许可证 / 星标数筛选 · 滚动自动加载 · 深浅色</em>
</p>

---

## 使用方式

一个 action，声明在自己的 workflow 里。参考 `simonecorsi/mawesome` 的用法，差别在于产出：
mawesome 把 `data.json` 和渲染后的 `README.md` 提交回当前分支，本 action 推送一套
可直接被 Pages 托管的页面文件到指定分支。

新建 `.github/workflows/stars.yml`：

```yaml
name: My Stars

on:
  schedule:
    - cron: '17 3 * * *'
  workflow_dispatch:

# 推分支需要写权限。action 不能自行提权，必须由调用方给。
permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: maxzhang666/OpsStar@main
        with:
          actor: <你的 GitHub 用户名>
```

产出落在 `gh-pages` 分支，根目录是 `index.html`、`app.js`、`app.css`、`i18n.js`、
`data.js` 和 `.nojekyll`，Pages 可直接托管。

star 不超过 6000 个时不需要任何 token。若超过，配一个只勾 `public_repo` 的 PAT，
通过 `env:` 传入（action 拿不到 `secrets` 上下文，这样日志里仍会被掩码）：

```yaml
      - uses: maxzhang666/OpsStar@main
        env:
          GH_TOKEN: ${{ secrets.STAR_TOKEN }}
```

## 可配置项

| 参数 | 说明 | 默认值 |
|---|---|---|
| `actor` | 抓取哪个用户的 star | 调用方仓库所有者 |
| `title` | 站点标题 | `Star 书架` |
| `desc` | 站点副标题 | `我 star 过的 GitHub 仓库` |
| `lang` | 界面默认语言（`zh-CN` / `en`） | `zh-CN` |
| `limit` | 最多抓取多少个 | 全部 |
| `enrich` | 为前 N 个仓库额外抓取语言分布 | `0`（不抓） |
| `branch` | 站点发布到哪个分支 | `gh-pages` |
| `star_token` | PAT，仅在 star 超过 6000 个时需要 | 无 |

配置项会写入 `data.js`，调用方无需修改任何源码即可定制站点。

## 本地开发

抓取公开 star 不需要任何凭据：

```bash
# 1. 抓取
python3 scripts/fetch_stars.py --actor <用户名> --out data/stars.json

# 2. 构建
python3 scripts/build_site.py --data data/stars.json --out dist

# 3. 预览
cd dist && python3 -m http.server 8000
```

`data/stars.json` 与 `dist/` 均在 `.gitignore` 中，由 workflow 重新生成。

`scripts/fetch_stars.py` 只使用 Python 标准库，在 Actions 里无需安装依赖。本地改样式时需要 Node：

```bash
cd scripts && npm install
```

## 页面能力

- 网格 / 列表两种视图，浅色 / 深色 / 跟随系统三种主题，选择记忆在 localStorage
- 按语言、许可证、星标数、归档状态筛选，支持关键词搜索和四种排序
- 滚动到底部自动加载下一批，初始渲染 60 条
- 底部常驻栏展示版权、生成时间与仓库链接
- 中英文界面，窄屏可用

界面参考了 `2026-10-15-software-community` 的 Shelf 原型（Tailwind v4 + shadcn neutral 色板），但字段取自 GitHub 真实数据：原型的平台、价格、评分在 star 数据中不存在，因此未予保留；图标改用 owner 头像与语言色点。

## 数据来源

全部来自 GitHub 公开 REST API：

| 字段 | 接口 |
|---|---|
| star 时间 | `/user/starred` + `Accept: application/vnd.github.star+json` |
| topics、license、语言、star 数、是否归档 | 同上，随仓库对象一并返回 |
| 语言字节数分布 | `/repos/{owner}/{repo}/languages`（`--enrich` 才请求） |
| README | `/repos/{owner}/{repo}/readme` |

几点实现细节：

- `starred_at` 必须加 `star+json` 媒体类型才会返回，否则只能拿到仓库对象。
- `per_page=100` 一次即可获得 100 个仓库的完整对象，1000 个 star 约需 10 次请求；开销集中在 `--enrich`。
- 仓库原始对象有 70+ 个字段，`normalize()` 只保留展示层需要的部分，否则 `data.js` 会膨胀到数 MB。
- 相对时间在抓取阶段即换算为「距今天数」，避免每次构建因时间戳变化产生无意义 diff。

## 部署

在仓库 **Settings → Pages → Source** 选择 *Deploy from a branch*，
分支选 `gh-pages`（或你配置的分支名），目录 `/ (root)`。
之后手动触发一次 workflow 生成该分支，Pages 即可开始托管。

如果通过 `branch` 指定了其他分支名，Pages 的 Source 分支需改成同一个名字。

## 目录结构

```
action.yml                 GitHub Action 入口
scripts/
  fetch_stars.py           抓取与归一化
  build_site.py            组装静态站
  input.css                Tailwind 源文件与设计 token
  src/
    index.html             页面骨架
    app.js                 筛选、搜索、排序、无限滚动
    i18n.js                中英文案
    app.css                Tailwind 编译产物
docs/how-to-use.md         调用方文档
stars-workflow.yml         Stars 仓库的调用示例
data/stars.json            抓取产物（gitignore）
dist/                      构建产物（gitignore）
```

---

## 修改样式或文案

改动 `scripts/src/` 下的文件后需要重新编译 CSS：

```bash
cd scripts && npm run css
```

Tailwind 只编译实际用到的 class，直接复用其他项目的编译产物会导致新增 class 缺失——不会报错，样式只是不生效。

文案在 `scripts/src/i18n.js` 中维护，中英两处需同步补充。占位符形如 `{n}`，调用时传入 `t('key', { n: 12 })`。

## 已知限制

- 每次构建都是全量快照，无增量更新。
- 列表页不抓取 README。语言分布目前也未在页面中展示，`--enrich` 的结果仅写入数据文件。
- 语言配色为内置映射表，未收录的语言（如 Zig）会落到灰色兜底。
- GitHub 对无法识别的协议返回 `NOASSERTION`，界面显示为「无许可证」。
- 无限滚动为整批追加节点，未做虚拟滚动。实测 1222 条流畅，数据量更大时需要改造。

## 性能

2000 条合成数据（`data.js` 1.26 MB）下的实测：

| 操作 | 耗时 |
|---|---|
| 首屏（渲染 60 条） | 7 ms |
| 语言筛选 | 88 ms |
| 关键词搜索 | 31 ms |
| 排序 | 121 ms |