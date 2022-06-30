---
category: Java
tag: Java 网络
date: 2018-08-22
title: Java Socket 参数
---

### setTcpNoDelay(boolean)

设置TCP_NODELAY为true,可确保包会尽快地发送,而无论包的大小.正常情况下,小的包(1byte)在发送前会组合为大点的包.在发送另一个包之前,本地主机要等待远程系统对前一个包的响应,这称为Nagle算法.Nagle算法的问题是,如果远程系统没有尽可能快地将回应发送回本地系统,那么依赖于小数据量信息稳定传输的应用程序会变得很慢.为true关闭socket缓冲,为false再次打开socket缓冲.

### setSoLinger(boolean, int)

该设置规定了当socket关闭时如何处理尚未发送的数据报.如果socket关闭(close方法)系统仍会将剩余的数据发送出去.如果延迟时间为0,那所有未发送的数据都会被丢弃.如果延迟时间为任意正数,close方法会被堵塞指定秒数,等待数据发送和接受回应,该段时间过去后socket被关闭,将会关闭输出输入流,既不会接收到数据也不会在发送数据.

### setOOBInline(boolean) 

用于发送紧急数据

### setSoTimeout(int) 

当socket尝试读取数据时,read方法会阻塞尽可能长的时间来得到足够的字节.该选项就是确保此次调用阻塞的时间不会大于某个固定的毫秒数,如果阻塞时间长于固定毫秒数就会抛出InterruptedIoException.尽管抛出了该异常但是socket仍然是连接的.此次read失败,但是仍然可以尝试再次读取该socket. 该选项是在accept抛出java.ioInterruptedIOException前等待入栈连接的时间,以毫秒计

### setSendBufferSize(int) 

设置socket网络输出的缓冲区字节数

### setReceiveBufferSize(int) 

设置socket网络输入的缓冲区的字节数.大多数TCP栈使用缓冲区提升网络性能,较大的缓冲区会提升快速连接(比如10M或更快)的网络性能,而较慢的拨号连接在较小的缓冲区下表现更加.一般来讲,传输大的连续的数据块(在FTP和HTTP很常见),这可以从大缓冲区收益;而大缓冲区对交互式会话如telnet和许多游戏则没有多大帮助.

### setKeepAlive(boolean) 

启用SO_KEEPALIVE客户端会偶尔(一般俩个小时)利用一个空闲连接发送一个数据包,确保服务器没有崩溃.如果服务器没有响应,客户端会在11分钟之内持续发送此包,直到接受到服务器的回馈或者到12分钟左右直接将客户端关闭.

### setReuseAddress(boolean) 

设置主机地址可重用. 指定如果仍有旧的数据在网络上传输,新的程序是否可以绑定到该端口

### getReuseAddress() 

socket关闭时,可能不会立即释放本地地址,一般会等待一段时间,确保所有寻址到待端口在网络上传输的数据接受到.关闭后一般接收到的数据报不会再进行任何处理,这么做是为了当有新的进程关联到该端口的时候不会接受到莫名其妙的数据.要想使用这个设置必须将老的socket如下设置

### TCP_NODELAYED

默认情况下, TCP发送数据采用Nagle算法.。
Nagle算法是解决小数据的频繁发送问题，比如1个字节的数据，在封包后会加上几十字节的首部，相当浪费资源。Nagle的做法是发送方发送的数据不会立即发出，而是先放在缓冲区,等待缓冲区达到一定的大小，或者是缓冲达到一定的时间后再一批发出。 发送完一批数据后, 会等待接收方对这批数据的回应，然后再发送下一批数据.。Negle算法适用于发送方需要发送大批量数据, 并且接收方会及时作出回应的场合, 这种算法通过减少传输数据的次数来提高通信效率。

如果发送方持续地发送小批量的数据, 并且接收方不一定会立即发送响应数据, 那么Negle算法会使发送方运行很慢。对于GUI 程序, 如网络游戏程序(服务器需要实时跟踪客户端鼠标的移动), 这个问题尤其突出.。客户端鼠标位置改动的信息需要实时发送到服务器上,由于Negle算法采用缓冲, 大大减低了实时响应速度, 导致客户程序运行很慢。

我们可以通过设置TCP_NODELAYED来禁用Negle算法。


### SO_KEEPLIVE

