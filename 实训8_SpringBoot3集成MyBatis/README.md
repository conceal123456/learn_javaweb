# 实训8：Spring Boot 3 集成 MyBatis

今天实训内容的整理版本：用 Spring Boot 3 + MyBatis + MySQL 完成员工表的查询、新增、修改、删除，并用 `Result` 统一返回结果。

## 技术栈

- Java 21
- Spring Boot 3.5.16
- MyBatis 3.0.5（`mybatis-spring-boot-starter`）
- MySQL 8
- PageHelper 2.1.0（分页）
- Maven

## 目录结构

```text
实训8_SpringBoot3集成MyBatis/
├─ db/
│  └─ init.sql                 # 建库、建表、3 条示例数据
├─ springboot/
│  ├─ pom.xml
│  └─ src/main/
│     ├─ java/com/example/
│     │  ├─ SpringbootApplication.java
│     │  ├─ common/Result.java
│     │  ├─ entity/Employee.java
│     │  ├─ mapper/EmployeeMapper.java
│     │  ├─ service/EmployeeService.java
│     │  ├─ controller/EmployeeController.java
│     │  └─ exception/GlobalExceptionHandler.java
│     └─ resources/
│        ├─ application.yml
│        └─ mapper/EmployeeMapper.xml
└─ requests.http               # IDEA HTTP Client 测试请求
```

## 快速开始

### 1. 初始化数据库

确保本机 MySQL 已启动，然后执行：

```powershell
mysql -uroot -p123456 --default-character-set=utf8mb4 < "D:\course\Javaweb\实训8_SpringBoot3集成MyBatis\db\init.sql"
```

脚本会创建 `xm-pro` 数据库和 `employee` 表，并插入 3 条示例数据。重复执行不会重复插入。

> 注意：数据库名是 **`xm-pro`（中划线）**。如果写成 `xm_pro`（下划线），MySQL 会报 `Table 'xm_pro.employee' doesn't exist`。

### 2. 修改数据库账号

`springboot/src/main/resources/application.yml` 默认使用：

```yaml
username: ${DB_USERNAME:root}
password: ${DB_PASSWORD:123456}
```

如果你的 MySQL 密码不是 `123456`，改成自己的密码，或者设置环境变量 `DB_USERNAME` / `DB_PASSWORD`。

### 3. 启动后端

用 IDEA 打开 `springboot` 目录，运行 `SpringbootApplication`；或者在 `springboot` 目录执行：

```powershell
mvn spring-boot:run
```

启动成功后访问：<http://localhost:8080/employee/selectAll>

## 接口一览

| 方法 | 地址 | 说明 |
|---|---|---|
| GET | `/employee/selectAll` | 查询全部员工 |
| GET | `/employee/selectById/{id}` | 按 id 查询（路径参数） |
| GET | `/employee/selectOne?id=1` | 按 id 查询（`@Select` 注解方式） |
| GET | `/employee/selectPage?pageNum=1&pageSize=2` | 分页查询 |
| POST | `/employee/insert` | 新增员工，JSON 请求体 |
| PUT | `/employee/update` | 修改员工，JSON 请求体，必须带 id |
| DELETE | `/employee/delete/{id}` | 按 id 删除 |

统一返回格式：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": {}
}
```

## 测试示例

### 新增

```http
POST http://localhost:8080/employee/insert
Content-Type: application/json
```

```json
{
  "name": "王五",
  "sex": "男",
  "no": "100004",
  "age": 24,
  "description": "新员工测试"
}
```

返回：

```json
{"code":"200","msg":"请求成功","data":"新增成功"}
```

### 修改

```http
PUT http://localhost:8080/employee/update
Content-Type: application/json
```

```json
{
  "id": 4,
  "name": "王五",
  "sex": "男",
  "no": "100004",
  "age": 25,
  "description": "修改后的描述"
}
```

### 删除

```http
DELETE http://localhost:8080/employee/delete/4
```

### 查询验证

```http
GET http://localhost:8080/employee/selectAll
GET http://localhost:8080/employee/selectById/4
```

## 常见问题

1. **浏览器打开 `/employee/insert` 报 405**
   新增接口是 `POST`，浏览器地址栏发的是 `GET`。请用 Apifox、Postman、IDEA 的 `requests.http` 或 curl 发 POST 请求。

2. **启动报 `Table 'xm_pro.employee' doesn't exist`**
   `application.yml` 里的数据库名写成了 `xm_pro`，应改成 `xm-pro`，或执行 `db/init.sql` 建表。

3. **改了代码但接口还是旧的 / 404**
   Spring Boot 没有热部署，改完 Java 代码要重新启动项目。

4. **`description` 在控制台显示 `<<BLOB>>`**
   MyBatis 的 `StdOutImpl` 对 `TEXT` 类型会这样显示，不影响接口返回的 JSON 字符串。
