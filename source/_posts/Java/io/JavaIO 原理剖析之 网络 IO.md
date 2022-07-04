---
category: Java
tag: Java IO
date:  2019-05-27
title: JavaIO 原理剖析之 网络 IO
---

> [JavaIO 原理剖析之 网络 IO](https://zhuanlan.zhihu.com/p/62166017)

上篇文章介绍了下磁盘IO的原理, 今天介绍一下网络IO的原理, 但是今天只会介绍IO部分, Socket部分会在后续文章中介绍.

还是从一个简单的demo开始
```java
public class Test {

	public static void main(String[] args) throws IOException {
		Socket socket = new Socket();
		socket.bind(new InetSocketAddress(9000));

		InputStream in = socket.getInputStream();
		OutputStream out = socket.getOutputStream();
	}
}
```

在demo中, 我们new了一个socket实例, 然后用这个实例去连接本地9000端口的socket服务.然后分别拿到了一个输入流和一个输出流.

### InputStream

我们看一下获取InputStream的实现:
```java
// 在Socket类中, 有如下定义:

SocketImpl impl;
    
public InputStream getInputStream() throws IOException {
        if (isClosed())
            throw new SocketException("Socket is closed");
        if (!isConnected())
            throw new SocketException("Socket is not connected");
        if (isInputShutdown())
            throw new SocketException("Socket input is shutdown");
        final Socket s = this;
        InputStream is = null;
        try {
            is = AccessController.doPrivileged(
                new PrivilegedExceptionAction<InputStream>() {
                    public InputStream run() throws IOException {
                        return impl.getInputStream();
                    }
                });
        } catch (java.security.PrivilegedActionException e) {
            throw (IOException) e.getException();
        }
        return is;
    }
```

在Socket内部封装了一个SocketImpl实例, 最终通过该实例获取InputStream的. 下面是SocketImpl的继承结构(关于这个socket实现后面会有文章详细讲解).

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/io3.jpg)

而最终的实现是在AbstractPlainSocketImpl中
```java
// AbstractPlainSocketImpl 
  
protected synchronized InputStream getInputStream() throws IOException {
        synchronized (fdLock) {
            if (isClosedOrPending())
                throw new IOException("Socket Closed");
            if (shut_rd)
                throw new IOException("Socket input is shutdown");
            if (socketInputStream == null)
                socketInputStream = new SocketInputStream(this);
        }
        return socketInputStream;
    }
```

在这里可以看到, 如果第一次stream为空的话, 则直接`new SocketInputStream().`


![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/io4.jpg)

真正的的读写操作也就是在`SocketInputStream`里.

```java
// SocketInputStream
 int read(byte b[], int off, int length, int timeout) throws IOException {
        int n;

        // EOF already encountered
        if (eof) {
            return -1;
        }

        // connection reset
        if (impl.isConnectionReset()) {
            throw new SocketException("Connection reset");
        }

        // bounds check
        if (length <= 0 || off < 0 || length > b.length - off) {
            if (length == 0) {
                return 0;
            }
            throw new ArrayIndexOutOfBoundsException("length == " + length
                    + " off == " + off + " buffer length == " + b.length);
        }

        boolean gotReset = false;

        // acquire file descriptor and do the read
        FileDescriptor fd = impl.acquireFD();
        try {
            n = socketRead(fd, b, off, length, timeout);
            if (n > 0) {
                return n;
            }
        } catch (ConnectionResetException rstExc) {
            gotReset = true;
        } finally {
            impl.releaseFD();
        }

        /*
         * We receive a "connection reset" but there may be bytes still
         * buffered on the socket
         */
        if (gotReset) {
            impl.setConnectionResetPending();
            impl.acquireFD();
            try {
                n = socketRead(fd, b, off, length, timeout);
                if (n > 0) {
                    return n;
                }
            } catch (ConnectionResetException rstExc) {
            } finally {
                impl.releaseFD();
            }
        }

        /*
         * If we get here we are at EOF, the socket has been closed,
         * or the connection has been reset.
         */
        if (impl.isClosedOrPending()) {
            throw new SocketException("Socket closed");
        }
        if (impl.isConnectionResetPending()) {
            impl.setConnectionReset();
        }
        if (impl.isConnectionReset()) {
            throw new SocketException("Connection reset");
        }
        eof = true;
        return -1;
    }

    private int socketRead(FileDescriptor fd,
                           byte b[], int off, int len,
                           int timeout)
        throws IOException {
        return socketRead0(fd, b, off, len, timeout);
    }

   private native int socketRead0(FileDescriptor fd,
                                   byte b[], int off, int len,
                                   int timeout)
        throws IOException;
```

