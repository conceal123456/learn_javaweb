# -*- coding: utf-8 -*-
"""
JavaWeb 知识点讲解 · 站点生成器（正式版）

用法（在仓库根目录执行，一条命令重建全站）：

    python 知识点讲解/_build/build_site.py

输入：
    实训N_*/知识点精讲_实训N.md      ← 内容源，只读，不改内容
    _build/src/css/*.css              ← 样式源（按文件名顺序拼接）
    assets/art/**                     ← 公有领域中国画（本地）
输出：
    知识点讲解/index.html
    知识点讲解/实训1.html … 实训7.html
    知识点讲解/assets/style.css       ← 由 src/css/*.css 拼接
    知识点讲解/assets/ids.js
    知识点讲解/assets/search-index.js

注意：assets/app.js 不由本脚本生成（动效脚本单独维护）。
"""

import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent        # 知识点讲解/_build
OUT = HERE.parent                             # 知识点讲解
ROOT = OUT.parent                             # 仓库根
ASSETS = OUT / "assets"
CSS_DIR = HERE / "src" / "css"

# ------------------------------------------------------------------ 内容源
SOURCES = [
    ("01", r"实训1_软件安装及创建Vue项目\知识点精讲_实训1.md", "创建 Vue 项目", "搭工程、目录骨架、入口三件套"),
    ("02", r"实训2_Vue基本语法\知识点精讲_实训2.md", "Vue 基本语法", "插值、响应式、7 个指令、生命周期"),
    ("03", r"实训3_前端ElementPlus框架\知识点精讲_实训3.md", "Element Plus", "装组件库、中文包、图标全局注册"),
    ("04", r"实训4_Element-Plus组件的使用\知识点精讲_实训4.md", "Element Plus 组件", "输入、选择、图片、轮播、表格、分页"),
    ("05", r"实训5_Vue-Router实现路由跳转\知识点精讲_实训5.md", "Vue-Router 路由", "跳转、传参、嵌套、守卫"),
    ("06", r"实训6_后台管理页面\知识点精讲_实训6.md", "后台管理页面", "flex 布局、菜单、嵌套路由落地"),
    ("07", r"实训7_新建SpringBoot项目\知识点精讲_实训7.md", "SpringBoot 后端", "建工程、连库、统一返回、全局异常"),
]
LAB_DIR = {
    "01": r"实训1_软件安装及创建Vue项目",
    "02": r"实训2_Vue基本语法",
    "03": r"实训3_前端ElementPlus框架",
    "04": r"实训4_Element-Plus组件的使用",
    "05": r"实训5_Vue-Router实现路由跳转",
    "06": r"实训6_后台管理页面",
    "07": r"实训7_新建SpringBoot项目",
}
LAB_CN = {"01": "壹", "02": "贰", "03": "叁", "04": "肆", "05": "伍", "06": "陆", "07": "柒"}
LAB_STAGE = {"01": "前端 · 环境", "02": "前端 · 语法", "03": "前端 · 组件库", "04": "前端 · 组件",
             "05": "前端 · 路由", "06": "前端 · 综合", "07": "后端 · SpringBoot"}

BLOCK_KEYS = "①②③④⑤⑥⑦"
BLOCK_NAMES = "讲义怎么说|一句话讲透|示例代码|逐行拆解|在你仓库里|常见坑|自测"
BLOCK_RE = re.compile(r"^\*\*(?:([" + BLOCK_KEYS + r"])\s*)?(" + BLOCK_NAMES + r")\*\*\s*(.*)$")
NAME2KEY = {"讲义怎么说": "①", "一句话讲透": "②", "示例代码": "③", "逐行拆解": "④",
            "在你仓库里": "⑤", "常见坑": "⑥", "自测": "⑦"}

# 每讲配一幅馆藏中国画（克利夫兰艺术博物馆，公有领域）
LAB_ART = {
    "01": "front-1.jpg", "02": "front-2.jpg", "03": "front-3.jpg", "04": "front-4.jpg",
    "05": "front-5.jpg", "06": "front-6.jpg", "07": "back-1.jpg",
}
ART_CAPTION = "馆藏中国画 · 克利夫兰艺术博物馆（公有领域）"
FRONT_SET = ["front-1.jpg", "front-2.jpg", "front-3.jpg", "front-4.jpg", "front-5.jpg", "front-6.jpg"]
BACK_SET = ["back-1.jpg", "back-2.jpg", "back-3.jpg"]

# 七块的"人话"名字（与页脚说明一致）
BLOCK_DISPLAY = {
    "讲义怎么说": "讲义要点",
    "一句话讲透": "核心讲解",
    "示例代码": "示例演示",
    "逐行拆解": "代码解读",
    "在你仓库里": "工程对照",
    "常见坑": "易错提醒",
    "自测": "课堂思考",
}
BLOCK_DESC = {
    "①":  "这一讲老师到底要求什么",
    "②":  "先弄懂「为什么」，再进代码",
    "③":  "整段可运行的示例，复制即用",
    "④":  "逐行拆开，知道每一句在干嘛",
    "⑤":  "真实文件与行号，对着工程核对",
    "⑥":  "最容易踩的坑，先自己踩一遍",
    "⑦":  "先独立作答，再点开参考解析",
}


