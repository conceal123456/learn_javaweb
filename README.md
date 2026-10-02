# JavaWeb 课程前端实训（Vue3）学习与勘误

本仓库记录《JavaWeb》课程 5 个前端实训的学习成果：按老师讲义逐讲用 `npm create vue` 建了可运行的独立工程，配运行截图；并对 5 份讲义做了"代码层 + 文字层 + 多代理交叉验证"三轮审核，产出勘误报告。

## 目录与工程

| 讲次 | 工程目录 | 内容 | 怎么跑 |
|---|---|---|---|
| 实训1 | `01/hello-vue` | 最小骨架（建工程） | `cd 01/hello-vue && npm install && npm run dev` |
| 实训2 | `02/vue-syntax` | Vue 基本语法演示 | `cd 02/vue-syntax && npm install && npm run dev` |
| 实训3+4 | `03/element-plus` | Element Plus 框架与组件 | `cd 03/element-plus && npm install && npm run dev`，`/home` 图标对比、`/comp` 组件页、`/comp-orig` 原版问题页 |
| 实训5 | `04/vue-router` | 路由跳转/嵌套/守卫/传参 | `cd 04/vue-router && npm install && npm run dev` |

每个工程都 `npm run build` 编译通过，并用 Edge 无头截图留档（各章 `演示截图/`）。

## 讲义勘误汇总（按严重度）

详细版见各章 `讲义勘误_实训N.md`。

### 严重（会导致功能不对）
- 实训5：路由守卫 `document.title = to.meta.title` 对没有 `meta` 的 `/home`、`/test` 会把标签标题设成字符串 "undefined"。已在真实工程运行复现。改法：`to.meta.title || '默认标题'`。

### 一般（写法错误或不生效）
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
- 实训2：onMounted 说成"页面元素完全加载后触发"不严谨（是组件挂载完成，非所有资源加载完）。
- 实训3：`app.use(ElementPlus)` 须在 `createApp` 之后；图标注册注释"组件实例"措辞不准（是组件定义）。
- 实训4：`:total=tableData.length` 缺引号（能解析，风格问题）；示例用外部图床日后易 404；列宽 `100px` 与 `180` 写法不一致；Checkbox 组用法与版本强相关；datetime 注释从"日期"复制没改；`class="mt-2"` 未装 Tailwind 无效。
- 实训5：传参示例 `id:2` 与说明文字 `id=123` 对不上；"另一种传参方式"表述不完整（未提 params）；"页面代码一次性加载完"与懒加载略有出入；meta 定义措辞不准。

## 审核过程中主动撤销/排除的判断（诚实记录）
- el-icon 的 `style="top:4px"`：一度被列为"无效样式"，经查 `element-plus/theme-chalk/el-icon.css`，`.el-icon` 是 `position:relative`，`top` 生效，该条已撤销。
- `vue-router: ^5.0.1`：有代理判为"应为 4.x"，经核 npm 当前 vue-router 最新即 5.3.1，讲义版本正确，未列为错误。

## 验证方法
三轮：逐张读截图核代码、逐段读正文核文字描述、多代理交叉验证并回 Element Plus 源码与真实运行复核。关键项（路由守卫 undefined、Node 版本 EBADENGINE、分页不切片）均以实际运行或源码为准。