在read过程中, 首先是是否达到文件流末尾, 长度是否符合等校验. 校验完成之后, 通过调用`socketRead();` 将socket缓冲区的数据读取进b中.

此时如果发生 `ConnectionResetException`异常, 对方可能是关闭了连接, 但是内和缓冲区中, 可能还会有数据没有读取完, 则后面再尝试读取一次, 将剩余的内容读取出来.

`socketRead()`方法最终调用native方法 `socketRead0()`.

```cpp
// 下列内容在: openjdk-jdk8u-jdk8u/jdk/src/solaris/native/java/net/SocketInputStream.c

/*
 * Class:     java_net_SocketInputStream
 * Method:    socketRead0
 * Signature: (Ljava/io/FileDescriptor;[BIII)I
 */
JNIEXPORT jint JNICALL
Java_java_net_SocketInputStream_socketRead0(JNIEnv *env, jobject this,
                                            jobject fdObj, jbyteArray data,
                                            jint off, jint len, jint timeout)
{
    char BUF[MAX_BUFFER_LEN];
    char *bufP;
    jint fd, nread;
    ...
    /*
     * If the read is greater than our stack allocated buffer then
     * we allocate from the heap (up to a limit)
     */
    if (len > MAX_BUFFER_LEN) {
        if (len > MAX_HEAP_BUFFER_LEN) {
            len = MAX_HEAP_BUFFER_LEN;
        }
        bufP = (char *)malloc((size_t)len);
        if (bufP == NULL) {
            bufP = BUF;
            len = MAX_BUFFER_LEN;
        }
    } else {
        bufP = BUF;
    }
#if defined(__solaris__)
    if (timeout) {
        nread = NET_Timeout(fd, timeout);
        if (nread <= 0) {
            if (nread == 0) {
                JNU_ThrowByName(env, JNU_JAVANETPKG "SocketTimeoutException",
                            "Read timed out");
            } else if (nread == JVM_IO_ERR) {
                if (errno == EBADF) {
                     JNU_ThrowByName(env, JNU_JAVANETPKG "SocketException", "Socket closed");
                 } else if (errno == ENOMEM) {
                     JNU_ThrowOutOfMemoryError(env, "NET_Timeout native heap allocation failed");
                 } else {
                     NET_ThrowByNameWithLastError(env, JNU_JAVANETPKG "SocketException",
                                                  "select/poll failed");
                 }
            } else if (nread == JVM_IO_INTR) {
                JNU_ThrowByName(env, JNU_JAVAIOPKG "InterruptedIOException",
                            "Operation interrupted");
            }
            if (bufP != BUF) {
                free(bufP);
            }
            return -1;
        }
    }
    nread = NET_Read(fd, bufP, len);
#else
    if (timeout) {
        nread = NET_ReadWithTimeout(env, fd, bufP, len, timeout);
        if ((*env)->ExceptionCheck(env)) {
            if (bufP != BUF) {
                free(bufP);
            }
            return nread;
        }
    } else {
        nread = NET_Read(fd, bufP, len);
    }
#endif
    if (nread <= 0) {
        if (nread < 0) {
            switch (errno) {
                case ECONNRESET:
                case EPIPE:
                    JNU_ThrowByName(env, "sun/net/ConnectionResetException",
                        "Connection reset");
                    break;
                case EBADF:
                    JNU_ThrowByName(env, JNU_JAVANETPKG "SocketException",
                        "Socket closed");
                    break;
                case EINTR:
                     JNU_ThrowByName(env, JNU_JAVAIOPKG "InterruptedIOException",
                           "Operation interrupted");
                     break;
                default:
                    NET_ThrowByNameWithLastError(env,
                        JNU_JAVANETPKG "SocketException", "Read failed");
            }
        }
    } else {
        (*env)->SetByteArrayRegion(env, data, off, nread, (jbyte *)bufP);
    }
    if (bufP != BUF) {
        free(bufP);
    }
    return nread;
}
```

从上面的代码中我们可以看到三个

