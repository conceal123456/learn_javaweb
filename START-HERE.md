# 克隆之后：按阶段把代码跑起来

> 这份文档只回答一个问题：**你刚把仓库 clone 下来，学到第 N 讲，该进哪个目录、敲什么命令、看到什么才算跑对了。**
>
> 七个阶段（实训1–7）逐个写清楚；每一步都在**干净克隆**里实测过（见文末「本次实测记录」）。
> 配套：`scripts/verify-stage.ps1 -Stage N` 可以一条命令帮你自检。

---

## 0. 三十秒上手

```powershell
# 1) 克隆（两个地址任选，内容相同）
git clone https://gitee.com/conceal6666/learn-web.git
# 或：git clone https://github.com/conceal123456/learn_javaweb.git

cd learn-web

# 2) 看你在第几讲，按下面 §2 的表格进目录
#    以第一讲为例：
cd "实训1_软件安装及创建Vue项目\工程\hello-vue"
npm ci
npm run dev
```

终端出现 `Local: http://localhost:5173/` 后，浏览器打开它即可。

> **为什么是 `npm ci` 而不是 `npm install`？**
> 仓库里每个工程都带 `package-lock.json`，`npm ci` 严格按锁文件装、可复现、更快；`npm install` 会改写锁文件版本，容易装出和别人不一样的依赖。
> 干净克隆里**没有 `node_modules`**（被 `.gitignore` 排除了），所以每个工程第一次都要装一次依赖。

---

## 1. 先看懂仓库的"按阶段"结构

老师讲义是**同一个工程一路改下来的**，但本仓库为了让你"学到哪一讲就能单独跑哪一讲"，把七个阶段拆成了独立工程：

```text
实训1_软件安装及创建Vue项目/工程/hello-vue      ← 阶段 1
实训2_Vue基本语法/工程/vue-syntax                ← 阶段 2
实训3_前端ElementPlus框架/工程/element-plus      ← 阶段 3 和阶段 4 共用
实训5_Vue-Router实现路由跳转/工程/vue-router     ← 阶段 5
实训6_后台管理页面/工程/admin-layout             ← 阶段 6
实训7_新建SpringBoot项目/工程/xm-pro/
        ├─ vue/          ← 阶段 7 前端
        └─ springboot/   ← 阶段 7 后端
```

**注意两件事**：
1. **实训4 没有独立工程**，它复用实训3 的 `element-plus`，只是多看两个路由：`/comp`（修正版）和 `/comp-orig`（讲义原版）。
2. **每个工程都是"自带前置状态"的完整可运行工程**：比如阶段5 的工程里已经装好了 Element Plus（因为讲义那讲的按钮用了 `<el-button>`），你不用先回阶段3 改装。

---

## 2. 七个阶段：进哪个目录、开什么端口、看什么

| 阶段 | 对应讲义 | 目录（仓库根相对） | 端口 | 跑起来先看这一句 |
|---|---|---|---|---|
| 1 | 实训1 软件安装及创建 Vue 项目 | `实训1_软件安装及创建Vue项目\工程\hello-vue` | 5173 | 页面只有一行欢迎语 |
| 2 | 实训2 Vue 基本语法 | `实训2_Vue基本语法\工程\vue-syntax` | 5173 | 一页 9 个语法演示 |
| 3 | 实训3 前端 ElementPlus 框架 | `实训3_前端ElementPlus框架\工程\element-plus` | 5173 | `/home` 一排按钮 + 图标 |
| 4 | 实训4 Element-Plus 组件的使用 | 同上（复用阶段3 工程） | 5173 | `/comp` 17 个小节 |
| 5 | 实训5 Vue-Router 实现路由跳转 | `实训5_Vue-Router实现路由跳转\工程\vue-router` | 5173 | 点按钮能换页面 |
| 6 | 实训6 后台管理页面 | `实训6_后台管理页面\工程\admin-layout` | 5173 | 左菜单 + 右侧表格 |
| 7 | 实训7 新建 SpringBoot 项目 | `实训7_新建SpringBoot项目\工程\xm-pro\vue`（前端）<br>`...\xm-pro\springboot`（后端） | 前端 5173 / 后端 8080 | 前端页面同阶段6；后端 `/hello` 返回中文 |

