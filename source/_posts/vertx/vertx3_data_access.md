---
category: vertx
tag: vertx3
title: Vertx 3 Data Access
date: 2015-08-27 21:10:00
---


# JDBC client

这个客户端允许你在Vertx应用中使用异步API与JDBC数据库相交互.

`JDBCClient`接口定义了异步方式的JDBC API

## Creating a the client

下面的几种方式介绍了如何创建一个客户端：

### Using default shared data source

在大多数情景中,你可能需要在不同的客户端实例(client instances)中共享同一个`data source`.

例如,你想要通过部署多个`verticle`实例来拓展应用的规模,然而每个`verticle`都共享相同的`datasource`,这样你就避免了多个`datasource pool`了。

如下：
```java
JDBCClient client = JDBCClient.createShared(vertx, config);
```
当第一次调用`JDBCClient.createShared`的时候,确实会根据传进的配置创建出`data source`. 但是当接下来再次调用这个方法的时候,也会创建一个新的客户端,但是它却没有创建新的`data source`,因此第二次传进的配置也没有生效.

#### Specifying a data source name

在创建`JDBCClient`实例的时候也可以指定`data source`的名字
```java
JDBCClient client = JDBCClient.createShared(vertx, config, "MyDataSource");
```
如果使用相同的`Vertx`实例和相同的`data source`名字创建出不同的客户端,那这些客户端会使用相同的`data source`.

使用这种创建方式你可以在不同的客户端上使用不同的`datasource`, 例如和不同的数据库进行交互.

#### Creating a client with a non shared data source

虽然在大部分情况下不同的客户端实例需要共享相同的`data source`,但是有时候也可能客户端需要一个非共享的`data source`, 你可以使用`JDBCClient.createNonShared`方法.

```java
JDBCClient client = JDBCClient.createNonShared(vertx, config);
```
这种方式和调用`JDBCClient.createShared`时传递一个唯一的`data source`名字达到相同的效果.

#### Specifying a data source

如果你想使用一个已经存在的`data source`, 那么你也可以直接使用那个`data source`创建一个客户端.
```java
JDBCClient client = JDBCClient.create(vertx, dataSource);
```

## Closing the client
你可以在整个`verticle`生命周期之内都持有客户端的引用,但是一旦你使用完该客户端你就应该主动关闭它.

由于`data source`内部持有一个引用计数器,每当客户端关闭一次,`data source`内部的技术器就会减1,当计数器为0的时候,`data source`就会关闭自己.

## Getting a connection

当你成功创建出客户端之后,你可以使用`getConnection`方法来获得一个连接.

当连接池中有了可用连接之后,`handler`会获得一个可用连接
```java
client.getConnection(res -> {
  if (res.succeeded()) {

    SQLConnection connection = res.result();

    connection.query("SELECT * FROM some_table", res2 -> {
      if (res2.succeeded()) {

        ResultSet rs = res2.result();
        // Do something with results
      }
    });
  } else {
    // Failed to get connection - deal with it
  }
});
```
获得的连接是一个`SQLConnection`实例, `SQLConnection`接口更多的是被`Vert.x sql service`使用.

## Configuration
当我们创建客户端时,向其传递了一个配置,该配置包含下面属性：

* `provider_class` : 用于管理数据库连接的类名. 默认的类名是`io.vertx.ext.jdbc.spi.impl.C3P0DataSourceProvider`, 但是如果你想要使用其他连接池,那么你可以使用你自己的实现覆盖该属性.

###### 因为我们使用了`C3P0`的连接池,因此我们还可以使用下列属性
* `url` : 数据库的JDBC连接URL地址
* `driver_class` : JDBC`dirver`名称
* `user` : 数据库名称
* `password` : 数据库密码
* `max_pool_size` : 连接池最大数量(默认是15)
* `initial_pool_size` : 连接池初始大小(默认是3)
* `min_pool_size` : 连接池最小值
* `max_statements` : 缓存`prepared statements`的最大值(默认是0)
* `max_statements_per_connection` : 每个连接缓存`prepared statements`的最大值(默认是0)
* `max_idle_time` : 该值表示一个闲置连接多少秒后会被关闭(默认是0, 从不关闭).

如果你还想要配置其他`C3P0`的配置,那么你可以在`classpath`上添加一个`c3p0.properties`文件


下面给出了一个配置示例：
```java
JsonObject config = new JsonObject()
  .put("url", "jdbc:hsqldb:mem:test?shutdown=true")
  .put("driver_class", "org.hsqldb.jdbcDriver")
  .put("max_pool_size", 30);

JDBCClient client = JDBCClient.createShared(vertx, config);
```


# Vert.x MySQL - PostgreSQL client

`MySQL / PostgreSQL`客户端为Vert.x应用提供了一个与`MySQL / PostgreSQL`数据库交互的接口.

它使用`Mauricio Linhares`开源驱动与`MySQL / PostgreSQL`数据库进行非阻塞交互.

