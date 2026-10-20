# 知识点讲解站点 · 设计契约（Lead 制定，冻结项不得破坏）

> 这份文件是「视觉重构」期间两名 agent 并行作业的接口约定。
> **谁都不许删改本文件的冻结条款；只能在其后追加小节。**

## 0. 事实基线（Lead 已实测）

- 站点是**生成**的，不是手写的：`知识点讲解/*.html` 全部由 `.extract/build_site.py`（690 行，python）从
  `实训N_*/知识点精讲_实训N.md` 渲染而来。
- Lead 已实测：用该脚本重新生成，输出与当前 `index.html`/`实训1.html`/`实训2.html`/`实训7.html`
  **MD5 完全一致**（12563 / 191410 / 83652 / 223552 字节）。→ 说明当前页面 100% 来自生成器，没有"手补丁"。
- 源码统计（生成器自报）：7 讲 / 109 个知识点 / 每个知识点 7 块 / 232 个代码块 / 109 个折叠问答。
- assets：`style.css` 65KB、`app.js` 31KB、`ids.js`、`search-index.js`（109 条）、`art/` 20 张公有领域中国画。

## 1. 硬约束

1. **完全离线**：不得引用任何 CDN、外链字体、外链图片、外链 JS。字体只能用系统字体栈。
2. **内容零丢失**：重构后 7 页的正文文本（去标签、去空白后）必须是旧页面的**超集**，
   知识点数 109、代码块 232、折叠问答 109 一个都不能少。
3. **两套主题都可用**：`<html data-theme="light|dark">`，两套都要截图验收。
4. **响应式**：375 / 768 / 1280 / 1920 四个宽度不得出现横向滚动、不得破版。
5. **文件归属**（写权限，冲突即事故）：
   - `知识点讲解/assets/style.css`、`知识点讲解/_build/**`、`知识点讲解/*.html`（生成产物）→ **art-director 独占**
   - `知识点讲解/assets/app.js` → **motion-dev 独占**
   - 其他 agent 只读本目录。
6. **只有 art-director 执行生成器**。motion-dev 改完 app.js 不需要重新生成页面，刷新浏览器即可。

## 2. DOM 冻结契约（生成器产出的结构，两个 owner 都要认）

### 2.1 顶层骨架（每页都有）

```html
<div class="page-in"></div><div class="grain"></div><div class="scroll-rail"><i></i></div>
<header class="top"><div class="top-in">
  <button class="icon-btn menu-btn" id="menu-btn">
  <a class="logo">…</a>
  <div class="search"><input id="search"></div>
  <div class="spacer"></div>
  <div class="prog"><svg class="ring"><circle class="bg"><circle class="fg"></svg><span id="prog-txt"></span></div>
  <button class="icon-btn" id="theme-btn">
</div></header>
<section class="…hero…" id="top">…</section>       <!-- 首页 .cine-hero；讲解页 .lab-hero -->
<div class="shell">
  <aside class="side" id="side">…<nav class="nav-lab">…</nav><nav class="toc">…</nav><div class="side-tools">…</div></aside>
  <main>…</main>
</div>
<div id="scrim"></div><button class="icon-btn" id="top-btn"></button>
<div class="foot-banner"></div><footer>…</footer>
<script src="assets/ids.js"></script><script src="assets/app.js"></script>
```

### 2.2 讲解页知识点卡（**内容容器，允许加包裹层，不允许改语义/删除**）

```html
<article class="kp rv" id="kp-02-3" data-id="02:3">
  <div class="kp-head"><span class="kp-num">3</span><h3>…</h3>
    <label class="kp-done"><input type="checkbox"><span>学会了</span></label></div>
  <div class="kp-body">
    <section class="blk" data-k="①"><div class="blk-tag"><i>①</i>讲义要点</div><div class="blk-body">…</div></section>
    … ①…⑦ 共 7 块，data-k 分别为 ①②③④⑤⑥⑦
  </div>
</article>
```
块内元素：`.code[data-lang] > .code-bar > .code-lang + button.copy`、`pre > code`、`.tw > table`、
`ul/ol/li`、`ul.checklist > li.tick > span.box`、`blockquote`、`details.qa > summary + .qa-body`、`.inner-block`。

#### 2.2.1 【2026-10-20 追加 · art-director】代码块结构已升级（上方条款保留，以此为准）

`pre > code` 仍然存在，但外面多了一层 `.code-body` 与行号槽：

```html
<div class="code" data-lang="js" data-lines="18">
  <div class="code-bar">
    <span class="code-lang">js</span>
    <span class="code-count">18 行</span>
    <button class="copy" type="button">复制</button>
  </div>
  <div class="code-body">
    <div class="code-ln" aria-hidden="true">1
2
…</div>
    <pre><code><span class="tk-k">const</span> …</code></pre>
  </div>
</div>
```

需要知道的四点：

