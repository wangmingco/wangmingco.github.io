---
category: Java
tag: jol
date: 2016-12-06  10:00:00
title: JOL 27 Colocation 
---

本篇文章基于[V0.16 JOLSample_27_Colocation](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_27_Colocation.java)

这篇例子用来演示VM如何管理不同线程分配的对象。

在例子中，`ConcurrentHashMap` 被多个线程填充。我们可以看到经过几次GC之后，虽然它存储的对象是来自多个线程，但是它仍然被填充地非常密集。

运行这个例子最好使用参数
```
-Xmx1g -XX:+UseParallelGC -XX:ParallelGCThreads=1
```

```java
public class JOLSample_27_Colocation {

    public static volatile Object sink;

    public static void main(String[] args) throws Exception {
        out.println(VM.current().details());

        // allocate some objects to beef up generations
        for (int c = 0; c < 1000000; c++) {
            sink = new Object();
        }
        System.gc();

        final int COUNT = 1000;

        ConcurrentHashMap<Object, Object> chm = new ConcurrentHashMap<>();

        addElements(COUNT, chm);

        GraphLayout.parseInstance(chm).toImage("chm-1-new.png");

        for (int c = 2; c <= 5; c++) {
            GraphLayout.parseInstance(chm).toImage("chm-" + c + "-gc.png");
            System.gc();
        }

        addElements(COUNT, chm);

        for (int c = 6; c <= 10; c++) {
            GraphLayout.parseInstance(chm).toImage("chm-" + c + "-more-gc.png");
            System.gc();
        }

    }

    private static void addElements(final int count, final Map<Object, Object> chm) throws InterruptedException {
        ExecutorService pool = Executors.newCachedThreadPool();

        Runnable task = new Runnable() {
            @Override
            public void run() {
                for (int c = 0; c < count; c++) {
                    Object o = new Object();
                    chm.put(o, o);
                }
            }
        };

        for (int t = 0; t < Runtime.getRuntime().availableProcessors() * 2; t++) {
            pool.submit(task);
        }

        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.DAYS);
    }

}

```

1. 先分配了100万个临时小对象，然后GC, 接着继续往ConcurrentHashMap添加100个小对象，然后输出

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-1-new.png)

2. 再输出一次

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-2-gc.png)

3. GC一次，再输出一次

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-3-gc.png)

4. GC一次，再输出一次

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-4-gc.png)

5. GC一次，再输出一次

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-5-gc.png)

6. 继续往ConcurrentHashMap添加100个小对象，然后输出

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-6-more-gc.png)

7. GC一次，再输出一次

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-7-more-gc.png)

8. GC一次，再输出一次

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-8-more-gc.png)

9. GC一次，再输出一次

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-9-more-gc.png)

10. GC一次，再输出一次

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-10-more-gc.png)
