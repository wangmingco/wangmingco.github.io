---
category: Java
tag: vertx2
title: Vertx 2 Java Api Manaual
date: 2015-07-08 16:20:00
---

# Writing Verticles

正如我们在手册里描述的那样,一个verticle是就是一个Vert.x的执行单元

再重复一下，Vert.x是一个Verticle容器，而且Vert.x确保一个verticle实例永远不会被多个线程并发执行。你可以使用Vert.x支持的所有的语言来编写Verticle，同时Vert.x支持并发执行同一个verticle文件实例出多个Verticle实例。

在Vert.x中，你所编写的所有代码其实都是在Verticle实例中运行。

对于一个简单的任务，你可以直接编写原生verticle，然后在命令行中直接运行它们，但是在大部分情况中你都应该将verticle打包成Vert.x module。

> 原生verticle，指的就是一个单独的没有打包进module的文件或者类,例如`verticle1.class, verticle2.java, verticle3.rb, verticle4.groovy`

现在让我们编写一个简单的原生verticle：

我们将编写一个简单的TCP echo服务器。这个服务器仅仅接受网络连接，然后将接收到的数据进行输出。

```java
import org.vertx.java.core.Handler;
import org.vertx.java.core.net.NetSocket;
import org.vertx.java.core.streams.Pump;
import org.vertx.java.platform.Verticle;

public class Server extends Verticle {

  public void start() {
    vertx.createNetServer().connectHandler(new Handler<NetSocket>() {
      public void handle(final NetSocket socket) {
        Pump.createPump(socket, socket).start();
      }
    }).listen(1234);
  }
}
```
现在运行它
```
vertx run Server.java
```
现在服务器运行起来了，然后通过telnet连接它
```
telnet localhost
```
注意，你通过回车发送出去的数据是如何输出的

现在，你已经编写了第一个verticle。

也许你已经注意到了，你并没有手动将`.java`文件编译成`.class`文件。Vert.x知道如何直接"运行"`.java`文件，其实在Vert.x内部会自动编译该源文件。

每一个java vertivle都必须继承`org.vertx.java.deploy.Verticle`,然后必须重载`start`方法，当verticle启动时，Vert.x会自动调用该方法。


## Asynchronous start

假设现在有一个Verticle——`v1`不得不在`start()`方法中，完成一些异步的操作，或者启动一些其他verticle，在这些操作完成之前，`v1`一直都应该是未完成状态。

在这种情况下，你的verticle可以实现`start()`方法的异步版本：
```java
public void start(final Future<Void> startedResult) {
  // For example - deploy some other verticle
  container.deployVerticle("foo.js", new AsyncResultHandler<String>() {
    public void handle(AsyncResult<String> deployResult) {
      if (deployResult.succeeded()) {
        startedResult.setResult(null);
      } else {
        startedResult.setFailure(deployResult.cause());
      }
    }
  });
}
```

## Verticle clean-up

当verticle停止后，其内部的`Servers, clients, event bus handlers and timers`会自动关闭或者取消掉，当某个verticle停止时，你如果想要进行一些其他的清理逻辑，你可以自己实现`stop()`方法，那么当该verticle被解除部署时，该方法就会被自动调用

## The container object

每一个verticle实例都有一个称为`container`的成员变量。`container`表示的是它运行所在的Verticle的一个视图。

`container`对象定义了部署和解除部署verticle和module的方法，同时还允许设置环境变量和一个可访问的logger

## The vertx object

每一个verticle实例都含有一个`vertx`实例变量。该变量提供了访问Vert.x核心API的能力。在Vert.x中，你要使用该核心API完成大部分工作，例如`TCP, HTTP, file system access, event bus, timers`等等。

## Getting Configuration in a Verticle

你可以像下例这样在命令行中通过`-conf`选项向module或者verticle传递配置
```
vertx runmod com.mycompany~my-mod~1.0 -conf myconf.json
```

或者向一个原生vertile传递
```
vertx run foo.js -conf myconf.json
```

`-conf`参数是一个包含JSON对象的文本文件名字。

通过调用verticle成员变量`contailner`的`config()`方法该配置就成功启用了
```java
JsonObject config = container.config();

System.out.println("Config is " + config);
```

`config()`返回一个`org.vertx.java.core.json.JsonObject`实例，该实例代表一个json对象。


无论部署什么语言实现的verticle，对于配置verticle的方式是一致的。

## Logging from a Verticle

每个verticle实例都有一个属于它自己的logger。可以通过调用`container`实例的`logger()`方法获取`logger`对象的引用。

```java
Logger logger = container.logger();

logger.info("I am logging something");
```
The logger is an instance of the class org.vertx.java.core.logging.Logger and has the following methods;

`logger`是`org.vertx.java.core.logging.Logger`的实例,该实例拥有下列方法：

* `trace`
* `debug`
* `info`
* `warn`
* `error`
* `fatal`

`logger`产生的日志存储到系统临时目录的`vertx.log`文件中,在linux中的临时目录是`\tmp`.

更多关于配置logging方法的信息，参考主手册

## Accessing environment variables from a Verticle

你可以通过调用`container`对象的`env()`方法来访问环境变量

## Causing the container to exit

`container`的`exit()`方法会干净地关闭掉Vert.x实例


# Deploying and Undeploying Verticles Programmatically

你可以在一个verticle中通过编程方式对其他verticle进行部署和解除部署。任何通过该方式部署的verticle都有能力看见主verticle的资源(classes, scripts 或者其他文件)

## Deploying a simple verticle

如果想要通过程序的方式部署一个verticle，只需要调用`container`变量里的`deployVerticle`方法。

下面的例子就部署了一个verticle实例
```java
container.deployVerticle(main);
```

`main`是被部署的Verticle的名字(java源文件名称或者类的FQCN)

具体参考主手册的[running Vert.x]()章节

## Deploying Worker Verticles

`deployVerticle`方法部署的是标准verticle,如果你想要部署工作者verticle,你可以使用`deployWorkerVerticle`方法，这俩个方法的参数一致。

## Deploying a module programmatically

你可以采用下面的方式部署一个`module`：
```java
container.deployModule("io.vertx~mod-mailer~2.0.0-beta1", config);
```

程序会根据指定的配置部署一个`io.vertx~mod-mailer~2.0.0-beta1`的`module`实例。

## Passing configuration to a verticle programmatically

我们也可以将JSON配置传递给通过程序部署的verticle。在部署的verticle内部，配置可以被`config()`方法访问。
```java
JsonObject config = new JsonObject();
config.putString("foo", "wibble");
config.putBoolean("bar", false);
container.deployVerticle("foo.ChildVerticle", config);
```

然后，在`ChildVerticle`中，你能通过`config()`方法访问刚才的配置

## Using a Verticle to co-ordinate loading of an application

如果你的应用程序是由多个verticle组成，并且希望都当应用程序启动的时候，所有的verticle都能启动起来，那么你可以使用一个单独的verticle来管理应用程序的配置，而且由该verticle启动剩余的全部verticle。

下例中，我们创建了一个`AppStarter`verticle.
```java
// Application config
JsonObject appConfig = container.config();

JsonObject verticle1Config = appConfig.getObject("verticle1_conf");
JsonObject verticle2Config = appConfig.getObject("verticle2_conf");
JsonObject verticle3Config = appConfig.getObject("verticle3_conf");
JsonObject verticle4Config = appConfig.getObject("verticle4_conf");
JsonObject verticle5Config = appConfig.getObject("verticle5_conf");

// Start the verticles that make up the app

container.deployVerticle("verticle1.js", verticle1Config);
container.deployVerticle("verticle2.rb", verticle2Config);
container.deployVerticle("foo.Verticle3", verticle3Config);
container.deployWorkerVerticle("foo.Verticle4", verticle4Config);
container.deployWorkerVerticle("verticle5.js", verticle5Config, 10
```

然后我们创建一个`config.json`配置文件
```java
{
    "verticle1_conf": {
        "foo": "wibble"
    },
    "verticle2_conf": {
        "age": 1234,
        "shoe_size": 12,
        "pi": 3.14159
    },
    "verticle3_conf": {
        "strange": true
    },
    "verticle4_conf": {
        "name": "george"
    },
    "verticle5_conf": {
        "tel_no": "123123123"
    }
}
```

