---
category: Java
tag: Java IO
date:  2017-10-29
title: Java NIO原理剖析之 零拷贝
---

阻塞指的是用户态程序调用系统api进入内核态后，如果条件不满足则被加入到对应的等待队列中，直到条件满足。比如：sleep 2s。在此期间线程得不到CPU调度，自然也就不会往下执行，表现的现象为线程卡在系统api不返回

不论条件是否满足都会立即返回到用户态，线程的CPU资源不会被剥夺，也就意味着程序可以继续往下执行。


传统的数据拷贝方法

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy1.jpg)

传统上下文切换

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy2.jpg)

1.  `read()` 调用引发了一次从用户模式到内核模式的上下文切换.在内部,发出 `sys_read()`(或等效内容)以从文件中读取数据.直接内存存取(`direct memory access`,DMA)引擎执行了第一次拷贝,它从磁盘中读取文件内容,然后将它们存储到一个内核地址空间缓存区中.
2. 所需的数据被从读取缓冲区拷贝到用户缓冲区,read() 调用返回.该调用的返回引发了内核模式到用户模式的上下文切换(又一次上下文切换).现在数据被储存在用户地址空间缓冲区.
3. `send()` 套接字调用引发了从用户模式到内核模式的上下文切换.数据被第三次拷贝,并被再次放置在内核地址空间缓冲区.但是这一次放置的缓冲区不同,该缓冲区与目标套接字相关联.
4. `send()` 系统调用返回,结果导致了第四次的上下文切换.DMA 引擎将数据从内核缓冲区传到协议引擎,第四次拷贝独立地、异步地发生 .

使用中间内核缓冲区(而不是直接将数据传输到用户缓冲区)看起来可能有点效率低下.但是之所以引入中间内核缓冲区的目的是想提高性能.在读取方面使用中间内核缓冲区,可以允许内核缓冲区在应用程序不需要内核缓冲区内的全部数据时,充当 “预读高速缓存(readahead cache)” 的角色.这在所需数据量小于内核缓冲区大小时极大地提高了性能.在写入方面的中间缓冲区则可以让写入过程异步完成.

## 零拷贝
Java 类库通过 `java.nio.channels.FileChannel` 中的 `transferTo()` 方法来在 Linux 和 UNIX 系统上支持零拷贝.可以使用 `transferTo()` 方法直接将字节从它被调用的通道上传输到另外一个可写字节通道上,数据无需流经应用程序.本文首先展示了通过传统拷贝语义进行的简单文件传输引发的开销,然后展示了使用 `transferTo()` 零拷贝技巧如何提高性能.

不幸的是,如果所需数据量远大于内核缓冲区大小的话,这个方法本身可能成为一个性能瓶颈.数据在被最终传入到应用程序前,在磁盘、内核缓冲区和用户缓冲区中被拷贝了多次.零拷贝通过消除这些冗余的数据拷贝而提高了性能.

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy3.jpg)

1. `transferTo()` 方法引发 DMA 引擎将文件内容拷贝到一个读取缓冲区.然后由内核将数据拷贝到与输出套接字相关联的内核缓冲区.
2. 数据的第三次复制发生在DMA引擎将数据从内核套接字缓冲区传到协议引擎时.改进的地方：我们将上下文切换的次数从四次减少到了两次,将数据复制的次数从四次减少到了三次(其中只有一次涉及到了CPU).但是这个代码尚未达到我们的零拷贝要求.如果底层网络接口卡支持收集操作的话,那么我们就可以进一步减少内核的数据复制.

在Linux内核2.4及后期版本中,套接字缓冲区描述符就做了相应调整,以满足该需求.这种方法不仅可以减少多个上下文切换,还可以消除需要涉及CPU的重复的数据拷贝.对于用户方面,用法还是一样的,但是内部操作已经发生了改变：
1. transferTo() 方法引发 DMA 引擎将文件内容拷贝到内核缓冲区.
2. 数据未被拷贝到套接字缓冲区.取而代之的是,只有包含关于数据的位置和长度的信息的描述符被追加到了套接字缓冲区.DMA 引擎直接把数据从内核缓冲区传输到协议引擎,从而消除了剩下的最后一次 CPU 拷贝.

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy4.jpg)

