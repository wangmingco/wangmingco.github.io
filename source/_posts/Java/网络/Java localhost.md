---
category: Java
tag: Java 网络
date: 2016-11-25
title: host文件 和 localhost 0.0.0.0 127.0.0.1
---

### host文件

系统地中host文件一般都长下面这样子
```
# Copyright (c) 1993-2009 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
#
# This file contains the mappings of IP addresses to host names. Each
# entry should be kept on an individual line. The IP address should
# be placed in the first column followed by the corresponding host name.
# The IP address and the host name should be separated by at least one
# space.
#
# Additionally, comments (such as these) may be inserted on individual
# lines or following the machine name denoted by a '#' symbol.
#
# For example:
#
#      102.54.94.97     rhino.acme.com          # source server
#       38.25.63.10     x.acme.com              # x client host

# localhost name resolution is handled within DNS itself.
#    127.0.0.1       localhost
#    ::1             localhost
192.168.10.220 local220
```

写个测试程序看看如何访问host文件的
```java
package testnet;

import java.net.InetAddress;
import java.net.UnknownHostException;

public class TestInetAddress {

  public static void main(String[] args) throws UnknownHostException {
      System.out.println(InetAddress.getByName("local220"));
      System.out.println(InetAddress.getByName("localhost"));
      System.out.println(InetAddress.getByName("192.168.10.220"));
      System.out.println(InetAddress.getByName("127.0.0.1"));
  }
}
```

```
local220/192.168.10.220
localhost/127.0.0.1
/192.168.10.220
/127.0.0.1
```

### localhost

一个网卡只能配置一个IP。
这是由于网卡的物理特性所决定的：网卡上只有一个MAC地址，这个MAC地址只能配置一个IP地址。也就是说同一时间内，MAC地址只能配置一个IP地址。MAC地址也就是物理地址。
它是对应OSI中的物理层上的，IP地址是第三层上的，与之对应的是第一层的MAC地址。因网卡上只有一个MAC地址,，所以一个网卡只能配置一个IP。

localhost是一个域名,它代表的并不是一个IP地址, 通常在host文件中,将其指向为127.0.0.1