然后将`AppStarter`设置为module里的主要verticle, 接着你就可以通过下面的例子来启动整个应用程序
```
vertx runmod com.mycompany~my-mod~1.0 -conf config.json
```

如果你的应用程序是非常庞大的，而且是由多个module组成，那么你仍然可以使用相同的技术来实现。

通常，你也许会选择一种脚本语言(`JavaScript, Groovy, Ruby or Python`)作为你的启动verticle实现语言，那些语言通常会比java更好地支持JSON，因此你可以在启动verticle中非常友好地持有整个JSON配置。

## Specifying number of instances

当你部署一个verticle时，默认地会只部署一个verticle实例。由于verticle实例是单线程执行的，因此这意味着，这种方式只会用到一个服务器核心。

Vert.x通过部署多个verticle实例来达到拓展（并发运行）

如果你想在程序中部署多个verticle或者module，你可以像下面这样，指定部署实例的数量：
```java
container.deployVerticle("foo.ChildVerticle", 10);
```
或者使用下面这种方式
```
container.deployModule("io.vertx~some-mod~1.0", 10);
```


## Getting Notified when Deployment is complete

verticle的部署实际上是以异步方式运行的，也许是在`deployVerticle`或者`deployModule`方法返回之后才完成部署.如果你想当部署完成之后获得通知，那么你可以向 `deployVerticle`或者`deployModule`方法传递一个handler，以便当部署完成时获得通知。
```java
container.deployVerticle("foo.ChildVerticle", new AsyncResultHandler<String>() {
    public void handle(AsyncResult<String> asyncResult) {
        if (asyncResult.succeeded()) {
            System.out.println("The verticle has been deployed, deployment ID is " + asyncResult.result());
        } else {
            asyncResult.cause().printStackTrace();
        }
    }
});
```

当部署完成时，`handler`会获得一个`AsyncResult`实例. 你可以通过调用`AsyncResult`对象的`succeeded()` 和 `failed()`方法来观察部署是否正确完成了。

`result()`方法提供异步操作的结果,在这个例子中，部署的结果是部署ID,如果你以后要接触部署verticle或者module的话，你就需要这个部署ID了。

`cause()`方法提供了失败原因

## Undeploying a Verticle or Module

如果verticle被解除部署后，那么通过该verticle部署的verticle或者module，以及它们所有子代，都会被自动解除部署，所以在大多数情况下，你不需要手动地去解除部署一个verticle。然而，当你真的需要手动去解除部署verticle或者module时，你可以通过调用`undeployVerticle`或者`undeployModule`的方法来实现(这俩个方法需要传递部署ID)。
```
container.undeployVerticle(deploymentID);
```

你也可以向这俩个方法中传递一个handler，那么当解除部署完成后，你就会得到一个通知

## Scaling your application

一个verticle实例总是单线程的(工作者verticle除外),这意味着一个verticle实例最多使用一个服务器核心

为了能够利用多核优势，你需要部署多个verticle实例。需要部署的具体数量就取决于你的应用程序了，例如有多少个verticle(不是verticle实例)以及verticle的类型都是什么。

你可以通过程序方式部署多个verticle实例，或者在命令行上通过`-instances`选项指定部署的数量


# The Event Bus

`event bus`充当着Vert.x的"神经系统"

它允许vertivle能够相互通信，不管这些verticle是否是同一种语言实现，或者是否是在同一个`Vert.x`实例里。

It even allows client side JavaScript running in a browser to communicate on the same event bus. (More on that later).

它甚至允许运行在浏览器里的同一个event bus的JavaScript形式的verticle相互交互

`event bus`形成了一个横跨多个服务器节点以及多个浏览器的分布式的端对端的消息系统,

`event bus`的API是相当简单的. 它基本上只涉及了`registering handlers`, `unregistering handlers` 和 `sending/publishing messages`.

## The Theory

### Addressing

我们通过`event bus`向一个地址发送`Message`.

在Vert.x中不需要担心是否会使用到复杂的寻址方案. 在Vert.x中，地址就是一个简单的合法字符串。Vert.x的地址还使用了一些`scheme`,例如使用`.`分割命名空间区间。

一些合法的地址例如：`europe.news.feed1`, `acme.games.pacman`, `sausages`, and `X`

### Handlers

我们使用`handler`从`event bus`中接收消息——向一个地址注册一个`handler`。

无论是否是同一个`verticle`中的`handler`都可以向相同的地址进行注册。`verticle`中的同一个`handler`也可以注册到不同的地址上

### Publish / subscribe messaging

`event bus`也支持消息发布——消息会被发布到某一个地址上.消息发布意味着：将消息发布给在某个地址上注册的全部`handler`。这和`publish/subscribe`消息模式很像。

### Point to point and Request-Response messaging

`event bus`支持点对点消息传送.消息会被发送到一个地址上。Vert.x然后会在该地址上的N个handler中选择一个,然后将消息传递给被选择的handler。如果某个地址上注册了多个handler，Vert.x会根据一个不是很严格的循环算法来选取一个。

在点对点传送消息的情况中，当发送消息时，可以指定一个可选的回复handler。当接受者接受到一个消息后，同时该Message被处理后，接受者可以选择是否回应该消息。如果接受者选择回应该消息，那么reply handler会被调用。

当发送者接收到消息回应后，发送者还可以选择接着回应。这种模式可以永远重复下去，Vert.x还支持在这俩个verticle中创建一个会话。这种通用的消息模式称为`Request-Response`模式。

### Transient

`event bus`消息都具有瞬时性，当`event bus`全部或者部分失败后，那就有可能丢失一部分消息。如果你的应用程序不允许出现消息丢失，那么你应该将你的`handler`编码成`idempotent`，同时当`event bus`恢复后，你的sender再尝试回应消息。

如果你想要持久有你的消息，你可以使用`persistent work queue module`

### Types of messages

在`event bus`上传递的消息可以是一个简单的字符串，一个数字，一个boolean，或者是`Vert.x Buffer` 或者`JSON`消息。

但是我们强烈建议你在不同的verticle中通过JSON消息进行通信。JSON可以在Vert.x支持的语言中轻松地创建和解析。

### Event Bus API

### Registering and Unregistering Handlers

下例演示了如何在`test.address`上注册一个消息`handler`。
```java
EventBus eb = vertx.eventBus();

Handler<Message> myHandler = new Handler<Message>() {
    public void handle(Message message) {
        System.out.println("I received a message " + message.body);
    }
};

eb.registerHandler("test.address", myHandler);
```

`myHandler`会接受到所有发送到`test.address`地址上的消息。

`Message`是一个泛型类，已经指定的消息类型有：`Message<Boolean>, Message<Buffer>, Message<byte[]>, Message<Byte>, Message<Character>, Message<Double>, Message<Float>, Message<Integer>, Message<JsonObject>, Message<JsonArray>, Message<Long>, Message<Short> and Message<String>`

如果你确定接受到的消息都是同一种类型，那么你可以在handler上使用指定类型
```java
Handler<Message<String>> myHandler = new Handler<Message<String>>() {
    public void handle(Message<String> message) {
        String body = message.body;
    }
};
```

`registerHandler`方法返回的是`event bus`自身。我们提供了一个流畅的API，因此你可以将多个调用连接在一起。

当你向某个地址中注册一个handler，同时处于一个集群中，那该注册过程就需要耗费一点时间来在整个集群中的进行传播。如果你想`handler`注册成功后获得通知，那么你可以向`registerHandler`方法的第三个参数中指定另一个handler。当集群中的所有节点都收到向某个地址注册`handler`信息之后，那么第三个参数`handler`就会被调用,然后你就会收到handler注册完成的通知了。
```java
eb.registerHandler("test.address", myHandler, new AsyncResultHandler<Void>() {
    public void handle(AsyncResult<Void> asyncResult) {
        System.out.println("The handler has been registered across the cluster ok? " + asyncResult.succeeded());
    }
});
```

