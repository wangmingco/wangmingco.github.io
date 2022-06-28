---
category: Java
tag: jol
date: 2016-12-05 22:50:00
title: JOL 24 Arrays
---

本篇文章基于[V0.16 JOLSample_24_Arrays](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_24_Arrays.java)


 /*
     * This example shows the array layout quirks.
     *
     * If you run with almost any GC, then you would notice
     * that array elements are laid out in-order by index.
     *
     * If you run it with parallel GC, you might notice that
     * fresh object elements are laid out after the array in
     * the forward order, but after GC then can be rearranged
     * in the reverse order. This is because GC records the
     * to-be-promoted objects on the stack.
     *
     * This test is better run with -XX:ParallelGCThreads=1.
     *
     * See also:
     *   https://bugs.openjdk.java.net/browse/JDK-8024394
     */

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
        6c003a360         56 [Ljava.lang.Integer;                                [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]
        6c003a398      31520 (something else)     (somewhere else)               (something else)
        6c0041eb8         16 java.lang.Integer    [9]                            265
        6c0041ec8         16 java.lang.Integer    [8]                            264
        6c0041ed8         16 java.lang.Integer    [7]                            263
        6c0041ee8         16 java.lang.Integer    [6]                            262
        6c0041ef8         16 java.lang.Integer    [5]                            261
        6c0041f08         16 java.lang.Integer    [4]                            260
        6c0041f18         16 java.lang.Integer    [3]                            259
        6c0041f28         16 java.lang.Integer    [2]                            258
        6c0041f38         16 java.lang.Integer    [1]                            257
        6c0041f48         16 java.lang.Integer    [0]                            256

Addresses are stable after 1 tries.


[Ljava.lang.Integer;@43556938d object externals:
          ADDRESS       SIZE TYPE                 PATH                           VALUE
        6c0035058         56 [Ljava.lang.Integer;                                [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]
        6c0035090      29168 (something else)     (somewhere else)               (something else)
        6c003c280         16 java.lang.Integer    [9]                            265
        6c003c290         16 java.lang.Integer    [8]                            264
        6c003c2a0         16 java.lang.Integer    [7]                            263
        6c003c2b0         16 java.lang.Integer    [6]                            262
        6c003c2c0         16 java.lang.Integer    [5]                            261
        6c003c2d0         16 java.lang.Integer    [4]                            260
        6c003c2e0         16 java.lang.Integer    [3]                            259
        6c003c2f0         16 java.lang.Integer    [2]                            258
        6c003c300         16 java.lang.Integer    [1]                            257
        6c003c310         16 java.lang.Integer    [0]                            256

Addresses are stable after 1 tries.


[Ljava.lang.Integer;@43556938d object externals:
          ADDRESS       SIZE TYPE                 PATH                           VALUE
        6c0033de8         56 [Ljava.lang.Integer;                                [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]
        6c0033e20      29168 (something else)     (somewhere else)               (something else)
        6c003b010         16 java.lang.Integer    [9]                            265
        6c003b020         16 java.lang.Integer    [8]                            264
        6c003b030         16 java.lang.Integer    [7]                            263
        6c003b040         16 java.lang.Integer    [6]                            262
        6c003b050         16 java.lang.Integer    [5]                            261
        6c003b060         16 java.lang.Integer    [4]                            260
        6c003b070         16 java.lang.Integer    [3]                            259
        6c003b080         16 java.lang.Integer    [2]                            258
        6c003b090         16 java.lang.Integer    [1]                            257
        6c003b0a0         16 java.lang.Integer    [0]                            256

Addresses are stable after 1 tries.
```