---
category: Java
tag: mybatis
date: 2017-12-10
title: Mybatis 用法笔记
---

## 大于，等于，小于的写法

* 大于等于 `<![CDATA[ >= ]]>小于等于 <![CDATA[ <= ]]>`

例如：sql如下：
```sql
create_date_time <![CDATA[ >= ]]> #{startTime} and create_date_time <![CDATA[ <= ]]> #{endTime}
```


