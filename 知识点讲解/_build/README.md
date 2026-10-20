# 知识点讲解 · 站点构建手册

> 一句话：**改 `.md` 内容 → 跑一条命令 → 全站重建。**
> 生成器是唯一的真相来源，`知识点讲解/*.html` 和 `assets/style.css` 都是产物，别手改。

---

## 1. 一条命令重建全站

在**仓库根目录** (`D:\course\Javaweb`) 执行：

```powershell
python 知识点讲解\_build\build_site.py
```

正常输出（末几行）：

```
[OK] 每个知识点都齐备 7 块

[OK] 语法高亮：所有代码块染色后文本与原文逐字一致

样式表：assets/style.css（116.4 KB，由 src/css 拼接）
生成页面：index.html + 7 个讲解页
搜索索引：109 条

[OK] 数量校验：109 知识点 / 232 代码块 / 109 问答
```

最后这三条 `assert` 是硬闸门：知识点不是 109、代码块不是 232、折叠问答不是 109，
脚本会直接 `AssertionError` 退出，**不会写出半成品**。

### 它写了哪些文件

| 产物 | 来源 |
|---|---|
| `知识点讲解/index.html` | 模板在 `build_site.py` 的 `write_index()` |
| `知识点讲解/实训1..7.html` | 模板在 `write_lab_page()` |
| `知识点讲解/assets/style.css` | **`_build/src/css/*.css` 按文件名排序拼接** |
| `知识点讲解/assets/ids.js` | 109 个知识点 id（进度用） |
| `知识点讲解/assets/search-index.js` | 全文检索索引（约 520KB，首次搜索才加载） |

**不由生成器产出**：`assets/app.js`（动效脚本，单独维护）、`assets/art/**`（公有领域中国画）。

---

## 2. 怎么改内容

### 2.1 改讲解正文

内容源是 7 份 Markdown，**只改它们，不要改 html**：

```
实训1_软件安装及创建Vue项目\知识点精讲_实训1.md
实训2_Vue基本语法\知识点精讲_实训2.md
实训3_前端ElementPlus框架\知识点精讲_实训3.md
实训4_Element-Plus组件的使用\知识点精讲_实训4.md
实训5_Vue-Router实现路由跳转\知识点精讲_实训5.md
实训6_后台管理页面\知识点精讲_实训6.md
实训7_新建SpringBoot项目\知识点精讲_实训7.md
```

Markdown 里有几条**约定俗成的语法**，生成器靠它们认结构：

```markdown
# 实训N 知识点精讲：标题            ← 页面 <title>
> **讲义原文**：…                   ← 头部 chips（h1 之前的连续引用行）
## 2. 知识点精讲                     ← 章节大标题
### 2.1 某个知识点的名字              ← 一个知识点（编号会被拆出来做序号印章）

**① 讲义怎么说** —— 正文             ← 七块之一，块名决定视觉语言
**② 一句话讲透** —— 正文
**③ 示例代码**                       ← 后面紧跟 ``` 代码块
**④ 逐行拆解** —— 正文
**⑤ 在你仓库里** —— 正文
**⑥ 常见坑** —— 正文
**⑦ 自测**  + <details><summary>问</summary>答</details>
```

- **块名必须一字不差**（`讲义怎么说 / 一句话讲透 / 示例代码 / 逐行拆解 / 在你仓库里 / 常见坑 / 自测`）；
  编号 ①②③ 可以省略，生成器会按块名补回来（`NAME2KEY`）。
- 每个知识点**必须正好 7 块**，否则生成器会打印 `[!] 七块不全` 并列出是哪一条。
- 代码块用围栏 + 语言标注：```` ```vue ```` / `js` / `java` / `bash` / `xml` / `json` / `yml` /
  `css` / `sql` / `text`。语言决定高亮规则。
- 表格用 GFM 表格；`\|` 是转义竖线（表格里的 `netstat \| findstr` 就是这么写的）。
- 问答用 `<details><summary>问题</summary>答案</details>`。

改完**必须重跑生成器**，否则页面还是旧的。

### 2.2 改样式

样式不是一个大文件，是 `_build/src/css/` 下的 9 个分片，按文件名排序拼接：