> 七个前端都用 Vite 默认端口 5173——**因为一次只跑一个阶段**。如果你想同时开两个，用 `npm run dev -- --port 5174 --strictPort`。

---

## 3. 环境要求（注意：不同阶段要求不一样）

| 阶段 | Node.js | 其它 |
|---|---|---|
| 1、7（前端） | **20.19+ 或 22.12+**（Vite 7） | — |
| 2、3、4、5、6 | **22.18+ 或 24.12+**（Vite 8） | — |
| 7（后端） | — | **JDK 21**、**Maven 3.8.1+** |

```powershell
node -v          # 建议 22.18+ 或 24.x，一次满足所有阶段
npm -v
java -version    # 阶段 7 后端需要 21
mvn -v           # 阶段 7 后端需要 3.8.1+
```

**Node 版本低会怎样？** `npm ci` 会打印 `EBADENGINE` 警告（不是报错），`npm run dev` 有时仍能跑，但 Vite 8 可能直接报错退出。看到 `EBADENGINE` 就升 Node，别硬扛——实训1 讲义里写的 20.15.1 本来就低于要求（见 `实训1_软件安装及创建Vue项目/讲义勘误_实训1.md`）。

**npm 镜像**（国内建议）：
```powershell
npm config set registry https://registry.npmmirror.com
```

---

## 4. 逐阶段：命令 + 验收清单

> 每一节的"验收清单"就是**你跑对了没有**的判据。全打勾 = 这一讲的环境和代码都没问题，可以开始做作业了。
> 想省事可以直接跑 §5 的自检脚本，脚本会打印同一份清单。

### 阶段 1 · 创建 Vue 项目

```powershell
cd "实训1_软件安装及创建Vue项目\工程\hello-vue"
npm ci
npm run dev
```

打开 <http://localhost:5173/>

- [ ] 页面只有一行字：**欢迎来到安徽中医药大学信工院JavaWeb课堂！**
- [ ] 页面没有 `HelloWorld` 组件、没有 Vue 默认的绿色 logo 页
- [ ] 浏览器控制台没有红色报错
- [ ] `src/components/` 是空的（讲义要求删掉示例组件）

对应：`知识点精讲_实训1.md`、`实验过程_实训1.md`、`讲义勘误_实训1.md`

### 阶段 2 · Vue 基本语法

```powershell
cd "实训2_Vue基本语法\工程\vue-syntax"
npm ci
npm run dev
```

- [ ] 看到标题 **实训2 Vue 基本语法演示**
- [ ] 9 个语法点都在：插值、v-model、v-if/v-else、v-for、@click、v-bind、图片 :src、onMounted、下拉框 v-for
- [ ] 在输入框里改字 → 上面那行"学校：…"跟着变
- [ ] 点「加 10 分」→ 分数变、评级（优秀/及格/不及格）跟着变；点「重置」→ 回到 55 分
- [ ] 点「点赞 +1」→ 数字加一
- [ ] 点「切换方块颜色」→ 方块红/蓝互换
- [ ] 点「换一张图片」→ 图片换掉
- [ ] 刷新页面时会弹一个 `alert`（这是 `onMounted` 的演示，不是报错）

对应：`知识点精讲_实训2.md`（本讲示例代码在讲义里都是截图，正文抄不到，直接看 `src/views/Home.vue`）

### 阶段 3 · 装 Element Plus

```powershell
cd "实训3_前端ElementPlus框架\工程\element-plus"
npm ci
npm run dev
```

- [ ] 打开 `http://localhost:5173/` 会自动跳到 `/home`
- [ ] 页面有一排 **10 个按钮**（默认/主要/成功/警告/危险/信息/plain/round/disabled/link）
- [ ] 按钮旁边/里面有**图标**（不是空白方块）
- [ ] 同页两个图标颜色**不一样**：一个是正常灰 `rgb(102,102,102)`，一个是发淡的 `rgba(102,102,102,0.4)`——发淡那个就是讲义写 `#6666` 的坑（4 位带透明度），对照 `讲义勘误_实训3.md` 看
- [ ] 控制台没有 `Failed to resolve component`