so_keepalive是TCP的心跳机制，保持连接检测对方主机是否崩溃，避免（服务器）永远阻塞于TCP连接的输入。设置该选项后，如果2小时内在此套接口的任一方向都没有数据交换，TCP就自动给对方 发一个保持存活探测分节(keepalive probe)。这是一个对方必须响应的TCP分节。它会导致以下三种情况：

对方接收一切正常：以期望的ACK响应，2小时后，TCP将发出另一个探测分节。
对方已崩溃且已重新启动：以RST响应。套接口的待处理错误被置为ECONNRESET，套接 口本身则被关闭。
对方无任何响应：源自berkeley的TCP发送另外8个探测分节，相隔75秒一个，试图得到一个响应。在发出第一个探测分节11分钟15秒后若仍无响应就放弃。套接口的待处理错误被置为ETIMEOUT，套接口本身则被关闭。如ICMP错误是“host unreachable(主机不可达)”，说明对方主机并没有崩溃，但是不可达，这种情况下待处理错误被置为 EHOSTUNREACH。

SO_KEEPALIVE有三个参数，其详细解释如下:
* tcp_keepalive_intvl，保活探测消息的发送频率。默认值为75s。发送频率tcp_keepalive_intvl乘以发送次数tcp_keepalive_probes，就得到了从开始探测直到放弃探测确定连接断开的时间，大约为11min。
* tcp_keepalive_probes，TCP发送保活探测消息以确定连接是否已断开的次数。默认值为9（次）。值得注意的是，只有设置了SO_KEEPALIVE套接口选项后才会发送保活探测消息。
* tcp_keepalive_time，在TCP保活打开的情况下，最后一次数据交换到TCP发送第一个保活探测消息的时间，即允许的持续空闲时间。默认值为7200s（2h）。

因为TCP协议中的SO_KEEPALIVE有几个致命的缺陷：
1. keepalive只能检测连接是否存活，不能检测连接是否可用。比如服务器因为负载过高导致无法响应请求但是连接仍然存在，此时keepalive无法判断连接是否可用。
2. 如果TCP连接中的另一方因为停电突然断网，我们并不知道连接断开，此时发送数据失败会进行重传，由于重传包的优先级要高于keepalive的数据包，因此keepalive的数据包无法发送出去。只有在长时间的重传失败之后我们才能判断此连接断开了。

首先，我想说的是，SO_Keeplive是实现在服务器侧，客户端被动响应，缺省超时时间为120分钟，这是RFC协议标准规范。
SO_Keeplive是实现在TCP协议栈（四层），应用层的心跳实现在第七层，本质没有任何区别，但应用层需要自己来定义心跳包格式。
之所以实现在服务器侧，是因为与客户端相比，服务器侧的寿命更长，因为服务器侧需要不间断地提供服务，而客户端可能由于用户下班而合上电脑（TCP没有来得及发送FIN关闭连接），这样的话，服务器侧就会有很多不可用的TCP连接（established)，这样的连接依然会占用服务器内存资源，于是就设计这个keepalive 来检测客户端是否可用，如果几次重传keepalive ，客户端没有相应，删除连接，释放资源。
需要指出的是，超时时间是指TCP连接没有任何数据、控制字传输的时间，如果有任何数据传输，会刷新定时器，重新走表。
TCP心跳是一个备受争议的实现，只是一个option，不是强制标准。
之所以应用层需要独立实现自己的心跳，是因为超时时间较长，无法给应用层提供快速的反馈。
所以类似BGP协议就独立实现了自己的keepalive，最小可以设置一秒钟，三次没有应答即可以Reset连接，最快三秒可以检测到失效。
而三秒依然太慢，可以用另外一个协议BFD来提供更快发现链路失效，最快可以配置成10ms
，三次超时（30ms)就可以完成失效检测。

> 部分摘抄自
> TCP中已有SO_KEEPALIVE选项，为什么还要在应用层加入心跳包机制?? - 车小胖的回答 - 知乎
> https://www.zhihu.com/question/40602902/answer/209235747

### BACKLOG

对于TCP连接，内核维护两个队列：

1. 未完成连接的队列(backlog )，此队列维护着那些已收到了客户端SYN分节信息，等待完成三路握手的连接，socket的状态是SYN_RCVD。
2. 已完成的连接的队列(syn_backlog )，此队列包含了那些已经完成三路握手的连接，socket的状态是ESTABLISHED，但是等待accept。

