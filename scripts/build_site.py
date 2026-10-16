#!/usr/bin/env python3
"""把 scripts/src 与抓取结果组装成可直接发布的静态站。

输出目录结构与 GitHub Pages 的「Deploy from a branch」一致：
  dist/index.html
  dist/app.css
  dist/i18n.js
  dist/app.js
  dist/data.js   ← data/stars.json 转成 window.STARS 赋值

用法：
  python3 build_site.py --data data/stars.json --out dist
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
STATIC = ["index.html", "app.css", "i18n.js", "app.js"]


def main() -> int:
    ap = argparse.ArgumentParser(description="组装静态站")
    ap.add_argument("--data", default="data/stars.json", help="抓取产物路径")
    ap.add_argument("--out", default="dist", help="输出目录")
    ap.add_argument("--title", default="", help="站点标题（留空用默认）")
    ap.add_argument("--desc", default="", help="站点副标题（留空用默认）")
    ap.add_argument("--lang", default="", choices=["", "zh-CN", "en"], help="界面默认语言")
    args = ap.parse_args()

    if not os.path.exists(args.data):
        print(f"❌ 找不到数据文件 {args.data}，先跑 fetch_stars.py", file=sys.stderr)
        return 1

    with open(args.data, encoding="utf-8") as f:
        payload = json.load(f)

    repos = payload.get("repos", [])
    if not repos:
        print("❌ 数据里没有任何仓库，终止构建（避免发布空站）", file=sys.stderr)
        return 1

    # 站点配置写进 data.js，前端优先读它 —— 这样别人调用时能改标题，
    # 不必 fork 仓库去改 i18n.js 里的中文串。
    if args.title or args.desc or args.lang:
        site = dict(payload.get("site") or {})
        if args.title:
            site["title"] = args.title
        if args.desc:
            site["desc"] = args.desc
        if args.lang:
            site["lang"] = args.lang
        payload["site"] = site

    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)

    for name in STATIC:
        src = os.path.join(SRC, name)
        if not os.path.exists(src):
            print(f"❌ 缺文件 {src}", file=sys.stderr)
            return 1
        shutil.copy2(src, os.path.join(out, name))

    # data.js 用赋值语句而非裸 JSON：静态站以 file:// 直接打开时，fetch 会被 CORS 拦掉
    with open(os.path.join(out, "data.js"), "w", encoding="utf-8") as f:
        f.write("// 由 fetch_stars.py 生成，请勿手改\n")
        f.write("window.STARS = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    # Pages 需要这个空文件才会原样发布 _ 前缀目录，我们没有但加上更安全
    open(os.path.join(out, ".nojekyll"), "w").close()

    total = 0
    for name in sorted(os.listdir(out)):
        size = os.path.getsize(os.path.join(out, name))
        total += size
        print(f"  {name:14} {size / 1024:8.1f} KB")
    print(f"✅ 构建完成 → {out}（合计 {total / 1024:.1f} KB，{len(repos)} 个仓库）")
    return 0


if __name__ == "__main__":
    sys.exit(main())