对应：`知识点精讲_实训3.md`、`讲义勘误_实训3.md`

### 阶段 4 · Element Plus 组件（复用阶段 3 的工程）

```powershell
# 还是阶段3 的目录，不用重新装依赖
cd "实训3_前端ElementPlus框架\工程\element-plus"
npm run dev
```

- [ ] `/comp`：17 个小节都在（输入框、文本域、下拉、单选、多选、图片、轮播、日期、表格、分页、弹窗等）
- [ ] `/comp` 的表格分页**真的能翻**：第 1 页是「人参/三七/当归」，点第 2 页变成「山药/黄精/石斛」
- [ ] `/comp-orig`：这是**讲义原版**，能看到三个问题——分页没有底色（`is-background` 没生效）、轮播有类型告警、翻页数据不变（7 行全显示）
- [ ] 打开 `/comp-orig` 的控制台能看到 `Invalid prop: type check failed for prop "interval"`

> 对比着看 `/comp` 和 `/comp-orig`，就是这一讲最有价值的部分：**讲义哪里写错了，修好之后是什么样。**

对应：`实训4_Element-Plus组件的使用/工程说明.md`、`讲义勘误_实训4.md`

### 阶段 5 · Vue-Router

```powershell
cd "实训5_Vue-Router实现路由跳转\工程\vue-router"
npm ci
npm run dev
```

- [ ] `http://localhost:5173/` 自动跳到 `/home`
- [ ] 顶部按钮能跳到 `/test`
- [ ] 点「后台管理」→ 进 `/manage`，右侧出现子页面
- [ ] 再点「用户列表 / 商品列表 / 订单列表」→ 地址栏分别变成 `/manage/user`、`/manage/goods`、`/manage/orders`，**父页面框架不动、右侧内容变**
- [ ] 浏览器**后退**能回到上一个页面
- [ ] 标签页标题会随页面变（首页/测试页/后台管理…）

对应：`知识点精讲_实训5.md`、`讲义勘误_实训5.md`

### 阶段 6 · 后台管理页面

```powershell
cd "实训6_后台管理页面\工程\admin-layout"
npm ci
npm run dev
```

- [ ] `http://localhost:5173/manage` 会自动进 `/manage/detail`
- [ ] 左边是深色菜单栏（约 200px），右边是内容区（表格）
- [ ] 表格 **9 行**，底部写「共 50 条」
- [ ] 点第 2 页 → **页码会变，但 9 行数据不变**：这是讲义原版的样子（仓库没替它修），属于 `讲义勘误_实训6.md` 里记的「假分页」，不是你没装好；想学怎么修，对照实训4 的 `/comp`
- [ ] 点左侧「用户列表 / 商品列表 / 订单列表」→ 右侧内容切换，菜单高亮跟着走
- [ ] 从 `/manage/admin` 点「管理首页」→ **三个菜单会同时高亮并卡住**（element-plus 2.14.7 的已知问题，刷新恢复）——看到这个不要慌，不是你写错了

对应：`知识点精讲_实训6.md`、`构建验证_实训6.md`、`讲义勘误_实训6.md`

### 阶段 7 · 新建 SpringBoot 项目

这一讲分**前端**和**后端**两块，可以分别跑。

**前端**（和阶段 6 很像）：

```powershell
cd "实训7_新建SpringBoot项目\工程\xm-pro\vue"
npm ci
npm run dev
```

- [ ] `/home` 正常；`/manage` 直接渲染「后台管理首页」（**不重定向**，和阶段6 不同）
- [ ] 点「内容展示 / 用户列表 / 商品列表 / 订单列表」都正常
- [ ] 点「普通用户信息」「（右上角用户名）」「退出登录」→ **整页空白 + 控制台 `No match found`**：这三项的路由没配，是这一讲的已知坑，不是你装错

**后端**（另开一个终端）：

```powershell
cd "实训7_新建SpringBoot项目\工程\xm-pro\springboot"
mvn -B -DskipTests clean package
java -jar target\springboot-0.0.1-SNAPSHOT.jar
```

等到控制台出现 `Started SpringbootApplication`，再开一个终端：

