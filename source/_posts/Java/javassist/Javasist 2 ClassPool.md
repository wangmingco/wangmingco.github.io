---
category: Java
tag: Javasist
title: Javasist ClassPool
date: 2019-05-02 20:15:00
---

A ClassPool object is a container of CtClass objects. Once a CtClass object is created, it is recorded in a ClassPool for ever. This is because a compiler may need to access the CtClass object later when it compiles source code that refers to the class represented by that CtClass.

`ClassPool`对象是CtClass对象的集合. 一旦CtClass对象被创建出来, 它就会被永远地保存在ClassPool中. 这是因为编译器在编译源码的时候可能还需要访问这些CtClass对象.

For example, suppose that a new method getter() is added to a CtClass object representing Point class. Later, the program attempts to compile source code including a method call to getter() in Point and use the compiled code as the body of a method, which will be added to another class Line. If the CtClass object representing Point is lost, the compiler cannot compile the method call to getter(). Note that the original class definition does not include getter(). Therefore, to correctly compile such a method call, the ClassPool must contain all the instances of CtClass all the time of program execution.

例如, 向Point类的CtClass对象添加一个新的getter()方法. 然后程序将某段调用Point的getter()方法的源码片段进行编译, 然后将编译好的代码片段放到另外一个类里. 如果找不到代表Point的CtClass的话, 编译器就没办法编译对getter()方法的调用. 注意, 原先的class是不包含getter()方法的. 因此, 为了能正确进行编译, 在程序运行期间, ClassPool必须包含全部的CtClass实例.

## Avoid out of memory
This specification of ClassPool may cause huge memory consumption if the number of CtClass objects becomes amazingly large (this rarely happens since Javassist tries to reduce memory consumption in various ways). To avoid this problem, you can explicitly remove an unnecessary CtClass object from the ClassPool. If you call detach() on a CtClass object, then that CtClass object is removed from the ClassPool. For example,

按照上文描述的那样, 如果CtClass实例数量飞速增长的话, ClassPool就有可能会引起巨大的内存消耗(但是实际上这种情况很少发生, 因此Javassist会通过多种方式减少内存消耗). 为了解决这种问题, 你可以显式地从ClassPool里面删除不需要的CtClass实例. 如果你在CtClass对象上调用detach()方法的, 该对象就会从ClassPool里面移除. 例如: 


```java
CtClass cc = ... ;
cc.writeFile();
cc.detach();
```

当 detach() 方法被调用之后, CtClass实例的其他方法就不再允许被调用. 但是你可以接着调用ClassPool的get()方法, 再获得一个相同class的新的CtClass实例. 如果你调用了`get()`方法, ClassPool会重新读取class 文件, 然后再创建一个新的CtClass对象.

You must not call any method on that CtClass object after detach() is called. However, you can call get() on ClassPool to make a new instance of CtClass representing the same class. If you call get(), the ClassPool reads a class file again and newly creates a CtClass object, which is returned by get().

另一种思路是再重新创建一个ClassPool, 然后将旧的那个舍弃掉. 如果旧的ClassPool被gc掉了, 那么原先ClassPool里的CtClass对象也都被gc掉了. 如果要创建一个新的ClassPool实例, 执行下面的代码即可:

Another idea is to occasionally replace a ClassPool with a new one and discard the old one. If an old ClassPool is garbage collected, the CtClass objects included in that ClassPool are also garbage collected. To create a new instance of ClassPool, execute the following code snippet:

```java
ClassPool cp = new ClassPool(true);
// if needed, append an extra search path by appendClassPath()
```

刚才创建的ClassPool的行为和通过调用ClassPool.getDefault()返回的默认ClassPool是一样的. 注意ClassPool.getDefault()是出于便捷目的而存在的一个单例工厂方法. ClassPool.getDefault() 会像上面那样创建一个ClassPool 对象, 然后作为单例存在, 一直复用它. 通过getDefault()返回的ClassPool并没有特殊的规则. getDefault() 只是一个快捷方法.

This creates a ClassPool object that behaves as the default ClassPool returned by ClassPool.getDefault() does. Note that ClassPool.getDefault() is a singleton factory method provided for convenience. It creates a ClassPool object in the same way shown above although it keeps a single instance of ClassPool and reuses it. A ClassPool object returned by getDefault() does not have a special role. getDefault() is a convenience method.

注意 new ClassPool(true) 是一个快捷构造器,  它只是构建了一个ClassPool对象, 然后将系统搜索路径添加到这上面. 该构造器方法和下面方法等同.
Note that new ClassPool(true) is a convenient constructor, which constructs a ClassPool object and appends the system search path to it. Calling that constructor is equivalent to the following code:

```java
ClassPool cp = new ClassPool();
cp.appendSystemPath();  // or append another path by appendClassPath()
```

## Cascaded ClassPools

如果应用程序是运行在一个web 服务器上, 那么就有可能需要创建多个ClassPool实例. 每个class Loader都需要创建一个ClassPool实例. 在这种背景下, 就需要通过ClassPool的构造器创建ClassPool实例, 而不能再通过getDefault()方法获得了.

If a program is running on a web application server, creating multiple instances of ClassPool might be necessary; an instance of ClassPool should be created for each class loader (i.e. container). The program should create a ClassPool object by not calling getDefault() but a constructor of ClassPool.

Multiple ClassPool objects can be cascaded like java.lang.ClassLoader. For example,

多个ClassPool对象可以像java.lang.ClassLoader那样呗级联起来. 例如:

```java
ClassPool parent = ClassPool.getDefault();
ClassPool child = new ClassPool(parent);
child.insertClassPath("./classes");
```