## Creating a the client
下面给出了几种创建方式：

#### Using default shared pool
在大多数情况下,我们需要在多个客户端实例中共享同一个连接池

例如你通过部署多个`verticle`实例的方式进行程序拓展,但是可以每个`verticle`可以共享同一个连接池.

```java
JsonObject mySQLClientConfig = new JsonObject().put("host", "mymysqldb.mycompany");
AsyncSQLClient mySQLClient = MySQLClient.createShared(vertx, mySQLClientConfig);

// To create a PostgreSQL client:

JsonObject postgreSQLClientConfig = new JsonObject().put("host", "mypostgresqldb.mycompany");
AsyncSQLClient postgreSQLClient = PostgreSQLClient.createShared(vertx, postgreSQLClientConfig);
```
`MySQLClient.createShared`或者`PostgreSQLClient.createShared`会根据指定的配置创建一个连接池. 随后再调用这俩个方式时会使用同一个连接池,同时新的配置不会被采用.

#### Specifying a pool name
你也可以像下面这样指定一个连接池的名字.
```java
JsonObject mySQLClientConfig = new JsonObject().put("host", "mymysqldb.mycompany");
AsyncSQLClient mySQLClient = MySQLClient.createShared(vertx, mySQLClientConfig, "MySQLPool1");

// To create a PostgreSQL client:

JsonObject postgreSQLClientConfig = new JsonObject().put("host", "mypostgresqldb.mycompany");
AsyncSQLClient postgreSQLClient = PostgreSQLClient.createShared(vertx, postgreSQLClientConfig, "PostgreSQLPool1");
```
如果不同的客户端使用相同的`Vertx`实例和相同的连接池名字,那么他们将使用同一个连接池.

使用这种创建方式你可以在不同的客户端上使用不同的`datasource`, 例如和不同的数据库进行交互.

#### Creating a client with a non shared data source
虽然在大部分情况下不同的客户端实例需要共享相同的`data source`,但是有时候也可能客户端需要一个非共享的`data source`, 你可以使用`MySQLClient.createNonShared`或者`PostgreSQLClient.createNonShared`方法.

```java
JsonObject mySQLClientConfig = new JsonObject().put("host", "mymysqldb.mycompany");
AsyncSQLClient mySQLClient = MySQLClient.createNonShared(vertx, mySQLClientConfig);

// To create a PostgreSQL client:

JsonObject postgreSQLClientConfig = new JsonObject().put("host", "mypostgresqldb.mycompany");
AsyncSQLClient postgreSQLClient = PostgreSQLClient.createNonShared(vertx, postgreSQLClientConfig);
```
这种方式和调用`MySQLClient.createNonShared`或者`PostgreSQLClient.createNonShared`时传递一个唯一的`data source`名字达到相同的效果.

## Closing the client
你可以在整个`verticle`生命周期之内都持有客户端的引用,但是一旦你使用完该客户端你就应该调用`close`关闭它.

## Getting a connection

当你成功创建出客户端之后,你可以使用`getConnection`方法来获得一个连接.

当连接池中有了可用连接之后,`handler`会获得一个可用连接
```java
client.getConnection(res -> {
  if (res.succeeded()) {

    SQLConnection connection = res.result();

    // Got a connection

  } else {
    // Failed to get connection - deal with it
  }
});
```
连接是`SQLConnection`的一个实例, `SQLConnection`是一个被`Sql`客户端使用的公共接口.

> 需要注意的是`date`和`timestamps`类型. 无论何时从数据库中获取`date`时, 客户端会将它转换成`ISO 8601`形式的字符串(`yyyy-MM-ddTHH:mm:ss.SSS`).`Mysql`会忽略毫秒数.

## Configuration
`PostgreSql`和`MySql`使用了下面相同的配置：
```json
{
  "host" : <your-host>,
  "port" : <your-port>,
  "maxPoolSize" : <maximum-number-of-open-connections>,
  "username" : <your-username>,
  "password" : <your-password>,
  "database" : <name-of-your-database>
}
```
* `host` : 数据库主机地址(默认是`localhost`)
* `port` : 数据库端口(`PostgreSQL`默认是5432. `MySQL`默认是3306)
* `maxPoolSize` : 连接池保持开启的最大数量,默认是10.
* `username` : 连接数据库使用的用户名.(`PostgreSQL`的默认值是`postgres`, `MySQL`的默认值是`root`)
* `password` : 连接数据库使用的密码(默认没有设置密码).
* `database` : 连接的数据库名称.(默认值是`test`)


# Common SQL interface

通用`SQL`接口是用来和Vertx`SQL`服务交互的.

通过指定的SQL服务接口我们可以获取一个指定的连接.

# The SQL Connection
我们使用`SQLConnection`表示与一个数据库的连接.

### Auto-commit

当连接的`auto commit`被设置为`true`. 这意味着每个操作都会在连接自己的事务中被高效地执行.