```powershell
curl.exe http://localhost:8080/hello
curl.exe http://localhost:8080/map
curl.exe http://localhost:8080/result
curl.exe http://localhost:8080/number
curl.exe http://localhost:8080/business
```

- [ ] `/hello` 返回 `{"code":"200","msg":"请求成功","data":"Hello 安徽中医药大学！"}`（中文不乱码）
- [ ] `/map` 返回原生 JSON：`{"name":"安徽中医药大学","age":18}`
- [ ] `/result`、`/number`、`/business` 都是 **HTTP 200**，但 body 里的 `code` 分别是 `200 / 500 / 400`
- [ ] **MySQL 不用管**：这一讲后端没有 DAO/Mapper，库名对不对、MySQL 开没开都不影响启动（到实训8 加 Mapper 才需要建表）

> 必须用 `mvn clean package`，别用 `mvn package`：源码没改时它虽然打印 `BUILD SUCCESS`，但**不会重新打 jar**，等于空转。

对应：`知识点精讲_实训7.md`、`构建验证_实训7-后端.md`、`讲义勘误_实训7.md`

---

## 5. 一条命令自检（推荐）

仓库自带逐阶段自检脚本（`scripts/`）：

```powershell
# 在仓库根执行：检查第 3 讲（装依赖 → 构建 → 起 dev → 打印这一讲的人工验收清单 → 关掉）
powershell -ExecutionPolicy Bypass -File .\scripts\verify-stage.ps1 -Stage 3

# 依赖已经装过，想快一点
powershell -ExecutionPolicy Bypass -File .\scripts\verify-stage.ps1 -Stage 3 -SkipInstall

# 想让它开着服务、自己接着点页面
powershell -ExecutionPolicy Bypass -File .\scripts\verify-stage.ps1 -Stage 3 -KeepRunning

# 第 7 讲：连后端一起验（mvn clean package → java -jar → 5 个接口断言 → 关掉）
powershell -ExecutionPolicy Bypass -File .\scripts\verify-stage.ps1 -Stage 7
```

退出码 `0` = 全过；非 0 = 没过（脚本会打印原因和建议）。其它参数（`-Port`、`-SkipBackend`、`-TimeoutSec`…）见 [`scripts/README.md`](scripts/README.md)。

**本机实测**：阶段 1（已装依赖）13s / 7 项全过；阶段 2（含 `npm ci`）9.6s / 7 项；阶段 7（前端+后端）26.8s / 14 项全过。

---

## 6. 克隆之后最容易卡住的 8 件事

| 现象 | 原因 | 怎么办 |
|---|---|---|
| `npm ci` 报 `EBADENGINE` | Node 低于工程要求（阶段2/3/4/5/6 要 22.18+） | 升 Node；只是警告时也建议升 |
| `npm ci` 报 `npm ci can only install packages when your package.json and package-lock.json are in sync` | 有人手动改过 `package.json` 没更新锁文件 | 临时用 `npm install` 生成新锁文件，别提交它 |
| `Port 5173 is in use` | 上一次的 dev server 没关 | `npm run dev -- --port 5174 --strictPort`，或找出 PID 杀掉 |
| 页面 404 / 白屏 | 地址少了 `/home` 等路由（部分工程 `/` 有重定向，部分没有） | 先访问 `/`，看它跳到哪；再按 §4 的路由清单访问 |
| 中文乱码（终端） | PowerShell 编码 | `chcp 65001`，或 `[Console]::OutputEncoding=[Text.Encoding]::UTF8` |
| `mvn` 卡在下载 | 镜像配了 http（Maven 3.8.1 会拦） | 改成 `https://maven.aliyun.com/repository/public` |
| `java -jar` 报 `'url' attribute is not specified` | 你改过 `application.yml` 且 `url:` 缩进错了 | 按 `application.yml` 原有缩进对齐（讲义正文那处是错的，见勘误） |
| 8080 杀不掉 | `java -jar` 是两层进程（stub → 真 JVM） | `Get-NetTCPConnection -LocalPort 8080 -State Listen` 找 PID，再 `taskkill /PID <PID> /T /F` |

