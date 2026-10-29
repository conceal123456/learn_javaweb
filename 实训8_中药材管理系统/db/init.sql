-- =====================================================
-- 中药材管理系统 数据库初始化脚本
-- 数据库：`xm-pro`   字符集：utf8mb4
-- 使用方式：mysql -uroot -p123456 < init.sql
-- =====================================================

DROP DATABASE IF EXISTS `xm-pro`;
CREATE DATABASE `xm-pro` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `xm-pro`;

-- -----------------------------------------------------
-- 1. 中药材表
-- -----------------------------------------------------
CREATE TABLE herb (
    id            BIGINT       PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    name          VARCHAR(50)  NOT NULL                   COMMENT '药材名称',
    alias         VARCHAR(50)  DEFAULT NULL               COMMENT '别名',
    origin        VARCHAR(100) DEFAULT NULL               COMMENT '产地',
    price         DECIMAL(10,2) DEFAULT 0.00              COMMENT '单价（元/公斤）',
    stock         INT          DEFAULT 0                  COMMENT '库存（公斤）',
    produce_date  DATE         DEFAULT NULL               COMMENT '生产日期',
    shelf_life    VARCHAR(20)  DEFAULT '24个月'            COMMENT '保质期',
    image         VARCHAR(255) DEFAULT NULL               COMMENT '图片地址',
    description   VARCHAR(500) DEFAULT NULL               COMMENT '功效描述',
    status        TINYINT      DEFAULT 1                  COMMENT '状态：1上架 0下架',
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_herb_name (name),
    KEY idx_herb_origin (origin)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '中药材信息表';

-- -----------------------------------------------------
-- 2. 系统用户表
-- -----------------------------------------------------
CREATE TABLE sys_user (
    id          BIGINT      PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    username    VARCHAR(50) NOT NULL                   COMMENT '登录账号',
    password    CHAR(64)    NOT NULL                   COMMENT 'SHA-256 密码摘要',
    nickname    VARCHAR(50) DEFAULT NULL               COMMENT '昵称',
    role        VARCHAR(20) DEFAULT 'USER'             COMMENT '角色：ADMIN管理员 USER普通用户',
    phone       VARCHAR(20) DEFAULT NULL               COMMENT '手机号',
    status      TINYINT     DEFAULT 1                  COMMENT '状态：1启用 0禁用',
    create_time DATETIME    DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    UNIQUE KEY uk_user_name (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '系统用户表';

-- -----------------------------------------------------
-- 3. 初始化数据
-- -----------------------------------------------------
-- 演示账号：admin / 123456（管理员），user / 123456（普通用户）
-- 密码为 SHA-256("123456")，仅用于教学演示
INSERT INTO sys_user (username, password, nickname, role, phone, status) VALUES
('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '系统管理员', 'ADMIN', '13800000001', 1),
('user',  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '普通用户',   'USER',  '13800000002', 1);

INSERT INTO herb (name, alias, origin, price, stock, produce_date, shelf_life, description, status) VALUES
('霍山石斛', '米斛',     '安徽六安霍山县', 1280.00, 320, '2026-03-12', '24个月', '益胃生津，滋阴清热。用于热病津伤、口干烦渴。', 1),
('亳白芍',   '白芍',     '安徽亳州谯城区',  86.50, 1580, '2026-04-02', '36个月', '养血调经，敛阴止汗，柔肝止痛。', 1),
('宣木瓜',   '皱皮木瓜', '安徽宣城宣州区',  42.00, 960, '2026-02-18', '24个月', '平肝舒筋，和胃化湿。用于湿痹拘挛、腰膝关节酸重。', 1),
('滁菊',     '滁州贡菊', '安徽滁州全椒县',  168.00, 640, '2026-05-06', '18个月', '疏风散热，明目平肝，清热解毒。', 1),
('茯苓',     '云苓',     '安徽安庆岳西县',  56.00, 2100, '2026-01-20', '36个月', '利水渗湿，健脾宁心。用于水肿尿少、脾虚食少。', 1),
('山茱萸',   '山萸肉',   '安徽黄山歙县',   210.00, 480, '2026-03-28', '24个月', '补益肝肾，收涩固脱。用于眩晕耳鸣、腰膝酸痛。', 1),
('灵芝',     '赤芝',     '安徽池州石台县',  460.00, 260, '2026-04-15', '24个月', '补气安神，止咳平喘。用于心神不宁、失眠心悸。', 1),
('半夏',     '三叶半夏', '安徽阜阳界首市',  98.00, 730, '2026-05-22', '24个月', '燥湿化痰，降逆止呕，消痞散结。', 1),
('断血流',   '荫风轮',   '安徽六安金寨县',  62.00, 390, '2026-02-26', '24个月', '收敛止血。用于崩漏、尿血、鼻衄、牙龈出血。', 1),
('黄精',     '鸡头黄精', '安徽池州青阳县',  135.00, 520, '2026-03-05', '36个月', '补气养阴，健脾润肺，益肾。', 1),
('桔梗',     '苦桔梗',   '安徽亳州涡阳县',  74.00, 880, '2026-04-19', '24个月', '宣肺利咽，祛痰排脓。用于咳嗽痰多、咽痛音哑。', 1),
('丹参',     '紫丹参',   '安徽亳州蒙城县',  58.00, 1120, '2026-05-11', '24个月', '活血祛瘀，通经止痛，清心除烦。', 0);
