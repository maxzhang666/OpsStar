/* Star 书架 —— 纯静态，无框架。数据来自 data.js（由 fetch_stars.py 生成）。 */
(function () {
  'use strict';

  const D = window.STARS || { repos: [], stats: {} };
  const T = window.I18N;

  // ---------- 语言 → 颜色（GitHub linguist 的常用色，够用即可） ----------
  const LANG_COLOR = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Go: '#00ADD8',
    Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
    Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883', Svelte: '#ff3e00',
    Elixir: '#6e4a7e', Haskell: '#5e5086', Lua: '#000080', Perl: '#0298c3',
    Scala: '#c22d40', Clojure: '#db5855', Zig: '#ec915c', Nim: '#ffc200', Julia: '#a270ba',
    'Jupyter Notebook': '#DA5B0B', 'Objective-C': '#438eff', 'F#': '#b845fc', OCaml: '#ef7a08',
    'Vim Script': '#199f4b', Makefile: '#427819', Dockerfile: '#384d54', MDX: '#fcb32c',
  };
  const langColor = l => LANG_COLOR[l] || '#8b949e';

  // ---------- 图标（lucide 路径，与原型同源） ----------
  const P = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.775a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/>',
    fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M12 12v3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    sliders: '<path d="M10 5H3M12 19H3M14 3v4M21 12a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2zM7 15v4"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM7 21h10"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  };
  const icon = (n, cls) => `<svg class="${cls || 'size-4'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------- 转义 & 格式化 ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmtNum = n => {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 || n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return String(n);
  };
  const fmtFull = n => (Number(n) || 0).toLocaleString('en-US');

  function fmtAgo(days) {
    if (days == null) return '';
    if (days <= 0) return t('repo.today');
    if (days === 1) return t('repo.yesterday');
    if (days < 30) return t('repo.daysAgo', { n: days });
    if (days < 365) return t('repo.monthsAgo', { n: Math.round(days / 30) });
    return t('repo.yearsAgo', { n: Math.round(days / 365) });
  }

  // ---------- 状态 ----------
  // 站点标题/副标题优先用 data.js 里的配置（别人通过 workflow_call 传入），
  // 没有配置才回落到词典默认值 —— 这样使用者无需 fork 改代码即可定制。
  const SITE = D.site || {};
  // 底栏版权链接指向本项目仓库
  const OWNER = 'maxzhang666';
  const REPO = 'OpsStar';
  const siteTitle = () => SITE.title || t('site.title');
  const siteDesc = () => SITE.desc || t('site.desc');

  let L = localStorage.getItem('stars-lang') || SITE.lang || 'zh-CN';
  if (!T[L]) L = 'zh-CN';
  let theme = localStorage.getItem('stars-theme') || 'system';
  const applyTheme = () => {
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  };
  applyTheme();

  // 词典里的占位符形如 {n} / {total}，由调用方传值替换
  const t = (k, params) => {
    let s = (T[L] && T[L][k]) || T['zh-CN'][k] || k;
    if (params) {
      s = s.replace(/\{(\w+)\}/g, (whole, name) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole);
    }
    return s;
  };

  // ---------- 筛选状态 ----------
  const PAGE = 60;   // 首屏渲染 60 张，之后点「加载更多」每次再加一页
  const f = {
    lang: 'all', lic: 'all', q: '', sort: 'stars',
    starsOnly: false, hideArchived: false, activeOnly: false,
    view: localStorage.getItem('stars-view') || 'grid', open: false,
    limit: PAGE,
  };

  const hasDesc = r => (r.desc || '') + ' ' + (r.fullName || '') + ' ' + (r.owner || '') + ' ' + (r.topics || []).join(' ');

  function matches() {
    let list = D.repos.filter(r => {
      if (f.lang === '__none' ? !!r.lang : (f.lang !== 'all' && r.lang !== f.lang)) return false;
      if (f.lic === '__none' ? !!r.license : (f.lic !== 'all' && r.license !== f.lic)) return false;
      if (f.starsOnly && r.stars < 1000) return false;
      if (f.hideArchived && r.archived) return false;
      if (f.activeOnly && (r.pushedAgo == null || r.pushedAgo > 365)) return false;
      if (f.q) {
        const q = f.q.toLowerCase();
        if (!hasDesc(r).toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const dir = f.sort === 'name' ? 1 : -1;
    list.sort((a, b) => {
      if (f.sort === 'name') return a.name.localeCompare(b.name);
      if (f.sort === 'recent') return ((a.starredAgo ?? 9e9) - (b.starredAgo ?? 9e9)) * -dir;
      if (f.sort === 'pushed') return ((a.pushedAgo ?? 9e9) - (b.pushedAgo ?? 9e9)) * -dir;
      return (b.stars - a.stars);
    });
    return list;
  }

  // ---------- 组件 ----------
  const badge = (txt, cls) => `<span class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground ${cls || ''}">${txt}</span>`;

  const langDot = l => l
    ? `<span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span class="size-2 shrink-0 rounded-full" style="background:${esc(langColor(l))}"></span>${esc(l)}</span>`
    : badge(t('filter.noLang'));

  const licenseBadge = lic => {
    if (!lic || lic === 'NOASSERTION') return badge(t('repo.noLicense'), 'border-amber-500/30 text-amber-700 dark:text-amber-300');
    return badge(esc(lic), 'border-border');
  };

  // 有些仓库既没语言也没 license（38/1222）。两个「无…」并排很吵，
// 所以两者都缺时只显示一个中性标记，不重复占位。
  function metaBadges(r) {
    const noLang = !r.lang, noLic = !r.license || r.license === 'NOASSERTION';
    if (noLang && noLic) return badge(esc(t('repo.noMeta')), 'border-border');
    return (noLang ? badge(esc(t('filter.noLang'))) : langDot(r.lang)) + licenseBadge(r.license);
  }

  // star 数据里没有评分，卡片右上角改显 star 数
  function repoCard(r) {
    return `
    <article class="group flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground transition-colors hover:border-foreground/20">
      <div class="flex items-start gap-3">
        <img src="${esc(r.ownerAvatar)}" alt="" width="44" height="44" loading="lazy" decoding="async"
             class="size-11 shrink-0 rounded-[22%] bg-muted object-cover">
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <h3 class="truncate font-semibold leading-tight">
              <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" class="hover:underline underline-offset-4">${esc(r.name)}</a>
            </h3>
            <span class="inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
              ${icon('star', 'size-3.5 fill-amber-400 text-amber-400')}${fmtNum(r.stars)}
            </span>
          </div>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">${esc(r.owner)}</p>
          <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">${r.desc ? esc(r.desc) : `<span class="italic opacity-60">${esc(t('repo.noDesc'))}</span>`}</p>
        </div>
      </div>
      ${r.archived ? `<div>${badge(icon('archive', 'size-3') + esc(t('repo.archived')), 'border-amber-500/30 text-amber-700 dark:text-amber-300')}</div>` : ''}
      <div class="mt-auto flex flex-wrap items-center gap-1">
        ${metaBadges(r)}${r.isFork ? badge(esc(t('repo.fork'))) : ''}
      </div>
      ${r.topics && r.topics.length ? `<div class="flex flex-wrap gap-1">${r.topics.slice(0, 3).map(x => badge('#' + esc(x))).join('')}${r.topics.length > 3 ? badge('+' + (r.topics.length - 3)) : ''}</div>` : ''}
      <div class="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1">${icon('clock', 'size-3')}${esc(fmtAgo(r.pushedAgo))}</span>
        <span class="inline-flex items-center gap-3">
          <span class="inline-flex items-center gap-1 tabular-nums">${icon('fork', 'size-3')}${fmtNum(r.forks)}</span>
          <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-medium text-foreground/80 hover:underline">
            ${icon('external', 'size-3')}${esc(t('repo.visit'))}
          </a>
        </span>
      </div>
    </article>`;
  }

  function repoRow(r) {
    return `
    <div class="flex items-center gap-3 py-3">
      <img src="${esc(r.ownerAvatar)}" alt="" width="44" height="44" loading="lazy" decoding="async"
           class="size-11 shrink-0 rounded-[22%] bg-muted object-cover">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" class="truncate font-medium hover:underline underline-offset-4">${esc(r.name)}</a>
          ${r.archived ? badge(esc(t('repo.archived')), 'border-amber-500/30 text-amber-700 dark:text-amber-300') : ''}
          <span class="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground tabular-nums">${icon('star', 'size-3 fill-amber-400 text-amber-400')}${fmtNum(r.stars)}</span>
        </div>
        <p class="truncate text-sm text-muted-foreground">${esc(r.desc || t('repo.noDesc'))}</p>
      </div>
      <div class="hidden shrink-0 items-center gap-3 md:flex">
        ${metaBadges(r)}
        <span class="w-24 text-right text-xs text-muted-foreground">${esc(fmtAgo(r.pushedAgo))}</span>
      </div>
      <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t('repo.visit'))}"
         class="inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-foreground">
        ${icon('external', 'size-4')}
      </a>
    </div>`;
  }

  // ---------- 侧栏筛选 ----------
  function sidebar() {
    const langs = Object.entries(D.stats.langs || {});
    const lics = Object.entries(D.stats.licenses || {});
    const box = 'size-4 rounded border-input accent-brand';
    const rowCls = on => `flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent ${on ? 'bg-accent font-medium' : ''}`;

    return `
    <aside id="filters" class="${f.open ? '' : 'hidden'} lg:block" aria-label="${esc(t('filter.category'))}">
      <div class="space-y-6 lg:sticky lg:top-20">
        <fieldset>
          <legend class="mb-2 text-sm font-semibold">${esc(t('filter.category'))}</legend>
          <div class="scroll-slim max-h-80 space-y-0.5 overflow-y-auto pr-1">
            <label class="${rowCls(f.lang === 'all')}">
              <input type="radio" name="lang" class="${box}" ${f.lang === 'all' ? 'checked' : ''} onchange="F.set('lang','all')">
              <span class="flex-1">${esc(t('filter.all'))}</span>
              <span class="text-xs tabular-nums text-muted-foreground">${fmtNum(D.repos.length)}</span>
            </label>
            ${langs.map(([k, v]) => `
              <label class="${rowCls(f.lang === k)}">
                <input type="radio" name="lang" class="${box}" ${f.lang === k ? 'checked' : ''} onchange="F.set('lang',${JSON.stringify(k).replace(/"/g, '&quot;')})">
                <span class="flex-1 truncate">${esc(k)}</span>
                <span class="text-xs tabular-nums text-muted-foreground">${v}</span>
              </label>`).join('')}
          </div>
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-sm font-semibold">${esc(t('filter.license'))}</legend>
          <div class="scroll-slim max-h-48 space-y-0.5 overflow-y-auto pr-1">
            <label class="${rowCls(f.lic === 'all')}">
              <input type="radio" name="lic" class="${box}" ${f.lic === 'all' ? 'checked' : ''} onchange="F.set('lic','all')">
              <span class="flex-1">${esc(t('filter.allLicenses'))}</span>
              <span class="text-xs tabular-nums text-muted-foreground">${fmtNum(D.repos.length)}</span>
            </label>
            ${lics.map(([k, v]) => `
              <label class="${rowCls(f.lic === k)}">
                <input type="radio" name="lic" class="${box}" ${f.lic === k ? 'checked' : ''} onchange="F.set('lic',${JSON.stringify(k).replace(/"/g, '&quot;')})">
                <span class="flex-1 truncate">${esc(k === 'NOASSERTION' ? t('repo.noLicense') : k)}</span>
                <span class="text-xs tabular-nums text-muted-foreground">${v}</span>
              </label>`).join('')}
          </div>
        </fieldset>

        <fieldset class="space-y-0.5">
          <legend class="mb-2 text-sm font-semibold">${esc(t('filter.more'))}</legend>
          ${[['starsOnly', t('filter.starsOnly')], ['hideArchived', t('filter.hideArchived')], ['activeOnly', t('filter.activeOnly')]].map(([k, label]) => `
            <label class="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
              <input type="checkbox" class="${box}" ${f[k] ? 'checked' : ''} onchange="F.toggle('${k}')">
              <span class="flex-1">${esc(label)}</span>
            </label>`).join('')}
        </fieldset>
      </div>
    </aside>`;
  }

  function chips() {
    const c = [];
    if (f.lang !== 'all') c.push([f.lang === '__none' ? t('filter.noLang') : f.lang, `F.set('lang','all')`]);
    if (f.lic !== 'all') c.push([f.lic === 'NOASSERTION' || f.lic === '__none' ? t('repo.noLicense') : f.lic, `F.set('lic','all')`]);
    if (f.starsOnly) c.push([t('filter.starsOnly'), `F.toggle('starsOnly')`]);
    if (f.hideArchived) c.push([t('filter.hideArchived'), `F.toggle('hideArchived')`]);
    if (f.activeOnly) c.push([t('filter.activeOnly'), `F.toggle('activeOnly')`]);
    if (!c.length) return '';
    return c.map(([label, fn]) => `<button type="button" onclick="${fn}" class="inline-flex cursor-pointer items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium hover:bg-accent">${esc(label)}${icon('x', 'size-3')}</button>`).join('') +
      `<button type="button" onclick="F.clear()" class="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">${esc(t('filter.clear'))}</button>`;
  }

  function results() {
    if (!D.repos || !D.repos.length) {
      return `<div class="flex flex-col items-center px-6 py-16 text-center">
        <div class="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">${icon('inbox', 'size-5')}</div>
        <h3 class="font-semibold">${esc(t('state.error'))}</h3>
        <p class="mt-1 max-w-sm text-sm text-muted-foreground">${esc(t('state.errorDesc'))}</p>
      </div>`;
    }
    const list = matches();
    if (!list.length) {
      return `<div class="flex flex-col items-center px-6 py-16 text-center">
        <div class="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">${icon('search', 'size-5')}</div>
        <h3 class="font-semibold">${esc(t('state.empty'))}</h3>
        <p class="mt-1 max-w-sm text-sm text-muted-foreground">${esc(t('state.emptyDesc'))}</p>
        <div class="mt-5"><button type="button" onclick="F.clear()" class="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-[13px] font-medium hover:bg-accent">${esc(t('filter.clear'))}</button></div>
      </div>`;
    }

    const filtered = list.length !== D.repos.length;
    const head = `<p class="mb-3 text-sm text-muted-foreground" role="status">${filtered
      ? esc(t('state.countFiltered', { n: fmtNum(list.length), total: fmtFull(D.repos.length) }))
      : esc(t('state.count', { n: fmtFull(list.length) }))}</p>`;

    // 只渲染前 f.limit 条；滚到底由 IntersectionObserver 触发 F.more() 追加
    const shown = list.slice(0, f.limit);
    const rest = list.length - shown.length;

    const body = f.view === 'list'
      ? `<div id="repoList" class="divide-y rounded-xl border bg-card px-4">${shown.map(repoRow).join('')}</div>`
      // 必须显式写 grid-cols-1：否则移动端只有隐式 auto 轨道，
      // 卡片内容把 min-width:auto 顶到 458px，撑破 358px 的容器造成横向溢出。
      // grid-cols-1 = repeat(1, minmax(0,1fr))，minmax 的 0 正好堵住这个坑。
      : `<div id="repoList" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">${shown.map(repoCard).join('')}</div>`;

    // 哨兵：进入视口就加载下一批；全部加载完显示结束提示
    const tail = rest > 0
      ? `<div id="scrollTail" class="mt-6 flex flex-col items-center gap-2" aria-hidden="true">
           <span class="skeleton h-4 w-28"></span>
           <span data-shown-of class="text-xs text-muted-foreground">${esc(t('state.shownOf', { shown: fmtFull(shown.length), total: fmtFull(list.length) }))}</span>
         </div>`
      : `<p class="mt-6 text-center text-xs text-muted-foreground">${esc(t('state.allLoaded', { n: fmtFull(list.length) }))}</p>`;

    return head + body + tail;
  }

  // ---------- 语言 / 主题 / 视图切换 ----------
  // 任何改变结果集的操作都要把 limit 收回第一页，否则筛选后仍按上次的偏移量截断
  window.F = {
    set(k, v) { f[k] = v; f.limit = PAGE; render(); },
    toggle(k) { f[k] = !f[k]; f.limit = PAGE; render(); },
    clear() { Object.assign(f, { lang: 'all', lic: 'all', q: '', starsOnly: false, hideArchived: false, activeOnly: false, limit: PAGE }); render(); },
    openFilters() { f.open = !f.open; render(); },
    setLang(l) { L = l; localStorage.setItem('stars-lang', l); render(); },
    setTheme(th) { theme = th; localStorage.setItem('stars-theme', th); applyTheme(); render(); },
    setView(v) { f.view = v; f.limit = PAGE; localStorage.setItem('stars-view', v); render(); },
    more() { loadMore(); },
  };

  // ---------- 下拉菜单（主题切换） ----------
  // 事件委托：菜单面板是重渲染出来的，直接绑定会在每次 render 后失效
  function closeMenus() {
    document.querySelectorAll('[data-menu-panel]').forEach(p => { p.hidden = true; });
    document.querySelectorAll('[data-menu-trigger]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-menu-trigger]');
    if (trigger) {
      const panel = trigger.parentElement.querySelector('[data-menu-panel]');
      if (panel) {
        const willOpen = panel.hidden;
        closeMenus();
        panel.hidden = !willOpen;
        trigger.setAttribute('aria-expanded', String(willOpen));
      }
      return;
    }
    const item = e.target.closest('[data-set-theme]');
    if (item) {
      F.setTheme(item.getAttribute('data-set-theme'));
      return;
    }
    // 点在菜单外面 → 收起
    if (!e.target.closest('[data-menu]')) closeMenus();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenus();
  });

  // ---------- 滚动自动加载 ----------
  // 只往 #repoList 尾部追加新节点，而不是整页重渲染：
  // 后者每次都要重建已渲染的几百个卡片，滚动时会明显卡顿，也会丢失滚动位置。
  let loadingMore = false;

  function loadMore() {
    if (loadingMore) return;
    const list = matches();
    if (f.limit >= list.length) return;

    loadingMore = true;
    const host = document.getElementById('repoList');
    if (!host) { loadingMore = false; return; }

    const from = f.limit;
    f.limit = Math.min(f.limit + PAGE, list.length);
    const next = list.slice(from, f.limit);
    host.insertAdjacentHTML('beforeend', next.map(f.view === 'list' ? repoRow : repoCard).join(''));

    updateTail(list);
    // 等 DOM 布局稳定后再放开，防止连续滚动瞬间把 1222 条全塞进来
    requestAnimationFrame(() => { loadingMore = false; });
  }

  function updateTail(list) {
    const results = document.getElementById('results');
    if (!results) return;
    const rest = list.length - f.limit;
    const shownOf = results.querySelector('[data-shown-of]');
    if (rest > 0) {
      // 原地更新文本即可；不要 insert 新节点，否则计数行会越堆越多
      if (shownOf) shownOf.textContent = t('state.shownOf', { shown: fmtFull(f.limit), total: fmtFull(list.length) });
    } else {
      const tail = results.querySelector('#scrollTail');
      if (tail) {
        tail.removeAttribute('aria-hidden');
        tail.innerHTML = `<p class="text-xs text-muted-foreground">${esc(t('state.allLoaded', { n: fmtFull(list.length) }))}</p>`;
      }
    }
  }

  let observer = null;
  function observeTail() {
    if (observer) observer.disconnect();
    const tail = document.getElementById('scrollTail');
    if (!tail) return;
    observer = new IntersectionObserver(entries => {
      if (entries.some(en => en.isIntersecting)) loadMore();
    }, { rootMargin: '400px 0px' });   // 提前 400px 预加载，滚起来才不觉得卡
    observer.observe(tail);
  }

  function themeIcon() { return { light: 'sun', dark: 'moon', system: 'monitor' }[theme]; }

  const iconBtn = 'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer';

  // 主题下拉菜单：照原型用 menuitemradio + 勾选标记，
  // 而不是「点一下循环切换」——后者看不出当前处于哪种模式。
  function themeMenu() {
    const item = 'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground';
    return `
    <div class="relative" data-menu="theme">
      <button type="button" data-menu-trigger aria-haspopup="menu" aria-expanded="false"
              aria-label="${esc(t('nav.theme'))}" title="${esc(t('theme.' + theme))}" class="${iconBtn}">
        ${icon(themeIcon(), 'size-4')}
      </button>
      <div data-menu-panel role="menu" hidden
           class="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
        ${['light', 'dark', 'system'].map(k => `
          <button role="menuitemradio" aria-checked="${theme === k}" data-set-theme="${k}" class="${item}">
            ${icon({ light: 'sun', dark: 'moon', system: 'monitor' }[k], 'size-4')}
            <span class="flex-1">${esc(t('theme.' + k))}</span>
            ${theme === k ? `<span class="text-brand">${icon('check', 'size-4')}</span>` : ''}
          </button>`).join('')}
      </div>
    </div>`;
  }

  function header() {
    const menuBtn = (act, label, active, content) =>
      `<button type="button" onclick="${act}" aria-label="${esc(label)}" title="${esc(label)}" class="${iconBtn} ${active ? 'bg-accent text-foreground' : ''}">${content}</button>`;

    return `
    <header class="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] inline-flex h-8 items-center rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground">Skip to content</a>
        <div class="flex items-center gap-2 font-semibold tracking-tight">
          <svg class="size-5 text-brand" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z" fill="currentColor"/></svg>
          <span class="text-[17px]">${esc(siteTitle())}</span>
        </div>

        <div class="relative mx-2 hidden max-w-sm flex-1 sm:block lg:ml-6">
          <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">${icon('search', 'size-4')}</span>
          <input type="search" data-search="header" value="${esc(f.q)}" oninput="F.set('q',this.value)" placeholder="${esc(t('filter.search'))}"
                 aria-label="${esc(t('filter.search'))}"
                 class="flex h-9 w-full rounded-md border border-input bg-muted/50 py-1 pl-8 pr-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30">
        </div>

        <div class="ml-auto flex items-center gap-1">
          <div class="flex items-center gap-0.5 rounded-md border p-0.5" role="group" aria-label="${esc(t('nav.lang'))}">
            ${menuBtn("F.setLang('zh-CN')", '简体中文', L === 'zh-CN', `<span class="text-xs font-medium">中</span>`)}
            ${menuBtn("F.setLang('en')", 'English', L === 'en', `<span class="text-xs font-medium">EN</span>`)}
          </div>
          ${themeMenu()}
        </div>
      </div>
    </header>`;
  }

  function statBar() {
    const s = D.stats || {};
    const items = [
      [t('stat.total'), fmtFull(s.total || 0)],
      [t('stat.stars'), fmtNum(s.totalStars || 0)],
      [t('stat.langs'), fmtNum(Object.keys(s.langs || {}).length)],
      [t('stat.topics'), fmtNum(Object.keys(s.topics || {}).length)],
    ];
    return `<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      ${items.map(([label, v]) => `
        <div class="rounded-xl border bg-card p-4">
          <div class="text-2xl font-semibold tracking-tight tabular-nums">${esc(v)}</div>
          <div class="mt-0.5 text-xs text-muted-foreground">${esc(label)}</div>
        </div>`).join('')}
    </div>`;
  }

  const sel = 'h-8 cursor-pointer rounded-md border border-input bg-background px-2 text-sm dark:bg-input/30';

  function render() {
    document.title = siteTitle();
    document.getElementById('app').innerHTML = `
      ${header()}
      <main id="main" class="outline-none">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <div class="mb-6">
            <h1 class="text-2xl font-semibold tracking-tight">${esc(siteTitle())}</h1>
            <p class="mt-1 text-sm text-muted-foreground">${esc(siteDesc())}</p>
          </div>

          ${statBar()}

          <div class="mt-8 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
            ${sidebar()}
            <div class="min-w-0">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <div class="relative min-w-48 flex-1">
                  <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">${icon('search', 'size-4')}</span>
                  <input type="search" data-search="inline" value="${esc(f.q)}" oninput="F.set('q',this.value)" placeholder="${esc(t('filter.search'))}"
                         aria-label="${esc(t('filter.search'))}"
                         class="flex h-8 w-full rounded-md border border-input bg-transparent py-1 pl-8 pr-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30">
                </div>
                <button type="button" onclick="F.openFilters()" aria-expanded="${f.open}" aria-controls="filters"
                        class="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-[13px] font-medium hover:bg-accent lg:hidden">
                  ${icon('sliders', 'size-3.5')}${esc(t('filter.more'))}
                </button>
                <label class="sr-only" for="sort">${esc(t('filter.sort'))}</label>
                <select id="sort" class="${sel}" onchange="F.set('sort',this.value)">
                  ${['stars', 'recent', 'pushed', 'name'].map(s => `<option value="${s}" ${f.sort === s ? 'selected' : ''}>${esc(t('sort.' + s))}</option>`).join('')}
                </select>
                <div class="inline-flex rounded-md border p-0.5" role="group">
                  ${[['grid', 'grid'], ['list', 'list']].map(([v, ic]) => `
                    <button type="button" onclick="F.setView('${v}')" aria-pressed="${f.view === v}" aria-label="${esc(t('view.' + v))}"
                            class="grid size-7 cursor-pointer place-items-center rounded text-muted-foreground aria-pressed:bg-accent aria-pressed:text-foreground">${icon(ic, 'size-4')}</button>`).join('')}
                </div>
              </div>
              <div id="chips" class="mb-4 flex flex-wrap items-center gap-1.5 empty:hidden">${chips()}</div>
              <div id="results">${results()}</div>
            </div>
          </div>

        </div>
      </main>
      ${bottomBar()}`;
    observeTail();
    closeMenus();
  }

  // 常驻底栏：fixed 在视口底部，滚动时始终可见。
  // 用 fixed 会遮住内容尾部，所以给 body 加 pb 预留出它的高度。
  function bottomBar() {
    const year = new Date().getFullYear();
    const genTime = new Date(D.generatedAt || Date.now())
      .toLocaleString(L === 'en' ? 'en-US' : 'zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
    return `
    <footer class="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
        <span>&copy; ${year} ${esc(siteTitle())}</span>
        <span class="hidden sm:inline">${esc(t('generated', { t: genTime }))}</span>
        <a href="https://github.com/${OWNER}/${REPO}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-1 hover:text-foreground hover:underline underline-offset-4">
          ${icon('github', 'size-3.5')}<span>${esc(OWNER)}/${esc(REPO)}</span>
        </a>
      </div>
    </footer>`;
  }

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (theme === 'system') applyTheme(); });

  // 搜索做节流，避免每敲一个字符就重排上千个节点。
  // 重渲染会销毁输入框，所以要记住是哪个框、以及光标位置，再原样还原。
  let timer = null;
  document.addEventListener('input', e => {
    if (e.target.type !== 'search') return;
    clearTimeout(timer);
    const el = e.target;
    const value = el.value;
    const caret = el.selectionStart;
    timer = setTimeout(() => {
      f.q = value;
      f.limit = PAGE;
      render();
      // header 和结果区各有一个搜索框，且 placeholder 完全相同，
      // 只能靠 data-search 这个稳定标识回到用户正在用的那一个
      const key = el.getAttribute('data-search');
      const target = document.querySelector(`input[type=search][data-search="${key}"]`);
      if (target) {
        target.focus();
        try { target.setSelectionRange(caret, caret); } catch (err) { /* search 类型可能不支持，忽略 */ }
      }
    }, 220);
  });

  render();
})();