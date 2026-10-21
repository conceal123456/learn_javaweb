# 在线访问与部署

## 现在的线上地址（GitHub Pages，免费）

**<https://conceal123456.github.io/learn_javaweb/>**

- 托管在 **GitHub Pages**，源分支 `gh-pages`，零费用、无限流量（软限制 100 GB/月）、自带 HTTPS。
- 站点是纯静态的（HTML/CSS/JS/图片），没有任何后端依赖，打开即用。
- 手机/平板/桌面都适配，深浅两套主题，搜索、学习进度（存本机）都正常。

> 中国大陆访问 GitHub Pages 有时会慢（首次加载 3–8 秒），但能打开；追求速度见下面「备选平台」。

## 为什么线上是 `lab1.html` 而不是 `实训1.html`

源站的文件名是中文（`实训1.html`），部署后 URL 会变成 `%E5%AE%9E%E8%AE%AD1.html` 这种长串，分享和收藏都不体面。
`scripts/build-deploy.py` 会把页面复制成 ASCII 名（`lab1.html` … `lab7.html`）并同步改写 HTML 与搜索索引里的引用，其余资源原样复制。

**源站不受影响**：`知识点讲解/` 仍然是中文文件名、仍然是本地双击可用的版本。

## 部署 / 更新（一条命令）

```powershell
# 1) 改完 知识点精讲_实训N.md 后，先重建站点
python 知识点讲解\_build\build_site.py

# 2) 打包 + 推到 gh-pages（自动 commit & push 到 Gitee 和 GitHub）
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-pages.ps1
```

推送后 30–90 秒生效（GitHub Pages 会重新构建）。地址不变：<https://conceal123456.github.io/learn_javaweb/>

只想看部署包、不想推：

```powershell
python scripts\build-deploy.py     # 生成 deploy-site/ 和 deploy-site.zip
python -m http.server 8000 -d deploy-site   # 本机 http://127.0.0.1:8000 预览
```

## 备选平台（都免费）

| 平台 | 适合 | 怎么用 | 备注 |
|---|---|---|---|
| **GitHub Pages**（当前） | 长期、免费、和仓库同源 | 已部署好，推 `gh-pages` 即更新 | 国内偶尔慢 |
| **Gitee Pages** | 国内访问快 | 仓库「服务 → Gitee Pages」→ 选 `gh-pages` 分支 → 启动 | 需实名认证；仓库已在 Gitee |
| **Netlify Drop** | 不想折腾 Git | 打开 <https://app.netlify.com/drop>，把 `deploy-site.zip` 拖进去 | 免费额度足够；需登录 |
| **Vercel** | 想要更快的全球 CDN | `npx vercel deploy deploy-site --prod` | 需登录；国内速度一般 |
| **Cloudflare Pages** | 免费 CDN 大厂 | 控制台连接 GitHub 仓库，构建目录填 `deploy-site` | 需账号 |
| **本地 / 局域网** | 课堂演示 | `python -m http.server 8000 -d deploy-site` | 同 Wi-Fi 下手机可访问 |

## 仓库里和部署相关的文件

| 文件 | 作用 |
|---|---|
| `scripts/build-deploy.py` | 把 `知识点讲解/` 打成 `deploy-site/`（ASCII 文件名 + `.nojekyll` + `404.html`） |
| `scripts/deploy-pages.ps1` | 打包 + 用 git worktree 推到 `gh-pages`（Gitee、GitHub 双推） |
| `deploy-site/`、`deploy-site.zip` | 生成物，**不入库**（见 `.gitignore`） |
| `gh-pages` 分支 | 线上站点的内容，**不要手改**，改源站后重新部署 |

## 常见问题

**Q：页面打开是 404？**
A：推送后等 1–2 分钟；或确认仓库 Settings → Pages 的 Source 是 `gh-pages` 分支、目录 `/ (root)`。

**Q：更新了内容，线上没变？**
A：先 `build_site.py` 再 `deploy-pages.ps1`；GitHub Pages 有 30–90 秒构建延迟，强制刷新（Ctrl+F5）。

**Q：想用自己的域名？**
A：在 `deploy-site/` 里加一个 `CNAME` 文件（内容是你的域名），把域名 CNAME 解析到 `conceal123456.github.io`，再部署一次。

**Q：图片/字体是外链吗？**
A：不是。全部资源都在 `assets/` 里，站点完全离线可用，也不依赖任何 CDN。
