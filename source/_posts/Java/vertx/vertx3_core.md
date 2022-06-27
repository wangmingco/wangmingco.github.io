---
category: Java
tag: vertx3
title: Vertx 3 Core
date: 2015-08-05 20:15:00
---

# In the beginning there was Vert.x

> NOTE
Much of this is Java specific - need someway of swapping in language specific parts

在Vert.x里，如果你不使用`Vertx`对象，你几乎是寸步难行。

`Vertx`对象扮演着Vert.x控制中心的角色，同时它也提供了大量的功能，例如：
* 创建客户端和服务器
* 获得`event bus`引用
* 设置定时器
* ...

如果你将Vert.x嵌入到你的应用程序中，你可以向下面这样获得一个`Vertx`对象的引用
```
Vertx vertx = Vertx.vertx();
```
If you’re using Verticles

> 注意： 在绝大多数应用程序中，你只需要一个Vert.x实例，但是如果你想要创建多个Vert.x实例，这也是可以的，例如你想要将`event bus`或者服务器与客户端进行隔离

## Specifying options when creating a Vertx object
当你实例化`Vertx`对象时，如果你感觉默认的参数不符合你的需求，你可以指定实例化时的参数：
```
Vertx vertx = Vertx.vertx(new VertxOptions().setWorkerPoolSize(40));
```

`VertxOptions`对象拥有N多设置，例如配置集群，高可用设置，线程池大小以及等等其他参数


# Are you fluent?

流式API(fluent API)是一种将方法进行链式调用的方式：
```
request.response().putHeader("Content-Type", "text/plain").write("some text").end();
```
在Vert.x APIs中，你都可以使用这种方式

进行链式调用可以避免你的代码看起来罗哩罗嗦的。当然，这并不是强制的，你也可以像下面这样书写你的代码。
```
HttpServerResponse response = request.response();
response.putHeader("Content-Type", "text/plain");
response.write("some text");
response.end();
```


# Don’t call us, we’ll call you.

Vert.x APIs大多数是基于事件驱动的。这意味着，在Vert.x中，当你关注的事件发生时，Vert.x会自动通知你。

例如当下面这些事件发生时，Vert.x就会自动通知你
* 定时器被触发
* socket中接收到数据
* 从磁盘中读取数据已经就绪
* 异常发生
* HTTP服务器接受到一个请求

我们需要通过向Vert.x APIs提供`handler`来处理Vert.x通知给我们的事件，例如下例中演示了我们每秒从定时器中接受一个事件
```java
vertx.setPeriodic(1000, id -> {
  // This handler will get called every second
  System.out.println("timer fired!");
});
```
或者接受一个HTTP请求
```java
server.requestHandler(request -> {
  // This handler will be called every time an HTTP request is received at the server
  request.response().end("hello world!");
});
```
当Vert.x中产生一个事件之后，它会异步地将这个事件传递到你设置的`handler`中

This leads us to some important concepts in Vert.x:

TODO


# Don’t block me!

With very few exceptions (i.e. some file system operations ending in 'Sync'), Vert.x中的API方法都不会阻塞该该方法的执行线程。

如果结果能够直接返回的话，那么你可以直接获得该结果进行后续处理，否则你需要提供一个handler，等结果正式产生之后再处理该结果。

因为Vert.x API不会阻塞任何线程，因此你可以使用少量的线程来处理非常大的并发量

在传统的阻塞API中，下面的操作会阻塞住当前的调用线程
* 从socket中读取数据
* 向磁盘中写入数据
* 向远端发送一条消息，同时等待消息返回
* … Many other situations

在上面的例子中，当你的线程等待一个结果时，这个线程就不能再做其他的任何事，这是非常低效的。

>`译者注：` 也许你会说这个线程被阻塞了，但是还有其他的线程可以工作啊，但是首先我们的目标是用少量地线程做大量的工作，当我们引入更多线程首先与我们的目标不符合，再有更多的线程会消耗更多的内存和更多的线程上下文切换操作

这意味着，如果你想要使用阻塞API进行大量并发操作，你需要非常多的线程以避免你的应用程序慢慢停止掉。

For the levels of concurrency required in many modern applications, a blocking approach just doesn’t scale.


# Reactor and Multi-Reactor

我们在前文中提到过Vert.x是基于事件驱动的，当Vert.x事件准备好之后，就会向事件传递给被设置的`handler`上

在大多数情况下，Vert.x会使用一个称为`event loop`的线程来调用你的handler

鉴于Vert.x以及你的应用程序不会产生任何阻塞操作，`event loop`会快速地将事件分发到不同的`handler`上

因为我们的任何操作都不会带来任何阻塞，因此一个`event loop`就可以在非常短的时间内，分发出去居多的事件。例如一个`event loop`就可以非常快速地处理数千个HTTP请求。

