---
category: Java
tag: JavaSE
date: 2016-12-01
title: Java 热更技术探究
---

如果想要动态替换JVM中的字节码, Hotspot JVM 为我们提供了俩种机制
*  [Hotswap]
*  [instrument]

还有一篇参考文章
* [Why HotSwap wasn’t good enough in 2001…and still isn’t today](http://zeroturnaround.com/rebellabs/why-hotswap-wasnt-good-enough-in-2001-and-still-isnt-today/)
* [Reloading Java Classes: HotSwap and JRebel — Behind the Scenes](https://dzone.com/articles/reloading-java-classes-401)

## Hotspot

JDK

Hotspot的HotSwap技术实现可以为我们在单步调试代码中, 改变代码继续单步调试而不用重启服务. 也就实现了, 当我们想要修复一个bug时, 不必关闭服务器直接可以热更

Hotspot 是通过 `Java Platform Debugger Architecture (JPDA)` 实现hotswap技术的. 但是这个实现有一个很大的缺陷, 就是我们要开启Java的debug功能

```
-Xrunjdwp:transport=dt_socket,server=y,onuncaught=y,launch=myDebuggerLaunchScript
```

在生产阶段我们是不可能这样做的

参考文章
*  [Java Platform Debugger Architecture Java SE 1.4 Enhancements](https://docs.oracle.com/javase/8/docs/technotes/guides/jpda/enhancements1.4.html)
*  [Java调试那点事](https://yq.aliyun.com/articles/56)

## DCE VM

DCE VM

[Dynamic Code Evolution Virtual Machine (DCE VM)](http://ssw.jku.at/dcevm/) 是Hotspot JVM的一个强化版本, 针对Hotspot JVM的Hotswap只能进行方法的修改, 这个增强版的JVM可以动态的添加删除方法或者属性字段.

但是目前为止, 这个项目还处于实验阶段, 虽然能够在debug阶段稳定运行, 但是并不推荐在生产环境中使用.

## HotswapAgent

[HotswapAgent](https://github.com/HotswapProjects/HotswapAgent)也可以为我们带来像DCE VM那样替换JVM字节码的功能(实际它也是依赖了DCE VM). 但是这个项目当前也是beta版本, 在生成环境阶段. 我也是不敢使用.

现在项目中采用的是instrument 对方法体进行小bug热更, 但是还是希望能找到更加灵活的热更方式, 目前只能寄希望于Spring-loaded和JRebel了.

## Spring-loaded

在前面的文章里分别都说过了instrument和Hotswap, 显然这俩个技术在代码热更方面都有比较大的局限性. 今天测试一下Spring出品的Spring-loaded. 它可以动态地添加删除方法, 属性字段等.
Spring-loaded 的用法非常简单, 下载springloaded.jar这个jar包, 然后使用代理的方式将它挂载到JVM上就可以了.

```
java -javaagent:<pathto>/springloaded.jar -noverify SomeJavaClass
```

尽管有了很高的灵活性,但是还是多少稍微有一些限制, 如果想要reload的文件不能以下列字符串开头

* antlr/
* org/springsource/loaded/
* com/springsource/tcserver/
* com/springsource/insight/
* groovy/
* groovyjarjarantlr/
* groovyjarjarasm/
* grails/
* java/
* javassist/
* org/codehaus/groovy/
* org/apache/
* org/springframework/
* org/hibernate/
* org/hsqldb/
* org/aspectj/
* org/xml/
* org/h2/

还可以设置一些系统参数

```
java -Dspringloaded=explain -javaagent:<pathto>/springloaded.jar -noverify SomeJavaClass
```

explainmode会输出无法reload的诊断信息,例如

```
Feb 05, 2014 11:00:51 AM org.springsource.loaded.TypeRegistry couldBeReloadable
INFO: WhyNotReloadable? The type org/apache/maven/model/building/ModelBuilder is using a package name 'org/apache/' which is 
     considered infrastructure and types within it are not made reloadable
```

除了explain还有verbose模式, 这个模式会使用java.util.Logging输出reload过程详细信息.

```
Watcher Observed last modification time change for /Users/aclement/play/grails10411/jira-reload/target/classes/br/
        com/app/domains/CategoryController.class (lastScanTime=1391628759166)
Watcher Firing file changed event /Users/aclement/play/grails10411/jira-reload/target/classes/br/
        com/app/domains/CategoryController.class
ReloadableType Loading new version of br/com/app/domains/CategoryController, identifying suffix OV1YS1A,
               new data length is 27209bytes
```

当然, 上面俩个模式并不是互斥的, 我们可以对spring-loaded指定多个参数

```
-Dspringloaded=verbose;explain;profile=grails
```

看到了这么多, 其实还有一些特性没有测试到， 但是不想再自欺欺人了, 只有一个原因`-noverify`, 它关闭了JVM的字节码检查功能, 它让[JVM坐上火箭去了月球](https://blogs.oracle.com/buck/entry/never_disable_bytecode_verification_in)