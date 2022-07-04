---
category: Java
tag: JavaSE
date: 2020-05-13
title: Java 线程状态
---

> [Java 线程状态](https://zhuanlan.zhihu.com/p/140396504)

Java装状态流转如下

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/java_thread_state1.jpg)

Running这个状态在Java平台中其实是不存在的，图中表示的只是获取了CPU的RUNNABLE状态。上图只是给出了一个大概的流程运转图，图里的有些操作是需要多个线程配合才能完成的，具体的流转过程在下面有详细的解释

Java线程状态在java.lang.Thread.State 这个枚举类中有描述

* `NEW`：表示还未开始执行的状态RUNNABLE：表示线程是可运行，但目前等待系统运行资源（例如CPU等）
* `BLOCKED`：表示线程目前正在等待monitor lock，被阻塞住了。这种状态下是处于进入`synchronized block/method` 或者 调用`Object.wait()`之后重新进入 `synchronized block/method` 。
* `WAITING`：线程A处于等待操作，等待线程B执行一个特定的操作。当线程A调用了`Object.wait()/ Thread.join()/ LockSupport.park()` 这些方法后就会进入 `WAITING`状态
* `TIMED_WAITING`：线程处于一个带有超时时间的 WAITING 状态。当线程A调用了 `Thread.sleep()/ Object.wait()/ Thread.join()/ LockSupport.parkNanos()/ LockSupport.parkUntil()` 这些方法后就会进入 `TIMED_WAITING` 状态。
* `TERMINATED`： 表示线程执行完成了。

Java线程的状态不多，主要的也就是 `BLOCKED/WAITING/TIMED_WAITING` 这三个状态。

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/java_thread_state2.jpg)

假设我们现在有AB俩个线程，刚开始这俩个线程都是处于RUNNABLE状态，假设都是运行状态（具体是否在运行取决于CPU调度）。然后俩个线程都要进入一段同步代码块，A成功获取到了监视锁，它进入了代码块继续处于RUNNABLE状态等待CPU调度。但是B获取监视锁失败了，于是就进入了`BLOCKED`状态，等待A释放监视锁。

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/java_thread_state3.jpg)

如果我们让A在同步块中执行监视锁对象的`wait()` 方法，A就会进入`WAITING`状态，释放监视锁等待B唤醒。B获得锁进入同步块后，调用监视锁对象的`notify()`方法唤醒A，此时A应该有一个短暂的RUNNABLE状态，然后进入进入`BLOCKED`状态等待B释放锁。