解除`handler`注册也是非常简单的，你只需要向`unregisterHandler`方法传递注册地址和已经注册上的那个`handler`对象就可以了。
```java
eb.unregisterHandler("test.address", myHandler);
```

一个`handler`可以向相同的或者不同的地址上注册多次，因此为了在handler解除注册时，能够确定handler的唯一性，在解除注册时你需要同时指定要被解除的`handler`对象和注册地址

和注册一样，当你在一个集群环境中解除handler注册，这个过程需要耗费一些时间，以便整个集群都会收到该解除注册通知。同样的你如果想要当解除注册完成之后获得通知，`registerHandler`给这个函数增加一个第三个参数就可以了

```java
eb.unregisterHandler("test.address", myHandler, new AsyncResultHandler<Void>() {
    public void handle(AsyncResult<Void> asyncResult) {
        System.out.println("The handler has been unregistered across the cluster ok? " + asyncResult.succeeded());
    }
});
```

如果你想要你的handler存在于整个verticle的生命周期内，那么你就没有必要显式地去对该handler进行解除注册，当verticle停止的时候，Vert.x会自动对其进行解除注册

## Publishing messages

发布一个消息也是非常简单的，你只需要指定一个发布地址，然后在指定发布的内容就可以了
```java
eb.publish("test.address", "hello world");
```

这个消息会发布给在该地址上注册的所有handler。

## Sending messages

通过`send`发送消息，那么目标地址上只有一个handler进行消息接受。这是一种点对点的发送消息模式。选取handler同样采用了一种不是很严格的`round-robin`算法
```java
eb.send("test.address", "hello world");
```

## Replying to messages

当你接受到一个消息后，你可能需要对该消息进行回应，这种模式称为`request-response`

当你`send`一个消息时，你将一个回应`handler`作为第三个参数。当接受者接收到消息后，他们可以调用`Message`的`reply`方法来回应消息。当`reply`方法被调用的时候，它会将回复消息发送者。
```java
Handler<Message<String>> myHandler = new Handler<Message<String>>() {
    public void handle(Message<String> message) {
        System.out.println("I received a message " + message.body);

        // Do some stuff

        // Now reply to it

        message.reply("This is a reply");
    }
};

eb.registerHandler("test.address", myHandler);
```

The sender:
```java
eb.send("test.address", "This is a message", new Handler<Message<String>>() {
    public void handle(Message<String> message) {
        System.out.println("I received a reply " + message.body);
    }
});
```
发送空的`reply`或者`null reply`都是合法的。

The replies themselves can also be replied to so you can create a dialog between two different verticles consisting of multiple rounds.

## Specifying timeouts for replies

如果你在发送消息时指定了一个reply handler, 但是却一直得不到回复响应，那么那么该handler永远都不会被解除注册。

为了解决这个问题，你可以指定一个`Handler<AsyncResult<Message>>`作为`reply handler`，然后再设置一个超时时间。如果在超时之前，你收到了消息的reply，那么该`AsyncResult`的`handler`方法就会被调用。如果超时前一直都得不到`reply`，那么该`handler`就会自动被解除注册，同时`new Handler<AsyncResult<Message<String>>>()`也会被调用，但是`AsyncResult`会包含一个失败的状态，你可以在这种状态下做一些特殊处理:
```java
eb.sendWithTimeout("test.address", "This is a message", 1000, new Handler<AsyncResult<Message<String>>>() {
    public void handle(AsyncResult<Message<String>> result) {
        if (result.succeeded()) {
            System.out.println("I received a reply " + message.body);
        } else {

            System.err.println("No reply was received before the 1 second timeout!");
        }
    }
});
```

当`send`超时之后，我们可以通过`AsyncResult`的`cause()`来获得一个`ReplyException`异常信息。`ReplyException`上的`failureType()`值是`ReplyFailure.TIMEOUT`

你也可以在`event bus`自身上设置一个超时时间. 如果你在`event bus`使用带有reply handler的`send(...)`方法，那这个超时时间就会被使用到。默认的超时时间是`-1`,这意味着reply handler 永远不会超时
```java
eb.setDefaultReplyTimeout(5000);

eb.send("test.address", "This is a message", new Handler<Message<String>>() {
    public void handle(Message<String> message) {
        System.out.println("I received a reply before the timeout of 5 seconds");
    }
});
```

同样，你也可以对reply设置一个超时，然后使用`Handler<AsyncResult<Message>>`在超时时间内获得reply的reply：
```java
message.replyWithTimeout("This is a reply", 1000, new Handler<AsyncResult<Message<String>>>() {
    public void handle(AsyncResult<Message<String>> result) {
        if (result.succeeded()) {
            System.out.println("I received a reply to the reply" + message.body);
        } else {
            System.err.println("No reply to the reply was received before the 1 second timeout!");
        }
    }
});
```

## Getting notified of reply failures

如果你使用超时和一个`result handler`去`send`一个消息，但是没有可用的handler将消息发送出去，那么result handler将会被调用，`AsyncResult`会是一个失败的状态,同样`cause()`会返回一个`ReplyException`. `ReplyException`实例的`failureType()`的返回值是`ReplyFailure.NO_HANDLERS`

如果你使用超时和一个`result handler`去`send`一个消息，但是接受者通过调用`Message.fail(..)`回应该消息, `result handler`会被调用，`AsyncResult`会是一个失败的状态,同样`cause()`会返回一个`ReplyException`. `ReplyException`实例的`failureType()`的返回值是`ReplyFailure.RECIPIENT_FAILURE`

For example:
```java
eb.registerHandler("test.address", new Handler<Message<String>>() {
    public void handle(Message<String> message) {
        message.fail(123, "Not enough aardvarks");
    }
});

eb.sendWithTimeout("test.address", "This is a message", 1000, new Handler<AsyncResult<Message<String>>>() {
    public void handle(AsyncResult<Message<String>> result) {
        if (result.succeeded()) {
            System.out.println("I received a reply " + message.body);
        } else {
            ReplyException ex = (ReplyException)result.cause();
            System.err.println("Failure type: " + ex.failureType();
            System.err.println("Failure code: " + ex.failureCode();
            System.err.println("Failure message: " + ex.message();
        }
    }
});
```

## Message types

你发送的消息类型可以是以下几种(包括部分包装类型)

* `boolean`
* `byte[]`
* `byte`
* `char`
* `double`
* `float`
* `int`
* `long`
* `short`
* `java.lang.String`
* `org.vertx.java.core.json.JsonObject`
* `org.vertx.java.core.json.JsonArray`
* `org.vertx.java.core.buffer.Buffer`

如果`Vert.x buffers` 和 `JSON objects and arrays`是在相同的JVM里进行传递，那么在传递之前，他们会被copy一份，因此不同的verticle不能访问相同的对象实例，相同的对象实例会引发条件竞争。

Send some numbers:
```java
eb.send("test.address", 1234);
eb.send("test.address", 3.14159);
Send a boolean:

eb.send("test.address", true);
```

Send a JSON object:
```java
JsonObject obj = new JsonObject();
obj.putString("foo", "wibble");
eb.send("test.address", obj);
```

Null messages can also be sent:

```java
eb.send("test.address", null);
```

使用JSON作为verticle通信协议是一个不错的约定，这是因为JSON可以被所有Vert.x所支持的语言进行编解码

## Distributed event bus


如果想要在你的特定网络内每一个Vert.x实例都在相同的`event bus`里，你只需要在命令行里启动Vert.x实例时添加`-cluster`参数就好了

一旦你成功启动，集群模式下的Vert.x实例就会合并到一起，组成一个分布式的`event bus`


# Shared Data

我们可能需要一种安全的方式在不同的verticle间共享数据。 Vert.x允许`java.util.concurrent.ConcurrentMap`和`java.util.Set`这俩个数据结构在verticle间共享。

> 注意：为了避免可变数据带来的问题，Vert.x只允许简单的不可变类型，例如`number, boolean and string or Buffer`等数据类型用于做数据共享。当共享一个buffer时， 当我们从共享数据获取`Buffer`数据时，其实我们只是从共享数据里copy了一个`Buffer`，因此不同的verticle永远不会访问同一个对象。

