---
category: vertx
tag: vertx2
title: Vertx 2 Manual
date: 2015-07-02 12:10:00
---

# Concepts in Vert.x

### verticle

* `Vert.x` 执行的代码单元称为 `verticle`.
* `verticle`可以由`JavaScript, Ruby, Java, Groovy or Python`等语言编写(Scala和Clojure支持还在开发中)
* 许多`verticle`可以在同一个`Vert.x`实例中并发执行
* 应用程序可以由部署同一网络在多个不同的节点上的`verticle`组成, 然后在``Vert.x` event bus`上进行消息交换。
* 在一些不重要的应用程序中, 可以在命令行中直接运行`verticle`, 但是更加通常的做法是将他们打包进`module`里，然后运行该`module`

### module

* `Vert.x`应用程序通常是由一个或者多个`module`组成. 一个`module`中可以包含多个`verticle`(不同的`verticle`s`可能由不同的语言编写). `module`允许功能性的封装和复用
* `module`可以被放入`Maven`或者其他[Bintray]()仓库里, 而且也可以注册到`Vert.x` [module registry]()上.
* 通过`Vert.x`社区, `Vert.x module`系统发展出了一个完整的`Vert.x module`生态系统

更多关于`module`的信息,参考[module`s manual]().

### Vert.x Instances

`verticle`s运行在`Vert.x`实例中. `Vert.x`实例运行在它自己的JVM实例里. 在同一时间,一个`Vert.x`实例中可以运行多个`verticle`s.在同一时刻同一个主机上可以运行多个`Vert.x`实例, 这些`Vert.x`实例可以被配制成一个集群, 集群中的`Vert.x`实例可以在一个分布式的event bus中进行交互.

> 注：是否每一个`Vert.x`实例都要启动一个JVM实例？

### Polyglot

`Vert.x`允许你通过`JavaScript, Ruby, Java, Groovy and Python`这几种语言编写`verticle`，而且在未来我们还会支持`Clojure and Scala`. 不管是采用什么语言编写的`verticle`，都可以进行无缝交互。

### Concurrency

`Vert.x`保证每一个`verticle`实例在任一时间点上只会被一个线程执行. 这样一来，在实际的开发过程中，你就不需要考虑你的代码会并发执行了(就好像你的代码永远只会被单线程执行).

如果你曾经使用传统的多线程并发模型进程编程, 那`Vert.x`的这种做法会将你从那种编程模型中解救出来，从此你不用再同步你的状态访问了. 这意味着条件竞争和OS线程死锁都成为了过去式.

不同的`verticle`实例可以通过event bus进行消息交换. `Vert.x`应用程序是并发的，因为`Vert.x`允许有多个单线程的`verticle`实例并发执行，以及他们之间相互交换数据，而且单个`verticle`实例并不会被多个线程并发执行。

因此`Vert.x`的并发模型和Actor模型非常像(`verticle`和`actor`大致是一致的)。但是他们之间还是有一些不同点的，例如，在代码结构单元上，`verticle`的粒度趋于比`actor`的要大

### Asynchronous Programming Model

`Vert.x`提供了一套异步API,这意味着在`Vert.x`中你需要做的大部分事情就是设置event handler(进行异步回调). 例如你设置了一个handler从TCP Socket接受数据,当数据来的时候,这个handler就会自动被调用.

你还可以设置handler,让其从event bus接受消息, 或者接受HTTP请求然后回应该请求, 以及当一个连接被关闭时收到通知, 或者当定时器到达时接受通知. 这种设置handler的模式在`Vert.x`中普遍存在(因为我们要异步，要回调).

由于我们使用异步API,因此我们可以仅仅使用少量的os thread便可以支持多个`verticle`s. 实际上, `Vert.x`设置的线程数与主机上的可用核心数相等.作为一个非常优秀的非阻塞应用程序,你设置线程数没有必要超过可用核心数.

