---
category: Java
tag: jol
date: 2016-11-29 12:05:00
title: JOL 11 Class Word
---

本篇文章基于[V0.16 JOLSample_11_ClassWord](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_11_ClassWord.java)

这个例子让我们再深入了解一下对象头。

```java
public class JOLSample_11_ClassWord {

	public static void main(String[] args) throws Exception {
		out.println(VM.current().details());
		out.println(ClassLayout.parseInstance(new A()).toPrintable());
		out.println(ClassLayout.parseInstance(new B()).toPrintable());
	}

	public static class A {
		// no fields
	}

	public static class B {
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

examples.JOLSample_11_ClassWord$A object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000005 (biasable; age: 0)
  8   4        (object header: class)    0xf80121e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

examples.JOLSample_11_ClassWord$B object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000005 (biasable; age: 0)
  8   4        (object header: class)    0xf8012404
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```

我们看到在类语义上相等的对象，它们的mark word的值是一样的，但是clas word值不一样，分别指向了不同的类(这个值是内存地址, 每次运行值都会不一样)