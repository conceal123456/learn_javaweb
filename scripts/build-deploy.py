# -*- coding: utf-8 -*-
"""把 知识点讲解/ 打包成可直接部署的静态站点（deploy-site/）。

为什么需要它：
  * 源站的页面文件名是中文（实训1.html … 实训7.html），部署到静态托管后 URL 会变成
    %E5%AE%9E%E8%AE%AD1.html 这种长串，分享/收藏都不体面，个别平台对中文路径也不友好。
  * 这里把页面复制成 ASCII 名（lab1.html … lab7.html），并同步改写 HTML 与搜索索引里的引用。
  * 其余资源（assets/art 的图片、style.css、app.js）原样复制，站点仍然完全离线可用。

用法：
    python scripts/build-deploy.py
输出：
    deploy-site/            ← 直接拖进 Netlify Drop / 上传到任意静态托管
    deploy-site.zip         ← 同上，方便一次性上传
"""
import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "知识点讲解"
OUT = ROOT / "deploy-site"
ZIP = ROOT / "deploy-site.zip"

RENAME = {f"实训{i}.html": f"lab{i}.html" for i in range(1, 8)}


def rewrite(text: str) -> str:
    for old, new in RENAME.items():
        text = text.replace(old, new)
    return text


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    # 1. 页面：改名 + 改写引用
    for src in sorted(SRC.glob("*.html")):
        name = RENAME.get(src.name, src.name)
        (OUT / name).write_text(rewrite(src.read_text(encoding="utf-8")), encoding="utf-8")

    # 2. 资源：原样复制（css/js/图片），但 search-index.js 里的 page 字段要跟着改名
    shutil.copytree(SRC / "assets", OUT / "assets")
    idx = OUT / "assets" / "search-index.js"
    if idx.exists():
        idx.write_text(rewrite(idx.read_text(encoding="utf-8")), encoding="utf-8")

    # 3. 静态托管的两个小件
    (OUT / ".nojekyll").write_text("", encoding="utf-8")  # GitHub Pages：别走 Jekyll
    (OUT / "404.html").write_text(
        "<!doctype html><html lang=\"zh-CN\"><meta charset=\"utf-8\">"
        "<title>页面不存在 · 知识点讲解</title>"
        "<script>location.replace('./index.html')</script>"
        "<body style=\"font-family:system-ui;padding:40px\">"
        "<p>没有这个页面，正在返回首页…</p><p><a href=\"./index.html\">点这里</a></p></body></html>",
        encoding="utf-8",
    )
    (OUT / "robots.txt").write_text("User-agent: *\nAllow: /\n", encoding="utf-8")

    # 4. 打 zip（方便 Netlify Drop / 其他平台上传）
    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for p in OUT.rglob("*"):
            if p.is_file():
                z.write(p, p.relative_to(OUT))

    files = [p for p in OUT.rglob("*") if p.is_file()]
    size = sum(p.stat().st_size for p in files) / 1024 / 1024
    print(f"[OK] 输出目录：{OUT}")
    print(f"[OK] 压缩包：{ZIP}（{ZIP.stat().st_size / 1024 / 1024:.1f} MB）")
    print(f"[OK] 文件数：{len(files)}，解压后 {size:.1f} MB")
    print("[OK] 页面：" + " / ".join(sorted(p.name for p in OUT.glob('*.html'))))


if __name__ == "__main__":
    main()