并发数据只能在同一个Vert.x实例中的verticle实例中进行共享。在以后的版本中，Vert.x会允许数据可以在集群中的所有Vert.x实例间进行共享。

### Shared Maps

如果想要在不同的verticle中共享一个map。首先我们获得这个map的引用，然后就可以使用`java.util.concurrent.ConcurrentMap`的共享实例了。

```java
ConcurrentMap<String, Integer> map = vertx.sharedData().getMap("demo.mymap");

map.put("some-key", 123);
```

当然你也可以在其他的verticle中访问它
```java
ConcurrentMap<String, Integer> map = vertx.sharedData().getMap("demo.mymap");

// etc
```

### Shared Sets

在不同的verticle中使用一个共享的set和使用一个共享的map，方式基本相同
```
Set<String> set = vertx.sharedData().getSet("demo.myset");

set.add("some-value");
```

然后在不同的verticle中使用它
```
Set<String> set = vertx.sharedData().getSet("demo.myset");

// etc
```


# Buffers

在Vert.x中进行数据传播的大多是`org.vertx.java.core.buffer.Buffer`实例

`Buffer`表示的是一个字节序列(size >= 0), 可以向`Buffer`写入或者读取数据, 当写入数据时，超过其容量最大值时，会自动拓容。

#### Creating Buffers

创建一个空`Buffer`
```java
Buffer buff = new Buffer();
```

使用`String`类型创建一个buffer。这个`String`在`Buffer`内部以`UTF-8`进行编码
```java
Buffer buff = new Buffer("some-string");
```

指定`String`编码格式创建一个`Buffer`实例。
```java
Buffer buff = new Buffer("some-string", "UTF-16");
```

使用`byte[]`创建一个`Buffer`
```java
byte[] bytes = new byte[] { ... };
new Buffer(bytes);
```

在创建`Buffer`实例时，我们也可以指定其大小。当你确定写入buffer的数据大小时，你可以创建一个指定大小的buffer。当buffer创建成功之后，就会分配出指定大小的内存，这种方式比buffer容量不足时，自动拓容要高效的多，但是要慎用，因为它一开始就可能会非常大的内存。

注意，通过指定大小的方式创建出的`Buffer`实例，给它分配的内存是空的，并不会用0去填充它。
```java
Buffer buff = new Buffer(100000);
```

#### Writing to a Buffer

有俩种方式向一个buffer中写入数据：
1. appending
2. random access

buffer会随着写入的数据的不断增加自动拓容，因此，`Buffer`实例的写数据操作不可能产生`IndexOutOfBoundsException`异常

##### Appending to a Buffer

想要使用`append`方式向buffer中写入数据,你只需要调用`appendXXX`方法. `Append`方法支持追加`buffers, byte[], String and all primitive types`

`appendXXX`方法会返回`Buffer`实例自身，所以在也可以直接使用`chain`模式
```java
Buffer buff = new Buffer();

buff.appendInt(123).appendString("hello\n");

socket.write(buff);
```

##### Random access buffer writes

你也可以通过`setXXX`方法在一个指定位置上写入数据。 `setXXX`方法支持`buffers, byte[], String and all primitive types`.所有的`setXXX`方法的第一个参数都是个写入位置的索引值。

无论采用什么写数据的方式,`Buffer`总会当内存不足时，进行自动拓容
```java
Buffer buff = new Buffer();

buff.setInt(1000, 123);
buff.setBytes(0, "hello");
```

#### Reading from a Buffer

我们通过`getXXX`方法从`Buffer`里读数据. `getXXX`方法支持`byte[], String and all primitive types`. `getXXX`方法的第一个值是开始读取的位置索引值
```java
Buffer buff = ...;
for (int i = 0; i < buff.length(); i += 4) {
    System.out.println("int value at " + i + " is " + buff.getInt(i));
}
```

#### Other buffer methods:

* length(). 获得buffer的大小。buffer的length值是buffer的最大索引值 + 1
* copy(). 拷贝整个buffer

更多方法参考javadoc手册。


# JSON

在javascript中有一等类支持`JSON`, RUBY中有哈希字面量非常好的支持JSON,但是java并不支持这俩点.

因此,如果你想要在java `verticle`中使用JSON,我们提供了一些简单的JSON类,这些JSON类可以表示JSON对象或者JSON数组.那些类提供了从一个JSON对象或者数组中set/get JSON支持的所有类型。

JSON对象是`org.vertx.java.core.json.JsonObject`的实例.JSON数组是`org.vertx.java.core.json.JsonArray`的实例

下面的例子给出了在java verticle中在从`event bus`中收发JSON消息
```java
EventBus eb = vertx.eventBus();

JsonObject obj = new JsonObject().putString("foo", "wibble")
                                 .putNumber("age", 1000);

eb.send("some-address", obj);


// ....
// And in a handler somewhere:

public void handle(Message<JsonObject> message) {
    System.out.println("foo is " + message.body.getString("foo");
    System.out.println("age is " + message.body.getNumber("age");
}
```

我们还提供了对象和JSON格式之间的转化方法

Please see the JavaDoc for the full Java Json API.


# Delayed and Periodic Tasks

在Vert.x中有一种常用操作就是经过一段时间的延迟后执行某种操作

chap.c在标准verticle中,你不能通过让线程sleep的方式来达到延迟的效果,因为这会阻塞`event loop`线程

你可以使用Vert.x定时器.定时器可以是one-shot 或者 periodic

### One-shot Timers

`one shot`定时器当延迟时间一到就会调用一个`event handler`.延迟单位是毫秒

你只需要调用`setTimer`方法,然后向该方法传递需延迟的时间和一个handler.
```java
long timerID = vertx.setTimer(1000, new Handler<Long>() {
    public void handle(Long timerID) {
        log.info("And one second later this is printed");
    }
});

log.info("First this is printed");
```

该方法的返回值是一个唯一的定时器ID,我们可以使用该ID取消该定时器

### Periodic Timers

你还可以使用`setPeriodic`方法设置一个阶段定时器.这个定时器每隔一段时间就会执行一次.同样该方法的返回值是一个唯一的定时器ID,我们同样可以使用该ID取消定时器.
```java
long timerID = vertx.setPeriodic(1000, new Handler<Long>() {
    public void handle(Long timerID) {
        log.info("And every second this is printed");
    }
});

log.info("First this is printed");
```

### Cancelling timers

我们调用`cancelTimer`方法可以取消掉`periodic timer`
```java
long timerID = vertx.setPeriodic(1000, new Handler<Long>() {
    public void handle(Long timerID) {
    }
});

// And immediately cancel it

vertx.cancelTimer(timerID);
```

或者你可以在event handler里取消它.下面的例子就是在10秒后取消掉了该定时器
```java
long timerID = vertx.setPeriodic(1000, new Handler<Long>() {
    int count;
    public void handle(Long timerID) {
        log.info("In event handler " + count);
        if (++count == 10) {
            vertx.cancelTimer(timerID);
        }
    }
});
```


# Writing TCP Servers and Clients

通过Vert.x创建TCP的服务器和客户端是非常简单的


# Net Server

### Creating a Net Server

我们可以通过`vertx`实例的`createNetServer`方法轻松创建一个TCP服务器
```
NetServer server = vertx.createNetServer();
```

### Start the Server Listening

接下来我们告诉服务器要监听入站连接的端口号
```java
NetServer server = vertx.createNetServer();

server.listen(1234, "myhost");
```

第一个参数是要监听的端口号。如果将要监听的端口号设置为0的话，那服务器会随机出一个可用的端口号。一旦服务器完成监听动作，你可以调用`port()`方法查看服务器真实监听的端口号。

第二个参数是域名或者IP地址。如果该参数省略不填的话，那么才采取默认值`0.0.0.0`,这意味着它会监听所有可用的网络接口

