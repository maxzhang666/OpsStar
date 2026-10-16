# Star 书架

把 GitHub 上 star 过的仓库抓下来，生成一个可搜索、可筛选的静态列表站，部署到 GitHub Pages。

无需服务器、无数据库、无前端框架。

---

## ⭐ 最快的方式：直接在你的 CI 里调用

**不用 fork，也不用往仓库里拷脚本。** 在你的仓库建一个 `.github/workflows/stars.yml`：

```yaml
name: My Stars

on:
  schedule:
    - cron: '17 3 * * *'
  workflow_dispatch:

jobs:
  build:
    uses: maxzhang666/OpsStar/.github/workflows/sync.yml@main
    permissions:
      contents: write          # 必须有，否则推送 gh-pages 会失败
    with:
      actor: <你的 GitHub 用户名>
```

完事。站点会发布到**你自己仓库**的 `gh-pages` 分支。

想自定义标题、传 token、以及踩坑提示，见 **[docs/how-to-use.md](docs/how-to-use.md)**。

---

## 它长什么样

列表页为主：左侧筛选（语言 / 许可证 / 星标数 / 归档状态），中间网格或列表两种视图，支持搜索和四种排序。点仓库名或「访问仓库」跳回 GitHub。

- **滚动自动加载**：滑到底部自动加载下一批，不会一次塞进上千个卡片
- **常驻底栏**：版权、生成时间、仓库链接固定在底部，列表再长也一直可见
- **深浅色**：右上角菜单切换浅色 / 深色 / 跟随系统，选择会被记住

界面沿用了 `2026-10-15-software-community` 那份 Shelf 原型的设计语言（Tailwind v4 + shadcn neutral 色板），但**字段全部换成了 GitHub 真实数据**：原型里的平台、价格、评分在 star 数据里不存在，所以直接砍掉；渐变方块图标换成 owner 的真实头像 + 语言色点。

---

## 本地跑（改代码时用）

```bash
# 1. 抓取（公开 star 无需凭据）
python3 scripts/fetch_stars.py --actor <用户名> --out data/stars.json

# 2. 构建
python3 scripts/build_site.py --data data/stars.json --out dist

# 3. 本地预览
cd dist && python3 -m http.server 8000
```

浏览器打开 `http://localhost:8000`。

> `data/stars.json` 和 `dist/` 都在 `.gitignore` 里，每次都由 workflow 重新生成。

## 抓取 star

**公开 star 不需要任何凭据**，指定用户名即可：

```bash
python3 scripts/fetch_stars.py --actor <你的用户名> --out data/stars.json
```

匿名请求每小时配额 60 次，约能翻 6000 个仓库，对绝大多数人的 star 数量够用。

### 什么时候才需要 token

只有一种情况：**你的 star 超过 6000 个**（匿名每小时只能翻约 6000 个）。

```bash
export GITHUB_TOKEN=ghp_xxx        # 或 GH_TOKEN
python3 scripts/fetch_stars.py --actor <你的用户名> --out data/stars.json
```

token 只需勾 `public_repo`（或 `read:user`）。

> ⚠️ **不要用 Actions 内置的 `secrets.GITHUB_TOKEN` 抓 star。** 它是 GitHub App 的
> *installation token*，调 `/user/starred` 会返回 **403** —— integration token 无权访问
> 用户级接口。这也是可复用工作流默认走匿名 + `--actor` 的原因。
> 这也是本项目 workflow 默认走匿名 + `--actor` 的原因。

### 常用参数

| 参数 | 作用 |
|---|---|
| `--actor 用户名` | 要查谁的 star（匿名模式下必填） |
| `--limit N` | 最多取 N 个（调试用） |
| `--enrich N` | 给前 N 个仓库额外抓语言分布（每个 +1 次请求） |

---

## 部署到 GitHub Pages

推荐直接用上面的**可复用工作流**（不用 fork 本仓库）。以下是「fork 后自己维护」的路径：

