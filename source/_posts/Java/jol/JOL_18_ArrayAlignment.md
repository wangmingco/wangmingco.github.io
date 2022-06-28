---
category: Java
tag: jol
date: 2016-12-03
title: JOL 18 ArrayAlignment
---

本篇文章基于[V0.16 JOLSample_18_ArrayAlignment](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_18_ArrayAlignment.java)

这个例子用于展示数组对齐。通过运行结果可以看到，不同大小的小数组，由于对齐的原因，它们占用的空间也许是一样的。

数组的内部对齐需要在特定的VM模型上展示，例如，在32位的模型上展示 `long[]` 数组。在那种模型上，`long[]` 数组第0个元素应该按8对齐。

或者64位模式关闭指针压缩的情况下，展示`byte[]`数组。参考[bug-JDK-8139457](https://bugs.openjdk.java.net/browse/JDK-8139457)

```java
public class JOLSample_18_ArrayAlignment {

    public static void main(String[] args) {
        out.println(VM.current().details());
        out.println(ClassLayout.parseInstance(new long[0]).toPrintable());
        for (int size = 0; size <= 8; size++) {
            out.println(ClassLayout.parseInstance(new byte[size]).toPrintable());
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

[J object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80001a9
 12   4        (array length)            0
 12   4        (alignment/padding gap)   
 16   0   long [J.<elements>             N/A
Instance size: 16 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            0
 12   4        (alignment/padding gap)   
 16   0   byte [B.<elements>             N/A
Instance size: 16 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            1
 12   4        (alignment/padding gap)   
 16   1   byte [B.<elements>             N/A
 17   7        (object alignment gap)    
Instance size: 24 bytes
Space losses: 4 bytes internal + 7 bytes external = 11 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            2
 12   4        (alignment/padding gap)   
 16   2   byte [B.<elements>             N/A
 18   6        (object alignment gap)    
Instance size: 24 bytes
Space losses: 4 bytes internal + 6 bytes external = 10 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            3
 12   4        (alignment/padding gap)   
 16   3   byte [B.<elements>             N/A
 19   5        (object alignment gap)    
Instance size: 24 bytes
Space losses: 4 bytes internal + 5 bytes external = 9 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            4
 12   4        (alignment/padding gap)   
 16   4   byte [B.<elements>             N/A
 20   4        (object alignment gap)    
Instance size: 24 bytes
Space losses: 4 bytes internal + 4 bytes external = 8 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            5
 12   4        (alignment/padding gap)   
 16   5   byte [B.<elements>             N/A
 21   3        (object alignment gap)    
Instance size: 24 bytes
Space losses: 4 bytes internal + 3 bytes external = 7 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            6
 12   4        (alignment/padding gap)   
 16   6   byte [B.<elements>             N/A
 22   2        (object alignment gap)    
Instance size: 24 bytes
Space losses: 4 bytes internal + 2 bytes external = 6 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            7
 12   4        (alignment/padding gap)   
 16   7   byte [B.<elements>             N/A
 23   1        (object alignment gap)    
Instance size: 24 bytes
Space losses: 4 bytes internal + 1 bytes external = 5 bytes total

[B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80000f5
 12   4        (array length)            8
 12   4        (alignment/padding gap)   
 16   8   byte [B.<elements>             N/A
Instance size: 24 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total
```