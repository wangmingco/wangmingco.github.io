---
category: 杂文
title: 对账
date: 2022-06-01
---

> 以下方案基于 `10.3.35-MariaDB MariaDB Server`

创建表, 分别创建一个业务交易表和一个三方交易表。最终对账也是对这俩个表的数据。
```sql
CREATE TABLE `lob_trade`
(
    `id`          bigint(20)  NOT NULL AUTO_INCREMENT,
    `lob`         varchar(128)     DEFAULT NULL COMMENT '业务线',
    `trade_id`    varchar(64) NOT NULL COMMENT '业务id',
    `amount`      bigint(20)  NOT NULL COMMENT '金额',
    `trade_time`  datetime    DEFAULT NULL COMMENT '交易时间',
    `create_time` datetime         DEFAULT NULL COMMENT '创建时间',
    `update_time` timestamp   NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `status`      int(1)           DEFAULT '1' COMMENT '是否启用（1 是 0 否）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `lob_trade_id_uIdx` (`lob`,`trade_id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COMMENT='业务线交易表';

CREATE TABLE `third_trade`
(
    `id`          bigint(20)  NOT NULL AUTO_INCREMENT,
    `lob`         varchar(128)     DEFAULT NULL COMMENT '业务线',
    `trade_id`    varchar(64) NOT NULL COMMENT '业务id',
    `amount`      bigint(20)  NOT NULL COMMENT '金额',
    `trade_time`  datetime    DEFAULT NULL COMMENT '交易时间',
    `create_time` datetime         DEFAULT NULL COMMENT '创建时间',
    `update_time` timestamp   NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `status`      int(1)           DEFAULT '1' COMMENT '是否启用（1 是 0 否）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `lob_trade_id_uIdx` (`lob`,`trade_id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COMMENT='三方交易表';
```

插入数据
```sql
INSERT INTO `lob_trade` (`lob`, `trade_id`, `amount`, `trade_time`, `create_time`, `update_time`, `status`)
VALUES
	( 'maicai', '110001', 1, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110002', 2, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110003', 3, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110004', 4, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110005', 5, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110006', 6, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110007', 7, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110008', 8, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110009', 9, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110020', 20, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1);

INSERT INTO `third_trade` (`lob`, `trade_id`, `amount`, `trade_time`, `create_time`, `update_time`, `status`)
VALUES
	( 'maicai', '110001', 1, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110002', 2, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110003', 3, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110004', 4, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110005', 5, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110006', 6, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110007', 7, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110008', 8, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110009', 9, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1),
	( 'maicai', '110030', 30, '2022-06-01 16:44:54', '2022-06-01 16:44:54', '2022-06-01 16:45:09', 1);
```
业务交易表和三方交易表的数据前9条是相同的，最后一条数据不同，通过join操作，能找出这个不同。

```sql

```


