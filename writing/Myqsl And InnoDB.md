---
category: 数据库
tag: mysql
date: 2021-12-25
title: Mysql 和 InnoDB
---

Mysql是一个数据库管理系统，重点管理的则是数据。在程序中我们一般使用数据分为2种方式，读数据和写数据。
在DML SQL中读数据一般就是Select，写数据一般就是Update，Delete，Insert。
涉及到数据读写之后，随之就会产生一个问题，数据竞争。比如A进程在读数据的时候，B进程却在同时对相同的数据进行写入操作，比如修改。一般的处理方式就是对该块数据进行加锁，看谁先看到这块数据的访问权。

## 锁

在这里我们就引入了锁，那Mysql中锁是什么样子的呢？Mysql 内部可以分为Mysql Server和Mysql存储引擎。Mysql Server用来处理网络链接，解析sql，处理缓存等等操作，但是真实的数据读写操作还是要由存储引擎执行的。我们这里只讨论使用最广泛的InnoDB引擎。
有过开发经验的朋友应该都了解，锁一般分为读锁和写锁。俩个进程都持有读锁，访问数据是不会冲突的，但是如果任何一个进程拥有一个写锁，那么就会和其他进程产生冲突。

### 锁的种类

在InnoDB中，同样锁分为读锁(共享锁)和写锁(排他锁)。比如像Update，Insert，Delete会默认使用写锁，但是Select一般不会加读锁(这个原因后面会提到), 那难道InnoDB不会使用读锁吗？不是的，我们可以使用`SELECT ... LOCK IN SHARE MODE`和`SELECT … FOR UPDATE`来对数据进行加读锁。 

* `SELECT ... LOCK IN SHARE MODE` ：允许其他的事务对锁定的数据加读锁访问，但是如果加写锁的话会排斥，等待锁释放。
* `SELECT … FOR UPDATE`：不再允许其他事务对锁定的数据加锁访问(包含读锁和写锁)，直到当前事务释放锁。

刚才讨论的互斥关系只有`Update，Insert，Delete`与`SELECT ... LOCK IN SHARE MODE`,`SELECT … FOR UPDATE`他们之间才有可能发生，如果SQL只是单纯的使用`Select`是不会加锁等待的，这里就牵扯到了MVVC，下面会细说。

### 加锁方式

除了上述的锁类型，还可以根据加锁方式将锁分为
* 行级锁，只对某一行加锁
* 间隙锁，对索引某个范围加锁, 但是不锁行本身
* Next-Key 锁，锁定一个索引记录以及该记录之前的间隙(gap) 即前开后闭区间。
* 表锁，对整个表进行加锁

Next-Key lock是InnoDB默认的加锁方式，如果在查找过程中找到了数据索引才会加锁。索引上的等值查询时，如果索引是唯一索引的话，那么Next-Key锁会退化为行级锁。还有在索引上的等值查询时，从左向右如果最后一个值不满足等值条件时，Next-Key锁会退化为间隙锁。

刚刚我们讨论到索引了，具体的索引内容后面会详细说，这里只提一点，InnoDB加锁并不会加到数据上，而是在索引上进行加锁。

一般InnoDB加锁过程如下
1. 通过聚簇索引更新时，会在聚簇索引上加锁。
2. 通过二级索引进行更新时，会先对二级索引加锁，然后对聚簇索引加锁。
3. 使用聚簇索引更新二级索引时，会先对聚簇加锁，再对二级索引加锁。此结论的前提条件为结论4。
4. 更新二级索引时，只有二级索引所在的列产生实际变化的更新，才会对二级索引加锁，否则仅会对聚簇索引加锁。
5. 在REPEATABLE_READ级别下，对索引的加锁范围是索引所确定的范围，而不是最终结果集范围。也就是说需要回表查询才能剔除的行的聚簇索引依然会被加锁。而READ_COMMITTED级别下则不会。

这些规则可能会在某些版本被修改，因此在具体排查问题时，如果发现与上描述冲突还是应该查看当前版本的加锁方式。

### 锁释放

InnodB采用的俩阶段锁，在事务过程中，如果加了读锁或者写锁，那么在事务的过程中会一直持有这个锁，直到事务提交或者事务回滚时才会将该锁释放。

### 意向锁


在这里我们看到，InnoDB的锁类型大概分为
* 排他锁(X锁)
* 共享锁(S锁)
* 意向排他锁(IX锁)
* 意向共享锁(IS锁)

它们的互斥关系为
```

```

## 索引