在传统的异步API中,线程会在API操作中阻塞住, 而线程被阻塞之后, 他们就不能再做其他的工作了.例如,从socket中读取数据. 当该线在Socket上程等待数据到达时,它就不能再做其他事.这意味着,当我们需要支持百万并发连接的时候,那我们需要一百万个线程.

在开发项目的时候，有时异步API会受到些批评,尤其是当你不得不从多个event handler上获取结果的时候

我们可以采取下面的方式缓和这种情况,例如,使用[mod-rx-vertx]()`module`,这个`module`允许你构建异步事件流.这个`module`使用了[RxJava]()类库,这个类库受到了`.net`的[Reactive extensions]()启发.

### event loop

每个`Vert.x`实例内部都管理着一些线程(线程数与主机上可用核心上的线程数相等). 我们称那些线程为`event loop`， 因为那些线程都或多或少地进行着循环检查——是否有事件传递过来，如果接受到事件，就将它发送给适当的handler处理。例如，事件可以是已经从socket中读取到的数据，或者一个定时器的时间到了，或者一个HTTP response已经结束。

当一个标准的`verticle`实例被部署后, 服务器将选择一个`event loop`指派给该`verticle`实例。要由那个`verticle`实例处理的工作，都会调用分配给它的线程转发给它。当然，由于在同一时刻可能存在着好几千个处于运行状态的`verticle`，一个`event loop`可能同时会被分配到多个`verticle`上

我们管这叫做`multi-reactor`模式。它和[reactor pattern]()很像，但是它却拥有多个`event loop`

###### The Golden Rule - Don't block the event loop!

一个特定的`event loop`经常会被用于服务多个`verticle`实例，所以你千万不能将`verticle`实例阻塞住。一旦`verticle`阻塞住，那么分配给他线程就不能将接下来的事件分发给其他的handler了，然后你的应用程序慢慢地就被拖死了。

在`verticle`中任何占用`event loop`的事情以及`event loop`不能继续快速处理其他事件的事情都会造成`event loop`阻塞。可能阻塞`event loop`的事件可能包括。

* `Thread.sleep()`
* `Object.wait()`
* `CountDownLatch.await()` 或者`java.util.concurrent`中其他的阻塞操作.
* 在loop中进行自旋
* 执行一个长时间的计算密集型操作，例如数字计算
* 调用一个阻塞的第三方库操作，例如JDBC查询

### Writing blocking code - introducing Worker verticles

在一个标准的`verticle`中，`event loop`是不建议阻塞发生的，但是，在实际情况中我们极可能有需要阻塞`event loop`的场景，或者你确实有计算密集型操作执行。一个典型的例子就是调用像JDBC这样的API。

你也许会想写一些直接的阻塞代码，例如，你打算开发一个简单的webserver，但是你知道自己不会有很大的流量，那么你也就不需要处理很多并发连接了。

像刚才描述的那些场景，`Vert.x`允许你使用一种特殊的`verticle`实例——工作者`verticle`(`woker verticle`)。工作者`verticle`与标准`verticle`的不同之处在于，工作者`verticle`不会被分配到一个`Vert.x` `event loop`线程上，而是在一个称为工作者线程池的内部线程池上运行。

和标准`verticle`一样，工作者`verticle`也不会被多个线程同时执行，但和标准`verticle`不同的是，工作者`verticle`可以被不同的线程在不同的时刻执行(标准`verticle`总是被同一个线程执行)。

在一个工作者`verticle`中阻塞线程是可以被接受的。

为了支持标准非阻塞`verticle`和阻塞工作者`verticle`，`Vert.x`提供了一种混合线程模型，因此你可以在你的应用程序使用合适的`verticle`书写你的逻辑。这相比于一些其他只要求使用阻塞或者非阻塞的平台更加实用。

但是当你使用工作者`verticle`时也要小心，如果你想要处理很多的并发网络连接时，阻塞的`verticle`并不能拓展你的应用程序的并发处理能力

### Shared data