1. 首先分配一个`MAX_BUFFER_LEN`长度的BUF内存
2. 如果要读取的数据长度小于`MAX_BUFFER_LEN`, 就用BUF内存进行读取, 否则就`malloc((size_t)len);`重新申请一块内存出来.
3. 在solaris系统中(绝大多数实现都是solaris实现) 首先设置`NET_Timeout(fd, timeout)`, 设置一个读写超时时间, 这个timeout就是我们通过`SO_TIMEOUT` 设置的值.
4. 接着调用`NET_Read(fd, bufP, len)` 将fd的内核socket读缓冲区的数据读入到`bufP`里.
5. 接着调用`SetByteArrayRegion()`; 将c堆内存数据拷贝到jvm堆内存中(这个可以参考上一篇文章)
6. 最后释放读缓存`bufP`

### 错误处理

在`NET_Timeout()`函数中, 最终会返回`0(已经超时)`, `-1(socket关闭)`, 和触发事件数.

* 如果返回的是`0`, 则抛出 `SocketTimeoutException`异常, 错误信息为: `Read timed out`
* 如果返回的是`-1(JVM_IO_ERR)`, 再跟进不同的errno进行处理.

TODO:

* `EBADF`: 抛出`SocketException, Socket closed.`
* `ENOMEM`: 抛出`OutOfMemoryError, NET_Timeout native heap allocation failed`.
* `EINTR`: 抛出`SocketException, Read failed.`

### NET_Timeout

`NET_Timeout(fd, timeout)`是如何实现的呢 ?

在`SocketInputStream.c` 中引入了`net_util.h` 头文件, 而在`net_util.h` 头文件中引入了`net_util_md.h`, 最终在`net_util_md.h`找到了`NET_Timeout(fd, timeout)`定义:

```cpp
// 下列内容在: openjdk-jdk8u-jdk8u/jdk/src/solaris/native/java/net/net_util_md.c

int NET_Timeout(int s, long timeout) {
    long currentTime = (timeout > 0) ? NET_GetCurrentTime() : 0;
    return NET_Timeout0(s, timeout, currentTime);
}

// 下列内容在: openjdk-jdk8u-jdk8u_vscode/jdk/src/solaris/native/java/net/linux_close.c

/*
 * Wrapper for poll(s, timeout).
 * Auto restarts with adjusted timeout if interrupted by
 * signal other than our wakeup signal.
 */
int NET_Timeout0(int s, long timeout, long currentTime) {
    long prevtime = currentTime, newtime;
    struct timeval t;
    fdEntry_t *fdEntry = getFdEntry(s);

    /*
     * Check that fd hasn't been closed.
     */
    if (fdEntry == NULL) {
        errno = EBADF;
        return -1;
    }

    for(;;) {
        struct pollfd pfd;
        int rv;
        threadEntry_t self;

        /*
         * Poll the fd. If interrupted by our wakeup signal
         * errno will be set to EBADF.
         */
        pfd.fd = s;
        pfd.events = POLLIN | POLLERR;

        startOp(fdEntry, &self);
        rv = poll(&pfd, 1, timeout);
        endOp(fdEntry, &self);

        /*
         * If interrupted then adjust timeout. If timeout
         * has expired return 0 (indicating timeout expired).
         */
        if (rv < 0 && errno == EINTR) {
            if (timeout > 0) {
                gettimeofday(&t, NULL);
                newtime = t.tv_sec * 1000  +  t.tv_usec / 1000;
                timeout -= newtime - prevtime;
                if (timeout <= 0) {
                    return 0;
                }
                prevtime = newtime;
            }
        } else {
            return rv;
        }

    }
}
```

我们看到, 其实是通过poll这种方式来实现的timeout的.

在`pfd`上注册`POLLIN` 和 `POLLERR`这俩个事件, 一旦有这俩个事件触发或者超时, poll函数就会返回, 表示有可读事件或者有异常信息.

* 如果从fd中获取不到`fdEntry`则说明fd被关闭了, socket被关闭了, 则返回-1;
* 接下来是循环中调用`poll()`系统调用.
* 如果rv小于0, 且`errno`等于`EINTR`, 则判断是否是真正超时, 否则返回触发是事件数, 同时在函数外针对不同的`errno`进行不同的处理.
* 在计算超时时间时, 如果设置的超时时间大于0的话, 才去计算超时时间, 超时时间如果小于等于0, 则返回0, 否则继续循环调用poll.

