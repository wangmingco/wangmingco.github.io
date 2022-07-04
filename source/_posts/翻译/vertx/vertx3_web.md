---
category: 翻译
tag: vertx3
title: Vertx 3 Web
date: 2015-08-10 17:10:00
---

# Basic Vert.x-Web concepts
Here’s the 10000 foot view:

`Router`是`Vert.x-Web`最核心的概念. `Router`是一个持有零到多个`Routes`的对象

`Router`会将`HTTP request`发送到第一个匹配该请求的`route`身上.

`route`持有一个与`HTTP request`相匹配的`handler`, 然后该`handler`接受该请求. 然后执行具体任务, 当执行完任务之后你可以选择结束该请求或者将它传递给下一个匹配的`handler`.

下面是一个简单的示例：
```java
HttpServer server = vertx.createHttpServer();

Router router = Router.router(vertx);

router.route().handler(routingContext -> {

  // This handler will be called for every request
  HttpServerResponse response = routingContext.response();
  response.putHeader("content-type", "text/plain");

  // Write to the response and end it
  response.end("Hello World from Vert.x-Web!");
});

server.requestHandler(router::accept).listen(8080);
```

我们创建了一个`HTTP Server`服务器, 接着创建了一个`router`. 我们没有对这个`route`指定匹配规则,因此它会匹配所有的`HTTP request`.

然后我们在该`route`上设置了一个`handler`, 这个`handler`会处理该服务器上所有的`HTTP request`.

传递给`handler`的是一个`RoutingContext`对象, 该对象包含一个一个标准的`Vert.x HttpServerRequest`和`Vert.x HttpServerResponse`,但是还包含了很多其他的`Vert.x-Web`里的特性.

对于每一个`HTTP request`都会生成一个唯一的`RoutingContext`实例, 但是给实例会传递给所有匹配该请求的`handler`.



# Handling requests and calling the next handler

当`Vert.x-Web``route`一个`HTTP Request`到一个与之匹配的`route`，它会向该`route`的`handler`传递一个`RoutingContext`实例.

如果在当前`handler`里,你不想结束`response`, 那么你应该调用下一个相匹配的`route`继续处理该请求.

你没有必要在当前`handler`执行完之前调用下一个`route`, 你可以稍后再做这件事.

```java
Route route1 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  // enable chunked responses because we will be adding data as
  // we execute over other handlers. This is only required once and
  // only if several handlers do output.
  response.setChunked(true);

  response.write("route1\n");

  // Call the next matching route after a 5 second delay
  routingContext.vertx().setTimer(5000, tid -> routingContext.next());
});

Route route2 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  response.write("route2\n");

  // Call the next matching route after a 5 second delay
  routingContext.vertx().setTimer(5000, tid ->  routingContext.next());
});

Route route3 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  response.write("route3");

  // Now end the response
  routingContext.response().end();
});
```

在上面的例子中, `route1`被写到`response`的5秒钟之后,`route2`被写到`response`,在过了5秒钟之后,`route3`被写到`response`,然后结束掉`response`.

注意这一切的发生都是非阻塞的,


# Using blocking handlers

在某些环境下,你也许想要在handler执行时,将`event loop`阻塞住, 例如调用一个阻塞API或者执行一些密集型计算. 这种情况下,你不能在普通`handler`中进行操作,我们为`route`提供了一个阻塞的`handler`.

阻塞式和非阻塞式`handler`非常像,只不过阻塞式是由`Vert.x`从`worker pool`中借出一个线程进行任务执行,而非是从`event loop`中.

下例进行了说明：
```java
router.route().blockingHandler(routingContext -> {

  // Do something that might take some time synchronously
  service.doSomethingThatBlocks();

  // Now call the next handler
  routingContext.next();

});
```
在默认情况下, Vert.x中任何的阻塞`handler`都是在相同的上下文中(例如`verticle`实例中)顺序执行的,这意味着当前一个handler未完成之前,下一个handler是不会执行的. 如果你不关心任务的执行顺序,而且不介意阻塞`handler`并行执行,你可以在调用`blockingHandler`方法时传递一个`false`的参数,让其不按照任务的指定顺序进行执行.


# Routing by exact path

`route`可以被设定为匹配特定的`URI`. 在这种情况下,它就可以指定路径的请求了.

