---
category: Java
tag: jol
date: 2016-12-02 14:00:00
title: JOL 12 BiasedLocking
---

本篇文章基于[V0.16 JOLSample_12_BiasedLocking](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_12_BiasedLocking.java)

这个例子我们深入了解一下 `mark word` 里存锁的信息。我们可以通过请求锁，释放锁这个过程清楚地看到`mark word`内容的变化.

在这个例子中，我们演示一下偏向锁定(`biased locking`). 在Java中每个对象都有可能是同步的目标。 大多数时间，对象都被一个线程锁定过。
在这种情形下，我们可以把对象偏向(`biased`)到某个线程，然后非常方便地实现同步(synchronization)语义。

为了演示这种情形，我们在`before/during/after`这三个锁定请求阶段分别打印一下对象的内部数据。你可以看到`mark word`从`biasable`到`biased`的变化。释放锁之后`mark word`的状态仍然没有变化，现在这个对象就偏向到之前锁定过的那个线程了。

在JDK9以前，偏向锁定(`biased locking`)只有当VM启动5秒钟之后才会被启用。因此下面的例子如果在JDK8运行，最好加上`-XX:BiasedLockingStartupDelay=0`参数.
JDK15以后，偏向锁定(`biased locking`)默认就不开启了，入股是在JDK15上运行这个例子需要添加参数`-XX:+UseBiasedLocking`

```java
public class JOLSample_12_BiasedLocking {

    public static void main(String[] args) {
        out.println(VM.current().details());

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
examples.JOLSample_12_ThinLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000005 (biasable; age: 0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** With the lock
examples.JOLSample_12_ThinLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x00007f85e6809005 (biased: 0x0000001fe179a024; epoch: 0; age: 0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** After the lock
examples.JOLSample_12_ThinLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x00007f85e6809005 (biased: 0x0000001fe179a024; epoch: 0; age: 0)
  8   4        (object header: class)    0xf80121fa
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```

在我的测试中我使用了`amazon-corretto-8.jdk`, 发现 `-XX:BiasedLockingStartupDelay=0` 这个参数加不加或者设置成多少都不会影响偏向锁定, 程序输出结果始终都是如上例一样，锁释放之后还是被锁定的。但是如果使用了`-XX:-UseBiasedLocking`这个参数，关闭偏向锁定, 锁释放后，`mark word`值就恢复成了默认值.


```
**** Fresh object
org.openjdk.jol.samples.JOLSample_12_BiasedLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** With the lock
org.openjdk.jol.samples.JOLSample_12_BiasedLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x000070000fa029e8 (thin lock: 0x000070000fa029e8)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** After the lock
org.openjdk.jol.samples.JOLSample_12_BiasedLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```

我用`-XX:+PrintFlagsFinal`参数打印了虚拟机参数
```
     intx BiasedLockingBulkRebiasThreshold          = 20                                  {product}
     intx BiasedLockingBulkRevokeThreshold          = 40                                  {product}
     intx BiasedLockingDecayTime                    = 25000                               {product}
     intx BiasedLockingStartupDelay                 = 4000                                {product}
     bool TraceBiasedLocking                        = false                               {product}
     bool UseBiasedLocking                          = true                                {product}
```

我发现`BiasedLockingStartupDelay`时间为4秒, 这不应该会生成偏向锁定呀。于是我在代码关键节点加了一下时间，发现是`VM.current().details()` 这个代码太耗时间了, 如果把这行代码去掉，偏向锁定就失效了，和上文描述的就一样了。