# ================================================================== 行内解析
def inline(text: str) -> str:
    """转义 HTML 后处理 行内代码 / 粗体 / 链接。

    注意 \\| 必须先换成占位符 \\x01，否则表格切分会把它当列分隔符，
    且行内代码里的 `netstat \\| findstr` 会保留多余的反斜杠。
    其它反斜杠一律不动——\\. \\_ \\s 这些是 Windows 路径和代码内容。
    """
    t = text.replace("\\|", "\x01")
    t = html.escape(t, quote=False)
    stash = []

    def keep(m):
        stash.append(m.group(1))
        return f"\x00{len(stash) - 1}\x00"

    t = re.sub(r"`([^`]+)`", keep, t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    t = t.replace("\\`", "`")

    def restore(m):
        inner = stash[int(m.group(1))].replace("\x01", "|").replace("\\`", "`")
        return f"<code>{inner}</code>"

    t = re.sub(r"\x00(\d+)\x00", restore, t)
    return t.replace("\x01", "|")


def split_row(line: str):
    """按未被转义的 | 切单元格。"""
    s = line.strip().replace("\\|", "\x01")
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    return [c.strip().replace("\x01", "\\|") for c in s.split("|")]


# ================================================================== 轻量语法高亮
# 构建期就把代码染色，页面不依赖 app.js 也能有颜色（app.js 若再染一次，结果等价）。
# 输出必须是"textContent 与原文完全一致"的，所以只插入 <span>，不改任何字符。

KW_JS = set(("const let var function return if else for while do break continue new class extends "
             "import export from default async await try catch finally throw typeof instanceof in of "
             "null undefined true false this super delete void yield static get set").split())
KW_JAVA = set(("public private protected class interface extends implements new return if else for while do "
               "break continue static final void int long double float boolean char byte short String "
               "throw throws try catch finally import package this super null true false abstract "
               "synchronized volatile transient instanceof enum record var").split())
KW_BASH = set(("cd ls npm npx node git mvn java curl echo export set powershell chcp start taskkill netstat "
               "findstr mvnw soffice").split())
KW_SQL = set(("select from where insert into values update set delete create table database drop alter "
              "primary key not null default varchar int datetime").split())
KW_CSS = set(("display flex grid position absolute relative fixed sticky margin padding border background "
              "color width height font size weight align items justify content gap top left right bottom "
              "overflow transform transition").split())

_ESC_TABLE = {"&": "&amp;", "<": "&lt;", ">": "&gt;"}


def esc(s):
    return "".join(_ESC_TABLE.get(ch, ch) for ch in s)


_STR = r'"(?:[^"\\\n]|\\.)*"?|\'(?:[^\'\\\n]|\\.)*\'?|`(?:[^`\\]|\\.)*`?'
_NUM = r"(?<![A-Za-z_$])[0-9][0-9a-fA-FxX._]*"
_ID = r"[A-Za-z_$\u4e00-\u9fa5][A-Za-z0-9_$\u4e00-\u9fa5]*"
_ATTR = re.compile(r"(\s+)([A-Za-z_:@#][\w:.\-]*)(\s*=\s*)?(\"[^\"]*\"|'[^']*'|[^\s>]+)?")
_TPL = re.compile(r"\{\{([\s\S]*?)\}\}")
_SCRIPT = re.compile(r"<(script|style)([^>]*)>([\s\S]*?)</\1>")
_MARKUP = re.compile(r"<!--[\s\S]*?(?:-->|\Z)|<(/?)([A-Za-z][\w:-]*)((?:[^>\"']|\"[^\"]*\"|'[^']*')*?)(/?)>")
_PLAIN = re.compile(r"\{\{[\s\S]*?\}\}|<!--[\s\S]*?(?:-->|\Z)|<[A-Za-z/!][^>]*>")


def _scan_plain(code, lc, bc, kwset):
    """通用扫描：注释 > 字符串 > 数字 > 标识符 > 原样。"""
    pats = []
    if lc:
        pats.append("(?P<c1>" + re.escape(lc) + r"[^\n]*)")
    if bc:
        pats.append("(?P<c2>" + re.escape(bc[0]) + r"[\s\S]*?(?:" + re.escape(bc[1]) + r"|\Z))")
    pats.append("(?P<s>" + _STR + ")")
    pats.append("(?P<n>" + _NUM + ")")
    pats.append("(?P<id>" + _ID + ")")
    rx = re.compile("|".join(pats))
    out = []
    last = 0
    for m in rx.finditer(code):
        if m.start() > last:
            out.append(esc(code[last:m.start()]))
        g = m.lastgroup
        txt = m.group(0)
        if g in ("c1", "c2"):
            out.append('<span class="tk-c">' + esc(txt) + "</span>")
        elif g == "s":
            out.append('<span class="tk-s">' + esc(txt) + "</span>")
        elif g == "n":
            out.append('<span class="tk-n">' + esc(txt) + "</span>")
        elif g == "id":
            if txt in kwset:
                out.append('<span class="tk-k">' + esc(txt) + "</span>")
            elif code[m.end():m.end() + 1] == "(" or re.match(r"\s*\(", code[m.end():m.end() + 6] or ""):
                out.append('<span class="tk-f">' + esc(txt) + "</span>")
            else:
                out.append(esc(txt))
        last = m.end()
    out.append(esc(code[last:]))
    return "".join(out)


def _scan_attrs(s):
    out = []
    last = 0
    for m in _ATTR.finditer(s):
        out.append(esc(s[last:m.start()]))
        out.append(esc(m.group(1)))
        out.append('<span class="tk-a">' + esc(m.group(2)) + "</span>")
        if m.group(3):
            out.append(esc(m.group(3)))
            val = m.group(4)
            if val:
                if val[0] in "\"'":
                    out.append('<span class="tk-s">' + esc(val) + "</span>")
                else:
                    out.append('<span class="tk-n">' + esc(val) + "</span>")
        last = m.end()
    out.append(esc(s[last:]))
    return "".join(out)


def _scan_markup(code, depth=0):
    out = []
    pos = 0
    for m in _PLAIN.finditer(code):
        out.append(esc(code[pos:m.start()]))
        g = m.group(0)
        if g.startswith("{{"):
            inner = g[2:-2]
            out.append('<span class="tk-p">{{</span><span class="tk-n">' + esc(inner) +
                       '</span><span class="tk-p">}}</span>')
        elif g.startswith("<!--"):
            out.append('<span class="tk-c">' + esc(g) + "</span>")
        else:
            tm = _MARKUP.match(g)
            if not tm:
                out.append(esc(g))
            else:
                closing, tag, attrs, selfc = tm.group(1), tm.group(2), tm.group(3), tm.group(4)
                out.append('<span class="tk-p">&lt;' + ("/" if closing else "") + "</span>")
                out.append('<span class="tk-t">' + esc(tag) + "</span>")
                out.append(_scan_attrs(attrs or ""))
                if selfc:
                    out.append('<span class="tk-p">/</span>')
                out.append('<span class="tk-p">&gt;</span>')
        pos = m.end()
    out.append(esc(code[pos:]))
    return "".join(out)


def _scan_vue(code):
    out = []
    pos = 0
    for m in _SCRIPT.finditer(code):
        out.append(_scan_markup(code[pos:m.start()]))
        name, attrs, inner = m.group(1), m.group(2), m.group(3)
        out.append('<span class="tk-p">&lt;</span><span class="tk-t">' + name + "</span>")
        out.append(_scan_attrs(attrs or ""))
        out.append('<span class="tk-p">&gt;</span>')
        if name == "script":
            out.append(_scan_plain(inner, "//", ("/*", "*/"), KW_JS))
        else:
            out.append(_scan_plain(inner, None, ("/*", "*/"), KW_CSS))
        out.append('<span class="tk-p">&lt;/</span><span class="tk-t">' + name +
                   '</span><span class="tk-p">&gt;</span>')
        pos = m.end()
    out.append(_scan_markup(code[pos:]))
    return "".join(out)


def highlight(code, lang):
    lang = (lang or "text").strip().lower()
    if lang in ("vue",):
        return _scan_vue(code)
    if lang in ("html", "xml", "wxml"):
        return _scan_markup(code)
    if lang in ("js", "javascript", "json", "jsx", "ts", "typescript"):
        return _scan_plain(code, "//", ("/*", "*/"), KW_JS)
    if lang == "java":
        return _scan_plain(code, "//", ("/*", "*/"), KW_JAVA)
    if lang == "css":
        return _scan_plain(code, None, ("/*", "*/"), KW_CSS)
    if lang in ("bash", "sh", "shell", "powershell", "ps1", "bat", "cmd", "zsh"):
        return _scan_plain(code, "#", None, KW_BASH)
    if lang in ("yml", "yaml", "properties", "ini", "conf"):
        return _scan_plain(code, "#", None, set())
    if lang == "sql":
        return _scan_plain(code, "--", ("/*", "*/"), KW_SQL)
    return esc(code)


# ---------------------------------------------------------------- 代码块外壳
HIGHLIGHT_FAILS = []


def _plain(frag):
    return html.unescape(re.sub(r"<[^>]+>", "", frag))


def render_code(lang, code, with_ln=True):
    """代码块：语言胶囊 + 复制 + 行号槽 + 染色的 pre。"""
    n = code.count("\n") + 1
    body = highlight(code, lang)
    # 硬保证：染色不改变一个字符
    if _plain(body) != code:
        HIGHLIGHT_FAILS.append((lang, code[:40]))
        body = esc(code)
    ln = ""
    if with_ln:
        nums = "\n".join(str(i) for i in range(1, n + 1))
        ln = f'<div class="code-ln" aria-hidden="true">{nums}</div>'
    return (
        f'<div class="code" data-lang="{html.escape(lang)}" data-lines="{n}">'
        f'<div class="code-bar"><span class="code-lang">{html.escape(lang)}</span>'
        f'<span class="code-count">{n} 行</span>'
        f'<button class="copy" type="button">复制</button></div>'
        f'<div class="code-body">{ln}<pre><code>{body}</code></pre></div></div>'
    )


# ================================================================== 块解析
def parse_blocks(lines):
    """把一个知识点内部的行解析成块序列。"""
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]

        m = BLOCK_RE.match(line.strip())
        if m:
            key = m.group(1) or NAME2KEY.get(m.group(2).strip(), "")
            name, rest = m.group(2).strip(), m.group(3).strip()
            rest = re.sub(r"^[——:：\s]+", "", rest)
            body = [rest] if rest else []
            i += 1
            while i < n:
                if BLOCK_RE.match(lines[i].strip()):
                    break
                body.append(lines[i])
                i += 1
            out.append(("block", key, name, render_body(body)))
            continue

        if line.startswith("```"):
            lang = line[3:].strip() or "text"
            i += 1
            buf = []
            while i < n and not lines[i].startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            out.append(("code", lang, "\n".join(buf)))
            continue

        if line.strip().startswith("<details>"):
            first = line.strip()[len("<details>"):].strip()
            i += 1
            buf = [first] if first else []
            while i < n and "</details>" not in lines[i]:
                buf.append(lines[i])
                i += 1
            i += 1
            inner = "\n".join(buf)
            m2 = re.search(r"<summary>(.*?)</summary>", inner)
            label = m2.group(1).strip() if m2 else "展开解析"
            inner = re.sub(r"<summary>.*?</summary>", "", inner, flags=re.S).strip()
            out.append(("details", label, render_body(inner.split("\n"))))
            continue

        if line.strip().startswith("|") and i + 1 < n and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            head = split_row(line)
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            out.append(("table", head, rows))
            continue

        if re.match(r"^\s*[-*]\s*\[[ x]\]", line):
            items = []
            while i < n and re.match(r"^\s*[-*]\s*\[[ x]\]", lines[i]):
                items.append(re.sub(r"^\s*[-*]\s*\[[ x]\]\s*", "", lines[i]))
                i += 1
            out.append(("checklist", items))
            continue

        if re.match(r"^\s*[-*]\s+\S", line):
            items = []
            while i < n and re.match(r"^\s*[-*]\s+\S", lines[i]) and not re.match(r"^\s*[-*]\s*\[[ x]\]", lines[i]):
                cur = re.sub(r"^\s*[-*]\s+", "", lines[i])
                i += 1
                while i < n and lines[i].startswith("  ") and lines[i].strip() and not re.match(r"^\s*[-*]\s+\S", lines[i]):
                    cur += " " + lines[i].strip()
                    i += 1
                items.append(cur)
            out.append(("ul", items))
            continue

        if re.match(r"^\s*\d+\.\s+\S", line):
            items = []
            while i < n and re.match(r"^\s*\d+\.\s+\S", lines[i]):
                items.append(re.sub(r"^\s*\d+\.\s+", "", lines[i]))
                i += 1
            out.append(("ol", items))
            continue

        if line.strip().startswith(">"):
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip())
                i += 1
            out.append(("quote", buf))
            continue

        if line.strip() in ("---", "***", "___"):
            out.append(("hr",))
            i += 1
            continue

        if not line.strip():
            i += 1
            continue

        buf = [line.strip()]
        i += 1
        while i < n and lines[i].strip() and not re.match(
            r"^\s*([-*]\s|\d+\.\s|```|\||>|<details>|#{1,6}\s|---$)", lines[i]
        ) and not BLOCK_RE.match(lines[i].strip()):
            buf.append(lines[i].strip())
            i += 1
        out.append(("p", " ".join(buf)))
    return out


