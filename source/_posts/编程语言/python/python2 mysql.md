---
category: 编程语言
tag: PYTHON2
date: 2017-09-05
title: PYTHON2 Mysql
---

安装
```
pip install PyMySQL
```

示例代码

```python
import pymysql.cursors

# Connect to the database
connection = pymysql.connect(host='localhost',
                            user='user',
                            password='passwd',
                            db='db',
                            charset='utf8mb4',
                            cursorclass=pymysql.cursors.DictCursor)

try:
    with connection.cursor() as cursor:
        # Create a new record
        sql = "INSERT INTO `users` (`email`, `password`) VALUES (%s, %s)"
        cursor.execute(sql, ('webmaster@python.org', 'very-secret'))

    # connection is not autocommit by default. So you must commit to save
    # your changes.
    connection.commit()

    with connection.cursor() as cursor:
        # Read a single record
        sql = "SELECT `id`, `password` FROM `users` WHERE `email`=%s"
        cursor.execute(sql, ('webmaster@python.org',))
        result = cursor.fetchone()
        print(result)
finally:
    connection.close()
```

或者

```python
#!/usr/bin/python# -*- coding: utf-8 -*-

import sys
import mysql.connector

mysql_host = "localhost"
mysql_database = "test"
mysql_user = "root"
mysql_passwrold = "root"

reload(sys)
sys.setdefaultencoding('utf-8')


def exec_sqls(exec_sql):
    cnx = mysql.connector.connect(user=mysql_user, password=mysql_passwrold, host=mysql_host, database=mysql_database)
    cursor = cnx.cursor()
    exec_sql(cursor)
    cnx.commit()
    cursor.close()
    cnx.close()

def query_max_connections(cursor):
    print "连接数信息"

    max_connections = exec_sql_query(cursor, "show variables like 'max_connections'")
    max_connections_num = float(max_connections[0][1])
    print("max_connections : " + str(max_connections_num))
       
exec_sqls(query_max_connections)
```