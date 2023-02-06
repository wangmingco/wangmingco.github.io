---
category: 数据库
tag: mysql
date: 2016-12-15
title: Mysql 数据类型
---

## 整数类型

* bigint : 从 -2^63 (-9223372036854775808) 到 2^63-1 (9223372036854775807) 的整型数据（所有数字）。存储大小为 8 个字节。
* int : 从 -2^31 (-2,147,483,648) 到 2^31 - 1 (2,147,483,647) 的整型数据（所有数字）。存储大小为 4 个字节。int 的 SQL-92 同义字为 integer。
* smallint : 从 -2^15 (-32,768) 到 2^15 - 1 (32,767) 的整型数据。存储大小为 2 个字节。
* tinyint : 从 0 到 255 的整型数据。存储大小为 1 字节。

创建一张测试表
```sql
CREATE TABLE `test_integer` (
  `int1` int(1) DEFAULT NULL,
  `int4` int(4) DEFAULT NULL,
  `int8` int(8) DEFAULT NULL,
  `bigint1` bigint(1) DEFAULT NULL,
  `bigint4` bigint(4) DEFAULT NULL,
  `tinyint1` tinyint(1) DEFAULT NULL,
  `tinyint4` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

然后插入数据

```sql
INSERT INTO test_integer(int_1) VALUES(1);
INSERT INTO test_integer(int_1) VALUES(256);
INSERT INTO test_integer(int_1) VALUES(2147483647);
INSERT INTO test_integer(int_1) VALUES(2147483648);

INSERT INTO test_integer(int_4) VALUES(1);
INSERT INTO test_integer(int_4) VALUES(256);
INSERT INTO test_integer(int_4) VALUES(2147483647);
INSERT INTO test_integer(int_4) VALUES(2147483648);

INSERT INTO test_integer(int_8) VALUES(1);
INSERT INTO test_integer(int_8) VALUES(256);
INSERT INTO test_integer(int_8) VALUES(2147483647);
INSERT INTO test_integer(int_8) VALUES(2147483648);

INSERT INTO test_integer(bigint_1) VALUES(1);
INSERT INTO test_integer(bigint_1) VALUES(256);
INSERT INTO test_integer(bigint_1) VALUES(9223372036854775807);
INSERT INTO test_integer(bigint_1) VALUES(9223372036854775808);
```

## 时间类型

|日期类型| 	存储空间	|日期格式	|日期范围|
|-----|----|----|----|
|datetime      	|8 |bytes	|YYYY-MM-DD HH:MM:SS	|1000-01-01 00:00:00 ~ 9999-12-31 23:59:59|
|timestamp      	|4 |bytes	|YYYY-MM-DD HH:MM:SS	|1970-01-01 00:00:01 ~ 2038|
|date         	|3 |bytes	|YYYY-MM-DD	|1000-01-01          ~ 9999-12-31|
|year         	|1 |bytes	  |YYYY 	|1901                ~ 2155|

timestamp 类型的列还有个特性：默认情况下，在 insert, update 数据时，timestamp 列会自动以当前时间（CURRENT_TIMESTAMP）填充/更新

```sql
CREATE TABLE `test_date` (
  `yearC` year(4) DEFAULT NULL,
  `dateC` date DEFAULT NULL,
  `timeC` time DEFAULT NULL,
  `datetimeC` datetime DEFAULT NULL,
  `timestampC` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

插入数据

```sql
INSERT INTO `test_date`(yearC) VALUES(1900);
INSERT INTO `test_date`(yearC) VALUES(1901);
INSERT INTO `test_date`(yearC) VALUES(2155);
INSERT INTO `test_date`(yearC) VALUES(2156);

INSERT INTO `test_date`(dateC) VALUES("999-01-01");
INSERT INTO `test_date`(dateC) VALUES("1000-01-01");
INSERT INTO `test_date`(dateC) VALUES("9999-12-31");
INSERT INTO `test_date`(dateC) VALUES("10000-12-31");

INSERT INTO `test_date`(timeC) VALUES("-838:59:59");
INSERT INTO `test_date`(timeC) VALUES("838:59:59");

INSERT INTO `test_date`(datetimeC) VALUES("999-01-01 00:00:00");
INSERT INTO `test_date`(datetimeC) VALUES("1000-01-01 00:00:00");
INSERT INTO `test_date`(datetimeC) VALUES("9999-12-31 23:59:59");
INSERT INTO `test_date`(datetimeC) VALUES("10000-12-31 23:59:59");

INSERT INTO `test_date`(timestampC) VALUES("19690101080001");
INSERT INTO `test_date`(timestampC) VALUES("19700101080001");
INSERT INTO `test_date`(timestampC) VALUES("20380119111407");
INSERT INTO `test_date`(timestampC) VALUES("20390119111407");
```

查询日期
```sql
SELECT now(), current_timestamp() ,current_timestamp, localtime(), localtime, localtimestamp, localtimestamp() 
```

### 时间函数

#### sysdate() 

sysdate() 日期时间函数跟 now() 类似，不同之处在于：now() 在执行开始时值就得到了， sysdate() 在函数执行时动态得到值

```sql
mysql> select now(), sleep(3), now();

+---------------------+----------+---------------------+
| now()              | sleep(3) | now()              |
+---------------------+----------+---------------------+
| 2008-08-08 22:28:21 |        0 | 2008-08-08 22:28:21 |
+---------------------+----------+---------------------+

mysql> select sysdate(), sleep(3), sysdate();

+---------------------+----------+---------------------+
| sysdate()          | sleep(3) | sysdate()          |
+---------------------+----------+---------------------+
| 2008-08-08 22:28:41 |        0 | 2008-08-08 22:28:44 |
+---------------------+----------+---------------------+
```


可以看到，虽然中途 sleep 3 秒，但 now() 函数两次的时间值是相同的； sysdate() 函数两次得到的时间值相差 3 秒。MySQL Manual 中是这样描述 sysdate() 的：Return the time at which the function executes。 

sysdate() 日期时间函数，一般情况下很少用到。 

#### curdate() 

获得当前日期（date）函数

```sql
mysql> select curdate();

+------------+
| curdate()  |
+------------+
| 2008-08-08 |
+------------+
```

#### curtime() 

获得当前时间（time）函数

```sql
mysql> select curtime();

+-----------+
| curtime() |
+-----------+
| 22:41:30  |
+-----------+
```

#### utc_date(),utc_time(),utc_timestamp() 

获得当前 UTC 日期时间函数

```sql
mysql> select utc_timestamp(), utc_date(), utc_time(), now()

+---------------------+------------+------------+---------------------+
| utc_timestamp()    | utc_date() | utc_time() | now()              |
+---------------------+------------+------------+---------------------+
| 2008-08-08 14:47:11 | 2008-08-08 | 14:47:11  | 2008-08-08 22:47:11 |
+---------------------+------------+------------+---------------------+
```

因为我国位于东八时区，所以本地时间 = UTC 时间 + 8 小时。UTC 时间在业务涉及多个国家和地区的时候，非常有用。