1. **染色在构建期完成**（`_build/build_site.py` 的 `highlight()`），token 类名与原 `app.js` 完全一致：
   `.tk-k` 关键字 / `.tk-f` 函数 / `.tk-s` 字符串 / `.tk-n` 数字 / `.tk-c` 注释 / `.tk-a` 属性 /
   `.tk-t` 标签 / `.tk-p` 标点。生成器带硬校验：染色后 `textContent` 必须与原文逐字一致，否则自动降级为纯文本。
2. `.code-ln` 是**行号槽**，与 `pre` 并排（`.code-body` 是 flex）。两者对齐依赖
   `--code-fs` / `--code-lh` 两个变量，**不要给 `pre` 或 `code` 单独设 `line-height`**。
3. 运行时脚本若要做高亮兜底，**只能改 `code` 元素的 innerHTML**；改 `.code` 或 `.code-body`
   会把 `.code-ln` 冲掉。建议先探测 `codeEl.querySelector('.tk-k,.tk-s,.tk-c,.tk-t')`，有就跳过。
4. `.code-count`（"18 行"）是新增的次要信息，可隐藏，不影响复制。

### 2.3 首页区块

`.cine-hero#top`（`.cine-bg img`、`#ink-canvas`、`#ripple-canvas`、`#petals`、`.cine-veil`、`.cine-inner`、
`.cine-copy`、`.hero-title`、`.home-stats b`、`.cine-cta`、`.cine-scroll > .cine-scroll-frame img`、`.cine-plum`、
`.cine-brand`、`.cine-side`、`.cine-down`）、`.pan#pan > .pan-sticky > .pan-view > .pan-img`、`.pan-bar i`、
`.quote-band`、`.marquee > .marquee-track > a.mq-item`、`.sec-title > .bar + h2`、`.labs > a.lab-card`、
`#hits`（搜索结果容器）、`#home-body`（首页正文容器）、`footer`。

### 2.4 JS 依赖的 id / 类（一个都不能改名）

`#menu-btn #side #scrim #theme-btn #top-btn #search #hits #home-body #prog-txt #qa-open #qa-close #top`
`.ring .fg`、`.toc a[href="#id"]`、`.nav-lab a`、`.kp`、`.kp-done input`、`.code`（含 `code`/`.copy`）、`.rv`、
`.scroll-rail i`、`#pan`、`.pan-img`、`.pan-bar i`、`.cine-hero .home-stats b`、`.hero-title`、`.lab-hero h1`、
`#petals`、`#ink-canvas`、`#ripple-canvas`、`.cine-bg img`、`.cine-scroll`、`.cine-scroll-frame`、`.cine-plum`、
`.lab-card`、`details.qa`。

### 2.5 状态类（JS 写入，CSS 必须给出样式）

`.rv.in`（入场）、`.kp.done`（已学）、`.toc a.on`（当前知识点）、`.nav-lab a.on`、`.side.open`、`#scrim.on`、
`#top-btn.on`、`#hits.on`、`.copy.ok`、`body.leaving`（页面离场动画）。

## 3. motion-dev 允许新建的 DOM（运行时由 app.js 注入，不进生成器）

统一加前缀，避免与生成器类名冲突：

| 类名 | 用途 |
|---|---|
| `.cmdk`、`.cmdk-box`、`.cmdk-input`、`.cmdk-list`、`.cmdk-item`、`.cmdk-item.on`、`.cmdk-empty`、`.cmdk-hint`、`.cmdk-tag` | 命令面板式搜索（Ctrl+K） |
| `.read-bar` / `.read-bar > i` | 顶部阅读进度条 |
| `.toast`、`.toast.on` | 复制成功等轻提示 |
| `.kp-nav`（上一/下一知识点浮动导航） | 长文阅读辅助 |
| `.x-fade`、`.x-up` | 通用动效类 |
| `.sr-only` | 无障碍隐藏文本 |

art-director 必须在 style.css 里给出以上类的样式（可以先给基础样式，motion-dev 不得改 css）。

## 4. 动效与性能

- 全部动效 `prefers-reduced-motion: reduce` 下必须关掉（app.js 负责判断，CSS 也要兜底）。
- 首屏 LCP 用本地 jpg，不得新增 >600KB 的图片；canvas 动画在 `document.hidden` 时暂停。
- 不得引入 JS 框架；ES5 语法 + 原生 API（与现状一致，兼容 Chromium 内核浏览器即可）。

## 5. 验收口径（art-qa 执行）

1. 生成器 `python 知识点讲解/_build/build_site.py` 一次成功，打印 `[OK] 每个知识点都齐备 7 块`。
2. 内容对账：109 知识点 / 232 代码块 / 109 问答；文本超集校验通过。
3. 两主题 × 四宽度截图，无横向滚动（`document.documentElement.scrollWidth <= innerWidth + 1`）。
4. 无 console error（在页面里 hook `window.onerror` 统计）。
5. 断链 0：`file://` 下所有 `<a href>` / `<img src>` / `<link href>` / `<script src>` 均 200。
6. 键盘可达：Tab 能走到搜索框、侧栏、7 个知识点、复制按钮；`Ctrl+K` 打开面板、`Esc` 关闭。