在上面讨论锁的时候，我们已经牵扯到了索引。一般使用索引我们时希望能够加快查询数据的速度，减少查找时间。
不管时读数据还是写数据，都需要找到数据，因此在读写时时都会使用到索引的，当然InnoDB加锁也是锁住的索引数据。

在InnoDB中索引分为
* 聚簇索引，也叫主键索引
* 非聚簇索引，也叫二级索引，辅助索引

非聚簇索引是对聚簇索引的数据进行索引。

在我们使用过程当中也可以把索引分为
* 主键索引: `create table t1(id int primary key, name varchar(255) )`
* 普通索引: `create table t2(id int primary key, name varchar(255) ) index idx_name(name)`
* 唯一索引: `create table t3(id int primary key, name varchar(255) ) UNIQUE idx_name(name)`
* 联合索引: `create table t4(id int primary key, name varchar(255), age int ) index idx_name_age(name,age)`

在使用索引时，我们把查询分为
* 等值查询: `select * from t1 where id = 1`
* 范围查询: `select * from t1 where id > 10` 或者 `select * from t1 where name like 'a%'`

当我们使用单列索引的时候如果时等值查询就很简单，但是如果涉及到范围查询的时候就会要注意一些情况了，比如在`like`的时候Innodb是采用`匹配列前缀原则`。比如 `select * from t2 where name like 'a%'` 会使用到索引name，但是如果sql是  `select * from t2 where name like '%a%'` 此时就会全表查，也就是不走索引，将表里每个数据都查询一边(Mysql Server依次从存储引擎里将数据读取出来，然后在Mysql Server里进行判断)。因此在Like时我们应当尽量将sql符合列前缀匹配原则。

如果时多列联合索引的话，会涉及到`全值匹配`，`匹配最左前缀原则`，`匹配列前缀原则`等多个规则参与运算。
比如 `select * from t4 where name = '111' and age = 20`, 此时就是全值匹配name和age都会参与索引匹配(这里会使用索引下推吗？)。如果是 `select * from t4 where name = '111'` 则会执行 `匹配最左前缀原则` ,name索引会参与运算。但是如果是`select * from t4 where age = 20`, age则不会参与索引预算。我们再假设一个sql `select * from t4 where name = '111' and age > 20 and city = 'bj'` name,age, city构成一个联合索引，此时name会执行`匹配最左前缀原则`参与索引运算，age也会参与运算，但是city则不会参与运算了。



#### 回表




#### 覆盖索引

覆盖索引的引入仍然时避免回表查询的优化，例如sql `select id from t4 where name ='john' and age = 20` ，此时ID就在索引 `idx_name_age(name,age)` 上，因此id这个值就不回表查了，这种情况就称为索引覆盖。

#### 索引下推

索引下推(Index Condition Pushdown，简称ICP)，是MySQL5.6版本的新特性，它是为了优化索引前缀规则，减少回表查询次数，提高查询效率。

例如由这么一个sql  `select * from t4 where name like 'a%' and age = 20`, 通过索引前缀规则我们知道此时只有name索引参与运算，而age不会再被使用到。那么innodb引擎只能把`name like 'a%'`的所有主键索引数据返回给Mysql Server，MySQL Server 再依次使用主键索引从InnoDB中查询数据判断数据是否符合`age=20`这个条件. 此时就造成了大量的回表操作。
使用了索引下推技术之后，在索引`index idx_name_age(name,age)`被使用时，InnoDB 会先使用`name like 'a%'`查询数据，然后直接在InnoDB内部判断查询的数据是否满足 `age=20`这个条件, 将符合条件的数据再返回给Mysql Server(Mysql Server 仍然会判断数据是否符合`age=20`这个条件), 此时就避免了大量的回表操作。

#### 索引合并

例如我们的表创建了三个索引`idx_name(name)`,`idx_age(age)`,`idx_city(city)` 查询sql`select * from t4 where name ='john' and age = 20 and city='bj'`, 引入索引合并技术之前，MySQL会通过优化器找到一个最优的索引，InnoDB 通过找到的索引返回主键数据，Mysql Server拿到主键数据之后再回表从InnoDB里拿到具体的数据，然后Mysql Server进行条件过滤，最终查找到数据集。

使用索引合并之后，再次执行那个sql，InnoDB会把`idx_name(name)`,`idx_age(age)`,`idx_city(city)`这三个索引当成一个联合索引来使用，避免大量的回表查数据。

#### explain

我们通过执行sql `explain ....` 可以看到某个sql的执行计划。

#### sql 优化


## 事务

