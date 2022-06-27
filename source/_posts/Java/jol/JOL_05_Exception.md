---
category: Java
tag: jol
date: 2016-11-29
title: JOL 05 Exception
---

这个例子展示了VM中特殊处理的一些字段

```java
public class JOLSample_07_Exceptions {

	public static void main(String[] args) throws Exception {
		out.println(VM.current().details());
		out.println(ClassLayout.parseClass(Throwable.class).toPrintable());
	}

}
```

运行结果
```
# Running 64-bit HotSpot VM.
# Using compressed oop with 3-bit shift.
# Using compressed klass with 3-bit shift.
# WARNING | Compressed references base/shifts are guessed by the experiment!
# WARNING | Therefore, computed addresses are just guesses, and ARE NOT RELIABLE.
# WARNING | Make sure to attach Serviceability Agent to get the reliable addresses.
# Objects are 8 bytes aligned.
# Field sizes by type: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]
# Array element sizes: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]

java.lang.Throwable object internals:
OFF  SZ                            TYPE DESCRIPTION                      VALUE
  0   8                                 (object header: mark)            N/A
  8   4                                 (object header: class)           N/A
 12   4                                 (alignment/padding gap)          
 16   4                java.lang.String Throwable.detailMessage          N/A
 20   4             java.lang.Throwable Throwable.cause                  N/A
 24   4   java.lang.StackTraceElement[] Throwable.stackTrace             N/A
 28   4                  java.util.List Throwable.suppressedExceptions   N/A
Instance size: 32 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total
```

我们从源码中看到 `Throwable` 有个字段是 `transient Object backtrace`, 但是这个字段在上面的布局中并没有显示出来，这是因为这个字段关联的是jvm的一些内部信息，这些信息不是为了提供给用户看的, 因此就没展示出来