我们把这种模式称为[Reactor Pattern](http://en.wikipedia.org/wiki/Reactor_pattern).

你也许以前就听说过这种模式，例如`Node.js`就是这种模式的一种实现

在一个标准`reactor`实现中,会有一个单独的`event loop`线程进行可用事件轮询，只要有事件接听到，就将它发送到全部的handler上

但是这种实现有个小缺点，在任一时刻，它都会只运行在一个核心上，因此如果你想要你的单线程`reactor`应用程序在多核心服务器上进行拓展，那么你就需要启动并管理多个不同的`reactor`应用程序进程

但是Vert.x的工作模式与之不同。相比单线程`event loop`,每个`Vertx`实例都包含数个`event loop`. 在默认情况下,我们会根据所在机器的可用核心数来设置`event loop`数量,当然你也可以自己指定这个数量

我们把这种模式称为`Multi-Reactor Pattern`

> 注意：尽管`Vertx`实例会持有多个`event loop`,但是每一个`handler`都不会被并发执行, 而且在大多数情况下(工作者verticle除外),`handler`会被同一个`event loop执行`

# The Golden Rule - Don’t Block the Event Loop

我们已经知道`Vert.x API`不会有任何阻塞操作,也不会阻塞住`event loop`. 但是如果在你自己处理handler时阻塞住了当前线程(工作者vertile除外)，那么同样会影响Vert.x性能

如果你确实在handler处理时，阻塞住了`event loop`,那么`event loop`会一直等待你的操作完成，在等待的时候它只是傻傻地干等着。如果你讲`Vertx`对象中的所有`event loop`都阻塞住了话，那么你的应用程序不久就会挂掉了。

我们下面举出一些常见的阻塞操作：
* Thread.sleep()
* 等待锁
* Waiting on a mutex or monitor (e.g. synchronized section)
* 执行一个长时间的数据库操作，并同步等待结果的返回
* 执行耗时较长的复杂计算
* 在循环中进行自旋

如果某个操作耗费大量时间引发了上述问题,从而阻塞了`event loop`,那么你应该直接跳过当前操作.

那么多长的时长才能被称为大量时间呢? 这完全取决于你的应用的并发数量。


如果只在一个`event loop`中，你想要每秒处理10000个http请求，那么处理每个请求不能超过0.1ms，因此在`event loop`中每次处理过程中的阻塞时间不能超过0.1ms

******The maths is not hard and shall be left as an exercise for the reader******.

如果你的应用程序没有应答，也许是因为在某些地方阻塞住了`event loop`.为了能够帮你确定那个问题，当在一定时间内`event loop`都没有返回的话，Vert.x会自动对此产生警告日志。如果你在日志中见到了像那样的警告，你就需要好好研究一下问题出在哪里了。

例如`vertx-eventloop-thread-3`线程已经被阻塞了20458 ms，Vert.x会提供堆栈信息帮你找到阻塞发生的具体位置。

如果你想要关闭那么警告信息或者改变一些其他设置，那么你可以在创建`Vertx`对象之前，在`VertxOptions`中进行设置

# Running blocking code

在一个完美的世界里，那么没有战争和饥饿，全部的API也都会被书写成异步形式的，

###### But.. the real world is not like that. (Have you watched the news lately?)

Fact is, many, if not most libraries, especially in the JVM ecosystem have synchronous APIs and many of the methods are likely to block. A good example is the JDBC API - it’s inherently asynchronous, and no matter how hard it tries, Vert.x cannot sprinkle magic pixie dust on it to make it asynchronous.

但事实上，许多类库，尤其是在JVM生态系统中拥有大量同步API而且许多方法都会产生阻塞。一个非常著名的例子就是`JDBC API`,它被设计出来就是同步的，Vert.x无论怎么优化都不能将它变成异步的。

我们并不准备将所有的东西都重写成异步的，因此我们提供了一种方式，以便你可以在Vert.x应用程序中使用传统的阻塞API

正如像在前面讨论的那样，你不能在`event loop`直接调用阻塞操作,那么你要如何去执行一个阻塞操作呢？

我们可以通过调用`executeBlocking`方法来执行阻塞代码, 同样当这个方法执行完阻塞代码之后，会异步地调用`result handler`.
```
vertx.executeBlocking(future -> {
  // Call some blocking API that takes a significant amount of time to return
  String result = someAPI.blockingMethod("hello");
  future.complete(result);
}, res -> {
  System.out.println("The result is: " + res.result());
});
```
还有一种执行阻塞代码的方式，那就是使用`worker verticle`


# Verticles

`Vert.x`引入了一个简单的可扩展的类`actor`的部署和并发模型.

###### 这个模型是可选的, 如果你不想要采取该模型也可以不实现它,vertx并不强制要求你实现它.

这个模型并不是`actor-model`的严格实现, 但是该模型在并发处理,拓展模式和开发模式上确实和`actor-model`非常像。

其实当我们在`verticle`中开始实现逻辑代码时，就已经开始使用这个开发模型了。

> `verticle`简而言之就是一个代码块,然后你通过Vert.x部署和运行它. 我们可以使用Vert.x支持的不同语言实现`verticle`,而且一个单独的应用程序中可以包含多种语言实现的`verticle`.
> 
> 你可以把`verticle`理解成`Actor`模型中的`actor`.

一般来说,一个Vert.x应用应该只是由`verticle`实例构成.不同的 `verticle`可以在`event bus`上通过发送消息进行交互.

## Writing Verticles
Java`verticle`必须实现`Verticle`接口。

当然如果你不想实现这个接口，还有一种其他定义方法，那就是继承`AbstractVerticle`抽象类
```java
public class MyVerticle extends AbstractVerticle {

  // Called when verticle is deployed
  public void start() {
  }

  // Optional - called when verticle is undeployed
  public void stop() {
  }

}
```

`verticle`在被Vert.x部署的过程中,`verticle`的`start`方法会被调用,当`start`方法被调用完之后,`verticle`就被认为部署完成.

`verticle`实现中像例子中`start`方法是必须要实现的,但是`stop`方法可以选择不实现. `stop`方法是当`verticle`被`undeployed`进行调用的,当`stop`方法调用完成之后,`verticle`就被认为停止运行了

## Asynchronous Verticle start and stop

有时你想要在`verticle`开始部署阶段(`start`方法中)完成一些耗时的操作,但是当这些操作完成之前,你不希望当前`verticle`处于部署完成状态.例如你想要在`start`方法中部署其他`verticle`，但是由于部署是异步进行的,因此可能主`verticle`都已经返回了,但是其他`verticle`的部署工作还没有完成,那么你就不想让主`verticle`处于完成状态.

但是你也不能在`start`方法中进行阻塞等待其他`verticle`部署完成,在`event loop`无论何时你都不应该把它阻塞掉。

那么该怎么办呢？我们的办法是你实现一个`asynchronous`的`start`方法,这个方法会传入一个`Future`对象作为参数.即使当`start`方法返回了,该`verticle`也不会被认为已经完成部署了。

当你在start方法里所有的工作都完成之后,通过调用`Future`对象的`complete`方法,在外部获得一个通知,部署工作真正完成了.

```java
public class MyVerticle extends AbstractVerticle {

  public void start(Future<Void> startFuture) {
    // Now deploy some other verticle:

    vertx.deployVerticle("com.foo.OtherVerticle", res -> {
      if (res.succeeded()) {
        startFuture.complete();
      } else {
        startFuture.fail();
      }
    });
  }
}
```
同样的,`stop`方法也有一个`asynchronous`版本的.
```java
public class MyVerticle extends AbstractVerticle {

  public void start() {
    // Do something
  }

  public void stop(Future<Void> startFuture) {
    obj.doSomethingThatTakesTime(res -> {
      if (res.succeeded()) {
        startFuture.complete();
      } else {
        startFuture.fail();
      }
    });
  }
}
```
> 注意,通过`verticle`部署的`vertcle`，这俩种`vertcle`会构成一种"父子"关系，当父`verticle`被`undeploy`后,子`verticle`会自动被Vert.x进行`undeploy`

## Verticle Types
在Vert.x中有三种不同类型的`verticle`

* `Standard Verticles` : 这是最常用的一种. 这种`verticle`通过`event loop`线程执行.接下来我们会详细讨论这种`verticle`.
* `Worker Verticles` : 这种`verticle`通过`worker pool`中的线程执行。该`verticle`在同一时刻永远不会被多个线程并发执行
* `Multi-threaded worker verticles` : 该`verticle`同样通过`worker pool`中的线程执行.但是这种`verticle`可能会被多个线程并发执行.


### Standard verticles

`Standard Verticles`当被创建的时候会被分配到一个`event loop`上, 同时`Standard Verticles`的`start()`会被该`event loop`进行调用. 当你在`event loop`中,通过核心API以及带有`handler`参数的的方式调用其他方法时,`Vert.x`确保那些`handler`回调时是被刚才那个`event loop`进行调用的.

这意味着,我们能保证`vertcle`实例里全部代码总是能被相同的`event loop`进行调用(当然这是在你不故意自己创建线程调用他们的前提下).

这意味着,当你基于Vert.x开发应用程序时,vert.x会帮你完成那些并发操作,你自己完全不需要考虑多线程和并发情况,只需要像在单线程中那样写代码就好了. 从此你的生活就远离了`synchronized`, `volatile`, `条件竞争`, `死锁`等等..

### Worker verticles

`worker verticle`和`standard verticle`相比,`worker verticle`并不是运行在`event loop`中,而是在`worker thread pool`中的某个线程中运行.

`worker verticle`是被设计成专门用来调用阻塞代码的,他们不会阻塞掉任何的`event loop`.

如果你不想在`worker verticle`中运行阻塞代码, 你也可以在`event loop`中执行运行内联的阻塞代码.

如果你想要部署`worker verticle`时, 你可以使用`setWorker()`.
```java
DeploymentOptions options = new DeploymentOptions().setWorker(true);
vertx.deployVerticle("com.mycompany.MyOrderProcessorVerticle", options);
```
`Worker verticle`实例永远不会被多线程同一时间并发执行,但是却可以在不同的时间被不同的线程执行.

###Multi-threaded worker verticles

`multi-threaded worker verticle`和`worker verticle`很像,只不过这种`multi-threaded worker verticle`可以被多个不同线程并发执行.

> 注意:`multi-threaded worker verticle`是一个非常高级的特性,而且大部分的应用程序并不会需要使用到它. 因为在这种`verticle`中的并发操作,你需要非常小心通过使用传统的多线程编程技术保持`verticle`的状态一致性.

## Deploying verticles programmatically
你可以通过`deployVerticle()`方法部署一个`verticle`, 使用这种方式你需要指定该`verticle`的名字或者传递一个你已经创建好的该`verticle`的实例.

> 注意: 只有在java中才可以部署Verticle实例

```java
Verticle myVerticle = new MyVerticle();
vertx.deployVerticle(myVerticle);
```

`verticle`名字用来查找特定的`VerticleFactory`, 我们使用`VerticleFactory`来实例化出实际的`verticle`实例.

不同的`VerticleFactory`用于在不同的语言实现中对`verticle`进行实例化, 除此之外不同的`VerticleFactory`也用于加载`service`或者在`Maven`运行时获得`verticle`.

这种特性可以让你在某种语言中部署其他语言实现的`verticle`.

下面的例子演示了在Java中部署不同语言类型的`verticle`
```java
vertx.deployVerticle("com.mycompany.MyOrderProcessorVerticle");

// Deploy a JavaScript verticle
vertx.deployVerticle("verticles/myverticle.js");

// Deploy a Ruby verticle verticle
vertx.deployVerticle("verticles/my_verticle.rb");
```

## Rules for mapping a verticle name to a verticle factory

当使用`verticle`名称部署`verticle`时,这个名字被用来找到实际的`VerticleFactory`,对`verticle`进行实例化

`verticle`名称还可以有一个前缀(随后跟一个冒号),当该前缀被指定后,会使用该前缀来查找`VerticleFactory`.
```java
js:foo.js // Use the JavaScript verticle factory
groovy:com.mycompany.SomeGroovyCompiledVerticle // Use the Groovy verticle factory
service:com.mycompany:myorderservice // Uses the service verticle factory
```

如果我们并没有指定前缀,那么Vert.x会去名称中找到后缀(文件类型),然后使用该后缀找到`VerticleFactory`.
```
foo.js // Will also use the JavaScript verticle factory
SomeScript.groovy // Will use the Groovy verticle factory
```
但是如果既没有前缀，也没有后缀被找到,那么Vert.x会认为这个名称是个Java类的全限定名,使用使用这个全限定名进行实例化

## How are Verticle Factories located?

在Vert.x启动时,它会在`classpath`中对大多数的`VerticleFactory`加载和注册.

当然如果你想在程序中通过编程的方式对`VerticleFactory`进行注册和解除注册到话,你可以使用`registerVerticleFactory`和`unregisterVerticleFactory`方法

## Waiting for deployment to complete

同样`verticle`的部署也是异步进行的, 当调用部署方法进行返回的时候也许部署操作并没有真正的,可能要等到过一段时间才能真正完成,

如果你想当部署操作真正完成的时候捕获一个通知,你可以在部署方法里添加一个`completion handler`,用于处理完成时候你想进行的特定操作.
```java
vertx.deployVerticle("com.mycompany.MyOrderProcessorVerticle", res -> {
  if (res.succeeded()) {
    System.out.println("Deployment id is: " + res.result());
  } else {
    System.out.println("Deployment failed!");
  }
});
```

如果部署成功了,handler会捕获一个result(内含一个字符串形式的部署ID).

当你后期想要对`verticle`进行`undeploy`操作时,你就需要使用刚才的那个部署成功时获得的字符串形式的部署ID了.

## Undeploying verticle deployments

当`verticle`被部署成功之后,我们也可以通过调用`undeploy`方法对其进行`undeploy`操作.

当然`undeploy`一样是异步进行的,如果你想当`undeploy`操作完成时同样捕获通知,你也可以对`undeploy`方法设置一个`completion handler`.
```java
vertx.undeploy(deploymentID, res -> {
  if (res.succeeded()) {
    System.out.println("Undeployed ok");
  } else {
    System.out.println("Undeploy failed!");
  }
});
```

## Specifying number of verticle instances

当你使用`verticle`名字对某个`verticle`进行部署时,你也可以指定该verticle部署成功后的实例数量:
```java
DeploymentOptions options = new DeploymentOptions().setInstances(16);
vertx.deployVerticle("com.mycompany.MyOrderProcessorVerticle", options);
```

当我们想在多核主机上对应用进行拓展时,通过这种方式就可以轻松实现了. 假设,你现在要在一个多核主机上部署一个`web-server verticle`,因此你想要对该`verticle`部署多个实例以便能使用上所有核心.

## Passing configuration to a verticle

当`verticle`被部署时,我们还可以向其指定一个JSON形式的配置:
```java
JsonObject config = new JsonObject().put("name", "tim").put("directory", "/blah");
DeploymentOptions options = new DeploymentOptions().setConfig(config);
vertx.deployVerticle("com.mycompany.MyOrderProcessorVerticle", options);
```
稍后我们就可以通过`Context`对象来操作`Configuration`配置了

TODO

## Accessing environment variables in a Verticle
TODO

## Verticle Isolation Groups
By default, Vert.x has a flat classpath. I.e, it does everything, including deploying verticles without messing with class-loaders. In the majority of cases this is the simplest, clearest and sanest thing to do.

Vert.x默认有一个`flat classpath`,它会实现N多功能,包括在部署`verticle`时不会干扰类加载的工作. 在大多数情况下,这是最简单，清晰，明智的事情。

However, in some cases you may want to deploy a verticle so the classes of that verticle are isolated from others in your application.

This might be the case, for example, if you want to deploy two different versions of a verticle with the same class name in the same Vert.x instance, or if you have two different verticles which use different versions of the same jar library.

> WARNING
Use this feature with caution. Class-loaders can be a can of worms, and can make debugging difficult, amongst other things.
Here’s an example of using an isolation group to isolate a verticle deployment.
```java
DeploymentOptions options = new DeploymentOptions().setIsolationGroup("mygroup");
options.setExtraClasspath(Arrays.asList("lib/jars/some-library.jar"));
vertx.deployVerticle("com.mycompany.MyIsolatedVerticle", options);
```
Isolation groups are identified by a name, and the name can be used between different deployments if you want them to share an isolated class-loader.

Extra classpath entries can also be provided with setExtraClasspath so they can locate resources that are isolated to them.

## High Availability
Verticles can be deployed with High Availability (HA) enabled.



TODO

## Running Verticles from the command line

通常做法是你可以在`Maven`或者`Gradle`项目中添加一个`Vert.x core library`引用,你就可以直接运行Vert.x了.

然而,你如果不习惯那种做法,你还可以直接在命令行中执行运行`Vert.x verticle`.

在命令行中运行Vert.x你需要下载`Vert.x`的分发版本,然后将安装好的bin目录添加到`Path`环境变量中,同时要确保在`PATH`中你也添加上了JDK8.

下例演示了如何直接在命令中运行`verticle`
```java
# Run a JavaScript verticle
vertx run my_verticle.js

# Run a Ruby verticle
vertx run a_n_other_verticle.rb

# Run a Groovy script verticle, clustered

vertx run FooVerticle.groovy -cluster
```

令人惊喜的是,你可以在命令行中直接运行java源文件.
```java
vertx run SomeJavaSourceFile.java
```
`Vert.x`会在运行该java源文件之前自己去编译它. 这对于`quickly prototyping verticle`和写`verticle demo`是非常有用的.

## Causing Vert.x to exit
Threads maintained by Vert.x instances are not daemon threads so they will prevent the JVM from exiting.



如果你将Vert.x嵌入在了你的应用程序中,而且当你的应用程序已经使用完了Vert.x的功能,你需要关闭掉Vert.x的时候,你可以直接调用`close`将其关闭掉.

这个操作会关闭Vert.x内部所有的线程池和其他的资源,但是并不会让JVM也跟着关闭掉.

## The Context object
TODO

## Executing periodic and delayed actions
It’s very common in Vert.x to want to perform an action after a delay, or periodically.

在`standard verticle`中,你不能因为想要得到一个延迟的效果就将线程`sleep`掉,因为这个操作会将`event loop`线程阻塞掉.

取而代之的是,你可以使用`Vert.x timers`,`Vert.x timers`既可以执行一次也可以周期性执行.

### One-shot Timers

`one shot timer`会在一个特定的延迟后(单位毫秒)调用一个`event handler`.

设置`one shot timer`是非常简单的,调用`setTimer`方法然后设置一个延迟和一个`handler`就ok了.
```java
long timerID = vertx.setTimer(1000, id -> {
  System.out.println("And one second later this is printed");
});

System.out.println("First this is printed");
```
这个返回的返回值是一个唯一的`timer id`,如果你想在后期取消掉这个`timer`,就需要使用这个id了.

### Periodic Timers

你可以通过调用`setPeriodic`方法设置一个周期性的定时器.

There will be an initial delay equal to the period.



The return value of setPeriodic is a unique timer id (long). This can be later used if the timer needs to be cancelled.

The argument passed into the timer event handler is also the unique timer id:
```java
long timerID = vertx.setPeriodic(1000, id -> {
  System.out.println("And every second this is printed");
});

System.out.println("First this is printed");
```

### Cancelling timers

To cancel a periodic timer, call cancelTimer specifying the timer id. For example:
```java
vertx.cancelTimer(timerID);
```

### Automatic clean-up in verticles

If you’re creating timers from inside verticles, those timers will be automatically closed when the verticle is undeployed.


# The Event Bus

`event bus`是Vert.x的神经系统。

每一个`Vertx`对象内部都有一个唯一的`event bus`实例，我们可以通过`eventBus`这个方法获取它的引用。

`event bus`可以让你的应用程序的不同组件进行交互, 但是强大的是进行交互的组件可以自由选择实现语言，而且并不局限于仅仅只有在相同的`Vertx`实例内的组件才能交互。

`event bus`构成了一个在多个服务器节点和多个浏览器间的分布式端对端消息系统。

`event bus`还支持以下三种消息模式：`publish/subscribe`, `point to point`, `request-response messaging`

`event bus`API是非常简单的,你基本只需要调用`registering handlers`, `unregistering handlers` 以及`sending messages`, `publishing messages`


## The Theory
### Addressing

我们通过`event bus`向一个地址发送`Message`.

在Vert.x中不需要担心是否会使用到复杂的寻址方案. 在Vert.x中，地址就是一个简单的合法字符串。Vert.x的地址还使用了一些`scheme`,例如使用`.`分割命名空间区间。

一些合法的地址例如：`europe.news.feed1`, `acme.games.pacman`, `sausages`, and `X`

### Handlers

我们使用`handler`从`event bus`中接收消息,因此你只需向一个`address`注册一个`handler`。

`handler`和`address`是一种多对多的关系,这意味着,一个`handler`可以向很多个`address`注册,同时多个`handler`可以向同一个`address`注册

### Publish / subscribe messaging

`event bus`也支持`publishing messages`:
消息会被发布到某一个地址上.这意味着：某一消息会发布给在某个地址上注册的全部`handler`。这和`publish/subscribe`消息模式很像。

### Point to point and Request-Response messaging

`event bus`支持点对点消息传送.

这种模式下消息会被发送到一个地址上。Vert.x然后会在该地址上的N个handler中选择一个,然后将消息传递给被选择的handler。

如果某个地址上注册了多个handler，Vert.x会根据`non-strict round-robin`算法来选取一个。

在点对点传送消息的情况中，当发送消息时，可以指定一个可选的回复handler。当接受者接受到一个消息后，同时该Message被处理后，接受者可以选择是否回应该消息。如果接受者选择回应该消息，那么reply handler会被调用。

当发送者接收到消息回应后，发送者还可以选择接着回应。这种模式可以永远重复下去，Vert.x还支持在这俩个verticle中创建一个会话。

这种通用的消息模式称为`Request-Response`模式。

### Best-effort delivery

Vert.x会尽自己的全力进行消息分发,而且Vert.x保证不会主动抛弃消息,这种模式称为`best-effort delivery`.

然而,当`event bus`失效时,可能会发生消息丢失情况.如果你的应用程序不允许出现消息丢失,那么你应该将你的`handler`编码成`idempotent`(code your handlers to be idempotent),当`event bus`恢复正常后,你的消息发送者再次尝试发送消息.

### Types of messages

Vert.x 消息支持所有的原生类型, `String`, `Buffer`. 但是在Vert.x中一般是使用`JSON`作为消息数据格式. 这是因为在Vert.x所支持的所有语言中，都很容易创建,读取和解析`JSON`。

当然，Vert.x并不强制你必须使用`JSON`作为消息数据传输格式。

`event bus`本身是非常灵活的,而且支持发送任意的对象数据,只要你能进行编解码就可以

## The Event Bus API
Let’s jump into the API

### Getting the event bus

下例我们演示一下如何获得`EventBus`引用：
```java
EventBus eb = vertx.eventBus();
```
每一个`Vertx`实例中都有一个`event bus`实例。

### Registering Handlers

下例演示了如何在`event bus`上注册一个`handler`
```java
EventBus eb = vertx.eventBus();

eb.consumer("news.uk.sport", message -> {
  System.out.println("I have received a message: " + message.body());
});
```
当你的`handler`收到一条`message`时, `handler`会自动被调用.

调用`consumer(.., ..)`方法的返回值是一个`MessageConsumer`实例.

我们可以通过`MessageConsumer`实例来`unregister handler`,也可以像流一样使用那个`handler`

或者你可以不向`consumer`方法中设置`handler`,那么你同样会获得一个`MessageConsumer`实例，你可以在`MessageConsumer`实例上再设置`handler`
```java
EventBus eb = vertx.eventBus();

MessageConsumer<String> consumer = eb.consumer("news.uk.sport");
consumer.handler(message -> {
  System.out.println("I have received a message: " + message.body());
});
```
当向一个集群的`event bus`上注册一个`handler`时,那么就需要向集群中的每一个节点上都要注册一个该`handler`，那这就需要消耗一些时间了。

如果你需要当向集群中所有的节点都注册完成时，捕获一个通知，那么你可以再在`MessageConsumer`上注册一个`"completion" handler`.
```java
consumer.completionHandler(res -> {
  if (res.succeeded()) {
    System.out.println("The handler registration has reached all nodes");
  } else {
    System.out.println("Registration failed!");
  }
});
```
### Un-registering Handlers

想要`unregister`一个`handler`只需要调用`unregister`方法就可以了

如果你当前的环境是一个集群环境, 那么就需要向整个集群中的所有节点都执行`unregister`操作，这同样需要一些时间等待,当然你也可以注册一个`"completion" handler`
```java
consumer.unregister(res -> {
  if (res.succeeded()) {
    System.out.println("The handler un-registration has reached all nodes");
  } else {
    System.out.println("Un-registration failed!");
  }
});
```

### Publishing messages

`publish`消息同样是非常简单的,你只需要向目标`address`上调用`publish`方法就可以了
```
eventBus.publish("news.uk.sport", "Yay! Someone kicked a ball");
```
这个消息会被分发到在目标地址上注册所有的`handler`上.

### Sending messages

`Sending`出来的消息则只会在目的地址上注册的某个`handler`接受.这是一种`point to point`消息模式.`handler`的选择同样采用的是`non-strict round-robin`算法

下例演示了如何`send message`
```java
eventBus.send("news.uk.sport", "Yay! Someone kicked a ball");
```

### Setting headers on messages

在`event bus`上传送的消息同样可以带有消息头. 在`sending`和`publishing`这俩种模式下,可以通过`DeliveryOptions`对象指定消息头
```java
DeliveryOptions options = new DeliveryOptions();
options.addHeader("some-header", "some-value");
eventBus.send("news.uk.sport", "Yay! Someone kicked a ball", options);
```

### The Message object

在消息`handler`上你接受的对象是一个`Message`实例

`Message`实例中的`body`就相当于被`sent`或者`publish`的对象.

我们还可以通过`headers`方法获得`message`的`header`.

### Replying to messages

有时候当你`send`出一个消息之后,你可能期待某些答复. 这种消息模式被称为`request-response pattern`

想要达到这种效果,你可以在`send`消息时设置一个`reply handler`.

当消息接收者收到消息后,可以通过调用消息上的`reply`方法进行应答

当接收者通过消息的`reply`方法进行应答时，那么发送者在`send`时设置的`reply handler`将会被调用,下面给出了这种应答模式的演示：

The receiver:
```java
MessageConsumer<String> consumer = eventBus.consumer("news.uk.sport");
consumer.handler(message -> {
  System.out.println("I have received a message: " + message.body());
  message.reply("how interesting!");
});
```
The sender:
```java
eventBus.send("news.uk.sport", "Yay! Someone kicked a ball across a patch of grass", ar -> {
  if (ar.succeeded()) {
    System.out.println("Received reply: " + ar.result().body());
  }
});
```
这种应答可以形成往复的应答模式从而生成一个会话

### Sending with timeouts

在`send`发送消息时，如果指定了一个`reply handler`,那么你还可以通过`DeliveryOptions`设置一个超时时间(默认是30s)。

当在指定的时间内没有收到对方应答时，`reply handler`将会以一种失败的状态被调用

### Send Failures

在消息发送时可能会在下面几种情况下引发失败：
* There are no handlers available to send the message to
* The recipient has explicitly failed the message using fail

In all cases the reply handler will be called with the specific failure.

### Message Codecs

如果你对在`event bus`上传送的对象指定一个消息编码器并且在`event bus`上注册了该消息编码器, 那么无论该对象是何类型，你都可以在`event bus`上对其进行传递.

当你`sending`或者`publishing`一个对象时, 你需要在`DeliveryOptions`对象里指定该对象所对应的编码器名称.
```java
eventBus.registerCodec(myCodec);

DeliveryOptions options = new DeliveryOptions().setCodecName(myCodec.name());

eventBus.send("orders", new MyPOJO(), options);
```

你也可以在`eventBus`上指定一个默认的编码器，这样一来，当你再`send`消息时，就不用每次都手动的设置编码器了
```java
eventBus.registerDefaultCodec(MyPOJO.class, myCodec);

eventBus.send("orders", new MyPOJO());
```
如果你想要解除一个消息编码器，你只需要使用`unregisterCodec`就好了

Message codecs don’t always have to encode and decode as the same type. For example you can write a codec that allows a MyPOJO class to be sent, but when that message is sent to a handler it arrives as a MyOtherPOJO class.



### Clustered Event Bus

`event bus`的作用域并不是单单的在一个单独的`Vertx`实例里。在集群里，你的局域网中的不同的`Vertx`实例可以聚合在一起，而每一个`Vertx`实例里的`event bus`可以相互聚集形成一个单独的分布式的`event bus`。

### Clustering programmatically

如果你通过编程的方式使用集群方法创建`Vertx`实例,在这种方式下你就得到了一个集群`event bus`
```java
VertxOptions options = new VertxOptions();
Vertx.clusteredVertx(options, res -> {
  if (res.succeeded()) {
    Vertx vertx = res.result();
    EventBus eventBus = vertx.eventBus();
    System.out.println("We now have a clustered event bus: " + eventBus);
  } else {
    System.out.println("Failed: " + res.cause());
  }
});
```
你必须确保你已经在`classpath`上实现了`ClusterManager`, 例如你也可以使用Vertx的`ClusterManager`实现

### Clustering on the command line

你可以通过下面的方式进行命令行的集群配置
```java
vertx run MyVerticle -cluster
```
##Automatic clean-up in verticles
If you’re registering event bus handlers from inside verticles, those handlers will be automatically unregistered when the verticle is undeployed.


## Examples

#### Codec
```java
class ClientCodec implements MessageCodec<ClientSource, ClientTarget> {

	/*
	 * 当把对象s传输网络中时,该方法会被调用. 
	 * 会将s写入buffer中
	 */
	@Override
	public void encodeToWire(Buffer buffer, ClientSource s) {
		
	}

	/*
	 * pos表示从buffer哪里开始读
	 */
	@Override
	public ClientTarget decodeFromWire(int pos, Buffer buffer) {
		return null;
	}

	/*
	 * 如果message是在本地event bus上传递上传输时, 该方法会被调用, 将ClientSource类型对象改变为ClientTarget
	 */
	@Override
	public ClientTarget transform(ClientSource s) {
		return null;
	}

	/*
	 * 该编码器的名称, 每个编码器都必须有一个唯一的名字. 当发送message或者从event bus上解除编码器的时候,需要使用到该编码器
	 */
	@Override
	public String name() {
		return null;
	}

	@Override
	public byte systemCodecID() {
		return -1;
	}

}

class ClientSource {
	
}

class ClientTarget {
	
}
```

# JSON

不像其他语言,JAVA并没有一等类来支持`JSON`,因此Vert.x提供了下面俩个类让`JSON`的使用更加简便

## JSON objects

`JsonObject`表示一个`JSON`对象。

`JsonObject`基本上只是一个`string key`和`value`的一个映射,`value`可以是`JSON`支持的数据类型的一种(`string, number, boolean`)

同时`JSON`对象还支持`null`值

###Creating JSON objects

如果使用默认的`JsonObject`构造器创建出来的就是一个空`JSON`对象

You can create a JSON object from a string JSON representation as follows:
你也可以使用一个`String`表示的`JSON`来创建一个`JsonObject`对象。
```
String jsonString = "{\"foo\":\"bar\"}";
JsonObject object = new JsonObject(jsonString);
```

###Putting entries into a JSON object

我们可以直接使用`put`方法向`JsonObject`中添加元素
```
JsonObject object = new JsonObject();
object.put("foo", "bar").put("num", 123).put("mybool", true);
```

###Getting values from a JSON object

我们可以直接使用`get...`方法从`JsonObject`中获取某个值。
```
String val = jsonObject.getString("some-key");
int intVal = jsonObject.getInteger("some-other-key");
```

###Encoding the JSON object to a String

你可以直接使用`encode`方法将某个对象编码成字符串形式

## JSON arrays

`JsonArray`表示的是`JSON`数组

`JSON`数组就是`JSON value`的一个序列

`JSON`数组还可以包含`null`值


### Creating JSON arrays

如果使用默认的`JsonArray`构造器创建出来的就是一个空`JSON`数组对象

你也可以使用一个`String`表示的`JSON`来创建一个`JsonArray`对象。
```
String jsonString = "[\"foo\",\"bar\"]";
JsonArray array = new JsonArray(jsonString);
```

你可以直接使用`add`方法向一个`JsonArray`中添加元素
```
JsonArray array = new JsonArray();
array.add("foo").add(123).add(false);
```

###Getting values from a JSON array

同样的你可以使用`get...`方法直接从`JsonArray`获取元素
```
String val = array.getString(0);
Integer intVal = array.getInteger(1);
Boolean boolVal = array.getBoolean(2);
```

### Encoding the JSON array to a String

你可以直接使用`encode`方法将`JsonArray`编码成`String`


# Buffers

在Vert.x中进行数据传播的大多是org.vertx.java.core.buffer.Buffer实例

`Buffer`表示的是一个字节序列(size >= 0), 可以向Buffer写入或者读取数据, 当写入数据时，超过其容量最大值时，会自动拓容。

## Creating buffers

我们可以直接使用一系列`Buffer.buffer`开头的静态方法来创建一个`Buffer`.

`Buffer`可以从`String`或者`byte arrays`进行初始化,当然我们也可以直接创建出一个空`Buffer`.

下面给出了一些创建`Buffer`的示例：

创建一个内容为空的`Buffer`
```java
Buffer buff = Buffer.buffer();
```

创建一个`Buffer`,并使用`String`进行初始化,在`Buffer`内部该字符串会使用`UTF-8`进行编码
```java
Buffer buff = Buffer.buffer("some string");
```

创建一个`Buffer`,并使用`String`进行初始化,在`Buffer`内部该字符串会使用指定的编码方法进行编码
```java
Buffer buff = Buffer.buffer("some string", "UTF-16");
```

创建一个`Buffer`,并使用`byte[]`进行初始化
```java
byte[] bytes = new byte[] {1, 3, 5};
Buffer buff = Buffer.buffer(bytes);
```

我们还可以在创建`Buffer`时指定其初始化大小。如果你能确定向`Buffer`写入数据的大小，那么你可以在创建`Buffer`指定其初始化大小。当`Buffer`创建成功之后，`Buffer`就会被分配出所指定的内存，一般来说这种方式适用于你的`Buffer`在不断地自动拓容的情况下。

需要注意的是，使用指定大小的方式创建一个`Buffer`，它本身是空的，只是分配了那么多内存而已。它并不会使用0来填充整个`Buffer`。
```java
Buffer buff = Buffer.buffer(10000);
```

## Writing to a Buffer
有俩种方式向`Buffer`中添加数据：`appending`和`random access`. 不管使用哪种方式,`Buffer`都会当容量不足时进行自动拓容。

### Appending to a Buffer

`Buffer`提供了多种`append`方法，向`Buffer`中追加不同类型的数据。而且`append`方法返回的都是`Buffer`自身，因此我们可以使用链式调用`append`方法

```java
Buffer buff = Buffer.buffer();

buff.appendInt(123).appendString("hello\n");

socket.write(buff);
```

### Random access buffer writes

你也可以通过一系列`set`方法在某个合法的索引位置上写入数据。在`set`方法中第一个参数是要开始写入数据的索引位置,第二个参数是要写入的数据

```java
Buffer buff = Buffer.buffer();

buff.setInt(1000, 123);
buff.setString(0, "hello");
```

## Reading from a Buffer

我们通过一系列`get`方法从`Buffer`中读取数据,第一个参数是要开始读取的索引位置。
```java
Buffer buff = Buffer.buffer();
for (int i = 0; i < buff.length(); i += 4) {
  System.out.println("int value at " + i + " is " + buff.getInt(i));
}
```
## Buffer length
使用`length`方法来获得`Buffer`的长度, `length`的取值方式是最大的索引值+1

## Copying buffers
使用`copy`可以直接对`Buffer`进行数据拷贝

> 拷贝之后的俩个`Buffer`是否使用同一个缓冲区

## Slicing buffers
我们使用`slice`方法创建一个`sliced buffer`,它与原`Buffer`共享一个数据缓冲区。

##Buffer re-use
当`Buffer`被写入到`socket`中，或者其他的一些类似的地方，他们就不能被复用了


# TCP Server

## Creating a TCP server
我们使用默认的选项(`HttpServerOptions`)来创建一个最简单的`TCP`服务器.
```java
NetServer server = vertx.createNetServer();
```

## Configuring a TCP server
如果想要对创建的服务器进行特殊配置,可以使用`HttpServerOptions`来创建服务器。
```java
NetServerOptions options = new NetServerOptions().setPort(4321);
NetServer server = vertx.createNetServer(options);
```

## Start the Server Listening

我们提供了众多的`listen`方法,下面我们选择一个不带参数的`listen`方法(端口和主机地址已经在刚才的`HttpServerOptions`中指定了)
```java
NetServer server = vertx.createNetServer();
server.listen();
```

下面我们在`listen`方法中显式地指定监听的端口和网卡地址(这时候会忽略掉`HttpServerOptions`中设置的端口号)
```java
NetServer server = vertx.createNetServer();
server.listen(1234, "localhost");
```

`listen`方法默认监听的地址是`0.0.0.0`(所有可用地址),默认的端口是0(这种情况下会随机选择一个可用的端口). 需要注意的是绑定操作(`listen`)是异步进行的,所以当`listen`方法返回之后并不保证绑定操作已经成功.
在示例中我们添加了一个`handler`用于接受绑定成功之后的通知.
```java
NetServer server = vertx.createNetServer();
server.listen(1234, "localhost", res -> {
  if (res.succeeded()) {
    System.out.println("Server is now listening!");
  } else {
    System.out.println("Failed to bind!");
  }
});
```

## Listening on a random port

当我们监听端口号为0时,系统会自动随机选择一个实际可用的端口进行监听,如果想要获取真实监听端口可以调用`actualPort`方法.
```java
NetServer server = vertx.createNetServer();
server.listen(0, "localhost", res -> {
  if (res.succeeded()) {
    System.out.println("Server is now listening on actual port: " + server.actualPort());
  } else {
    System.out.println("Failed to bind!");
  }
});
```

## Getting notified of incoming connections

下例中我们设置了一个`connectHandler`,用于处理服务器接受到的网络连接
```java
NetServer server = vertx.createNetServer();
server.connectHandler(socket -> {
  // Handle the connection in here
});
```

当网络连接建立成功之后,`handler`就会自动被调用(同时会带有一个`NetSocket`对象作为参数)

`NetSocket`是对实际网络连接的一个`类Socket`接口抽象(`socket-like interface`),你可以在这个接口进行读写数据,或者直接关闭Socket等操作.

## Reading data from the socket
To read data from the socket you set the handler on the socket.

想要读取Socket中的数据,那你就需要调用`NetSocket`的`handler`方法,设置一个`handler`,用于处理数据.

当Socket流中有数据到达时,服务器就会将接受到的数据封装成一个`Buffer`对象,然后刚刚在`NetSocket`上设置的那个`handler`就会被调用.
> 考虑半包处理
```java
NetServer server = vertx.createNetServer();
server.connectHandler(socket -> {
  socket.handler(buffer -> {
    System.out.println("I received some bytes: " + buffer.length());
  });
});
```

## Writing data to a socket

你可以直接调用`NetSocket`的`write`方法进行写回数据
```java
Buffer buffer = Buffer.buffer().appendFloat(12.34f).appendInt(123);
socket.write(buffer);

// Write a string in UTF-8 encoding
socket.write("some data");

// Write a string using the specified encoding
socket.write("some data", "UTF-16");
```
> 注意，`write`方法一样是异步进行的,当`write`方法返回后,并不保证数据已经完全写入到Socket流中,也不保证数据能够写入成功

## Closed handler

下例中我们设置了一个`closeHandler`用于当Socket关闭时,获得一些通知
```java
socket.closeHandler(v -> {
  System.out.println("The socket has been closed");
});
```

## Handling exceptions
如果你想当socket操作发生异常时获得通知,你可以设置一个`exceptionHandler`

## Event bus write handler

每一个Socket都会在`event bus`上自动注册一个`handler`,一旦该`handler`接受到`Buffer`, `handler`会将`Buffer`写到Socket上.

利用这种特性你可以在不同的`verticle`甚至不同的`Vertx`实例里对同一个socket写数据. 这种功能的实现方式是`handler`身上有一个`writeHandlerID`,这个ID是`handler`在`event bus`上的注册地址,不同的`verticle`甚至不同的`Vertx`实例就可以通过该地址向Socket写入数据。


## Local and remote addresses
我们可以通过`localAddress`获得`NetSocket`的本地地址. 通过`remoteAddress`获得网络对等端地址.

## Sending files

我们可以通过`sendFile`直接向Socket中写入一个文件. 这是一种非常高效发送文件的方式,如果操作操作系统支持的话,这还可以被OS内核支持
```java
socket.sendFile("myfile.dat");
```

## Streaming sockets
Instances of NetSocket are also ReadStream and WriteStream instances so they can be used to pump data to or from other read and write streams.

See the chapter on streams and pumps for more information.

`NetSocket`实例还是`ReadStream`和`WriteStream`的实例,因此

## Upgrading connections to SSL/TLS

我们可以使用`upgradeToSsl`方法将一个不支持`SSL/TLS`的连接改为支持`SSL/TLS`的连接,具体参考相关章节

## Closing a TCP Server

我们可以调用`close`方法关闭服务器,`close`方法会关闭所有打开的连接和所有的服务器资源.

一样一样的,关闭操作同样是异步的,你懂得,想要关闭完成时进行某些操作,设置handler吧.
```java
server.close(res -> {
  if (res.succeeded()) {
    System.out.println("Server is now closed");
  } else {
    System.out.println("close failed");
  }
});
```

## Automatic clean-up in verticles
如果你是在`verticle`中创建的`TCP`服务器和客户端,那么当宿主`verticle`被`undeployed`时,宿主身上的服务器和客户端也会被自动的关闭掉

## Scaling - sharing TCP servers

`TCP`服务器上的所有`handler`都只会被相同的`event loop`执行.

这意味着如果你的服务器是运行在一个多核心的主机上,但是你在该主机上只部署了一个服务器实例,那么你最多也就是利用了主机上的一个核心.

为了能使用更多的核心,你需要在该主机上部署多个服务器实例. 下面的示例演示了如何通过编程的方式部署多个服务器实例：

```java
for (int i = 0; i < 10; i++) {
  NetServer server = vertx.createNetServer();
  server.connectHandler(socket -> {
    socket.handler(buffer -> {
      // Just echo back the data
      socket.write(buffer);
    });
  });
  server.listen(1234, "localhost");
}
```
或者如果你的服务器是在`verticle`内实现的,那么你也可以在命令行中通过`-instances`部署多个服务器实例.
```
vertx run com.mycompany.MyVerticle -instances 10
```
以及通过编程的方式部署多个服务器`verticle`实例

```java
DeploymentOptions options = new DeploymentOptions().setInstances(10);
vertx.deployVerticle("com.mycompany.MyVerticle", options);
```
Once you do this you will find the echo server works functionally identically to before, but all your cores on your server can be utilised and more work can be handled.

At this point you might be asking yourself 'How can you have more than one server listening on the same host and port? Surely you will get port conflicts as soon as you try and deploy more than one instance?'

Vert.x does a little magic here.*

When you deploy another server on the same host and port as an existing server it doesn’t actually try and create a new server listening on the same host/port.

Instead it internally maintains just a single server, and, as incoming connections arrive it distributes them in a round-robin fashion to any of the connect handlers.

Consequently Vert.x TCP servers can scale over available cores while each instance remains single threaded.


# TCP Client

## Creating a TCP client
最简单的创建TCP客户端的方式是使用默认的`NetClientOptions`：
```java
NetClient client = vertx.createNetClient();
```

## Configuring a TCP client
如果你不想要使用默认的`NetClientOptions`配置,那么你可以创建一个`NetClientOptions`实例进行TCP客户端创建：
```java
NetClientOptions options = new NetClientOptions().setConnectTimeout(10000);
NetClient client = vertx.createNetClient(options);
```

## Making connections
为了和服务器创建一个连接,你需要使用`connect`方法,在该方法中需要指定`hsot`和`port`,同时需要设置一个`handler`,当连接成功或者失败之后,`handler`会获得一个`NetSocket`的参数.
```java
NetClientOptions options = new NetClientOptions().setConnectTimeout(10000);
NetClient client = vertx.createNetClient(options);
client.connect(4321, "localhost", res -> {
  if (res.succeeded()) {
    System.out.println("Connected!");
    NetSocket socket = res.result();
  } else {
    System.out.println("Failed to connect: " + res.cause().getMessage());
  }
});
```

## Configuring connection attempts
A client can be configured to automatically retry connecting to the server in the event that it cannot connect. This is configured with setReconnectInterval and setReconnectAttempts.
客户端可以被配制成当连接不成功的时候在`event`里自动响应服务器的应答. 通过`setReconnectInterval`和`setReconnectAttempts`来设置这种机制.
> NOTE
> Currently Vert.x will not attempt to reconnect if a connection fails, reconnect attempts and interval only apply to creating initial connections.
> 注意：当连接失败之后,Vertx不会尝试自动重连,

```java
NetClientOptions options = new NetClientOptions();
options.setReconnectAttempts(10).setReconnectInterval(500);

NetClient client = vertx.createNetClient(options);
```

在默认情况下,创建多个连接是会失败的.


# HTTP Server
## Creating an HTTP Server
我们使用全部默认选项创建一个非常简单的HTTP服务器：
```java
HttpServer server = vertx.createHttpServer();
```

## Configuring an HTTP server

如果想创建一个自配置的HTTP服务器也很简单,你只需要在创建的时候,创建一个`HttpServerOptions`参数就可以了：
```java
HttpServerOptions options = new HttpServerOptions().setMaxWebsocketFrameSize(1000000);

HttpServer server = vertx.createHttpServer(options);
```

## Start the Server Listening

接下来我们使用`listen()`方法,让服务器开始监听客户端的请求.

```java
HttpServer server = vertx.createHttpServer();
server.listen();
```
或者我们指定要监听的端口和主机地址(这种方式会忽略掉在`HttpServerOptions`中配置的端口和主机地址)
```java
HttpServer server = vertx.createHttpServer();
server.listen(8080, "myhost.com");
```
如果不指定主机和端口的话,默认监听的主机地址是`0.0.0.0`(这意味着在所有可用的主机地址上进行绑定),默认的端口是80

The actual bind is asynchronous so the server might not actually be listening until some time after the call to listen has returned.

实际上这个绑定操作(`listen()`)是异步进行着,这意味着可能要等到

If you want to be notified when the server is actually listening you can provide a handler to the listen call. For example:
```java
HttpServer server = vertx.createHttpServer();
server.listen(8080, "myhost.com", res -> {
  if (res.succeeded()) {
    System.out.println("Server is now listening!");
  } else {
    System.out.println("Failed to bind!");
  }
});
```

## Getting notified of incoming requests
To be notified when a request arrives you need to set a requestHandler:
```java
HttpServer server = vertx.createHttpServer();
server.requestHandler(request -> {
  // Handle the request in here
});
```

## Handling requests
When a request arrives, the request handler is called passing in an instance of HttpServerRequest. This object represents the server side HTTP request.

The handler is called when the headers of the request have been fully read.

If the request contains a body, that body will arrive at the server some time after the request handler has been called.

The server request object allows you to retrieve the uri, path, params and headers, amongst other things.

Each server request object is associated with one server response object. You use response to get a reference to the HttpServerResponse object.

Here’s a simple example of a server handling a request and replying with "hello world" to it.
```java
vertx.createHttpServer().requestHandler(request -> {
  request.response().end("Hello world");
}).listen(8080);
```

#### Request version

The version of HTTP specified in the request can be retrieved with version

#### Request method

Use method to retrieve the HTTP method of the request. (i.e. whether it’s GET, POST, PUT, DELETE, HEAD, OPTIONS, etc).

#### Request URI

Use uri to retrieve the URI of the request.

Note that this is the actual URI as passed in the HTTP request, and it’s almost always a relative URI.

The URI is as defined in Section 5.1.2 of the HTTP specification - Request-URI

#### Request path

Use path to return the path part of the URI

For example, if the request URI was:

a/b/c/page.html?param1=abc&param2=xyz
Then the path would be

/a/b/c/page.html

#### Request query

Use query to return the query part of the URI

For example, if the request URI was:

a/b/c/page.html?param1=abc&param2=xyz
Then the query would be

param1=abc&param2=xyz

#### Request headers

Use headers to return the headers of the HTTP request.

This returns an instance of MultiMap - which is like a normal Map or Hash but allows multiple values for the same key - this is because HTTP allows multiple header values with the same key.

It also has case-insensitive keys, that means you can do the following:

MultiMap headers = request.headers();

// Get the User-Agent:
System.out.println("User agent is " + headers.get("user-agent"));

// You can also do this and get the same result:
System.out.println("User agent is " + headers.get("User-Agent"));

#### Request parameters

Use params to return the parameters of the HTTP request.

Just like headers this returns an instance of MultiMap as there can be more than one parameter with the same name.

Request parameters are sent on the request URI, after the path. For example if the URI was:

/page.html?param1=abc&param2=xyz
Then the parameters would contain the following:

param1: 'abc'
param2: 'xyz
Note that these request parameters are retrieved from the URL of the request. If you have form attributes that have been sent as part of the submission of an HTML form submitted in the body of a multi-part/form-data request then they will not appear in the params here.

#### Remote address

The address of the sender of the request can be retrieved with remoteAddress.

#### Absolute URI

The URI passed in an HTTP request is usually relative. If you wish to retrieve the absolute URI corresponding to the request, you can get it with absoluteURI

#### End handler

The endHandler of the request is invoked when the entire request, including any body has been fully read.

#### Reading Data from the Request Body

Often an HTTP request contains a body that we want to read. As previously mentioned the request handler is called when just the headers of the request have arrived so the request object does not have a body at that point.

This is because the body may be very large (e.g. a file upload) and we don’t generally want to buffer the entire body in memory before handing it to you, as that could cause the server to exhaust available memory.

To receive the body, you can use the handler on the request, this will get called every time a chunk of the request body arrives. Here’s an example:
```java
request.handler(buffer -> {
  System.out.println("I have received a chunk of the body of length " + buffer.length());
});
```
The object passed into the handler is a Buffer, and the handler can be called multiple times as data arrives from the network, depending on the size of the body.

In some cases (e.g. if the body is small) you will want to aggregate the entire body in memory, so you could do the aggregation yourself as follows:
```java
Buffer totalBuffer = Buffer.buffer();

request.handler(buffer -> {
  System.out.println("I have received a chunk of the body of length " + buffer.length());
  totalBuffer.appendBuffer(buffer);
});

request.endHandler(v -> {
  System.out.println("Full body received, length = " + totalBuffer.length());
});
```
This is such a common case, that Vert.x provides a bodyHandler to do this for you. The body handler is called once when all the body has been received:
```java
request.bodyHandler(totalBuffer -> {
  System.out.println("Full body received, length = " + totalBuffer.length());
});
```
#### Pumping requests

The request object is a ReadStream so you can pump the request body to any WriteStream instance.

See the chapter on streams and pumps for a detailed explanation.

#### Handling HTML forms

HTML forms can be submitted with either a content type of application/x-www-form-urlencoded or multipart/form-data.

For url encoded forms, the form attributes are encoded in the url, just like normal query parameters.

For multi-part forms they are encoded in the request body, and as such are not available until the entire body has been read from the wire.

Multi-part forms can also contain file uploads.

If you want to retrieve the attributes of a multi-part form you should tell Vert.x that you expect to receive such a form before any of the body is read by calling setExpectMultipart with true, and then you should retrieve the actual attributes using formAttributes once the entire body has been read:
```java
server.requestHandler(request -> {
  request.setExpectMultipart(true);
  request.endHandler(v -> {
    // The body has now been fully read, so retrieve the form attributes
    MultiMap formAttributes = request.formAttributes();
  });
});
```

#### Handling form file uploads

Vert.x can also handle file uploads which are encoded in a multi-part request body.

To receive file uploads you tell Vert.x to expect a multi-part form and set an uploadHandler on the request.

This handler will be called once for every upload that arrives on the server.

The object passed into the handler is a HttpServerFileUpload instance.
```java
server.requestHandler(request -> {
  request.setExpectMultipart(true);
  request.uploadHandler(upload -> {
    System.out.println("Got a file upload " +  upload.name());
  });
});
```

File uploads can be large we don’t provide the entire upload in a single buffer as that might result in memory exhaustion, instead, the upload data is received in chunks:
```java
request.uploadHandler(upload -> {
  upload.handler(chunk -> {
    System.out.println("Received a chunk of the upload of length " + chunk.length());
  });
});
```
The upload object is a ReadStream so you can pump the request body to any WriteStream instance. See the chapter on streams and pumps for a detailed explanation.

If you just want to upload the file to disk somewhere you can use streamToFileSystem:
```java
request.uploadHandler(upload -> {
  upload.streamToFileSystem("myuploads_directory/" + upload.filename());
});
```java

WARNING
Make sure you check the filename in a production system to avoid malicious clients uploading files to arbitrary places on your filesystem. See security notes for more information.

## Sending back responses
The server response object is an instance of HttpServerResponse and is obtained from the request with response.

You use the response object to write a response back to the HTTP client.

#### Setting status code and message

The default HTTP status code for a response is 200, representing OK.

Use setStatusCode to set a different code.

You can also specify a custom status message with setStatusMessage.

If you don’t specify a status message, the default one corresponding to the status code will be used.

#### Writing HTTP responses

To write data to an HTTP response, you use one the write operations.

These can be invoked multiple times before the response is ended. They can be invoked in a few ways:

With a single buffer:
```java
HttpServerResponse response = request.response();
response.write(buffer);
```
With a string. In this case the string will encoded using UTF-8 and the result written to the wire.

HttpServerResponse response = request.response();
response.write("hello world!");
With a string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.
```java
HttpServerResponse response = request.response();
response.write("hello world!", "UTF-16");
```
Writing to a response is asynchronous and always returns immediately after the write has been queued.

If you are just writing a single string or buffer to the HTTP response you can write it and end the response in a single call to the end

The first call to write results in the response header being being written to the response. Consequently, if you are not using HTTP chunking then you must set the Content-Length header before writing to the response, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry.

#### Ending HTTP responses

Once you have finished with the HTTP response you should end it.

This can be done in several ways:

With no arguments, the response is simply ended.
```java
HttpServerResponse response = request.response();
response.write("hello world!");
response.end();
```

It can also be called with a string or buffer in the same way write is called. In this case it’s just the same as calling write with a string or buffer followed by calling end with no arguments. For example:
```java
HttpServerResponse response = request.response();
response.end("hello world!");
```java

#### Closing the underlying connection

You can close the underlying TCP connection with close.

Non keep-alive connections will be automatically closed by Vert.x when the response is ended.

Keep-alive connections are not automatically closed by Vert.x by default. If you want keep-alive connections to be closed after an idle time, then you configure setIdleTimeout.

#### Setting response headers

HTTP response headers can be added to the response by adding them directly to the headers:
```java
HttpServerResponse response = request.response();
MultiMap headers = response.headers();
headers.set("content-type", "text/html");
headers.set("other-header", "wibble");
```
Or you can use putHeader
```java
HttpServerResponse response = request.response();
response.putHeader("content-type", "text/html").putHeader("other-header", "wibble");
```
Headers must all be added before any parts of the response body are written.

#### Chunked HTTP responses and trailers

Vert.x supports HTTP Chunked Transfer Encoding.

This allows the HTTP response body to be written in chunks, and is normally used when a large response body is being streamed to a client and the total size is not known in advance.

You put the HTTP response into chunked mode as follows:
```java
HttpServerResponse response = request.response();
response.setChunked(true);
```
Default is non-chunked. When in chunked mode, each call to one of the write methods will result in a new HTTP chunk being written out.

When in chunked mode you can also write HTTP response trailers to the response. These are actually written in the final chunk of the response.

To add trailers to the response, add them directly to the trailers.
```java
HttpServerResponse response = request.response();
response.setChunked(true);
MultiMap trailers = response.trailers();
trailers.set("X-wibble", "woobble").set("X-quux", "flooble");
```
Or use putTrailer.
```java
HttpServerResponse response = request.response();
response.setChunked(true);
response.putTrailer("X-wibble", "woobble").putTrailer("X-quux", "flooble");
```

#### Serving files directly from disk

If you were writing a web server, one way to serve a file from disk would be to open it as an AsyncFile and pump it to the HTTP response.

Or you could load it it one go using readFile and write it straight to the response.

Alternatively, Vert.x provides a method which allows you to serve a file from disk to an HTTP response in one operation. Where supported by the underlying operating system this may result in the OS directly transferring bytes from the file to the socket without being copied through user-space at all.

This is done by using sendFile, and is usually more efficient for large files, but may be slower for small files.

Here’s a very simple web server that serves files from the file system using sendFile:
```java
vertx.createHttpServer().requestHandler(request -> {
  String file = "";
  if (request.path().equals("/")) {
    file = "index.html";
  } else if (!request.path().contains("..")) {
    file = request.path();
  }
  request.response().sendFile("web/" + file);
}).listen(8080);
```
Sending a file is asynchronous and may not complete until some time after the call has returned. If you want to be notified when the file has been writen you can use sendFile

>NOTE
If you use sendFile while using HTTPS it will copy through user-space, since if the kernel is copying data directly from disk to socket it doesn’t give us an opportunity to apply any encryption.

> WARNING
If you’re going to write web servers directly using Vert.x be careful that users cannot exploit the path to access files outside the directory from which you want to serve them. It may be safer instead to use Vert.x Apex.

#### Pumping responses

The server response is a WriteStream instance so you can pump to it from any ReadStream, e.g. AsyncFile, NetSocket, WebSocket or HttpServerRequest.

Here’s an example which echoes the request body back in the response for any PUT methods. It uses a pump for the body, so it will work even if the HTTP request body is much larger than can fit in memory at any one time:
```java
vertx.createHttpServer().requestHandler(request -> {
  HttpServerResponse response = request.response();
  if (request.method() == HttpMethod.PUT) {
    response.setChunked(true);
    Pump.pump(request, response).start();
    request.endHandler(v -> response.end());
  } else {
    response.setStatusCode(400).end();
  }
}).listen(8080);
```

## HTTP Compression
Vert.x comes with support for HTTP Compression out of the box.

This means you are able to automatically compress the body of the responses before they are sent back to the client.

If the client does not support HTTP compression the responses are sent back without compressing the body.

This allows to handle Client that support HTTP Compression and those that not support it at the same time.

To enable compression use can configure it with setCompressionSupported.

By default compression is not enabled.

When HTTP compression is enabled the server will check if the client incldes an Accept-Encoding header which includes the supported compressions. Commonly used are deflate and gzip. Both are supported by Vert.x.

If such a header is found the server will automatically compress the body of the response with one of the supported compressions and send it back to the client.

Be aware that compression may be able to reduce network traffic but is more CPU-intensive.


# HTTP client

# Using the file system with Vert.x

Vert.x `FileSystem`对象对多个文件系统都提供了很多操作.

每一个`Vert.x`实例都有一个文件系统对象,你可以通过`fileSystem`方法获得它.

每一个操作都提供了一个阻塞和一个非阻塞版本.

非阻塞版本会带有一个`handler`参数,当非阻塞操作完成之后或者错误发生的时候,这个handler就会被调用.

下面的例子演示了一个异步拷贝文件的操作.
```
FileSystem fs = vertx.fileSystem();

// Copy file from foo.txt to bar.txt
fs.copy("foo.txt", "bar.txt", res -> {
  if (res.succeeded()) {
    // Copied ok!
  } else {
    // Something went wrong
  }
});
```
那些阻塞版本操作正如其名,会一直进行阻塞操作直到结果返回或者异常发生.

在许多情况下,基于不同的操作系统和文件系统,那些阻塞操作也可以非常快的返回,这也是我们提供阻塞版本的原因,但是我们还是强烈建议你,在`event loop`中当你使用一个阻塞操作时,你应该测试一下,它究竟会耗时多少.

下面演示了如何使用阻塞API
```
FileSystem fs = vertx.fileSystem();

// Copy file from foo.txt to bar.txt synchronously
fs.copyBlocking("foo.txt", "bar.txt");
```
还有很多的其他文件操作(`copy, move, truncate, chmod`),我们就不在此一一列出的,具体的你可以去查看相关API.

## Asynchronous files
Vert.x提供了一种异步文件概念,你可以使用这种方式在文件系统中操作文件.下面的是一种演示.
```
OpenOptions options = new OpenOptions();
fileSystem.open("myfile.txt", options, res -> {
  if (res.succeeded()) {
    AsyncFile file = res.result();
  } else {
    // Something went wrong!
  }
});
```


# Datagram sockets (UDP)