消息传递是非常有用的，但是它并不适用于所有的应用程序的并发处理。于是我们提供了一种共享数据结构，可以使使同一个`Vert.x`实例中不同`verticle`实例直接访问它。

`Vert.x`提供了一个共享的`Map`和一个共享的`Set`。为了避免条件竞争，我们建议所有被存储共享的数据都应该是不可变的。

### Vert.x APIs

`Vert.x`提供了一个可以在`verticle`中可以直接调用的小巧的静态API。

`Vert.x` API不会轻易地发生变动，新功能的添加会通过`module`的方式添加。

这意味着`Vert.x` core会一直保持小巧和紧凑，如果你想要使用新功能，只需要添加相关`module`即可。

`Vert.x` API被分为`container API`和`core API`俩部分。

###### Container API

下面给出了`Vert.x container`对象的操作列表：

* 对`verticle`进行部署和解除部署
* 对`module`进行部署和解除部署
* 恢复`verticle`配置
* Logging

###### Core API

This API provides functionality for:

* `TCP/SSL` 服务器和客户端
* `HTTP/HTTPS` 服务器和客户端
* `WebSockets`服务器和客户端
* 分布式 `event bus`
* Periodic and one-off timers
* `Buffers`
* `Flow control`
* `File-system access`
* `Shared map and sets`
* `Accessing configuration`
* `SockJS`


# Using Vert.x from the command line

`vertx`命令通过命令行与`Vert.x`平台进行交互。它的主要作用是运行`Vert.x``module`和原生`verticle`。

如果你在命令行中仅仅输入`vert`，那么命令行中会输出vertx命令会采用哪些选项。

### Running verticles directly

你可以在命令行中直接通过使用`vertx run`命令直接运行原生`Vert.x` `verticle`实例。

对于快速原型代码(quickly prototyping code)或者简单的应用程序，运行原生`verticle`是非常有用的，但是一般在正式应用程序中，我们建议将你的应用打包成一个`module`来运行。打包成的`module`更加易于运行，封装和复用。

一个最简单的`vertx`示例，就是传递给它一个`verticle`名字选项，然后将该`verticle`运行起来。

如果你的`verticle`是通过`JavaScript, Ruby, Groovy or Python`等脚本语言编写的，那么你只需要将脚本的名字传递给它。(例如`erver.js`, `server.rb`, or `server.groovy`.)

如果`verticle`是通过Java来编写的，那么`verticle`的名字就是应用程序的主类的全限定名，或者是应用程序的主类的Java源文件名，然后由`Vert.x`编译该源文件，再运行它。

###### 下面给出俩种运行verticle方式：
I. 直接运行

```
vertx run app.js

vertx run server.rb

vertx run accounts.py

vertx run MyApp.java

vertx run com.mycompany.widgets.Widget

vertx run SomeScript.groovy
```

II. 在`verticle`名前加上该`verticle`实现语言。例如你的`verticle`是一个编译好的Groovy类，如果你指定好前缀为`groovy`，那么`Vert.x`就知道它是Groovy class而不是Java class。

```
vertx run groovy:com.mycompany.MyGroovyMainClass
```

`vertx run`命令会使用下面几个选项：

* `-conf <config_file>` 对`verticle`提供一些配置。`<config_file>`是一个text文件的名称，该文件包含一个json形式的配置说明，该选项是可选的。

* `-cp <path>` 这个路径指定`verticle`文件和`verticle`中使用到的其他资源的路径。默认值是`.`(当前路径)。如果你的`verticle`引用了其他脚本，类,或者资源(如jar文件)，那么你要确保可以在该路径中找到他们。该路径可以通过`:`分割，包含多个路径。每一个路径都可以是相对或者是绝对路径。例如：`-cp classes:lib/otherscripts:jars/myjar.jar:jars/otherjar.jar`.需要注意的是，不要将这些值放到系统类路径中(`system classpath`),因为这可能会导致在部署应用时，产生不可预期的问题。

