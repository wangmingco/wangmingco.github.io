---
category: Java
tag: jol
date: 2016-12-04
title: JOL 19 AL_LL
---

本篇文章基于[V0.16 ](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/.java)

这个例子用于展示遍历可达性图。
The example of traversing the reachability graphs.

In addition to introspecting the object internals, we can also see the object externals, that is, the objects referenced from the object in question. There are multiple ways to illustrate this, the summary table seems to work well.

In this example, you can clearly see the difference between the shadow heap (i.e. space taken by the reachable objects) for ArrayList and LinkedList.

 When several roots are handed over to JOL, it tracks the objects reachable from either root, and also avoids double-counting.


```java
public class JOLSample_19_AL_LL {

    public static void main(String[] args) {
        out.println(VM.current().details());

        ArrayList<Integer> al = new ArrayList<>();
        LinkedList<Integer> ll = new LinkedList<>();

        for (int i = 0; i < 1000; i++) {
            Integer io = i; // box once
            al.add(io);
            ll.add(io);
        }

        al.trimToSize();

        PrintWriter pw = new PrintWriter(out);
        pw.println(GraphLayout.parseInstance(al).toFootprint());
        pw.println(GraphLayout.parseInstance(ll).toFootprint());
        pw.println(GraphLayout.parseInstance(al, ll).toFootprint());
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

java.util.ArrayList@43556938d footprint:
     COUNT       AVG       SUM   DESCRIPTION
         1      4016      4016   [Ljava.lang.Object;
      1000        16     16000   java.lang.Integer
         1        24        24   java.util.ArrayList
      1002               20040   (total)


java.util.LinkedList@5579bb86d footprint:
     COUNT       AVG       SUM   DESCRIPTION
      1000        16     16000   java.lang.Integer
         1        32        32   java.util.LinkedList
      1000        24     24000   java.util.LinkedList$Node
      2001               40032   (total)


java.util.ArrayList@43556938d, java.util.LinkedList@5579bb86d footprint:
     COUNT       AVG       SUM   DESCRIPTION
         1      4016      4016   [Ljava.lang.Object;
      1000        16     16000   java.lang.Integer
         1        24        24   java.util.ArrayList
         1        32        32   java.util.LinkedList
      1000        24     24000   java.util.LinkedList$Node
      2003               44072   (total)
```