结合使用 `transferTo()` 和收集操作时的数据拷贝

### 通道之间的数据传输
在Java NIO中，如果两个通道中有一个是`FileChannel`，那你可以直接将数据从一个channel（译者注：channel中文常译作通道）传输到另外一个channel。 

#### transferFrom() 

`FileChannel`的`transferFrom()`方法可以将数据从源通道传输到`FileChannel`中（译者注：这个方法在JDK文档中的解释为将字节从给定的可读取字节通道传输到此通道的文件中）。下面是一个简单的例子： 

```java
RandomAccessFile fromFile = new RandomAccessFile("fromFile.txt", "rw");  
FileChannel      fromChannel = fromFile.getChannel();  
  
RandomAccessFile toFile = new RandomAccessFile("toFile.txt", "rw");  
FileChannel      toChannel = toFile.getChannel();  
  
long position = 0;  
long count = fromChannel.size();  
  
toChannel.transferFrom(position, count, fromChannel);  
```


方法的输入参数position表示从position处开始向目标文件写入数据，count表示最多传输的字节数。如果源通道的剩余空间小于 count 个字节，则所传输的字节数要小于请求的字节数。 

此外要注意，在`SoketChannel`的实现中，`SocketChannel`只会传输此刻准备好的数据（可能不足count字节）。因此，`SocketChannel`可能不会将请求的所有数据(count个字节)全部传输到`FileChannel`中。 

#### transferTo() 

transferTo()方法将数据从FileChannel传输到其他的channel中。下面是一个简单的例子： 

```java
RandomAccessFile fromFile = new RandomAccessFile("fromFile.txt", "rw");  
FileChannel      fromChannel = fromFile.getChannel();  
  
RandomAccessFile toFile = new RandomAccessFile("toFile.txt", "rw");  
FileChannel      toChannel = toFile.getChannel();  
  
long position = 0;  
long count = fromChannel.size();  
  
 fromChannel.transferTo(position, count, toChannel);  
```

是不是发现这个例子和前面那个例子特别相似？除了调用方法的FileChannel对象不一样外，其他的都一样。 

上面所说的关于`SocketChannel`的问题在`transferTo()`方法中同样存在。`SocketChannel`会一直传输数据直到目标buffer被填满。 

##

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy5.jpg)
![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy6.jpg)


从上面的图中我们可以看到, FileChannel 中一共有俩个涉及到零拷贝的接口, transferFrom(), transferTo().
* `public abstract long transferTo(long position, long count, WritableByteChannel target)`
* `public abstract long transferFrom(ReadableByteChannel src,  long position, long count)`

`transferTo()` 接受的是`WritableByteChannel`:

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy7.jpg)

`transferFrom()`接受的是`ReadableByteChannel`

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy8.jpg)

我们可以看到Java中的零拷贝分别可以对socket(tcp), socket(udp), file 这三种主要形式的io进行零拷贝(还有pip等其他的, 但是这不是讲述重点, 就不在这里列举了.)

而在`FileChannelImpl` 中分别针对`tansferFrom`和`transferTo`有俩组接口分别针对上面三种不同形式的io进行具体逻辑实现. 


![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/zerocopy9.jpg)

