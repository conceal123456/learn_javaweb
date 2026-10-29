-- 实训8：Spring Boot 3 集成 MyBatis
-- 数据库名是 xm-pro（中划线），SQL 中必须用反引号包起来
CREATE DATABASE IF NOT EXISTS `xm-pro`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `xm-pro`;

CREATE TABLE IF NOT EXISTS `employee` (
    `id`          INT         NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`        VARCHAR(50)          DEFAULT NULL COMMENT '姓名',
    `sex`         VARCHAR(10)          DEFAULT NULL COMMENT '性别',
    `no`          VARCHAR(20)          DEFAULT NULL COMMENT '工号',
    `age`         INT                  DEFAULT NULL COMMENT '年龄',
    `description` TEXT                 DEFAULT NULL COMMENT '描述',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT ='员工表';

-- 只有表为空时才插入示例数据，重复执行不会产生重复记录
INSERT INTO `employee` (`name`, `sex`, `no`, `age`, `description`)
SELECT t.name, t.sex, t.no, t.age, t.description
FROM (
    SELECT 'thc' AS name, '男' AS sex, '100001' AS no, 18 AS age, '勤学钻研，自强不息' AS description
    UNION ALL
    SELECT 'zhangsan', '男', '100002', 19, '积极开拓，敢于创新'
    UNION ALL
    SELECT 'lisi', '女', '100003', 23, '做事细致严谨'
) t
WHERE NOT EXISTS (SELECT 1 FROM `employee`);
