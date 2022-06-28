---
category: Java
tag: jol
date: 2016-11-29 09:05:00
title: JOL 01 Basic
---

本篇文章基于[V0.16 JOLSample_01_Basic](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_01_Basic.java)

这个例子演示 了最基本的对象字段布局：
* 对象头消耗多少内存
* 对象属性是如何布局的
* 对象大小是如何对齐的

```Java
import org.openjdk.jol.info.ClassLayout;
import org.openjdk.jol.vm.VM;

import static java.lang.System.out;

public class JOLSample_01_Basic {

    public static void main(String[] args) throws Exception {
        out.println(VM.current().details());
        out.println(ClassLayout.parseClass(A.class).toPrintable());
    }

    public static class A {
        boolean f;
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

testjol.JOLSample_01_Basic$A object internals:
 OFFSET  SIZE    TYPE DESCRIPTION                    VALUE
      0    12         (object header)                N/A
     12     1 boolean A.f                            N/A
     13     3         (loss due to the next object alignment)
Instance size: 16 bytes
Space losses: 0 bytes internal + 3 bytes external = 3 bytes total
```

对象头占用了12个byte, `A.f`属性占用一个byte, 使用3个byte进行对象大小对齐. 实例大小是 16bytes