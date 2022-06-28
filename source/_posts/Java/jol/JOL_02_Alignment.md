---
category: Java
tag: jol
date: 2016-11-29
title: JOL 02 Alignment
---

本篇文章基于[V0.16 JOLSample_02_Alignment](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_02_Alignment.java)

由于底层操作系统出于保持性能和正确性经常要求要进行对齐访问，因此通常会采用对象的大小对对象属性进行对齐。
在下面的例子中，我们看到long类型的确实是使用8个字节进行对齐的，因此在对象头之后增加了4个字节的补缺进行对齐

```java
import org.openjdk.jol.info.ClassLayout;
import org.openjdk.jol.vm.VM;

import static java.lang.System.out;

public class JOLSample_02_Alignment {

    public static void main(String[] args) throws Exception {
        out.println(VM.current().details());
        out.println(ClassLayout.parseClass(A.class).toPrintable());
    }

    public static class A {
        long f;
    }

}
```

运行结果
```js
# Running 64-bit HotSpot VM.
# Using compressed oop with 3-bit shift.
# Using compressed klass with 3-bit shift.
# Objects are 8 bytes aligned.
# Field sizes by type: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]
# Array element sizes: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]

testjol.JOLSample_02_Alignment$A object internals:
 OFFSET  SIZE  TYPE DESCRIPTION                    VALUE
      0    12       (object header)                N/A
     12     4       (alignment/padding gap)        N/A
     16     8  long A.f                            N/A
Instance size: 24 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total
```

这里long类型的f放在最后是因为当前属性的起始位置减去对象的起始位置的大小必须是当前属性大小的整数倍，这里 12 - 0 / 8 不是整数倍, 所以这里就先填充然后将long放在最后。 