* `-instances <instances>` 指定在`Vert.x`中需要实例化该`verticle`的数量。每一个`verticle`实例都必须在单线程中运行，为了能够通过可用核心来扩展你的应用程序，你也许想将同一个`verticle`文件部署多个实例(这样一来,多个线程就可以运行同一种`verticle`了)。如果忽略该选项，那么默认的就只会部署一个实例。

* `-includes <mod_list>` 一个通过`,`分割的`module`名称列表，这些`module`都被包含在`verticle`的`classpath`中。

* `-worker` 该值用于指定`verticle`是否是以工作者的形式启动

* `-cluster` 这个选项用于指定该`Vert.x`实例是否和同一网络下的其他`Vert.x`实例组成一个集群。集群化的`Vert.x`实例会将`Vert.x`和其他节点形成一个分布式事件总线。默认值是`false`

* `-cluster-port` 如果指定了`-cluster`值为`true`，`-cluster-port`指定和其他`Vert.x`实例组成集群的端口号。默认值是0，则随机一个可用端口。一般你不需要指定这个值，除非你真的需要指定一个特殊的端口。

* `-cluster-host` 如果指定了`-cluster`值为true，`-cluster-host`指定和其他`Vert.x`实例组成集群的域名。默认的它会从可用的网络接口中，随机选择一个。如果你的网卡中有多个网络接口，那么你也可以选择一个自己想用的。

下面给出了一些`vertx run`示例：

根据默认配置运行一个JavaScript `verticle`
```
vertx run server.js
```
下面运行10个指定classpath的编译好的Java `verticle`实例
```
vertx run com.acme.Myverticle -cp "classes:lib/myjar.jar" -instances 10
```
用Java源代码运行10个`verticle`实例
```
vertx run Myverticle.java -instances 10
```
运行20个ruby工作者`verticle`实例
```
vertx run order_worker.rb -instances 20 -worker
```
在同一台机器上运行2个JavaScript `verticle`实例，同时将他们和其他服务器组成一个集群。
```
vertx run handler.js -cluster
vertx run sender.js -cluster
```
通过指定配置文件运行一个ruby `verticle`实例
```
vertx run my_vert.rb -conf my_vert.conf
```
my_vert.conf 只包含一些简单配置：
```json
{
    "name": "foo",
    "num_widgets": 46
}
```

#### Forcing language implementation to use

在`Vert.x`的`langs.properties`配置文件中包含了`Vert.x`能够识别的语言，然后`Vert.x`会自动识别出`module`是通过什么语言编写的。有时候也会有一些模棱两可的情况，例如你想要将一个Groovy类作为一个`verticle`，那么你就可以将实现语言作为前缀加在`verticle`前，例如：
```
vertx run groovy:com.mycompany.MyGroovyMain`verticle`
```

### Running modules from the command line

