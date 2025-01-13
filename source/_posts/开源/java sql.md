---
category: 开源
date: 2024-05-15
title: Java 中执行sql
---

在字符串模板中拼装SQL，字符串支持变量表达式（可以是变量，可以进行运算，可以调用函数），dea 自动补全SQL
```java
// 查询SQL
String selectSql = sql"
	select * from ${table} where name = ${name}
";
// 执行SQL
Data<User> data = jdbc.selectSql(sql, User.class);
//获取结果
boolean isEmpty = data.isEmpty();
User user = data.getOne(); // 可能为null
List<User> list = data.getList() // 不为null，但是size可为0
Map<Long, User> map = data.getMap(user -> user.getId);
String json = data.toJson();
// 对Data进行Stream支持
Data data = data.filter(user -> user.age > 10);

// 插入SQL
String insertOneSql = sql"
	insert into ${table}(id, name, age) values(${user.id}, ${user.name}, ${user.age})
";

String insertListSql = sql"
	insert into ${table}(id, name, age) values ${
		for(User user in list) {
		 sql(join=",")" (${user.id}, ${user.name}, ${user.age}) "
		}
	}
";

Data data = jdbc.update(insertOneSql);

```