实际上的绑定动作是异步的，这意味着，可能你的`listen`方法已经返回了，但是绑定动作还没有完成。如果你想要开始正式监听时获取一个通知的话，那么你可以在第三个参数上指定一个handler。
```java
server.listen(1234, "myhost", new AsyncResultHandler<Void>() {
    public void handle(AsyncResult<NetServer> asyncResult) {
        log.info("Listen succeeded? " + asyncResult.succeeded());
    }
});
```

### Getting Notified of Incoming Connections

我们需要调用`connectHandler`来处理到来的网络连接.
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(NetSocket sock) {
        log.info("A client has connected!");
    }
});

server.listen(1234, "localhost");
```

`connectHandler`方法返回值就是服务器自身，因此我们将多个方法调用链式地组合在一起：
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(NetSocket sock) {
        log.info("A client has connected!");
    }
}).listen(1234, "localhost");
```
or
```java
vertx.createNetServer().connectHandler(new Handler<NetSocket>() {
    public void handle(NetSocket sock) {
        log.info("A client has connected!");
    }
}).listen(1234, "localhost");
```
Vert.x API大多数都采用这种模式思想

### Closing a Net Server

如果想要结束一个net server，我们只需要调用`close`方法就好了
```java
server.close();
```

`close`方法同样是异步的，因此它也有可能close方法已经返回了，但是close操作其实还没完成。当然你如果想要当close完成时获得通知的话，你也可以选择向`close`方法指定一个handler

```java
server.close(new AsyncResultHandler<Void>() {
    public void handle(AsyncResult<Void> asyncResult) {
        log.info("Close succeeded? " + asyncResult.succeeded());
    }
});
```

如果你想要你的net server的生命周期和verticle保持一致，那么你就没必要显式的调用`close`方法了，当verticle解除部署时，Vert.x container会自动帮你关闭掉服务器

### NetServer Properties

`NetServer`有一套属性可以设置，属性可以影响`NetServer`的行为。首先，这套属性调整的是TCP参数，在大多数情况下，你不需要设置他们。

* `setTCPNoDelay(tcpNoDelay)` If true then Nagle's Algorithm is disabled. If false then it is enabled.
* `setSendBufferSize(size)` Sets the TCP send buffer size in bytes.
* `setReceiveBufferSize(size)` Sets the TCP receive buffer size in bytes.
* `setTCPKeepAlive(keepAlive)` if keepAlive is true then TCP keep alive is enabled, if false it is disabled.
* `setReuseAddress(reuse)` if reuse is true then addresses in TIME_WAIT state can be reused after they have been closed.
* `setSoLinger(linger)`
* `setTrafficClass(trafficClass)`


### Handling Data

当服务器接受到一个连接，connect handler对象的`handler`方法会被调用，同时向该方法中传递一个`NetSocket`对象。`NetSocket`是一个类Socket接口，该类允许你进行读写数据，甚至还允许你关闭该Socket。

#### Reading Data from the Socket

如果想要从`NetSocket`读取数据，你需要在`NetSocket`上调用`dataHandler`方法设置一个dataHandler。每当在socket上接受到数据后，dataHandler都会被调用,同时向`dataHandler`方法传递一个`org.vertx.java.core.buffer.Buffer`对象。你可以使用下面的例子开启一个服务器：
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(NetSocket sock) {
        sock.dataHandler(new Handler<Buffer>() {
            public void handle(Buffer buffer) {
                log.info("I received " + buffer.length() + " bytes of data");
            }
        });
    }
}).listen(1234, "localhost");
```

#### Writing Data to a Socket

如果想要向scoket中写入数据的话，你可以调用`write`方法，这个方法可以通过下面几种方式进行调用：

With a single buffer:
```java
Buffer myBuffer = new Buffer(...);
sock.write(myBuffer);
```

下面我们使用`UTF-8`编码的字符串，写入到socket中。
```java
sock.write("hello");
```
下面我们将指定编码格式化一个字符串，然后写入到socket中
```java
sock.write("hello", "UTF-16");
```

`write`方法同样是异步的，当该`write`方法入栈之后就会立即返回

下面给出了一个TCP 服务器，它将接受到的数据直接返回回去。
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(final NetSocket sock) {
        sock.dataHandler(new Handler<Buffer>() {
            public void handle(Buffer buffer) {
                sock.write(buffer);
            }
        });
    }
}).listen(1234, "localhost");
```

### Socket Remote Address

通过`remoteAddress()`方法你可以获得socket对等端的地址

### Socket Local Address

通过`localAddress()`方法你可以获得socket的本地地址

### Closing a socket

`close`方法会关闭一个socket，它会直接关闭底层的TCP连接

### Closed Handler

如果你想当socket关闭时获得通知，你可以设置一个`closedHandler`
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(final NetSocket sock) {
        sock.closedHandler(new VoidHandler() {
            public void handle() {
                log.info("The socket is now closed");
            }
        });
    }
}).listen(1234, "localhost");
```

不管是服务器还是客户端，任何一方关闭连接，close handler都会被调用

### Exception handler

如果担心通信过程中连接发生异常，你可以设置一个exception handler
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(final NetSocket sock) {
        sock.exceptionHandler(new Handler<Throwable>() {
            public void handle(Throwable t) {
                log.info("Oops, something went wrong", t);
            }
        });
    }
}).listen(1234, "localhost");
```

### Event Bus Write Handler

每一个`NetSocket`都会自动向`event bus`上注册一个handler， 当该handler接受到任何buffer之后，它会将buffer写入到`NetSocket`上。这样一来，由于我们可以通过从不同的verticle里，甚至从不同的Vert.x实例中向向`NetSocket`注册的`event bus`地址上写数据，那么我们实现了不单单从传统socket通信的方式向`NetSocket`写入数据的方式。

我们可以从`netSocket`上通过`writeHandlerID()`方法获取注册在`event bus`上的地址


下面的例子给出了从不同的verticle中向一个`NetSocket`中写入数据
```java
String writeHandlerID = ... // E.g. retrieve the ID from shared data

vertx.eventBus().send(writeHandlerID, buffer);
```

### Read and Write Streams

NetSocket also implements org.vertx.java.core.streams.ReadStream and org.vertx.java.core.streams.WriteStream. This allows flow control to occur on the connection and the connection data to be pumped to and from other object such as HTTP requests and responses, WebSockets and asynchronous files.

`NetSocket`实现了`org.vertx.java.core.streams.ReadStream`和`org.vertx.java.core.streams.WriteStream`接口。


## Scaling TCP Servers

每一个verticle实例都是纯单线程的。

如果你在一个verticle上创建了一个TCPserver，而且对该verticle只部署了一个实例，那么在该verticle上所有的handler就总是在同一个event loop上执行。

这意味着，如果你在一个多核心主机上上运行一个服务器，同时你只部署了一个服务器verticle实例，那么你的服务器只会使用该机器的一个核心

为了解决这个情况，你可以在同一个机器上部署多个服务器上module实例
```java
vertx runmod com.mycompany~my-mod~1.0 -instances 20
```

或者部署原生的verticle
```java
vertx run foo.MyApp -instances 20
```

上面的代码在同一个Vert.x实例上运行了20个module/verticle实例

当你这样部署之后，你会发现，服务器和之前运行的一样，但是，令人惊奇的是，你机器上的所有核心都处于使用状态，而且处理任务的能力也大大增强了

这时，你也许会问自己"等等，你怎么能让多个服务器同时监听相同的IP和端口呢？当你部署运行多个实例的时候不会造成端口冲突吗"

当主机上已经存在一个服务器监听某个`host/port`的时候，当你再部署一个服务器,监听相同的`host/port`时，Vert.x并不会新建一个server，再在相同的`host/port`上进行监听

> Vert.x内部是这样做的，当你尝试部署多个服务器时监听相同的主机和端口时，Vert.x并不会再创建新的服务器对象对相同的主机和端口号进行监听，但是它会在处理网络连接的地方上再注册一个connetc handler(每个)，这么一来就相当于实现了一个处理网络的"集群"

Vert.x内部只会持有一个服务器，当有连接到来时，Vert.x会根据`round-robin`算法，在众多的connet handler中选择一个，然后将到来的连接转发到被选择出的那个connet handler上

