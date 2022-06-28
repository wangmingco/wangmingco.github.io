---
category: Java
tag: jol
date: 2016-11-29
title: JOL 03 Packing
---

本篇文章基于[V0.16 JOLSample_03_Packing](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_03_Packing.java)

VM 会将字段组合在一起，以便最小化的内存占用。
在下面的例子中，我们看到对象属性的对齐方式是 按照大小的  8->4->2->1 的顺序来对齐的。我们先在前面使用属性教大的，然后在后面使用属性较小的来填充属性较大的留下的空缺。

```java
import org.openjdk.jol.info.ClassLayout;
import org.openjdk.jol.vm.VM;

import static java.lang.System.out;

public class JOLSample_03_Packing {

    public static void main(String[] args) throws Exception {
        out.println(VM.current().details());
        out.println(ClassLayout.parseClass(A.class).toPrintable());
    }

    public static class A {
        boolean bo1, bo2;
        byte b1, b2;
        char c1, c2;
        double d1, d2;
        float f1, f2;
        int i1, i2;
        long l1, l2;
        short s1, s2;
    }

}
```


```js
# Running 64-bit HotSpot VM.
# Using compressed oop with 3-bit shift.
# Using compressed klass with 3-bit shift.
# Objects are 8 bytes aligned.
# Field sizes by type: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]
# Array element sizes: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]

testjol.JOLSample_03_Packing$A object internals:
 OFFSET  SIZE    TYPE DESCRIPTION                    VALUE
      0    12         (object header)                N/A
     12     4   float A.f1                           N/A
     16     8  double A.d1                           N/A
     24     8  double A.d2                           N/A
     32     8    long A.l1                           N/A
     40     8    long A.l2                           N/A
     48     4   float A.f2                           N/A
     52     4     int A.i1                           N/A
     56     4     int A.i2                           N/A
     60     2    char A.c1                           N/A
     62     2    char A.c2                           N/A
     64     2   short A.s1                           N/A
     66     2   short A.s2                           N/A
     68     1 boolean A.bo1                          N/A
     69     1 boolean A.bo2                          N/A
     70     1    byte A.b1                           N/A
     71     1    byte A.b2                           N/A
Instance size: 72 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

