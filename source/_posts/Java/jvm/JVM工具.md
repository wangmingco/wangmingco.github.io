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