Consequently Vert.x TCP servers can scale over available cores while each Vert.x verticle instance remains strictly single threaded, and you don't have to do any special tricks like writing load-balancers in order to scale your server on your multi-core machine.

因此，Vert.x TCP server就可以在非常方便地在可用核心上进行水平拓展，每个verticle实例都被分配到一个单线程上，因此你就不需要自己在多核主机上去实现服务器的负载均衡了。

# NetClient

`NetClient`常常是用来与服务器进行TCP连接

### Creating a Net Client

你只需要通过调用`vertx`的`createNetClient`方法就可以创建一个TCP客户端
```java
NetClient client = vertx.createNetClient();
```

### Making a Connection

然后调用`connect`方法就可以连接到服务器
```java
NetClient client = vertx.createNetClient();

client.connect(1234, "localhost", new AsyncResultHandler<NetSocket>() {
    public void handle(AsyncResult<NetSocket> asyncResult) {
        if (asyncResult.succeeded()) {
          log.info("We have connected! Socket is " + asyncResult.result());
    } else {
          asyncResult.cause().printStackTrace();
        }
    }
});
```

`connetc`方法第一个参数是服务器的端口，第二个参数是服务器绑定的域名或者IP地址。第三个参数是一个connect handler，当连接建立成功之后，这个handler就会被调用

`connect handler`泛型参数是`AsyncResult<NetSocket>`,我们可以从这个对象的`result()`方法中获取`NetSocket`对象。你可以像在服务器端那样，在socket上进行读写数据。

当然你也可以像在服务器端那样执行`close , set the closed handler, set the exception handler`操作

### Configuring Reconnection

`NetClient`可以被设置成自动重连或者当它无法连接到服务器/与服务器断开连接后进行断线重连。你可以通过调用`setReconnectAttempts`和`setReconnectInterval`方法来实现这样的功能
```java
NetClient client = vertx.createNetClient();

client.setReconnectAttempts(1000);

client.setReconnectInterval(500);
```

* `ReconnectAttempts`:该值设定重连服务器的次数。`-1`表示无限次。默认值是0
* `ReconnectInterval`:该值设定重连服务器的间隔。单位是毫秒。默认值是1000

### NetClient Properties

`NetClient`也有一套TCP Properties，这套属性值的含义和`NetServer`一样，具体使用参考`NetServer`就好了。


# SSL Servers


# SSL Clients


# User Datagram Protocol (UDP)


# Flow Control - Streams and Pumps

Vert.x提供了几个对象用于从`Buffer`中读取和写入数据。

在Vert.x中，调用写入数据的方法会直接返回，但是这个写入操作会在Vert.x内部入列(Vert.x内部有一个写入队列)。

如果你向一个对象中写入数据的速度快于这个对象向底层资源写入数据的速度的话，那么这个写入队列会无限制增长下去，直到最后将全部的可用内存都消耗掉。

为了解决这种问题，Vert.x API中的某些对象提供了`flow control`功能

我们可以向`org.vertx.java.core.streams.ReadStream`的实现类写入任何带有`flow control`功能对象, 我们可以从`org.vertx.java.core.streams.WriteStream`的实现类中读取出任何带有`flow control`功能的对象。

下面我们给出一个向`ReadStream`中读取数据,向`WriteStream`中写入数据的例子。

A very simple example would be reading from a NetSocket on a server and writing back to the same NetSocket - since NetSocket implements both ReadStream and WriteStream, but you can do this between any ReadStream and any WriteStream, including HTTP requests and response, async files, WebSockets, etc.

一个非常简单的例子是在服务器中从`NetSocket`中读取数据，然后将数据再写回到相同的`NetSocket`中,能这样做是因为`NetSocket`实现了`ReadStream`和`WriteStream`接口, 但是你可以在任何实现了`ReadStream`和`WriteStream`接口的类之间进行这样的操作,包括`HTTP requests and response`, `async files`, `WebSockets`, 等等.

对于刚才提到的情况，我们可以可以将接受的数据再直接写回到`NetSocket`中
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(final NetSocket sock) {

        sock.dataHandler(new Handler<Buffer>() {
            public void handle(Buffer buffer) {
                // Write the data straight back
                sock.write(buffer);
            }
        });

    }
}).listen(1234, "localhost");
```

在上述的例子中有一个问题：如果从socket中读取数据的速度快于向socket中写入数据的速度，它会慢慢地增长`NetSocket`中的写入队列，最终会引发内存溢出。例如，如果socket客户端读取数据不是很快，那么慢慢地该连接会阻塞掉。

由于`NetSocket`实现了`WriteStream`, 在写入数据之前我们可以检查`WriteStream`是否已经满了
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(final NetSocket sock) {

        sock.dataHandler(new Handler<Buffer>() {
            public void handle(Buffer buffer) {
                if (!sock.writeQueueFull()) {
                    sock.write(buffer);
                }
            }
        });

    }
}).listen(1234, "localhost");
```

上面的例子中不会引发内存溢出，但是当写入队列写满之后，就会发生丢消息的问题了。我们真的想做的是，当`NetSocket`的写入队列满了之后，就将`NetSocket`暂停掉：
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(final NetSocket sock) {

        sock.dataHandler(new Handler<Buffer>() {
            public void handle(Buffer buffer) {
                sock.write(buffer);
                if (sock.writeQueueFull()) {
                    sock.pause();
                }
            }
        });

    }
}).listen(1234, "localhost");
```

貌似我们已经完成了需求，但其实不然。当socket句柄满了之后，`NetSocket`被暂停了，但是当写入队列缓解之后，我们希望还能唤起暂停的`NetSocket`
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(final NetSocket sock) {

        sock.dataHandler(new Handler<Buffer>() {
            public void handle(Buffer buffer) {
                sock.write(buffer);
                if (sock.writeQueueFull()) {
                    sock.pause();
                    sock.drainHandler(new VoidHandler() {
                        public void handle() {
                            sock.resume();
                        }
                    });
                }
            }
        });

    }
}).listen(1234, "localhost");
```

当写入队列能够接受新的数据时,`drainHandler`会被调用, 这个操作会让`NetSocket`重新读取数据。

在我们开发Vert.x应用程序时，这是一种非常普遍的操作，因此我们提供了一个辅助类`Pump`, 这个类会完成刚才我们写的那一段代码。你可以将`Pump`看成`ReadStream`和`WriteStream`，`Pump`会自己知道何时重新读写数据
```java
NetServer server = vertx.createNetServer();

server.connectHandler(new Handler<NetSocket>() {
    public void handle(NetSocket sock) {
        Pump.create(sock, sock).start();
    }
}).listen(1234, "localhost");
```

## ReadStream

`HttpClientResponse, HttpServerRequest, WebSocket, NetSocket, SockJSSocket and AsyncFile`等类都实现了`ReadStream`接口

`ReadStream`接口定义如下方法：

* `dataHandler(handler)`: 设置一个从`ReadStream`读取数据的handler，当有数据到来时，handler会接受到一个`buffer`对象.
* `pause()`: 暂停dataHandler. 调用该方法之后，dataHandler不会再接受新的数据
* `resume()`: 激活dataHandler. 如果有数据来临时，dataHandler会被调用.
* `exceptionHandler(handler)`: `ReadStream`中发生异常时，exceptionHandler会被调用.
* `endHandler(handler)`: 当流读到结尾时，endHandler会被调用. This might be when EOF is reached if the ReadStream represents a file, or when end of request is reached if it's an HTTP request, or when the connection is closed if it's a TCP socket.

## WriteStream

` HttpClientRequest, HttpServerResponse, WebSocket, NetSocket, SockJSSocket and AsyncFile`实现了`WriteStream`接口

`WriteStream`接口定义如下方法：

