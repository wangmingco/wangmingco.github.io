---
category: Java
tag: Java IO
date:  2019-05-25
title: Java NIO 原理剖析之 DirectBuffer
---

> [Java NIO 原理剖析之 DirectBuffer GC](https://zhuanlan.zhihu.com/p/66368628)

> 引用R大的一个[观点](https://www.zhihu.com/question/29352626/answer/44050736)
> 对HotSpot VM来说，不受GC管理的内存都是native memory；受GC管理的内存叫做GC heap或者managed heap。
> 
> “Direct memory”，在Java的上下文里，特指Java程序通过一组特定的API访问native memory。这组API主要由DirectByteBuffer暴露出来。
> Native memory是一个通用概念，而direct memory只限定在特定的访问native memory的做法。两者不直接等价。
> 另外JDK7中的HotSpot VM没有把String常量放到native memory，而是把
> * interned String => Java heap
> * Symbols => native memory

通过R大的观点我们可以看到其实DirectBuffer就是在java堆外分配的一块内存, 我们可以通过java程序直接访问这个内存(看到这里是不是联想到了java传统IO, 每次都分配一块临时native内存)

## 内存申请

说道这里的话, 就会涉及到内存分配的几个概念
* 内核内存
* 用户内存
* java堆内存

在传统JAVA IO的时候数据的读取只要是在这三个内存之间流动. 
假设现在系统有4G物理内存, 且是一个32位的操作系统. 那么在系统运行过程中, 有1个G内存分配给了操作系统, 3个G分配给了用户. 而Java程序启动又占用了1个G, 假设Java堆内存占用了800M.

那现在DirectBuffer在什么位置呢? 应该是在Java内存之内, Java堆之外. 
到这里, 我们提个问题, 既然有了Java堆为什么还要弄一个直接内存呢? 
这是因为不管采用何种GC算法, 在整理堆内存的时候, 都会涉及到堆内存内的对象移动/复制(这些对象的内存地址发生了改变), 而有时候我们创建的对象(例如IO时候的byte数组)会非常大, 当GC在处理这些对象的时候就会占用大量的时间和大量的堆内存(当复制的时候). 于是有人想, 我就分配一块内存, 这块内存我自己来管理, 于是乎就有了DirectBuffer, 这也是为什么DirectBuffer会在IO的这个包里实现

```java
ByteBuffer buf = ByteBuffer.allocateDirect(1024);
```
它的源码也非常简单
```java
public static ByteBuffer allocateDirect(int capacity) {
    return new DirectByteBuffer(capacity);
}

DirectByteBuffer(int cap) {                   // package-private

    super(-1, 0, cap, cap);
    boolean pa = VM.isDirectMemoryPageAligned();
    int ps = Bits.pageSize();
    long size = Math.max(1L, (long)cap + (pa ? ps : 0));
    Bits.reserveMemory(size, cap);

    long base = 0;
    try {
        base = unsafe.allocateMemory(size);
    } catch (OutOfMemoryError x) {
        Bits.unreserveMemory(size, cap);
        throw x;
    }
    unsafe.setMemory(base, size, (byte) 0);
    if (pa && (base % ps != 0)) {
        // Round up to page boundary
        address = base + ps - (base & (ps - 1));
    } else {
        address = base;
    }
    cleaner = Cleaner.create(this, new Deallocator(base, size, cap));
    att = null;

}
```

1. `Bits.reserveMemory(size, cap);` 计算内存是否足够
2. `base = unsafe.allocateMemory(size);`  分配内存
3. `cleaner = Cleaner.create(this, new Deallocator(base, size, cap));`   生成对内存清理方法.

我们看到它是通过`unsafe.allocateMemory(size)`进行内存申请的

```cpp
UNSAFE_ENTRY(jlong, Unsafe_AllocateMemory(JNIEnv *env, jobject unsafe, jlong size))
  UnsafeWrapper("Unsafe_AllocateMemory");
  size_t sz = (size_t)size;
  if (sz != (julong)size || size < 0) {
    THROW_0(vmSymbols::java_lang_IllegalArgumentException());
  }
  if (sz == 0) {
    return 0;
  }
  sz = round_to(sz, HeapWordSize);
  void* x = os::malloc(sz, mtInternal);
  if (x == NULL) {
    THROW_0(vmSymbols::java_lang_OutOfMemoryError());
  }
  //Copy::fill_to_words((HeapWord*)x, sz / HeapWordSize);
  return addr_to_java(x);
UNSAFE_END
```
W我们看到其实非常简单, 就是调用系统函数, 分配了一块内存, 然后将c内存地址转换成了java的内存地址.


## 内存回收

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

在一开始内存申请的时候
```java
reserveMemory(long size, int cap)
static void reserveMemory(long size, int cap) {

    if (!memoryLimitSet && VM.isBooted()) {
        maxMemory = VM.maxDirectMemory();
        memoryLimitSet = true;
    }

    // optimist!
    if (tryReserveMemory(size, cap)) {
        return;
    }

    final JavaLangRefAccess jlra = SharedSecrets.getJavaLangRefAccess();

    // retry while helping enqueue pending Reference objects
    // which includes executing pending Cleaner(s) which includes
    // Cleaner(s) that free direct buffer memory
    while (jlra.tryHandlePendingReference()) {
        if (tryReserveMemory(size, cap)) {
            return;
        }
    }

    // trigger VM's Reference processing
    System.gc();

    // a retry loop with exponential back-off delays
    // (this gives VM some time to do it's job)
    boolean interrupted = false;
    try {
        long sleepTime = 1;
        int sleeps = 0;
        while (true) {
            if (tryReserveMemory(size, cap)) {
                return;
            }
            if (sleeps >= MAX_SLEEPS) {
                break;
            }
            if (!jlra.tryHandlePendingReference()) {
                try {
                    Thread.sleep(sleepTime);
                    sleepTime <<= 1;
                    sleeps++;
                } catch (InterruptedException e) {
                    interrupted = true;
                }
            }
        }

        // no luck
        throw new OutOfMemoryError("Direct buffer memory");

    } finally {
        if (interrupted) {
            // don't swallow interrupts
            Thread.currentThread().interrupt();
        }
    }
}
```

当调用`tryReserveMemory(size, cap)`方法返回false时表示内存不够, 就需要调用 `jlra.tryHandlePendingReference()` 来回收内存了.
```java
java.lang.ref.Reference
static {
    ThreadGroup tg = Thread.currentThread().getThreadGroup();
    for (ThreadGroup tgn = tg;
         tgn != null;
         tg = tgn, tgn = tg.getParent());
    Thread handler = new ReferenceHandler(tg, "Reference Handler");
    /* If there were a special system-only priority greater than
     * MAX_PRIORITY, it would be used here
     */
    handler.setPriority(Thread.MAX_PRIORITY);
    handler.setDaemon(true);
    handler.start();

    // provide access in SharedSecrets
    SharedSecrets.setJavaLangRefAccess(new JavaLangRefAccess() {
        @Override
        public boolean tryHandlePendingReference() {
            return tryHandlePending(false);
        }
    });
}
```

我们看到 `tryHandlePendingReference()` 是在 `java.lang.ref.Reference` 中定义的.
`tryHandlePendingReference()` 实际调的是`tryHandlePending(false)`, 真正的回收代码就在`tryHandlePending(false)`了

```java
static boolean tryHandlePending(boolean waitForNotify) {
    Reference<Object> r;
    Cleaner c;
    try {
        synchronized (lock) {
            if (pending != null) {
                r = pending;
                // 'instanceof' might throw OutOfMemoryError sometimes
                // so do this before un-linking 'r' from the 'pending' chain...
                c = r instanceof Cleaner ? (Cleaner) r : null;
                // unlink 'r' from 'pending' chain
                pending = r.discovered;
                r.discovered = null;
            } else {
                // The waiting on the lock may cause an OutOfMemoryError
                // because it may try to allocate exception objects.
                if (waitForNotify) {
                    lock.wait();
                }
                // retry if waited
                return waitForNotify;
            }
        }
    } catch (OutOfMemoryError x) {
        // Give other threads CPU time so they hopefully drop some live references
        // and GC reclaims some space.
        // Also prevent CPU intensive spinning in case 'r instanceof Cleaner' above
        // persistently throws OOME for some time...
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

如果pending为空的时候，会通过`lock.wait()`一直等在那里，其中唤醒的动作是在jvm里做的，当gc完成之后会调用如下的方法`VM_GC_Operation::doit_epilogue()`，在方法末尾会调用`lock`的`notify`操作，至于`pending`队列什么时候将引用放进去的，其实是在gc的引用处理逻辑中放进去的，
```cpp
void VM_GC_Operation::doit_epilogue() {
  assert(Thread::current()->is_Java_thread(), "just checking");
  // Release the Heap_lock first.
  SharedHeap* sh = SharedHeap::heap();
  if (sh != NULL) sh->_thread_holds_heap_lock_for_gc = false;
  Heap_lock->unlock();
  release_and_notify_pending_list_lock();
}

void VM_GC_Operation::release_and_notify_pending_list_lock() {
   instanceRefKlass::release_and_notify_pending_list_lock(&_pending_list_basic_lock);
}

```

我们看到如果`pending`不为空的就会去调用`Cleaner#clean()`方法了

```java
private final Runnable thunk;

private Cleaner(Object referent, Runnable thunk) {
    super(referent, dummyQueue);
    this.thunk = thunk;
}

/**
 * Creates a new cleaner.
 *
 * @param  ob the referent object to be cleaned
 * @param  thunk
 *         The cleanup code to be run when the cleaner is invoked.  The
 *         cleanup code is run directly from the reference-handler thread,
 *         so it should be as simple and straightforward as possible.
 *
 * @return  The new cleaner
 */
public static Cleaner create(Object ob, Runnable thunk) {
    if (thunk == null)
        return null;
    return add(new Cleaner(ob, thunk));
}

/**
 * Runs this cleaner, if it has not been run before.
 */
public void clean() {
    if (!remove(this))
        return;
    try {
        thunk.run();
    } catch (final Throwable x) {
        AccessController.doPrivileged(new PrivilegedAction<Void>() {
                public Void run() {
                    if (System.err != null)
                        new Error("Cleaner terminated abnormally", x)
                            .printStackTrace();
                    System.exit(1);
                    return null;
                }});
    }
}
```

gc过程中如果发现某个对象除了只有`PhantomReference`引用它之外，并没有其他的地方引用它了，那将会把这个引用放到`java.lang.ref.Reference.pending`队列里，在gc完毕的时候通知`ReferenceHandler`这个守护线程去执行一些后置处理，而`DirectByteBuffer`关联的`PhantomReference`是`PhantomReference`的一个子类，在最终的处理里会通过`Unsafe`的free接口来释放`DirectByteBuffer`对应的堆外内存块

最后通过run方法 调用 unsafe.freeMemory(address);
```java
private static class Deallocator
    implements Runnable
{

    private static Unsafe unsafe = Unsafe.getUnsafe();

    private long address;
    private long size;
    private int capacity;

    private Deallocator(long address, long size, int capacity) {
        assert (address != 0);
        this.address = address;
        this.size = size;
        this.capacity = capacity;
    }

    public void run() {
        if (address == 0) {
            // Paranoia
            return;
        }
        unsafe.freeMemory(address);
        address = 0;
        Bits.unreserveMemory(size, capacity);
    }

}
```

### 从直接内存读数据

```java
public ByteBuffer get(byte[] dst, int offset, int length) {

    if (((long)length << 0) > Bits.JNI_COPY_TO_ARRAY_THRESHOLD) {
        checkBounds(offset, length, dst.length);
        int pos = position();
        int lim = limit();
        assert (pos <= lim);
        int rem = (pos <= lim ? lim - pos : 0);
        if (length > rem)
            throw new BufferUnderflowException();

            Bits.copyToArray(ix(pos), dst, arrayBaseOffset,
                             (long)offset << 0,
                             (long)length << 0);
        position(pos + length);
    } else {
        super.get(dst, offset, length);
    }
    return this;

}


static void copyToArray(long srcAddr, Object dst, long dstBaseOffset, long dstPos,
                        long length)
{
    long offset = dstBaseOffset + dstPos;
    while (length > 0) {
        long size = (length > UNSAFE_COPY_THRESHOLD) ? UNSAFE_COPY_THRESHOLD : length;
        unsafe.copyMemory(null, srcAddr, dst, offset, size);
        length -= size;
        srcAddr += size;
        offset += size;
    }
}


UNSAFE_ENTRY(void, Unsafe_CopyMemory(JNIEnv *env, jobject unsafe, jlong srcAddr, jlong dstAddr, jlong size))
  UnsafeWrapper("Unsafe_CopyMemory");
  if (size == 0) {
    return;
  }
  size_t sz = (size_t)size;
  if (sz != (julong)size || size < 0) {
    THROW(vmSymbols::java_lang_IllegalArgumentException());
  }
  void* src = addr_from_java(srcAddr);
  void* dst = addr_from_java(dstAddr);
  Copy::conjoint_memory_atomic(src, dst, sz);
UNSAFE_END


public ByteBuffer get(byte[] dst, int offset, int length) {
    checkBounds(offset, length, dst.length);
    if (length > remaining())
        throw new BufferUnderflowException();
    int end = offset + length;
    for (int i = offset; i < end; i++)
        dst[i] = get();
    return this;
}

public byte get() {
    return ((unsafe.getByte(ix(nextGetIndex()))));
}
```

