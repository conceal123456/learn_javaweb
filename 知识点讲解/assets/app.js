/* ==========================================================================
   JavaWeb 知识点讲解 · 站点脚本（v2 · 交互重构）
   --------------------------------------------------------------------------
   纯原生 ES5 + DOM API：无框架、无 CDN、无外链、无 fetch —— file:// 双击即用。
   索引仍然通过 <script> 动态注入加载（file:// 下 fetch/XHR 读本地文件会失败）。

   【保留的既有能力】
     1  代码块语法高亮 + 「复制」按钮（.copy.ok）
     2  深浅主题 #theme-btn + localStorage(kp-theme) + <html data-theme>
     3  「学会了」勾选 .kp-done → .kp.done + .ring .fg 进度环 + #prog-txt + localStorage
     4  侧栏目录滚动高亮 .toc a.on / 展开·收起全部 details.qa（#qa-open / #qa-close）
     5  移动端抽屉 #menu-btn → #side.open + #scrim.on
     6  回到顶部 #top-btn.on
     7  顶栏搜索 #search（懒加载索引 → #hits.on，搜索时隐藏 #home-body）
     8  滚动入场 .rv.in + 右侧进度轨 .scroll-rail i
     9  首页特效：#ink-canvas 墨点 / #ripple-canvas 水波 / #petals 花瓣 /
         .cine-bg img 视差 / .pan 长卷 + .pan-bar i / .home-stats b 数字滚动 / body.leaving
    10  页面切换离场过渡（body.leaving）

   【新增体验】
     A  命令面板搜索 .cmdk：Ctrl/Cmd+K 或 “/” 打开；↑↓ 选择、Enter 跳转、Esc 关闭；
        关键词 <mark> 高亮；讲次分组；空结果提示；ARIA listbox 语义
     B  顶部阅读进度 .read-bar
     C  长文浮动 .kp-nav 上一 / 下一知识点（Alt+↑ / Alt+↓）
     D  知识点块级 60–120ms 阶梯浮现（.x-up，逐块，不抢戏）
     E  复制成功 .toast 轻提示；?kp=02-3 深链定位并高亮 1.5s
     F  统一 rAF 滚动管线（全站只有一个 scroll 监听）
     G  document.hidden 时暂停 canvas 动画循环
     H  prefers-reduced-motion 下关闭全部动效；Tab 焦点环；Esc 关闭浮层
   ========================================================================== */