我们高度建议你将任何非实验性的`Vert.x`功能打包成一个`module`。至于如何将你的代码打包成一个`module`，你可以参考[module`s manual]()

想要运行一个`module`，那你就不能再使用`vertx run`命令了，而是要使用`vertx runmod <`module` name>`. 同样，该命令也带有一些选项：

* `-conf <config_file>` - 与`vertx run`意义相同
* `-instances <instances>` - 与`vertx run`意义相同
* `-cluster` - 与`vertx run`意义相同
* `-cluster-host` - 与`vertx run`意义相同
* `-cp` 如果该选项被赋值，那么它将覆盖标准`module classpath`，然后`Vert.x`将会在指定的路径搜索`mod.json`文件和其他`module`资源。这在某些情况下非常有用，例如，你在IDE中开发了一个`module`，你可以在不同的classpath中运行该`module`，然后你就能找到存储项目资源的实际classpath，然后再指定classpath

如果你想要运行一个本地没有安装的`module`，`Vert.x`会自动尝试从仓库(仓库可配置)中安装它。一般`Vert.x`会被配置到从`Maven Central, Sonatype Nexus, Bintray` 以及你本地仓库安装`module`。你也可以在`Vert.x` conf directory中的`repos.txt`中配置其他Maven仓库。

下面是一些直接运行`module`的示例：

运行一个名为`com.acme~my-mod~2.1`的实例
```
vertx runmod com.acme~my-mod~2.1
```
运行一个名为`com.acme~other-mod~1.0.beta1`的`module`，我们指定配置，同时运行10实例
```
vertx runmod com.acme~other-mod~1.0.beta1 -instances 10 -conf other-mod.conf
```

### Running modules directory from .zip files

`vertx runzip`命令能直接从一个`module`zip文件中直接运行`module`. 运行的`module`不要求已经安装在本地或者已经安装在一个`module`仓库里。

```
vertx runzip <zip_file_name>
```
zip`module`运行示例
```
vertx runzip my-mod~2.0.1.zip
```
实际上，`Vert.x`会解压zip文件，将`module`解压到系统临时目录里，然后从该目录里运行该`module`。

### Running modules as executable jars (fat jars)

`Vert.x`还支持装配`fat jars`. `fat jars`都是可运行jar包，它们同时包含着`Vert.x`的二进制文件，这样你就可以直接通过运行`fat jars`来运行里面`module`。
```
java -jar my`module`-1.0-fat.jar
```

这意味着，当你想要通过运行`fat jars`的`module`时，你的机器上可以不安装`Vert.x`，因为jar包中已经包含了所需的`Vert.x`的二进制文件。

你也可以在命令行中向`fat jars`中传递`Vert.x`平台参数
```
java -jar my`module`-1.0-fat.jar -cluster -conf myconf.json
```

你也可以向`fat jars`传递`-cp`参数，该参数同样作用于`Vert.x`平台。下面的例子就在运行`module`时，指定了一个自定制的`cluster.xml`
```
java -jar my`module`-1.0-fat.jar -cluster -conf myconf.json -cp path/to/dir/containiner/cluster_xml
```

可以使用下面的命令创建一个`fat jar`
```
vertx fatjar <module_name>
```
Or you can use the Gradle task in the standard Gradle build or the Maven plugin to build them.

If you want to override any `Vert.x` platform configuration, e.g. langs.properties, cluster.xml or logging configuration, you can add those files to the directory platform_lib inside your `module` that you're making into a fat jar. When executing your fat jar `Vert.x` will recognise this directory and use it to configure `Vert.x` with.

### Displaying version of Vert.x

使用下面的命令查看当前安装的`Vert.x`的版本
```
vertx version
```

### Installing and uninstalling modules

参考 [module`s manual]().


# High availability with Vert.x

`Vert.x`同样支持对`module`的高可用(`high availability (HA)`)运行.

### Automatic failover

假设一个`module`与`HA`一起运行，如果`module`所在的`Vert.x`实例运行失败了，那么该`module`会自动在集群中其他的节点上重新启动，那我们称该`module`为`fail-over`

想要`module`与`HA`一起运行，那么只需要在命令行上加上`-ha`参数
```
vertx runmod com.acme~my-mod~2.1 -ha
```

但是想要`HA`正常工作，你就需要在集群中添加多个`Vert.x`实例，也就是说必须存在一个已经启动的`Vert.x`实例

> (该实例是否也需要加-ha参数呢？应该是不需要的，要不然就自我矛盾了)
```
vertx runmod com.acme~my-other-mod~1.1 -ha
```

如果现在运行着`com.acme~my-mod~2.1`的`module`的`Vert.x`实例挂掉了(你可以通过`kill -9`这个命令进行测试)，那么运行着`com.acme~my-mod~1.1`的`Vert.x`实例会自动开始部署`com.acme~my-mod~2.1``module`，因此，运行着`com.acme~my-mod~1.1`的`Vert.x`实例接下来会运行那俩个`module`。

> 注意：干净地关闭一个`Vert.x`实例并不会引起`failover`,例如使用`CTRL-C`或者`kill -SIGINT`