如果你想要在一个单独的事务中执行多个操作,你应该使用`setAutoCommit`方法将`auto commit`被设置为`false`.

当操作完成之后,我们设置的`handler`会自动地被调用.
```java
connection.setAutoCommit(false, res -> {
  if (res.succeeded()) {
    // OK!
  } else {
    // Failed!
  }
});
```

### Executing queries
我们使用`query`来执行查询操作

`query`方法的参数是原生`SQL`语句, 我们不必使用针对不同的数据库使用不同的`SQL`方言.

当查询完成之后,我们设置的`handler`会自动地被调用. `query`的结果使用`ResultSet`表示.

```java
connection.query("SELECT ID, FNAME, LNAME, SHOE_SIZE from PEOPLE", res -> {
  if (res.succeeded()) {
    // Get the result set
    ResultSet resultSet = res.result();
  } else {
    // Failed!
  }
});
```
`ResultSet`实例中的`getColumnNames`方法可以获得可用列名, `getResults`可以获得查询真实的结果.

实际上,查询的结果是一个`JsonArray`的`List`实例,每一个元素都代表一行结果.

```java
List<String> columnNames = resultSet.getColumnNames();

List<JsonArray> results = resultSet.getResults();

for (JsonArray row: results) {

  String id = row.getString(0);
  String fName = row.getString(1);
  String lName = row.getString(2);
  int shoeSize = row.getInteger(3);

}
```
另外你还可以使用`getRows`获取一个`Json`对象实例的`List`, 这种方式简化了刚才的方式,但是有一点需要注意的是,`SQL`结果可能包含重复的列名, 如果你的情景是这种情况,你应该使用`getResults`.

下面给出了一种使用`getRows`获取结果的示例：
```java
List<JsonObject> rows = resultSet.getRows();

for (JsonObject row: rows) {

  String id = row.getString("ID");
  String fName = row.getString("FNAME");
  String lName = row.getString("LNAME");
  int shoeSize = row.getInteger("SHOE_SIZE");

}
```

### Prepared statement queries
我们可以使用`queryWithParams`来执行`prepared statement`查询.

下例中,演示了使用方法：
```java
String query = "SELECT ID, FNAME, LNAME, SHOE_SIZE from PEOPLE WHERE LNAME=? AND SHOE_SIZE > ?";
JsonArray params = new JsonArray().add("Fox").add(9);

connection.queryWithParams(query, params, res -> {

  if (res.succeeded()) {
    // Get the result set
    ResultSet resultSet = res.result();
  } else {
    // Failed!
  }
});
```

### Executing INSERT, UPDATE or DELETE
我们可以直接使用`update`方法进行数据更新操作.

同样`update`方法的参数同样是原生`SQL`语句,不必使用`SQL`方言.

当更新完成之后,我们会获得一个更新结果`UpdateResult`。

我们可以调用更新结果的`getUpdated`方法获得有多少行发生了改变, 而且如果更新时生成了一些key,那么我们可以通过`getKeys`获得

```java
List<String> columnNames = resultSet.getColumnNames();

List<JsonArray> results = resultSet.getResults();

for (JsonArray row: results) {

  String id = row.getString(0);
  String fName = row.getString(1);
  String lName = row.getString(2);
  int shoeSize = row.getInteger(3);

}
```

### Prepared statement updates
如果想要执行`prepared statement`更新操作,我们可以使用`updateWithParams`.

如下例：
```java
String update = "UPDATE PEOPLE SET SHOE_SIZE = 10 WHERE LNAME=?";
JsonArray params = new JsonArray().add("Fox");

connection.updateWithParams(update, params, res -> {

  if (res.succeeded()) {

    UpdateResult updateResult = res.result();

    System.out.println("No. of rows updated: " + updateResult.getUpdated());

  } else {

    // Failed!

  }
});
```

### Executing other operations
如果想要执行其他数据库操作,例如创建数据库,你可以使用`execute`方法.

同样`execute`执行的语句也是原生`SQL`语句.当操作执行完之后,我们设置的`handler`会被调用.
```java
String sql = "CREATE TABLE PEOPLE (ID int generated by default as identity (start with 1 increment by 1) not null," +
             "FNAME varchar(255), LNAME varchar(255), SHOE_SIZE int);";

connection.execute(sql, execute -> {
  if (execute.succeeded()) {
    System.out.println("Table created !");
  } else {
    // Failed!
  }
});
```

### Using transactions
如果想要使用事务,那么首先要调用`setAutoCommit`将`auto-commit`设置为`false`.

接下来你就可以进行事务操作, 例如提交时使用`commit`, 回滚时使用`rollback`.

一旦`commit/rollback`完成之后, 我们设置的`handler`会被调用, 然后下一个事务会自动开始.
```java
connection.commit(res -> {
  if (res.succeeded()) {
    // Committed OK!
  } else {
    // Failed!
  }
});
```

### Closing connections
当你执行完全部的操作之后,你应该使用`close`将连接资源还给连接池.
