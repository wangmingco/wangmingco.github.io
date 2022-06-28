---
category: Java
tag: jol
date: 2016-12-02 15:00:00
title: JOL 13 ThinLocking
---

本篇文章基于[V0.16 JOLSample_13_ThinLocking](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_13_ThinLocking.java)

这篇文章我们继续了解`mark word`。

这篇以`thin lock`为例。当锁被请求到以后，mark word的数据变为一个引用，该引用指向了一个栈上分配的object header。
当我们释放锁之后那个栈上分配的header就会被丢弃，mark word 将恢复为默认值。

下面的例子依赖于偏向锁定但是不能在第一次请求锁的时候就偏向对象。JDK8延迟了偏向锁定的启动时间，因此下面的例子就是开箱即用即可。在JDK9以后的版本，如果要运行下面的例子，需要关闭偏向锁定, 添加JVM参数`-XX:-UseBiasedLocking`。

```java
public class JOLSample_13_ThinLocking {

    public static void main(String[] args) {
        // out.println(VM.current().details());

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
**** Fresh object
org.openjdk.jol.samples.JOLSample_13_ThinLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800c143
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** With the lock
org.openjdk.jol.samples.JOLSample_13_ThinLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000700007e2f9e8 (thin lock: 0x0000700007e2f9e8)
  8   4        (object header: class)    0xf800c143
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

**** After the lock
org.openjdk.jol.samples.JOLSample_13_ThinLocking$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: class)    0xf800c143
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```

其实这种用法在上个例子[JOL 12 ThinLocking]() 中已经演示过了。

