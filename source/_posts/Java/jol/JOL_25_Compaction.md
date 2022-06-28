---
category: Java
tag: jol
date: 2016-12-03
title: JOL 25 Compaction
---

本篇文章基于[V0.16 JOLSample_25_Compaction](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_25_Compaction.java)

这个例子是用于展示VM是如何紧凑对象的。

     *
     * You can see the freshly allocated and populated list has quite
     * the sparse layout. It happens because many temporary objects are
     * allocated while populating the list. The subsequent GCs compact
     * the list into the one or few dense blocks.
     *
     * Run this test with -Xmx1g -XX:+UseParallelGC -XX:ParallelGCThreads=1
     * for best results.
     */


```java
public class JOLSample_25_Compaction {

    public static volatile Object sink;

    public static void main(String[] args) throws Exception {
        out.println(VM.current().details());

        // allocate some objects to beef up generations
        for (int c = 0; c < 1000000; c++) {
            sink = new Object();
        }

        System.gc();

        List<String> list = new ArrayList<>();
        for (int c = 0; c < 1000; c++) {
            list.add("Key" + c);
        }

        for (int c = 1; c <= 10; c++) {
            GraphLayout.parseInstance(list).toImage("list-" + c + ".png");
            System.gc();
        }
    }
}
```

运行结果
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-1.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-2.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-3.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-4.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-5.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-6.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-7.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-8.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-9.png)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/25_Compaction/list-10.png)