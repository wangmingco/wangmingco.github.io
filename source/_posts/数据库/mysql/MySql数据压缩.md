---
category: 数据库
tag: mysql
date: 2016-03-16
title: Mysql 数据压缩
---
我们在创建一个表的时候, 可以采用压缩技术
```sql
CREATE TABLE CUSTOMER (  
…  
) COMPRESS YES; 
```
如果想要在中途停止表的压缩
```sql
ALTER TABLE CUSTOMER COMPRESS NO;
```
但是停止之后并不会对已经存在的数据进行解压缩,如果想要对已经存在的数据解压缩的话, 我们可以使用
```sql
REORG TABLE CUSTOMER;
```
这个语句会根据当前表的压缩状态来重新整理表, 对数据进行压缩解压缩.

如果我们只是想要对某个字符串字段(一般是针对Blob字段进行压缩)进行压缩的话, 那么我们可以使用压缩函数
```sql
COMPRESS(string_to_compress) 
```
然后再对其进行解压缩
```sql
UNCOMPRESS()
```