在下面的例子中,`handler`会被路径为`/some/path/`的请求调用. 但是我们会忽略末尾斜杠,因此当路径为`/some/path`和`/some/path//`该handler都会被调用.

```java
Route route = router.route().path("/some/path/");

route.handler(routingContext -> {
  // This handler will be called for the following request paths:

  // `/some/path`
  // `/some/path/`
  // `/some/path//`
  //
  // but not:
  // `/some/path/subdir`
});
```

# Routing by paths that begin with something

通常情况下,你会想设置一个通用的前置路径. 如果是这种情况你可以使用正则表达式, 但是一个比较简单的实现方式是在`route path`的末尾加上一个`*`.

在下面的例子中,当请求路径前缀为`/some/path/`的时候,我们设置的`handler`都会被执行. (例如`/some/path/foo.html`和`/some/path/otherdir/blah.css`都是匹配的)

```java
Route route = router.route().path("/some/path/*");

route.handler(routingContext -> {
  // This handler will be called for any path that starts with
  // `/some/path/`, e.g.

  // `/some/path`
  // `/some/path/`
  // `/some/path/subdir`
  // `/some/path/subdir/blah.html`
  //
  // but not:
  // `/some/bath`
});
```
你还可以将路径参数放在`route()`方法里
```java
Route route = router.route("/some/path/*");

route.handler(routingContext -> {
  // This handler will be called same as previous example
});
```

# Capturing path parameters

我们可以在请求参数上使用通配符进行匹配路径

```java
Route route = router.route(HttpMethod.POST, "/catalogue/products/:productype/:productid/");

route.handler(routingContext -> {

  String productType = routingContext.request().getParam("producttype");
  String productID = routingContext.request().getParam("productid");

  // Do something with them...
});
```

通配符由`:`组成,将其放在参数名后面. 参数名由字母和数字下划线组成.

在上面的例子中,如果一个`POST`请求地址是`/catalogue/products/tools/drill123/`, 那么上面的`route`会被匹配到, `productType`接收到`tools`值, `productID`会接收到`drill123`值.


# Capturing path parameters with regular expressions

当使用正则表达式的时候,你还可以捕获路径参数：

```java
Route route = router.routeWithRegex(".*foo");

// This regular expression matches paths that start with something like:
// "/foo/bar" - where the "foo" is captured into param0 and the "bar" is captured into
// param1
route.pathRegex("\\/([^\\/]+)\\/([^\\/]+)").handler(routingContext -> {

  String productType = routingContext.request().getParam("param0");
  String productID = routingContext.request().getParam("param1");

  // Do something with them...
});
```
在上面的例子中,如果请求路径是`/tools/drill123/`, 那么我们设置的`route`会被匹配到, 然后`productType`会接收到参数值`tools`, `productID`会接收到参数值`drill123`.


Captures are denoted in regular expressions with capture groups (i.e. surrounding the capture with round brackets)

# Routing with regular expressions

正则还可以被使用在`URI`路径的匹配上：
```java
Route route = router.route().pathRegex(".*foo");

route.handler(routingContext -> {

  // This handler will be called for:

  // /some/path/foo
  // /foo
  // /foo/bar/wibble/foo
  // /foo/bar

  // But not:
  // /bar/wibble
});
```
还有一种做法是,正则可以在创建`route`时进行指定.
```java
Route route = router.routeWithRegex(".*foo");

route.handler(routingContext -> {

  // This handler will be called same as previous example

});
```

# Routing by HTTP method

在默认的情况下`route`会匹配所有的`HTTP methods`.

如果你想要某个`route`只匹配特定的`HTTP method`,你可以像下面这样做：
```java
Route route = router.route().method(HttpMethod.POST);

route.handler(routingContext -> {

  // This handler will be called for any POST request

});
```
或者你在创建`route`时直接指定：
```
Route route = router.route(HttpMethod.POST, "/some/path/");

route.handler(routingContext -> {

  // This handler will be called for any POST request to a URI path starting with /some/path/

});
```
当然还有其他方式可用,你可以直接调用`get()`, `post`, `put`等方法调用
```
router.get().handler(routingContext -> {

  // Will be called for any GET request

});

router.get("/some/path/").handler(routingContext -> {

  // Will be called for any GET request to a path
  // starting with /some/path

});