* `write(buffer)`: 将`Buffer`中写入`WriteStream`.这个方法不会发生阻塞.写入操作在Vert.x内部会向写入队列中入列，写入队列将数据异步地写入底层资源。
* `setWriteQueueMaxSize(size)`: set the number of bytes at which the write queue is considered full, and the method * * writeQueueFull() returns true. Note that, even if the write queue is considered full, if write is called the data will still be accepted and queued.
* `writeQueueFull()`: 获取write queue是否满了，如果满了，返回true
* `exceptionHandler(handler)`: 当`WriteStream`发生异常时，将会调用这个handler
* `drainHandler(handler)`: The handler will be called if the WriteStream is considered no longer full.当`WriteStream`

## Pump

`Pump`实例拥有下列方法

* `start()`: 启动pump.
* `stop()`: 停止pump. When the pump starts it is in stopped mode.
* `setWriteQueueMaxSize()`: 与`WriteStream`的`setWriteQueueMaxSize`意义相同.
* `bytesPumped()`: 返回pumped的总的字节数

`Pump`可以多次启动和停止

当`Pump`第一次创建出来后，并不是`started`状态，你需要调用`start()`方法来启动它


# Writing HTTP servers

Vert.x能帮你完成一个全功能的高性能的可扩展的HTTP服务器

#### Creating an HTTP Server

调用`vertx`对象上的`createHttpServer`就可以创建一个HTTP服务器
```java
HttpServer server = vertx.createHttpServer();
```

#### Start the Server Listening

然后我们调用`listen`绑定土匪用于监听要接收处理的请求的端口
```java
HttpServer server = vertx.createHttpServer();

server.listen(8080, "myhost");
```
1. 第一个参数是绑定的端口号
2. 第二个参数是主机域名或者IP地址。如果忽略该参数，则服务器会采取默认值`0.0.0.0`,服务器会在所有可用的网络接口中监听绑定的端口号

实际上绑定操作是异步进行的，也就是当`listen`方法返回之后，并不意味着就绑定成功了。如果你想当绑定真正完成的时候，你可以向`listen`方法传递一个handler，用以接受绑定成功之后的通知
```java
server.listen(8080, "myhost", new AsyncResultHandler<Void>() {
    public void handle(AsyncResult<HttpServer> asyncResult) {
        log.info("Listen succeeded? " + asyncResult.succeeded());
    }
});
```

#### Getting Notified of Incoming Requests

我们还要设置一个request handler,这个handler是为了当请求到来时，我们能收到通知:
```java
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest request) {
        log.info("A request has arrived on the server!");
        request.response().end();
    }
});

server.listen(8080, "localhost");
```

每当有请求到来时，该handler都会被调用一次，然后向handler方法传递一个`org.vertx.java.core.http.HttpServerRequest`参数

你可以在verticle中实现一个HTTP 服务器,然后在浏览器里输入`http://localhost:8080`测试一下

和`NetServer`一样,`requestHandler`方法返回的也是它自身,因此我们也可以使用链式调用模式
```java
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest request) {
        log.info("A request has arrived on the server!");
        request.response().end();
    }
}).listen(8080, "localhost");
```
Or:
```java
vertx.createHttpServer().requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest request) {
        log.info("A request has arrived on the server!");
        request.response().end();
    }
}).listen(8080, "localhost");
```

#### Handling HTTP Requests

到目前为止，我们看到了如何创建一个`HttpServer`以及如何捕获通知,下面让我们看一下如何处理接受到的请求：

当捕获到一个请求时，会将请求封装到一个`HttpServerRequest`中，接着request handler会被调用。

The handler is called when the headers of the request have been fully read. If the request contains a body, that body may arrive at the server some time after the request handler has been called.

当请求的header被全部读取完之后，该handler就会被调用. 如果请求中包含body，body也许会在request handler被调用之后才达到。

`HttpServerRequest`包含有`get the URI, path, request headers and request parameters`等功能。我们还可以通过调用该对象的`response()`方法来获得一个表示服务器向客户端进行回应的对象。

##### Request Method

`HttpServerRequest`的`method()`表示的是请求使用的`HTTP method`(该方法的可能返回值有`GET, PUT, POST, DELETE, HEAD, OPTIONS, CONNECT, TRACE, PATCH`).

##### Request Version

`HttpServerRequest`的`version()`方法返回的当前请求使用的`HTTP`版本号

##### Request URI

`HttpServerRequest`的`rui()`方法返回的完整的`URI(Uniform Resource Locator)地址`，例如：
```java
/a/b/c/page.html?param1=abc&param2=xyz
```

`uri()`返回将会返回`/a/b/c/page.html?param1=abc&param2=xyz`

请求使用的`URI`地址可以是绝对的，也可以是相对的，这取决于客户端使用的什么,在大多数情况下使用的都是绝对的

##### Request Path

`HttpServerRequest`的`path()`方法返回的是请求路径，例如：
```java
a/b/c/page.html?param1=abc&param2=xyz
```

`request.path()`将返回`/a/b/c/page.html`

##### Request Query

`HttpServerRequest`的`query()`方法返回的是请求查询内容，例如
```
a/b/c/page.html?param1=abc&param2=xyz
```
`request.query()`将返回`param1=abc&param2=xyz`

##### Request Headers

我们可以在`HttpServerRequest`的对象上通过`headers()`方法获取请求的请求头(`org.vertx.java.core.MultiMap`对象)。`MultiMap`允许一个key有多个值(这让人想起的guava)

下面的例子对`http://localhost:8080`请求输出了请求头
```java
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest request) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> header: request.headers().entries()) {
            sb.append(header.getKey()).append(": ").append(header.getValue()).append("\n");
        }
        request.response().putHeader("content-type", "text/plain");
        request.response().end(sb.toString());
    }
}).listen(8080, "localhost");
```

##### Request params

我们通过`HttpServerRequest`的`params()`方法获得请求的请求参数,同样请求参数也是用`org.vertx.java.core.MultiMap`存储.

例如：
```java
/page.html?param1=abc&param2=xyz
```
Then the params multimap would contain the following entries:
```
param1: 'abc'
param2: 'xyz
```

##### Remote Address
`HttpServerRequest`的`remoteAddress()`返回的是HTTP连接另一端的地址（也就是客户端）

##### Absolute URI

`HttpServerRequest`的`absoluteURI()`返回的是请求的相对`URI`地址

##### Reading Data from the Request Body

有时候我们需要向HTTP body中读取数据。像前面介绍的，当请求头被完整读取出来之后，request handler就会被调用，同时封装一个`HttpServerRequest`对象传递给该`handler`，但是该对象并不包含body。这么做是因为，body也许非常大，我们不希望可能因为超过可用内存而引发任何问题。

如果，你想要读取body数据，那么你只需要调用`HttpServerRequest`的`dataHandler`方法,通过该方法设置一个data handler，每当接受一次request body块都会调用一次该handler。
```java
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest request) {
        request.dataHandler(new Handler<Buffer>() {
            public void handle(Buffer buffer) {
                log.info('I received ' + buffer.length() + ' bytes');
            }
        });

    }
}).listen(8080, "localhost");
```

`dataHandler`可能不仅仅被调用一次，调用的次数取决于`body`的大小

这和`NetSocket`中去读数据非常像

`HttpServerRequest`实现了`ReadStream`接口,因此你可以将body转接到一个`WriteStream`中。

在大多数情况下，body并不是非常大而且我们想要一次性就接受到整个body数据，那么你可以像下面这样操作：
```java
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest request) {

        final Buffer body = new Buffer(0);

        request.dataHandler(new Handler<Buffer>() {
            public void handle(Buffer buffer) {
                body.appendBuffer(buffer);
            }
        });
        request.endHandler(new VoidHandler() {
            public void handle() {
              // The entire body has now been received
              log.info("The total body received was " + body.length() + " bytes");
            }
        });

    }
}).listen(8080, "localhost");
```

和任何`ReadStream`的实现类一样,当`stream`读到尾之后，end handler就会被调用。

如果`HTTP`请求使用了`HTTP chunking`,那么每次接收到body里每个HTTP chunk时都会调用一次data handler。

如果想要接收到完整的body数据再解析它的话，这是一种非常通用的用法，因此`Vert.x`提供了一个`bodyHandler`方法

`bodyHandler`方法设置的handler，只有当整个body数据接受完之后才会被调用