```java
public long transferTo(long position, long count, WritableByteChannel target) throws IOException
{
    ...
 
   int icount = (int)Math.min(count, Integer.MAX_VALUE);
    if ((sz - position) < icount)
        icount = (int)(sz - position);

    long n;

    // Attempt a direct transfer, if the kernel supports it
    if ((n = transferToDirectly(position, icount, target)) >= 0)
        return n;

    // Attempt a mapped transfer, but only to trusted channel types
    if ((n = transferToTrustedChannel(position, icount, target)) >= 0)
        return n;

    // Slow path for untrusted targets
    return transferToArbitraryChannel(position, icount, target);
}

private long transferToDirectly(long position, int icount,
                                WritableByteChannel target)
    throws IOException
{
    if (!transferSupported)
        return IOStatus.UNSUPPORTED;

    FileDescriptor targetFD = null;
    if (target instanceof FileChannelImpl) {
        if (!fileSupported)
            return IOStatus.UNSUPPORTED_CASE;
        targetFD = ((FileChannelImpl)target).fd;
    } else if (target instanceof SelChImpl) {
        // Direct transfer to pipe causes EINVAL on some configurations
        if ((target instanceof SinkChannelImpl) && !pipeSupported)
            return IOStatus.UNSUPPORTED_CASE;

        // Platform-specific restrictions. Now there is only one:
        // Direct transfer to non-blocking channel could be forbidden
        SelectableChannel sc = (SelectableChannel)target;
        if (!nd.canTransferToDirectly(sc))
            return IOStatus.UNSUPPORTED_CASE;

        targetFD = ((SelChImpl)target).getFD();
    }

    ...

    if (nd.transferToDirectlyNeedsPositionLock()) {
        synchronized (positionLock) {
            long pos = position();
            try {
                return transferToDirectlyInternal(position, icount,
                                                  target, targetFD);
            } finally {
                position(pos);
            }
        }
    } else {
        return transferToDirectlyInternal(position, icount, target, targetFD);
    }
}

private long transferToDirectlyInternal(long position, int icount, WritableByteChannel target,            FileDescriptor targetFD) throws IOException
{

    long n = -1;
    int ti = -1;
    try {
        begin();
        ti = threads.add();
        if (!isOpen())
            return -1;
        do {
            n = transferTo0(fd, position, icount, targetFD);
        } while ((n == IOStatus.INTERRUPTED) && isOpen());
        if (n == IOStatus.UNSUPPORTED_CASE) {
            if (target instanceof SinkChannelImpl)
                pipeSupported = false;
            if (target instanceof FileChannelImpl)
                fileSupported = false;
            return IOStatus.UNSUPPORTED_CASE;
        }
        if (n == IOStatus.UNSUPPORTED) {
            // Don't bother trying again
            transferSupported = false;
            return IOStatus.UNSUPPORTED;
        }
        return IOStatus.normalize(n);
    } finally {
        threads.remove(ti);
        end (n > -1);
    }
}
```

通过上面的源码我们可以看到pip, socket, file 首先都通过`transferToDirectly()` 进行尝试零拷贝操作(具体实现在下面). 如果在调用jni方法`transferTo0()`时返回`UNSUPPORTED_CASE`, 则说明底层方法实现不支持该io的零拷贝操作. 而通过下面的源码(`FileChannelImpl.c`)可以看见, 在linux系统中实际是进行`sendfile()`系统调用的, 而该调用只支持file->socket的零拷贝传输, 所以在进行target非socket的时候,肯定会返回`UNSUPPORTED_CASE`. 那接下来就需要继续调用`transferToTrustedChannel()`了

```java
private long transferToTrustedChannel(long position, long count,
                                      WritableByteChannel target)
    throws IOException
{
    boolean isSelChImpl = (target instanceof SelChImpl);
    if (!((target instanceof FileChannelImpl) || isSelChImpl))
        return IOStatus.UNSUPPORTED;

    // Trusted target: Use a mapped buffer
    long remaining = count;
    while (remaining > 0L) {
        long size = Math.min(remaining, MAPPED_TRANSFER_SIZE);
        try {
            MappedByteBuffer dbb = map(MapMode.READ_ONLY, position, size);
            try {
                // ## Bug: Closing this channel will not terminate the write
                int n = target.write(dbb);
                assert n >= 0;
                remaining -= n;
                if (isSelChImpl) {
                    // one attempt to write to selectable channel
                    break;
                }
                assert n > 0;
                position += n;
            } finally {
                unmap(dbb);
            }
        } catch (ClosedByInterruptException e) {
            // target closed by interrupt as ClosedByInterruptException needs
            // to be thrown after closing this channel.
            assert !target.isOpen();
            try {
                close();
            } catch (Throwable suppressed) {
                e.addSuppressed(suppressed);
            }
            throw e;
        } catch (IOException ioe) {
            // Only throw exception if no bytes have been written
            if (remaining == count)
                throw ioe;
            break;
        }
    }
    return count - remaining;
}
```

