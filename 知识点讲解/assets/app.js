/* ==========================================================================
   JavaWeb 知识点讲解 · 站点脚本
   全部离线：无 CDN、无外部依赖
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= 1. 离线语法高亮 ======================= */

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

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

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
  // 否则会把标记自身再高亮一遍，生成坏掉的 HTML（旧版就是这个 bug）。
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
          var open = '&lt;' + m[1] + m[2] + '&gt;';
          var openHtml = '<span class="tk-p">&lt;</span><span class="tk-t">' + m[1] + '</span>' +
                         '<span class="tk-a">' + esc(m[2]) + '</span><span class="tk-p">&gt;</span>';
          var inner = m[1] === 'script'
            ? scan(m[3], { lineComment: '//', blockComment: ['/*', '*/'], keywords: KW.js })
            : scan(m[3], { lineComment: '//', blockComment: ['/*', '*/'], keywords: KW.css });
          var closeHtml = '<span class="tk-p">&lt;/</span><span class="tk-t">' + m[1] + '</span><span class="tk-p">&gt;</span>';
          out += openHtml + inner + closeHtml;
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

  /* ======================= 2. 初始化高亮 + 复制 ======================= */
  function initCode() {
    document.querySelectorAll('.code').forEach(function (box) {
      var codeEl = box.querySelector('code');
      if (!codeEl) return;
      var lang = box.getAttribute('data-lang') || 'text';
      var raw = codeEl.textContent;
      codeEl.innerHTML = highlight(raw, lang);

      var btn = box.querySelector('.copy');
      if (btn) {
        btn.addEventListener('click', function () {
          copyText(raw, btn);
        });
      }
    });
  }

  function copyText(text, btn) {
    var done = function () {
      var old = btn.textContent;
      btn.textContent = '已复制';
      btn.classList.add('ok');
      setTimeout(function () { btn.textContent = old; btn.classList.remove('ok'); }, 1400);
    };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { alert('复制失败，请手动选择'); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
  }

  /* ======================= 3. 主题 ======================= */
  function initTheme() {
    var KEY = 'kp-theme';
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (!saved) saved = 'light';
    document.documentElement.setAttribute('data-theme', saved);

    var btn = document.getElementById('theme-btn');
    if (!btn) return;
    var paint = function () {
      btn.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '☾' : '☀';
      btn.title = document.documentElement.getAttribute('data-theme') === 'light' ? '切到深色' : '切到浅色';
    };
    paint();
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      paint();
    });
  }

  /* ======================= 4. 进度 ======================= */
  var PKEY = 'kp-progress-v1';
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {}
  }

  function initProgress(scopePointIds, total) {
    var prog = loadProgress();
    var boxes = document.querySelectorAll('.kp-done input');

    var refresh = function () {
      var doneInPage = 0;
      document.querySelectorAll('.kp').forEach(function (card) {
        var id = card.getAttribute('data-id');
        var cb = card.querySelector('.kp-done input');
        var on = !!(cb && cb.checked);
        card.classList.toggle('done', on);
        if (on) doneInPage++;
        var toc = document.querySelector('.toc a[href="#' + cssEsc(id) + '"]');
        if (toc) {
          var mark = toc.querySelector('.done');
          if (on && !mark) toc.insertAdjacentHTML('beforeend', '<span class="done">✓</span>');
          if (!on && mark) mark.remove();
        }
      });
      // 全局进度
      var allIds = window.KP_ALL_IDS || scopePointIds;
      var totalAll = allIds.length;
      var doneAll = 0;
      for (var k = 0; k < totalAll; k++) if (prog[allIds[k]]) doneAll++;
      var pct = totalAll ? doneAll / totalAll : 0;
      var txt = document.getElementById('prog-txt');
      if (txt) txt.textContent = doneAll + '/' + totalAll;
      var ring = document.querySelector('.ring .fg');
      if (ring) {
        var C = 2 * Math.PI * 12;
        ring.setAttribute('stroke-dasharray', C.toFixed(2));
        ring.setAttribute('stroke-dashoffset', (C * (1 - pct)).toFixed(2));
      }
    };

    boxes.forEach(function (cb) {
      cb.addEventListener('change', function () {
        var card = cb.closest('.kp');
        var id = card.getAttribute('data-id');
        if (cb.checked) prog[id] = 1; else delete prog[id];
        saveProgress(prog);
        refresh();
      });
    });
    refresh();
  }

  function cssEsc(s) { return String(s).replace(/"/g, '\\"'); }

  /* ======================= 5. 目录联动（scrollspy） ======================= */
  function initSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });

    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var cur = null;
      document.querySelectorAll('.kp').forEach(function (c) { if (!cur && visible[c.id]) cur = c.id; });
      if (cur) {
        links.forEach(function (a) { a.classList.remove('on'); });
        if (map[cur]) map[cur].classList.add('on');
      }
    }, { rootMargin: '-88px 0px -60% 0px', threshold: 0 });
    document.querySelectorAll('.kp').forEach(function (c) { io.observe(c); });
  }

  /* ======================= 6. 滚动渐入 ======================= */
  function initReveal() {
    var els = document.querySelectorAll('.rv');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ======================= 7. 移动端抽屉 + 回顶 ======================= */
  function initChrome() {
    var side = document.getElementById('side');
    var mb = document.getElementById('menu-btn');
    var scrim = document.getElementById('scrim');
    var toggle = function (on) {
      if (!side) return;
      side.classList.toggle('open', on);
      if (scrim) scrim.classList.toggle('on', on);
    };
    if (mb) mb.addEventListener('click', function () { toggle(!side.classList.contains('open')); });
    if (scrim) scrim.addEventListener('click', function () { toggle(false); });
    document.querySelectorAll('.toc a, .nav-lab a').forEach(function (a) {
      a.addEventListener('click', function () { if (window.innerWidth <= 1080) toggle(false); });
    });

    var tb = document.getElementById('top-btn');
    if (tb) {
      tb.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      window.addEventListener('scroll', function () {
        tb.classList.toggle('on', window.scrollY > 700);
      }, { passive: true });
    }
  }

  /* ======================= 8. 搜索（索引按需加载） ======================= */
  function initSearch() {
    var input = document.getElementById('search');
    if (!input) return;
    var box = document.getElementById('hits');
    var home = document.getElementById('home-body');
    var loaded = !!window.KP_INDEX;
    var pending = false;

    // 525KB 的全文索引：只有真的要搜了才加载，不拖慢页面
    function ensureIndex(cb) {
      if (loaded) return cb();
      if (pending) return;
      pending = true;
      var s = document.createElement('script');
      s.src = 'assets/search-index.js';
      s.onload = function () { loaded = true; pending = false; cb(); };
      s.onerror = function () {
        pending = false;
        box.innerHTML = '<div class="empty">搜索索引加载失败，请确认 <code>assets/search-index.js</code> 与本页在同一目录下。</div>';
        box.classList.add('on');
      };
      document.head.appendChild(s);
    }

    var render = function (q) {
      q = (q || '').trim().toLowerCase();
      if (!q) {
        box.classList.remove('on');
        box.innerHTML = '';
        if (home) home.style.display = '';
        return;
      }
      ensureIndex(function () { paint(q); });
    };

    var paint = function (q) {
      if (home) home.style.display = 'none';
      if (!window.KP_INDEX) return;
      var hits = window.KP_INDEX.filter(function (it) {
        return (it.name + ' ' + it.lab + ' ' + it.text).toLowerCase().indexOf(q) >= 0;
      });
      var shown = hits.slice(0, 50);

      if (!hits.length) {
        box.innerHTML = '<div class="empty">没有匹配的知识点，换个词试试（比如 <b>v-model</b>、<b>跨域</b>、<b>Result</b>）</div>';
        box.classList.add('on');
        return;
      }
      box.innerHTML = '<div class="sec-title"><span class="bar"></span><h2>找到 ' + hits.length +
        ' 个知识点' + (hits.length > shown.length ? '（显示前 ' + shown.length + ' 个）' : '') + '</h2></div>' +
        shown.map(function (it) {
          var i = it.text.toLowerCase().indexOf(q);
          var text = i >= 0
            ? (i > 40 ? '…' : '') + it.text.slice(Math.max(0, i - 40), i + 100) + '…'
            : it.text.slice(0, 120) + '…';
          return '<a class="hit" href="' + it.file + '#' + it.id + '">' +
            '<div class="h-top"><span class="h-lab">实训' + it.lab + ' · ' + it.labName + '</span>' +
            '<span class="h-num">' + it.num + '</span></div>' +
            '<h4>' + hl(it.name, q) + '</h4>' +
            '<p>' + hl(text, q) + '</p></a>';
        }).join('');
      box.classList.add('on');
    };

    var hl = function (s, q) {
      var out = '', low = s.toLowerCase(), from = 0, i;
      while ((i = low.indexOf(q, from)) >= 0) {
        out += esc(s.slice(from, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>';
        from = i + q.length;
      }
      return out + esc(s.slice(from));
    };
    var esc = function (s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    var t = null;
    input.addEventListener('focus', function () { ensureIndex(function () {}); });
    input.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { render(input.value); }, 130);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; render(''); input.blur(); }
      if (e.key === 'Enter') {
        var first = box.querySelector('.hit');
        if (first) location.href = first.getAttribute('href');
      }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); input.focus(); }
    });
  }

  /* ======================= 9. 自测答案 一键展开/收起 ======================= */
  function initQaTools() {
    var all = function (open) {
      document.querySelectorAll('details.qa').forEach(function (d) { d.open = open; });
    };
    var o = document.getElementById('qa-open');
    var c = document.getElementById('qa-close');
    if (o) o.addEventListener('click', function () { all(true); });
    if (c) c.addEventListener('click', function () { all(false); });
  }

  /* ======================= 10. 电影感：视差 / 长卷 / 数字 ======================= */
  function initCinema() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var bg = document.querySelector('.cine-bg img');
    var frame = document.querySelector('.cine-scroll-frame');
    var pan = document.getElementById('pan');
    var panImg = document.querySelector('.pan-img');
    var panBar = document.querySelector('.pan-bar i');
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.pageYOffset || document.documentElement.scrollTop;
        if (bg && !reduce && y < window.innerHeight * 1.6) {
          bg.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0) scale(1.05)';
        }
        if (frame && !reduce && y < window.innerHeight * 1.6) {
          frame.style.transform = 'translate3d(0,' + (y * -0.05).toFixed(1) + 'px,0)';
        }
        if (pan && panImg) {
          var r = pan.getBoundingClientRect();
          var total = pan.offsetHeight - window.innerHeight;
          var prog = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
          var max = Math.max(0, panImg.offsetWidth - window.innerWidth + 80);
          panImg.style.transform = 'translate3d(' + (-prog * max).toFixed(1) + 'px,0,0)';
          if (panBar) panBar.style.width = (prog * 100).toFixed(2) + '%';
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    var stats = document.querySelectorAll('.cine-hero .home-stats b');
    if (stats.length && !reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          var target = parseInt(el.textContent, 10) || 0;
          var t0 = null;
          var step = function (t) {
            if (!t0) t0 = t;
            var k = Math.min(1, (t - t0) / 1100);
            el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        });
      }, { threshold: 0.6 });
      stats.forEach(function (s) { io.observe(s); });
    }
  }

  /* ======================= 11. 震撼细节：逐字 / 花瓣 / 墨粒子 / 进度轨 ======================= */
  function initWow() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var titles = document.querySelectorAll('.hero-title, .lab-hero h1');
    if (!reduce) {
      titles.forEach(function (h) {
        var chars = [];
        (function walk(node) {
          Array.prototype.slice.call(node.childNodes).forEach(function (n) {
            if (n.nodeType === 3) {
              var frag = document.createDocumentFragment();
              n.textContent.split('').forEach(function (ch) {
                var s = document.createElement('span');
                s.className = 'ch';
                s.textContent = ch;
                frag.appendChild(s);
                chars.push(s);
              });
              node.replaceChild(frag, n);
            } else if (n.nodeType === 1) {
              walk(n);
            }
          });
        })(h);
        chars.forEach(function (c, i) { c.style.animationDelay = (120 + i * 45) + 'ms'; });
      });
    }

    var petals = document.getElementById('petals');
    if (petals && !reduce) {
      for (var i = 0; i < 14; i++) {
        var p = document.createElement('span');
        p.className = 'petal';
        var size = 6 + Math.random() * 8;
        p.style.width = p.style.height = size + 'px';
        p.style.left = (Math.random() * 100) + '%';
        p.style.animationDuration = (12 + Math.random() * 14) + 's';
        p.style.animationDelay = (-Math.random() * 20) + 's';
        p.style.opacity = (0.22 + Math.random() * 0.32).toFixed(2);
        petals.appendChild(p);
      }
    }

    var cv = document.getElementById('ink-canvas');
    if (cv && !reduce) {
      var ctx = cv.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = 0, H = 0, dots = [];
      var resize = function () {
        var host = cv.parentElement;
        W = host.clientWidth;
        H = host.clientHeight;
        cv.width = W * dpr;
        cv.height = H * dpr;
        cv.style.width = W + 'px';
        cv.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dots = [];
        for (var k = 0; k < 46; k++) {
          dots.push({
            x: Math.random() * W, y: Math.random() * H,
            r: 0.6 + Math.random() * 1.8,
            vy: 0.08 + Math.random() * 0.22,
            vx: -0.06 + Math.random() * 0.12,
            a: 0.03 + Math.random() * 0.05
          });
        }
      };
      var frame = function () {
        ctx.clearRect(0, 0, W, H);
        dots.forEach(function (d) {
          d.y -= d.vy;
          d.x += d.vx;
          if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W; }
          if (d.x < -4) d.x = W + 4;
          if (d.x > W + 4) d.x = -4;
          ctx.beginPath();
          ctx.fillStyle = 'rgba(74,56,33,' + d.a + ')';
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        });
        requestAnimationFrame(frame);
      };
      resize();
      frame();
      window.addEventListener('resize', resize);
    }

    var rail = document.querySelector('.scroll-rail i');
    var railUpdate = function () {
      if (!rail) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      rail.style.height = (max > 0 ? Math.min(1, window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', railUpdate, { passive: true });
    window.addEventListener('resize', railUpdate);
    railUpdate();
  }

  /* ======================= 12. 动态交互：涟漪 / 倾斜 / 视差 / 转场 ======================= */
  function initInteractive() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduce && 'PointerEvent' in window) {
      document.querySelectorAll('.lab-card').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = 'perspective(900px) rotateY(' + (px * 6).toFixed(2) +
            'deg) rotateX(' + (-py * 6).toFixed(2) + 'deg) translateY(-6px)';
        });
        card.addEventListener('pointerleave', function () { card.style.transform = ''; });
      });
    }

    var hero = document.querySelector('.cine-hero');
    var scrollFig = document.querySelector('.cine-scroll');
    var plum = document.querySelector('.cine-plum');
    if (hero && scrollFig && !reduce) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        scrollFig.style.transform = 'translate3d(' + (px * 10).toFixed(1) + 'px,' + (py * 8).toFixed(1) + 'px,0)';
        if (plum) plum.style.transform = 'translate3d(' + (-px * 14).toFixed(1) + 'px,' + (-py * 10).toFixed(1) + 'px,0)';
      });
      hero.addEventListener('pointerleave', function () {
        scrollFig.style.transform = '';
        if (plum) plum.style.transform = '';
      });
    }

    var rc = document.getElementById('ripple-canvas');
    if (rc && !reduce) {
      var ctx = rc.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = 0, H = 0, ripples = [], last = 0;
      var resize = function () {
        var host = rc.parentElement;
        W = host.clientWidth;
        H = host.clientHeight;
        rc.width = W * dpr;
        rc.height = H * dpr;
        rc.style.width = W + 'px';
        rc.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);
      var addRipple = function (x, y) {
        if (ripples.length > 18) ripples.shift();
        ripples.push({ x: x, y: y, r: 3, a: 0.7, max: 140 + Math.random() * 90 });
      };
      if (hero) {
        hero.addEventListener('pointermove', function (e) {
          var r = rc.getBoundingClientRect();
          var now = performance.now();
          if (now - last < 45) return;
          last = now;
          addRipple(e.clientX - r.left, e.clientY - r.top);
        });
      }
      (function loop() {
        ctx.clearRect(0, 0, W, H);
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
        requestAnimationFrame(loop);
      })();
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|javascript:)/.test(href)) return;
      if (!/\.html(\?|#|$)/.test(href)) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function () { window.location.href = href; }, 280);
    });
    window.addEventListener('pageshow', function () {
      document.body.classList.remove('leaving');
    });
  }

  /* ======================= 启动 ======================= */
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initCode();
    initReveal();
    initChrome();
    initSearch();
    initSpy();
    initQaTools();
    initCinema();
    initWow();
    initInteractive();
    var ids = (window.KP_PAGE_IDS || []);
    initProgress(ids, ids.length);
  });
})();
