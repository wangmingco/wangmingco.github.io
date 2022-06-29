---
category: Java
tag: jol
date: 2016-12-06  09:00:00
title: JOL 26 Defragmentation
---

本篇文章基于[V0.16 JOLSample_26_Defragmentation](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_26_Defragmentation.java)

本例是用来演示VM如何对堆进行碎片整理的。

在本例中我们有一个对象数组，这些对象很紧密地分配在了一起，而且在多次GC中都存活了下来。然后我们随机清理一半的元素。现在对象布局就很稀疏了。
然后继续GC。

运行这个例子最好使用参数
```
-Xmx1g -XX:+UseParallelGC -XX:ParallelGCThreads=1
```


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

1. 先分配了100万个临时小对象，然后GC掉

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-1-new.png)

2. 接着给数组对象分配1个小对象，现在是数组对象后面跟着1个Object对象。然后输出

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-2-before.png)

3. 继续分配100万个临时小对象，GC。输出为

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-3-before.png)

4.  继续分配100万个临时小对象，GC。输出为

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-4-before.png)

5.  继续分配100万个临时小对象，GC。输出为

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-5-before.png)

6. 清理掉一半的数组对象，输出为

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-6-after.png)

7.  继续分配100万个临时小对象，GC。输出为

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-7-after-gc.png)

8.  继续分配100万个临时小对象，GC。输出为

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-8-after-gc.png)

9.  继续分配100万个临时小对象，GC。输出为

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-9-after-gc.png)

10.  继续分配100万个临时小对象，GC。输出为

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jol/26_Defragmentation/array-10-after-gc.png)

通过整个过程我们可以看到，第一次多次生成临时对象和第二次多次生成临时对象，它们的内存分配地址就不再发生变化了，这也验证了上篇文章中的说法，每次GC之后又回到了相同的起始地址。