`transferToTrustedChannel()` 内部就是调用了内存文件映射技术. 如果`transferToTrustedChannel()` 还是不能调用成功的话, 就接着调用transferToArbitraryChannel()了.

```java
private long transferToArbitraryChannel(long position, int icount, WritableByteChannel target) throws IOException
{
    // Untrusted target: Use a newly-erased buffer
    int c = Math.min(icount, TRANSFER_SIZE);
    ByteBuffer bb = Util.getTemporaryDirectBuffer(c);
    long tw = 0;                    // Total bytes written
    long pos = position;
    try {
        Util.erase(bb);
        while (tw < icount) {
            bb.limit(Math.min((int)(icount - tw), TRANSFER_SIZE));
            int nr = read(bb, pos);
            if (nr <= 0)
                break;
            bb.flip();
            // ## Bug: Will block writing target if this channel
            // ##      is asynchronously closed
            int nw = target.write(bb);
            tw += nw;
            if (nw != nr)
                break;
            pos += nw;
            bb.clear();
        }
        return tw;
    } catch (IOException x) {
        if (tw > 0)
            return tw;
        throw x;
    } finally {
        Util.releaseTemporaryDirectBuffer(bb);
    }
}
```

`transferToArbitraryChannel()`就是开辟了一块直接内存, 慢慢地一点一点拷贝, 这也就说什么上什么零拷贝了.

因此我们可以总结出,
* 如果目标target是socket的话, 就会调用linux的sendfile()零拷贝函数
* 如果目标target不是socket的话, 就会先尝试使用内存映射文件进行拷贝, 如果拷贝不成功的话, 就使用DirectBuffer进行拷贝.