`NET_Timeout()`这个函数最终会返回`0(已经超时)`, `-1(socket关闭)`, 和`触发事件数`.

poll函数返回值(参考自百度百科)

>  `>0`：数组fds中准备好读、写或出错状态的那些socket描述符的总数量；
>  `==0`：数组fds中没有任何socket描述符准备好读、写，或出错；此时poll超时，超时时间是timeout毫秒；换句话说，如果所检测的socket描述符上没有任何事件发生的话，那么poll()函数会阻塞timeout所指定的毫秒时间长度之后返回，如果timeout==0，那么poll() 函数立即返回而不阻塞，如果timeout==INFTIM，那么poll() 函数会一直阻塞下去，直到所检测的socket描述符上的感兴趣的事件发生是才返回，如果感兴趣的事件永远不发生，那么poll()就会永远阻塞下去；
> `-1`： poll函数调用失败，同时会自动设置全局变量errno；

errno(参考自C [错误处理](https://www.runoob.com/cprogramming/c-error-handling.html))

> C 语言不提供对错误处理的直接支持，但是作为一种系统编程语言，它以返回值的形式允许您访问底层数据。在发生错误时，大多数的 C 或 UNIX 函数调用返回 1 或 NULL，同时会设置一个错误代码 errno，该错误代码是全局变量，表示在函数调用期间发生了错误。您可以在 errno.h 头文件中找到各种各样的错误代码。
> 所以，C 程序员可以通过检查返回值，然后根据返回值决定采取哪种适当的动作。开发人员应该在程序初始化时，把 errno 设置为 0，这是一种良好的编程习惯。0 值表示程序中没有错误。


### NET_Read

下面我们看一下`NET_Read(fd, bufP, len)`实现

```cpp
// 下列内容在: openjdk-jdk8u-jdk8u/jdk/src/solaris/native/java/net/linux_close.c

/*
 * Macro to perform a blocking IO operation. Restarts
 * automatically if interrupted by signal (other than
 * our wakeup signal)
 */
#define BLOCKING_IO_RETURN_INT(FD, FUNC) {      \
    int ret;                                    \
    threadEntry_t self;                         \
    fdEntry_t *fdEntry = getFdEntry(FD);        \
    if (fdEntry == NULL) {                      \
        errno = EBADF;                          \
        return -1;                              \
    }                                           \
    do {                                        \
        startOp(fdEntry, &self);                \
        ret = FUNC;                             \
        endOp(fdEntry, &self);                  \
    } while (ret == -1 && errno == EINTR);      \
    return ret;                                 \
}

int NET_Read(int s, void* buf, size_t len) {
    BLOCKING_IO_RETURN_INT( s, recv(s, buf, len, 0) );
}

/*
 * Start a blocking operation :-
 *    Insert thread onto thread list for the fd.
 */
static inline void startOp(fdEntry_t *fdEntry, threadEntry_t *self)
{
    self->thr = pthread_self();
    self->intr = 0;
    pthread_mutex_lock(&(fdEntry->lock));
    {
        self->next = fdEntry->threads;
        fdEntry->threads = self;
    }
    pthread_mutex_unlock(&(fdEntry->lock));
}
/*
 * End a blocking operation :-
 *     Remove thread from thread list for the fd
 *     If fd has been interrupted then set errno to EBADF
 */
static inline void endOp
    (fdEntry_t *fdEntry, threadEntry_t *self)
{
    int orig_errno = errno;
    pthread_mutex_lock(&(fdEntry->lock));
    {
        threadEntry_t *curr, *prev=NULL;
        curr = fdEntry->threads;
        while (curr != NULL) {
            if (curr == self) {
                if (curr->intr) {
                    orig_errno = EBADF;
                }
                if (prev == NULL) {
                    fdEntry->threads = curr->next;
                } else {
                    prev->next = curr->next;
                }
                break;
            }
            prev = curr;
            curr = curr->next;
        }
    }
    pthread_mutex_unlock(&(fdEntry->lock));
    errno = orig_errno;
}
```

recv 如果读取到的字节数小于0, 需要根据不同的errno进行后续处理:

* `ECONNRESET``: 抛出异常 `ConnectionResetException, Connection reset`.
* `EBADF`: 抛出异常 `SocketException, Socket closed`. 
* `EINTR`: 抛出异常 `InterruptedIOException, Operation interrupted`.
* 都不是则抛出, `SocketException, Read failed`.


### OutputStream

看完读, 再看一下`OutputStream`.

这次我们也是从`AbstractPlainSocketImpl`中入手
```java
 protected synchronized OutputStream getOutputStream() throws IOException {
        synchronized (fdLock) {
            if (isClosedOrPending())
                throw new IOException("Socket Closed");
            if (shut_wr)
                throw new IOException("Socket output is shutdown");
            if (socketOutputStream == null)
                socketOutputStream = new SocketOutputStream(this);
        }
        return socketOutputStream;
    }
```

嗯,不出所料是个`SocketOutputStream`


![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/io5.jpg)

```java
 public void write(byte b[]) throws IOException {
        socketWrite(b, 0, b.length);
    }

 private void socketWrite(byte b[], int off, int len) throws IOException {


        if (len <= 0 || off < 0 || len > b.length - off) {
            if (len == 0) {
                return;
            }
            throw new ArrayIndexOutOfBoundsException("len == " + len
                    + " off == " + off + " buffer length == " + b.length);
        }

        FileDescriptor fd = impl.acquireFD();
        try {
            socketWrite0(fd, b, off, len);
        } catch (SocketException se) {
            if (se instanceof sun.net.ConnectionResetException) {
                impl.setConnectionResetPending();
                se = new SocketException("Connection reset");
            }
            if (impl.isClosedOrPending()) {
                throw new SocketException("Socket closed");
            } else {
                throw se;
            }
        } finally {
            impl.releaseFD();
        }
    }

   private native void socketWrite0(FileDescriptor fd, byte[] b, int off,
                                     int len) throws IOException;
```

最终也是通过`socketWrite0()` 这个native方法实现的.

```cpp
// 下列内容在: openjdk-jdk8u-jdk8u_vscode/jdk/src/solaris/native/java/net/SocketOutputStream.c

/*
 * Class:     java_net_SocketOutputStream
 * Method:    socketWrite0
 * Signature: (Ljava/io/FileDescriptor;[BII)V
 */
JNIEXPORT void JNICALL
Java_java_net_SocketOutputStream_socketWrite0(JNIEnv *env, jobject this,
                                              jobject fdObj,
                                              jbyteArray data,
                                              jint off, jint len) {
    char *bufP;
    char BUF[MAX_BUFFER_LEN];
    int buflen;
    int fd;

    if (IS_NULL(fdObj)) {
        JNU_ThrowByName(env, "java/net/SocketException", "Socket closed");
        return;
    } else {
        fd = (*env)->GetIntField(env, fdObj, IO_fd_fdID);
        /* Bug 4086704 - If the Socket associated with this file descriptor
         * was closed (sysCloseFD), the the file descriptor is set to -1.
         */
        if (fd == -1) {
            JNU_ThrowByName(env, "java/net/SocketException", "Socket closed");
            return;
        }

    }

    if (len <= MAX_BUFFER_LEN) {
        bufP = BUF;
        buflen = MAX_BUFFER_LEN;
    } else {
        buflen = min(MAX_HEAP_BUFFER_LEN, len);
        bufP = (char *)malloc((size_t)buflen);

        /* if heap exhausted resort to stack buffer */
        if (bufP == NULL) {
            bufP = BUF;
            buflen = MAX_BUFFER_LEN;
        }
    }

    while(len > 0) {
        int loff = 0;
        int chunkLen = min(buflen, len);
        int llen = chunkLen;
        (*env)->GetByteArrayRegion(env, data, off, chunkLen, (jbyte *)bufP);

        if ((*env)->ExceptionCheck(env)) {
            break;
        } else {
            while(llen > 0) {
                int n = NET_Send(fd, bufP + loff, llen, 0);
                if (n > 0) {
                    llen -= n;
                    loff += n;
                    continue;
                }
                if (n == JVM_IO_INTR) {
                    JNU_ThrowByName(env, "java/io/InterruptedIOException", 0);
                } else {
                    if (errno == ECONNRESET) {
                        JNU_ThrowByName(env, "sun/net/ConnectionResetException",
                            "Connection reset");
                    } else {
                        NET_ThrowByNameWithLastError(env, "java/net/SocketException",
                            "Write failed");
                    }
                }
                if (bufP != BUF) {
                    free(bufP);
                }
                return;
            }
            len -= chunkLen;
            off += chunkLen;
        }
    }

    if (bufP != BUF) {
        free(bufP);
    }
}
```

当在向socket写的时候, 首先需要将jvm堆内的数据拷贝到用户空间c堆的一块内存中, 然后再将c堆的这块内存数据发往fd的socket写缓冲区中.

下面看一下`NET_Send()`实现
```cpp
// 下列内容在: openjdk-jdk8u-jdk8u_vscode/jdk/src/solaris/native/java/net/linux_close.c

int NET_Send(int s, void *msg, int len, unsigned int flags) {
    BLOCKING_IO_RETURN_INT( s, send(s, msg, len, flags) );
}

#define BLOCKING_IO_RETURN_INT(FD, FUNC) {      \
    int ret;                                    \
    threadEntry_t self;                         \
    fdEntry_t *fdEntry = getFdEntry(FD);        \
    if (fdEntry == NULL) {                      \
        errno = EBADF;                          \
        return -1;                              \
    }                                           \
    do {                                        \
        startOp(fdEntry, &self);                \
        ret = FUNC;                             \
        endOp(fdEntry, &self);                  \
    } while (ret == -1 && errno == EINTR);      \
    return ret;                                 \
}
```

最终就是通过调用send这个系统调用, 将c堆的数据写到了内核缓冲区中.

### 引用

下面引用了一段网上对recv, send函数的解释, 但是很多博客站点都有这段说明, 找不到源处了, 如有知道的大大, 请告知一下哈. (引用自[Socket send函数和recv函数详解](https://www.cnblogs.com/jianqiang2010/archive/2010/08/20/1804598.html))

> send 函数
> 
>     `int send( SOCKET s, const char FAR *buf, int len, int flags );`
>     不论是客户还是服务器应用程序都用send函数来向TCP连接的另一端发送数据。客户程序一般用send函数向服务器发送请求，而服务器则通常用send函数来向客户程序发送应答。
>     该函数的第一个参数指定发送端套接字描述符；
>     第二个参数指明一个存放应用程序要发送数据的缓冲区；
>     第三个参数指明实际要发送的数据的字节数；
>     第四个参数一般置0。
>     这里只描述同步Socket的send函数的执行流程。当调用该函数时，
>     （1）send先比较待发送数据的长度len和套接字s的发送缓冲的长度， 如果len大于s的发送缓冲区的长度，该函数返回SOCKET_ERROR；
>     （2）如果len小于或者等于s的发送缓冲区的长度，那么send先检查协议是否正在发送s的发送缓冲中的数据，如果是就等待协议把数据发送完，如果协议还没有开始发送s的发送缓冲中的数据或者s的发送缓冲中没有数据，那么send就比较s的发送缓冲区的剩余空间和len
>     （3）如果len大于剩余空间大小，send就一直等待协议把s的发送缓冲中的数据发送完
>     （4）如果len小于剩余 空间大小，send就仅仅把buf中的数据copy到剩余空间里（注意并不是send把s的发送缓冲中的数据传到连接的另一端的，而是协议传的，send仅仅是把buf中的数据copy到s的发送缓冲区的剩余空间里）。
> 
>     如果send函数copy数据成功，就返回实际copy的字节数，如果send在copy数据时出现错误，那么send就返回SOCKET_ERROR；如果send在等待协议传送数据时网络断开的话，那么send函数也返回SOCKET_ERROR。
>     要注意send函数把buf中的数据成功copy到s的发送缓冲的剩余空间里后它就返回了，但是此时这些数据并不一定马上被传到连接的另一端。如果协议在后续的传送过程中出现网络错误的话，那么下一个Socket函数就会返回SOCKET_ERROR。（每一个除send外的Socket函数在执 行的最开始总要先等待套接字的发送缓冲中的数据被协议传送完毕才能继续，如果在等待时出现网络错误，那么该Socket函数就返回 SOCKET_ERROR）
>     注意：在Unix系统下，如果send在等待协议传送数据时网络断开的话，调用send的进程会接收到一个SIGPIPE信号，进程对该信号的默认处理是进程终止。
>     通过测试发现，异步socket的send函数在网络刚刚断开时还能发送返回相应的字节数，同时使用select检测也是可写的，但是过几秒钟之后，再send就会出错了，返回-1。select也不能检测出可写了。