router.getWithRegex(".*foo").handler(routingContext -> {

  // Will be called for any GET request to a path
  // ending with `foo`

});
```
如果你想要对某个`route`指定多个`HTTP method`,你可以像下面这样做：
```
Route route = router.route().method(HttpMethod.POST).method(HttpMethod.PUT);

route.handler(routingContext -> {

  // This handler will be called for any POST or PUT request

});
```

# Route order

在默认情况下`routes`的排序是按照添加添加进`router`的顺序进行排序的.

当`router`接受到一个请求时, `router`会遍历自身的每一个`route`查看是否与请求匹配,如果匹配的话,该route的`handler`就会被调用.

如果`handler`随后调用了下一个`handler`, 那么下一个与之匹配的`route`也会被调用.
```java
Route route1 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  // enable chunked responses because we will be adding data as
  // we execute over other handlers. This is only required once and
  // only if several handlers do output.
  response.setChunked(true);

  response.write("route1\n");

  // Now call the next matching route
  routingContext.next();
});

Route route2 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  response.write("route2\n");

  // Now call the next matching route
  routingContext.next();
});

Route route3 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  response.write("route3");

  // Now end the response
  routingContext.response().end();
});
```
在上面的例子中，输出结果为：
```
route1
route2
route3
```

`/some/path`开头的请求都是按照刚才的那个顺序进行`route`调用的.

如果你想要改变`route`的调用顺序,你可以使用`order()`方法,向其指定一个指定值.

`Routes`在`router`中的位置是按照他们添加进去的时间顺序进行排序的, 而且他们的位置是从0开始的.

当然像上文所说的,你还可以调用`order()`方法改变这个排序. 需要注意的是序号可以是负数, 例如你想要某个`route`在序号0的`route`之前执行,你就可以将某个`route`序号指定为-1.

下例中我们改变了`route2`的序号,确保他在`route1`之前执行.
```java
Route route1 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  response.write("route1\n");

  // Now call the next matching route
  routingContext.next();
});

Route route2 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  // enable chunked responses because we will be adding data as
  // we execute over other handlers. This is only required once and
  // only if several handlers do output.
  response.setChunked(true);

  response.write("route2\n");

  // Now call the next matching route
  routingContext.next();
});

Route route3 = router.route("/some/path/").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  response.write("route3");

  // Now end the response
  routingContext.response().end();
});