| 分片 | 管什么 |
|---|---|
| `00-tokens.css` | **设计令牌**（颜色/字号/间距/缓动）+ 重置 + 基础排版 |
| `10-chrome.css` | 纸纹、顶栏、侧栏、页脚、回顶、遮罩 |
| `20-hero.css` | 首页首屏「卷首」（立轴、木轴、落款印、墨梅） |
| `30-home.css` | 首页区块（长卷/引言/数据志/时间轴/七讲卡/路径/勘误/图例/搜索） |
| `40-lab.css` | 讲解页卷首、册页索引、知识点卡、卷尾落款 |
| `50-blocks.css` | **知识点七块 + 代码块 + 表格 + 折叠问答** |
| `55-overrides.css` | 收尾精修层（墨色天幕、安全边距、七块差异化加强） |
| `60-motion.css` | 渐入、逐字、花瓣、命令面板、toast、阅读进度条、reduced-motion |
| `70-responsive.css` | 1920 / 1440 / 1280 / 1080 / 980 / 768 / 560 / 380 / 横屏 |
| `80-print.css` | 打印（A4 讲义版） |

**改完任意分片都要重跑生成器**，`assets/style.css` 才会更新。

> 不要直接编辑 `assets/style.css` —— 下次重建会被整片覆盖掉。

---

## 3. 设计 token 速查

全部定义在 `00-tokens.css` 的 `:root`，深色主题在 `[data-theme="dark"]` 里同名覆盖。
**写新样式时只用变量，不要写死颜色。**

### 3.1 颜色

| 变量 | 浅（宣纸） | 深（夜色拓片） | 用途 |
|---|---|---|---|
| `--bg` | `#f7f1e6` 宣纸 | `#100d0b` | 页面底色 |
| `--bg-2` / `--bg-3` | `#f1e9d9` / `#e9dfca` | `#16110f` / `#1c1714` | 次级底色 |
| `--surface` / `--surface-2` | `#fffdf7` / `#faf5e9` | `#191412` / `#1f1916` | 卡片 / 块底 |
| `--fg` | `#14110f` 墨 | `#f3ead9` | 正文主色 |
| `--fg-2` … `--fg-5` | `#2b2521` → `#746a59` | `#e2d7c3` → `#8a8172` | 逐级变淡（fg-5 仍满足 AA） |
| `--line` / `-2` / `-3` | 墨色 15% / 8% / 4% | 纸色 15% / 8.5% / 4% | 分割线 |
| `--cinnabar` | `#b23a2f` 朱砂 | `#e2685a` | 主强调、警示、印章 |
| `--azure` | `#2c5d73` 石青 | `#7cb4ca` | 次级强调、引文、路径 |
| `--gold` / `--gold-ink` | `#c9a227` / `#8a6c12` | `#e3c169` / `#e8c96e` | 烫金装饰 / 金色**文字**（用 ink 那个，对比度够） |
| `--jade` | `#47705a` | `#82b398` | 「学会了」、折叠问答 |
| `--wash-0…4` | 纸色 0/28/60/90/100% | 墨色同阶 | 图片"洗淡"层 |
| `--code-bg` / `--code-fg` | `#17130f` / `#e9dfca` | `#0c0a08` / `#efe5d0` | 代码"拓片"面板（**两套主题都深色**） |
| `--tk-k/f/s/n/c/a/t/p` | — | — | 语法高亮 8 色 |

### 3.2 字号 / 字体

```css
--f-song: "Source Han Serif SC","Noto Serif SC","Songti SC","STSong","SimSun",serif;  /* 标题 */
--f-sans: "Microsoft YaHei","PingFang SC","Source Han Sans SC",…;                     /* 正文 */
--f-mono: "Cascadia Mono","Consolas","JetBrains Mono",…;                              /* 代码 */
--f-kai:  "Kaiti SC","STKaiti","KaiTi",…;                                             /* 题跋（用得少） */

--t-hero: clamp(52px, 6.6vw, 118px);   /* 首页巨幅标题 */
--t-h1:   clamp(40px, 4.4vw, 76px);
--t-h2:   clamp(26px, 2.5vw, 42px);
--t-body: 16.5px;                       /* 正文，line-height 1.9 */
```

字体**全部走系统字体栈**，零外链、零 CDN。

### 3.3 尺寸 / 节奏