def render_body(lines):
    """把块序列渲染成 HTML。"""
    blocks = parse_blocks(lines)
    parts = []
    for b in blocks:
        kind = b[0]
        if kind == "code":
            parts.append(render_code(b[1], b[2]))
        elif kind == "table":
            head, rows = b[1], b[2]
            th = "".join(f"<th>{inline(c)}</th>" for c in head)
            trs = "".join(
                "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows
            )
            parts.append(
                f'<div class="tw"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>'
            )
        elif kind == "ul":
            parts.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in b[1]) + "</ul>")
        elif kind == "ol":
            parts.append("<ol>" + "".join(f"<li>{inline(x)}</li>" for x in b[1]) + "</ol>")
        elif kind == "checklist":
            lis = "".join(f'<li class="tick"><span class="box"></span>{inline(x)}</li>' for x in b[1])
            parts.append(f'<ul class="checklist">{lis}</ul>')
        elif kind == "quote":
            parts.append("<blockquote>" + "<br>".join(inline(x) for x in b[1]) + "</blockquote>")
        elif kind == "details":
            parts.append(
                f'<details class="qa"><summary>{inline(b[1])}</summary>'
                f'<div class="qa-body">{b[2]}</div></details>'
            )
        elif kind == "hr":
            parts.append("<hr>")
        elif kind == "p":
            parts.append(f"<p>{inline(b[1])}</p>")
        elif kind == "block":
            parts.append(f'<div class="inner-block">{b[3]}</div>')
    return "".join(parts)