// Change the order of route2 so it runs before route1
route2.order(-1);
```
接下来我们就看到了我们所期望的结果
```
route2
route1
route3
```

如果俩个`route`有相同的序号,那么他们会按照添加的顺序进行执行. 你还可以通过调用`last()`方法将某个`route`放到最后一个.

# Routing based on MIME type of request

你可以通过`consumes`方法指定`route`需要匹配请求的`MIME`类型.

这下面的例子中, 请求包含了一个`content-type`请求头,该值指定了请求体的`MINE`类型. 这个值会和`consumes`方法里的值进行匹配.

`MINE`类型的匹配可以做到精确匹配.
```
router.route().consumes("text/html").handler(routingContext -> {

  // This handler will be called for any request with
  // content-type header set to `text/html`

});
```
同样我们还可以进行多个`MINE`类型的匹配
```
router.route().consumes("text/html").consumes("text/plain").handler(routingContext -> {

  // This handler will be called for any request with
  // content-type header set to `text/html` or `text/plain`.

});
```
我们还可以通过通配符对子类型进行匹配
```
router.route().consumes("text/*").handler(routingContext -> {

  // This handler will be called for any request with top level type `text`
  // e.g. content-type header set to `text/html` or `text/plain` will both match

});
```
我们还可以通过通配符对父类型进行匹配
```
router.route().consumes("*/json").handler(routingContext -> {

  // This handler will be called for any request with sub-type json
  // e.g. content-type header set to `text/json` or `application/json` will both match

});
```

如果你在`consumers`不指定`/`, 它会假定你指的是子类型.


# Routing based on MIME types acceptable by the client

` HTTP accept header`常常用于表示客户端接收到的服务器响应的`MIME`类型.

`accept header`可以带有多个`MIME`类型,他们之间通过`','`分割.

`MIME`类型还可以有一个`q`值, 
MIME types can also have a q value appended to them* which signifies a weighting to apply if more than one response MIME type is available matching the accept header. The q value is a number between 0 and 1.0. If omitted it defaults to 1.0.

例如,下面的`accept header`表示只会接受`text/plain`的`MIME`类型.
```
Accept: text/plain
```
下面的`accept header`会接受`text/plain`和`text/html`的`MIME`类型,这俩者直接并没有优先级.
```
Accept: text/plain, text/html
```
但是下面的客户端会会接受`text/plain`和`text/html`的`MIME`类型,但是`text/html`的优先级高于`text/plain`, 因为`text/html`有一个更高的`q`值. (默认情况下`q=1`)
```
Accept: text/plain; q=0.9, text/html
```
如果服务器能够同时提供`text/plain`和`text/html`, 那么在这个例子中,他就应该提供`text/html`.

通过使用`produces`方法设置了`route`产生的`MIME`类型, 例如下面的`handler`设置了一个`MIME`类型为`application/json`的响应
```
router.route().produces("application/json").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();
  response.putHeader("content-type", "application/json");
  response.write(someJSON).end();

});
```
在这个例子中,`route`会匹配到所有的` accept header`为`application/json`的请求.

下面是该`accept headers`的匹配值:
```
Accept: application/json
Accept: application/*
Accept: application/json, text/html
Accept: application/json;q=0.7, text/html;q=0.8, text/plain
```

你还可以设置你的`route`produce多个`MIME`类型. 在这种情况中, 你可以使用`getAcceptableContentType()`方法找到实际接受到的`MIME`类型
```
router.route().produces("application/json").produces("text/html").handler(routingContext -> {

  HttpServerResponse response = routingContext.response();

  // Get the actual MIME type acceptable
  String acceptableContentType = routingContext.getAcceptableContentType();

  response.putHeader("content-type", acceptableContentType);
  response.write(whatever).end();
});
```
在上面的例子中，如果你发送下面的`accept header`
```java
Accept: application/json; q=0.7, text/html
```
Then the route would match and acceptableContentType would contain text/html as both are acceptable but that has a higher q value.


# Combining routing criteria

你可以将很多`route`规则组合到一起, 例如：

```java
Route route = router.route(HttpMethod.PUT, "myapi/orders")
                    .consumes("application/json")
                    .produces("application/json");

route.handler(routingContext -> {

  // This would be match for any PUT method to paths starting with "myapi/orders" with a
  // content-type of "application/json"
  // and an accept header matching "application/json"

});
```

# Enabling and disabling routes

你可以通过调用`disable()`方法手动的关闭某个`route`, 被关闭的`route`会忽略所有的匹配.

你还可以通过调用`enable`重新打开被关闭的`route`


# Context data

在一个请求的生命周期之内, 你可以将想要在`handler`之间共享的数据放在`RoutingContext`中进行传递.

下面的例子中,使用`put`添加数据, 使用`get`检索数据.

```java
router.get("/some/path").handler(routingContext -> {

  routingContext.put("foo", "bar");
  routingContext.next();

});

router.get("/some/path/other").handler(routingContext -> {

  String bar = routingContext.get("foo");
  // Do something with bar
  routingContext.response().end();

});
```

# Sub-routers

有时候你也许会有很多`handler`来处理请求, 在这种情况下将这些`handler`分配到多个`route`中是非常有好处的. 另外如果你想在不同的应用程序中通过不同的`root`路径来复用这些`handler`, 这种做法同样是很有帮助的.

为了能达到这种效果, 你可以

Sometimes if you have a lot of handlers it can make sense to split them up into multiple routers. This is also useful if you want to reuse a set of handlers in a different application, rooted at a different path root.

To do this you can mount a router at a mount point in another router. The router that is mounted is called a sub-router. Sub routers can mount other sub routers so you can have several levels of sub-routers if you like.

Let’s look at a simple example of a sub-router mounted with another router.

This sub-router will maintain the set of handlers that corresponds to a simple fictional REST API. We will mount that on another router. The full implementation of the REST API is not shown.

Here’s the sub-router:
```java
Router restAPI = Router.router(vertx);

restAPI.get("/products/:productID").handler(rc -> {

  // TODO Handle the lookup of the product....
  rc.response().write(productJSON);

});

restAPI.put("/products/:productID").handler(rc -> {

  // TODO Add a new product...
  rc.response().end();

});

restAPI.delete("/products/:productID").handler(rc -> {

  // TODO delete the product...
  rc.response().end();

});
```
If this router was used as a top level router, then GET/PUT/DELETE requests to urls like /products/product1234 would invoke the API.

However, let’s say we already have a web-site as described by another router:
```java
Router mainRouter = Router.router(vertx);

// Handle static resources
mainRouter.route("/static/*").handler(myStaticHandler);

mainRouter.route(".*\\.templ").handler(myTemplateHandler);
```
We can now mount the sub router on the main router, against a mount point, in this case /productsAPI

mainRouter.mountSubRouter("/productsAPI", restAPI);
This means the REST API is now accessible via paths like: /productsAPI/products/product1234


# Default 404 Handling

如果没有`route`匹配到客户端的请求,那么`Vert.x-Web`会发送一个404的信号错误.

你可以自行手动设置`error handler`, 或者选择我们提供的`error handler`, 如果没有设置`error handler`，`Vert.x-Web`会返回一个基本的404回应


# Error handling

我们可以设置`handler`来处理请求,同样我们还可以设置`handler`处理`route`中的失败情况.

`Failure handlers` 通常是和处理普通`handler`的`route`一起工作.

例如,你可以提供一个`failure handler`只是用来处理某种特定路径下的或者某种特定`HTTP method`的失败.

这种机制就为你向应用程序的不同部分设置不同的`failure handler`了.

下面的例子演示了我们向`/somepath/`开始的路径和`GET`请求才会被调用的`failure handler`.
```java
Route route = router.get("/somepath/*");

route.failureHandler(frc -> {

  // This will be called for failures that occur
  // when routing requests to paths starting with
  // '/somepath/'

});
```
如果`handler`中抛出异常`Failure routing`就会发生作用, 或者`handler`调用失败,向客户端发送一个失败的`HTTP`状态码信号.

如果我们从`handler`中捕获一个异常, 我们将会向客户端返回`500`的状态码.

在处理失败的时候, `failure handler`会被传递给`routing context`, 我们可以在该`context`中检索出当前的错误, 因此`failure handler`可以用于生成`failure response`。

```java
Route route1 = router.get("/somepath/path1/");

route1.handler(routingContext -> {

  // Let's say this throws a RuntimeException
  throw new RuntimeException("something happened!");

});

Route route2 = router.get("/somepath/path2");

route2.handler(routingContext -> {

  // This one deliberately fails the request passing in the status code
  // E.g. 403 - Forbidden
  routingContext.fail(403);

});

// Define a failure handler
// This will get called for any failures in the above handlers
Route route3 = router.get("/somepath/*");

route3.failureHandler(failureRoutingContext -> {

  int statusCode = failureRoutingContext.statusCode();

  // Status code will be 500 for the RuntimeException or 403 for the other failure
  HttpServerResponse response = failureRoutingContext.response();
  response.setStatusCode(statusCode).end("Sorry! Not today");

});
```

# Request body handling
The BodyHandler allows you to retrieve request bodies, limit body sizes and handle file uploads.

You should make sure a body handler is on a matching route for any requests that require this functionality.
```java
router.route().handler(BodyHandler.create());
```

### Getting the request body
If you know the request body is JSON, then you can use getBodyAsJson, if you know it’s a string you can use getBodyAsString, or to retrieve it as a buffer use getBody.

Limiting body size
To limit the size of a request body, create the body handler then use setBodyLimit to specifying the maximum body size, in bytes. This is useful to avoid running out of memory with very large bodies.

If an attempt to send a body greater than the maximum size is made, an HTTP status code of 413 - Request Entity Too Large, will be sent.

There is no body limit by default.

### Merging form attributes
By default, the body handler will merge any form attributes into the request parameters. If you don’t want this behaviour you can use disable it with setMergeFormAttributes.

### Handling file uploads
Body handler is also used to handle multi-part file uploads.

If a body handler is on a matching route for the request, any file uploads will be automatically streamed to the uploads directory, which is file-uploads by default.

Each file will be given an automatically generated file name, and the file uploads will be available on the routing context with fileUploads.

Here’s an example:
```java
router.route().handler(BodyHandler.create());

router.post("/some/path/uploads").handler(routingContext -> {

  Set<FileUpload> uploads = routingContext.fileUploads();
  // Do something with uploads....

});
```
Each file upload is described by a FileUpload instance, which allows various properties such as the name, file-name and size to be accessed.



# Handling cookies

`Vert.x-Web`使用`CookieHandler`来支持`cookies`.

你必须确保当请求需要`cookies`支持的时候,你已经设置上了`cookie handler`。

```java
router.route().handler(CookieHandler.create());
```

### Manipulating cookies
你可以向`getCookie()`方法, 或者通过`cookies()`方法检索出`cookie`集合.

* `getCookie()`, 传递一个`cookie name`的参数来检索出一个`cookie`
* `cookies()`, 检索出`cookie`集合
* `removeCookie`, 删除一个`cookie`
* `addCookie`, 添加一个`cookie`

当`response headers`被写回的时候, `cookies`集合会自动的被写入到`response`中.

`Cookies`是通过`Cookie`实例进行描述的. 你可以通过该实例检索出`cookie`中的`name`, `value`, `domain`, `path` 或者其他的`cookie`属性.

下面的例子演示了如何检索和添加`cookie`
```java
router.route().handler(CookieHandler.create());

router.route("some/path/").handler(routingContext -> {

  Cookie someCookie = routingContext.getCookie("mycookie");
  String cookieValue = someCookie.getValue();

  // Do something with cookie...

  // Add a cookie - this will get written back in the response automatically
  routingContext.addCookie(Cookie.cookie("othercookie", "somevalue"));
});
```


# Handling sessions

`Vert.x-Web` 同样提供了对于`session`的支持.


Sessions last between HTTP requests for the length of a browser session and give you a place where you can add session-scope information, such as a shopping basket.

Vert.x-Web uses session cookies to identify a session. The session cookie is temporary and will be deleted by your browser when it’s closed.

We don’t put the actual data of your session in the session cookie - the cookie simply uses an identifier to look-up the actual session on the server. The identifier is a random UUID generated using a secure random, so it should be effectively unguessable.

Cookies are passed across the wire in HTTP requests and responses so it’s always wise to make sure you are using HTTPS when sessions are being used. Vert.x will warn you if you attempt to use sessions over straight HTTP.

To enable sessions in your application you must have a SessionHandler on a matching route before your application logic.

The session handler handles the creation of session cookies and the lookup of the session so you don’t have to do that yourself.

## Session stores
To create a session handler you need to have a session store instance. The session store is the object that holds the actual sessions for your application.

Vert.x-Web comes with two session store implementations out of the box, and you can also write your own if you prefer.

#### Local session store

With this store, sessions are stored locally in memory and only available in this instance.

This store is appropriate if you have just a single Vert.x instance of you are using sticky sessions in your application and have configured your load balancer to always route HTTP requests to the same Vert.x instance.

If you can’t ensure your requests will all terminate on the same server then don’t use this store as your requests might end up on a server which doesn’t know about your session.

Local session stores are implemented by using a shared local map, and have a reaper which clears out expired sessions.

The reaper interval can be configured with LocalSessionStore.create.

Here are some examples of creating a LocalSessionStore

SessionStore store1 = LocalSessionStore.create(vertx);

// Create a local session store specifying the local shared map name to use
// This might be useful if you have more than one application in the same
// Vert.x instance and want to use different maps for different applications
SessionStore store2 = LocalSessionStore.create(vertx, "myapp3.sessionmap");

// Create a local session store specifying the local shared map name to use and
// setting the reaper interval for expired sessions to 10 seconds
SessionStore store3 = LocalSessionStore.create(vertx, "myapp3.sessionmap", 10000);

#### Clustered session store

With this store, sessions are stored in a distributed map which is accessible across the Vert.x cluster.

This store is appropriate if you’re not using sticky sessions, i.e. your load balancer is distributing different requests from the same browser to different servers.

Your session is accessible from any node in the cluster using this store.

To you use a clustered session store you should make sure your Vert.x instance is clustered.

Here are some examples of creating a ClusteredSessionStore

Vertx.clusteredVertx(new VertxOptions().setClustered(true), res -> {

  Vertx vertx = res.result();

  // Create a clustered session store using defaults
  SessionStore store1 = ClusteredSessionStore.create(vertx);

  // Create a clustered session store specifying the distributed map name to use
  // This might be useful if you have more than one application in the cluster
  // and want to use different maps for different applications
  SessionStore store2 = ClusteredSessionStore.create(vertx, "myclusteredapp3.sessionmap");
});
## Creating the session handler
Once you’ve created a session store you can create a session handler, and add it to a route. You should make sure your session handler is routed to before your application handlers.

You’ll also need to include a CookieHandler as the session handler uses cookies to lookup the session. The cookie handler should be before the session handler when routing.

Here’s an example:

Router router = Router.router(vertx);

// We need a cookie handler first
router.route().handler(CookieHandler.create());

// Create a clustered session store using defaults
SessionStore store = ClusteredSessionStore.create(vertx);

SessionHandler sessionHandler = SessionHandler.create(store);

// Make sure all requests are routed through the session handler too
router.route().handler(sessionHandler);

// Now your application handlers
router.route("/somepath/blah/").handler(routingContext -> {

  Session session = routingContext.session();
  session.put("foo", "bar");
  // etc

});
The session handler will ensure that your session is automatically looked up (or created if no session exists) from the session store and set on the routing context before it gets to your application handlers.

## Using the session
In your handlers you an access the session instance with session.

You put data into the session with put, you get data from the session with get, and you remove data from the session with remove.

The keys for items in the session are always strings. The values can be any type for a local session store, and for a clustered session store they can be any basic type, or Buffer, JsonObject, JsonArray or a serializable object, as the values have to serialized across the cluster.

Here’s an example of manipulating session data:

router.route().handler(CookieHandler.create());
router.route().handler(sessionHandler);

// Now your application handlers
router.route("/somepath/blah").handler(routingContext -> {

  Session session = routingContext.session();

  // Put some data from the session
  session.put("foo", "bar");

  // Retrieve some data from a session
  int age = session.get("age");

  // Remove some data from a session
  JsonObject obj = session.remove("myobj");

});
Sessions are automatically written back to the store after after responses are complete.

You can manually destroy a session using destroy. This will remove the session from the context and the session store. Note that if there is no session a new one will be automatically created for the next request from the browser that’s routed through the session handler.

## Session timeout
Sessions will be automatically timed out if they are not accessed for a time greater than the timeout period. When a session is timed out, it is removed from the store.

Sessions are automatically marked as accessed when a request arrives and the session is looked up and and when the response is complete and the session is stored back in the store.

You can also use setAccessed to manually mark a session as accessed.

The session timeout can be configured when creating the session handler. Default timeout is 30 minutes.



# Authentication


# Serving static resources


# CORS handling

`Cross Origin Resource Sharing`是一个安全的资源请求途径(AJAX跨域问题的解决方案)

`Vert.x-Web`包含了一个`CorsHandler`, 用于处理`CORS`协议. 例如

```java
router.route().handler(CorsHandler.create("vertx\\.io").allowedMethod(HttpMethod.GET));

router.route().handler(routingContext -> {

  // Your app handlers

});
```
TODO more CORS docs


# Templates


# Error handler

你可以自己提供一个`ErrorHandler`用于处理`error`异常,否则的话`Vert.x-Web`会包含一个包装好的`pretty error handler`用于响应错误页面.

如果你自己想要设置一个`ErrorHandler`, 那么你只需要将其设置成`failure handler`就可以了.


# Request logger

`Vert.x-Web`内嵌了`LoggerHandler`,使用它你可以将`HTTP requests`通过日志形式记录下来.

默认情况下,请求是`Vert.x logger`进行记录的,我们可以将其配置成`JUL logging, log4j or SLF4J`


# Serving favicons

`Vert.x-Web`包含一个`FaviconHandler`来响应`favicons`.

`Favicons`可以被指定为文件系统里的一个路径,或者`Vert.x-Web`会默认的在`classpath`搜索名为`favicon.ico`的文件.这意味着你需要在你的应用程序的jar包绑定该`favicon`


# Timeout handler

`Vert.x-Web`包含一个超时`handler`,你可以使用它应付某些操作执行时间太长的请求.

我们通过一个`TimeoutHandler`实例来配置它.

如果一个请求在写回之前超时了，那么4.8响应将会写回个给客户端.

下面的例子使用了一个超时`handler`:
```java
router.route("/foo/").handler(TimeoutHandler.create(5000));
```

# Response time handler

这个`handler`设置了`x-response-time`响应头, 该响应头包含了请求从接受到响应所耗费的时间,单位是`ms`:
```
x-response-time: 1456ms
```


# SockJS

# SockJS event bus bridge