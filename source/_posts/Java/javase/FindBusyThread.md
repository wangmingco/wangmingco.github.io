---
category: Java
tag: JavaSE
date: 2018-04-12
title: 分析占用了大量 CPU 处理时间的是Java 进程中哪个线程
---

在Linux上运行下面程序

```java
import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class Test {

    public static void main(String[] args) throws InterruptedException {
        AtomicInteger atomicLong = new AtomicInteger();

        Thread adder = new Thread(() -> {
            while (true) atomicLong.addAndGet(1);
        });

        Thread printer = new Thread(() -> {
            while (true) {
                System.out.println(LocalDateTime.now() + " : " + atomicLong.get());
                try {
                    TimeUnit.SECONDS.sleep(3);
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
        });

        adder.start();
        printer.start();
        adder.join();
        printer.join();
    }
}
```

然后执行下面的命令

[@asciinema](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/videos/find_busy_thread.cast)

整个查找过程很简单，就是通过`top -H -p tid` 这个命令找到最繁忙的线程id, 然后用`jstack` 命令导出该进程所有的线程信息，然后用top找到的线程id从jstack导出的文件里进行过滤查找。