---
category: Java
tag: jol
date: 2016-12-03
title: JOL 27 Colocation 
---

本篇文章基于[V0.16 JOLSample_27_Colocation](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_27_Colocation.java)

 /*
     * This is the example how VM colocates the objects allocated
     * by different threads.
     *
     * In this example, the ConcurrentHashMap is being populated
     * by several threads. We can see that after a few GCs it is
     * densely packed, regardless of the fact it was allocated by
     * multiple threads.
     *
     * This example generates PNG images in your current directory.
     *
     * Run this test with -Xmx1g -XX:+UseParallelGC -XX:ParallelGCThreads=1
     * for best results.
     */


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

运行结果
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-1-new.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-2-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-3-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-4-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-5-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-6-more-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-7-more-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-8-more-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-9-more-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/27_Colocation/chm-10-more-gc.png)