# ================================================================== 文档解析
def parse_doc(path: Path):
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")

    doc = {"title": "", "meta": [], "sections": [], "points": []}
    cur = None
    cur_point = None
    i, n = 0, len(lines)

    while i < n:
        line = lines[i]

        if line.startswith("# ") and not doc["title"]:
            doc["title"] = line[2:].strip()
            i += 1
            continue

        if line.startswith("### "):
            cur_point = {"title": line[4:].strip(), "lines": []}
            doc["points"].append(cur_point)
            i += 1
            continue

        if line.startswith("## "):
            cur = {"title": line[3:].strip(), "lines": []}
            doc["sections"].append(cur)
            cur_point = None
            i += 1
            continue

        if line.strip().startswith(">") and not doc["sections"]:
            doc["meta"].append(line.strip().lstrip(">").strip())
            i += 1
            continue

        if cur_point is not None:
            cur_point["lines"].append(line)
        elif cur is not None:
            cur["lines"].append(line)
        i += 1

    return doc


def strip_html(s):
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", s).strip()


def build():
    labs = []
    for lid, rel, short, blurb in SOURCES:
        doc = parse_doc(ROOT / rel)
        points = []
        for idx, pt in enumerate(doc["points"], 1):
            m = re.match(r"^([\d.]+)\s+(.*)$", pt["title"])
            num, name = (m.group(1), m.group(2)) if m else ("", pt["title"])
            name = re.sub(r"`([^`]+)`", r"\1", name)
            blocks = [b for b in parse_blocks(pt["lines"]) if b[0] == "block"]
            points.append({"num": num, "name": name, "blocks": blocks, "id": f"kp-{lid}-{idx}"})

        sections = [{"title": s["title"], "html": render_body(s["lines"])} for s in doc["sections"]]

        # 统计：只数「知识点内」的代码块与折叠问答（与历史口径一致：232 / 109）
        n_code = n_qa = 0
        chars = 0
        for s in sections:
            chars += len(strip_html(s["html"]))
        for p in points:
            for b in p["blocks"]:
                n_code += b[3].count('class="code"')
                n_qa += b[3].count('class="qa"')
                chars += len(strip_html(b[3]))

        labs.append({
            "id": lid, "short": short, "blurb": blurb,
            "file": f"实训{lid.lstrip('0')}.html",
            "title": doc["title"], "meta": doc["meta"],
            "points": points, "sections": sections,
            "count": len(points), "code": n_code, "qa": n_qa,
            "chars": chars,
            "minutes": max(1, round(chars / 460)),
            "cn": LAB_CN[lid], "stage": LAB_STAGE[lid],
            "dir": LAB_DIR[lid],
        })
    return labs


def companions(lab):
    """列出本讲目录下其它可跳转的 md 文档（存在才渲染，保证 0 断链）。"""
    d = ROOT / lab["dir"]
    if not d.is_dir():
        return []
    out = []
    for f in sorted(d.glob("*.md")):
        if f.name.startswith("知识点精讲"):
            continue
        label = f.stem.split("_")[0].replace("-", " ").strip()
        if label not in [x[0] for x in out]:
            out.append((label, f))
    return out[:4]


# ================================================================== 样式拼接
def build_css():
    parts = sorted(CSS_DIR.glob("*.css"))
    if not parts:
        return 0
    banner = (
        "/* ==========================================================================\n"
        "   JavaWeb 知识点讲解 · 样式表\n"
        "   本文件由 知识点讲解/_build/build_site.py 从 _build/src/css/*.css 拼接生成。\n"
        "   请勿直接修改本文件：改 src/css/ 下的分片后重新运行生成器。\n"
        "   ========================================================================== */\n"
    )
    # utf-8-sig + 去零宽 BOM：分片若被编辑器存成「UTF-8 with BOM」，
    # 拼接到中间会变成非法字符，浏览器会把紧随其后的整条规则丢掉（踩过一次）。
    body = "\n\n".join(
        p.read_text(encoding="utf-8-sig").lstrip("\ufeff") for p in parts
    )
    body = body.replace("\ufeff", "")
    text = banner + body
    (ASSETS / "style.css").write_text(text, encoding="utf-8")
    return len(text)


# ================================================================== 页面骨架
def render_top(active_lab, labs, page_title, hero=""):
    nav = []
    for l in labs:
        on = " on" if l["id"] == active_lab else ""
        nav.append(
            f'<a class="{on.strip()}" href="{l["file"]}"><span class="k">{l["id"].lstrip("0")}</span>'
            f'<span>{html.escape(l["short"])}</span><span class="n">{l["count"]}</span></a>'
        )

    total = sum(l["count"] for l in labs)
    total_code = sum(l["code"] for l in labs)
    total_qa = sum(l["qa"] for l in labs)
    cur = next((l for l in labs if l["id"] == active_lab), None)
    if cur:
        st_seal, st_main = cur["cn"], f'实训 {cur["id"].lstrip("0")} · {html.escape(cur["short"])}'
        st_sub = f'{cur["count"]} 个知识点 · {cur["code"]} 段代码 · 约 {cur["minutes"]} 分钟'
    else:
        st_seal, st_main = "七", "JavaWeb 知识点讲解"
        st_sub = f'7 讲 · {total} 个知识点 · {total_code} 段代码'

    return f"""<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(page_title)}</title>
<meta name="description" content="JavaWeb 实训 1~7 知识点精讲：{total} 个知识点、{total_code} 段代码、{total_qa} 道课堂自测，完全离线可用。">
<meta name="color-scheme" content="light">
<link rel="icon" href="data:,">
<link rel="stylesheet" href="assets/style.css">
<noscript><style>
/* 禁 JS / app.js 加载失败时：正文必须可见，纯 JS 组件隐藏 */
.rv{{opacity:1 !important; translate:none !important; transform:none !important}}
.kp-nav,.read-bar,#top-btn,.toast,.cmdk{{display:none !important}}
</style></noscript>
</head>
<body>
<div class="page-in" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<div class="scroll-rail" aria-hidden="true"><i></i></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#9d3a2e"/><stop offset="1" stop-color="#c9a227"/>
</linearGradient></defs></svg>

<header class="top">
  <div class="top-in">
    <button class="icon-btn menu-btn" id="menu-btn" title="目录" aria-label="目录">☰</button>
    <a class="logo" href="index.html">
      <span class="dot"></span><b>知识点讲解</b><span class="txt">· JavaWeb</span>
    </a>
    <div class="search"><input id="search" type="search" placeholder="搜知识点，如 v-model、跨域、Result　(Ctrl+K)" aria-label="搜索知识点"></div>
    <div class="spacer"></div>
    <div class="prog" title="学习进度">
      <svg class="ring" viewBox="0 0 30 30" aria-hidden="true">
        <circle class="bg" cx="15" cy="15" r="12"></circle>
        <circle class="fg" cx="15" cy="15" r="12"></circle>
      </svg>
      <span id="prog-txt">0/0</span>
    </div>
    <button class="icon-btn" id="theme-btn" title="切换主题" aria-label="切换主题">☀</button>
  </div>
</header>
{hero}
<div class="shell">
  <aside class="side" id="side">
    <div class="side-top">
      <span class="st-seal">{st_seal}</span>
      <span class="st-txt"><b>{st_main}</b><span>{st_sub}</span></span>
    </div>
    <h4>七讲</h4>
    <nav class="nav-lab">{''.join(nav)}</nav>
"""