你也可以以`bare`模式运行`Vert.x`实例。这种模式下运行的`Vert.x`实例启动时并不会自动运行任何`module`，they will also failover for nodes in the cluster. 可以通过下面的命令开启一个bare 实例
```
vertx -ha
```

当你使用`ha`选项时，你就不需要指定`-cluster`选项了，因为当`Vert.x`实例与`HA`一起运行时，cluster就默认开启了。

### HA groups

当你与`HA`运行一个`Vert.x`实例时，你也可以选择指定一个`HA group`。 `HA group`是在逻辑上将集群中一组节点进行分组。只有同一个`HA group`组内的节点才能相互`failover`,也就是说`failover`是不同横跨`HA group`的. 如果你不显式指定`HA group`，那么就会将其分配进默认的`__DEFAULT__`组里.

当运行`module`时，通过`-hgroup`选项指定`HA group`
```
vertx runmod com.acme~my-mod~2.1 -ha -hagroup somegroup
```
下面展示了一些示例：

In console 1:
```
vertx runmod com.mycompany~my-mod1~1.0 -ha -hagroup g1
```
In console 2:
```
vertx runmod com.mycompany~my-mod2~1.0 -ha -hagroup g1
```
In console 3:
```
vertx runmod com.mycompany~my-mod3~1.0 -ha -hagroup g2
```

如果我们把console 1中的实例`kill`掉，那么该实例会向console 2中的实例进行`fail over`，但不会向console 3中的实例进行fail over，因为他们没有在一个共同的`HA group`。

如果我们将console 3中的实例`kill`掉之后，就不会发生`fail over`了，因为该组中只有一个`Vert.x`实例

### Dealing with network partitions - Quora

`HA`实现还支持`quora`

When starting a `Vert.x` instance you can instruct it that it requires a "quorum" before any HA deployments will be deployed. A quorum is a minimum number of nodes for a particular group in the cluster. Typically you chose your quorum size to Q = 1 + N/2 where N is the number of nodes in the group.

当你开启一个`Vert.x`实例时，你可以在它进行`HA`部署之前，引导它进行`quorum`。`quorum`指的是集群中某个`HA group`中的最小节点数。一般你可将`qurom`设定为`Q = 1 + N / 2`，其中N是`HA group`中节点的数量。

If there are less than Q nodes in the cluster the HA deployments will undeploy. They will redeploy again if/when a quorum is re-attained. By doing this you can prevent against network partitions, a.k.a. split brain.

如果集群中的节点数小于Q，那么`HA`部署会undeploy。 如果quorum重新获得后，那么HA会进行重新部署。By doing this you can prevent against network partitions, a.k.a. split brain.

更多信息参考[quora]()

如果想要使用`quorum`运行`Vert.x`实例，你只需要在命令行中指定`-quorum`选项就好：

In console 1:
```
vertx runmod com.mycompany~my-mod1~1.0 -ha -quorum 3
```

在console 1中`Vert.x`实例会启动成功但是，它并不会部署`module`，因为在集群中只有一个节点

In console 2:
```
vertx runmod com.mycompany~my-mod2~1.0 -ha -quorum 3
```
在console 1中`Vert.x`实例会启动成功但是，它并不会部署`module`，因为在集群中只有俩个节点

In console 3:
```
vertx runmod com.mycompany~my-mod3~1.0 -ha -quorum 3
```

现在，我们有三个节点了，`quorum`条件达到了。现在`module`就会自动地部署到他们所在的`Vert.x`实例上

如果我们close或者kill掉三个节点中的一个，其他节点上所有的`module`都会自动的解除部署，因为现在`quorum`不再满足条件。

`Quora`也可以和`HA group`一起结合使用。

### Logging

每一个`verticle`实例都可以从它内部检索出属于它自己的logger，至于如何检索就要参考具体语言实现的API了。

默认的log日志是存储在系统临时目录的`vertx.log`文件中，在Linux中是`\tmp`.

