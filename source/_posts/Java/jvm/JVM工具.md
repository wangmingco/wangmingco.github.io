---
category: Java
tag: jvm
date: 2016-09-24
title: JVM 工具
---

## 工具列表

* [jmc]() jdk 自带的性能监控工具
* [hropf](https://docs.oracle.com/javase/8/docs/technotes/samples/hprof.html) 这个是java agent工具, 用它可以监控JVM在运行时的CPU使用状况和堆内存分配以及监控器的一些信息. 
* [jvmstat](https://www.oracle.com/java/technologies/jvmstat.html#Installation) HotSpot™ Monitoring Tools and Utilities (-XX:+UsePerfData)
* [Oracle® Solaris Studio](https://www.oracle.com/tools/developerstudio/downloads/solaris-studio-v123-downloads.html) 这是一款在Linux上使用的监控监控，它的监控端和桌面端都在Linux上。
* [hpjmeter](http://www.javaperformancetuning.com/tools/hpjmeter/index.shtml) 分析gc产生的日志
* [JPerfAnal](https://sourceforge.net/projects/jperfanal/) 
* [Simple Tools To Analyze Thread Dumps](https://planet.jboss.org/post/simple_tools_to_analyze_thread_dumps)
* [Thread Dump Viewer](https://sourceforge.net/projects/tdv/?source=recommended)
* [TDA - Thread Dump Analyzer](https://java.net/projects/tda)
* [Java Thread Dump Analyser](http://mchr3k.github.io/javathreaddumpanalyser/)
* [IBM Thread and Monitor Dump Analyzer for Java]()

## jvisualvm 

在JVisualVM中有俩个统计类的tab: 抽样器和profiler，那么这俩个有什么不一样呢？

* `Profiler`: 会通过 instrument 技术(对就是JDK5提出的那个技术)， 向目标虚拟机的代码进行代码注入。 例如profile cpu的时候会向所有的方法添加统计代码(添加额外的字节码)，这些代码会记录下来这些方法是何时被调用的，以及每一次调用都使用了多长时间
* `Sample`: 进行采样分析. 同样是在采样CPU, 它会每隔一段时间dump下所有的线程信息, 然后粗略地算出每个方法占用的CPU的时间。

在线上环境中切记不要使用profiler

## jmc

Java启动时手动开启 

```shell
java -XX:+UnlockCommercialFeatures -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=myrecording.jfr MyApp
```

为应用开启飞行记录。 这时一个商业特性和-XX:+UnlockCommercialFeatures选项一起使用。这个选项类似JFR.start命令。你可以设置一下参数：

* `compress={true|false}`  指定是否压缩
* `defaultrecording={true|false}` 指定后台的飞行记录是一直运行还是只运行一段时间。默认这个参数的值是false，也就是运行一段时间，
* `delay=time` 指定再启动JVM后多长时间开始记录飞行记录。默认没有延迟时间。
* `dumponexit={true|false}` 指定在JVM退出的时候是否生成飞行记录数据。默认这个参数是false。如果需要生成如下所示： `-XX:StartFlightRecording=name=test,filename=D:\test.jfr,dumponexit=true`
* `duration=time` 指定飞行记录执行的时间。默认没有限制。
* `filename=path` 指定JFR记录的路径和文件
* `name=identifier` 指定JFR记录的标识。默认Recording 是x。
* `maxage=time` 指定飞行记录保存的时间。默认是15分钟
* `settings=path` 设置事件配置文件，默认使用`default.jfc`.这个文件在`JAVA_HOME/jre/lib/jfr`



## hropf

* [hropf](https://docs.oracle.com/javase/8/docs/technotes/samples/hprof.html) 这个是java agent工具, 用它可以监控JVM在运行时的CPU使用状况和堆内存分配以及监控器的一些信息. 

```
➜  test java -agentlib:hprof=help

     HPROF: Heap and CPU Profiling Agent (JVMTI Demonstration Code)

hprof usage: java -agentlib:hprof=[help]|[<option>=<value>, ...]

Option Name and Value  Description                    Default
---------------------  -----------                    -------
heap=dump|sites|all    heap profiling                 all
cpu=samples|times|old  CPU usage                      off
monitor=y|n            monitor contention             n
format=a|b             text(txt) or binary output     a
file=<file>            write data to file             java.hprof[{.txt}]
net=<host>:<port>      send data over a socket        off
depth=<size>           stack trace depth              4
interval=<ms>          sample interval in ms          10
cutoff=<value>         output cutoff point            0.0001
lineno=y|n             line number in traces?         y
thread=y|n             thread in traces?              n
doe=y|n                dump on exit?                  y
msa=y|n                Solaris micro state accounting n
force=y|n              force output to <file>         y
verbose=y|n            print messages about dumps     y

Obsolete Options
----------------
gc_okay=y|n
```

每20毫秒统计一次CPU信息(栈深度为3):
```
java -agentlib:hprof=cpu=samples,interval=20,depth=3 classname
```

注意:
*  `format=b`不能和`monitor=y`一起使用
*  `format=b`不能和`cpu=old|times`一起使用
*  `-Xrunhprof`接口可以继续使用, 例如`java -Xrunhprof:[help]|[<option>=<value>, ...]`.这个等同于`java -agentlib:hprof=[help]|[<option>=<value>, ...]`

我们看一个很简单的统计函数运行时间的示例

```
java -agentlib:hprof=cpu=times,interval=10 Test
```

## jvmstat

* [jvmstat](https://www.oracle.com/java/technologies/jvmstat.html#Installation) HotSpot™ Monitoring Tools and Utilities (-XX:+UsePerfData)
* [HotSpot Jvmstat Performance Counters](https://openjdk.org/groups/hotspot/docs/Serviceability.html#bjvmstat)

可以使用  jps, jstat, and jstatd 这三个 工具监控JVM的性能和资源消耗。

* jps Experimental: JVM Process Status Tool - Lists instrumented HotSpot Java virtual machines on a target system. (formerly jvmps)
* jstat Experimental: JVM Statistics Monitoring Tool - Attaches to an instrumented HotSpot Java virtual machine and collects and logs performance statistics as specified by the command line options. (formerly jvmstat)
* jstatd :Experimental: JVM jstat Daemon - Launches an RMI server application that monitors for the creation and termination of instrumented HotSpot Java virtual machines and provides a interface to allow remote monitoring tools to attach to Java virtual machines running on the local system. (formerly perfagent)

Hotspot出于性能测试和排查问题的目的而提供了jvmstat 工具. 我们可以使用JVM参数-XX:+UsePerfData来决定是否开启这个功能. 因此jvm运行时会生成一个目录hsperfdata_$USER($USER是启动java进程的用户,在linux中默认是/tmp),目录下会有些java 进程的 pid文件. 文件内部存储的是jvmstat统计的jvm进程的相关信息.

> jvmstat源码参考 `openjdk\jdk\src\share\classes\sun\jvmstat`

当我们将/tmp/hsperfdata目录下的某个进程文件删除之后, 相应的进程也就消失了, 经过测试即使Java进程里已经注册了钩子程序, 但是钩子程序也不会执行, 进程就直接消失了. 而且进程消失之后, 这个文件也就没有了.

PerfData 相关的JVM选项

* `-XX:+UsePerfData` 用于设置是否开启统计.(默认值为true, 开启)
* `-XX:+PerfDataSaveToFile` 在系统退出时是否将PerfData 内存数据保存到hsperfdata_ 文件(默认为false, 不开启). 注意这个数据是保存到Java进程当前的工作目录, 而不是/tmp下
* `PerfDataSamplingInterval` 统计采样间隔(单位毫秒, 默认是50毫秒)
* `PerfDisableSharedMem` 是否将标准内存的性能数据进行存储(默认为false, 不存储)
* `PerfDataMemorySize` 性能统计数据可存储大小. 总是对操作系统内存页的大小进行取整(默认是32k)。 因为在内存中保存的是32k的数据, 因此存储到文件之后, 文件的大小也固定在32k.

我们可以使用jdk提供的一些工具来读取这个目录下的JVM进程信息统计文件, 例如jstat读取`/tmp/hsperfdata_username/`目录下的文件查看虚拟机老年代的情况

```
[root@root wangming]# jstat -gcold file:///tmp/hsperfdata_username/2332 
   MC       MU      CCSC     CCSU       OC          OU       YGC    FGC    FGCT     GCT   
 26112.0  25379.2   3840.0   3719.1    164864.0     18007.6    495     1    0.102    2.377
```

## jstat

* [虚拟机统计信息监视工具])(https://docs.oracle.com/javase/7/docs/technotes/tools/share/jstat.html)

虚拟机统计信息监视工具

用于监视虚拟机各种运行状态信息的命令行工具.它可以显示本地或远程虚拟机进程中的类装载,内存,垃圾收集,JIT编译等运行数据.

jstat命令格式

```
jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]
```

对于命令格式中的VMID与LVMID需要特别说明一下:如果是本地虚拟机进程,VMID和LVMID是一致的,如果是远程虚拟机进程,那么VMID的格式应该是:
```
[protocol:] [//]lvmid[@hostname [:port] /servername]
```

option参数代表着用户希望查询的虚拟机信息,主要分为三类:类装载,垃圾收集,运行期编译状况, 可选值有:

*  `-class`: 监视类装载,卸载数量,总空间及类装载所耗费的时间
*  `-gc`: 监视java堆状况,包括Eden区,2个survivor区,老年代,永久代等的容量,已用空间,GC时间合计等信息.
*  `-gccapacity`: 监视内容与-gc基本相同,但输出主要关注java堆各个区域使用到最大和最小空间.
*  `-gcutil`: 监视内容与-gc基本相同,但输出主要关注已使用空间占总空间的百分比.
*  `-gccause`: 与-gcutil功能一样,但是会额外输出导致上一次GC产生的原因.
*  `-gcnew`:监视新生代GC的状况.
*  `-gcnewcapacity`: 监视内容与-gcnew基本相同输出主要关注使用到的最大和最小空间
*  `-gcold`: 监视老年代GC的状况.
*  `-gcoldcapacity`: 监视内容与-gcold基本相同,但输出主要关注使用到的最大和最小空间
*  `-gcpermcapacity`: 输出永久代使用到呃最大和最小空间
*  `-compiler`: 输出JIT编译器编译过的方法,耗时等信息
*  `-printcompilation`: 输出已经被JIT编译的方法.

其他参数
* `-t`:  在输出信息前添加一个时间, 表示程序运行的时间
* `-h`:  表示输出多少行后,输出一个表头信息
* `interval`:  统计数据的周期, 单位是毫秒
* `count`:  统计的次数

```
➜  test jstat -gc  -t  2028 5000 5
Timestamp        S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT     GCT
          200.8 4608.0 4096.0  0.0   3152.8 39936.0   8518.2   17920.0    13639.7   27520.0 27031.4 3456.0 3372.0     23    0.078   2      0.149    0.227
          205.9 4608.0 4096.0  0.0   3152.8 39936.0   8518.2   17920.0    13639.7   27520.0 27031.4 3456.0 3372.0     23    0.078   2      0.149    0.227
          210.9 4608.0 4096.0  0.0   3152.8 39936.0   8518.2   17920.0    13639.7   27520.0 27031.4 3456.0 3372.0     23    0.078   2      0.149    0.227
          215.9 4608.0 4096.0  0.0   3152.8 39936.0   8518.2   17920.0    13639.7   27520.0 27031.4 3456.0 3372.0     23    0.078   2      0.149    0.227
          220.9 4608.0 4096.0  0.0   3152.8 39936.0   8518.2   17920.0    13639.7   27520.0 27031.4 3456.0 3372.0     23    0.078   2      0.149    0.227
```

*  `Timestamp` 程序运行的时间
*  `S0C` survive0的大小(单位KB)
*  `S1C` survive1的大小(单位KB)
*  `S0U` survive0使用的大小(单位KB)
*  `S1U` survive1使用的大小(单位KB)
*  `EC` eden区大小(单位KB)
*  `EU` eden区使用的大小(单位KB)
*  `OC` 老年代大小(单位KB)
*  `OU` 老年代使用的大小(单位KB)
*  `MC` 元数据区大小(单位KB)
*  `MU` 元数据区使用大小(单位KB)
*  `CCSC`
*  `CCSU`
*  `YGC` 新生代GC次数
*  `YGCT` 新生代GC耗时
*  `FGC` FullGC次数
*  `FGCT` FullGC耗时
*  `GCT` GC总耗时


## Oracle® Solaris Studio

* [Oracle® Solaris Studio](https://www.oracle.com/tools/developerstudio/downloads/solaris-studio-v123-downloads.html) 这是一款在Linux上使用的监控监控，它的监控端和桌面端都在Linux上。

#### 安装

在Centos上安装Oracle® Solaris Studio. [中文教程](https://docs.oracle.com/cd/E27071_01/html/E26451/gemyt.html#scrolltoc)

首先执行下列命令
```
yum install glibc
yum install elfutils-libelf-devel
yum install zlib
yum install libstdc++
yum install libgcc
```
执行完之后, 会将下列依赖包安装完成
```
glibc
glibc.i686
glibc-devel
glibc-devel.i686
elfutils-libelf-devel 
elfutils-libelf-devel.i686
zlib
zlib.i686
libstdc++
libstdc++.i686
libgcc
libgcc.i686
```

1. 在[下载界面](www.oracle.com/technetwork/server-storage/solarisstudio/downloads/index.html)下载`Oracle Linux/ Red Hat Linux - RPM installer on x86`
2. 运行命令解压`bzcat download_directory/SolarisStudio12.4-linux-x86-rpm.tar.bz2 | /bin/tar -xf -`
3. 进行安装`./solarisstudio.sh --non-interactive`(包含GUI, 也就是我们可以在Linux的桌面上打开Solaris Studio IDE)
4. 验证是否安装成功`/opt/oracle/solarisstudio12.4/bin/analyzer -v`

安装完成后会显示

```
Configuring the installer...
Searching for JVM on the system...
Extracting installation data (can take a while, please wait)...
Running the installer wizard...
/tmp/ossi-c2x_test-20160509142618.silent.log:
[2016-05-09 14:26:18.764]: WARNING - Your OS distribution is not supported. The list of supported systems can be found in the Oracle Solaris Studio documentation. While it might be possible to install Oracle Solaris Studio on your system, it might not function properly.
```

运行analyzer -v显示

```
analyzer: Oracle Solaris Studio 12.4 Performance Analyzer 12.4 Linux_x64 2014/10/21
Java at /usr/java/jdk1.8.0_25/bin/java selected by PATH
java version "1.8.0_25"
Java(TM) SE Runtime Environment (build 1.8.0_25-b17)
Java HotSpot(TM) 64-Bit Server VM (build 25.25-b02, mixed mode)
WARNING: Linux CentOS_6.7 system "c2x_test" is not supported by the Performance tools.
Running /usr/java/jdk1.8.0_25/bin/java -version
/opt/oracle/solarisstudio12.4/bin/analyzer: ERROR: environment variable DISPLAY is not set
```

额外事项

1. 卸载程序 `/opt/oracle/solarisstudio12.4/uninstall.sh --non-interactive`
2. 如果安装时不想要GUI, 只需要在后面加上`--libraries-only`就好了
3. 设置环境变量 `vi /ect/profile` 修改`PATH=$PATH:/opt/oracle/solarisstudio12.4/bin/`

#### 运行

安装完之后打开(`/opt/oracle/developerstudio12.5/bin /analyzer` 文件)，由于在服务器上安装的，只能在本地通过TightVNC打开了

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/OracleSolarisStudio/1.png)

开启Java进程的时候运行下面的命令
```
collect -j on -d /home/bjadmin/game/profile/gateway /home/jdk1.8/bin/java -cp .;./* com.xpec.gateway.GatewayServerMain ./configs
```

想要查看统计结果的话就运行下面的命令
```
[root@c2xceshi profile]# /opt/oracle/developerstudio12.5/bin/analyzer ./zone/test.1.er/
```

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/OracleSolarisStudio/2.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/OracleSolarisStudio/3.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/OracleSolarisStudio/4.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/OracleSolarisStudio/5.png)


## jstack

`jstack`命令用于生成虚拟机当前时刻的线程快照.

线程快照就是当前虚拟机内每一条线程正在执行的方法堆栈的集合,生成线程快照的主要目的是定位线程出现长时间停顿的原因,如[线程间死锁](),[死循环](),请求外部资源导致长时间等待.

```
D:\work\test\target\classes>jstack -help
Usage:
    jstack [-l] <pid>
        (to connect to running process, 连接正在运行的进程)
    jstack -F [-m] [-l] <pid>
        (to connect to a hung process, 连接已经宕掉的进程)
    jstack [-m] [-l] <executable> <core>
        (to connect to a core file, 连接一个core文件)
    jstack [-m] [-l] [server_id@]<remote server IP or hostname>
        (to connect to a remote debug server, 连接一个远程的debug Server)

Options:
    -F  to force a thread dump. Use when jstack <pid> does not respond (process is hung). 当正常输出的请求不被响应时,强制说出线程堆栈
    -m  to print both java and native frames (mixed mode). 如果调用本地方法的话,可以显示c/c++的堆栈
    -l  long listing. Prints additional information about locks. 除堆栈外,显示关于锁的附加信息
    -h or -help to print this help message
```

jstack日志, 下面摘抄的是NETTY中空epoll的一段记录

```
"nioEventLoopGroup-2461-1" #4955 prio=10 os_prio=0 tid=0x00007fd857e9a000 nid=0x5e19 runnable [0x00007fd7374bc000]
   java.lang.Thread.State: RUNNABLE
    at sun.nio.ch.EPollArrayWrapper.epollWait(Native Method)
    at sun.nio.ch.EPollArrayWrapper.poll(EPollArrayWrapper.java:269)
    at sun.nio.ch.EPollSelectorImpl.doSelect(EPollSelectorImpl.java:79)
    at sun.nio.ch.SelectorImpl.lockAndDoSelect(SelectorImpl.java:86)
    - locked <0x00000000e673cf38> (a io.netty.channel.nio.SelectedSelectionKeySet)
    - locked <0x00000000e673cd30> (a java.util.Collections$UnmodifiableSet)
    - locked <0x00000000e673cc58> (a sun.nio.ch.EPollSelectorImpl)
    at sun.nio.ch.SelectorImpl.select(SelectorImpl.java:97)
    at io.netty.channel.nio.NioEventLoop.select(NioEventLoop.java:622)
    at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:310)
    at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:116)
    at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:137)
    at java.lang.Thread.run(Thread.java:745)

   Locked ownable synchronizers:
    - None
```

第一行数据分析   nioEventLoopGroup-2461-1 表示的是进程名字

```
#4955
prio=10
os_prio=0
nid: 线程ID的16进制表示(可以通过`top -H`查看pid)
tid:
runnable
[0x00007fd7374bc000]`
```

线程堆栈信息
```
java.lang.Thread.State 线程状态
locked` 锁住的资源,分别锁住了  <0x00000000e673cf38>, <0x00000000e673cd30>, <0x00000000e673cc58>
```

java.lang.Thread.State 线程状态
*  `Runnable ` : 线程具备所有运行条件，在运行队列中准备操作系统的调度，或者正在运行
*  `waiting for monitor entry` :  在等待进入一个临界区,所以它在`Entry Set`队列中等待.此时线程状态一般都是 `Blocked`:如果大量线程在`waiting for monitor entry`, 可能是一个全局锁阻塞住了大量线程.如果短时间内打印的 `thread dump` 文件反映,随着时间流逝,`waiting for monitor entry`的线程越来越多,没有减少的趋势,可能意味着某些线程在临界区里呆的时间太长了,以至于越来越多新线程迟迟无法进入临界区.

*  `waiting on condition` : 说明它在等待另一个条件的发生,来把自己唤醒,或者干脆它是调用了 `sleep(N)`.如果大量线程在`waiting on condition`：可能是它们又跑去获取第三方资源,尤其是第三方网络资源,迟迟获取不到`Response`,导致大量线程进入等待状态.所以如果你发现有大量的线程都处在 `Wait on condition`,从线程堆栈看,正等待网络读写,这可能是一个网络瓶颈的征兆,因为网络阻塞导致线程无法执行.  此时线程状态大致为以下几种：`java.lang.Thread.State: WAITING (parking)`：一直等那个条件发生；`java.lang.Thread.State: TIMED_WAITING` (`parking`或`sleeping`)：定时的,那个条件不到来,也将定时唤醒自己.
* `in Object.wait()` : 说明它获得了监视器之后,又调用了 `java.lang.Object.wait()` 方法. 每个 Monitor在某个时刻,只能被一个线程拥有,该线程就是 `Active Thread`,而其它线程都是 `Waiting Thread`,分别在两个队列 `Entry Set`和 `Wait Set`里面等候.在 `Entry Set`中等待的线程状态是 `Waiting for monitor entry`,而在 `Wait Set`中等待的线程状态是 `in Object.wait()`.当线程获得了 `Monitor`,如果发现线程继续运行的条件没有满足,它则调用对象(一般就是被 `synchronized` 的对象)的 `wait()` 方法,放弃了 `Monitor`,进入 `Wait Set`队列. 此时线程状态大致为以下几种：1. `java.lang.Thread.State: TIMED_WAITING (on object monitor)`;  2. `java.lang.Thread.State: WAITING (on object monitor)`;


从上面的源码我们可以看到, JStack会根据选项参数来判断是使用[SA JStack tool]() 还是 [VM attach mechanism]() 输出线程的堆栈信息. 在下面的情况下会使用SA JStack tool
* 有`-F`选项
* 有`-m`选项
* 有`<executable> <core> `参数
* 有`[server_id@]<remote server IP or hostname>`参数

## jmap

java内存映射工具,用于生成堆转储快照.

如果不使用jmap命令,想要获取java堆转储快照还有一些比较暴力的手段:
*   `-XX:+HeapDumpOnOutOfMemoryError` :  可以让虚拟机在OOM异常自动生成dump文件,通过
*   `-XX:+HeapDumpOnCtrlBreak` ： 参数则可以使用`[CTRL] + [Break]`: 键让虚拟机生成dump文件,又或者在Linux系统
下通过`kill -3`命令发送进程退出信号,也能拿到dump文件.

jmap的作用并不仅仅是为了获取dump文件,它还可以查询`finalize`执行队列,java堆和永久代的详细信息,如空间使用率,当前使用的是哪种收集器.

和jinfo命令一样,jmap有不少功能是在windows平台下受限的,除了生成dump文件`-dump`选项和用于查看每个类的实例,空间占用统计的`-histo`选项所有系统操作系统都提供之外,其余选项只能在Linux/Solaris下使用.

```
D:\>jmap -help
Usage:
    jmap [option] <pid>
        (to connect to running process)
    jmap [option] <executable <core>
        (to connect to a core file)
    jmap [option] [server_id@]<remote server IP or hostname>
        (to connect to remote debug server)

where <option> is one of:
    <none>               to print same info as Solaris pmap
    -heap                打印Java堆概览
    -histo[:live]        打印Java堆得对象柱状分布图; 如果指定"live" 的话, 那么就只统计存活的对象
    -clstats             打印class 加载的统计信息
    -finalizerinfo       to print information on objects awaiting finalization
    -dump:<dump-options> 以二进制格式dump JVM 堆内存信息 (示例: jmap -dump:live,format=b,file=heap.bin <pid>)
                         dump-options:
                           live         只dump 存活的对象; 如果不指定的话, 堆内存内的所有对象都会被dump出来.
                           format=b     二进制格式
                           file=<file>  dump 堆内存到哪个文件

    -F                   force. Use with -dump:<dump-options> <pid> or -histo to force a heap dump or histogram when <pid> does not respond. The "live" suboption is not supported in this mode.
    -h | -help           to print this help message
    -J<flag>             to pass <flag> directly to the runtime system

```

jmap工具主要选项
*  `-dump`: 生成java堆转储快照.格式为:`-dump:[live,]format=b,file=<filename>`.live表示只dump存活对象
*  `-finalizerinfo`: 显示在`F-Queue`中等待`Finalizer`线程执行`finalize`方法的对象.
*  `-heap`: 显示java堆的详细信息,使用哪种回收器,参数配置,分代状况.
*  `-histo`: 显示堆中对象统计信息,包括类,实例数量和合计容量
*  `-permstat`: 以`ClassLoader`为统计口径显示永久代内存状态.
*  `-F`: 当虚拟机进程对`-dump`选项没有响应时,可使用这个选项强制生成dump快照

获取当前进程的堆快照

```
➜ test jmap -dump:live,format=b,file=2028dump 2028
Dumping heap to /Users/wangming/Desktop/test/2028dump ...
Heap dump file created
```

获取当前进程的对象统计信息, 下面统计出了数量大于10000个对象的类

```
➜ test jmap -histo 2028 | awk '{if($2> 10000) print $1 "  " $2 "  "  $3 "  " $4 }'
1:  36397  6363208  [C
3:  35324  847776  java.lang.String
7:  10522  336704  java.util.concurrent.ConcurrentHashMap$Node
Total  207899  14900384
```

jmap 命令支持三种模式, 分别是本地进程, core文件和远程进程模式.

JMap类是jmap命令的封装实现类. 这个类同样是由参数决定来调用[VM attach mechanism]()还是[SA tool]().

> 现在只有`-heap`,`-finalizerinfo`和`-F`选项下会使用[VM attach mechanism](),其他的情况都是使用[SA tools]().

```java
import java.lang.reflect.Method;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;

import com.sun.tools.attach.VirtualMachine;
import com.sun.tools.attach.AttachNotSupportedException;
import sun.tools.attach.HotSpotVirtualMachine;

public class JMap {

    // 使用 attach mechanism 的选项
    private static String HISTO_OPTION = "-histo";
    private static String LIVE_HISTO_OPTION = "-histo:live";
    private static String DUMP_OPTION_PREFIX = "-dump:";

    // 使用 SA tool 的选项
    private static String SA_TOOL_OPTIONS = "-heap|-heap:format=b|-permstat|-finalizerinfo";

    // The -F (force) option is currently not passed through to SA
    private static String FORCE_SA_OPTION = "-F";

    // Default option (if nothing provided)
    private static String DEFAULT_OPTION = "-pmap";

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            usage(); // no arguments
        }
        boolean useSA = false;
        // 例如选中的选项 (-heap, -dump:*, ... )
        String option = null;
        // 开始遍历所有的选项(选项以-开始). 如果选项中不包含-F, 则应该只有一个选项
        int optionCount = 0;
        while (optionCount < args.length) {
            String arg = args[optionCount];
            if (!arg.startsWith("-")) {
                break;
            }
            // 判断是否是-F选项, 如果是则使用SA
            if (arg.equals(FORCE_SA_OPTION)) {
                useSA = true;
            } else {
                if (option != null) {
                    usage();  // option already specified
                }
                option = arg;
            }
            optionCount++;
        }

        // if no option provided then use default.
        if (option == null) {
            option = DEFAULT_OPTION;
        }
        if (option.matches(SA_TOOL_OPTIONS)) {
            useSA = true;
        }

        // 下面开始检查参数个数. SA Tool只会使用1或者2个参数. 在使用-dump参数时只会使用一个参数
        int paramCount = args.length - optionCount;
        if (paramCount == 0 || paramCount > 2) {
            usage();
        }

        if (optionCount == 0 || paramCount != 1) {
            useSA = true;
        } else {
            // 如果只有一个参数且没办法解析成pid的话, 那么肯定是要连接一个debug server, 也要使用SA Tool
            if (!args[optionCount].matches("[0-9]+")) {
                useSA = true;
            }
        }

        if (useSA) {
            // parameters (<pid> or <exe> <core>)
            String params[] = new String[paramCount];
            for (int i=optionCount; i<args.length; i++ ){
                params[i-optionCount] = args[i];
            }
            runTool(option, params);
        } else {
            // 开始调用VirtualMachine相关的接口方法
            String pid = args[1];
            if (option.equals(HISTO_OPTION)) {
                histo(pid, false);
            } else if (option.equals(LIVE_HISTO_OPTION)) {
                histo(pid, true);
            } else if (option.startsWith(DUMP_OPTION_PREFIX)) {
                dump(pid, option);
            } else {
                usage();
            }
        }
    }

    // 调用 SA tool
    private static void runTool(String option, String args[]) throws Exception {
        String[][] tools = {
                { "-pmap",           "sun.jvm.hotspot.tools.PMap"     },
                { "-heap",           "sun.jvm.hotspot.tools.HeapSummary"     },
                { "-heap:format=b",  "sun.jvm.hotspot.tools.HeapDumper"      },
                { "-histo",          "sun.jvm.hotspot.tools.ObjectHistogram" },
                { "-permstat",       "sun.jvm.hotspot.tools.PermStat"        },
                { "-finalizerinfo",  "sun.jvm.hotspot.tools.FinalizerInfo"   },
        };

        String tool = null;

        // -dump option needs to be handled in a special way
        if (option.startsWith(DUMP_OPTION_PREFIX)) {
            // first check that the option can be parsed
            String fn = parseDumpOptions(option);
            if (fn == null) usage();
            // tool for heap dumping
            tool = "sun.jvm.hotspot.tools.HeapDumper";

            // HeapDumper -f <file>
            args = prepend(fn, args);
            args = prepend("-f", args);
        } else {
            int i=0;
            while (i < tools.length) {
                if (option.equals(tools[i][0])) {
                    tool = tools[i][1];
                    break;
                }
                i++;
            }
        }
        if (tool == null) {
            usage();   // no mapping to tool
        }

        // 加载相关的工具类, PMap, HeapSummary, HeapDumper, ObjectHistogram, PermStat, FinalizerInfo
        Class<?> c = loadClass(tool);
        if (c == null) {
            usage();
        }
        Class[] argTypes = { String[].class } ;
        Method m = c.getDeclaredMethod("main", argTypes);
        Object[] invokeArgs = { args };
        m.invoke(null, invokeArgs);
    }

    private static Class loadClass(String name) {
        try {
            return Class.forName(name, true, ClassLoader.getSystemClassLoader());
        } catch (Exception x)  { }
        return null;
    }

    private static final String LIVE_OBJECTS_OPTION = "-live";
    private static final String ALL_OBJECTS_OPTION = "-all";

    private static void histo(String pid, boolean live) throws IOException {
        VirtualMachine vm = attach(pid);
        InputStream in = ((HotSpotVirtualMachine)vm).
                heapHisto(live ? LIVE_OBJECTS_OPTION : ALL_OBJECTS_OPTION);
        drain(vm, in);
    }

    private static void dump(String pid, String options) throws IOException {
        // 从options中将dump filename解析出来
        String filename = parseDumpOptions(options);
        if (filename == null) {
            usage();  // invalid options or no filename
        }

        // get the canonical path - important to avoid just passing
        // a "heap.bin" and having the dump created in the target VM
        // working directory rather than the directory where jmap
        // is executed.
        filename = new File(filename).getCanonicalPath();

        // 是否只dump 存活的对象
        boolean live = isDumpLiveObjects(options);

        VirtualMachine vm = attach(pid);
        System.out.println("Dumping heap to " + filename + " ...");
        InputStream in = ((HotSpotVirtualMachine)vm).
                dumpHeap((Object)filename,
                        (live ? LIVE_OBJECTS_OPTION : ALL_OBJECTS_OPTION));
        drain(vm, in);
    }

    // 解析-dump选项. 合法的选项为format=b和file=<file>.
    // 如果文件存在的话, 就返回文件名。 如果文件不存在或者是非法选项的话则返回null
    private static String parseDumpOptions(String arg) {
        assert arg.startsWith(DUMP_OPTION_PREFIX);

        String filename = null;
        // 将-dump:后面的参数以, 分割
        String options[] = arg.substring(DUMP_OPTION_PREFIX.length()).split(",");

        for (int i=0; i<options.length; i++) {
            String option = options[i];

            if (option.equals("format=b")) {
                // ignore format (not needed at this time)
            } else if (option.equals("live")) {
                // a valid suboption
            } else {
                // file=<file> - check that <file> is specified
                if (option.startsWith("file=")) {
                    filename = option.substring(5);
                    if (filename.length() == 0) {
                        return null;
                    }
                } else {
                    return null;  // option not recognized
                }
            }
        }
        return filename;
    }

    private static boolean isDumpLiveObjects(String arg) {
        String options[] = arg.substring(DUMP_OPTION_PREFIX.length()).split(",");
        for (String suboption : options) {
            if (suboption.equals("live")) {
                return true;
            }
        }
        return false;
    }

    // Attach to <pid>, existing if we fail to attach
    private static VirtualMachine attach(String pid) {
        try {
            return VirtualMachine.attach(pid);
        } catch (Exception x) {
            String msg = x.getMessage();
            if (msg != null) {
                System.err.println(pid + ": " + msg);
            } else {
                x.printStackTrace();
            }
            if ((x instanceof AttachNotSupportedException) && haveSA()) {
                System.err.println("The -F option can be used when the " +
                        "target process is not responding");
            }
            System.exit(1);
            return null; // keep compiler happy
        }
    }

    // Read the stream from the target VM until EOF, then detach
    private static void drain(VirtualMachine vm, InputStream in) throws IOException {
        // read to EOF and just print output
        byte b[] = new byte[256];
        int n;
        do {
            n = in.read(b);
            if (n > 0) {
                String s = new String(b, 0, n, "UTF-8");
                System.out.print(s);
            }
        } while (n > 0);
        in.close();
        vm.detach();
    }

    // 将arg加入到args中
    private static String[] prepend(String arg, String args[]) {
        String[] newargs = new String[args.length+1];
        newargs[0] = arg;
        System.arraycopy(args, 0, newargs, 1, args.length);
        return newargs;
    }

    private static boolean haveSA() {
        Class c = loadClass("sun.jvm.hotspot.tools.HeapSummary");
        return (c != null);
    }

    // print usage message
    private static void usage() {
        System.out.println("Usage:");
        if (haveSA()) {
            System.out.println("    jmap [option] <pid>");
            System.out.println("        (to connect to running process)");
            System.out.println("    jmap [option] <executable <core>");
            System.out.println("        (to connect to a core file)");
            System.out.println("    jmap [option] [server_id@]<remote server IP or hostname>");
            System.out.println("        (to connect to remote debug server)");
            System.out.println("");
            System.out.println("where <option> is one of:");
            System.out.println("    <none>               to print same info as Solaris pmap");
            System.out.println("    -heap                to print java heap summary");
            System.out.println("    -histo[:live]        to print histogram of java object heap; if the \"live\"");
            System.out.println("                         suboption is specified, only count live objects");
            System.out.println("    -permstat            to print permanent generation statistics");
            System.out.println("    -finalizerinfo       to print information on objects awaiting finalization");
            System.out.println("    -dump:<dump-options> to dump java heap in hprof binary format");
            System.out.println("                         dump-options:");
            System.out.println("                           live         dump only live objects; if not specified,");
            System.out.println("                                        all objects in the heap are dumped.");
            System.out.println("                           format=b     binary format");
            System.out.println("                           file=<file>  dump heap to <file>");
            System.out.println("                         Example: jmap -dump:live,format=b,file=heap.bin <pid>");
            System.out.println("    -F                   force. Use with -dump:<dump-options> <pid> or -histo");
            System.out.println("                         to force a heap dump or histogram when <pid> does not");
            System.out.println("                         respond. The \"live\" suboption is not supported");
            System.out.println("                         in this mode.");
            System.out.println("    -h | -help           to print this help message");
            System.out.println("    -J<flag>             to pass <flag> directly to the runtime system");
        } else {
            System.out.println("    jmap -histo <pid>");
            System.out.println("      (to connect to running process and print histogram of java object heap");
            System.out.println("    jmap -dump:<dump-options> <pid>");
            System.out.println("      (to connect to running process and dump java heap)");
            System.out.println("");
            System.out.println("    dump-options:");
            System.out.println("      format=b     binary default");
            System.out.println("      file=<file>  dump heap to <file>");
            System.out.println("");
            System.out.println("    Example:       jmap -dump:format=b,file=heap.bin <pid>");
        }

        System.exit(1);
    }
}
```

## jinfo

实时查看和调整虚拟机的各项参数

```
jinfo [ option ] pid
Usage:
    jinfo [option] <pid>
        (to connect to running process)
    jinfo [option] <executable <core>
        (to connect to a core file)
    jinfo [option] [server_id@]<remote server IP or hostname>
        (to connect to remote debug server)

where <option> is one of:
    -flag <name>         打印指定name的vm flag的值
    -flag [+|-]<name>    将指定名称的 VM flag打开或者关闭
    -flag <name>=<value> 将指定名称的 VM flag重新设置值
    -flags               打印所有的 VM flags
    -sysprops            打印 Java system properties
    <no option>          如果没有选项的话就是执行上面的所有选项
    -h | -help           to print this help message
```

我们看到jinfo其实支持的是三种模式, 分别是本地进程, core文件和远程进程模式.

```java
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;

import sun.tools.attach.HotSpotVirtualMachine;
import com.sun.tools.attach.VirtualMachine;

public class JInfo {

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            usage(); // no arguments
        }

        boolean useSA = true;
        String arg1 = args[0];
        if (arg1.startsWith("-")) {
            if (arg1.equals("-flags") || arg1.equals("-sysprops")) {
                // SA JInfo 需要 <pid> 或者 <server> 或者(<executable> and <code file>).
                // 因此 包含选项在内的所有参数应该是 2个 或者 3个.
                if (args.length != 2 && args.length != 3) {
                    usage();
                }
            } else if (arg1.equals("-flag")) {
                useSA = false;
            } else {
                usage();
            }
        }

        if (useSA) {
            runTool(args);
        } else {
            if (args.length == 3) {
                String pid = args[2];
                String option = args[1];
                flag(pid, option);
            } else {
                usage();
            }
        }
    }

    // 调用sa tool内部实现的jinfo
    private static void runTool(String args[]) throws Exception {
        String tool = "sun.jvm.hotspot.tools.JInfo";
        Class<?> c = loadClass(tool);
        Class[] argTypes = { String[].class };
        Method m = c.getDeclaredMethod("main", argTypes);

        Object[] invokeArgs = { args };
        m.invoke(null, invokeArgs);
    }

    private static Class loadClass(String name) {
        // 我们指定system class loader是为了在开发环境中 这个类可能在boot class path中，但是sa-jdi.jar却在system class path。
        // 一旦JDK被部署之后tools.jar 和 sa-jdi.jar 都会在system class path中。
        try {
            return Class.forName(name, true, ClassLoader.getSystemClassLoader());
        } catch (Exception x) {
        }
        return null;
    }

    // 调用Attach API 实现的JInfo
    private static void flag(String pid, String option) throws IOException {
        VirtualMachine vm = attach(pid);
        String flag;
        InputStream in;
        int index = option.indexOf('=');
        if (index != -1) {
            flag = option.substring(0, index);
            String value = option.substring(index + 1);
            in = ((HotSpotVirtualMachine) vm).setFlag(flag, value);
        } else {
            char c = option.charAt(0);
            switch (c) {
            case '+':
                flag = option.substring(1);
                in = ((HotSpotVirtualMachine) vm).setFlag(flag, "1");
                break;
            case '-':
                flag = option.substring(1);
                in = ((HotSpotVirtualMachine) vm).setFlag(flag, "0");
                break;
            default:
                flag = option;
                in = ((HotSpotVirtualMachine) vm).printFlag(flag);
                break;
            }
        }

        drain(vm, in);
    }

    // Attach to <pid>, exiting if we fail to attach
    private static VirtualMachine attach(String pid) {
        try {
            return VirtualMachine.attach(pid);
        } catch (Exception x) {
            String msg = x.getMessage();
            if (msg != null) {
                System.err.println(pid + ": " + msg);
            } else {
                x.printStackTrace();
            }
            System.exit(1);
            return null; // keep compiler happy
        }
    }

    // Read the stream from the target VM until EOF, then detach
    private static void drain(VirtualMachine vm, InputStream in) throws IOException {
        // read to EOF and just print output
        byte b[] = new byte[256];
        int n;
        do {
            n = in.read(b);
            if (n > 0) {
                String s = new String(b, 0, n, "UTF-8");
                System.out.print(s);
            }
        } while (n > 0);
        in.close();
        vm.detach();
    }

    // print usage message
    private static void usage() {

        Class c = loadClass("sun.jvm.hotspot.tools.JInfo");
        boolean usageSA = (c != null);

        System.out.println("Usage:");
        if (usageSA) {
            System.out.println("    jinfo [option] <pid>");
            System.out.println("        (to connect to running process)");
            System.out.println("    jinfo [option] <executable <core>");
            System.out.println("        (to connect to a core file)");
            System.out.println("    jinfo [option] [server_id@]<remote server IP or hostname>");
            System.out.println("        (to connect to remote debug server)");
            System.out.println("");
            System.out.println("where <option> is one of:");
            System.out.println("    -flag <name>         to print the value of the named VM flag");
            System.out.println("    -flag [+|-]<name>    to enable or disable the named VM flag");
            System.out.println("    -flag <name>=<value> to set the named VM flag to the given value");
            System.out.println("    -flags               to print VM flags");
            System.out.println("    -sysprops            to print Java system properties");
            System.out.println("    <no option>          to print both of the above");
            System.out.println("    -h | -help           to print this help message");
        } else {
            System.out.println("    jinfo <option> <pid>");
            System.out.println("       (to connect to a running process)");
            System.out.println("");
            System.out.println("where <option> is one of:");
            System.out.println("    -flag <name>         to print the value of the named VM flag");
            System.out.println("    -flag [+|-]<name>    to enable or disable the named VM flag");
            System.out.println("    -flag <name>=<value> to set the named VM flag to the given value");
            System.out.println("    -h | -help           to print this help message");
        }

        System.exit(1);
    }
}
```

JInfo 只有在使用`-flag`选项的时候才会使用[VM Attach API](),其他的选项都是使用[SA tools]()实现的