def render_foot():
    return """</div>
<div id="scrim"></div>
<button class="icon-btn" id="top-btn" title="回到顶部" aria-label="回到顶部">↑</button>
<div class="foot-banner" aria-hidden="true"><img src="assets/art/paintings/band-ink.jpg" alt=""></div>
<footer><img class="foot-lotus" src="assets/art/motifs/lotus.png" alt="" aria-hidden="true">
  <div class="in">
  <p><b>JavaWeb 知识点讲解</b> · 覆盖实训 1~7 共 109 个知识点。每讲按「讲义要点 / 核心讲解 / 示例演示 / 代码解读 / 工程对照 / 易错提醒 / 课堂思考」七个环节展开，供课堂讲授与课后复习使用。</p>
  <p>全部内容离线可用：不引用任何 CDN 与外部字体。学习进度保存在本机浏览器中，更换设备后不同步。</p>
  <p>讲解内容依据课程讲义编写，建议配合 <code>实验过程_实训N.md</code>（实验操作步骤）与 <code>讲义勘误_实训N.md</code>（讲义勘误说明）对照学习。</p>
  </div>
  <div class="foot-sign" aria-hidden="true">
    <span class="seal">研学</span>
    <span>依 讲 义 而 授 · 循 次 第 而 学</span>
  </div>
</footer>
<script src="assets/ids.js"></script>
<script src="assets/app.js"></script>
</body>
</html>"""


# ================================================================== 讲解页
def render_point(p, lab_id):
    blocks = []
    for b in p["blocks"]:
        _, key, name, body = b
        k = key or ""
        # 首字下沉只在「② 核心讲解」且首字符是汉字时开启（英文单词不能被切成 r + ef）
        extra = ""
        if k == "②":
            txt = _plain(body).strip()
            if txt and "\u4e00" <= txt[0] <= "\u9fff":
                extra = " dc"
        blocks.append(
            f'<section class="blk{extra}" data-k="{k}">'
            f'<div class="blk-tag"><i>{k}</i>{html.escape(BLOCK_DISPLAY.get(name, name))}</div>'
            f'<div class="blk-body">{body}</div></section>'
        )
    return f"""<article class="kp rv" id="{p['id']}" data-id="{lab_id}:{p['num']}">
  <div class="kp-head">
    <span class="kp-num">{p['num']}</span>
    <h3>{inline(p['name'])}</h3>
    <label class="kp-done"><input type="checkbox"><span>学会了</span></label>
  </div>
  <div class="kp-body">{''.join(blocks)}</div>
</article>"""


