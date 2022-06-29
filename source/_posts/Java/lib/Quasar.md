---
category: Java
tag: Java 三方库
date: 2016-12-01
title: Quasar 学习
---
## Fibers

Quasar最主要的贡献就是提供了一个非常轻量级的线程, 这种线程在Quasar里称为fiber. Fiber不论是功能还是API使用上都与传统线程都非常像, 但不同的是, 它们并不会被OS管理. 每个Fiber占用的内存都非常少(空闲的Fiber大概会占用400byte), 而且当任务切换时会带来更低的CPU负担. 在Quasar中, Fiber可以被一个或者多个ForkJoinPools调度.

Fiber的设计目的并不是取代线程. A fiber should be used when its body (the code it executes) blocks very often waiting on other fibers (e.g. waiting for messages sent by other fibers on a channel, or waiting for the value of a dataflow-variable). 对于那种处于长时间运算的任务, 还是采用传统的线程会更加合适. 但幸运的是, 我们接下来会演示Fiber如何与传统线程进行良好的交互.

Fiber还特别适用于那种引起callback hell的异步调用代码. Fiber还会在保持代码简洁性以及维护代码逻辑线程化模式的同时保持应用的扩展性以及性能的不损失.

### Using Fibers
我们使用`Fiber`类来创建出一个fiber, 下面的fiber类似于一个线程:
```java
new Fiber<V>() {
  @Override
  protected V run() throws SuspendExecution, InterruptedException {
        // your code
    }
}.start();
```

上面的例子与开启一个线程不同的是:
1. fiber可以有一个泛型化的返回值(如果不需要返回值的话, 则返回类型使用`Void`, 直接返回null即可)
2. `run`方法可以抛出一个`InterruptedException`异常.

You can also start a fiber by passing an instance of  to Fiber’s constructor:
另外一种开启fiber的方式是, 向`Fiber`构造器传递一个`SuspendableRunnable`或者`SuspendableCallable`类型的实例
```java
new Fiber<Void>(new SuspendableRunnable() {
  public void run() throws SuspendExecution, InterruptedException {
    // your code
  }
}).start();
```

You can join a fiber much as you’d do a thread with the join method. To obtain the value returned by the fiber (if any), you call the get method, which joins the fiber and returns its result.

Other than Fiber’s constructor and start method, and possibly the join and get methods, you will not access the Fiber class directly much. To perform operations you would normally want to do on a thread, it is better to use the Strand class (discussed later), which is a generalizations of both threads and fibers.


### The Fiber Scheduler and Runtime Fiber Monitoring

`Fiber`是通过`FiberScheduler`进行调度的. 当创建`Fiber`实例时, 你可以指定它的调度器, 如果你不指定的话, 就会使用默认的`FiberForkJoinScheduler`实例进行调度(基于`ForkJoinPool`). `FiberForkJoinScheduler`是一个高质量的`work-stealing`模式调度器, 但是某些情况下, 你也许想要使用线程池或者自己设计的调度器, 在这种情况下, 你可以使用`FiberExecutorScheduler`, 具体用法参考它的API.

每一个调度器都会创建出一个`MXBean`, 用于监控调度器调度fiber. MXBean的名称为`co.paralleluniverse:type=Fibers,name=SCHEDULER_NAME`, 更多细节也是参考其API.