* `backlog` : 在linux2.2之后表示队列2（已经完成连接，等待accept调用）。backlog的值太小会导致在大量连接的时候不能处理，丢弃客户端发送的ack，此时如果客户端认为连接建立继续发送数据，就会出现满请求。backlog过大会导致连接积压，性能下降。

调用listen监听的时候可以设置backlog的值，然backlog 并不是按照你调用listen的所设置的backlog大小，实际上取的是`backlog`和`somaxconn`的最小值。somaxconn的值定义在`/proc/sys/net/core/somaxconn`，默认是`128`，可以把这个值修改更大以满足高负载需求。

* `syn_backlog` : 指队列1（半连接SYN_RCVD阶段）。这个值在`/proc/sys/net/ipv4/tcp_max_syn_backlog` ，可以对其进行调整。但是一般情况下处于syn_rcvd阶段的不会太多，除非遇到SYN_FLOOD攻击。

* `SYN FLOOD`： SYN Flood利用的是TCP协议缺陷，发送大量伪造的TCP连接请求，从而使得被攻击方资源耗尽（CPU满负荷或内存不足）的攻击方式。在被攻击主机用netstat可以看见80端口存在大量的半连接状态(SYN_RECV)，用tcpdump抓包可以看见大量伪造IP发来的SYN连接，S也不断回复SYN+ACK给对方，可惜对方并不存在(如果存在则S会收到RST这样就失去效果了)，所以会超时重传。这个时候如果有正常客户A请求S的80端口，它的SYN包就被S丢弃了，因为半连接队列已经满了，达到攻击目的。

> The maximum queue length for incoming connection indications (a request to connect) is set to the {@code backlog} parameter.
> If a connection indication arrives when the queue is full, the connection is refused.

上面这段描述是Javadoc 对backlog的解释，在服务器内部有一个连接请求队列(backlog就是这个队列的大小). 当队列有空余位置时, 将请求连接进行入列操作, 当ServerSocket调用accept的时候,就执行出列操作. 如果队列满了, 请求连接还尝试入列的话, 该链接就会被拒绝.

linux 中对backlog的解释:
> backlog其实是一个连接队列  : backlog队列总和=未完成三次握手队列 +  已经完成三次握手队列
>   
> * 未完成三次握手队列：服务器处于listen状态时收到客户端syn 报文(connect)时放入未完成队列中。
> * 已经完成三次握手队列：三路握手的第二个状态即服务器syn+ ack响应client后,此时第三个状态ack报文到达前(客户端对服务器syn的ack)一直保留在未完成连接队列中，如果三路握手完成，该条目将从未完成连接队列搬到已完成连接队列尾部.
> 当server调用accept时，从已完成(三次握手)队列中的头部取出一个socket连接给进程，以下是变化过程。

```java
package testnet;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class SimpleServer {
  public static void main(String[] args) throws IOException {
      startServer();
      startClient();
  }

  private static void startServer() {
      Executors.newFixedThreadPool(1).submit(() -> {
        try {
            ServerSocket serverSocket = new ServerSocket(8080, 1);
            while (true) {
              try {
                  TimeUnit.SECONDS.sleep(2);
              } catch (InterruptedException e) {
                  e.printStackTrace();
              }
              Socket socket = serverSocket.accept();
              System.out.println("Revice " + LocalDateTime.now());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "";
      });
  }

  private static void startClient() throws IOException {
      ExecutorService exec = Executors.newFixedThreadPool(3);
      Runnable client = () -> {
        try {
            Socket socket = new Socket("127.0.0.1", 8080);
            System.out.println("Connect " + LocalDateTime.now());
        } catch (IOException e) {
            e.printStackTrace();
        }
      };
      exec.submit(client);
      exec.submit(client);
      exec.submit(client);
      try {
        TimeUnit.SECONDS.sleep(1);
      } catch (InterruptedException e) {
        e.printStackTrace();
      }
      exec.submit(client);
      exec.submit(client);
      exec.submit(client);
  }
}
```

