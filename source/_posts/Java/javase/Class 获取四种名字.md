---
category: Java
tag: JavaSE
date: 2015-10-01
title: Class 获取四种名字
---

当我们想要获取一个类的名字的时候, 我们能获得它的四个名字
```java
package wang.yu66.javase.basic;

import java.util.function.BiConsumer;

public class Print4WayInnerClassName {

  public static void main(String[] args) {
      System.out.println(Print4WayInnerClassName.class.getName());
      System.out.println(Print4WayInnerClassName.class.getSimpleName());
      System.out.println(Print4WayInnerClassName.class.getTypeName());
      System.out.println(Print4WayInnerClassName.class.getCanonicalName());

      System.out.println("*************************************************");

      System.out.println(InnerA.class.getName());
      System.out.println(InnerA.class.getSimpleName());
      System.out.println(InnerA.class.getTypeName());
      System.out.println(InnerA.class.getCanonicalName());

      System.out.println("*************************************************");

      int[] array = new int[0];
      System.out.println(array.getClass().getName());
      System.out.println(array.getClass().getSimpleName());
      System.out.println(array.getClass().getTypeName());
      System.out.println(array.getClass().getCanonicalName());

      System.out.println("*************************************************");
      BiConsumer biConsumer = (a, b) -> {};
      System.out.println(biConsumer.getClass().getName());
      System.out.println(biConsumer.getClass().getSimpleName());
      System.out.println(biConsumer.getClass().getTypeName());
      System.out.println(biConsumer.getClass().getCanonicalName());
  }

  interface InnerA {}
}
```

输出如下

```
wang.yu66.javase.basic.Print4WayInnerClassName
Print4WayInnerClassName
wang.yu66.javase.basic.Print4WayInnerClassName
wang.yu66.javase.basic.Print4WayInnerClassName
*************************************************
wang.yu66.javase.basic.Print4WayInnerClassName$InnerA
InnerA
wang.yu66.javase.basic.Print4WayInnerClassName$InnerA
wang.yu66.javase.basic.Print4WayInnerClassName.InnerA
*************************************************
[I
int[]
int[]
int[]
*************************************************
wang.yu66.javase.basic.Print4WayInnerClassName$$Lambda$1/2093631819
Print4WayInnerClassName$$Lambda$1/2093631819
wang.yu66.javase.basic.Print4WayInnerClassName$$Lambda$1/2093631819
wang.yu66.javase.basic.Print4WayInnerClassName$$Lambda$1/2093631819
```

那这四种名字都有什么不同呢?
* getName() : 当要动态加载一个类的时候, 那么应该使用这个方法获得的名字(例如使用Class.forName())
* getSimpleName() : 这个方法返回的类的类名, 但是并不会带有全限定名, 也就是不带有包名
* getCanonicalName() : 这个方法会返回一个类的全限定名, 和getName()类似. 但是需要注意的是, 当使用内部类的时候getName返回的是$, 而getCanoicalName返回的是. . 这个方法只是适用于输出类名, 可以唯一标示一个类, 但是千万不要用这个方法做类的动态加载之类的事情