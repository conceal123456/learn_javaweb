# JavaWeb 课程实训（Vue3 前端 + SpringBoot3 后端）学习与勘误

本仓库记录《JavaWeb》课程实训的学习成果：实训 1–6 是按老师讲义逐讲用 `npm create vue` 建的独立 Vue3 前端工程，配运行截图；实训 7 起进入后端，用 IDEA 建的 SpringBoot3 工程。实训 1–5 的讲义做了"代码层 + 文字层 + 多代理交叉验证"三轮审核，产出勘误报告；实训6 另配一个离线可开的知识点讲解页 `05/知识点讲解_实训6.html`。

## 目录与工程

| 讲次 | 工程目录 | 内容 | 怎么跑 |
|---|---|---|---|
| 实训1 | `01/hello-vue` | 最小骨架（建工程） | `cd 01/hello-vue && npm install && npm run dev` |
| 实训2 | `02/vue-syntax` | Vue 基本语法演示 | `cd 02/vue-syntax && npm install && npm run dev` |
| 实训3+4 | `03/element-plus` | Element Plus 框架与组件 | `cd 03/element-plus && npm install && npm run dev`，`/home` 图标对比、`/comp` 组件页、`/comp-orig` 原版问题页 |
| 实训5 | `04/vue-router` | 路由跳转/嵌套/守卫/传参 | `cd 04/vue-router && npm install && npm run dev` |
| 实训6 | `05/admin-layout` | 后台管理页面（flex 布局 + el-menu + 嵌套路由 + 表格分页） | `cd 05/admin-layout && npm install && npm run dev`，看 `/manage/detail` |
| 实训7 | `07/xm-pro/springboot`（后端）+ `07/xm-pro/vue`（前端） | 新建 SpringBoot3 工程、Maven/编码/数据源配置、Result 统一返回、全局异常处理 | 见 `07/实验过程_实训7.md`；一条命令全量验证见下 |

> 实训7 的目录结构照讲义图1 摆：**`07/xm-pro` 是项目根**，`springboot`（后端）和 `vue`（前端）是它下面两个文件夹，`.idea` 也在这一层。**IDEA 请打开 `07\xm-pro` 这一层**，一个窗口就能同时看到后端和前端两个模块（讲义图2 的效果）；打开 `springboot` 子目录只能看到后端，和讲义图不一致。

每个前端工程都 `npm run build` 编译通过，并用 Edge 无头截图留档（各章 `演示截图/`）。

> **⚠️ 用 IDEA 打开哪一层，两讲答案相反，别搞混**：
>
> | 讲次 | 工程 | IDEA 打开这一层 | 为什么 |
> |---|---|---|---|
> | 实训1~6 | `01/hello-vue` … `05/admin-layout` | **工程目录本身**（如打开 `05\admin-layout`） | 这时只有前端 |
> | 实训7 | `07/xm-pro` | **父目录 `xm-pro`** | 讲义图2 要求左边同时列出 `springboot` 和 `vue` |
>
> 实训1 讲义写"不是选父目录 `xm-pro`"、实训7 讲义图2 又要求打开 `xm-pro`，两处并不矛盾——是课程推进到后端后工程根变了。详见 `07/实验过程_实训7.md` 的"附8 第 9 条"。

## 实训7：后端 SpringBoot3（含一键验证）

后端工程在 `07/xm-pro/springboot`，配套前端在 `07/xm-pro/vue`（实训6 的后台管理页面，本讲不动它）。**环境已跑通实测**：Spring Boot 3.5.16 + JDK 21 + **Maven 3.8.1（与讲义同版本）** + MySQL 8.0.43。

**在 IDEA 里怎么跑**（详见 `07/实验过程_实训7.md` 的"附-1"）：IDEA 打开 `D:\course\Javaweb\07\xm-pro` → 等 Maven 加载完 → 点 `SpringbootApplication` 左侧绿三角（或右键 Run）→ 控制台出现 `Started SpringbootApplication` 后访问 <http://localhost:8080/hello>。三种启动方式与启动成功判据都对照讲义图 27、图 30 写全了。

完整实验过程、讲义逐条对照、以及踩到的坑（包路径错位、@ResponseBody 中文 ISO-8859-1、MySQL 8 缺 `allowPublicKeyRetrieval` 报错、8080 端口被孤儿进程占用、**两份 settings.xml 打架导致 Maven 依赖加载不出来**）都在 **`07/实验过程_实训7.md`**。

> Maven 本机只留一份 **3.8.1**（与讲义同版本），本地仓库 `D:\software\apache-maven-3.8.1\repo`。踩过的一个隐蔽坑：**`~\.m2\settings.xml`（用户级）优先于 `<MavenHome>\conf\settings.xml`**，只改后者不生效；另外 3.8.1 起默认拦截 http 仓库，阿里云镜像必须写 https。旧的 3.9.16/3.9.9 及各自缓存已清掉（约 193 MB）——清理前用空仓库做过完整重下载验证，确认不依赖任何旧缓存。

