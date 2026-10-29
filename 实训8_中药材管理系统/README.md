# 实训8 中药材管理系统

在老师实训7 的 SpringBoot 工程和老师 `实训6_后台管理页面` 的原版后台页面上，继续实现“内容展示”页的全部按钮功能：

- 药材条件查询、分页
- 新增、编辑、单条删除、批量删除
- Excel 导入、Excel 导出、导入模板下载
- 用户管理（管理员 / 普通用户）
- MyBatis + MySQL 真实读写

前端沿用老师 `实训6_后台管理页面\工程\admin-layout` 的原版布局和样式（蓝色顶栏、左侧菜单、`Detail.vue` 的查询/按钮/表格/分页结构都没改），只把假数据换成了接口数据；`实训7` 里那份 `Manage.vue` 被替换过个人姓名/学号，本项目没有采用那版。

## 快速启动

```powershell
# 1. 建库（MySQL 需要先启动）
mysql -uroot -p123456 --default-character-set=utf8mb4 < "D:\course\Javaweb\实训8_中药材管理系统\db\init.sql"

# 2. 后端
cd "D:\course\Javaweb\实训8_中药材管理系统\springboot"
mvn -B -DskipTests clean package
java -jar target\springboot-0.0.1-SNAPSHOT.jar

# 3. 前端（另开一个终端）
cd "D:\course\Javaweb\实训8_中药材管理系统\vue"
npm install
npm run dev
```

访问：<http://localhost:5173/manage/detail>

后端接口：<http://localhost:8080/api/herb/page?pageNum=1&pageSize=10>

## 目录

```
db/init.sql        建库建表 + 12 条药材 + 2 个用户
springboot/        Spring Boot 3.5.16 + MyBatis 3.0.5 + MySQL + POI
vue/               Vue 3 + Element Plus + axios（老师原版页面）
docs/              开发文档 + 截图
```

## 文档

完整的开发过程、代码说明、接口文档和逐项截图在：

- [docs/实训8_中药材管理系统_开发文档.md](docs/实训8_中药材管理系统_开发文档.md)

## 默认账号

| 账号 | 密码 | 角色 |
|---|---|---|
| admin | 123456 | 管理员 |
| user | 123456 | 普通用户 |

## 说明

- 老师前端没有登录页，本项目也没有加登录页，接口直接可用。
- 商品 / 订单菜单在老师原工程中就是占位页，本次保持原样。
- 数据库名按讲义使用 `xm-pro`；在 SQL 中要写成 `` `xm-pro` ``。