def write_lab_page(lab, labs):
    toc = "".join(
        f'<a href="#{p["id"]}"><span class="num">{p["num"]}</span>{html.escape(p["name"])}</a>'
        for p in lab["points"]
    )
    meta = []
    for m in lab["meta"]:
        m2 = re.sub(r"\*\*(.+?)\*\*", r"\1", m)
        # 单行 chip 会被 ellipsis 截断，把完整文本放进 title，悬停可看全
        plain = strip_html(inline(m2))
        meta.append(f'<span class="chip" title="{html.escape(plain, quote=True)}">{inline(m2)}</span>')

    banner = LAB_ART[lab["id"]]
    title = lab["title"].split("：")[-1]
    hero = (
        f'<header class="lab-hero rv" id="top">'
        f'<div class="lab-hero-bg"><img src="assets/art/paintings/{banner}" alt="馆藏中国画"></div>'
        f'<div class="lab-hero-veil"></div>'
        f'<div class="lab-hero-no" aria-hidden="true">{lab["id"]}</div>'
        f'<div class="lab-hero-inner">'
        f'<p class="lab-kicker">实训 {lab["id"].lstrip("0")} · 知识点讲解 · {html.escape(lab["stage"])}</p>'
        f'<h1>{html.escape(title)}</h1>'
        f'<p class="lab-hero-sub">依讲义讲授 · 逐知识点过关</p>'
        f'<div class="meta">{"".join(meta)}<span class="chip"><b>{lab["count"]}</b> 个知识点</span>'
        f'<span class="chip"><b>{lab["code"]}</b> 段代码</span>'
        f'<span class="chip"><b>{lab["qa"]}</b> 道自测</span></div>'
        f'</div>'
        f'<img class="lab-hero-plum" src="assets/art/motifs/plum.png" alt="" aria-hidden="true">'
        f'<div class="lab-poem" aria-hidden="true">依 讲 义 · 授 此 讲</div>'
        f'<p class="lab-hero-cap">{ART_CAPTION}</p>'
        f'</header>'
    )

    # 册页组图
    if lab["id"] == "07":
        set_files, cur = BACK_SET, 1
        set_label, set_sub, set_href = "后端组图 · 第 1 / 3 幅", "另一套册页 · 后端专题", "实训7.html"
    else:
        set_files, cur = FRONT_SET, int(lab["id"])
        set_label, set_sub, set_href = f"前端组图 · 第 {cur} / 6 幅", "同一册页 · 按讲次顺序", ""
    items = []
    for i, f in enumerate(set_files, 1):
        on = " on" if i == cur else ""
        href = f"实训{i}.html" if set_href == "" else set_href
        items.append(
            f'<a class="ser-item{on}" href="{href}">'
            f'<img src="assets/art/paintings/{f}" alt="组图第 {i} 幅"><i>{i}</i></a>'
        )

    body = [
        '<div id="hits"></div>',
        # 本讲速览
        f'<div class="lab-glance rv"><span class="gl-k">本讲速览</span>'
        f'<span class="gl-i"><b>{lab["count"]}</b> 个知识点</span>'
        f'<span class="gl-i"><b>{lab["code"]}</b> 段代码</span>'
        f'<span class="gl-i"><b>{lab["qa"]}</b> 道自测</span>'
        f'<span class="gl-i"><b>{lab["minutes"]}</b> 分钟通读</span>'
        f'<span class="gl-note">七个环节逐条展开</span></div>',
        # 册页索引（压缩成一条细带）
        f'<div class="series rv"><div class="series-head"><span>{set_label}</span>'
        f'<span class="series-sub">{set_sub}</span></div>'
        f'<div class="series-row">{"".join(items)}</div></div>',
    ]

    for s in lab["sections"]:
        t = s["title"]
        body.append(f'<div class="sec-title rv"><span class="bar"></span><h2>{html.escape(t)}</h2></div>')
        if t.startswith("2."):
            body.append("".join(render_point(p, lab["id"]) for p in lab["points"]))
        else:
            body.append(f'<div class="rv">{s["html"]}</div>')

    # 卷尾落款
    idx = next(i for i, l in enumerate(labs) if l["id"] == lab["id"])
    nxt = labs[idx + 1] if idx + 1 < len(labs) else None
    if nxt:
        next_html = (f'<a class="end-next" href="{nxt["file"]}">'
                     f'<span class="en-k">下一讲 · {html.escape(nxt["stage"])}</span>'
                     f'<span class="en-t">{html.escape(nxt["short"])}</span>'
                     f'<span class="en-n">{nxt["count"]} 个知识点</span>'
                     f'<span class="en-arrow">→</span></a>')
    else:
        next_html = (f'<a class="end-next" href="index.html">'
                     f'<span class="en-k">七讲已毕</span>'
                     f'<span class="en-t">返回研学总目</span>'
                     f'<span class="en-n">7 讲 · {sum(l["count"] for l in labs)} 个知识点</span>'
                     f'<span class="en-arrow">→</span></a>')
    body.append(
        f'<section class="lab-end rv" aria-label="本讲结束">'
        f'<div class="end-seal">本讲完</div>'
        f'<p class="end-line">实训 {lab["id"].lstrip("0")} · {html.escape(lab["short"])}　'
        f'{lab["count"]} 个知识点，{lab["code"]} 段代码，{lab["qa"]} 道自测 —— 全部读完。</p>'
        f'{next_html}'
        f'</section>'
    )

    page = (
        render_top(lab["id"], labs, f'实训{lab["id"].lstrip("0")} {lab["short"]} · 知识点讲解', hero)
        + f'<h4>本讲知识点</h4><nav class="toc">{toc}</nav>'
        + '<div class="side-tools">'
          '<button class="tool-btn" id="qa-open" type="button">展开全部自测答案</button>'
          '<button class="tool-btn" id="qa-close" type="button">收起全部答案</button>'
          '</div>\n  </aside>\n  <main>'
        + "".join(body)
        + "</main>\n"
        + render_foot()
    )
    (OUT / lab["file"]).write_text(page, encoding="utf-8")
    return len(page)


# ================================================================== 首页
def sec_title(no, cn, en, extra=""):
    return (
        f'<div class="sec-title rv"{extra}><span class="bar"></span>'
        f'<span class="sec-no">{cn}</span><h2>{no}</h2>'
        f'<span class="sec-en">{en}</span></div>'
    )