```css
--h-top: 64px;        /* 固定顶栏高度，所有 scroll-margin-top 都引用它 */
--w-side: 296px;      /* 左栏（≤1080 变抽屉） */
--w-max: 1720px;      /* 版心最大宽度 */
--pad-x: clamp(20px, 4.4vw, 76px);
--r-1…--r-4: 3 / 7 / 12 / 20px;
--ease: cubic-bezier(.22,.61,.36,1);
--ease-2: cubic-bezier(.16,1,.30,1);   /* 主入场曲线 */
```

### 3.4 七块的视觉语言（`data-k` 决定一切）

| 块 | 视觉 | 实现位置 |
|---|---|---|
| ① 讲义要点 | **朱砂竖线** + 宋体引文 + 大引号水印 | `50-blocks` + `55-overrides` |
| ② 核心讲解 | **上下金线**「榜」式，无侧栏，大字 + 首字下沉 | `55-overrides` |
| ③ 示例演示 | 无面板，直接是深色代码拓片（语言胶囊 + 行号 + 复制） | `50-blocks` |
| ④ 代码解读 | **藤黄竖线 + 数字悬挂列表**（01/02/03 色块） | `50-blocks` + `55-overrides` |
| ⑤ 工程对照 | **石青虚线框 + 斜纹底 + 等宽路径 chip** | `55-overrides` |
| ⑥ 易错提醒 | **朱砂警示条**（斜纹 + 右上「易错」角标 + 「坑」印 + `!` 圆点） | `50-blocks` |
| ⑦ 课堂思考 | **玉色印章式折叠**（问/答小印 + ＋→×） | `50-blocks` |

---

## 4. 本地验收（不碰公用 browser）

```powershell
node .extract\art\shoot.mjs
```

自建 headless Chrome（CDP，端口 9444），做两件事：

1. 截 8 张图到 `.extract/art/final-*.png`（浅/深主题、1280/375/768/1920、首页/讲解页/知识点卡）；
2. 跑 **8 页 × 4 宽度 = 32 格的横向溢出矩阵**，打印 `overflow cells: 0 / 32`。

其它可复用的只读检查（由 art-qa 维护，别改）：
`.extract\qa\contrast.mjs`（对比度）、`.extract\qa\links.py`（断链）、`.extract\qa\keyboard.mjs`（键盘可达）。

---

## 5. 硬约束（改任何东西之前先看这条）

1. **完全离线**：不许出现 CDN / 外链字体 / 外链图片 / 外链 JS。字体只用系统栈。
2. **内容零丢失**：正文文本必须是旧版页面的**超集**；109 知识点 / 232 代码块 / 109 问答一个不能少
   （生成器末尾的 `assert` 会拦住你）。
3. **`assets/app.js` 不归生成器管**，也不许为了样式去改它。
4. **DOM 契约**见 `_build/DESIGN-CONTRACT.md`：带 `id` 的元素、`.rv/.kp/.toc/.code/.copy` 等类名、
   状态类（`.kp.done` / `.toc a.on` / `#scrim.on` / `body.leaving` …）**一个都不能改名**，JS 靠它们工作。
5. **不要给 `.shell` 加 `z-index`** —— 会形成 stacking context，把移动端抽屉 `#side` 锁在 `#scrim` 下面。
6. **不要给 `body`/`html` 设 `overflow-x:hidden`** —— 会破坏 `position:sticky`。用的是 `overflow-x:clip`。
7. 所有装饰层（墨梅、立轴木轴、印章、水印、竖排题跋）都必须 `pointer-events:none`，
   不许盖住按钮和链接。

---

## 6. 目录结构

```
知识点讲解/
├─ index.html               ← 生成物
├─ 实训1.html … 实训7.html    ← 生成物
├─ assets/
│  ├─ style.css             ← 生成物（由 src/css 拼接）
│  ├─ app.js                ← 手写（动效，别被生成器覆盖）
│  ├─ ids.js                ← 生成物
│  ├─ search-index.js       ← 生成物
│  └─ art/                  ← 公有领域中国画 + 墨梅/荷花 PNG
└─ _build/
   ├─ build_site.py         ← 唯一入口
   ├─ DESIGN-CONTRACT.md    ← DOM 冻结契约
   ├─ README.md             ← 本文件
   └─ src/css/*.css         ← 9 个样式分片（真正的源）
```