一键端到端验证（自动检查环境 → `mvn clean package` → 起服务 → 打 5 个接口并按字节校验中文是否 UTF-8 → 杀进程树收尾）：

```powershell
powershell -ExecutionPolicy Bypass -File "D:\course\Javaweb\07\_verify_lab7.ps1" -ProjectPath "D:\course\Javaweb\07\xm-pro\springboot"
```

实测第四轮 **12 项全部通过**，接口返回与报告一致：`/hello`→200 带中文、`/number`→500 系统错误、`/map`→原生 JSON、`/result`→200 包装类、`/business`→400 业务异常。


## 六讲的递进关系

老师的讲义是**同一个工程一路改下来**的，不是六个独立项目：实训3 开头就写"在Idea中，切换到命令行，进入vue目录下"，实训5 开头写"以前我们能访问Home页面，也就是 http://localhost:5173/，主要是在index.js中定义了Home.vue这个路由"，实训6 的路由表里又原样带着实训5 的 `/home`、`/test`。

本仓库为了每讲能单独跑，按主题拆成了独立工程，但**每个工程都补齐了它在该讲应有的前置状态**，链条如下：

| 讲次 | 新增能力 | 继承自上一讲的东西 | 核对结果 |
|---|---|---|---|
| 实训1 | 建工程、目录骨架、global.css | 无（起点） | 已核对，`main.js` 用 `@/assets/global.css`、路由 `path:'/'` 指向 Home，与讲义图一致 |
| 实训2 | 插值、ref/reactive、v-model、v-if、v-for、@click、v-bind、onMounted | 工程骨架、Home.vue、global.css | 曾缺 `assets/global.css` 与 `logo.svg`，已补 |
| 实训3 | 装 Element Plus、中文包、图标全局注册 | 工程骨架、global.css | 曾缺 global.css 引入，已补 |
| 实训4 | 8 组组件用法 | 实训3 装好的 Element Plus 与图标 | 已核对；另按作业要求补了真弹窗与本地图 |
| 实训5 | 路由定义、跳转、重定向、传参、嵌套、守卫 | 实训1 的 Home.vue 与路由、**实训3 的 Element Plus** | 曾整个缺 EP（讲义的传参按钮就是 `<el-button>`），已装上并把跳转演示按讲义放回 Home.vue |
| 实训6 | flex 后台布局、el-menu、嵌套路由落地、表格分页 | 实训3 的 EP 与图标、实训5 的 `/home`、`/test` 路由 | 已核对，链条完整 |

有一处依赖关系值得单独记：实训5 讲义里的跳转按钮写的是 `<el-button type="primary" @click="$router.push(...)">`，也就是说**实训5 其实依赖实训3**，不是只依赖实训1。原来 `04/vue-router` 没装 element-plus，那个示例贴进去只会渲染成一个浏览器原生灰按钮，现已装好并对齐讲义写法。

另外 `04/vue-router` 的 `App.vue` 之前为了演示加了个顶部导航条，而讲义实训1 第 5 条明确要求"精简 App.vue，只保留 RouterView"、实训5 又要求"在 Home.vue 中，写上跳转语句"。现已改回：`App.vue` 只有 `<RouterView />`，跳转入口全部挪进 `Home.vue`。


## 答题用：实验过程文档

作业 2、3、4、5 这四次得分是 0 分，卷面上只有小标题、没有"三、实验过程"的内容。已按作业的每一条小点补写好可直接搬进答题框的文档：

| 讲次 | 文档 |
|---|---|
| 实训1 | `01/实验过程_实训1.md` |
| 实训2 | `02/实验过程_实训2.md` |
| 实训3 | `03/实验过程_实训3.md` |
| 实训4 | `03/实验过程_实训4.md` |
| 实训5 | `04/实验过程_实训5.md` |
| 实训6 | `05/构建验证_实训6.md` 与 `05/知识点讲解_实训6.html`（第 5 节就是"实验过程怎么写"） |

每份文档的结构：环境版本、逐条小点的操作步骤与代码、观察结果、关键命令、该配哪张截图、以及"遇到的问题及解决方法"。截图都在各章 `演示截图/`，图片路径已按文档所在目录写成相对路径，本地预览可直接显示。

## 讲义勘误汇总（按严重度）

详细版见各章 `讲义勘误_实训N.md`。

### 严重（会导致功能不对）
- 实训6：Manage.vue 整份代码里没有 `<router-view />`，嵌套路由只配了一半。实测 `/manage` 与 `/manage/detail` 两张截图完全相同，Detail.vue 从未渲染。改法：右侧内容区放 `<router-view />`。
- 实训6：子菜单"管理员信息""普通用户信息"两项 `<el-menu-item>` 没有 `index`。实测点击后地址栏不变、页面无反应，控制台两条 `Missing required prop: "index"`。
- 实训5：路由守卫 `document.title = to.meta.title` 对没有 `meta` 的 `/home`、`/test` 会把标签标题设成字符串 "undefined"。已在真实工程运行复现。改法：`to.meta.title || '默认标题'`。实训6 讲义又照抄了同一行。

