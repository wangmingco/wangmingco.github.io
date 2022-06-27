---
category: Java
tag: Javasist
title: Javasist Reading and writing bytecode
date: 2019-05-01 20:15:00
---

`Javassist` is a class library for dealing with Java bytecode. Java bytecode is stored in a binary file called a class file. Each class file contains one Java class or interface.

`Javassist` 是一个用于处理 Java 字节码的类库, Java 字节码被存储在一个后缀为 class 的二进制文件中. 每个 class 文件包含一个 Java 类或者 Java 接口.

The class Javassist.CtClass is an abstract representation of a class file. A CtClass (compile-time class) object is a handle for dealing with a class file. The following program is a very simple example:

`Javassist.CtClass` 类是对 class 文件的一个抽象表示. 一个 `CtClass` (compile-time class) 对象处理一个 class 文件. 下面的程序是一个非常简单的示例:

```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.get("test.Rectangle");
cc.setSuperclass(pool.get("test.Point"));
cc.writeFile();
```

This program first obtains a ClassPool object, which controls bytecode modification with Javassist. The ClassPool object is a container of CtClass object representing a class file. It reads a class file on demand for constructing a CtClass object and records the constructed object for responding later accesses. To modify the definition of a class, the users must first obtain from a ClassPool object a reference to a CtClass object representing that class. get() in ClassPool is used for this purpose. In the case of the program shown above, the CtClass object representing a class test.Rectangle is obtained from the ClassPool object and it is assigned to a variable cc. The ClassPool object returned by getDefault() searches the default system search path.

这个程序首先获得了一个`ClassPool`对象, 该对象在 Javassist 中用于控制字节码的修改. `ClassPool` 对象是一个 `CtClass`对象的容器. `ClassPool`将读取的class文件构建出`CtClass`对象, 同时将构建出来的对象缓存起来, 以便后期访问. `ClassPool`的`get()`方法正是出于上述目的. 在上面的代码中, 从`ClassPool`得到的`CtClass`对象表示的是一个`test.Rectangle`对象, 然后将该对象分配给了一个变量`cc`. `getDefault()`方法会从默认的系统搜索路径中进行搜索, 然后返回`ClassPool`对象.


From the implementation viewpoint, ClassPool is a hash table of CtClass objects, which uses the class names as keys. get() in ClassPool searches this hash table to find a CtClass object associated with the specified key. If such a CtClass object is not found, get() reads a class file to construct a new CtClass object, which is recorded in the hash table and then returned as the resulting value of get().

从实现上来说, `ClassPool`是一个`CtClass`对象的哈希表, 将class的名称作为key. `ClassPool`中的 `get()` 方法会根据指定的key对整个哈希表进行搜索找到一个`CtClass`对象. 如果搜索不到的话, `get()`方法会尝试读取class文件, 然后构造出一个新的`CtClass`对象, 将新的`CtClass`对象缓存后, 再返回出去.

The CtClass object obtained from a ClassPool object can be modified (details of how to modify a CtClass will be presented later). In the example above, it is modified so that the superclass of test.Rectangle is changed into a class test.Point. This change is reflected on the original class file when writeFile() in CtClass() is finally called.

从`ClassPool`中拿到的`CtClass`对象可以对其进行修改(修改`CtClass`的细节会在后续的文章中讲解). 在上面的例子中, 通过`CtClass`的修改就将`test.Rectangle`的父类修改了`test.Point`. 如果我们调用了`CtClass`的`writeFile()`方法, 这个修改也对原先的class文件生效了.

writeFile() translates the CtClass object into a class file and writes it on a local disk. Javassist also provides a method for directly obtaining the modified bytecode. To obtain the bytecode, call toBytecode():

`writeFile()`将`CtClass`对象转换成一个class文件, 然后将该文件写到本地磁盘上. Javassist还提供了用于直接获得修改后的字节码的方法-`toBytecode()`:

```java
byte[] b = cc.toBytecode();
```

You can directly load the CtClass as well:

你也可以直接将Class加载进去.
```java
Class clazz = cc.toClass();
```

toClass() requests the context class loader for the current thread to load the class file represented by the CtClass. It returns a java.lang.Class object representing the loaded class. For more details, please see this section below.

`toClass()`方法 会使用当前线程的context class loader将`CtClass`内的字节码加载进JVM里, 然后返回一个`java.lang.Class`对象.

## Defining a new class
To define a new class from scratch, makeClass() must be called on a ClassPool.

