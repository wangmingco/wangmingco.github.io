---
category: Java
tag: jol
date: 2016-12-05 22:50:00
title: JOL 24 Arrays
---

本篇文章基于[V0.16 JOLSample_24_Arrays](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_24_Arrays.java)

本例演示数组对象布局的复杂性。

你在绝大多数GC下运行下面的例子，你可能会发现数组元素总是根据索引顺序布局的。

如果你在`parallel`GC下运行下面的例子，你可能会注意到新的数组对象元素排列在数组之后，但是GC之后,可能会以相反的顺序重新排列。这是因为GC记录了堆栈上要提升的对象.

运行下面的例子最好加上参数`-XX:ParallelGCThreads=1`

 If you run with almost any GC, then you would notice that array elements are laid out in-order by index.
     
 If you run it with parallel GC, you might notice that fresh object elements are laid out after the array in the forward order, but after GC then can be rearranged in the reverse order. 
 This is because GC records the  to-be-promoted objects on the stack.
    
 This test is better run with -XX:ParallelGCThreads=1.
   
> See also:
>   https://bugs.openjdk.java.net/browse/JDK-8024394

```java
public class JOLSample_24_Arrays {

    public static void main(String[] args) {
        out.println(VM.current().details());

        PrintWriter pw = new PrintWriter(System.out, true);

        Integer[] arr = new Integer[10];
        for (int i = 0; i < 10; i++) {
            arr[i] = i + 256; // boxing outside of Integer cache
        }

        String last = null;
        for (int c = 0; c < 100; c++) {
            String current = GraphLayout.parseInstance((Object) arr).toPrintable();

            if (last == null || !last.equalsIgnoreCase(current)) {
                pw.println(current);
                last = current;
            }

            System.gc();
        }

        pw.close();
    }

}

```

运行结果
```js
# Running 64-bit HotSpot VM.
# Using compressed oop with 3-bit shift.
# Using compressed klass with 3-bit shift.
# WARNING | Compressed references base/shifts are guessed by the experiment!
# WARNING | Therefore, computed addresses are just guesses, and ARE NOT RELIABLE.
# WARNING | Make sure to attach Serviceability Agent to get the reliable addresses.
# Objects are 8 bytes aligned.
# Field sizes by type: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]
# Array element sizes: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]

[Ljava.lang.Integer;@43556938d object externals:
          ADDRESS       SIZE TYPE                 PATH                           VALUE
        76bd8a248         56 [Ljava.lang.Integer;                                [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]
        76bd8a280         16 java.lang.Integer    [0]                            256
        76bd8a290         16 java.lang.Integer    [1]                            257
        76bd8a2a0         16 java.lang.Integer    [2]                            258
        76bd8a2b0         16 java.lang.Integer    [3]                            259
        76bd8a2c0         16 java.lang.Integer    [4]                            260
        76bd8a2d0         16 java.lang.Integer    [5]                            261
        76bd8a2e0         16 java.lang.Integer    [6]                            262
        76bd8a2f0         16 java.lang.Integer    [7]                            263
        76bd8a300         16 java.lang.Integer    [8]                            264
        76bd8a310         16 java.lang.Integer    [9]                            265

Addresses are stable after 1 tries.


[Ljava.lang.Integer;@43556938d object externals:
          ADDRESS       SIZE TYPE                 PATH                           VALUE
        6c003e3c8         56 [Ljava.lang.Integer;                                [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]
        6c003e400      28488 (something else)     (somewhere else)               (something else)
        6c0045348         16 java.lang.Integer    [9]                            265
        6c0045358         16 java.lang.Integer    [8]                            264
        6c0045368         16 java.lang.Integer    [7]                            263
        6c0045378         16 java.lang.Integer    [6]                            262
        6c0045388         16 java.lang.Integer    [5]                            261
        6c0045398         16 java.lang.Integer    [4]                            260
        6c00453a8         16 java.lang.Integer    [3]                            259
        6c00453b8         16 java.lang.Integer    [2]                            258
        6c00453c8         16 java.lang.Integer    [1]                            257
        6c00453d8         16 java.lang.Integer    [0]                            256

Addresses are stable after 1 tries.


[Ljava.lang.Integer;@43556938d object externals:
          ADDRESS       SIZE TYPE                 PATH                           VALUE
        6c003e2d8         56 [Ljava.lang.Integer;                                [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]
        6c003e310      26136 (something else)     (somewhere else)               (something else)
        6c0044928         16 java.lang.Integer    [9]                            265
        6c0044938         16 java.lang.Integer    [8]                            264
        6c0044948         16 java.lang.Integer    [7]                            263
        6c0044958         16 java.lang.Integer    [6]                            262
        6c0044968         16 java.lang.Integer    [5]                            261
        6c0044978         16 java.lang.Integer    [4]                            260
        6c0044988         16 java.lang.Integer    [3]                            259
        6c0044998         16 java.lang.Integer    [2]                            258
        6c00449a8         16 java.lang.Integer    [1]                            257
        6c00449b8         16 java.lang.Integer    [0]                            256

Addresses are stable after 1 tries.


[Ljava.lang.Integer;@43556938d object externals:
          ADDRESS       SIZE TYPE                 PATH                           VALUE
        6c003bb30         56 [Ljava.lang.Integer;                                [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]
        6c003bb68      26136 (something else)     (somewhere else)               (something else)
        6c0042180         16 java.lang.Integer    [9]                            265
        6c0042190         16 java.lang.Integer    [8]                            264
        6c00421a0         16 java.lang.Integer    [7]                            263
        6c00421b0         16 java.lang.Integer    [6]                            262
        6c00421c0         16 java.lang.Integer    [5]                            261
        6c00421d0         16 java.lang.Integer    [4]                            260
        6c00421e0         16 java.lang.Integer    [3]                            259
        6c00421f0         16 java.lang.Integer    [2]                            258
        6c0042200         16 java.lang.Integer    [1]                            257
        6c0042210         16 java.lang.Integer    [0]                            256

Addresses are stable after 1 tries.
```