(function () {
  'use strict';

  var D = document;
  var W = window;

  /* ------------------------------ 小工具 ------------------------------ */
  function $(sel, root) { return (root || D).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || D).querySelectorAll(sel)); }
  function on(el, ev, fn, opt) { if (el && el.addEventListener) el.addEventListener(ev, fn, opt || false); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function raf(fn) { return (W.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(fn); }
  function caf(id) { (W.cancelAnimationFrame || clearTimeout)(id); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function txt(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  /* 动效总开关：prefers-reduced-motion */
  var mqReduce = null;
  try { mqReduce = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : null; } catch (e) { mqReduce = null; }
  var CTX = { reduce: !!(mqReduce && mqReduce.matches) };
  if (mqReduce && mqReduce.addEventListener) {
    mqReduce.addEventListener('change', function (e) {
      CTX.reduce = !!e.matches;
      if (CTX.reduce) { stopAllLoops(); } else { startAllLoops(); }
    });
  }

  /* 模块间互相调用的小登记表（避免顺序耦合） */
  var api = {};

  /* ==================================================================== */
  /* 0. 主题：脚本在 <body> 末尾执行，尽早写 data-theme，避免浅色白闪     */
  /* ==================================================================== */
  var THEME_KEY = 'kp-theme';

  function readTheme() {
    var t = null;
    try { t = W.localStorage.getItem(THEME_KEY); } catch (e) {}
    return t === 'dark' ? 'dark' : 'light';
  }
  function applyTheme(t) { D.documentElement.setAttribute('data-theme', t); }
  applyTheme(readTheme());

  function paintThemeBtn() {
    var btn = $('#theme-btn');
    if (!btn) return;
    var light = D.documentElement.getAttribute('data-theme') !== 'dark';
    btn.textContent = light ? '☾' : '☀';
    btn.title = light ? '切到深色主题' : '切到浅色主题';
    btn.setAttribute('aria-label', btn.title);
  }

  function initTheme() {
    paintThemeBtn();
    var btn = $('#theme-btn');
    if (!btn) return;
    on(btn, 'click', function () {
      var next = D.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { W.localStorage.setItem(THEME_KEY, next); } catch (e) {}
      paintThemeBtn();
    });
  }

  /* ==================================================================== */
  /* 1. 离线语法高亮（保留原实现，逐字符扫描，注释 > 字符串 > 数字 > 标识符） */
  /* ==================================================================== */
  var KW = {
    js: ('const let var function return if else for while do break continue new class extends ' +
         'import export from default async await try catch finally throw typeof instanceof in of ' +
         'null undefined true false this super delete void yield static get set').split(' '),
    java: ('public private protected class interface extends implements new return if else for while do ' +
           'break continue static final void int long double float boolean char byte short String ' +
           'throw throws try catch finally import package this super null true false abstract ' +
           'synchronized volatile transient instanceof enum record var').split(' '),
    bash: ('cd ls npm npx node git mvn java curl echo export set powershell chcp start taskkill netstat ' +
           'findstr mvnw soffice').split(' '),
    sql: ('select from where insert into values update set delete create table database drop alter ' +
          'primary key not null default varchar int datetime').split(' '),
    css: ('display flex grid position absolute relative fixed sticky margin padding border background ' +
          'color width height font size weight align items justify content gap top left right bottom ' +
          'overflow transform transition').split(' ')
  };

  // 逐字符扫描，优先匹配 注释 > 字符串 > 数字 > 标识符
  function scan(code, opt) {
    var out = '';
    var i = 0, n = code.length;
    var lc = opt.lineComment, bc = opt.blockComment, kw = opt.keywords || [];
    var kwSet = Object.create(null);
    for (var q = 0; q < kw.length; q++) kwSet[kw[q]] = 1;

    while (i < n) {
      var c = code[i], c2 = code.substr(i, 2);

      // 行注释
      if (lc && code.substr(i, lc.length) === lc) {
        var e = code.indexOf('\n', i);
        if (e < 0) e = n;
        out += '<span class="tk-c">' + esc(code.slice(i, e)) + '</span>';
        i = e;
        continue;
      }
      // 块注释
      if (bc && code.substr(i, bc[0].length) === bc[0]) {
        var e2 = code.indexOf(bc[1], i + bc[0].length);
        e2 = e2 < 0 ? n : e2 + bc[1].length;
        out += '<span class="tk-c">' + esc(code.slice(i, e2)) + '</span>';
        i = e2;
        continue;
      }
      // 字符串
      if (c === '"' || c === "'" || c === '`') {
        var j = i + 1, closed = false;
        while (j < n) {
          if (code[j] === '\\') { j += 2; continue; }
          if (code[j] === c) { closed = true; break; }
          if (c !== '`' && code[j] === '\n') break;
          j++;
        }
        var end = closed ? j + 1 : j;
        out += '<span class="tk-s">' + esc(code.slice(i, end)) + '</span>';
        i = end;
        continue;
      }
      // 数字
      if (/[0-9]/.test(c) && !/[A-Za-z_$]/.test(code[i - 1] || '')) {
        var m = /^[0-9][0-9a-fA-FxX._]*/.exec(code.slice(i));
        out += '<span class="tk-n">' + esc(m[0]) + '</span>';
        i += m[0].length;
        continue;
      }
      // 标识符 / 关键字
      if (/[A-Za-z_$\u4e00-\u9fa5]/.test(c)) {
        var m2 = /^[A-Za-z0-9_$\u4e00-\u9fa5]+/.exec(code.slice(i));
        var w = m2[0];
        var rest = code.slice(i + w.length);
        if (kwSet[w]) out += '<span class="tk-k">' + esc(w) + '</span>';
        else if (/^\s*\(/.test(rest)) out += '<span class="tk-f">' + esc(w) + '</span>';
        else out += esc(w);
        i += w.length;
        continue;
      }
      out += esc(c);
      i++;
    }
    return out;
  }

  // 标记语言（html / xml / vue template）
  // 关键：必须逐段构造输出，不能对“已经插入的 <span> 标记”再做正则替换，
  // 否则会把标记自身再高亮一遍，生成坏掉的 HTML。
  function scanAttrs(s) {
    var out = '', last = 0, m;
    var re = /(\s+)([A-Za-z_:@#][\w:.\-]*)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)?/g;
    while ((m = re.exec(s))) {
      out += esc(s.slice(last, m.index));
      out += esc(m[1]);
      out += '<span class="tk-a">' + esc(m[2]) + '</span>';
      if (m[3]) {
        out += esc(m[3]);
        if (m[4]) {
          var v = m[4];
          if (v.charAt(0) === '"' || v.charAt(0) === "'") {
            out += '<span class="tk-s">' + esc(v) + '</span>';
          } else {
            out += '<span class="tk-n">' + esc(v) + '</span>';
          }
        }
      }
      last = m.index + m[0].length;
    }
    out += esc(s.slice(last));
    return out;
  }

  function scanMarkup(code) {
    var out = '', i = 0, n = code.length;
    while (i < n) {
      if (code.substr(i, 4) === '<!--') {
        var e = code.indexOf('-->', i);
        e = e < 0 ? n : e + 3;
        out += '<span class="tk-c">' + esc(code.slice(i, e)) + '</span>';
        i = e; continue;
      }
      if (code.substr(i, 2) === '{{') {
        var e2 = code.indexOf('}}', i);
        if (e2 > 0) {
          out += '<span class="tk-p">{{</span>' +
                 '<span class="tk-n">' + esc(code.slice(i + 2, e2)) + '</span>' +
                 '<span class="tk-p">}}</span>';
          i = e2 + 2; continue;
        }
      }
      if (code[i] === '<') {
        var e3 = code.indexOf('>', i);
        if (e3 > 0) {
          var raw = code.slice(i, e3 + 1);
          var inner = raw.slice(1, raw.length - 1);
          var closing = inner.charAt(0) === '/';
          if (closing) inner = inner.slice(1);
          var selfClose = /\/\s*$/.test(inner);
          if (selfClose) inner = inner.replace(/\/\s*$/, '');
          var nm = /^\s*([A-Za-z][\w:-]*)/.exec(inner);
          var tagName = '';
          if (nm) { tagName = nm[1]; inner = inner.slice(nm.index + nm[0].length); }
          out += '<span class="tk-p">&lt;' + (closing ? '/' : '') + '</span>';
          if (tagName) out += '<span class="tk-t">' + esc(tagName) + '</span>';
          out += scanAttrs(inner);
          if (selfClose) out += '<span class="tk-p">/</span>';
          out += '<span class="tk-p">&gt;</span>';
          i = e3 + 1; continue;
        }
      }
      out += esc(code[i]);
      i++;
    }
    return out;
  }

  function highlight(code, lang) {
    lang = (lang || 'text').toLowerCase();
    switch (lang) {
      case 'vue': {
        // 拆出 script / style 单独处理
        var out = '', pos = 0;
        var re = /<(script|style)([^>]*)>([\s\S]*?)<\/\1>/g, m;
        while ((m = re.exec(code))) {
          out += scanMarkup(code.slice(pos, m.index));
          var openHtml = '<span class="tk-p">&lt;</span><span class="tk-t">' + m[1] + '</span>' +
                         '<span class="tk-a">' + esc(m[2]) + '</span><span class="tk-p">&gt;</span>';
          var innerCode = m[1] === 'script'
            ? scan(m[3], { lineComment: '//', blockComment: ['/*', '*/'], keywords: KW.js })
            : scan(m[3], { lineComment: '//', blockComment: ['/*', '*/'], keywords: KW.css });
          var closeHtml = '<span class="tk-p">&lt;/</span><span class="tk-t">' + m[1] + '</span><span class="tk-p">&gt;</span>';
          out += openHtml + innerCode + closeHtml;
          pos = m.index + m[0].length;
        }
        out += scanMarkup(code.slice(pos));
        return out;
      }
      case 'html': case 'xml': return scanMarkup(code);
      case 'js': case 'javascript': case 'json':
        return scan(code, { lineComment: '//', blockComment: ['/*', '*/'], keywords: KW.js });
      case 'java':
        return scan(code, { lineComment: '//', blockComment: ['/*', '*/'], keywords: KW.java });
      case 'css':
        return scan(code, { lineComment: null, blockComment: ['/*', '*/'], keywords: KW.css });
      case 'bash': case 'sh': case 'powershell': case 'ps1':
        return scan(code, { lineComment: '#', blockComment: null, keywords: KW.bash });
      case 'yml': case 'yaml':
        return scan(code, { lineComment: '#', blockComment: null, keywords: [] });
      case 'sql':
        return scan(code, { lineComment: '--', blockComment: ['/*', '*/'], keywords: KW.sql });
      case 'properties':
        return scan(code, { lineComment: '#', blockComment: null, keywords: [] });
      default:
        return esc(code);
    }
  }

  /* ==================================================================== */
  /* 2. 轻提示 .toast                                                     */
  /* ==================================================================== */
  var toastEl = null, toastTimer = 0, toastHideTimer = 0;
  function ensureToast() {
    if (toastEl) return toastEl;
    toastEl = D.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.style.display = 'none';   // 空闲时不占位、不可见（显示时由 CSS 接管）
    D.body.appendChild(toastEl);
    return toastEl;
  }
  function toast(msg) {
    var t = ensureToast();
    clearTimeout(toastHideTimer);
    t.textContent = msg;
    t.style.display = '';
    void t.offsetWidth;   // 强制回流，连续两次 toast 也能重放过渡
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove('on');
      toastHideTimer = setTimeout(function () {
        if (!t.classList.contains('on')) t.style.display = 'none';
      }, 260);
    }, 1750);
  }

  /* ==================================================================== */
  /* 3. 统一滚动管线：全站只挂一个 scroll 监听，rAF 节流                   */
  /* ==================================================================== */
  var scrollFns = [];
  var scrollTicking = false;

  function scrollTick() {
    scrollTicking = false;
    var y = W.pageYOffset || D.documentElement.scrollTop || 0;
    for (var i = 0; i < scrollFns.length; i++) {
      try { scrollFns[i](y); } catch (e) { /* 单点故障不影响其它 */ }
    }
  }
  function requestTick() {
    if (scrollTicking) return;
    scrollTicking = true;
    raf(scrollTick);
  }
  function addScroll(fn) { scrollFns.push(fn); }
  // 全站唯一的 scroll / resize 监听：rAF 节流后统一分发给各模块
  on(W, 'scroll', requestTick, { passive: true });
  on(W, 'resize', requestTick);

  function headerH() {
    var t = $('.top');
    return t ? t.offsetHeight : 60;
  }

  /* ==================================================================== */
  /* 4. 画布循环登记：document.hidden 时全部暂停                          */
  /* ==================================================================== */
  var loops = [];
  var docHidden = !!D.hidden;

  function addLoop(step) {
    var st = { running: false, id: 0, step: step };
    st.start = function () {
      if (st.running) return;
      st.running = true;
      var tick = function (t) {
        if (!st.running) return;
        try { st.step(t); } catch (e) { st.running = false; return; }
        st.id = raf(tick);
      };
      st.id = raf(tick);
    };
    st.stop = function () {
      st.running = false;
      if (st.id) caf(st.id);
      st.id = 0;
    };
    loops.push(st);
    return st;
  }
  function stopAllLoops() { for (var i = 0; i < loops.length; i++) loops[i].stop(); }
  function startAllLoops() { for (var i = 0; i < loops.length; i++) loops[i].start(); }
  on(D, 'visibilitychange', function () {
    docHidden = !!D.hidden;
    if (docHidden) stopAllLoops(); else startAllLoops();
  });

  /* ==================================================================== */
  /* 5. 代码块：高亮 + 复制（.copy.ok + toast）                            */
  /*    生成器已把代码在构建期染好色（.tk-k/.tk-s/…），这里只在「没有染色」  */
  /*    时才补一遍（例如手工新增的 .code），避免重复扫描 232 个代码块。      */
  /* ==================================================================== */
  function initCode() {
    $$('.code').forEach(function (box) {
      var codeEl = box.querySelector('code');
      if (!codeEl) return;
      var raw = codeEl.textContent;
      var already = !!codeEl.querySelector('.tk-k, .tk-s, .tk-n, .tk-c, .tk-t, .tk-a');
      if (!already) {
        var lang = box.getAttribute('data-lang') || 'text';
        try { codeEl.innerHTML = highlight(raw, lang); } catch (e) { /* 高亮失败保留原文 */ }
      }
      // 只绑复制，不动 .code-body / .code-ln（行号槽是生成器产出的）
      var btn = box.querySelector('.copy');
      if (btn) {
        on(btn, 'click', function () { copyText(raw, btn); });
      }
    });
  }

  function copyText(text, btn) {
    var done = function () {
      var old = btn.textContent;
      btn.textContent = '已复制';
      btn.classList.add('ok');
      toast('代码已复制到剪贴板');
      setTimeout(function () { btn.textContent = old; btn.classList.remove('ok'); }, 1400);
    };
    var fallback = function () {
      var ta = D.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
      ta.setAttribute('readonly', 'readonly');
      D.body.appendChild(ta);
      ta.select();
      var okCopy = false;
      try { okCopy = D.execCommand('copy'); } catch (e) { okCopy = false; }
      D.body.removeChild(ta);
      if (okCopy) done();
      else toast('复制失败：请手动选中代码后 Ctrl+C');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
  }

  /* ==================================================================== */
  /* 6. 「学会了」勾选 + 进度环 + localStorage                             */
  /* ==================================================================== */
  var PKEY = 'kp-progress-v1';

  function loadProgress() {
    try { return JSON.parse(W.localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { W.localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {}
  }

  function initProgress() {
    var prog = loadProgress();
    var boxes = $$('.kp-done input');
    if (!boxes.length) {
      // 首页也显示总进度
      paintGlobalProgress(prog);
      return;
    }

    function refresh() {
      $$('.kp').forEach(function (card) {
        var id = card.getAttribute('data-id');
        var cb = card.querySelector('.kp-done input');
        var doneOn = !!(cb && cb.checked);
        card.classList.toggle('done', doneOn);

        var toc = $('.toc a[href="#' + cssEsc(card.id) + '"]');
        if (toc) {
          var mark = toc.querySelector('.done');
          if (doneOn && !mark) toc.insertAdjacentHTML('beforeend', '<span class="done">✓</span>');
          if (!doneOn && mark) mark.parentNode.removeChild(mark);
        }
      });
      paintGlobalProgress(prog);
    }

    // 先把本地进度回填到复选框（旧实现只回填了进度环，刷新后勾选状态会丢）
    boxes.forEach(function (cb) {
      var card = cb.closest ? cb.closest('.kp') : null;
      if (!card) return;
      cb.checked = !!prog[card.getAttribute('data-id')];
    });

    boxes.forEach(function (cb) {
      on(cb, 'change', function () {
        var card = cb.closest ? cb.closest('.kp') : null;
        if (!card) return;
        var id = card.getAttribute('data-id');
        if (cb.checked) prog[id] = 1; else delete prog[id];
        saveProgress(prog);
        refresh();
      });
    });
    refresh();
  }

  function paintGlobalProgress(prog) {
    var allIds = W.KP_ALL_IDS || [];
    var total = allIds.length, doneAll = 0, i;
    for (i = 0; i < total; i++) if (prog[allIds[i]]) doneAll++;
    var pct = total ? doneAll / total : 0;
    var txtEl = D.getElementById('prog-txt');
    if (txtEl) txtEl.textContent = doneAll + '/' + total;
    var ring = $('.ring .fg');
    if (ring) {
      var C = 2 * Math.PI * 12;
      ring.setAttribute('stroke-dasharray', C.toFixed(2));
      ring.setAttribute('stroke-dashoffset', (C * (1 - pct)).toFixed(2));
    }
    var wrap = $('.prog');
    if (wrap) wrap.setAttribute('title', '已学会 ' + doneAll + ' / ' + total + ' 个知识点');
  }

  function cssEsc(s) { return String(s).replace(/"/g, '\\"'); }

  /* ==================================================================== */
  /* 7. 滚动入场 .rv.in                                                   */
  /* ==================================================================== */
  function initReveal() {
    var els = $$('.rv');
    if (!els.length) return;
    if (CTX.reduce || !('IntersectionObserver' in W)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -2% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ==================================================================== */
  /* 8. 知识点块级阶梯浮现（每块 60–120ms 递增，最多 6 级 → 360ms）        */
  /*    实现依据 style.css 的 .x-up：它是一段 0.55s 的一次性动画，          */
  /*    所以「进入视口时才挂类 + 内联 animation-delay」正好得到阶梯效果，   */
  /*    既不需要新 CSS，也不会和 .rv 的 translate 过渡互相覆盖。            */
  /* ==================================================================== */
  function initStagger() {
    var cards = $$('.kp');
    if (!cards.length) return;

    function revealCard(card) {
      if (!card || card.getAttribute('data-x-shown') === '1') return;
      card.setAttribute('data-x-shown', '1');
      var blocks = $$('.kp-body .blk', card);
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        b.style.animationDelay = (Math.min(i, 5) * 70) + 'ms';
        b.classList.add('x-up');
        // 兜底：万一 CSS 里 .x-up 定义变了（比如改成 transition 写法），
        // 动画结束后把内联状态清掉并保证可见
        (function (el) {
          setTimeout(function () {
            if (!el.classList.contains('x-up')) return;
            var cs = W.getComputedStyle ? W.getComputedStyle(el) : null;
            if (cs && parseFloat(cs.opacity) < 0.9) el.classList.remove('x-up');
            el.style.animationDelay = '';
          }, 1200);
        })(b);
      }
    }
    api.revealCard = revealCard;

    if (CTX.reduce || !('IntersectionObserver' in W)) { cards.forEach(revealCard); return; }

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { revealCard(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.02, rootMargin: '0px 0px -3% 0px' });
    cards.forEach(function (c) { io.observe(c); });

    // 兜底：1.2s 后视口内的卡片无论如何都要播放（防止 IO 意外未触发）
    setTimeout(function () {
      cards.forEach(function (c) {
        if (c.getAttribute('data-x-shown') === '1') return;
        var r = c.getBoundingClientRect();
        if (r.top < W.innerHeight && r.bottom > 0) revealCard(c);
      });
    }, 1200);
  }

  /* ==================================================================== */
  /* 9. 浮层：阅读进度条 / 上一·下一知识点导航                             */
  /* ==================================================================== */
  function initReadBar() {
    var bar = D.createElement('div');
    bar.className = 'read-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<i></i>';
    var fill = bar.firstChild;
    D.body.insertBefore(bar, D.body.firstChild);

    addScroll(function (y) {
      var dh = D.documentElement.scrollHeight - W.innerHeight;
      var p = dh > 0 ? clamp(y / dh, 0, 1) : 0;
      fill.style.width = (p * 100).toFixed(2) + '%';
    });
  }

  function initKpNav() {
    var cards = $$('.kp');
    if (!cards.length) return;

    var nav = D.createElement('div');
    nav.className = 'kp-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', '本讲知识点快速跳转');
    nav.innerHTML =
      '<span class="sr-only">本讲知识点快速跳转</span>' +
      '<a class="x-prev" href="#' + cards[0].id + '" aria-disabled="true" title="上一个知识点（Alt+↑）">↑</a>' +
      '<a class="x-next" href="#' + cards[1].id + '" title="下一个知识点（Alt+↓）">↓</a>' +
      '<span class="x-num" aria-live="polite">1 / ' + cards.length + '</span>';
    D.body.appendChild(nav);

    var prev = nav.querySelector('.x-prev');
    var next = nav.querySelector('.x-next');
    var num = nav.querySelector('.x-num');
    var cur = 0;

    function apply() {
      num.textContent = (cur + 1) + ' / ' + cards.length;
      prev.setAttribute('aria-disabled', cur <= 0 ? 'true' : 'false');
      next.setAttribute('aria-disabled', cur >= cards.length - 1 ? 'true' : 'false');
      prev.classList.toggle('dis', cur <= 0);
      next.classList.toggle('dis', cur >= cards.length - 1);
      // href 跟着当前位置走：即使 JS 点击被拦截，中键/新标签也能落到正确的锚点
      if (cards[Math.max(0, cur - 1)]) prev.setAttribute('href', '#' + cards[Math.max(0, cur - 1)].id);
      if (cards[Math.min(cards.length - 1, cur + 1)]) next.setAttribute('href', '#' + cards[Math.min(cards.length - 1, cur + 1)].id);
    }
    function stepBy(n, e) {
      if (e) e.preventDefault();
      var t = clamp(cur + n, 0, cards.length - 1);
      if (t === cur) return;
      scrollToCard(cards[t], true);
      cur = t;
      apply();
    }
    on(prev, 'click', function (e) { stepBy(-1, e); });
    on(next, 'click', function (e) { stepBy(1, e); });

    api.updateKpNav = function (index, visible) {
      if (typeof index === 'number' && index >= 0) {
        if (index !== cur) { cur = index; apply(); }
      }
      nav.classList.toggle('on', !!visible);
    };
    apply();
  }

  /* 瞬时滚动：CSS 里有 html{scroll-behavior:smooth}，会让所有程序化滚动变成
     一段动画；深链/搜索跳转要「一落地就到位」，这里临时改回 auto 再滚。 */
  function scrollNow(top) {
    var html = D.documentElement;
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    try {
      if (W.scrollTo) W.scrollTo(0, top);
      else html.scrollTop = top;
    } finally {
      html.style.scrollBehavior = prev;
    }
  }

  function scrollToCard(card, smooth) {
    if (!card) return;
    var y = W.pageYOffset || D.documentElement.scrollTop || 0;
    var top = card.getBoundingClientRect().top + y - headerH() - 14;
    if (top < 0) top = 0;
    if (smooth && !CTX.reduce && W.scrollTo) {
      W.scrollTo({ top: top, behavior: 'smooth' });
    } else {
      scrollNow(top);
    }
  }

  /* 深链定位后的高亮（1.5s）：类名 x-hl 给 CSS 用，内联样式保证一定有反馈 */
  function flashCard(el) {
    if (!el) return;
    if (el.__xFlash) clearTimeout(el.__xFlash);
    el.classList.add('x-hl');
    el.style.transition = 'box-shadow .42s ease, border-color .42s ease';
    el.style.boxShadow = '0 0 0 3px rgba(157,58,46,.55), 0 20px 46px rgba(157,58,46,.20)';
    el.__xFlash = setTimeout(function () {
      el.style.boxShadow = '';
      el.classList.remove('x-hl');
      el.__xFlash = 0;
      setTimeout(function () { el.style.transition = ''; }, 520);
    }, 1500);
  }

  /* ==================================================================== */
  /* 10. 目录高亮 / 回顶 / 进度轨（统一在滚动管线里算，避免重复监听）      */
  /* ==================================================================== */
  function initScrollUi() {
    var cards = $$('.kp');
    var tocLinks = $$('.toc a');
    var tocMap = {};
    tocLinks.forEach(function (a) { tocMap[String(a.getAttribute('href')).replace(/^#/, '')] = a; });
    var tb = D.getElementById('top-btn');
    var rail = $('.scroll-rail i');
    var curIndex = -1;
    var curId = '';

    function computeCur() {
      if (!cards.length) return -1;
      var hh = headerH() + 16;
      var best = 0;
      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].getBoundingClientRect();
        if (r.top - hh <= 0) best = i;
        else break;   // 卡片自上而下排列，可提前结束
      }
      return best;
    }

    addScroll(function (y) {
      // 回顶按钮
      if (tb) tb.classList.toggle('on', y > 600);
      // 右侧进度轨
      if (rail) {
        var dh = D.documentElement.scrollHeight - W.innerHeight;
        rail.style.height = (dh > 0 ? clamp(y / dh, 0, 1) * 100 : 0) + '%';
      }
      if (!cards.length) return;

      var idx = computeCur();
      if (idx !== curIndex) {
        curIndex = idx;
        var id = cards[idx].id;
        if (id !== curId) {
          curId = id;
          for (var t = 0; t < tocLinks.length; t++) tocLinks[t].classList.remove('on');
          if (tocMap[id]) tocMap[id].classList.add('on');
        }
      }
      if (api.updateKpNav) api.updateKpNav(idx, y > 320);
      api.kpIndex = idx;
    });
  }

  /* ==================================================================== */
  /* 11. 顶栏交互：移动端抽屉 / 回到顶部 / Esc 关闭浮层                   */
  /* ==================================================================== */
  /* 抽屉层级自愈：若 #side 的某个祖先形成了 stacking context（例如有人给
     .shell 加了 z-index），#side(z95) 就会被锁在内部，body 级 #scrim(z90) 会
     反过来盖住抽屉——表现为抽屉发虚、点不动、一点就关。这时把 #side 临时提到
     <body> 下逃出该 context，关闭后再放回 .shell 首位。
     CSS 健康时本函数什么都不做（只做一次样式判定，不改 DOM）。 */
  var drawerRestoreTimer = 0;
  function drawerHasContextAncestor(side) {
    var el = side.parentElement;
    while (el && el !== D.body && el !== D.documentElement) {
      var cs = null;
      try { cs = W.getComputedStyle(el); } catch (e) { cs = null; }
      if (cs) {
        if (cs.position !== 'static' && cs.zIndex && cs.zIndex !== 'auto') return true;
        if (cs.transform && cs.transform !== 'none') return true;
        if (cs.filter && cs.filter !== 'none') return true;
        if (cs.isolation === 'isolate') return true;
        if (cs.opacity !== '' && parseFloat(cs.opacity) < 0.999) return true;
      }
      el = el.parentElement;
    }
    return false;
  }
  function liftDrawer(open) {
    var side = D.getElementById('side');
    var shell = $('.shell');
    if (!side || !shell) return;
    clearTimeout(drawerRestoreTimer);
    if (open) {
      if (W.innerWidth > 1080) return;
      if (side.parentNode !== shell) return;
      if (!drawerHasContextAncestor(side)) return;   // CSS 健康 → 不动 DOM
      D.body.appendChild(side);
    } else {
      drawerRestoreTimer = setTimeout(function () {
        if (side.parentNode === D.body && shell) shell.insertBefore(side, shell.firstChild);
      }, 380);
    }
  }

  function openDrawer(open) {
    var side = D.getElementById('side');
    var scrim = D.getElementById('scrim');
    if (!side) return;
    liftDrawer(!!open);
    side.classList.toggle('open', !!open);
    if (scrim) scrim.classList.toggle('on', !!open);
    var mb = D.getElementById('menu-btn');
    if (mb) mb.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function drawerIsOpen() {
    var side = D.getElementById('side');
    return !!(side && side.classList.contains('open'));
  }

  function initChrome() {
    var mb = D.getElementById('menu-btn');
    var scrim = D.getElementById('scrim');

    if (mb) mb.setAttribute('aria-expanded', 'false');
    on(mb, 'click', function () { openDrawer(!drawerIsOpen()); });
    on(scrim, 'click', function () { openDrawer(false); });
    $$('.toc a, .nav-lab a').forEach(function (a) {
      on(a, 'click', function () { if (W.innerWidth <= 1080) openDrawer(false); });
    });

    var tb = D.getElementById('top-btn');
    on(tb, 'click', function () {
      if (CTX.reduce || !W.scrollTo) { W.scrollTo(0, 0); return; }
      W.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 旋转屏幕 / 拉宽回桌面布局时，把被临时提到 body 的抽屉放回 .shell
    on(W, 'resize', function () {
      var side = D.getElementById('side');
      if (side && side.parentNode === D.body && W.innerWidth > 1080) openDrawer(false);
    });
  }

  /* ==================================================================== */
  /* 12. 自测答案：一键展开 / 收起（#qa-open / #qa-close）                */
  /* ==================================================================== */
  function initQaTools() {
    function all(open) {
      var list = $$('details.qa');
      list.forEach(function (d) { d.open = open; });
      if (list.length) toast(open ? '已展开 ' + list.length + ' 道课堂思考' : '已收起全部答案');
    }
    var o = D.getElementById('qa-open');
    var c = D.getElementById('qa-close');
    on(o, 'click', function () { all(true); });
    on(c, 'click', function () { all(false); });
  }

  /* ==================================================================== */
  /* 13. 搜索索引：<script> 懒加载（file:// 不能用 fetch/XHR）            */
  /* ==================================================================== */
  var indexState = { loaded: false, pending: false, waiting: [] };

  function withIndex(okFn, errFn) {
    if (indexState.loaded || W.KP_INDEX) {
      indexState.loaded = true;
      if (okFn) okFn();
      return;
    }
    if (okFn) indexState.waiting.push({ ok: okFn, err: errFn });
    else if (errFn) indexState.waiting.push({ ok: null, err: errFn });
    if (indexState.pending) return;
    indexState.pending = true;

    var s = D.createElement('script');
    s.src = 'assets/search-index.js';
    s.async = true;
    s.onload = function () {
      indexState.loaded = true;
      indexState.pending = false;
      var q = indexState.waiting; indexState.waiting = [];
      for (var i = 0; i < q.length; i++) { try { if (q[i].ok) q[i].ok(); } catch (e) {} }
    };
    s.onerror = function () {
      indexState.pending = false;
      var q = indexState.waiting; indexState.waiting = [];
      for (var i = 0; i < q.length; i++) { try { if (q[i].err) q[i].err(); } catch (e) {} }
    };
    D.head.appendChild(s);
  }

  /* 关键词高亮（先转义再包 <mark>，避免注入） */
  function markHl(s, q) {
    s = String(s == null ? '' : s);
    if (!q) return esc(s);
    var out = '', low = s.toLowerCase(), lq = q.toLowerCase(), from = 0, i;
    while ((i = low.indexOf(lq, from)) >= 0) {
      out += esc(s.slice(from, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>';
      from = i + q.length;
    }
    return out + esc(s.slice(from));
  }

  /* 搜索结果链接：带上 ?kp= 深链参数，落地后自动定位并高亮 */
  function kpParam(it) {
    return String(it.id || '').replace(/^kp-/, '');
  }
  function kpHref(it) {
    return it.file + '?kp=' + encodeURIComponent(kpParam(it)) + '#' + it.id;
  }
  function currentFile() {
    var p = W.location.pathname || '';
    return decodeURIComponent(p.slice(p.lastIndexOf('/') + 1));
  }
  function isSamePage(file) { return String(file) === currentFile(); }

  function jumpToCard(card, withFlash) {
    if (!card) return false;
    if (api.revealCard) api.revealCard(card);
    card.classList.add('in');
    scrollToCard(card, true);
    if (withFlash) {
      flashCard(card);
      var h3 = card.querySelector('.kp-head h3');
      if (h3) toast('已定位到「' + txt(h3).slice(0, 18) + '」');
    }
    return true;
  }

  /* ==================================================================== */
  /* 14. 顶栏内联搜索：#search → #hits.on（保留原能力）                   */
  /* ==================================================================== */
  function initSearch() {
    var input = D.getElementById('search');
    if (!input) return;
    var box = D.getElementById('hits');
    var home = D.getElementById('home-body');
    var timer = 0;

    function render(q) {
      q = String(q || '').replace(/^\s+|\s+$/g, '');
      if (!q) {
        if (box) { box.classList.remove('on'); box.innerHTML = ''; }
        if (home) home.style.display = '';
        return;
      }
      withIndex(function () { paint(q); }, function () {
        if (!box) return;
        box.innerHTML = '<div class="empty">搜索索引加载失败，请确认 <code>assets/search-index.js</code> 与本页在同一目录下。</div>';
        box.classList.add('on');
      });
    }

    function paint(q) {
      if (!box) return;
      if (home) home.style.display = 'none';
      if (!W.KP_INDEX) return;
      var lq = q.toLowerCase();
      var hits = [];
      for (var i = 0; i < W.KP_INDEX.length; i++) {
        var it = W.KP_INDEX[i];
        if ((it.name + ' ' + it.lab + ' ' + it.labName + ' ' + it.text).toLowerCase().indexOf(lq) >= 0) hits.push(it);
        if (hits.length > 400) break;
      }
      if (!hits.length) {
        box.innerHTML = '<div class="empty">没有匹配的知识点，换个词试试（比如 <b>v-model</b>、<b>跨域</b>、<b>Result</b>）</div>';
        box.classList.add('on');
        return;
      }
      var shown = hits.slice(0, 50);
      var html = '<div class="sec-title"><span class="bar"></span><h2>找到 ' + hits.length +
        ' 个知识点' + (hits.length > shown.length ? '（显示前 ' + shown.length + ' 个）' : '') + '</h2></div>';
      for (var k = 0; k < shown.length; k++) {
        var hit = shown[k];
        var lowText = String(hit.text).toLowerCase();
        var pos = lowText.indexOf(lq);
        var snippet = pos >= 0
          ? (pos > 40 ? '…' : '') + String(hit.text).slice(Math.max(0, pos - 40), pos + 100) + '…'
          : String(hit.text).slice(0, 120) + '…';
        html += '<a class="hit" href="' + kpHref(hit) + '" data-file="' + esc(hit.file) + '" data-id="' + esc(hit.id) + '">' +
          '<div class="h-top"><span class="h-lab">实训' + esc(hit.lab) + ' · ' + esc(hit.labName) + '</span>' +
          '<span class="h-num">' + esc(hit.num) + '</span></div>' +
          '<h4>' + markHl(hit.name, q) + '</h4>' +
          '<p>' + markHl(snippet, q) + '</p></a>';
      }
      box.innerHTML = html;
      box.classList.add('on');
    }

    on(input, 'focus', function () { withIndex(function () {}, null); });
    on(input, 'input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { render(input.value); }, 130);
    });
    on(input, 'keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        render('');
        input.blur();
        e.stopPropagation();
      } else if (e.key === 'Enter') {
        var first = box ? box.querySelector('.hit') : null;
        if (first) {
          e.preventDefault();
          followHit(first);
        }
      }
    });
    // 站内命中（同一讲）：不刷新页面，直接定位 + 高亮
    on(D, 'click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('#hits .hit') : null;
      if (!a) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      if (!isSamePage(a.getAttribute('data-file'))) return;
      e.preventDefault();
      var card = D.getElementById(a.getAttribute('data-id'));
      if (!card) return;
      input.value = '';
      render('');
      jumpToCard(card, true);
    });
  }

  function followHit(a) {
    if (!a) return;
    var file = a.getAttribute('data-file');
    if (file && isSamePage(file)) {
      var card = D.getElementById(a.getAttribute('data-id'));
      if (card) { jumpToCard(card, true); return; }
    }
    // 跨讲：走页面离场过渡
    var href = a.getAttribute('href');
    documentLeaveTo(href);
  }

  /* ==================================================================== */
  /* 15. 命令面板 .cmdk（Ctrl+K / “/”）                                   */
  /* ==================================================================== */
  function initCmdk() {
    var root = D.createElement('div');
    root.className = 'cmdk';
    root.id = 'cmdk-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '搜索知识点');
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('hidden', 'hidden');
    root.innerHTML =
      '<div class="cmdk-box" role="document">' +
        '<input class="cmdk-input" type="text" autocomplete="off" spellcheck="false" ' +
          'placeholder="搜索 109 个知识点：v-model / 跨域 / 路由守卫 …" ' +
          'aria-label="搜索知识点" aria-autocomplete="list" aria-controls="cmdk-list" ' +
          'role="combobox" aria-expanded="true">' +
        '<div class="cmdk-list" id="cmdk-list" role="listbox" aria-label="搜索结果"></div>' +
        '<div class="cmdk-hint">' +
          '<span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>' +
          '<span><kbd>Enter</kbd> 前往</span>' +
          '<span><kbd>Esc</kbd> 关闭</span>' +
          '<span class="x-spacer"></span>' +
          '<span class="cmdk-tag" id="cmdk-count">索引未载入</span>' +
        '</div>' +
      '</div>';
    root.style.display = 'none';
    D.body.appendChild(root);

    var box = root.querySelector('.cmdk-box');
    var input = root.querySelector('.cmdk-input');
    var list = root.querySelector('.cmdk-list');
    var countEl = root.querySelector('#cmdk-count');
    var items = [];       // [{ el, href, file, id, title }]
    var sel = 0;
    var open = false;
    var prevFocus = null;
    var closeTimer = 0;

    var LABS = (function () {
      var out = [];
      $$('.nav-lab a').forEach(function (a) {
        var spans = a.querySelectorAll('span');
        out.push({
          href: a.getAttribute('href'),
          n: spans[0] ? txt(spans[0]) : '',
          name: spans[1] ? txt(spans[1]) : txt(a),
          count: spans[2] ? txt(spans[2]) : ''
        });
      });
      return out;
    })();

    function group(title) {
      var g = D.createElement('div');
      g.className = 'x-group';
      g.setAttribute('role', 'presentation');
      g.textContent = title;
      list.appendChild(g);
    }

    function addItem(opts) {
      var a = D.createElement('a');
      a.className = 'cmdk-item';
      a.setAttribute('role', 'option');
      a.setAttribute('aria-selected', 'false');
      a.id = 'cmdk-i-' + items.length;
      a.href = opts.href;
      a.innerHTML = opts.html;
      a.__x = { href: opts.href, file: opts.file || '', id: opts.id || '', title: opts.title || '' };
      a.__i = items.length;
      list.appendChild(a);
      items.push({ el: a, href: opts.href, file: opts.file || '', id: opts.id || '', title: opts.title || '' });
      return a;
    }

    function empty(html) {
      var d = D.createElement('div');
      d.className = 'cmdk-empty';
      d.innerHTML = html;
      list.appendChild(d);
    }

    function setCount(n) {
      countEl.textContent = n + ' 个知识点';
    }

    function setSel(i) {
      if (!items.length) {
        input.removeAttribute('aria-activedescendant');
        return;
      }
      sel = (i % items.length + items.length) % items.length;
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        it.el.classList.toggle('on', k === sel);
        it.el.setAttribute('aria-selected', k === sel ? 'true' : 'false');
      }
      var cur = items[sel].el;
      input.setAttribute('aria-activedescendant', cur.id);
      if (cur.scrollIntoView) {
        try { cur.scrollIntoView({ block: 'nearest' }); } catch (e) { cur.scrollIntoView(false); }
      }
    }

    function render(q) {
      q = String(q || '').replace(/^\s+|\s+$/g, '');
      list.innerHTML = '';
      items = [];
      sel = 0;

      // 空查询：讲次导航
      if (!q) {
        group('七讲 · 直接进入');
        for (var i = 0; i < LABS.length; i++) {
          var lab = LABS[i];
          addItem({
            href: lab.href, file: lab.href, title: '实训' + lab.n + ' ' + lab.name,
            html: '<span class="cmdk-tag">讲次</span>' +
                  '<b>实训 ' + esc(lab.n) + ' · ' + esc(lab.name) + '</b>' +
                  '<small>' + esc(lab.count) + ' 个知识点</small>'
          });
        }
        if (!items.length) empty('没有可用的讲次导航');
        setCount((W.KP_ALL_IDS && W.KP_ALL_IDS.length) || 109);
        setSel(0);
        return;
      }

      if (!indexState.loaded) {
        if (!items.length) empty('正在载入全文索引…');
        setCount(0);
        return;
      }
      var lq = q.toLowerCase();
      var arr = W.KP_INDEX || [];
      var hits = [];
      for (var j = 0; j < arr.length; j++) {
        var it = arr[j];
        if ((it.name + ' ' + it.lab + ' ' + it.labName + ' ' + it.text).toLowerCase().indexOf(lq) >= 0) {
          hits.push(it);
          if (hits.length >= 60) break;
        }
      }
      setCount(hits.length);
      if (!hits.length) {
        empty('没有找到匹配「<b>' + esc(q) + '</b>」的知识点<br>' +
              '<small>试试 v-model、跨域、Result、路由守卫</small>');
        return;
      }
      var lastLab = '';
      for (var m = 0; m < hits.length; m++) {
        var h = hits[m];
        if (h.lab !== lastLab) {
          lastLab = h.lab;
          group('实训 ' + h.lab + ' · ' + h.labName);
        }
        var lowText = String(h.text).toLowerCase();
        var pos = lowText.indexOf(lq);
        var snippet = pos >= 0
          ? (pos > 34 ? '…' : '') + String(h.text).slice(Math.max(0, pos - 34), pos + 96) + '…'
          : String(h.text).slice(0, 110) + '…';
        addItem({
          href: kpHref(h), file: h.file, id: h.id, title: h.name,
          html: '<span class="cmdk-tag">' + esc(h.num) + '</span>' +
                '<b>' + markHl(h.name, q) + '</b>' +
                '<small>' + markHl(snippet, q) + '</small>'
        });
      }
      setSel(0);
    }

    function doOpen(initial) {
      if (open) {
        if (initial && input.value !== initial) { input.value = initial; render(initial); }
        input.focus();
        return;
      }
      open = true;
      prevFocus = D.activeElement;
      clearTimeout(closeTimer);
      root.removeAttribute('hidden');
      root.style.display = '';
      root.setAttribute('aria-hidden', 'false');
      D.body.classList.add('x-lock');
      input.value = initial || '';
      render(input.value);
      input.focus();
      raf(function () { raf(function () { if (open) root.classList.add('on'); }); });
      withIndex(function () {
        if (!open) return;
        render(input.value);
      }, function () {
        if (open) empty('索引加载失败：请确认 assets/search-index.js 与本页在同一目录');
      });
    }

    function doClose(refocus) {
      if (!open) return;
      open = false;
      root.classList.remove('on');
      root.setAttribute('aria-hidden', 'true');
      D.body.classList.remove('x-lock');
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        if (open) return;
        root.style.display = 'none';
        root.setAttribute('hidden', 'hidden');
      }, CTX.reduce ? 0 : 210);
      if (refocus !== false && prevFocus && prevFocus.focus) {
        try { prevFocus.focus(); } catch (e) {}
      }
    }

    function go(item) {
      if (!item) return;
      doClose(false);
      if (item.file && isSamePage(item.file) && item.id) {
        var card = D.getElementById(item.id);
        if (card) { jumpToCard(card, true); return; }
      }
      documentLeaveTo(item.href);
    }

    api.cmdkOpen = doOpen;
    api.cmdkClose = doClose;
    api.cmdkIsOpen = function () { return open; };

    /* ---------------- 交互 ---------------- */
    on(input, 'input', function () { render(input.value); });
    on(input, 'keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); setSel(sel + 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); setSel(sel - 1); }
      else if (k === 'Home') { e.preventDefault(); setSel(0); }
      else if (k === 'End') { e.preventDefault(); setSel(items.length - 1); }
      else if (k === 'Enter') {
        e.preventDefault();
        if (items[sel]) go(items[sel]);
      } else if (k === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        doClose();
      } else if (k === 'Tab') {
        // 在面板内 Tab 只移动选中项，不把焦点丢到背景页
        e.preventDefault();
        setSel(sel + (e.shiftKey ? -1 : 1));
      }
    });

    on(list, 'pointermove', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('.cmdk-item') : null;
      if (a && typeof a.__i === 'number' && a.__i !== sel) setSel(a.__i);
    });
    on(list, 'click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('.cmdk-item') : null;
      if (!a) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;  // 允许新标签页打开
      e.preventDefault();
      go(a.__x);
    });
    on(root, 'mousedown', function (e) {
      if (e.target === root) doClose();
    });
    on(box, 'mousedown', function (e) { e.stopPropagation(); });
  }

  /* 页面离场过渡：body.leaving（CSS 312ms 左右，这里提前 280ms 跳） */
  function documentLeaveTo(href) {
    if (!href) return;
    if (CTX.reduce) { W.location.href = href; return; }
    D.body.classList.add('leaving');
    setTimeout(function () { W.location.href = href; }, 280);
  }

  /* ==================================================================== */
  /* 16. 首页电影感：视差 / 长卷 / 数字滚动                              */
  /* ==================================================================== */
  function initCinema() {
    var bg = $('.cine-bg img');
    var frame = $('.cine-scroll-frame');
    var pan = D.getElementById('pan');
    var panImg = $('.pan-img');
    var panBar = $('.pan-bar i');

    addScroll(function (y) {
      if (!CTX.reduce) {
        if (bg && y < W.innerHeight * 1.6) {
          bg.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0) scale(1.05)';
        }
        if (frame && y < W.innerHeight * 1.6) {
          frame.style.transform = 'translate3d(0,' + (y * -0.05).toFixed(1) + 'px,0)';
        }
      }
      if (pan && panImg) {
        var r = pan.getBoundingClientRect();
        var total = pan.offsetHeight - W.innerHeight;
        var prog = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
        var max = Math.max(0, panImg.offsetWidth - W.innerWidth + 80);
        panImg.style.transform = 'translate3d(' + (-prog * max).toFixed(1) + 'px,0,0)';
        if (panBar) panBar.style.width = (prog * 100).toFixed(2) + '%';
      }
    });

    // 数字滚动
    var stats = $$('.cine-hero .home-stats b');
    if (!stats.length || CTX.reduce || !('IntersectionObserver' in W)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseInt(el.textContent, 10) || 0;
        var t0 = null;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / 1100);
          el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) raf(step);
          else el.textContent = target;
        };
        raf(step);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    stats.forEach(function (s) { io.observe(s); });
  }

  /* ==================================================================== */
  /* 17. 首页细节：逐字标题 / 花瓣 / 墨点画布（hidden 暂停）              */
  /* ==================================================================== */
  function initWow() {
    // 逐字浮现
    var titles = $$('.hero-title, .lab-hero h1');
    if (!CTX.reduce) {
      titles.forEach(function (h) {
        var chars = [];
        (function walk(node) {
          var kids = Array.prototype.slice.call(node.childNodes);
          kids.forEach(function (n) {
            if (n.nodeType === 3) {
              var frag = D.createDocumentFragment();
              var parts = n.textContent.split('');
              for (var i = 0; i < parts.length; i++) {
                var s = D.createElement('span');
                s.className = 'ch';
                s.textContent = parts[i];
                frag.appendChild(s);
                chars.push(s);
              }
              node.replaceChild(frag, n);
            } else if (n.nodeType === 1) {
              if (n.classList && n.classList.contains('ch')) return;
              walk(n);
            }
          });
        })(h);
        chars.forEach(function (c, i) { c.style.animationDelay = (120 + i * 45) + 'ms'; });
      });
    }

    // 花瓣
    var petals = D.getElementById('petals');
    if (petals && !CTX.reduce) {
      for (var i = 0; i < 14; i++) {
        var p = D.createElement('span');
        p.className = 'petal';
        var size = 6 + Math.random() * 8;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = (Math.random() * 100) + '%';
        p.style.animationDuration = (12 + Math.random() * 14) + 's';
        p.style.animationDelay = (-Math.random() * 20) + 's';
        p.style.opacity = (0.22 + Math.random() * 0.32).toFixed(2);
        petals.appendChild(p);
      }
    }

    // 墨点 canvas
    var cv = D.getElementById('ink-canvas');
    if (!cv || CTX.reduce) return;

    var ctx = cv.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(W.devicePixelRatio || 1, 2);
    var Wd = 0, Hd = 0, dots = [];
    var inView = true;

    function resize() {
      var host = cv.parentElement;
      Wd = host.clientWidth;
      Hd = host.clientHeight;
      cv.width = Math.round(Wd * dpr);
      cv.height = Math.round(Hd * dpr);
      cv.style.width = Wd + 'px';
      cv.style.height = Hd + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (var k = 0; k < 46; k++) {
        dots.push({
          x: Math.random() * Wd, y: Math.random() * Hd,
          r: 0.6 + Math.random() * 1.8,
          vy: 0.08 + Math.random() * 0.22,
          vx: -0.06 + Math.random() * 0.12,
          a: 0.03 + Math.random() * 0.05
        });
      }
    }
    resize();
    on(W, 'resize', resize);

    var loop = addLoop(function () {
      if (!inView || docHidden) return;
      ctx.clearRect(0, 0, Wd, Hd);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.y -= d.vy;
        d.x += d.vx;
        if (d.y < -4) { d.y = Hd + 4; d.x = Math.random() * Wd; }
        if (d.x < -4) d.x = Wd + 4;
        if (d.x > Wd + 4) d.x = -4;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(74,56,33,' + d.a + ')';
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if ('IntersectionObserver' in W) {
      var hero = cv.closest('.cine-hero') || cv.parentElement;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { inView = e.isIntersecting; });
      }, { threshold: 0 }).observe(hero);
    }
    if (!docHidden) loop.start();
  }

  /* ==================================================================== */
  /* 18. 首页交互：卡片 3D / hero 视差 / 涟漪 canvas / 离场转场            */
  /* ==================================================================== */
  function initInteractive() {
    // 卡片 3D 倾斜
    if (!CTX.reduce && 'PointerEvent' in W) {
      $$('.lab-card').forEach(function (card) {
        on(card, 'pointermove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = 'perspective(900px) rotateY(' + (px * 6).toFixed(2) +
            'deg) rotateX(' + (-py * 6).toFixed(2) + 'deg) translateY(-6px)';
        });
        on(card, 'pointerleave', function () { card.style.transform = ''; });
      });
    }

    // hero 视差（立轴画卷 ±6px / 梅枝 ∓5px，幅度克制，不与 CSS 争位）
    var hero = $('.cine-hero');
    var scrollFig = $('.cine-scroll');
    var plum = $('.cine-plum');
    if (hero && scrollFig && !CTX.reduce) {
      on(hero, 'pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        scrollFig.style.transform = 'translate3d(' + (px * 6).toFixed(1) + 'px,' + (py * 5).toFixed(1) + 'px,0)';
        if (plum) plum.style.transform = 'translate3d(' + (-px * 5).toFixed(1) + 'px,' + (-py * 4).toFixed(1) + 'px,0)';
      });
      on(hero, 'pointerleave', function () {
        scrollFig.style.transform = '';
        if (plum) plum.style.transform = '';
      });
    }

    // 涟漪 canvas（document.hidden 暂停）
    var rc = D.getElementById('ripple-canvas');
    if (rc && !CTX.reduce) {
      var ctx = rc.getContext('2d');
      if (ctx) {
        var dpr = Math.min(W.devicePixelRatio || 1, 2);
        var Wd = 0, Hd = 0, ripples = [], last = 0, dirty = false;
        function resize() {
          var host = rc.parentElement;
          Wd = host.clientWidth;
          Hd = host.clientHeight;
          rc.width = Math.round(Wd * dpr);
          rc.height = Math.round(Hd * dpr);
          rc.style.width = Wd + 'px';
          rc.style.height = Hd + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          dirty = true;
        }
        resize();
        on(W, 'resize', resize);

        function addRipple(x, y) {
          if (ripples.length > 18) ripples.shift();
          ripples.push({ x: x, y: y, r: 3, a: 0.7, max: 140 + Math.random() * 90 });
          dirty = true;
        }
        if (hero) {
          on(hero, 'pointermove', function (e) {
            var r = rc.getBoundingClientRect();
            var now = (W.performance && W.performance.now) ? W.performance.now() : Date.now();
            if (now - last < 45) return;
            last = now;
            addRipple(e.clientX - r.left, e.clientY - r.top);
          });
        }

        var loop = addLoop(function () {
          if (docHidden) return;
          if (!ripples.length && !dirty) return;
          ctx.clearRect(0, 0, Wd, Hd);
          dirty = false;
          for (var i = ripples.length - 1; i >= 0; i--) {
            var p = ripples[i];
            p.r += (p.max - p.r) * 0.018;
            p.a *= 0.992;
            if (p.a < 0.004) { ripples.splice(i, 1); continue; }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(160,120,80,' + (p.a * 0.28).toFixed(3) + ')';
            ctx.fill();
            ctx.strokeStyle = 'rgba(74,56,33,' + p.a.toFixed(3) + ')';
            ctx.lineWidth = 1.4;
            ctx.stroke();
          }
        });
        if (!docHidden) loop.start();
      }
    }

    // 站内页面跳转：离场过渡
    on(D, 'click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|javascript:|data:|tel:)/.test(href)) return;
      if (!/\.html(\?|#|$)/.test(href)) return;
      if (a.target && a.target !== '_self') return;
      e.preventDefault();
      documentLeaveTo(href);
    });
    on(W, 'pageshow', function () { D.body.classList.remove('leaving'); });
  }

  /* ==================================================================== */
  /* 19. 深链 ?kp=02-3 / #kp-02-3：自动定位并高亮 1.5s                    */
  /* ==================================================================== */
  function initDeepLink() {
    var m = /[?&]kp=([^&#]+)/.exec(W.location.search || '');
    var hash = String(W.location.hash || '').replace(/^#/, '');
    var id = '';
    if (m) {
      var v = '';
      try { v = decodeURIComponent(m[1]); } catch (e) { v = m[1]; }
      id = v.indexOf('kp-') === 0 ? v : 'kp-' + v;
    } else if (/^kp-/.test(hash)) {
      id = hash;
    }
    if (!id) return;
    var card = D.getElementById(id);
    if (!card) return;

    if (api.revealCard) api.revealCard(card);
    card.classList.add('in');

    // 用户一旦自己动手滚动，就不再自动校正位置（避免"抢方向盘"）
    var userMoved = false;
    function markMoved() { userMoved = true; }
    on(W, 'wheel', markMoved, { passive: true });
    on(W, 'touchstart', markMoved, { passive: true });
    on(D, 'keydown', markMoved);

    function place() {
      if (userMoved) return;
      scrollToCard(card, false);
    }
    function isOff() {
      return Math.abs(card.getBoundingClientRect().top - headerH() - 14) > 40;
    }

    // 落地马上定位（瞬时滚动），再补两次校正：首屏图片/字体改变页面高度时兜住
    setTimeout(function () { place(); flashCard(card); }, 80);
    setTimeout(place, 320);
    setTimeout(function () { if (isOff()) place(); }, 760);
    on(W, 'load', function () { setTimeout(place, 60); });

    setTimeout(function () {
      var h3 = card.querySelector('.kp-head h3');
      if (h3) toast('已定位到「' + txt(h3).slice(0, 18) + '」');
    }, 240);
  }

  /* ==================================================================== */
  /* 20. 键盘可达性：Ctrl+K / “/” 打开面板、Esc 关闭、Alt+↑↓ 翻知识点、焦点环 */
  /* ==================================================================== */
  function isTyping(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
  }

  function initKeyboard() {
    // 只在键盘操作时显示焦点环（鼠标点击不显示），body.x-kbd 由 CSS 兜底
    on(D, 'keydown', function (e) {
      if (e.key === 'Tab') D.body.classList.add('x-kbd');
    }, true);
    on(D, 'mousedown', function () { D.body.classList.remove('x-kbd'); }, true);

    on(D, 'keydown', function (e) {
      var typing = isTyping(e.target);
      var k = e.key || '';

      // Ctrl / Cmd + K：命令面板
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (k === 'k' || k === 'K')) {
        e.preventDefault();
        if (api.cmdkIsOpen && api.cmdkIsOpen()) api.cmdkClose();
        else if (api.cmdkOpen) api.cmdkOpen('');
        return;
      }

      // “/”：命令面板（非输入状态）
      if (k === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (api.cmdkOpen) { e.preventDefault(); api.cmdkOpen(''); }
        return;
      }

      // Esc：依次关闭命令面板 / 抽屉 / 清空搜索
      if (k === 'Escape') {
        if (api.cmdkIsOpen && api.cmdkIsOpen()) { api.cmdkClose(); return; }
        if (drawerIsOpen()) { openDrawer(false); return; }
        return;
      }

      // Alt + ↑ / ↓：上一 / 下一知识点
      if (e.altKey && (k === 'ArrowUp' || k === 'ArrowDown')) {
        if (api.cmdkIsOpen && api.cmdkIsOpen()) return;
        var cards = $$('.kp');
        if (!cards.length) return;
        e.preventDefault();
        var cur = typeof api.kpIndex === 'number' ? api.kpIndex : 0;
        var t = clamp(cur + (k === 'ArrowDown' ? 1 : -1), 0, cards.length - 1);
        scrollToCard(cards[t], true);
        return;
      }
    });
  }

  /* ==================================================================== */
  /* 21. 兜底样式：仅当 style.css 还没覆盖契约 §3 的新类时才注入           */
  /*     —— 正常情况（art-director 已给样式）不会注入任何东西              */
  /* ==================================================================== */
  var BASE_ID = 'x-base';

  /* 设计令牌：优先用 style.css 现行变量（--surface/--fg/--cinnabar…），
     同时兼容旧变量名，保证 CSS 迭代期间也不会失色。 */
  var V = 'var(--surface, var(--card, #fffbf2))';
  var V2 = 'var(--surface-2, var(--card, #fffbf2))';
  var LINE = 'var(--line-2, var(--line, #d9c6a6))';
  var FG = 'var(--fg, var(--text, #2d2720))';
  var FG3 = 'var(--fg-3, var(--text-2, #4c4236))';
  var FG5 = 'var(--fg-5, var(--dim, #8a7860))';
  var RED = 'var(--cinnabar, var(--accent, #9d3a2e))';
  var RED3 = 'var(--cinnabar-3, var(--accent-bg, rgba(157,58,46,.08)))';
  var GOLD = 'var(--gold, #b08d57)';
  var FSONG = 'var(--f-song, var(--serif, serif))';
  var FSANS = 'var(--f-sans, var(--sans, sans-serif))';
  var FMONO = 'var(--f-mono, var(--mono, monospace))';
  var R2 = 'var(--r-2, 8px)';
  var R4 = 'var(--r-4, 12px)';

  var CSS_CMDK = [
    '.cmdk{position:fixed;inset:0;z-index:900;display:flex;align-items:flex-start;justify-content:center;',
    'padding:10vh 18px 24px;background:rgba(24,18,12,.46);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}',
    '.cmdk[hidden]{display:none}',
    '.cmdk-box{width:min(680px,100%);max-height:76vh;display:flex;flex-direction:column;overflow:hidden;',
    'background:' + V + ';border:1px solid ' + LINE + ';border-radius:' + R4 + ';box-shadow:0 30px 80px rgba(40,28,14,.36)}',
    '.cmdk-input{flex:0 0 auto;width:100%;border:0;border-bottom:1px solid ' + LINE + ';padding:17px 20px;',
    'background:transparent;color:' + FG + ';outline:none;font:600 16px/1.3 ' + FSONG + '}',
    '.cmdk-input::placeholder{color:' + FG5 + ';font-weight:400}',
    '.cmdk-list{flex:1 1 auto;overflow-y:auto;padding:8px 8px 6px}',
    '.cmdk-item{display:block;padding:9px 12px;border-radius:' + R2 + ';border-left:2px solid transparent;',
    'color:' + FG3 + ';text-decoration:none;cursor:pointer}',
    '.cmdk-item b{display:block;font:600 14.5px/1.45 ' + FSONG + ';color:' + FG + '}',
    '.cmdk-item small{display:block;margin-top:2px;font:12.5px/1.5 ' + FSANS + ';color:' + FG5 + ';',
    'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.cmdk-item.on{background:' + RED3 + ';border-left-color:' + RED + '}',
    '.cmdk-item.on b{color:' + RED + '}',
    '.cmdk mark{background:rgba(201,162,39,.34);color:inherit;border-radius:2px;padding:0 2px}',
    '.cmdk-tag{display:inline-block;font:10px/1 ' + FMONO + ';color:var(--azure, var(--accent-2, #4f7a68));letter-spacing:.06em}',
    '.cmdk-empty{padding:34px 20px;text-align:center;color:' + FG5 + ';font:13.5px/1.7 ' + FSONG + '}',
    '.cmdk-empty b{color:' + RED + '}',
    '.cmdk-hint{flex:0 0 auto;display:flex;gap:14px;align-items:center;padding:9px 16px;',
    'border-top:1px solid ' + LINE + ';background:' + V2 + ';font:11px ' + FSANS + ';color:' + FG5 + '}',
    '.cmdk-hint .x-spacer{flex:1 1 auto}',
    '.cmdk .x-group{padding:10px 12px 4px;font:10px ' + FMONO + ';letter-spacing:.14em;color:var(--azure, #4f7a68)}'
  ].join('');

  var CSS_READBAR = [
    '.read-bar{position:fixed;left:0;top:0;right:0;height:2px;z-index:220;pointer-events:none;background:transparent}',
    '.read-bar > i{display:block;height:100%;width:0;background:linear-gradient(90deg,' + RED + ',' + GOLD + ');',
    'box-shadow:0 0 10px rgba(157,58,46,.45);transition:width .1s linear}'
  ].join('');

  var CSS_TOAST = [
    '.toast{position:fixed;left:50%;bottom:38px;transform:translate(-50%,14px);z-index:950;padding:10px 20px;',
    'border-radius:999px;background:rgba(45,39,32,.93);color:#f8f2e4;font:13px/1.4 ' + FSANS + ';letter-spacing:.04em;',
    'box-shadow:0 14px 34px rgba(30,22,12,.28);opacity:0;pointer-events:none;',
    'transition:opacity .22s ease,transform .26s cubic-bezier(.22,1,.36,1)}',
    '.toast.on{opacity:1;transform:translate(-50%,0)}',
    'html[data-theme="dark"] .toast{background:rgba(240,230,210,.94);color:#201b14}'
  ].join('');

  var CSS_KPNAV = [
    '.kp-nav{position:fixed;right:26px;bottom:88px;z-index:75;display:flex;flex-direction:column;align-items:center;',
    'gap:7px;opacity:0;visibility:hidden;transform:translateY(8px);pointer-events:none;',
    'transition:opacity .24s ease,transform .24s cubic-bezier(.22,1,.36,1),visibility .24s}',
    '.kp-nav.on{opacity:1;visibility:visible;transform:none;pointer-events:auto}',
    '.kp-nav a{display:flex;align-items:center;justify-content:center;width:40px;height:40px;text-decoration:none;',
    'font-family:' + FSONG + ';font-size:15px;color:' + FG3 + ';background:' + V + ';border:1px solid ' + LINE + ';',
    'border-radius:50%;box-shadow:0 4px 14px rgba(40,28,14,.10);transition:all .22s ease}',
    '.kp-nav a:hover{color:#fff8ee;background:' + RED + ';border-color:' + RED + '}',
    '.kp-nav a[aria-disabled="true"]{opacity:.34;pointer-events:none}',
    '.kp-nav .x-num{font:9.5px ' + FMONO + ';color:' + FG5 + ';letter-spacing:.04em;line-height:1}'
  ].join('');

  /* 零特异性补丁：只补 art-director 还没写的结构性细节，任何正常规则都能盖过它。
     用 :where() 保证 specificity = 0，style.css 有对应规则时这里自动失效。 */
  var CSS_MISC = [
    ':where(body.x-lock){overflow:hidden}',
    ':where(.sr-only){position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;',
    'clip:rect(0 0 0 0);white-space:nowrap;border:0}',
    ':where(body.x-kbd) :where(a,button,input,summary,[tabindex]):focus-visible{',
    'outline:2px solid ' + RED + ';outline-offset:2px;border-radius:3px}',
    /* 命令面板条目：第一行「编号胶囊 + 标题」，第二行整行摘要（省略号） */
    ':where(.cmdk-item){text-decoration:none;min-width:0;flex-wrap:wrap;row-gap:1px}',
    ':where(.cmdk-item > .cmdk-tag){flex:none}',
    ':where(.cmdk-item > b){flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    ':where(.cmdk-item > small){flex:0 0 100%;min-width:0;overflow:hidden;text-overflow:ellipsis;',
    'white-space:nowrap;opacity:.62;font-size:11.5px;line-height:1.5}',
    ':where(.cmdk .x-group){padding:9px 12px 3px;font-family:' + FMONO + ';font-size:10px;',
    'letter-spacing:.16em;color:var(--azure, #4f7a68);opacity:.9}',
    ':where(.cmdk-hint kbd){margin-right:2px}',
    ':where(.cmdk mark){color:inherit}',
    ':where(.kp-nav .x-num){text-align:center;pointer-events:none;user-select:none;font:9.5px/1.6 ' + FMONO + ';',
    'color:' + FG3 + ';background:' + V + ';border:1px solid ' + LINE + ';border-radius:999px;padding:0 4px}',
    ':where(.kp-nav a){text-decoration:none}',
    '@media (prefers-reduced-motion:reduce){',
    ':where(.cmdk),:where(.cmdk-box),:where(.toast),:where(.kp-nav),:where(.read-bar > i){transition:none!important;animation:none!important}',
    '}'
  ].join('');
  function cssPos(el) {
    if (!el) return '';
    try { return (W.getComputedStyle(el).position || ''); } catch (e) { return ''; }
  }

  function ensureBaseStyles() {
    if (D.getElementById(BASE_ID)) return;
    var parts = [];
    var cmdk = $('.cmdk');
    if (cmdk && cssPos(cmdk) !== 'fixed') parts.push(CSS_CMDK);
    var rb = $('.read-bar');
    if (rb && cssPos(rb) !== 'fixed') parts.push(CSS_READBAR);
    var ts = $('.toast');
    if (ts && cssPos(ts) !== 'fixed') parts.push(CSS_TOAST);
    var kn = $('.kp-nav');
    if (kn && cssPos(kn) !== 'fixed') parts.push(CSS_KPNAV);
    parts.push(CSS_MISC);   // :where() 零特异性，永远不会盖过 art-director 的规则

    var st = D.createElement('style');
    st.id = BASE_ID;
    st.setAttribute('data-owner', 'app.js-fallback');
    st.appendChild(D.createTextNode(parts.join('\n')));
    D.head.appendChild(st);
    api.usedFallback = parts.length > 1;
  }

  /* ==================================================================== */
  /* 启动                                                                 */
  /* ==================================================================== */
  function safe(name, fn) {
    try { fn(); } catch (e) {
      if (W.console && console.warn) console.warn('[app.js] init(' + name + ') 失败：', e);
    }
  }

  function boot() {
    safe('theme', initTheme);
    safe('code', initCode);
    safe('readbar', initReadBar);
    safe('toast', ensureToast);
    safe('progress', initProgress);
    safe('reveal', initReveal);
    safe('stagger', initStagger);
    safe('scrollui', initScrollUi);
    safe('chrome', initChrome);
    safe('qatools', initQaTools);
    safe('search', initSearch);
    safe('cmdk', initCmdk);
    safe('kpnav', initKpNav);
    safe('cinema', initCinema);
    safe('wow', initWow);
    safe('interactive', initInteractive);
    safe('keyboard', initKeyboard);
    safe('deeplink', initDeepLink);
    safe('basestyles', ensureBaseStyles);

    // 首帧后立刻同步一次滚动相关状态（进度条 / 目录 / 进度轨）
    raf(function () {
      requestTick();
      raf(requestTick);
    });
    // 图片加载改变高度后，长卷与进度条需要重算
    on(W, 'load', requestTick);

    // 验收探针：只读/调试用，不参与任何页面渲染
    api.ctx = CTX;
    api.loops = loops;
    api.indexState = indexState;
    W.__KPX = api;
  }

  if (D.readyState === 'loading') {
    on(D, 'DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