当body数据非常大的时候，vert.x会将整个body数据换存储在内存里
```java
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest request) {
        request.bodyHandler(new Handler<Buffer>() {
            public void handle(Buffer body) {
              // The entire body has now been received
              log.info("The total body received was " + body.length() + " bytes");
            }
        });
    }
}).listen(8080, "localhost");
```

##### Handling Multipart Form Uploads

Vert.x能够理解`HTML`表单里的文件上传操作. 为了能处理文件上传，你需要在request对象上设置`uploadHandler`。表单中每上传一个文件，设置的handler都会被调用一次
```java
request.expectMultiPart(true);

request.uploadHandler(new Handler<HttpServerFileUpload>() {
    public void handle(HttpServerFileUpload upload) {
    }
});
```

`HttpServerFileUpload`类实现了`ReadStream`，因此你可以从该类中读取数据,然后将数据再写入任何实现了`WriteStream`的对象,例如前文一直提到的`Pump`

你也可以直接使用`streamToFileSystem()`方法将文件直接输出磁盘上
```java
request.expectMultiPart(true);

request.uploadHandler(new Handler<HttpServerFileUpload>() {
    public void handle(HttpServerFileUpload upload) {
        upload.streamToFileSystem("uploads/" + upload.filename());
    }
});
```

##### Handling Multipart Form Attributes

如果客户端发送过来的请求是一个HTML表单请求，那么你可以使用`formAttributes`读取请求属性列表。我们要确保请求的全部内容(包含header和body)都被读取之后，采取调用`formAttributes`,这是因为表单属性都存储在了body里
```java
request.endHandler(new VoidHandler() {
    public void handle() {
        // The request has been all ready so now we can look at the form attributes
        MultiMap attrs = request.formAttributes();
        // Do something with them
    }
});
```

#### Setting Status Code and Message

我们使用`setStatusCode()`可以设置返回给客户端的HTTP状态码
```java
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest request) {
        request.response().setStatusCode(739).setStatusMessage("Too many gerbils").end();
    }
}).listen(8080, "localhost");
```
你还可以使用`setStatusMessage()`设置状态消息,如果你不进行手动设置的话，那就会采取默认值

默认的状态码是200

#### Writing HTTP responses

如果你想要向HTTP response写入数据，你直接调用`write`方法就好了。当response结束之前，你可以多次调用`write`方法。
```java
Buffer myBuffer = ...
request.response().write(myBuffer);
```
向response中写入使用`UTF-8`编码的字符串
```
request.response().write("hello");
```

使用指定的编码对字符串进行编码然后写入到response中
```
request.response().write("hello", "UTF-16");
```

`write`方法同样是异步的，当write放入到socket的写入队列之后就直接返回(但是此时并不意味着数据就已经写出了)

如果你只想向HTTP response写入一个String或者一个Buffer，那么当你调用完`write`方法之后，再调用一次`end`方法就可以了

The first call to write results in the response header being being written to the response.



因此，如果你没使用HTTP chunking，那么当你向response写入数据之前，必须设置`Content-Length header`。

#### Ending HTTP responses

当你已经向HTTP response写完数据之后，必须手动调用`end()`方法

`end`方法有如下几种调用方式：
```
request.response().end();
```

下面这种方式和先调用一个`write(String)`再调用`end()`方法是一样的
```
request.response().end("That's all folks");
```

#### Closing the underlying connection

你可以通过调用`close()`方法关闭掉当前请求的底层TCP连接
```
request.response().close();
```

#### Response headers

我们可以通过调用`headers()`方法获得`response header`（`Multimap`），然后通过`set`方法向其添加`response header`
```
request.response().headers().set("Cheese", "Stilton");
request.response().headers().set("Hat colour", "Mauve");
```

我们还可以通过链式模式调用`putHeader`方法向HTTP response header添加属性
```
request.response().putHeader("Some-Header", "elephants").putHeader("Pants", "Absent");
```

response header必须在写入body动作之前写入

#### Chunked HTTP Responses and Trailers

Vert.x支持`HTTP Chunked Transfer Encoding`, 这种模式会将HTTP response body以chunk的方式写入到socket中，当向clent输出的response body非常大，且其大小未知时，这是非常有用的。

```
req.response().setChunked(true);
```

response的默认值是`non-chunked`,当在chunked模式下，每一次调用`response.write(...)`都会创建一个新的`HTTP chunk`写入到socket流中

在chunked模式下，你还可以向response中写入`HTTP response trailers`,这些数据实际上是被写入到最后一个chunk中。

你可以向下面这样，通过调用`trailers()`方法向`HTTP response trailers`中写入数据。
```
request.response().trailers().add("Philosophy", "Solipsism");
request.response().trailers().add("Favourite-Shakin-Stevens-Song", "Behind the Green Door");
```
Like headers, individual HTTP response trailers can also be written using the putTrailer() method. This allows a fluent API since calls to putTrailer can be chained:
```
request.response().putTrailer("Cat-Food", "Whiskas").putTrailer("Eye-Wear", "Monocle");
```

### Serving files directly from disk

If you were writing a web server, one way to serve a file from disk would be to open it as an AsyncFile and pump it to the HTTP response. Or you could load it it one go using the file system API and write that to the HTTP response.

Alternatively, Vert.x provides a method which allows you to serve a file from disk to an HTTP response in one operation. Where supported by the underlying operating system this may result in the OS directly transferring bytes from the file to the socket without being copied through userspace at all.

Using sendFile is usually more efficient for large files, but may be slower for small files than using readFile to manually read the file as a buffer and write it directly to the response.

To do this use the sendFile function on the HTTP response. Here's a simple HTTP web server that serves static files from the local web directory:
```
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(HttpServerRequest req) {
      String file = "";
      if (req.path().equals("/")) {
        file = "index.html";
      } else if (!req.path().contains("..")) {
        file = req.path();
      }
      req.response().sendFile("web/" + file);
    }
}).listen(8080, "localhost");
```
There's also a version of sendFile which takes the name of a file to serve if the specified file cannot be found:
```
req.response().sendFile("web/" + file, "handler_404.html");
```
Note: If you use sendFile while using HTTPS it will copy through userspace, since if the kernel is copying data directly from disk to socket it doesn't give us an opportunity to apply any encryption.

If you're going to write web servers using Vert.x be careful that users cannot exploit the path to access files outside the directory from which you want to serve them.

### Pumping Responses

Since the HTTP Response implements WriteStream you can pump to it from any ReadStream, e.g. an AsyncFile, NetSocket, WebSocket or HttpServerRequest.

Here's an example which echoes HttpRequest headers and body back in the HttpResponse. It uses a pump for the body, so it will work even if the HTTP request body is much larger than can fit in memory at any one time:
```
HttpServer server = vertx.createHttpServer();

server.requestHandler(new Handler<HttpServerRequest>() {
    public void handle(final HttpServerRequest req) {
      req.response().headers().set(req.headers());
      Pump.createPump(req, req.response()).start();
      req.endHandler(new VoidHandler() {
        public void handle() {
            req.response().end();
        }
      });
    }
}).listen(8080, "localhost");
```

### HTTP Compression

Vert.x comes with support for HTTP Compression out of the box. Which means you are able to automatically compress the body of the responses before they are sent back to the Client. If the client does not support HTTP Compression the responses are sent back without compressing the body. This allows to handle Client that support HTTP Compression and those that not support it at the same time.

To enable compression you only need to do:
```
HttpServer server = vertx.createHttpServer();
server.setCompressionSupported(true);
```
The default is false.

When HTTP Compression is enabled the HttpServer will check if the client did include an 'Accept-Encoding' header which includes the supported compressions. Common used are deflate and gzip. Both are supported by Vert.x. Once such a header is found the HttpServer will automatically compress the body of the response with one of the supported compressions and send it back to the client.

Be aware that compression may be able to reduce network traffic but is more cpu-intensive.


# Writing HTTP Clients


# Routing HTTP requests with Pattern Matching



# WebSockets


# SockJS


# SockJS - EventBus Bridge


# File System


# DNS Client