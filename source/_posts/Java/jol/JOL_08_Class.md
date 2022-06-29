---
category: Java
tag: jol
date: 2016-11-29 10:55:00
title: JOL 08 Class
---

本篇文章基于[V0.16 JOLSample_08_Class](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_08_Class.java)

这个例子演示了JVM向class注入数据的例子，但是并不像 Exception 一样，它内部有一个backtrace这样的字段。在下面的Class中我们会看到什么字段都没有

```java
public class JOLSample_08_Class {

	public static void main(String[] args) throws Exception {
		out.println(VM.current().details());
		out.println(ClassLayout.parseClass(Class.class).toPrintable());
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

java.lang.Class object internals:
OFF  SZ                                              TYPE DESCRIPTION                    VALUE
  0   8                                                   (object header: mark)          N/A
  8   4                                                   (object header: class)         N/A
 12   4                     java.lang.reflect.Constructor Class.cachedConstructor        N/A
 16   4                                   java.lang.Class Class.newInstanceCallerCache   N/A
 20   4                                  java.lang.String Class.name                     N/A
 24   4                                                   (alignment/padding gap)        
 28   4                                  java.lang.String Class.simpleName               N/A
 32   4                                  java.lang.String Class.canonicalName            N/A
 36   4                       java.lang.ref.SoftReference Class.reflectionData           N/A
 40   4   sun.reflect.generics.repository.ClassRepository Class.genericInfo              N/A
 44   4                                java.lang.Object[] Class.enumConstants            N/A
 48   4                                     java.util.Map Class.enumConstantDirectory    N/A
 52   4                    java.lang.Class.AnnotationData Class.annotationData           N/A
 56   4             sun.reflect.annotation.AnnotationType Class.annotationType           N/A
 60   4                java.lang.ClassValue.ClassValueMap Class.classValueMap            N/A
 64  32                                                   (alignment/padding gap)        
 96   4                                               int Class.classRedefinedCount      N/A
100   4                                                   (object alignment gap)         
Instance size: 104 bytes
Space losses: 36 bytes internal + 4 bytes external = 40 bytes total
```

第64偏移位置就是jvm注入的数据