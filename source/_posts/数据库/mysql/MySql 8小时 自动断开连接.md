---
category: 数据库
tag: mysql
date: 2016-12-15
title: MySql 8小时 自动断开连接
---

MySQL服务器默认的“wait_timeout”是28800秒即8小时，意味着如果一个连接的空闲时间超过8个小时，MySQL将自动断开该连接，而连接池却认为该连接还是有效的(因为并未校验连接的有效性)，当应用申请使用该连接时，就会报错。

可能会导致
```
The last packet successfully received from the server was 36,734,993 milliseconds ago.  The last pac
```

### 解决方案

#### 增加 MySQL 的 wait_timeout 属性的值 

修改mysql安装目录下的配置文件 my.ini文件（如果没有此文件，复制“my-default.ini”文件，生成“复件 my-default.ini”文件。将“复件 my-default.ini”文件重命名成“my.ini” ），在文件中设置： 
1. wait_timeout=31536000  
2. interactive_timeout=31536000  

这两个参数的默认值是8小时(60*60*8=28800)。
注意： 1.wait_timeout的最大值只允许2147483 （24天左右）

2.修改配置文件为网上大部分文章所提供的方式，也可以使用mysql命令对这两个属性进行修改

#### 减少连接池内连接的生存周期
减少连接池内连接的生存周期，使之小于上一项中所设置的wait_timeout 的值。 修改 c3p0 的配置文件，在 Spring 的配置文件中设置：

```xml
<bean id="dataSource"  class="com.mchange.v2.c3p0.ComboPooledDataSource">       
<property name="maxIdleTime"value="1800"/>    
<!--other properties -->    
</bean>  
```

#### 定期使用连接池内的连接

定期使用连接池内的连接，使得它们不会因为闲置超时而被 MySQL 断开。 
修改 c3p0 的配置文件,在 Spring 的配置文件中设置：

```xml
<bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">    
<property name="preferredTestQuery" value="SELECT 1"/>    
<property name="idleConnectionTestPeriod" value="18000"/>    
<property name="testConnectionOnCheckout" value="true"/>    
```