从头开始定义一个新的class, 必须调用`ClassPool`的`makeClass()` 方法.
```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.makeClass("Point");
```
This program defines a class Point including no members. Member methods of Point can be created with factory methods declared in CtNewMethod and appended to Point with addMethod() in CtClass.

上面的程序定义了一个没有任何成员的名称为`Point`的class. 可以通过`CtNewMethod`里声明的一些工厂方法为`Point`类生成一些方法, 然后通过调用`CtClass`的`addMethod()`方法, 将这些新生成的方法加到`Point`class里面去.

makeClass() cannot create a new interface; makeInterface() in ClassPool can do. Member methods in an interface can be created with abstractMethod() in CtNewMethod. Note that an interface method is an abstract method.

`makeClass()` 不能创建新的接口, 但是可以使用`ClassPool`中的`makeInterface()`创建一个新的接口. 接口中的方法可以使用`CtNewMethod`的`abstractMethod()`方法创建出来. 注意, 一个接口方法就是一个抽象方法.

## Frozen classes
If a CtClass object is converted into a class file by writeFile(), toClass(), or toBytecode(), Javassist freezes that CtClass object. Further modifications of that CtClass object are not permitted. This is for warning the developers when they attempt to modify a class file that has been already loaded since the JVM does not allow reloading a class.

如果`CtClass`对象通过`writeFile(), toClass(), or toBytecode()`等方式转换成一个class文件, Javassist会将`CtClass`对象冻结. 被冻结的`CtClass`对象不允许再次修改. 这是为了警告开发者, 他们尝试修改一个已经被load的class文件, 而JVM不允许重新加载class.

A frozen CtClass can be defrost so that modifications of the class definition will be permitted. For example,

被冻结的`CtClass`也可以进行解冻, 解冻之后就可以继续就那些修改了, 例如:
```java
CtClasss cc = ...;
    :
cc.writeFile();
cc.defrost();
cc.setSuperclass(...);    // OK since the class is not frozen.
```

After defrost() is called, the CtClass object can be modified again.

当`defrost()`方法被调用之后, `CtClass`就可以再次修改了.

If ClassPool.doPruning is set to true, then Javassist prunes the data structure contained in a CtClass object when Javassist freezes that object. To reduce memory consumption, pruning discards unnecessary attributes (attribute_info structures) in that object. For example, Code_attribute structures (method bodies) are discarded. Thus, after a CtClass object is pruned, the bytecode of a method is not accessible except method names, signatures, and annotations. The pruned CtClass object cannot be defrost again. The default value of ClassPool.doPruning is false.

如果`ClassPool.doPruning`被设置为true的话, 当Javassist冻结`CtClass`对象的时候, 会对其内部的数据结构进行精简. 为了减少内存消耗, pruning精简了`attribute_info`结构里不必要的属性. 例如方法体里面的`Code_attribute`结构就会被舍弃掉. 因此一旦`CtClass`对象被精简之后, 方法除了名称, 签名, 注解等其他信息都不可再被访问到. 而且被精简过后的`CtClass`对象也不可以再被解冻. `ClassPool.doPruning`默认值是false.

To disallow pruning a particular CtClass, stopPruning() must be called on that object in advance:

如果将要设置某个特殊的`CtClass`不允许精简, 必选提前调用`CtClasss`对象的`stopPruning()`方法.
```java
CtClasss cc = ...;
cc.stopPruning(true);
    :
cc.writeFile();                             // convert to a class file.
// cc is not pruned.
```

The CtClass object cc is not pruned. Thus it can be defrost after writeFile() is called.

上面`CtClass`对象没有被精简, 因此当它调用了`writeFile()`方法之后, 还可以被解冻.

> Note: While debugging, you might want to temporarily stop pruning and freezing and write a modified class file to a disk drive. debugWriteFile() is a convenient method for that purpose. It stops pruning, writes a class file, defrosts it, and turns pruning on again (if it was initially on).

> 注意: 在调试阶段, 你也许想要临时地停止精简和冻结操作, 然后将一个修改过的class文件写到磁盘中, 此时你可以调用`debugWriteFile()`方法. 它首先停止精简操作, 然后对class文件执行写入操作, 最后再解冻, 最后回复精简状态.

## Class search path
The default ClassPool returned by a static method ClassPool.getDefault() searches the same path that the underlying JVM (Java virtual machine) has. If a program is running on a web application server such as JBoss and Tomcat, the ClassPool object may not be able to find user classes since such a web application server uses multiple class loaders as well as the system class loader. In that case, an additional class path must be registered to the ClassPool. Suppose that pool refers to a ClassPool object:

