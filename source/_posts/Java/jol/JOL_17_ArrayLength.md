---
category: Java
tag: jol
date: 2016-12-03 19:00:00
title: JOL 17 ArrayLength
---

本篇文章基于[V0.16 JOLSample_17_ArrayLength](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_17_ArrayLength.java)

这个例子用于演示对象头上的数组长度。数组长度并不是数组类型的一部分，因此虚拟机需要在对象头上有一个额外的位置存储数组长度。

```java
public class JOLSample_17_ArrayLength {

    public static void main(String[] args) {
        out.println(VM.current().details());

        for (int c = 0; c < 8; c++) {
            out.println("**** int[" + c + "]");
            out.println(ClassLayout.parseInstance(new int[c]).toPrintable());
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

**** int[0]
[I object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800016d
 12   4        (array length)            0
 12   4        (alignment/padding gap)   
 16   0    int [I.<elements>             N/A
Instance size: 16 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total

**** int[1]
[I object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800016d
 12   4        (array length)            1
 12   4        (alignment/padding gap)   
 16   4    int [I.<elements>             N/A
 20   4        (object alignment gap)    
Instance size: 24 bytes
Space losses: 4 bytes internal + 4 bytes external = 8 bytes total

**** int[2]
[I object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800016d
 12   4        (array length)            2
 12   4        (alignment/padding gap)   
 16   8    int [I.<elements>             N/A
Instance size: 24 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total

**** int[3]
[I object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800016d
 12   4        (array length)            3
 12   4        (alignment/padding gap)   
 16  12    int [I.<elements>             N/A
 28   4        (object alignment gap)    
Instance size: 32 bytes
Space losses: 4 bytes internal + 4 bytes external = 8 bytes total

**** int[4]
[I object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800016d
 12   4        (array length)            4
 12   4        (alignment/padding gap)   
 16  16    int [I.<elements>             N/A
Instance size: 32 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total

**** int[5]
[I object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800016d
 12   4        (array length)            5
 12   4        (alignment/padding gap)   
 16  20    int [I.<elements>             N/A
 36   4        (object alignment gap)    
Instance size: 40 bytes
Space losses: 4 bytes internal + 4 bytes external = 8 bytes total

**** int[6]
[I object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800016d
 12   4        (array length)            6
 12   4        (alignment/padding gap)   
 16  24    int [I.<elements>             N/A
Instance size: 40 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total

**** int[7]
[I object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800016d
 12   4        (array length)            7
 12   4        (alignment/padding gap)   
 16  28    int [I.<elements>             N/A
 44   4        (object alignment gap)    
Instance size: 48 bytes
Space losses: 4 bytes internal + 4 bytes external = 8 bytes total
```