---

## 7. 本次实测记录（干净克隆）

> 「干净克隆」= 全新 `git clone`，没有 `node_modules` / `dist` / `target`，模拟别人第一次拿到仓库。
> 实测环境：Windows 11 · Node v24.17.0 / npm 11.13.0 · JDK 21.0.11 · Maven 3.8.1 · 2026-10-21 00:00–00:20
> 克隆本身：`git clone` 1.1s、74.4 MB、0 个构建产物。

| 阶段 | `npm ci`（首次装依赖） | `npm run build` | 起 dev（出现 Local 地址） | 页面验收（实测） | 结论 |
|---|---|---|---|---|---|
| 1 hello-vue | **6.2s**（145 包） | **1.9s** | **538ms** | 页面只有一行「欢迎来到安徽中医药大学信工院JavaWeb课堂！」 | ✅ PASS |
| 2 vue-syntax | **5.9s**（145 包） | **1.7s** | **479ms** | 标题 + 9 个语法点；点「加10分」55→65、评级变「及格」 | ✅ PASS |
| 3 element-plus | **24.8s**（166 包） | **2.0s**（⚠️ chunk > 500 kB） | **516ms** | `/` → `/home`；10 个按钮；两个图标 `rgb(102,102,102)` / `rgba(102,102,102,0.4)` | ✅ PASS |
| 4 复用阶段 3 | —（同一份依赖） | — | 同上 | `/comp` 17 节、分页真切片（人参/三七/当归 → 山药/黄精/石斛）；`/comp-orig` 无 `is-background`、7 行不切片 | ✅ PASS |
| 5 vue-router | **25.7s**（166 包） | **1.9s** | **465ms** | `/` → `/home`；`/manage/user` 父页面+子页面同屏；标题变「用户列表」；后退回 `/home` | ✅ PASS |
| 6 admin-layout | **25.9s**（172 包） | **2.0s** | **443ms** | `/manage` → `/manage/detail`；表格 9 行、共 50 条；**翻页数据不变（讲义原版）** | ✅ PASS |
| 7 vue 前端 | **26.9s**（170 包） | **6.9s** | **545ms** | `/manage` 渲染「后台管理首页」；点「普通用户信息」→ URL 变 `/manage/ordinary`、页面空白（已知坑复现） | ✅ PASS |
| 7 springboot 后端 | — | **`mvn clean package` 13.3s**，jar 25.4 MB | **Started 2.384s**（Tomcat 8080） | 5 接口全 **HTTP 200**、`charset=UTF-8`；body `code` = 200 / 500 / 200 / 200 / 400 | ✅ PASS |

**离线网页**（同一份克隆，`file://` 直接打开）：`index.html` 28 张图 0 加载失败、CSS 生效（宣纸底 `rgb(247,241,230)`）、8 个页面链接齐全；`实训7.html` 26 个知识点、0 坏图、`data-reveal=focus`。✅

> 详细命令、原始输出、截图见 `.extract/clone/final/`（该目录不入库，属于本地验证证据）。
>
> 上面这批数据是在 commit `128c758` 的干净克隆里跑出来的；补完本指南和 `scripts/` 之后（commit `801f345`），又从**全新 clone** 按本文档原样跑了一遍阶段 3：`npm ci` 25.2s → `build` 2s → dev 1.1s，**7/7 PASS，总 30.2s**。

---

## 8. 仓库里哪些东西"克隆下来没有"，是正常的

| 没有的东西 | 为什么 | 需要时怎么来 |
|---|---|---|
| `node_modules/` | 体积大、可由锁文件重建 | 进工程目录 `npm ci` |
| `dist/` | 构建产物 | `npm run build` |
| `target/` | Maven 构建产物 | `mvn clean package` |
| `.extract/` | 本地验证脚本与证据，已被 `.gitignore` 排除 | 不需要；想复现验证看 `scripts/` |
| `.idea/`、`.vscode/` | 编辑器配置 | 自己用 IDEA/VSCode 打开即可 |

---

**下一步**：跑通之后，按 `README.md` 的"四步法"走——读讲义 → 自己敲 → 读精讲复盘 → 对结果 + 记坑。