```cpp
openjdk-jdk8u-jdk8u/jdk/src/solaris/native/sun/nio/ch/FileChannelImpl.c
JNIEXPORT jlong JNICALL
Java_sun_nio_ch_FileChannelImpl_transferTo0(JNIEnv *env, jobject this,
                                            jobject srcFDO,
                                            jlong position, jlong count,
                                            jobject dstFDO)
{
    jint srcFD = fdval(env, srcFDO);
    jint dstFD = fdval(env, dstFDO);

#if defined(__linux__)
    off64_t offset = (off64_t)position;
    jlong n = sendfile64(dstFD, srcFD, &offset, (size_t)count);
    if (n < 0) {
        if (errno == EAGAIN)
            return IOS_UNAVAILABLE;
        if ((errno == EINVAL) && ((ssize_t)count >= 0))
            return IOS_UNSUPPORTED_CASE;
        if (errno == EINTR) {
            return IOS_INTERRUPTED;
        }
        JNU_ThrowIOExceptionWithLastError(env, "Transfer failed");
        return IOS_THROWN;
    }
    return n;
#elif defined (__solaris__)
    sendfilevec64_t sfv;
    size_t numBytes = 0;
    jlong result;

    sfv.sfv_fd = srcFD;
    sfv.sfv_flag = 0;
    sfv.sfv_off = (off64_t)position;
    sfv.sfv_len = count;

    result = sendfilev64(dstFD, &sfv, 1, &numBytes);

    /* Solaris sendfilev() will return -1 even if some bytes have been
     * transferred, so we check numBytes first.
     */
    if (numBytes > 0)
        return numBytes;
    if (result < 0) {
        if (errno == EAGAIN)
            return IOS_UNAVAILABLE;
        if (errno == EOPNOTSUPP)
            return IOS_UNSUPPORTED_CASE;
        if ((errno == EINVAL) && ((ssize_t)count >= 0))
            return IOS_UNSUPPORTED_CASE;
        if (errno == EINTR)
            return IOS_INTERRUPTED;
        JNU_ThrowIOExceptionWithLastError(env, "Transfer failed");
        return IOS_THROWN;
    }
    return result;
#elif defined(__APPLE__)
    off_t numBytes;
    int result;

    numBytes = count;

    result = sendfile(srcFD, dstFD, position, &numBytes, NULL, 0);

    if (numBytes > 0)
        return numBytes;

    if (result == -1) {
        if (errno == EAGAIN)
            return IOS_UNAVAILABLE;
        if (errno == EOPNOTSUPP || errno == ENOTSOCK || errno == ENOTCONN)
            return IOS_UNSUPPORTED_CASE;
        if ((errno == EINVAL) && ((ssize_t)count >= 0))
            return IOS_UNSUPPORTED_CASE;
        if (errno == EINTR)
            return IOS_INTERRUPTED;
        JNU_ThrowIOExceptionWithLastError(env, "Transfer failed");
        return IOS_THROWN;
    }

    return result;

#elif defined(_AIX)
    jlong max = (jlong)java_lang_Integer_MAX_VALUE;
    struct sf_parms sf_iobuf;
    jlong result;

    if (position > max)
        return IOS_UNSUPPORTED_CASE;

    if (count > max)
        count = max;

    memset(&sf_iobuf, 0, sizeof(sf_iobuf));
    sf_iobuf.file_descriptor = srcFD;
    sf_iobuf.file_offset = (off_t)position;
    sf_iobuf.file_bytes = count;

    result = send_file(&dstFD, &sf_iobuf, SF_SYNC_CACHE);

    /* AIX send_file() will return 0 when this operation complete successfully,
     * return 1 when partial bytes transfered and return -1 when an error has
     * Occured.
     */
    if (result == -1) {
        if (errno == EWOULDBLOCK)
            return IOS_UNAVAILABLE;
        if ((errno == EINVAL) && ((ssize_t)count >= 0))
            return IOS_UNSUPPORTED_CASE;
        if (errno == EINTR)
            return IOS_INTERRUPTED;
        if (errno == ENOTSOCK)
            return IOS_UNSUPPORTED;
        JNU_ThrowIOExceptionWithLastError(env, "Transfer failed");
        return IOS_THROWN;
    }

    if (sf_iobuf.bytes_sent > 0)
        return (jlong)sf_iobuf.bytes_sent;

    return IOS_UNSUPPORTED_CASE;
#else
    return IOS_UNSUPPORTED_CASE;
#endif
}
```



```cpp
openjdk-jdk8u-jdk8u/jdk/src/share/native/sun/nio/ch/nio.h
#include "sun_nio_ch_IOStatus.h"

#define IOS_EOF              (sun_nio_ch_IOStatus_EOF)
#define IOS_UNAVAILABLE      (sun_nio_ch_IOStatus_UNAVAILABLE)
#define IOS_INTERRUPTED      (sun_nio_ch_IOStatus_INTERRUPTED)
#define IOS_UNSUPPORTED      (sun_nio_ch_IOStatus_UNSUPPORTED)
#define IOS_THROWN           (sun_nio_ch_IOStatus_THROWN)
#define IOS_UNSUPPORTED_CASE (sun_nio_ch_IOStatus_UNSUPPORTED_CASE)
```

这个状态就定义到了openjdk-jdk8u-jdk8u/jdk/src/share/classes/sun/nio/ch/IOStatus.java

```cpp
public final class IOStatus {

    @Native public static final int EOF = -1;              // End of file
    @Native public static final int UNAVAILABLE = -2;      // Nothing available (non-blocking)
    @Native public static final int INTERRUPTED = -3;      // System call interrupted
    @Native public static final int UNSUPPORTED = -4;      // Operation not supported
    @Native public static final int THROWN = -5;           // Exception thrown in JNI code
    @Native public static final int UNSUPPORTED_CASE = -6; // This case not supported
}
```
