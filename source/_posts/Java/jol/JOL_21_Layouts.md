---
category: Java
tag: jol
date: 2016-12-04 20:50:00
title: JOL 21 Layouts
---

本篇文章基于[V0.16 JOLSample_21_Layouts](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_21_Layouts.java)

本例也是用来演示可达性图分析。

在本例中，我们看到在冲突下，HashMap降级为链表。在JDK 8中，我们还可以看到它进一步“退化”到树上。


```java
public class JOLSample_21_Layouts {
   
    public static void main(String[] args) {
        out.println(VM.current().details());

        PrintWriter pw = new PrintWriter(System.out, true);

        Map<Dummy, Void> map = new HashMap<>();

        map.put(new Dummy(1), null);
        map.put(new Dummy(2), null);

        System.gc();
        pw.println(GraphLayout.parseInstance(map).toPrintable());

        map.put(new Dummy(2), null);
        map.put(new Dummy(2), null);
        map.put(new Dummy(2), null);
        map.put(new Dummy(2), null);

        System.gc();
        pw.println(GraphLayout.parseInstance(map).toPrintable());

        for (int c = 0; c < 12; c++) {
            map.put(new Dummy(2), null);
        }

        System.gc();
        pw.println(GraphLayout.parseInstance(map).toPrintable());

        pw.close();
    }

    /**
     * Dummy class which controls the hashcode and is decently Comparable.
     */
    public static class Dummy implements Comparable<Dummy> {
        static int ID;
        final int id = ID++;
        final int hc;

        public Dummy(int hc) {
            this.hc = hc;
        }

        @Override
        public boolean equals(Object o) {
            return (this == o);
        }

        @Override
        public int hashCode() {
            return hc;
        }

        @Override
        public int compareTo(Dummy o) {
            return Integer.compare(id, o.id);
        }
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

java.util.HashMap@43556938d object externals:
          ADDRESS       SIZE TYPE                                               PATH                           VALUE
        6c001a280         48 java.util.HashMap                                                                 (object)
        6c001a2b0      28736 (something else)                                   (somewhere else)               (something else)
        6c00212f0         80 [Ljava.util.HashMap$Node;                          .table                         [null, (object), (object), null, null, null, null, null, null, null, null, null, null, null, null, null]
        6c0021340         32 java.util.HashMap$Node                             .table[2]                      (object)
        6c0021360         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].key                  (object)
        6c0021378         32 java.util.HashMap$Node                             .table[1]                      (object)
        6c0021398         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[1].key                  (object)

Addresses are stable after 1 tries.


java.util.HashMap@43556938d object externals:
          ADDRESS       SIZE TYPE                                               PATH                           VALUE
        6c0019e80         48 java.util.HashMap                                                                 (object)
        6c0019eb0      28736 (something else)                                   (somewhere else)               (something else)
        6c0020ef0         80 [Ljava.util.HashMap$Node;                          .table                         [null, (object), (object), null, null, null, null, null, null, null, null, null, null, null, null, null]
        6c0020f40         32 java.util.HashMap$Node                             .table[2]                      (object)
        6c0020f60         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].key                  (object)
        6c0020f78         32 java.util.HashMap$Node                             .table[1]                      (object)
        6c0020f98         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[1].key                  (object)
        6c0020fb0    1706864 (something else)                                   (somewhere else)               (something else)
        6c01c1b20         32 java.util.HashMap$Node                             .table[2].next                 (object)
        6c01c1b40         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].next.key             (object)
        6c01c1b58         32 java.util.HashMap$Node                             .table[2].next.next            (object)
        6c01c1b78         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].next.next.key        (object)
        6c01c1b90         32 java.util.HashMap$Node                             .table[2].next.next.next       (object)
        6c01c1bb0         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].next.next.next.key   (object)
        6c01c1bc8         32 java.util.HashMap$Node                             .table[2].next.next.next.next  (object)
        6c01c1be8         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].next.next.next.next.key (object)

Addresses are stable after 1 tries.


java.util.HashMap@43556938d object externals:
          ADDRESS       SIZE TYPE                                               PATH                           VALUE
        6c0018c10         48 java.util.HashMap                                                                 (object)
        6c0018c40      28736 (something else)                                   (somewhere else)               (something else)
        6c001fc80         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].next.key             (object)
        6c001fc98         32 java.util.HashMap$Node                             .table[1]                      (object)
        6c001fcb8         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[1].key                  (object)
        6c001fcd0    1698848 (something else)                                   (somewhere else)               (something else)
        6c01be8f0         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].left.key             (object)
        6c01be908         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.left.left.prev.key (object)
        6c01be920         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].key                  (object)
        6c01be938         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.left.left.key  (object)
        6c01be950       5040 (something else)                                   (somewhere else)               (something else)
        6c01bfd00         56 java.util.HashMap$TreeNode                         .table[2].right.right          (object)
        6c01bfd38         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.right.key      (object)
        6c01bfd50         56 java.util.HashMap$TreeNode                         .table[2].right.right.next     (object)
        6c01bfd88         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.right.next.key (object)
        6c01bfda0         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.left.key       (object)
        6c01bfdb8         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.prev.key       (object)
        6c01bfdd0         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.key            (object)
        6c01bfde8         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.next.key       (object)
        6c01bfe00         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.next.parent.key (object)
        6c01bfe18         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.next.parent.right.key (object)
        6c01bfe30        312 (something else)                                   (somewhere else)               (something else)
        6c01bff68         56 java.util.HashMap$TreeNode                         .table[2].right                (object)
        6c01bffa0         56 java.util.HashMap$TreeNode                         .table[2].right.next           (object)
        6c01bffd8         56 java.util.HashMap$TreeNode                         .table[2].right.next.parent    (object)
        6c01c0010         56 java.util.HashMap$TreeNode                         .table[2].right.next.parent.right (object)
        6c01c0048         56 java.util.HashMap$TreeNode                         .table[2].right.right.right.right.right (object)
        6c01c0080         56 (something else)                                   (somewhere else)               (something else)
        6c01c00b8        272 [Ljava.util.HashMap$Node;                          .table                         [null, (object), (object), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
        6c01c01c8         56 java.util.HashMap$TreeNode                         .table[2]                      (object)
        6c01c0200         56 java.util.HashMap$TreeNode                         .table[2].next                 (object)
        6c01c0238         56 java.util.HashMap$TreeNode                         .table[2].left                 (object)
        6c01c0270         56 java.util.HashMap$TreeNode                         .table[2].right.left.left.prev (object)
        6c01c02a8         56 java.util.HashMap$TreeNode                         .table[2].right.left.left      (object)
        6c01c02e0         56 java.util.HashMap$TreeNode                         .table[2].right.left           (object)
        6c01c0318         56 java.util.HashMap$TreeNode                         .table[2].right.prev           (object)
        6c01c0350         56 java.util.HashMap$TreeNode                         .table[2].right.right.right.right (object)
        6c01c0388         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.right.right.right.key (object)
        6c01c03a0         56 java.util.HashMap$TreeNode                         .table[2].right.right.right    (object)
        6c01c03d8         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.right.right.key (object)
        6c01c03f0         56 java.util.HashMap$TreeNode                         .table[2].right.right.right.next (object)
        6c01c0428         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.right.right.next.key (object)
        6c01c0440         24 org.openjdk.jol.samples.JOLSample_21_Layouts$Dummy .table[2].right.right.right.right.right.key (object)

Addresses are stable after 1 tries.
```