def write_index(labs):
    total = sum(l["count"] for l in labs)
    total_code = sum(l["code"] for l in labs)
    total_qa = sum(l["qa"] for l in labs)
    max_count = max(l["count"] for l in labs)

    # ---- 七讲卡片
    cards = []
    for l in labs:
        art = LAB_ART[l["id"]]
        cards.append(
            f'<a class="lab-card rv" href="{l["file"]}">'
            f'<div class="lab-thumb"><img src="assets/art/paintings/{art}" alt="">'
            f'<span class="num-seal">{l["id"].lstrip("0")}</span></div>'
            f'<div class="lab-body"><div class="k">实训 {l["id"].lstrip("0")} · {html.escape(l["stage"])}</div>'
            f'<h3>{html.escape(l["short"])}</h3>'
            f'<p>{html.escape(l["blurb"])}</p>'
            f'<div class="foot"><span class="pill">{l["count"]} 个知识点 · {l["code"]} 段代码</span>'
            f'<span class="go">开始学习 →</span></div></div></a>'
        )

    # ---- 组图巡览
    mq_items = []
    for i, l in enumerate(labs):
        img = "back-1.jpg" if l["id"] == "07" else f"front-{i + 1}.jpg"
        mq_items.append(
            f'<a class="mq-item" href="{l["file"]}">'
            f'<img src="assets/art/paintings/{img}" alt="实训 {l["id"].lstrip("0")}">'
            f'<span class="mq-cap">实训 {l["id"].lstrip("0")} · {html.escape(l["short"])}</span></a>'
        )
    marquee = "".join(mq_items) * 2

    # ---- 数据志
    stat_cells = [
        (len(labs), "讲实训", "LECTURES"),
        (total, "个知识点", "KNOWLEDGE POINTS"),
        (total_code, "段代码", "CODE BLOCKS"),
        (total_qa, "道自测", "FOLDED Q & A"),
    ]
    stat_html = "".join(
        f'<div class="stat"><b>{n}</b><span>{t}</span><i>{e}</i></div>' for n, t, e in stat_cells
    )
    dist_rows = "".join(
        f'<div class="dist-row"><span class="dk"><em>{l["id"].lstrip("0")}</em>{html.escape(l["short"])}</span>'
        f'<span class="dist-bar"><i style="width:{l["count"] / max_count * 100:.1f}%"></i></span>'
        f'<span class="dv">{l["count"]}</span></div>'
        for l in labs
    )

    # ---- 时间轴
    tl_items = "".join(
        f'<li class="tl-item"><a href="{l["file"]}">'
        f'<span class="tl-node">{l["id"]}</span>'
        f'<div class="tl-body"><span class="tl-k">{html.escape(l["stage"])}</span>'
        f'<h3>{html.escape(l["short"])}</h3>'
        f'<p>{html.escape(l["blurb"])}</p>'
        f'<span class="tl-meta"><span>{l["count"]} 个知识点</span><span>{l["code"]} 段代码</span>'
        f'<span>{l["qa"]} 道自测</span></span></div></a></li>'
        for l in labs
    )

    # ---- 学习路径
    path_def = [
        ("壹", "把环境跑起来", "Node、npm、镜像源与 Vue 工程骨架", ["01"]),
        ("贰", "看懂语法与响应式", "插值、指令、生命周期，先会读再会写", ["02"]),
        ("叁", "会用组件库", "Element Plus 安装、中文包、图标与常用组件", ["03", "04"]),
        ("肆", "把页面连起来", "Vue-Router 跳转、传参、嵌套与守卫", ["05"]),
        ("伍", "做出一套后台", "flex 布局、菜单与嵌套路由落地", ["06"]),
        ("陆", "接上后端", "SpringBoot 建工程、连库、统一返回与异常", ["07"]),
    ]
    by_id = {l["id"]: l for l in labs}
    path_items = []
    for cn, head, desc, ids in path_def:
        pts = sum(by_id[i]["count"] for i in ids)
        href = by_id[ids[0]]["file"]
        path_items.append(
            f'<li class="path-step"><span class="p-i">{cn}</span><h4>{html.escape(head)}</h4>'
            f'<p>{html.escape(desc)}</p>'
            f'<a class="p-link" href="{href}">进入实训 {ids[0].lstrip("0")} · {pts} 个知识点 →</a></li>'
        )

    # ---- 勘误速查
    er_items = []
    for l in labs:
        comps = companions(l)
        if comps:
            lis = "".join(
                f'<li><a href="../{l["dir"]}/{f.name}">{html.escape(label)}</a></li>'
                for label, f in comps
            )
            er_items.append(
                f'<div class="er"><h4><em>{l["id"]}</em>实训 {l["id"].lstrip("0")} · {html.escape(l["short"])}</h4>'
                f'<ul>{lis}</ul></div>'
            )
        else:
            er_items.append(
                f'<div class="er"><h4><em>{l["id"]}</em>实训 {l["id"].lstrip("0")} · {html.escape(l["short"])}</h4>'
                f'<ul><li><span class="none">本讲暂无配套勘误文档</span></li></ul></div>'
            )

    # ---- 七块图例
    legend = "".join(
        f'<div class="lg"><i>{k}</i><div><b>{BLOCK_DISPLAY[n]}</b><p>{BLOCK_DESC[k]}</p></div></div>'
        for k, n in zip("①②③④⑤⑥⑦",
                        ["讲义怎么说", "一句话讲透", "示例代码", "逐行拆解",
                         "在你仓库里", "常见坑", "自测"])
    )

    hero = f"""<section class="cine-hero" id="top">
  <div class="cine-bg"><img src="assets/art/paintings/hero-bg.jpg" alt=""></div>
  <canvas id="ink-canvas" class="ink-canvas" aria-hidden="true"></canvas><canvas id="ripple-canvas" class="ripple-canvas" aria-hidden="true"></canvas>
  <div class="cine-petals" id="petals" aria-hidden="true"></div>
  <div class="cine-veil"></div>
  <div class="cine-inner">
    <div class="cine-copy">
      <p class="cine-kicker">JAVA WEB · 实训一至七</p>
      <h1 class="hero-title">把每个知识点<br><em>看明白</em></h1>
      <p class="cine-sub">依 讲 义 · 授 七 讲 · 研 学 相 长</p>
      <div class="home-stats">
        <div class="s"><b>{len(labs)}</b><small>讲</small></div>
        <div class="s"><b>{total}</b><small>个知识点</small></div>
        <div class="s"><b>{total_code}</b><small>个代码块</small></div>
        <div class="s"><b>{total_qa}</b><small>道课堂思考</small></div>
      </div>
      <a class="cine-cta" href="#labs">开始研学<span class="arrow">↓</span></a>
    </div>
    <figure class="cine-scroll">
      <div class="cine-scroll-inner">
        <i class="cine-axle top" aria-hidden="true"></i>
        <div class="cine-scroll-frame"><img src="assets/art/paintings/hero-vscroll.jpg" alt="巨碑式山水"></div>
        <i class="cine-axle bot" aria-hidden="true"></i>
        <span class="cine-seal" aria-hidden="true">研学<br>七讲</span>
      </div>
      <figcaption>馆藏中国画 · 克利夫兰艺术博物馆（公有领域）</figcaption>
    </figure>
    <img class="cine-plum" src="assets/art/motifs/plum.png" alt="" aria-hidden="true">
  </div>
  <div class="cine-brand" aria-hidden="true">研 学 七 讲</div>
  <div class="cine-side" aria-hidden="true"><span>依 讲 义 而 授</span><span>循 次 第 而 学</span></div>
  <a class="cine-down" href="#labs"><span></span>向下阅览</a>
</section>

<section class="pan" id="pan">
  <div class="pan-sticky">
    <div class="pan-head"><span>长卷 · 青绿山水</span><span>克利夫兰艺术博物馆藏</span></div>
    <div class="pan-view"><i class="pan-roller left"></i><i class="pan-roller right"></i><img class="pan-img" src="assets/art/paintings/pan-scroll.jpg" alt="青绿山水长卷"></div>
    <div class="pan-foot"><span class="pan-hint">向下滚动，画卷徐徐展开</span><span class="pan-bar"><i></i></span></div>
  </div>
</section>

<section class="quote-band rv" aria-label="引言">
  <figure class="quote-art"><img src="assets/art/paintings/prunus.jpg" alt="墨梅"></figure>
  <blockquote class="quote-text">
    <p class="quote-line">「学而时习之，不亦说乎」</p>
    <cite>——《论语·学而》</cite>
    <p class="quote-note">七讲实训，依讲义为纲：先读懂，再动手，后复盘。</p>
  </blockquote>
</section>"""

    body = f"""<div id="hits"></div>
<div id="home-body">

{sec_title("一图看全站", "壹", "At a glance")}
<section class="stats-band rv" aria-label="全站数据总览">
  <p class="lede">七讲实训，{total} 个知识点逐条拆开：每一讲都按「讲义要点 / 核心讲解 / 示例演示 / 代码解读 / 工程对照 / 易错提醒 / 课堂思考」七个环节展开，配 {total_code} 段可运行代码与 {total_qa} 道折叠自测。</p>
  <div class="stat-grid">{stat_html}</div>
  <div class="dist-head"><span>知识点分布</span><span>共 {total} 个</span></div>
  <div class="dist" aria-label="各讲知识点数量">{dist_rows}</div>
</section>

<section class="marquee" aria-label="七讲组图巡览">
  <div class="marquee-track">{marquee}</div>
</section>

<div class="sec-title rv" id="labs"><span class="bar"></span><span class="sec-no">贰</span><h2>七讲</h2><span class="sec-en">Seven Lectures</span></div>
<p class="labs-lede rv">七讲按课上次序排开。点开任意一讲，左侧会出现「讲义目录 + 本讲知识点」，每个知识点的「学会了」会自动汇进右上角的进度圆环。</p>
<div class="labs">{''.join(cards)}</div>

<section class="timeline rv" aria-label="七讲时间轴">
  {sec_title("七讲时间轴", "叁", "In order")}
  <ol class="tl">{tl_items}</ol>
</section>

<section class="path rv" aria-label="学习路径">
  {sec_title("学习路径", "肆", "How to go")}
  <p class="lede">六站走完，就是一整条 JavaWeb 前后端链路：从装 Node 到 SpringBoot 跑通接口。每一站都标了要过的知识点数量，走不动就回头补。</p>
  <ol class="path-row">{''.join(path_items)}</ol>
</section>

<section class="errata rv" aria-label="勘误速查">
  {sec_title("勘误速查", "伍", "Errata")}
  <p class="lede">讲义与真实工程对不上的地方，逐讲整理成了独立文档。动手前先扫一眼，能省掉大半个下午。</p>
  <div class="errata-grid">{''.join(er_items)}</div>
</section>

<section class="method rv" aria-label="学习方法">
  {sec_title("学习方法", "陆", "How to read")}
  <p class="lede">每个知识点固定七块，七块长得不一样，一眼能认出来——这是刻意的：读到什么形状，就知道该用什么方式读。</p>
  <div class="legend">{legend}</div>
  <div class="rv">
  <ul>
    <li><b>先读「① 讲义要点」</b>——先知道这一讲老师要求什么，再动手。</li>
    <li><b>「② 核心讲解」建立概念</b>：先弄懂"为什么"，再进入代码。</li>
    <li><b>「③ 示例演示」与「④ 代码解读」配合看</b>：把示例整体粘贴进对应工程文件，运行一遍，再逐行对照讲解。</li>
    <li><b>「⑤ 工程对照」给的是真实文件与行号</b>，请打开工程逐个核对。</li>
    <li><b>「⑥ 易错提醒」建议先自己踩一遍</b>，再对照讲解修正，印象最深。</li>
    <li><b>「⑦ 课堂思考」答案默认折叠</b>——先独立作答，再点开参考解析；未经思考直接看解析，等于没有学习。</li>
    <li>学完一个知识点，勾选右上角「学会了」，进度会保存在本机浏览器（顶栏圆环即总进度）。</li>
    <li>顶栏搜索框可跨讲检索，例如 <code>v-model</code>、<code>跨域</code>、<code>Result</code>。</li>
  </ul>
  </div>
</section>
</div>"""

    page = (
        render_top("", labs, "JavaWeb 知识点讲解 · 实训 1~7", hero)
        + "\n  </aside>\n  <main>"
        + body
        + "</main>\n"
        + render_foot()
    )
    (OUT / "index.html").write_text(page, encoding="utf-8")
    return len(page)


