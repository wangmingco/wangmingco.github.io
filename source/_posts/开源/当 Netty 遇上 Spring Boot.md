---
category: 开源
date: 2019-12-09
title: 当 Netty 遇上 Spring Boot
---

> [当 Netty 遇上 Spring Boot](https://zhuanlan.zhihu.com/p/96378920) 本文是最基于项目开始时写的，后期代码重构过几次，但是思路是一致的

当Netty遇上Spring Boot会发生什么呢? 当然是 [netty-spring-boot-starter](https://github.com/wangmingco/netty-spring-boot-starter) 啦

周末有些闲暇时间, 便想将Netty与Spring Boot整合到一起, 看到了各种starter, 那干脆整一个 netty-spring-boot-starter 吧.
netty-spring-boot-starter

{% dplayer 'url=https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/videos/nsb.mp4' "api=https://api.prprpr.me/dplayer/" "theme=#FADFA3" "autoplay=false" %} 

第一版要实现如下功能

1. 通过`@SpringBootApplication` 注解启动服务后, Netty服务能够启动起来
2. 能够识别到类似于`GetMapping`注解的自定义消息处理注解`CommandController`和`CommandMapping`
3. Netty收到消息后能够转发到Spring上下文中进行方法调用

嗯, 就是这些....

根据王总的说法, 我们的小目标建立好了, 接下来咋整呢?

首先呢, 当然是从网上找个教程啦, 看看starter是咋弄的, google一下找到第一篇文章, 运用Ctrl C/Ctrl V大法, 欧了, 服务起来了, 当然还是得看看大象装冰箱, 总共分几步

#### 1. 添加依赖

```xml
              <dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-autoconfigure</artifactId>
			<version>${spring.boot.version}</version>
		</dependency>

		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-configuration-processor</artifactId>
			<version>${spring.boot.version}</version>
			<optional>true</optional>
		</dependency>

		<dependency>
			<groupId>io.netty</groupId>
			<artifactId>netty-all</artifactId>
			<version>${netty.version}</version>
		</dependency>
```
 

#### 2. 写一下配置类, 用于自定义`application.properties`里的参数

```java
@ConfigurationProperties(prefix = "spring.boot.netty")
@Data
public class SpringBootNettyProperties {

    private Integer PORT = null;
}
```

#### 3. 再把配置类整上, 在这里启动Netty服务器

```java
@Configuration
@EnableConfigurationProperties(SpringBootNettyProperties.class)
@Slf4j
public class SpringBootNettyConfiguration {

    @Autowired
    private SpringBootNettyProperties springBootNettyProperties;

    @Bean
    @ConditionalOnMissingBean(NettyStarter.class)
    public NettyStarter nettyStarter() {
        return new NettyStarter();
    }

    @Component
    public static class NettyStarter implements InitializingBean, DisposableBean {
        @Resource
        private SpringBootNettyProperties springBootNettyProperties;
        private NettyServer nettyServer;

        @Override
        public void afterPropertiesSet() throws Exception {
            NettyServer nettyServer = NettyServer.builder().build();
            nettyServer.start();
            this.nettyServer = nettyServer;
        }

        @Override
        public void destroy() throws Exception {
            nettyServer.stop();
        }
   }
}
```

这里我写了一个内部类NettyStarter, 作为Netty服务启动的入口. 并且把它注册为一个Bean, 因为在客户端程序中, 可能是扫描不到我这个包的, 所以在配置类中, 直接把它注册到容器里.

#### 4. 实现自定义注解扫描

我自己写了俩个注解

* `CommandController` 类似于`RestController`, 注解在类上, 表示这个类是用来处理Netty消息的
* `CommandMapping` 类似于`GetMapping`, 注解在方法上, 表示这个方法是用来接收Netty消息的

然后实现Spring为我们提供的`ResourceLoaderAware`, `ImportBeanDefinitionRegistrar`接口

```java
public class CommandScannerRegistrar implements ResourceLoaderAware, ImportBeanDefinitionRegistrar {
    private ResourceLoader resourceLoader;

    @Override
    public void registerBeanDefinitions(AnnotationMetadata annotationMetadata, BeanDefinitionRegistry beanDefinitionRegistry) {
       String[] basePackages = annoAttrs.getStringArray("basePackage");
        //自定义的包扫描器
        CommandClassPathScanner commandClassPathScanner = new CommandClassPathScanner(beanDefinitionRegistry, false);
        //扫描指定路径下的接口
        Set<BeanDefinitionHolder> beanDefinitionHolders = commandClassPathScanner.doScan(basePackages);
        registerCommandMapping(beanDefinitionRegistry, beanDefinitionHolders);
    }

    private void registerCommandMapping(BeanDefinitionRegistry beanDefinitionRegistry, Set<BeanDefinitionHolder> beanDefinitionHolders) {
        for (BeanDefinitionHolder beanDefinitionHolder : beanDefinitionHolders) {
            String beanClassName = beanDefinitionHolder.getBeanDefinition().getBeanClassName();

            Class beanClass = Class.forName(beanClassName);
            for (Method method : beanClass.getMethods()) {
                CommandMapping commandMappingAnnotation = method.getAnnotation(CommandMapping.class);
                List<ParameterInfo> parameterInfoList = handleParameter(method);

                MethodInfo methodInfo = MethodInfo.builder()
                        .parameterInfoList(parameterInfoList)
                        .targetMethod(method)
                        .targetBeanClass(beanClass)
                        .build();

                CommandMethodCache.add(String.valueOf(commandMappingAnnotation.id()), methodInfo);
            }
        }
    }

    private List<ParameterInfo> handleParameter(Method method) {
        List<ParameterInfo> parameterInfoList = new ArrayList<>();
        for (Class parameterType : method.getParameterTypes()) {
            ParameterInfo.ParameterInfoBuilder parameterInfoBuilder = ParameterInfo.builder();
            if (GeneratedMessageV3.class.isAssignableFrom(parameterType)) {
                setParser(parameterInfoBuilder, parameterType);
            }
            parameterInfoList.add(parameterInfoBuilder.build());
        }
        return parameterInfoList;
    }

    private void setParser(ParameterInfo.ParameterInfoBuilder builder, Class<?> parameterType) {
        Field parserField = parameterType.getDeclaredField("PARSER");
        parserField.setAccessible(true);
        Parser parser = (Parser) parserField.get(parameterType);
        builder.parser(parser);
    }
}
```

这段代码是一段比较核心的代码, 而且也比较长, 我一点一点来说.

`ImportBeanDefinitionRegistrar` 这个接口是用来做动态注册bean的, 我在`registerBeanDefinitions` 方法中实现对自定义注解的扫描, 然后注册到`beanDefinitionRegistry`里.

对于自定义注解扫描的话, 我继承了`ClassPathBeanDefinitionScanner`类, 写了一个扫描器, 很简单, 可以直接看我项目里的源码.

写到这里的时候, 第一个难点出现了, Spring只扫描到了类也就是`CommandController`, 而没有扫描到`CommandMapping`, 当时有些心烦意乱就没有去看spring里对于`GetMapping`等注解的处理, 就直接用反射的方式简单处理了一下, 这点后期可以优化成利用动态代理或者ASM等框架实现, 提高一下性能.

这里的思路是我把`CommandController`类里的每个方法都遍历一遍, 如果有`CommandMapping`注解我就缓存起来, 然后看`CommandMapping`的方法里是否有Protobuf类, 如果有的话, 我就获取到它的Parser, 也缓存起来, 等到解析消息时候用.

到这里Spring Boot的处理基本上就完了, 接下来看看Netty里是咋实现的

#### 5. Netty相关

首先是启动Netty服务的代码, 很简单
```java
public class NettyServer {

    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;

    public void start() {

        log.info("Netty Server starting...");

        try {
            EventLoopGroup bossGroup = new NioEventLoopGroup(1);
            EventLoopGroup workerGroup = new NioEventLoopGroup();
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.DEBUG))
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        public void initChannel(SocketChannel ch) {
                            ChannelPipeline p = ch.pipeline();
                            p.addLast(new NettyServerHandler());
                        }
                    });

            int port = 8081;
            if (NettyConfig.getPORT() != null) {
                port = NettyConfig.getPORT().getValue();
            }

            b.bind("localhost", port).sync();

            log.info("Netty Server listening at:{}", port);

            this.bossGroup = bossGroup;
            this.workerGroup = workerGroup;

        } catch (InterruptedException e) {
            log.error("", e);
            stop();
        }
    }

    public void stop() {
        bossGroup.shutdownGracefully();
        workerGroup.shutdownGracefully();
    }
}
```

这里省略了使用`application.properties`配置Netty的部分, 有兴趣可以去看看源码. 而且目前也只是抽象出来`ChannelOption`部分, 后期还可以添加其他的配置参数.

服务启动起来了就要看看消息是如何收发的
```java
public class NettyServerHandler extends ByteToMessageDecoder {

    private static final int MIN_PACKAGE_SIZE = 8;

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List out) throws Exception {

        if (in.readableBytes() < MIN_PACKAGE_SIZE) {
            return;
        }

        in.markReaderIndex();
        int messageSize = in.readByte();
        int type = in.readByte();
        int readableBytes = in.readableBytes();
        if (readableBytes < messageSize) {
            in.resetReaderIndex();
            return;
        }

        MessageType messageType = MessageType.get(type);
        ByteBuf messageByteBuf = in.readBytes(messageSize);
        byte[] messageBytes = new byte[messageSize];
        messageByteBuf.getBytes(0, messageBytes);
        CommandDispatcher.dispatch(ctx, messageType, messageBytes);
    }
}
```

整个思路也很简单就看当前可读byte是否够, 够的话就读取, 不够就返回, 等待byte攒够了再处理.

读取完message后就调用CommandDispatcher进行消息派发.

```
public class CommandDispatcher {

    public static void dispatch(ChannelHandlerContext ctx, MessageType messageType, byte[] messageBytes) {
        MethodInfo methodInfo = CommandMethodCache.getMethodInfo(String.valueOf(messageType.getType()));

        List<ParameterInfo> parameterInfoList = methodInfo.getParameterInfoList();
        Class targetBeanClass = methodInfo.getTargetBeanClass();
        Method targetMethod = methodInfo.getTargetMethod();

        // 生成调用方法参数
        List paramters = getParameters(ctx, messageType, messageBytes, parameterInfoList);
        // 调用方法
        Object result = invoke(targetBeanClass, targetMethod, paramters);
        // 调用方法后可能产生应答, 将应答返回给前端
        response(ctx, messageType, result);
    }

    private static List getParameters(ChannelHandlerContext ctx, MessageType messageType, byte[] messageBytes, List<ParameterInfo> parameterInfoList) {
        List paramters = new ArrayList();
        for (ParameterInfo parameterInfo : parameterInfoList) {
            switch (messageType) {
                case PROTOBUF: {
                    if (parameterInfo.getParser() != null) {
                        addProtobugParam(messageBytes, paramters, parameterInfo);
                    }
                    break;
                }
                default:
                    throw new IllegalStateException("Unexpected value: " + messageType);
            }
        }
        return paramters;
    }

    private static void addProtobugParam(byte[] messageBytes, List paramters, ParameterInfo parameterInfo) {
        Parser parser = parameterInfo.getParser();
        paramters.add(parser.parseFrom(messageBytes));
    }
    
    private static Object invoke(Class targetBeanClass, Method targetMethod, List paramters) {
        Object result = null;
        Object methodBean = SpringContext.getBean(targetBeanClass);
        if (paramters.size() > 0) {
            Object[] params = paramters.toArray();
            result = targetMethod.invoke(methodBean, params);
        } else {
            result = targetMethod.invoke(methodBean);
        }
        return result;
    }
    
    private static void response(ChannelHandlerContext ctx, MessageType messageType, Object result) {

        if (GeneratedMessageV3.class.isAssignableFrom(result.getClass())) {
            GeneratedMessageV3 generatedMessage = (GeneratedMessageV3) result;
            byte[] bytearray = generatedMessage.toByteArray();
            ByteBuf response = ByteBufAllocator.DEFAULT.heapBuffer(bytearray.length)
                    .writeByte(bytearray.length)
                    .writeByte(MessageType.PROTOBUF.getType())
                    .writeBytes(bytearray);
            ctx.writeAndFlush(response);
        }
    }
}
```

又是一段比较核心的代码, 而且也比较长, 但是思路也是比较简单的----

1. 根据消息号拿到我们是上一步缓存的方法和Paser, 进行参数生成. 
2. 拿到生成好的参数之后, 进行方法调用
3. 判断方法返回值是否需要回写到客户端, 目前是只有protobuf类型的返回值才会回写到客户端

嗯, 到这里基本上整个逻辑就写完了, 说起来比较简单, 但是在方法转发这一块还是费了点力气 不过还好, 总算是周末的时光没有白过, 整完了.

整个工程还有一些待优化的点, 比如对于UDP的支持, 后期有时间把这里整理一下..
编辑于 2022-02-18 14:57
Java 框架
Netty
Spring Boot
评论千万条，友善第一条

17 条评论
默认
时间
暗香浮动月黄昏
暗香浮动月黄昏

新手提问，请问您用springboot集成的这个netty，可以用来做什么，或者说可以实现什么功能呢
2021-03-23
· 作者回复了
代号One
代号One
作者
比如说在推送服务中心使用
02-11
金浩彬
金浩彬

大佬求教
2021-02-25
· 作者回复了
代号One
代号One
作者
?
2021-08-26
maodun
maodun

netty做成starter感觉不太实用。
2020-08-04
非鬼亦非仙
非鬼亦非仙

有一个疑问，这样整合Netty服务的性能，是否受制于springboot内置的容器Tomcat，如果受制，把Netty整合到springboot启动中，是不是本末倒置？
2020-03-07
· 作者回复了
代号One
代号One
作者
非鬼亦非仙

springframework核心是个对象容器, 提供IOC, DI等特性, 然后在这个基础之上扩展了AOP, Web, Jpa等其他特性.


用springboot举个例子, 比如我们有一个很简单的springboot项目, 当运行 SpringApplication.run(XXX.class) 的时候SpringApplication内部会调用createApplicationContext(), 创建出ConfigurableApplicationContext(具体类型是AnnotationConfigServletWebServerApplicationContext). 然后继续调用AbstractApplicationContext的refresh()方法进行spring容器的初始化, 在初始化过程中就会进行IOD, AOP, Web等等功能的实现.


在AbstractApplicationContext#refresh()中调用onRefresh()方法, ServletWebServerApplicationContext对这个方法重写了, 会调用 createWebServer() , 在这个方法中创建一个Tomcat服务器.
