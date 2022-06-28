---
category: Java
tag: jol
date: 2016-12-03 18:00:00
title: JOL 15 IdentityHashCode
---

本篇文章基于[V0.16 JOLSample_15_IdentityHashCode](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_15_IdentityHashCode.java)

本例用来展示 `identity hash code`。

`identity hash code` 一旦被计算，就始终保持不变。HotSpot 同样将 `identity hash code`存储在了`mark word`. 

```java
public class JOLSample_15_IdentityHashCode {

    public static void main(String[] args) {
        out.println(VM.current().details());

        final A a = new A();

        ClassLayout layout = ClassLayout.parseInstance(a);

        out.println("**** Fresh object");
        out.println(layout.toPrintable());

        out.println("hashCode: " + Integer.toHexString(a.hashCode()));
        out.println();

        out.println("**** After identityHashCode()");
        out.println(layout.toPrintable());
    }

    public static class A {
        // no fields
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

**** Fresh object
org.openjdk.jol.samples.JOLSample_15_IdentityHashCode$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000005 (biasable; age: 0)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

hashCode: 6073f712

**** After identityHashCode()
org.openjdk.jol.samples.JOLSample_15_IdentityHashCode$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000006073f71201 (hash: 0x6073f712; age: 0)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```