默认实现使用`JUL`纪录日志。但是我们可以通过`$VERTX_HOME\conf\logging.properties`这个属性文件进行修改。

如果你想要使用其他的日志框架，例如`log4j`，你可以在启动`Vert.x`的时候，通过系统参数的方式进行指定。
```
-Dorg.vertx.logger-delegate-factory-class-name=org.vertx.java.core.logging.impl.Log4jLogDelegateFactory
```
or
```
-Dorg.vertx.logger-delegate-factory-class-name=org.vertx.java.core.logging.impl.SLF4JLogDelegateFactory
```

如果你不想要使用`Vert.x`提供的日志功能也可以，你只需要像平常那样使用你喜欢的日志框架，同时引用相关日志jar包，同时你还要在`module`里进行配置。


# Configuring thread pool sizes


`Vert.x`主要包含俩个线程池：
1. `event loop`池
2. 后台(工作者)线程池

### The event loop pool

`event loop池` 用于向标准`verticle`提供`event loop`。默认大小是根据你机器上的核心决定的，通过`Runtime.getRuntime().availableProcessors()`的方法获取你机器上的可用核心.

如果你想要进行优化，改变线程池的大小，你可以重新设置系统属性值——`vertx.pool.eventloop.size`.

### The background pool

这个线程池是用于提供工作者`verticle`使用的线程，以及用于其他阻塞任务。由于工作者线程提供阻塞功能，我们往往会比`event loop`线程池使用的更多。默认的工作者线程池的最大值是20.

如果你想要修改工作者线程池的最大,只需要修改系统属性`vertx.pool.worker.size`就好了


# Configuring clustering

在分布式环境中可以使用`conf/cluster.xml`文件配置集群。

如果你想要采集集群配置过程中的信息，可以修改`conf/logging.properties`文件，设置`com.hazelcast.level=INFO`

当运行一个集群时，如果你有多个网络接口选择，那么你可以通过修改`interfaces-enabled`元素，确保`Hazelcast`使用的上古当前网络接口

如果你的网络不支持多播(组播)，那么你可以在配置文件中将`multicast`关闭掉，然后开启`tcp-ip`

# Performance Tuning

### Improving connection time

If you're creating a lot of connections to a `Vert.x` server in a short period of time, you may need to tweak some settings in order to avoid the TCP accept queue getting full. This can result in connections being refused or packets being dropped during the handshake which can then cause the client to retry.

如果短时间内`Vert.x`服务器接受到了大量的连接，你可以通过修改一些配置来避免TCP接收队列饱和。这些设置可以作用于连接复用或者握手期间的丢包情况

出现这种情况的典型例子就是，你的客户端出现了有超过`3000ms`的长连接

How to tune this is operating system specific but in Linux you need to increase a couple of settings in the TCP / Net config (10000 is an arbitrarily large number)

一般是操作系统来调整TCP接收，但是在Linux中，你可能需要将`TCP / Net`设置进行翻倍。
```
sudo sysctl -w net.core.somaxconn=10000
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=10000
```

对于其他的系统，你就要参考具体系统的配置手册了。

同时，你还要对服务器端的`accept backlog`参数进行设置
```
HttpServer server = vertx.createHttpServer();
server.setAcceptBacklog(10000);
```

###Handling large numbers of connections

#### Increase number of available file handles

为了使服务器能够处理大量的网络链接，你也许需要提升你系统的最大文件句柄数(每一个socket都需要一个文件句柄)，至于如何进行设置就看具体操作操作系统了。

#### Tune TCP buffer size

每一个TCP连接的都会为它自己的buffer分配一块内存，因此为了能够支持在固定大小的内存限制下，结构更多的网络连接，我们就需要削减每个TCP buffer的大小了。
```java
HttpServer server = vertx.createHttpServer();
server.setSendBufferSize(4 * 1024);
server.setReceiveBufferSize(4 * 1024);
```