运行结果
```
Connect 2016-11-21T16:09:18.267
Connect 2016-11-21T16:09:18.267
Connect 2016-11-21T16:09:18.268
Revice 2016-11-21T16:09:20.240
java.net.ConnectException: Connection refused: connect
    at java.net.DualStackPlainSocketImpl.connect0(Native Method)
    at java.net.DualStackPlainSocketImpl.socketConnect(DualStackPlainSocketImpl.java:79)
    at java.net.AbstractPlainSocketImpl.doConnect(AbstractPlainSocketImpl.java:350)
    at java.net.AbstractPlainSocketImpl.connectToAddress(AbstractPlainSocketImpl.java:206)
    at java.net.AbstractPlainSocketImpl.connect(AbstractPlainSocketImpl.java:188)
    at java.net.PlainSocketImpl.connect(PlainSocketImpl.java:172)
    at java.net.SocksSocketImpl.connect(SocksSocketImpl.java:392)
    at java.net.Socket.connect(Socket.java:589)
    at java.net.Socket.connect(Socket.java:538)
    at java.net.Socket.<init>(Socket.java:434)
    at java.net.Socket.<init>(Socket.java:211)
    at testnet.SimpleServer.lambda$startClient$1(SimpleServer.java:41)
    at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)
    at java.lang.Thread.run(Thread.java:745)
java.net.ConnectException: Connection refused: connect
    at java.net.DualStackPlainSocketImpl.connect0(Native Method)
    at java.net.DualStackPlainSocketImpl.socketConnect(DualStackPlainSocketImpl.java:79)
    at java.net.AbstractPlainSocketImpl.doConnect(AbstractPlainSocketImpl.java:350)
    at java.net.AbstractPlainSocketImpl.connectToAddress(AbstractPlainSocketImpl.java:206)
    at java.net.AbstractPlainSocketImpl.connect(AbstractPlainSocketImpl.java:188)
    at java.net.PlainSocketImpl.connect(PlainSocketImpl.java:172)
    at java.net.SocksSocketImpl.connect(SocksSocketImpl.java:392)
    at java.net.Socket.connect(Socket.java:589)
    at java.net.Socket.connect(Socket.java:538)
    at java.net.Socket.<init>(Socket.java:434)
    at java.net.Socket.<init>(Socket.java:211)
    at testnet.SimpleServer.lambda$startClient$1(SimpleServer.java:41)
    at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)
    at java.lang.Thread.run(Thread.java:745)
java.net.ConnectException: Connection refused: connect
    at java.net.DualStackPlainSocketImpl.connect0(Native Method)
    at java.net.DualStackPlainSocketImpl.socketConnect(DualStackPlainSocketImpl.java:79)
    at java.net.AbstractPlainSocketImpl.doConnect(AbstractPlainSocketImpl.java:350)
    at java.net.AbstractPlainSocketImpl.connectToAddress(AbstractPlainSocketImpl.java:206)
    at java.net.AbstractPlainSocketImpl.connect(AbstractPlainSocketImpl.java:188)
    at java.net.PlainSocketImpl.connect(PlainSocketImpl.java:172)
    at java.net.SocksSocketImpl.connect(SocksSocketImpl.java:392)
    at java.net.Socket.connect(Socket.java:589)
    at java.net.Socket.connect(Socket.java:538)
    at java.net.Socket.<init>(Socket.java:434)
    at java.net.Socket.<init>(Socket.java:211)
    at testnet.SimpleServer.lambda$startClient$1(SimpleServer.java:41)
    at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)
    at java.lang.Thread.run(Thread.java:745)
Revice 2016-11-21T16:09:22.240
Revice 2016-11-21T16:09:24.241
```

下面这一段摘抄自[TCP/IP协议中backlog参数](https://www.cnblogs.com/Orgliny/p/5780796.html)

TCP建立连接是要进行三次握手，但是否完成三次握手后，服务器就处理（accept）呢？
backlog其实是一个连接队列，在Linux内核2.2之前，backlog大小包括半连接状态和全连接状态两种队列大小。

* 半连接状态为：服务器处于Listen状态时收到客户端SYN报文时放入半连接队列中，即SYN queue（服务器端口状态为：SYN_RCVD）。
* 全连接状态为：TCP的连接状态从服务器（SYN+ACK）响应客户端后，到客户端的ACK报文到达服务器之前，则一直保留在半连接状态中；当服务器接收到客户端的ACK报文后，该条目将从半连接队列搬到全连接队列尾部，即 accept queue （服务器端口状态为：ESTABLISHED）。

在Linux内核2.2之后，分离为两个backlog来分别限制半连接（SYN_RCVD状态）队列大小和全连接（ESTABLISHED状态）队列大小。

* SYN queue 队列长度由 `/proc/sys/net/ipv4/tcp_max_syn_backlog` 指定，默认为2048。
* Accept queue 队列长度由 `/proc/sys/net/core/somaxconn` 和使用listen函数时传入的参数，二者取最小值。默认为128。在Linux内核2.4.25之前，是写死在代码常量 SOMAXCONN ，在Linux内核2.4.25之后，在配置文件 `/proc/sys/net/core/somaxconn` 中直接修改，或者在 `/etc/sysctl.conf` 中配置 `net.core.somaxconn = 128` 。
 
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/net/backlog.png)