`ClassPool.getDefault()`返回的默认的`ClassPool`是基于JVM的path上面搜索得到的. 如果应用程序是运行在一个web应用服务器上(例如JBoss或者Tomcat), `ClassPool`对象可能会找不到用户定义的class, 因为web应用服务器可能会使用多个class Loader. 在这种情况下可以向`ClassPool`上注册一个新的class path.

```java
pool.insertClassPath(new ClassClassPath(this.getClass()));
```

This statement registers the class path that was used for loading the class of the object that this refers to. You can use any Class object as an argument instead of this.getClass(). The class path used for loading the class represented by that Class object is registered.

You can register a directory name as the class search path. For example, the following code adds a directory /usr/local/javalib to the search path:
```java
ClassPool pool = ClassPool.getDefault();
pool.insertClassPath("/usr/local/javalib");
```

The search path that the users can add is not only a directory but also a URL:

用户能添加的search path不仅仅是目录, 还可以添加URL:
```java
ClassPool pool = ClassPool.getDefault();
ClassPath cp = new URLClassPath("www.javassist.org", 80, "/java/", "org.javassist.");
pool.insertClassPath(cp);
```
这个应用程序添加了一个`http://www.javassist.org:80/java/`url到search path上. 只有当搜索属于`org.javassist`这个包下的类的时候, 才会去这个URL上进行搜索. 例如当加载`org.javassist.test.Main`类时, 它的class 文件将会从`http://www.javassist.org:80/java/org/javassist/test/Main.class`上进行加载.

This program adds "http://www.javassist.org:80/java/" to the class search path. This URL is used only for searching classes belonging to a package org.javassist. For example, to load a class org.javassist.test.Main, its class file will be obtained from:

http://www.javassist.org:80/java/org/javassist/test/Main.class

Furthermore, you can directly give a byte array to a ClassPool object and construct a CtClass object from that array. To do this, use ByteArrayClassPath. For example,

另外, 你可以直接向`ClassPool`对象里指定一个byte数组, `ClassPool`会从这个byte数组里构建出一个`CtClass`对象. 想要使用这种方案, 可以用`ByteArrayClassPath`, 例如:
```java
ClassPool cp = ClassPool.getDefault();
byte[] b = a byte array;
String name = class name;
cp.insertClassPath(new ByteArrayClassPath(name, b));
CtClass cc = cp.get(name);
```

The obtained CtClass object represents a class defined by the class file specified by b. The ClassPool reads a class file from the given ByteArrayClassPath if get() is called and the class name given to get() is equal to one specified by name.

获取到的`CtClass`对象就是从`b`数组里定义出来的. 当`get()`方法被调用的时候, `ClassPool`会从给定的`ByteArrayClassPath`里读取出一个class文件, class名称就是参数name.

If you do not know the fully-qualified name of the class, then you can use makeClass() in ClassPool:
如果你不知道class的全限定名称, 你可以使用`ClassPool`的`makeClass()`方法.
```java
ClassPool cp = ClassPool.getDefault();
InputStream ins = an input stream for reading a class file;
CtClass cc = cp.makeClass(ins);
```

makeClass() returns the CtClass object constructed from the given input stream. You can use makeClass() for eagerly feeding class files to the ClassPool object. This might improve performance if the search path includes a large jar file. Since a ClassPool object reads a class file on demand, it might repeatedly search the whole jar file for every class file. makeClass() can be used for optimizing this search. The CtClass constructed by makeClass() is kept in the ClassPool object and the class file is never read again.

`makeClass()`方法会从给定的输入流里构建出一个`CtClass`对象. 你可以使用`makeClass()`方法先一步地将class文件传给给`ClassPool`对象. 如果在搜索路径里面有一个特别大的jar文件时, 这有可能提升性能. 因为`ClassPool`在后台读取class文件时, 有可能将每一个class文件都在jar文件中匹配一遍. `makeClass()` 可以优化类似的搜索. 通过`makeClass()`构建出来的`CtClass`可以缓存在`ClassPool`里, 当再次查找相同class时, 就不需要再次去class path上搜索了.

The users can extend the class search path. They can define a new class implementing ClassPath interface and give an instance of that class to insertClassPath() in ClassPool. This allows a non-standard resource to be included in the search path.

用户可以拓展class search path. 他们可以将`ClassPath`接口实现类的实例通过`insertClassPath()`方法添加到`ClassPool`里. 这就可以允许一个非标准的资源路径加载到search path上.