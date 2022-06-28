---
category: Java
tag: jol
date: 2016-12-07
title: JOL 28 Difference
---

本篇文章基于[V0.16 JOLSample_28_Difference](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_28_Difference.java)

  /*
     * This is the example how would one use the GraphLayout differences to
     * figure out the object graph changes.
     *
     * Here, we have the ConcurrentHashMap, and three measurements:
     *   1) The initial CHM that has no backing storage;
     *   2) After adding the first KV pair, when both KV pair is allocated,
     *      and the backing storage is allocated;
     *   3) After adding the second KV pair.
     *
     * An API for subtracting the GraphLayouts helps to show the difference
     * between the snapshots. Note that differences are based on object
     * addresses, so if GC moves under our feet, the difference is unreliable.
     * It is a good idea to keep the allocations at minimum between the snapshots.
     */

```java
public class JOLSample_28_Difference {

    public static void main(String[] args) {
        out.println(VM.current().details());

        Map<String, String> chm = new ConcurrentHashMap<>();

        GraphLayout gl1 = GraphLayout.parseInstance(chm);

        chm.put("Foo", "Bar");
        GraphLayout gl2 = GraphLayout.parseInstance(chm);

        chm.put("Foo2", "Bar2");
        GraphLayout gl3 = GraphLayout.parseInstance(chm);

        System.out.println(gl2.subtract(gl1).toPrintable());
        System.out.println(gl3.subtract(gl2).toPrintable());
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

 object externals:
          ADDRESS       SIZE TYPE                                           PATH                           VALUE
        76bdd9298         24 java.lang.String                               .table[7].key                  (object)
        76bdd92b0         24 [C                                             .table[7].key.value            [F, o, o]
        76bdd92c8         24 java.lang.String                               .table[7].val                  (object)
        76bdd92e0         24 [C                                             .table[7].val.value            [B, a, r]
        76bdd92f8         80 [Ljava.util.concurrent.ConcurrentHashMap$Node; .table                         [null, null, null, null, null, null, null, (object), null, null, null, null, null, (object), null, null]
        76bdd9348         32 java.util.concurrent.ConcurrentHashMap$Node    .table[7]                      (object)

Addresses are stable after 1 tries.


 object externals:
          ADDRESS       SIZE TYPE                                        PATH                           VALUE
        76bddac78         24 java.lang.String                            .table[13].key                 (object)
        76bddac90         24 [C                                          .table[13].key.value           [F, o, o, 2]
        76bddaca8         24 java.lang.String                            .table[13].val                 (object)
        76bddacc0         24 [C                                          .table[13].val.value           [B, a, r, 2]
        76bddacd8         32 java.util.concurrent.ConcurrentHashMap$Node .table[13]                     (object)

Addresses are stable after 1 tries.
```