1. 把这个仓库 fork 到你的 GitHub 账号
2. Settings → Pages → Source 选 **Deploy from a branch**，分支选 `gh-pages`、目录选 `/ (root)`
3. 打开 Actions → **Sync stars** → Run workflow，手动跑一次来生成 `gh-pages` 分支
   （Pages 必须先有这个分支才能开始托管）

之后不用再管，每天 03:17 UTC（北京时间 11:17）自动更新。

**关于凭据：** 默认**不需要配置任何 secret** —— workflow 走匿名请求 + `--actor <你的用户名>`。
内置的 `GITHUB_TOKEN` 只用于把产物推到 `gh-pages`，它有 `contents: write` 权限，但不能用来读 star。

如果你 star 很多（>6000），在 Settings → Secrets → Actions 新建一个名为 `PAT` 的 secret
（勾 `public_repo` 即可），workflow 会自动改用带认证的请求。

---

## 数据从哪来

只用 GitHub 公开 REST API，实测确认可拿到：

| 字段 | 来源 |
|---|---|
| star 时间 `starred_at` | `/user/starred` + `Accept: application/vnd.github.star+json` |
| topics / license / 语言 / star 数 / 是否归档 | 同上，一次请求随仓库对象一起返回 |
| 语言字节数分布 | `/repos/{o}/{r}/languages`（`--enrich` 才抓） |
| README | `/repos/{o}/{r}/readme` |

**成本：** `per_page=100` 一次就能拿 100 个仓库的完整对象，所以 1000 个 star 约等于 10 次请求。真正的开销在 `--enrich`，每多一个仓库就多一次请求，所以默认关闭。

**字段裁剪：** GitHub 原始仓库对象有 70+ 个键，全塞进产物会让 `data.js` 膨胀到几 MB。`normalize()` 只保留展示层真正用得到的字段。相对时间在抓取时就转成「距今天数」，避免每次构建都因为时间戳变化而产生 diff。

---

## 目录结构

```
scripts/
  fetch_stars.py              抓取 + 归一化 → data/stars.json
  build_site.py               组装静态站 → dist/
  input.css                   Tailwind 源文件（含设计 token）
  src/
    index.html                页面骨架，含防闪烁的主题内联脚本
    app.js                    筛选 / 搜索 / 排序 / 分页 / 渲染
    i18n.js                   中英文案
    app.css                   Tailwind 编译产物（勿手改）
.github/workflows/sync.yml    可复用工作流：schedule + 手动触发 + 供他人调用
docs/how-to-use.md            调用方使用说明（复制粘贴模板）
data/stars.json               抓取产物（gitignore）
dist/                         构建产物（gitignore）
```

---

## 改样式 / 改文案

**改了 `src/` 下的文件，要重新编译 CSS**，否则新加的 class 不会生效（Tailwind 是按实际用到的 class 编译的）：

```bash
cd scripts
npx @tailwindcss/cli -i ./input.css -o ./src/app.css --minify
```

> 这是踩过的坑：直接复用别人编译好的 `app.css`，里面只有对方用过的 class。缺class 不报错，只是样式静默失效。

**加文案：** 在 `src/i18n.js` 的中英两处都补上。占位符形如 `{n}`，调用时 `t('key', { n: 12 })`。

---

## 已知限制

- **每次构建都是全量快照**，没有增量。star 数不多时无所谓。
- **不抓 README 到列表页**。`--enrich` 只存了语言分布；详情页/详情抽屉还没做。
- **语言色是内置表**，Tailwind/Rust 之类的新语言会落到灰色兜底。
- **`NOASSERTION` 许可证**显示为「无许可证」——GitHub 对识别不出的协议会给这个值。
- **分页是纯前端截断**，每次「加载更多」会重渲染整个列表。2000 条以内实测无卡顿，再多需要改虚拟滚动。

---

## 实测性能

2000 个仓库（合成数据，`data.js` 1.26 MB）：

| 指标 | 结果 |
|---|---|
| 首屏（渲染 60 张） | 618 ms 载入 / 7 ms 渲染 |
| 语言筛选 | 88 ms |
| 关键词搜索 | 31 ms |
| 排序 | 121 ms |

滚动加载实测：60 → 1222 步进均匀，每次追加 60 条且只插入新节点，不重建已渲染内容。