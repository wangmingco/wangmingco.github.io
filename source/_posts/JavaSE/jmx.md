---
category: Java
title: JMX 笔记
date: 2018-11-14 14:13:00
---

参考[Java SE Monitoring and Management Guide](http://docs.oracle.com/javase/8/docs/technotes/guides/management/toc.html)

```
The Java virtual machine (JVM) has built-in instrumentation that enables you to monitor and manage it using JMX.  You can also monitor instrumented applications with JMX.
```
文档上开篇就有这么一句, Java1.5版本开始，JVM内部构建了instrumentation，我们可以通过使用JMX接口访问instrumentation从而监控和管理JVM。

下面这段开启JMX参数是从zabix jmx那篇文章中copy过来的
```
java \
-Djava.rmi.server.hostname=192.168.3.14 \
-Dcom.sun.management.jmxremote \
-Dcom.sun.management.jmxremote.port=12345 \
-Dcom.sun.management.jmxremote.authenticate=true \
-Dcom.sun.management.jmxremote.password.file=/etc/java-6-openjdk/management/jmxremote.password \
-Dcom.sun.management.jmxremote.access.file=/etc/java-6-openjdk/management/jmxremote.access \
-Dcom.sun.management.jmxremote.ssl=true \
-Djavax.net.ssl.keyStore=$YOUR_KEY_STORE \
-Djavax.net.ssl.keyStorePassword=$YOUR_KEY_STORE_PASSWORD \
-Djavax.net.ssl.trustStore=$YOUR_TRUST_STORE \
-Djavax.net.ssl.trustStorePassword=$YOUR_TRUST_STORE_PASSWORD \
-Dcom.sun.management.jmxremote.ssl.need.client.auth=true \
-jar /usr/share/doc/openjdk-6-jre-headless/demo/jfc/Notepad/Notepad.jar
```

JMX 有俩种启动方式
1. 本地启动 : -Dcom.sun.management.jmxremote, 这种启动只能在本地访问, 也就说只能在启动jmx这台机器上启动jmx客户端, 然后连接JMX服务器
2. 远程访问方式 : 这种模式就需要设置端口了 `-Dcom.sun.management.jmxremote.port=12345`, 另外如果有需要还可以设置 `-Djava.rmi.server.hostname=192.168.3.14`，但是需要注意的是这种设置在Linux上需要在/etc/hosts文件里添加相关hostname(例如192.168.3.14 localhostname, 这个localhostname 就是主机登陆账号)

`-Dcom.sun.management.jmxremote` 这个设置是用来注册  JVM instrumentation MBeans， 同时通过一个私有接口( private interface)发布一个 RMI connector(JMX客户端通过这个接口监控Java应用)

在1.5的文档中有这么一句话
```
Local monitoring with jconsole is useful for development and prototyping. Using jconsole locally is not recommended for production environments, because jconsole itself consumes significant system resources. Rather, use jconsole on a remote system to isolate it from the platform being monitored.
```
在生产环境并不推荐，在生产主机上使用jconsole, 那么是不是说, 在生产主机上可以开启JMX监控呢？这也一直是我最关心的问题！！！现在还没有找到有文档或者文章说开启jmx锁带来的性能消耗

对于编程的方式，这个文档只是给了一点简单的示例

```
JMXServiceURL jmxServiceURL = new JMXServiceURL("service:jmx:rmi:///jndi/rmi://192.168.15.184:29001/jmxrmi");
JMXConnector jmxConnector = JMXConnectorFactory.connect(jmxServiceURL);
```

开启密码验证和SSL的部分没有做说明，如果需要的话，就去开启一下好了，现在主要是探究jmx实现和给JVM带来的风险

在1.6版本中的Local Monitoring and Management，有这么一句

```
n the Java SE 6 platform, it is no longer necessary to set this system property. Any application that is started on the Java SE 6 platform will support the Attach API, and so will automatically be made available for local monitoring and management when needed.

For example, previously, to enable the JMX agent for the Java SE sample application Notepad, you would have to run the following commands.

% cd JDK_HOME/demo/jfc/Notepad
% java -Dcom.sun.management.jmxremote -jar Notepad.jar


In the above command, JDK_HOME is the directory in which the Java Development Kit (JDK) is installed. In the Java SE 6 platform, you would simply have to run the following command to start Notepad.

% java -jar Notepad.jar


Once Notepad has been started, a JMX client using the Attach API can then enable the out-of-the-box management agent to monitor and manage the Notepad application.
```

到了1.6的时候, 如果想要监控和管理应用的时候 ，不再需要显式地设置-Dcom.sun.management.jmxremote属性。因为1.6上开始支持Attach API，JMX客户端会通过Attach API进行监控和管理（Attach API就成了一个开箱即用的agent. 因为一直比较关心的是，开启JMX对性能的影响究竟有多大, 感觉是JVM一启动JMX内部组件就开启工作进行统计了, 而Attach API只是提供一个接口？？？）


##### Out-of-the-Box Monitoring and Management Properties
在这个标题下有一段很有趣的话


>> You can set out-of-the-box monitoring and management properties in a configuration file or on the command line. Properties specified on the command line override properties in a configuration file. The default location for the configuration file is JRE_HOME/lib/management/management.properties. The Java VM reads this file if either of the command-line properties com.sun.management.jmxremote or com.sun.management.jmxremote.port are set. Management via the Simple Network Management Protocol (SNMP) uses the same configuration file. For more information about SNMP monitoring, see Chapter 5, SNMP Monitoring and Management.


可以通过在命令行设定或者配置在配置文件里 进行设置开箱即用的监控和管理属性。如果同时在命令行上和配置文件里都设置了属性，那么命令行上面的设置会覆盖配置文件里的设置。默认的配置文件是这个文件`JRE_HOME/lib/management/management.properties`。如果命令行中没有设置`com.sun.management.jmxremote` 或者 `com.sun.management.jmxremote.port` 那么JVM就会读取默认的配置文件。
使用 `Simple Network Management Protocol (SNMP)` 进行管理的话也会使用这个配置文件。

##### Setting up Monitoring and Management Programmatically

这一节中，举了个例子，如何使用Attach API 获取RMI Connecter的连接地址

>> As stated previously, in the Java SE platform version 6, you can create a JMX client that uses the Attach API to enable out-of-the-box monitoring and management of any applications that are started on the Java SE 6 platform, without having to configure the applications for monitoring when you launch them. The Attach API provides a way for tools to attach to and start agents in the target application. Once an agent is running, JMX clients (and other tools) are able to obtain the JMX connector address for that agent via a property list that is maintained by the Java VM on behalf of the agents. The properties in the list are accessible from tools that use the Attach API. So, if an agent is started in an application, and if the agent creates a property to represent a piece of configuration information, then that configuration information is available to tools that attach to the application.

The JMX agent creates a property with the address of the local JMX connector server. This allows JMX tools to attach to and get the connector address of an agent, if it is running.

代码如下
```java
import com.sun.tools.attach.AgentInitializationException;
import com.sun.tools.attach.AgentLoadException;
import com.sun.tools.attach.AttachNotSupportedException;
import com.sun.tools.attach.VirtualMachine;

import javax.management.*;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;
import java.io.File;
import java.io.IOException;

public class TestJMX {

  private static final String CONNECTOR_ADDRESS = "com.sun.management.jmxremote.localConnectorAddress";

  public static void main(String[] args) throws Exception {
      String url = getURL();
      JMXServiceURL jmxServiceURL = new JMXServiceURL(url);
      JMXConnector jmxConnector = JMXConnectorFactory.connect(jmxServiceURL);
  }

  private static String getURL() throws IOException, AgentLoadException, AgentInitializationException, AttachNotSupportedException {
      // attach to the target application
      VirtualMachine vm = VirtualMachine.attach("101");

      // get the connector address
      String connectorAddress = vm.getAgentProperties().getProperty(CONNECTOR_ADDRESS);

      // no connector address, so we start the JMX agent
      if (connectorAddress == null) {
        String agent = vm.getSystemProperties().getProperty("java.home") + File.separator + "lib" + File.separator + "management-agent.jar";
        vm.loadAgent(agent);

        // agent is started, get the connector address
        connectorAddress = vm.getAgentProperties().getProperty(CONNECTOR_ADDRESS);
      }
      return connectorAddress;
  }
}
```

##### Mimicking Out-of-the-Box Management Using the JMX Remote API

这节中首先点出了在配置JMX监控服务的时候，在命令行中添加参数或者使用配置文件开启JMX的一些缺点

> However, in some cases greater levels of security are required and in other cases certain system configurations do not allow the use of a management.properties file. Such cases might involve exporting the RMI server's remote objects over a certain port to allow passage through a firewall, or exporting the RMI server's remote objects using a specific network interface in multi-homed systems. For such cases, the behavior of the out-of-the-box management agent can be mimicked by using the JMX Remote API directly to create, configure and deploy the management agent programmatically.

因此Hotspot提供了一个模拟开箱即用的管理agent的JMX agent的实现。教程里给出的例子是开启了密码验证,访问控制,以及使用SSL进行安全通信, 我简化了一下

```java
import javax.management.MBeanServer;
import javax.management.remote.JMXConnectorServer;
import javax.management.remote.JMXConnectorServerFactory;
import javax.management.remote.JMXServiceURL;
import java.lang.management.ManagementFactory;
import java.rmi.registry.LocateRegistry;
import java.util.HashMap;

public class JMXServer {

  public static void main(String[] args) throws Exception {
      // Ensure cryptographically strong random number generator used to choose the object number - see java.rmi.server.ObjID
      System.setProperty("java.rmi.server.randomIDs", "true");

      System.out.println("Create RMI registry on port 3000");
      LocateRegistry.createRegistry(3000);

      MBeanServer mbs = ManagementFactory.getPlatformMBeanServer();

      HashMap<String,Object> environment = new HashMap<>();

      System.out.println("Create an RMI connector server");
      JMXServiceURL url = new JMXServiceURL("service:jmx:rmi:///jndi/rmi://:3000/jmxrmi");
      JMXConnectorServer cs = JMXConnectorServerFactory.newJMXConnectorServer(url, environment, mbs);

      // Start the RMI connector server.
      System.out.println("Start the RMI connector server");
      cs.start();
  }
}
```
这么着开启之后,就能直接在客户端访问了, 例如在jvisulvm中访问

在教程的例子中有这么俩行

```java
SslRMIClientSocketFactory csf = new SslRMIClientSocketFactory();
SslRMIServerSocketFactory ssf = new SslRMIServerSocketFactory();
env.put(RMIConnectorServer.RMI_CLIENT_SOCKET_FACTORY_ATTRIBUTE, csf);
env.put(RMIConnectorServer.RMI_SERVER_SOCKET_FACTORY_ATTRIBUTE, ssf);

env.put("jmx.remote.x.password.file", "password.properties");
env.put("jmx.remote.x.access.file", "access.properties");

```

当设定这俩个参数之后需要在启动应用程序的时候, 在命令行或者配置文件中加上

```
-Djavax.net.ssl.keyStore=keystore -Djavax.net.ssl.keyStorePassword=password
```
这个就等同于
```
-Dcom.sun.management.jmxremote.port=3000 \
    -Dcom.sun.management.jmxremote.password.file=password.properties \
    -Dcom.sun.management.jmxremote.access.file=access.properties \
    -Djavax.net.ssl.keyStore=keystore \
    -Djavax.net.ssl.keyStorePassword=password \

```

##### Monitoring Applications through a Firewall

很有趣的一点是
>> As stated above, the code in Example 2-5 can be used to monitor applications through a firewall, which might not be possible if you use the out-of-the-box monitoring solution. The com.sun.management.jmxremote.port management property specifies the port where the RMI Registry can be reached but the ports where the RMIServer and RMIConnection remote objects are exported is chosen by the RMI stack. To export the remote objects (RMIServer and RMIConnection) to a given port you need to create your own RMI connector server programmatically, as described in Example 2-5. However, you must specify the JMXServiceURL as follows:

使用代码的方式可以让JMX通过防火墙访问服务器的JMX agent, 但是采用开箱即用的方式(命令行或者配置文件方式)就不行了。com.sun.management.jmxremote.port  这个参数指定了 RMI Registry 的注册端口, 但是RMIServer 和 RMIConnection 输出远程对象(remote objects) 所用的端口被RMI stack占用了。如果想要将RMIServer 和 RMIConnection 的远程对象(remote objects)输出，必须通过编程的方式创建一个单独的 RMI connector server，而且必须指定一个 JMXServiceURL 

```java
JMXServiceURL url = new JMXServiceURL("service:jmx:rmi://localhost:" + port1  + "/jndi/rmi://localhost:" + port2 + "/jmxrmi");

```


## MBean Server
MBean Server 是MBean的一个仓库, 我们并不直接访问MBean, 而是通过通过一个唯一的`ObjectName`通过 MBean Server来进行访问.

如果要实现一个MBean Server必须实现`javax.management.MBeanServer`接口.

如果我们要创建自己的MBean Server的话, 可以使用
* `MBeanServerFactory.createMBeanServer();`
* `MBeanServerFactory.newMBeanServer();`

`createMBeanServer()`内部会调用`newMBeanServer()`, 但是`createMBeanServer()`会将`newMBeanServer()`创建出来的MBean Server缓存到`ArrayList<MBeanServer> mBeanServerList`一个列表里. 这点先姑且不去讨论, 集中精力看看Platform MBean Server.

官方也建议我们使用Platform MBean Server(也就是自带的那个MBean Server), 在没有特殊需求之下, 没有必要建立自己的MBean Server.

```java
import javax.management.MBeanServer;
import java.lang.management.ManagementFactory;

public class PlatformMBeanServerTest {

    public static void main(String[] args) {
        MBeanServer server = ManagementFactory.getPlatformMBeanServer();
        System.out.println("MBeanCount : " + server.getMBeanCount());
    }
}
```

## MBean
看完MBServer, 我们来看一下MBean.

### MXBean 连接
首先先看一下[MXBean](http://docs.oracle.com/javase/8/docs/technotes/guides/management/overview.html#gdeuk), 什么是MXBean呢? 它是一种用来监控和管理Java VM的MBean.

我们可以通过三种方式来访问MXBean
* 通过`ManagementFactory`直接进行访问.
* 通过`MXBean proxy`直接访问.
* 通过`MBeanServerConnection`间接访问.

如果在同一个VM上的话, 我们可以通过ManagementFactory 提供的API进行直接访问
* `getClassLoadingMXBean()`
* `getGarbageCollectorMXBeans()`
* `getRuntimeMXBean()`
等等

例如
```java
RuntimeMXBean mxbean = ManagementFactory.getRuntimeMXBean();
String vendor = mxbean.getVmVendor(); 
```

如果不在同一个VM的话, 我们可以通过MXBean Proxy的方式进行远程访问.
```java
MBeanServerConnection mbs;
...
// Get a MBean proxy for RuntimeMXBean interface
RuntimeMXBean proxy = ManagementFactory.newPlatformMXBeanProxy(mbs,
                                             ManagementFactory.RUNTIME_MXBEAN_NAME,
                                             RuntimeMXBean.class);
// Get standard attribute "VmVendor"
String vendor = proxy.getVmVendor();
```

通过
```java
MBeanServerConnection mbs;
...
try {
  ObjectName oname = new ObjectName(ManagementFactory.RUNTIME_MXBEAN_NAME);
  // Get standard attribute "VmVendor"
  String vendor = (String) mbs.getAttribute(oname, "VmVendor");
} catch (....) {
  // Catch the exceptions thrown by ObjectName constructor
  // and MBeanServer.getAttribute method
  ...
}
```

当我们通过上述方式拿到MXBean之后, 就可以访问它里面的各种属性了.
```java
com.sun.management.OperatingSystemMXBean mxbean =
  (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();

// Get the number of processors
int numProcessors = mxbean.getAvailableProcessors();

// Get the Oracle JDK-specific attribute Process CPU time
long cpuTime = mxbean.getProcessCpuTime();
```

### 监控线程和CPU

`ThreadMXBean `提供了对线程和CPU的监控. 
在使用这个功能之前, 我们可能需要判断一下, Java VM是否开启了线程content监控
```java
ThreadMXBean.isThreadContentionMonitoringSupported()
```
如果没有开启的话, 我们调用一下
```java
setThreadContentionMonitoringEnabled()
```
开启它就可以了.

还有对线程统计的支持
* `isThreadCpuTimeSupported()`检测是否开启
* `isCurrentThreadCpuTimeSupported()` 上面那个是对任意线程的统计检测, 这个则是对并发线程的检测

同理, 对CPU需要同样地处理
* `isThreadCpuTimeEnabled` 检测CPU
* `setThreadCpuTimeEnabled()` 开启检测CPU

### 操作系统的管理
通过`OperatingSystem `可以拿到操作系统相关的信息
* CPU的运行时间(Process CPU time).
* 物理内存剩余和总共大小.
* committed virtual memory数量. (这个值表示的是当前运行的进程还可使用的虚拟内存的大小, 也就是在程序启动时分配的虚拟内存现在还剩下多少).
* 交换分区剩余和总共大小.
* 打开的文件()数量(因为Uniux哲学是一切皆文件, 所以这个值只支持Solaris, Linux, or Mac OS X).


### 日志管理
为了记录日志, Java特地提供了一个特殊的接口`LoggingMXBean`, 使用这个接口我们可以完成下面任务

* 获取指定logger的日志级别  
* 获取到当前注册的logger列表
* 获取到指定logger的父名称  
* 设置指定logger新的日志级别


`LoggingMXBean` 的`ObjectName `为`java.util.logging:type=Logging`. 这个名称存储在`LogManager.LOGGING_MXBEAN_NAME`里

```java
LoggingMXBean loggingMXBean = LogManager.getLoggingMXBean();
System.out.println(loggingMXBean.getLoggerNames());
```
得到的loggerName有
* `javax.management.snmp`
* `global`
* `javax.management.notification`
* `javax.management.modelmbean`
* `javax.management.timer`
* `javax.management`
* `javax.management.mlet`
* `javax.management.mbeanserver`
* `javax.management.snmp.daemon`
* `javax.management.relation`
* `javax.management.monitor`
* `javax.management.misc`
由于我的测试没有使用任何的日志系统, 因此它只打印了Java自带的一些logger, 但是如果你在SpringBoot或者自己添加上log4j的话, 会获取到更多的logger, 我们可以通过这个接口, 在服务器运行阶段动态修改logger级别.

> 尽管以前也做过修改日志级别的事情, 但是是通过第三方框架自带的api进行修改的, 但是使用这个MXBean, 貌似可以跨框架了, O(∩_∩)O~


### jmx 远程

```
JMX_OPTS="-Djava.rmi.server.hostname=192.168.15.25 -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=29001 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false "
```
当我们加上这个远程访问的时候, 需要在`/etc/hosts`文件里加上一个ip映射

```
192.168.15.25 ceshi_1
```
ceshi_1 是服务器名称, 前面的是内网ip, 要不然服务器在启动的时候会报错

```shell
[root@c2x_hm_cn_banhao01 log]# tail -f nohup_group_2017-08-14.nohup
Error: Exception thrown by the agent : java.net.MalformedURLException: Local host name unknown: java.net.UnknownHostException: c2x_hm_cn_banhao01: c2x_hm_cn_banhao01: unknown error
```





















































