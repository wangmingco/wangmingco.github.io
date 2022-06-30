---
category: Java
tag: mybatis
date: 2018-09-12
title: Mybatis 设计模式之装饰模式
---

mybatis 用装饰模式实现了Log模块。

`org.apache.ibatis.logging.LogFactory` 类加载的时候依次尝试使用下列Log实现

```java
static {
  tryImplementation(LogFactory::useSlf4jLogging);
  tryImplementation(LogFactory::useCommonsLogging);
  tryImplementation(LogFactory::useLog4J2Logging);
  tryImplementation(LogFactory::useLog4JLogging);
  tryImplementation(LogFactory::useJdkLogging);
  tryImplementation(LogFactory::useNoLogging);
}
```


如果`logConstructor` 为空的话, 就调用`setImplementation()`
```java
if (logConstructor == null) {
  try {
    runnable.run();
  } catch (Throwable t) {
    // ignore
  }
}
```

在setImplementation中找到的上面的Log实现类

```java
private static void setImplementation(Class<? extends Log> implClass) {
  try {
    Constructor<? extends Log> candidate = implClass.getConstructor(String.class);
    Log log = candidate.newInstance(LogFactory.class.getName());
    if (log.isDebugEnabled()) {
      log.debug("Logging initialized using '" + implClass + "' adapter.");
    }
    logConstructor = candidate;
  } catch (Throwable t) {
    throw new LogException("Error setting Log implementation.  Cause: " + t, t);
  }
}
```
