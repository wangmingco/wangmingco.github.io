---
category: Java
tag: jol
date: 2016-12-03
title: JOL 26 Defragmentation
---

本篇文章基于[V0.16 JOLSample_26_Defragmentation](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_26_Defragmentation.java)

  /*
     * This is the example how VM defragments the heap.
     *
     * In this example, we have the array of objects, which
     * is densely allocated, and survives multiple GCs as
     * the dense structure. Then, we randomly purge half of
     * the elements. Now the memory layout is sparse. Subsequent
     * GCs take care of that.
     *
     * This example generates PNG images in your current directory.
     *
     * Run this test with -Xmx1g -XX:+UseParallelGC -XX:ParallelGCThreads=1
     * for best results.
     */

```java
public class JOLSample_26_Defragmentation {

    public static volatile Object sink;

    public static void main(String[] args) throws Exception {
        out.println(VM.current().details());

        // allocate some objects to beef up generations
        for (int t = 0; t < 1000000; t++) {
            sink = new Object();
        }
        System.gc();

        final int COUNT = 10000;

        Object[] array = new Object[COUNT];
        for (int c = 0; c < COUNT; c++) {
            array[c] = new Object();
        }

        Object obj = array;

        GraphLayout.parseInstance(obj).toImage("array-1-new.png");

        for (int c = 2; c <= 5; c++) {
            for (int t = 0; t < 1000000; t++) {
                sink = new Object();
            }
            System.gc();
            GraphLayout.parseInstance(obj).toImage("array-" + c + "-before.png");
        }

        for (int c = 0; c < COUNT; c++) {
            if (Math.random() < 0.5) {
                array[c] = null;
            }
        }

        GraphLayout.parseInstance(obj).toImage("array-6-after.png");

        for (int c = 7; c <= 10; c++) {
            for (int t = 0; t < 1000000; t++) {
                sink = new Object();
            }
            System.gc();
            GraphLayout.parseInstance(obj).toImage("array-" + c + "-after-gc.png");
        }
    }

}

```

运行结果

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-1-new.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-2-before.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-3-before.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-4-before.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-5-before.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-6-after.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-7-after-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-8-after-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-9-after-gc.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-10-after-gc.png)