### 一般（写法错误或不生效）
- 实训6：管理首页、个人信息、退出登录三项菜单 `index` 都写 `/manage`，实测停在 `/manage` 时三条同时高亮（一个 index 对应一个路径才会单项高亮）。
- 实训6：讲义正文代码头部写"网站 logo""后台用户"，与讲义自己第 2 页目标界面图（"中药材后台管理系统" + 头像 + "系统管理员"）不一致。
- 实训6：`total: 50` 而 `tableData` 只有 9 条、未按 `pageNum` 切片。实测点第 2 页页码变了但 9 行数据不变（讲义只要求分页 UI，故不算写错）。
- 实训3：`color="#6666"` 是 4 位十六进制，被当半透明灰，图标发淡。应为 `#666666`。
- 实训4：轮播 `interval="3000"` 传字符串，Number 属性应写 `:interval="3000"`（与讲义自己"数字要加冒号"的规则自相矛盾）。
- 实训4：分页 `:data="tableData"` 未按页切片，翻页与改每页条数都无效。
- 实训4：分页 `:background` 应为裸属性 `background`（带冒号会绑到未定义变量，无底色）。
- 实训4：`pageSize4 = ref(100)` 不在 `:page-sizes="[5,10,15,50]"` 里，初值不自洽。
- 实训4：`show-progress` 被解释成"加载进度"，实为预览时显示图片序号（如 3/11，源码已证）。
- 实训4：小节标题"十一、弹窗"下没有 `el-dialog`，讲的是表格操作列，名不副实。
- 实训2：`v-for` 未绑定 `:key`（编辑器告警）。
- 实训1：Node 20.15.1 低于 `create-vue` 要求的 `^20.19 || >=22.12`，会出 EBADENGINE 警告。
- 实训1：`create vue@3.21.0` 实跑出的问答界面与讲义截图不一致。
- 实训1：正文称 App.vue 是"入口文件"，准确说入口是 `main.js`，App.vue 是根组件。

### 提示（表述/规范问题，不影响运行）
- 实训1：镜像 `http://registry.npmmirror.com` 建议用 `https`；`3.21.0` 是脚手架版本不是 Vue 版本；JDK 本讲用不到。
- 实训1：第四部分第 8 条"重新运行一下项目，可以得到下图"，讲义那张图是 **IDEA 运行面板里点绿色重启按钮**的界面截图，不是浏览器页面。写作业这题的截图时别截错。
- 实训2：onMounted 说成"页面元素完全加载后触发"不严谨（是组件挂载完成，非所有资源加载完）。
- 实训3：`app.use(ElementPlus)` 须在 `createApp` 之后；图标注册注释"组件实例"措辞不准（是组件定义）。
- 实训4：`:total=tableData.length` 缺引号（能解析，风格问题）；示例用外部图床日后易 404；列宽 `100px` 与 `180` 写法不一致；Checkbox 组用法与版本强相关；datetime 注释从"日期"复制没改；`class="mt-2"` 未装 Tailwind 无效。
- 实训5：传参示例 `id:2` 与说明文字 `id=123` 对不上；"另一种传参方式"表述不完整（未提 params）；"页面代码一次性加载完"与懒加载略有出入；meta 定义措辞不准。
- 实训6：守卫用第三个参数 `next()`，本机 vue-router 5.3.1 已将其废弃（每次导航控制台报 `VUE_ROUTER_R0025`），新代码建议改写为 `return`；`detail` 子路由是 children 里唯一没配 meta 的一条，后果是标签标题不分页（不是 undefined）。

## 审核过程中主动撤销/排除的判断（诚实记录）
- 实训6：一度按"detail 没配 meta 会导致标签显示 undefined"记为错误。真实运行测得 `/manage/detail` 标题是"后台管理"——vue-router 会合并父子级 meta，子级没写就继承父级。该条下调为"标题不分页"，undefined 只在整条链都没有 meta 的顶级路由上出现。
- el-icon 的 `style="top:4px"`：一度被列为"无效样式"，经查 `element-plus/theme-chalk/el-icon.css`，`.el-icon` 是 `position:relative`，`top` 生效，该条已撤销。
- `vue-router: ^5.0.1`：有代理判为"应为 4.x"，经核 npm 当前 vue-router 最新即 5.3.1，讲义版本正确，未列为错误。

## 验证方法
三轮：逐张读截图核代码、逐段读正文核文字描述、多代理交叉验证并回 Element Plus 源码与真实运行复核。关键项（路由守卫 undefined、Node 版本 EBADENGINE、分页不切片）均以实际运行或源码为准。
