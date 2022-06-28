---
category: Java
tag: jol
date: 2016-11-29
title: JOL 04 Inheritance
---

本篇文章基于[V0.16 JOLSample_04_Inheritance](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_04_Inheritance.java)

这个例子展示了在继承结构中，字段是如何布局的。

JVM会保证在继承结构中将可访问的字段布局在相同的偏移量上，而不管字段是被如何访问的。

例如在下面的例子中，总会先父类A的字段布局在前面。

```Java
import org.openjdk.jol.info.ClassLayout;
import org.openjdk.jol.vm.VM;

import static java.lang.System.out;

public class JOLSample_04_Inheritance {

	public static void main(String[] args) throws Exception {
		out.println(VM.current().details());
		out.println(ClassLayout.parseClass(C.class).toPrintable());
	}

	public static class A {
		int a;
	}

	public static class B extends A {
		int a;
	}

	public static class C extends B {
		int a;
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

examples.JOLSample_04_Inheritance$C object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     N/A
  8   4        (object header: class)    N/A
 12   4    int A.a                       N/A
 16   4    int B.a                       N/A
 20   4    int C.a                       N/A
Instance size: 24 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

但是还有一点需要说明，父类字段在子类字段布局时与在父类的偏移量是保持一致的, 子类并不会去填充它

```java
public class JOLSample_05_InheritanceBarrier {

	public static void main(String[] args) throws Exception {
		out.println(VM.current().details());
		out.println(ClassLayout.parseClass(C.class).toPrintable());
	}

	public static class A {
		long a;
	}

	public static class B extends A {
		long b;
	}

	public static class C extends B {
		long c;
		int d;
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

examples.JOLSample_05_InheritanceBarrier$C object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     N/A
  8   4        (object header: class)    N/A
 12   4        (alignment/padding gap)   
 16   8   long A.a                       N/A
 24   8   long B.b                       N/A
 32   8   long C.c                       N/A
 40   4    int C.d                       N/A
 44   4        (object alignment gap)    
Instance size: 48 bytes
Space losses: 4 bytes internal + 4 bytes external = 8 bytes total
```

同样的还有下面的例子
```java
public class JOLSample_06_Gaps {

	public static void main(String[] args) throws Exception {
		out.println(VM.current().details());
		out.println(ClassLayout.parseClass(C.class).toPrintable());
	}

	public static class A {
		boolean a;
	}

	public static class B extends A {
		boolean b;
	}

	public static class C extends B {
		boolean c;
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

examples.JOLSample_06_Gaps$C object internals:
OFF  SZ      TYPE DESCRIPTION               VALUE
  0   8           (object header: mark)     N/A
  8   4           (object header: class)    N/A
 12   1   boolean A.a                       N/A
 13   3           (alignment/padding gap)   
 16   1   boolean B.b                       N/A
 17   3           (alignment/padding gap)   
 20   1   boolean C.c                       N/A
 21   3           (object alignment gap)    
Instance size: 24 bytes
Space losses: 6 bytes internal + 3 bytes external = 9 bytes total
```

我们看到在继承结构中, 无论什么情况，都是父类先布局，且并不会用子类字段去尝试填充父类字段