可以通过ss命令来显示
```
[root@localhost ~]# ss -l
State       Recv-Q Send-Q                                     Local Address:Port                                         Peer Address:Port     
LISTEN      0      128                                                    *:http                                                    *:*       
LISTEN      0      128                                                   :::ssh                                                    :::*       
LISTEN      0      128                                                    *:ssh                                                     *:*       
LISTEN      0      100                                                  ::1:smtp                                                   :::*       
LISTEN      0      100                                            127.0.0.1:smtp                                                    *:*    
```

在LISTEN状态，其中 Send-Q 即为Accept queue的最大值，Recv-Q 则表示Accept queue中等待被服务器accept()。

另外客户端connect()返回不代表TCP连接建立成功，有可能此时accept queue 已满，系统会直接丢弃后续ACK请求；客户端误以为连接已建立，开始调用等待至超时；服务器则等待ACK超时，会重传SYN+ACK 给客户端，重传次数受限 net.ipv4.tcp_synack_retries ，默认为5，表示重发5次，每次等待30~40秒，即半连接默认时间大约为180秒，该参数可以在tcp被洪水攻击是临时启用这个参数。

查看SYN queue 溢出
```
[root@localhost ~]# netstat -s | grep LISTEN
102324 SYNs to LISTEN sockets dropped
```

查看Accept queue 溢出
```
[root@localhost ~]# netstat -s | grep TCPBacklogDrop
TCPBacklogDrop: 2334
```

### So_Timeout

ServerSocket 的 timeout 用于设置accept的超时时间，如果timeout到了，但是没有accept，就抛出TimeOutException

```java
package testnet;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class TestServerTimeout {
  public static void main(String[] args) throws IOException {
      startServer();
      startClient();
  }

  private static void startServer() {
      Executors.newFixedThreadPool(1).submit(() -> {
        try {
            ServerSocket serverSocket = new ServerSocket(8080, 1, InetAddress.getByName("local220"));
            serverSocket.setSoTimeout(2500);
            while (true) {
              try {
                  System.out.println("Revice Begin " + LocalDateTime.now());
                  Socket socket = serverSocket.accept();
                  System.out.println("Revice Finish " + LocalDateTime.now());
              } catch (Exception e) {
                  System.err.println("Revice " + e.getMessage() + "  " + LocalDateTime.now());
              }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "";
      });
  }

  private static void startClient() throws IOException {
      ExecutorService exec = Executors.newFixedThreadPool(4);
      Runnable client = () -> {
        try {
            TimeUnit.SECONDS.sleep(3);
            System.out.println("Connect Begin " + LocalDateTime.now());
            Socket socket = new Socket("192.168.10.220", 8080);
            System.out.println("Connect Finish " + LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("Connect  " + e.getMessage() + "  " + LocalDateTime.now());
        }
      };
      exec.submit(client);
  }
}
```

运行结果
```
Revice Begin 2016-11-25T17:32:49.484
Revice Accept timed out  2016-11-25T17:32:51.985
Revice Begin 2016-11-25T17:32:51.985
Connect Begin 2016-11-25T17:32:52.452
Revice Finish 2016-11-25T17:32:52.455
Connect Finish 2016-11-25T17:32:52.455
Revice Begin 2016-11-25T17:32:52.455
Revice Accept timed out  2016-11-25T17:32:54.956
Revice Begin 2016-11-25T17:32:54.956
Revice Begin 2016-11-25T17:32:57.457
Revice Accept timed out  2016-11-25T17:32:57.457
```