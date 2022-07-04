---
category: Java
tag: Java IO
date:  2019-05-25
title: Java NIO 原理剖析之 DirectBuffer GC
---

> [Java NIO 原理剖析之 DirectBuffer GC](https://zhuanlan.zhihu.com/p/66368628)


`DirectBuffer`直接从Java堆之外申请一块内存, 这块内存是不直接受JVM gc管理的, 也就是说在GC算法中并不会直接操作这块内存. 这块内存的GC是由于`DirectBuffer`在Java堆中的对象被gc后, 通过一个通知机制, 而将其清理掉的.

我简单地画了一个时序图

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/directbuffer.jpg)


在创建`DirectBuffer`对象的时候, 会一起创建一个`Deallocator`和`Cleaner`对象.

`Deallocator`负责与`DirectBuffer`相关联的直接内存的清理.

`Cleaner`是`PhantomReference`的子类, 这是虚引用类型. 当`DirectBuffer`对象被回收之后, 就会通知到`PhantomReference`. 然后由`ReferenceHandler`调用`tryHandlePending()`方法进行`pending`处理. 如果pending不为空, 说明`DirectBuffer`被回收了, 就可以调用`Cleaner`的`clean()`进行回收了.

源码如下
```java
static boolean tryHandlePending(boolean waitForNotify) {
        Reference<Object> r;
        Cleaner c;
        try {
            synchronized (lock) {
                if (pending != null) {
                    r = pending;
                    c = r instanceof Cleaner ? (Cleaner) r : null;
                    pending = r.discovered;
                    r.discovered = null;
                } else {
                    if (waitForNotify) {
                        lock.wait();
                    }
                    return waitForNotify;
                }
            }
        } catch (OutOfMemoryError x) {
            Thread.yield();
            // retry
            return true;
        } catch (InterruptedException x) {
            // retry
            return true;
        }

        // Fast path for cleaners
        if (c != null) {
            c.clean();
            return true;
        }

        ReferenceQueue<? super Object> q = r.queue;
        if (q != ReferenceQueue.NULL) q.enqueue(r);
        return true;
    }

```
