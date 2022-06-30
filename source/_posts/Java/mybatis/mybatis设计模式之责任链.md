---
category: Java
tag: mybatis
date: 2018-09-1
title: Mybatis 设计模式之责任链模式
---

mybatis中使用责任链模式的是 拦截器 实现。

mybatis首先定义一个类 InterceptorChain 用来持有链上所有节点
```java
public class InterceptorChain {

  private final List<Interceptor> interceptors = new ArrayList<>();

  public Object pluginAll(Object target) {
    for (Interceptor interceptor : interceptors) {
      target = interceptor.plugin(target);
    }
    return target;
  }

  public void addInterceptor(Interceptor interceptor) {
    interceptors.add(interceptor);
  }
  
  public List<Interceptor> getInterceptors() {
    return Collections.unmodifiableList(interceptors);
  }

}
```

节点类叫做 Interceptor
```java
public interface Interceptor {

  Object intercept(Invocation invocation) throws Throwable;

  Object plugin(Object target);

  void setProperties(Properties properties);

}
```

这个的用法大致是解析xml配置文件的`plugins`节点，然后通过子节点名称找到对应的 Interceptor ，接着通过反射进行实例化，最后添加到责任链链表上。
一般配置的都是mybatis自带的，如果想要自定义一个的话可以如下

```java
@Intercepts({@Signature( type= Executor.class, method = "update", args = {MappedStatement.class,Object.class})}) 
public class ExamplePlugin implements Interceptor { 
      public Object intercept(Invocation invocation) throws Throwable { 
          return invocation.proceed(); 
      }
       public Object plugin(Object target) { return Plugin.wrap(target, this); } 
       public void setProperties(Properties properties) { } 
}
```

通过 @Intercepts 注解和实现 Interceptor 接口，我们就可以自定义实现了。