# ================================================================== 索引数据
def write_index_data(labs):
    items, ids = [], []
    for l in labs:
        for p in l["points"]:
            txt = " ".join(strip_html(b[3]) for b in p["blocks"])
            items.append({
                "lab": l["id"].lstrip("0"), "labName": l["short"], "num": p["num"],
                "name": p["name"], "text": txt, "file": l["file"], "id": p["id"],
            })
            ids.append(f'{l["id"]}:{p["num"]}')
    (ASSETS / "ids.js").write_text(
        "window.KP_ALL_IDS=" + json.dumps(ids, ensure_ascii=False) + ";\n", encoding="utf-8")
    (ASSETS / "search-index.js").write_text(
        "window.KP_INDEX=" + json.dumps(items, ensure_ascii=False) + ";\n", encoding="utf-8")
    return len(items)


# ================================================================== 主流程
def main():
    ASSETS.mkdir(parents=True, exist_ok=True)

    css_size = build_css()
    labs = build()
    total = sum(l["count"] for l in labs)

    print(f"解析完成：{len(labs)} 讲 / {total} 个知识点\n")
    print(f"{'讲':<5}{'知识点':>7}{'七块':>6}{'代码块':>7}{'折叠答案':>9}{'字数':>8}{'分钟':>6}")
    gb = gc = gq = gch = 0
    bad = []
    for l in labs:
        b = 0
        for p in l["points"]:
            b += len(p["blocks"])
            if len(p["blocks"]) != 7:
                bad.append(f"实训{l['id']} {p['num']} 只有 {len(p['blocks'])} 块")
        gb += b
        gc += l["code"]
        gq += l["qa"]
        gch += l["chars"]
        print(f"{l['id']:<5}{l['count']:>7}{b:>6}{l['code']:>7}{l['qa']:>9}{l['chars']:>8}{l['minutes']:>6}")
    print(f"{'合计':<5}{total:>7}{gb:>6}{gc:>7}{gq:>9}{gch:>8}{'':>6}")

    if bad:
        print("\n[!] 七块不全：")
        for x in bad[:20]:
            print("   ", x)
    else:
        print("\n[OK] 每个知识点都齐备 7 块")

    n_idx = write_index_data(labs)
    sizes = [write_index(labs)] + [write_lab_page(l, labs) for l in labs]
    if HIGHLIGHT_FAILS:
        print(f"\n[!] 有 {len(HIGHLIGHT_FAILS)} 段代码高亮降级为纯文本")
        for x in HIGHLIGHT_FAILS[:5]:
            print("   ", x)
    else:
        print("\n[OK] 语法高亮：所有代码块染色后文本与原文逐字一致")
    print(f"\n样式表：assets/style.css（{css_size / 1024:.1f} KB，由 src/css 拼接）")
    print(f"生成页面：index.html + {len(labs)} 个讲解页")
    print(f"搜索索引：{n_idx} 条")
    print(f"页面总大小：{sum(sizes) / 1024:.0f} KB")

    assert total == 109, f"知识点数量异常：{total}"
    assert gc == 232, f"代码块数量异常：{gc}"
    assert gq == 109, f"折叠问答数量异常：{gq}"
    print("\n[OK] 数量校验：109 知识点 / 232 代码块 / 109 问答")


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    main()