127/* 整个网段 通常被用作 loopback 网络接口的默认地址，按惯例通常设置为 127.0.0.1。 loopback 是一个特殊的网络接口(可理解成虚拟网卡)，用于本机中各个应用之间的网络交互。 这个地址在其他计算机上不能访问，就算你想访问，访问的也是自己，因为每台带有TCP/IP协议栈的设备基本上都有 localhost/127.0.0.1。

因此在服务器程序bind到IP地址的时候, 如果想要让本机之外的计算机访问, 那么应该绑定物理网卡的IP地址或者虚拟网卡的IP地址, 不应该绑定loopback的地址

Hosts 文件本来是用来提高解析效率。在进行 DNS 请求以前，系统会先检查自己的 Hosts 文件中是否有这个地址映射关系，如果有则调用这个 IP 地址映射，如果没有再向已知的 DNS 服务器提出域名解析。也就是说 Hosts 的请求级别比 DNS 高。当你的 Hosts 文件里面有对应的 IP 时，它就会直接访问那个 IP，而不用通过 DNS。
所以，当我们直接将 Google、Twitter、Facebook 之类的 IP 放入 Hosts 文件后，就可以跳过 DNS 的解析这一步，直接就行 IP 访问，不受 GFW 的 DNS 污染干扰了。
补充一条，就是为什么 Hosts 的 IP 要时不时更改，为什么 FB、Twitter 会仍旧上不去。是因为 GFW 的第二个大招，IP 封锁。比如访问国外一个 IP 无法访问，Ping 不通，tracert 这个 IP 后发现，全部在边缘路由器 (GFW) 附近被拦截。换言之，GFW 直接拦截带有这个 IP 头的数据包。所以，如果你更改的 IP 被封锁了，就算你过了 DNS 这一关，也仍旧不能翻过 GFW。

### 0.0.0.0

还有一个特殊的IP `0.0.0.0`, 一个非常特殊的IP, 这个IP相当于java中的this，代表当前设备的IP。
我们在java编程中使用ServerSocket做网络侦听，通常只需要如下代码：

```java
ServerSocket serverSock=new ServerSocket(8888);
serverSock.accept();
```

假如我的主机ip为：`10.10.152.8`，用以上代码做侦听，`127.0.0.1:8888`或者`10.10.152.8:8888`都可以连上，
但大家有没有想过过，这个ServerSocket到底使用哪个IP在做侦听？如果我们将以上代码改成显式绑定：

```java
ServerSocket ss=new ServerSocket();
String ip=“10.10.152.8″;
int port=8888;
InetSocketAddress addr=new InetSocketAddress(ip,port);
ss.bind(addr);
ss.accept();
```

你会发现，`127.0.0.1:8888`是无法访问的，
而如果将ip改成`127.0.0.1`，那么`10.10.152.8:8888`是无法访问的。实际上，背后的秘密就在与`0.0.0.0`这个IP，他可以代表本机的所有IP地址，
但这个IP并不是真是存在的，我们ping不通它，如果将ip改成`0.0.0.0`:

```java
ServerSocket ss=new ServerSocket();
String ip=“0.0.0.0″;
int port=8888;
InetSocketAddress addr=new InetSocketAddress(ip,port);
ss.bind(addr);
ss.accept();
```

我们会发现，这和默认行为是一样的，`127.0.0.1:8888`或者`10.10.152.8:8888`都可以连上。
比如说，TCP`0.0.0.0`连出和入`127.0.0.1`, 还有：TCP/IP  `0.0.0.0`连出和入`0.0.0.0`,   TCP/IP  `127.0.0.1`连出和连入`127.0.0.1`,
`127.0.0.1`和本地网络 UDP连出到`0.0.0.0` , 这些网络连接都是本地流量，也就是内环流量。

但应该限制未信任IP连入本地IP【`127.0.0.1、0.0.0.0`和本机IP】。限制`127.0.0.1`和`0.0.0.0`连出到外部非信任网络。

### .

今天遇到一个比较奇葩的问题, 在一个JDBC程序连接数据库的时候, 使用IPV4地址就无法访问, 使用localhost就成功, 现在就对这个问题一探究竟

```
jdbc:mysql://localhost:3306/c2x?autoReconnect=true
```

首先要说明一下localhost, 127.0.0.1和ipv4之间的关系
* localhost : 首先这不是一个地址, 而是一个域名, 类似于www.baidu.com这种东西
* 127.0.0.1 : 127开头的网段默认都是属于loopback接口, 用于测试本机TCP/IP协议栈. 它被分配在了一个虚拟网卡上
* ipv4 : 是一个真实网卡上的ip地址.
首先我们看一下win7系统上的C:\Windows\System32\drivers\etc的host配置文件

```
# localhost name resolution is handled within DNS itself.
#       127.0.0.1       localhost
#       ::1             localhost
```

我们看到127.0.0.1就映射到了localhost, ::1是在ipv6的前提下分配到的localhost. 通过这个配置文件我们就看到了localhost和 127.0.0.1这二者之间的关系.
下面我们再使用ipconfig/all这个命令看一下Windows的网卡配置

```
Windows IP 配置

   主机名  . . . . . . . . . . . . . : OA1503P0256
   主 DNS 后缀 . . . . . . . . . . . : xxx(lol)
   节点类型  . . . . . . . . . . . . : 混合
   IP 路由已启用 . . . . . . . . . . : 否
   WINS 代理已启用 . . . . . . . . . : 否
   DNS 后缀搜索列表  . . . . . . . . : xxx(lol)

以太网适配器 本地连接:

   连接特定的 DNS 后缀 . . . . . . . : xxx(lol)
   描述. . . . . . . . . . . . . . . : Realtek PCIe GBE Family Controller
   物理地址. . . . . . . . . . . . . : F0-79-59-64-74-71
   DHCP 已启用 . . . . . . . . . . . : 是
   自动配置已启用. . . . . . . . . . : 是
   本地链接 IPv6 地址. . . . . . . . : fe80::1d00:63da:2b98:8c05%11(首选) 
   IPv4 地址 . . . . . . . . . . . . : 192.168.10.220(首选) 
   子网掩码  . . . . . . . . . . . . : 255.255.255.0
   获得租约的时间  . . . . . . . . . : 2016年3月29日 10:05:04
   租约过期的时间  . . . . . . . . . : 2016年4月6日 16:32:42
   默认网关. . . . . . . . . . . . . : 192.168.10.254
   DHCP 服务器 . . . . . . . . . . . : 192.168.10.202
   DHCPv6 IAID . . . . . . . . . . . : 235430502
   DHCPv6 客户端 DUID  . . . . . . . : 00-01-00-01-1C-AE-A2-19-F0-79-59-64-74-71
   DNS 服务器  . . . . . . . . . . . : 192.168.10.12
                                       192.168.15.3
   TCPIP 上的 NetBIOS  . . . . . . . : 已启用

隧道适配器 isatap.xxx(lol):

   媒体状态  . . . . . . . . . . . . : 媒体已断开
   连接特定的 DNS 后缀 . . . . . . . : xxx(lol)
   描述. . . . . . . . . . . . . . . : Microsoft ISATAP Adapter
   物理地址. . . . . . . . . . . . . : 00-00-00-00-00-00-00-E0
   DHCP 已启用 . . . . . . . . . . . : 否
   自动配置已启用. . . . . . . . . . : 是

隧道适配器 Teredo Tunneling Pseudo-Interface:

   媒体状态  . . . . . . . . . . . . : 媒体已断开
   连接特定的 DNS 后缀 . . . . . . . : 
   描述. . . . . . . . . . . . . . . : Teredo Tunneling Pseudo-Interface
   物理地址. . . . . . . . . . . . . : 00-00-00-00-00-00-00-E0
   DHCP 已启用 . . . . . . . . . . . : 否
   自动配置已启用. . . . . . . . . . : 是
```

好了, 最后验证一下刚开始谈到的那个数据库的问题. 当我分别使用192.168.10.20和localhost通过SQLyog连接时, 果真看到的是俩个不一样的数据库....
然后我又写了一个测试程序

```java
public class TestLocalhost {

    public static void main(String[] args) throws IOException, InterruptedException {
        ServerSocket serverSocket = new ServerSocket();
        serverSocket.bind(new InetSocketAddress("192.168.10.220", 9051));
//        serverSocket.bind(new InetSocketAddress("localhost", 9051));
        serverSocket.accept();
        System.out.println("connected!!!");
    }
}
```

然后使用http请求测试
* http://localhost:9051/ 不可连接成功
* http://192.168.10.220:9051/ 连接成功 说明192.168.10.20和localhost本身是不能互通的.
接下来我改进一下这个程序

```java
public class TestLocalhost {

    public static void main(String[] args) throws InterruptedException {
        SocketAcceptor socketAcceptor1 = new SocketAcceptor("192.168.10.220");
        SocketAcceptor socketAcceptor2 = new SocketAcceptor("localhost");
        socketAcceptor1.start();
        socketAcceptor2.start();

        TimeUnit.SECONDS.sleep(100);
    }

    public static class SocketAcceptor extends Thread {

        public final String ip;
        public SocketAcceptor(String ip) {
            this.ip = ip;
        }

        @Override
        public void run() {
            try {
                ServerSocket serverSocket1 = new ServerSocket();
                serverSocket1.bind(new InetSocketAddress(ip, 9051));
                serverSocket1.accept();
                System.out.println(ip + " accepted");
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

然后继续使用上面俩个地址进行访问, 发现最后都进行了输出

```
192.168.10.220 accepted
localhost accepted
```

这个例子也说明了不同的网卡可以绑定不同的端口, 即使是虚拟网卡也有一套自己端口