前面我们分析的都是单个sql的执行情况，但是有时候我们可能需要将多个sql构成一个执行单元，因此就引入了事务这个概念。
事务（Transaction）是一个操作序列，它构成了并发执行的基本单元。事务的提出主要是为了解决并发情况下保持数据一致性。

数据库事务具有ACID特性,即
* 原子性： 原子性体现在对事务的修改,要么全部执行要么都不执行
* 一致性： 保持数据的一致性,例如整数类型的数据大小不能溢出,字符型数据长度不能超过规定范围，保证数据的完整性.
* 隔离性： 如果数据库并发执行A,B俩个事务,那么在A事务执行完之前对B事务是不可见的,也就是说,B事务是看不见A事务的中间状态的.
* 持久性： 事务完成后,它对数据库的影响是永久的,即使数据库出现异常也是如此.


隔离级别
* `Read Uncommitted`: 读取未提交的数据,即其他事务已经提交修改但还未提交的数据(这是最低的隔离级别)
* `Read Committed`: 读取已经提交的数据,但是在一个事务中,对同一个项,前后俩次读取的结果可能不同.
* `Repetable Read`: 可重复读取,在一个事务中,对同一个项,确保前后俩次读取的结果一样
* `Serializable`: 可序列话,即数据库的事务是可串行执行的,就像一个事务执行的时候没有别的事务同时在执行
我们使用下面的语句来改变数据库的隔离级别

```sql
SET [SESSION|GLOBAL] TRANSACTION ISOLATION LEVEL READ UNCOMMITTED | READ COMMITTED | REPEATABLE READ | SERIALIZABLE
```
1. 不带`SESSION、GLOBAL`的SET命令,只对下一个事务有效
2. `SET SESSION` 为当前会话设置隔离模式
3. `SET GLOBAL`为以后新建的所有MYSQL连接设置隔离模式（当前连接不包括在内）

读写异常
* `Lost Update`: 俩个事务并发修改同一个数据,A事务提交成功,B事务提交失败回滚后,A事务的修改都可能会丢失
* `Dirty Reads`: A事务读取了B事务更新却没有提交的数据
* `Non-Repeatable Reads`: 一个事务对同一个数据项的多次读取可能得到不同的结果
* `Second Lost Updates`:俩个事务并发修改同一个数据, B事务可能会覆盖掉A事务的修改
* `Phantom Reads`: A事务进行前后俩次查询,但是在查询过程中出现了B事务向其中插入数据,那么A事务可能读取到未出现的数据

隔离级别与读写异常的关系
```
    LU  DR  NRR  SLU  PR
RU  N   Y   Y    Y    Y
RC  N   N   Y    Y    Y
RR  N   N   N   N     Y
S   N   N   N   N     N
```

### 事务语句
* 开始事物：`BEGIN TRANSACTION`
* 提交事物：`COMMIT TRANSACTION`
* 回滚事务：`ROLLBACK TRANSACTION`

```sql
# 开启一个事务
START TRANSACTION;
INSERT INTO db1.`t1`(id) VALUES(1);
# 提交事务
COMMIT;

# 开启事务
START TRANSACTION;
INSERT INTO db1.`t1`(id) VALUES(2);
# 回滚刚才的事务
ROLLBACK;
```



### 并发控制

#### 锁

#### 写时复制

#### 多版本并发控制

Mysql InnoDB存储引擎,InnoDB对每一行维护了俩个隐含的列,一列用于存储行被修改的时间,另一列存储每一行被删除的时间.
> 这里的时间并不是绝对时间,而是与时间对应的数据库系统的版本号,每当一个事务开始时,InnoDB都会给这个事务分配一个递增的版本号,所以版本号也可以被任务是事务好.对于每一行的查询语句,InnoDB都会把这个查询语句的版本号同这个查询雨具遇到的行的版本号进行对比,然后结合不同的事务隔离级别来决定是否返回改行.

下面以SELECT,DELETE,INSERT,UPDATE为例:

##### SELECT
只有同时满足下面俩个条件的行才能被返回:
1. 行的版本号小于等于该事务的版本号
2. 行的删除版本号要么没有定义,要么大于等于事务的版本号
如果行的修改或者删除版本号大于事务号,说明行是被该食物后面启动的事务修改或者删除的 


##### DELETE
InnoDB直接把该行的删除版本号设置为当前的事务号,相当于标记为删除而不是物理删除

##### INSERT
对于新插入的行,行的修改版本号更新为该事务的事务号

##### UPDATE
更新行的时候,InnoDB会把原来的行复制一份,并把当前的事务号作为改行的修改版本号


### 事务异常