如果child.get()方法被调用, child ClassPool首先将该请求委托给上一级ClassPool. 如果上一级ClassPool没有找到目标class文件, 那么child ClassPool就会尝试在./classes目录里查找class文件.

If child.get() is called, the child ClassPool first delegates to the parent ClassPool. If the parent ClassPool fails to find a class file, then the child ClassPool attempts to find a class file under the ./classes directory.

如果 child.childFirstLookup 被设置为true的话, child ClassPool就会首先尝试尝试查找class文件, 找不到再去上一级ClassPool中查找. 例如:

If child.childFirstLookup is true, the child ClassPool attempts to find a class file before delegating to the parent ClassPool. For example,

```java
ClassPool parent = ClassPool.getDefault();
ClassPool child = new ClassPool(parent);
child.appendSystemPath();         // the same class path as the default one.
child.childFirstLookup = true;    // changes the behavior of the child.
```

## Changing a class name for defining a new class
A new class can be defined as a copy of an existing class. The program below does that:

一个新的class可以通过从已经存在的class的副本中制作出来. 例如L
```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.get("Point");
cc.setName("Pair");
```

上面的程序首先获得了Point对应的CtClass对象. 然后它调用setName()设置了一个新的名称Pair. setName()被调用之后, CtClass对象中的所有该class 名称都从Point转换成了Pair. 但是class 定义的其他部分并没有变.

This program first obtains the CtClass object for class Point. Then it calls setName() to give a new name Pair to that CtClass object. After this call, all occurrences of the class name in the class definition represented by that CtClass object are changed from Point to Pair. The other part of the class definition does not change.

注意CtClass的setName()也会改变ClassPool中的记录. 从实现角度来说, 一个CLassPool对象就是CtClass对象的一个hash表. setName()也会将hash表中和CtClass对象关联的key也更改掉. key从原先的class名称换到了新的class名称.
Note that setName() in CtClass changes a record in the ClassPool object. From the implementation viewpoint, a ClassPool object is a hash table of CtClass objects. setName() changes the key associated to the CtClass object in the hash table. The key is changed from the original class name to the new class name.

因此, 如果再次调用ClassPool的get("Point")方法, 再也不会返回cc所指向的CtClass对象. ClassPool会再次读取Point.class文件, 然后构建出一个新的Point的CtClass对象出来. 这厮因为和Point名称关联的CtClass对象已经不复存在了. 例如:

Therefore, if get("Point") is later called on the ClassPool object again, then it never returns the CtClass object that the variable cc refers to. The ClassPool object reads a class file Point.class again and it constructs a new CtClass object for class Point. This is because the CtClass object associated with the name Point does not exist any more. See the followings:

```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.get("Point");
CtClass cc1 = pool.get("Point");   // cc1 is identical to cc.
cc.setName("Pair");
CtClass cc2 = pool.get("Pair");    // cc2 is identical to cc.
CtClass cc3 = pool.get("Point");   // cc3 is not identical to cc.
```

cc1和cc2指向的是和cc指向的相同的对象, 而cc3则不是. 注意, cc.setName("Pair") 方法执行之后, cc和cc1指向CtClass对象也代表着Pair class.
cc1 and cc2 refer to the same instance of CtClass that cc does whereas cc3 does not. Note that, after cc.setName("Pair") is executed, the CtClass object that cc and cc1 refer to represents the Pair class.

ClassPool对象被用来维持class和CtClass对象之间的一对一映射. 在同一个ClassPool中, Javassist从不允许俩个不同的CtClass对象代表同一个class. 对于程序转换来说, 这是一个非常有意义的特性.

The ClassPool object is used to maintain one-to-one mapping between classes and CtClass objects. Javassist never allows two distinct CtClass objects to represent the same class unless two independent ClassPool are created. This is a significant feature for consistent program transformation.

如果你有俩个ClassPool对象, 那么你可以从每个ClassPool里面获得一个相同的class的CtClass对象. 你可以通过修改不同的CtClass对象生成不同版本的class.

If you have two ClassPool objects, then you can obtain, from each ClassPool, a distinct CtClass object representing the same class file. You can differently modify these CtClass objects to generate different versions of the class.

## Renaming a frozen class for defining a new class

一旦一个CtClass对象通过writeFile() or toBytecode()方法转换成一个class, Javassist就不允许CtClass对象再次修改了. 因此, 当代表Point的CtClass对象被转换成一个class之后, 你就不能再通过设置setName()的方式来获取一个Point的副本Pair了. 例如下面的代码, 是不合法的.

Once a CtClass object is converted into a class file by writeFile() or toBytecode(), Javassist rejects further modifications of that CtClass object. Hence, after the CtClass object representing Point class is converted into a class file, you cannot define Pair class as a copy of Point since executing setName() on Point is rejected. The following code snippet is wrong:

```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.get("Point");
cc.writeFile();
cc.setName("Pair");    // wrong since writeFile() has been called.
```

To avoid this restriction, you should call getAndRename() in ClassPool. For example,

对于这种限制, 你应该调用ClassPool的getAndRename()方法, 例如:

```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.get("Point");
cc.writeFile();
CtClass cc2 = pool.getAndRename("Point", "Pair");
```

getAndRename()被调用之后, ClassPool首先读取Point.class, 然后创建出一个代表Point class的CtClass对象. 在存储ClassPool的hash表之前, 它将CtClass名称从Point重新命名为Pair. 因此, getAndRename() 可以再writeFile() or toBytecode()被调用之后 再次调用.

If getAndRename() is called, the ClassPool first reads Point.class for creating a new CtClass object representing Point class. However, it renames that CtClass object from Point to Pair before it records that CtClass object in a hash table. Thus getAndRename() can be executed after writeFile() or toBytecode() is called on the the CtClass object representing Point class.

