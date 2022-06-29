---
category: Java
tag: jol
date: 2016-12-02 16:00:00
title: JOL 14 FatLocking
---

本篇文章基于[V0.16 JOLSample_14_FatLocking](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_14_FatLocking.java)

这个例子演示了fat locking技术。

如果VM检测到了线程间的数据竞争，那么它需要将access arbitrage委托给底层系统。那么此时对象就会和底层的锁关联起来，即现在成了膨胀锁了("inflating" the lock)。

在这个例子中，我们需要模拟一下竞争，因此我们引入了一个额外的线程。通过运行代码你可以看到开始时，对象的`mark word`是默认值，当辅助线程获取到锁后，对象的`mark word`指向了一个偏向锁，而当主线程获取到锁之后，它就膨胀成了一把重量级的锁，哪怕之后锁被释放了，它还是膨胀状态。

在最后阶段调用了一下`System.gc()`, gc之后锁就被释放掉了。在JDK15之前，在一些安全点(`safepoints`)会触发锁的清理操作，因此任何GC动作都可能会清理锁。但是JDK15以后，一旦未使用的监视器数量变大之后， 监视器就会以异步的方式进行释放。


```java
public class JOLSample_14_FatLocking {

    public static void main(String[] args) throws Exception {
        out.println(VM.current().details());

        final A a = new A();

        ClassLayout layout = ClassLayout.parseInstance(a);

        out.println("**** Fresh object");
        out.println(layout.toPrintable());

        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (a) {
                    try {
                        TimeUnit.SECONDS.sleep(10);
                    } catch (InterruptedException e) {
                        return;
                    }
                }
            }
        });

        t.start();

        TimeUnit.SECONDS.sleep(1);

        out.println("**** Before the lock");
        out.println(layout.toPrintable());

        synchronized (a) {
            out.println("**** With the lock");
            out.println(layout.toPrintable());
        }

        out.println("**** After the lock");
        out.println(layout.toPrintable());

        System.gc();

        out.println("**** After System.gc()");
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
org.openjdk.jol.samples.JOLSample_14_FatLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000005 (biasable; age: 0)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** Before the lock
org.openjdk.jol.samples.JOLSample_14_FatLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x00007feb4d081005 (biased: 0x0000001ffad34204; epoch: 0; age: 0)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** With the lock
org.openjdk.jol.samples.JOLSample_14_FatLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x00007feb5180be8a (fat lock: 0x00007feb5180be8a)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** After the lock
org.openjdk.jol.samples.JOLSample_14_FatLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x00007feb5180be8a (fat lock: 0x00007feb5180be8a)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** After System.gc()
org.openjdk.jol.samples.JOLSample_14_FatLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000009 (non-biasable; age: 1)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```