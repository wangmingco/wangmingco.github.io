---
category: Java
tag: jol
date: 2016-12-03 18:30:00
title: JOL 16 Identity Hash Code 和 Biased Locking 冲突
---

本篇文章基于[V0.16 JOLSample_16_IHC_BL_Conflict](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_16_IHC_BL_Conflict.java)

这个例子用于演示当偏向锁遇到hash code时发生的冲突。实验证明hash code拥有更高的优先级.

第一次释放锁之后，`mark word`并没有发生变化还是处于偏向锁状态。当我们计算了hash code之后，hash code值会覆盖之前的偏向锁的值。当第二次进入锁之后，`mark word`被重新赋值了偏向锁引用，但是离开锁之后，`mark word` 并没有保留偏向锁引用，而是重新被赋值了hash code。因此我们可以看出，在`mark word`中hash code比偏向锁拥有更高的优先级。

在JDK 15+以上，测试代码需要开启`-XX:+UseBiasedLocking`参数。

```java
public class JOLSample_16_IHC_BL_Conflict {

    public static void main(String[] args) throws Exception {
        out.println(VM.current().details());

        TimeUnit.SECONDS.sleep(6);

        final A a = new A();

        ClassLayout layout = ClassLayout.parseInstance(a);

        out.println("**** Fresh object");
        out.println(layout.toPrintable());

        synchronized (a) {
            out.println("**** With the lock");
            out.println(layout.toPrintable());
        }

        out.println("**** After the lock");
        out.println(layout.toPrintable());

        int hashCode = a.hashCode();
        out.println("hashCode: " + Integer.toHexString(hashCode));
        out.println();

        out.println("**** After the hashcode");
        out.println(layout.toPrintable());

        synchronized (a) {
            out.println("**** With the second lock");
            out.println(layout.toPrintable());
        }

        out.println("**** After the second lock");
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
org.openjdk.jol.samples.JOLSample_16_IHC_BL_Conflict$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000005 (biasable; age: 0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** With the lock
org.openjdk.jol.samples.JOLSample_16_IHC_BL_Conflict$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x00007fbe92009005 (biased: 0x0000001fefa48024; epoch: 0; age: 0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** After the lock
org.openjdk.jol.samples.JOLSample_16_IHC_BL_Conflict$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x00007fbe92009005 (biased: 0x0000001fefa48024; epoch: 0; age: 0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

hashCode: 6073f712

**** After the hashcode
org.openjdk.jol.samples.JOLSample_16_IHC_BL_Conflict$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000006073f71201 (hash: 0x6073f712; age: 0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** With the second lock
org.openjdk.jol.samples.JOLSample_16_IHC_BL_Conflict$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x00007000089b39e0 (thin lock: 0x00007000089b39e0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** After the second lock
org.openjdk.jol.samples.JOLSample_16_IHC_BL_Conflict$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000006073f71201 (hash: 0x6073f712; age: 0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```