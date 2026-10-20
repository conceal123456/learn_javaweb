# scripts · 逐阶段自检

一条命令回答：「**我现在这一讲，代码到底能不能在本机跑起来？**」

```powershell
# 在仓库根执行（Windows PowerShell 5.1 及以上）
powershell -ExecutionPolicy Bypass -File .\scripts\verify-stage.ps1 -Stage 3
```

它会自动完成：**检查环境 → 缺依赖就装（npm ci）→ 构建（npm run build）→ 起 dev server → 等到 HTTP 200 → 打印这一讲的人工验收清单 → 收工关掉进程**。
第 7 讲还会额外跑后端：`mvn clean package` → `java -jar` → 逐个断言 5 个接口 → 关掉进程。

> 第一次运行需要联网装依赖（本机实测：小工程 6s，带 Element Plus 的 25s 左右）。

---

## 参数

| 参数 | 说明 |
|---|---|
| `-Stage <1..7>` | **必填**。讲次，对应目录见下表 |
| `-Port <n>` | 可选。1–6 讲 = 前端端口；第 7 讲 = **后端**端口（默认 8080）。被占用时换一个：`-Port 8090` |
| `-FrontendPort <n>` | 可选。仅第 7 讲：前端端口（默认 5177） |
| `-SkipInstall` | 跳过 `npm ci`（`node_modules` 已存在时提速） |
| `-KeepRunning` | 检查完不关服务，方便接着在浏览器里点；用完自己 `taskkill /PID <pid> /T /F` |
| `-SkipBackend` | 仅第 7 讲：只验前端 |
| `-SkipFrontend` | 仅第 7 讲：只验后端 |
| `-TimeoutSec <n>` | 等待服务就绪的超时，默认 60 秒 |

## 阶段 → 目录 / 端口 / 验收点

| Stage | 目录（仓库根相对） | 前端端口 | 人工验收要点 |
|---|---|---|---|
| 1 | `实训1_软件安装及创建Vue项目\工程\hello-vue` | 5171 | 页面只有一行欢迎语，无 HelloWorld 残留 |
| 2 | `实训2_Vue基本语法\工程\vue-syntax` | 5172 | 9 个语法点可交互（改字→插值同步、加分→评级变） |
| 3 | `实训3_前端ElementPlus框架\工程\element-plus` | 5173 | `/`→`/home`；10 个按钮；图标显示（含 `#6666` 发淡那个） |
| 4 | 同上（复用阶段 3 工程） | 5174 | `/comp` 17 节、分页真切片；`/comp-orig` 三个讲义问题 |
| 5 | `实训5_Vue-Router实现路由跳转\工程\vue-router` | 5175 | `/manage/user` 父子同屏、后退正常、标题随路由变 |
| 6 | `实训6_后台管理页面\工程\admin-layout` | 5176 | `/manage`→`/manage/detail`；表格 9 行/共 50 条；翻页数据不变（讲义原版） |
| 7 | `实训7_新建SpringBoot项目\工程\xm-pro\vue` + `...\springboot` | 5177 / 后端 8080 | 前端 `/manage` 渲染首页；后端 5 接口 HTTP 200、code=200/500/200/200/400 |

## 输出与退出码

- 每项检查打印 `PASS` / `FAIL` + 说明；
- 末尾一张汇总表 + `[PASS] 阶段 N 全部 X 项检查通过`；
- 退出码：`0` 全过；`2` 环境/目录问题；`3` npm ci 失败；`4` 构建失败；`5` 端口被占；`6` dev server 起不来；`7` 后端或接口断言失败。

## 实测记录（2026-10-21，干净克隆）

| 命令 | 结果 | 总耗时 | 关键数据 |
|---|---|---|---|
| `-Stage 1 -SkipInstall` | PASS（7 项） | 13s | build 9.9s、dev 就绪 1.2s |
| `-Stage 2`（含安装） | PASS（7 项） | 9.6s | **npm ci 5.7s**、build 1s、dev 1.1s |
| `-Stage 7`（前端+后端） | PASS（14 项） | 26.8s | build 14.4s、`mvn clean package` 4s、后端启动 3.2s、5 接口全 PASS |

环境：Windows 11 · Node v24.17.0 · npm 11.13.0 · JDK 21.0.11 · Maven 3.8.1。

## 已知限制

1. **前端只能"冒烟"**：Vite 是 SPA，HTTP 返回的 HTML 只是空壳（`<div id="app"></div>`），页面文案由 JS 渲染。所以脚本能证明「依赖对、能构建、服务起得来」，**页面内容要按打印出来的清单人工看一遍**。
2. **需要联网**：第一次 `npm ci` 要从 registry 下载；国内建议先 `npm config set registry https://registry.npmmirror.com`。
3. **端口占用**：脚本会先检测，被占用直接提示换端口，不会去杀别人的进程。
4. **编码**：脚本必须保持 **UTF-8 with BOM** 保存。Windows PowerShell 5.1 读无 BOM 的 `.ps1` 会按 ANSI 解码，中文变乱码、**解析阶段就失败、一项都不执行**（仓库里 `_verify_lab7.ps1` 踩过这个坑）。
5. 不修改任何工程代码；`npm run build` 会在工程里生成 `dist/`（已被 `.gitignore` 忽略）。
