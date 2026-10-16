#!/usr/bin/env python3
"""抓取 GitHub 用户 star 的仓库，归一化成站点数据模板。

只用标准库，可在 GitHub Actions 里直接跑，无需 pip install。

认证（按优先级）：
  GITHUB_TOKEN / GH_TOKEN 环境变量 —— 需要的是**个人访问令牌（PAT）**，
    不是 GitHub Actions 内置的 GITHUB_TOKEN。后者是 GitHub App 的 installation
    token，调 /user/starred 会返回 403（integration 无权访问用户级接口）。
  匿名请求 —— 只能拿公开 star，配额 60 次/小时（约 6000 个仓库），公开 star 场景够用。

用法：
  # 公开 star，无需任何凭据
  python3 fetch_stars.py --actor <用户名> --out data/stars.json

  # 全量（需 PAT，仅 public_repo 权限即可）
  GITHUB_TOKEN=ghp_xxx python3 fetch_stars.py --out data/stars.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

API = "https://api.github.com"
UA = "OpsStar/1.0 (github-stars-site)"
TIMEOUT = 30
# star+json 媒体类型会在仓库对象外多包一层 starred_at，这是「何时 star 的」的唯一来源
ACCEPT = "application/vnd.github.star+json"


class RateLimited(Exception):
    pass


def _request(url: str, token: str | None, accept: str = "application/vnd.github+json") -> tuple[bytes, dict]:
    req = urllib.request.Request(url)
    req.add_header("Accept", accept)
    req.add_header("User-Agent", UA)
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if token:
        req.add_header("Authorization", f"Bearer {token}")

    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return resp.read(), dict(resp.headers)
        except urllib.error.HTTPError as e:
            # 403/429 可能是速率限制，也可能是权限不足；带重试头才重试
            if e.code in (403, 429):
                retry_after = e.headers.get("Retry-After")
                if e.code == 429 or retry_after:
                    wait = int(retry_after) if retry_after else 20 * (attempt + 1)
                    print(f"  速率限制，等待 {wait}s 后重试…", file=sys.stderr)
                    time.sleep(wait)
                    continue
            raise
        except urllib.error.URLError as e:
            if attempt == 3:
                raise
            wait = 3 * (attempt + 1)
            print(f"  网络异常（{e.reason}），{wait}s 后重试…", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError("重试次数耗尽")


def rate_limit(token: str | None) -> dict:
    """读取速率限制余量，用于抓取前判断是否够用。"""
    _, hdrs = _request(f"{API}/rate_limit", token)
    remaining, limit = hdrs.get("X-RateLimit-Remaining"), hdrs.get("X-RateLimit-Limit")
    return {"remaining": int(remaining) if remaining else -1,
            "limit": int(limit) if limit else -1}


def fetch_starred(token: str | None, limit: int | None = None) -> list[dict]:
    """分页拉取 /user/starred，返回 [{starred_at, repo}, …]（按 star 时间倒序）。"""
    results: list[dict] = []
    page = 1
    # 登录用户看自己的 star 用 /user/starred；匿名时只能按用户名查公开 star
    base = f"{API}/user/starred" if token else f"{API}/users/{os.environ.get('GITHUB_ACTOR', 'sindresorhus')}/starred"

    while True:
        url = f"{base}?per_page=100&page={page}"
        body, hdrs = _request(url, token, accept=ACCEPT)
        batch = json.loads(body)

        if isinstance(batch, dict):
            raise SystemExit(f"GitHub 返回错误：{batch.get('message', batch)}")

        if not batch:
            break

        results.extend(batch)
        print(f"  已拉取 {len(results)} 个…", file=sys.stderr)

        if limit and len(results) >= limit:
            results = results[:limit]
            break

        if 'rel="next"' not in hdrs.get("Link", ""):
            break
        page += 1

    return results


def fetch_languages(full_name: str, token: str | None) -> dict:
    """语言字节数分布。只有 --enrich 时才调用。"""
    try:
        body, _ = _request(f"{API}/repos/{full_name}/languages", token)
        return json.loads(body)
    except Exception:
        return {}


def normalize(entry: dict, enriched: dict | None = None) -> dict:
    """把 GitHub 仓库对象压成前端要的扁平结构。

    只保留展示层真正用得到的字段：原始对象有 70+ 个键，全塞进产物会让 data.json 膨胀到几 MB。
    """
    repo = entry.get("repo", entry)
    owner = repo.get("owner") or {}
    lic = repo.get("license") or {}

    stars = repo.get("stargazers_count") or 0
    forks = repo.get("forks_count") or 0

    # 相对时间用「距今天数」，前端再换算成「3 天前」。存绝对时间戳会让产物每次构建都产生 diff。
    def days_ago(iso: str | None) -> int | None:
        if not iso:
            return None
        try:
            dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        except ValueError:
            return None
        return max(0, (datetime.now(timezone.utc) - dt).days)

    record = {
        "id": repo.get("id"),
        "name": repo.get("name") or "",
        "fullName": repo.get("full_name") or "",
        "owner": owner.get("login") or "",
        "ownerAvatar": owner.get("avatar_url") or "",
        "desc": (repo.get("description") or "").strip(),
        "url": repo.get("html_url") or "",
        "homepage": repo.get("homepage") or "",
        "lang": repo.get("language") or "",
        "topics": repo.get("topics") or [],
        "license": lic.get("spdx_id") or "",
        "stars": stars,
        "forks": forks,
        "archived": bool(repo.get("archived")),
        "isFork": bool(repo.get("fork")),
        "hasIssues": bool(repo.get("has_issues")),
        "hasWiki": bool(repo.get("has_wiki")),
        "hasPages": bool(repo.get("has_pages")),
        "hasDiscussions": bool(repo.get("has_discussions")),
        "starredAgo": days_ago(entry.get("starred_at")),
        "pushedAgo": days_ago(repo.get("pushed_at")),
        "createdAgo": days_ago(repo.get("created_at")),
        "size": repo.get("size") or 0,
        "openIssues": repo.get("open_issues_count") or 0,
    }

    if enriched:
        record["langs"] = enriched

    return record


def summarize(records: list[dict]) -> dict:
    """给筛选侧栏用的统计：语言分布、topic 排行、许可证分布。"""
    lang_count: dict[str, int] = {}
    lic_count: dict[str, int] = {}
    topic_count: dict[str, int] = {}
    archived = 0

    for r in records:
        if r["lang"]:
            lang_count[r["lang"]] = lang_count.get(r["lang"], 0) + 1
        if r["license"]:
            lic_count[r["license"]] = lic_count.get(r["license"], 0) + 1
        if r["archived"]:
            archived += 1
        for t in r["topics"]:
            topic_count[t] = topic_count.get(t, 0) + 1

    return {
        "total": len(records),
        "totalStars": sum(r["stars"] for r in records),
        "langs": dict(sorted(lang_count.items(), key=lambda kv: -kv[1])),
        "licenses": dict(sorted(lic_count.items(), key=lambda kv: -kv[1])),
        "topics": dict(sorted(topic_count.items(), key=lambda kv: -kv[1])),
        "archived": archived,
        "withDesc": sum(1 for r in records if r["desc"]),
        "withHomepage": sum(1 for r in records if r["homepage"]),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="抓取 GitHub star 并生成站点数据")
    ap.add_argument("--out", default="data/stars.json", help="输出路径")
    ap.add_argument("--limit", type=int, default=None, help="最多取多少个 star（调试用）")
    ap.add_argument("--enrich", type=int, default=0, metavar="N",
                    help="为前 N 个仓库额外抓语言分布（每个仓库 +1 次请求）")
    ap.add_argument("--actor", default=None, help="匿名模式下要查的用户名")
    args = ap.parse_args()

    if args.actor:
        os.environ["GITHUB_ACTOR"] = args.actor

    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or None

    if token:
        rl = rate_limit(token)
        print(f"认证模式，配额 {rl['remaining']}/{rl['limit']}", file=sys.stderr)
        if 0 <= rl["remaining"] < 10:
            print("  ⚠️ 配额紧张，可能不够翻完所有分页", file=sys.stderr)
    else:
        print("⚠️ 匿名模式：只能拿公开 star，配额 60 次/小时（约 6000 个）", file=sys.stderr)

    print("拉取 star 列表…", file=sys.stderr)
    entries = fetch_starred(token, args.limit)
    print(f"共 {len(entries)} 个 star", file=sys.stderr)

    records = [normalize(e) for e in entries]

    if args.enrich > 0:
        print(f"富化前 {args.enrich} 个仓库的语言分布…", file=sys.stderr)
        for i, r in enumerate(records[: args.enrich], 1):
            r["langs"] = fetch_languages(r["fullName"], token)
            if i % 20 == 0:
                print(f"  {i}/{args.enrich}", file=sys.stderr)

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": os.environ.get("GITHUB_ACTOR", "unknown"),
        "stats": summarize(records),
        "repos": records,
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    size = os.path.getsize(args.out)
    s = payload["stats"]
    print(f"\n✅ 已写入 {args.out}（{size / 1024:.1f} KB）", file=sys.stderr)
    print(f"   仓库 {s['total']} 个，合计 {s['totalStars']:,} star，"
          f"归档 {s['archived']} 个，有简介 {s['withDesc']} 个", file=sys.stderr)
    print(f"   语言 top5：{list(s['langs'].items())[:5]}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())