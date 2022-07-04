---
category: 翻译
tag: Javasist
title: Javasist Class Loader
date: 2019-05-03 20:15:00
---

If what classes must be modified is known in advance, the easiest way for modifying the classes is as follows:

1. Get a CtClass object by calling ClassPool.get(),
2. Modify it, and
3. Call writeFile() or toBytecode() on that CtClass object to obtain a modified class file.
If whether a class is modified or not is determined at load time, the users must make Javassist collaborate with a class loader. Javassist can be used with a class loader so that bytecode can be modified at load time. The users of Javassist can define their own version of class loader but they can also use a class loader provided by Javassist.



## 3.1 The toClass method in CtClass

CtClass 提供了一个便捷方法 toClass(), 该方法会将CtClass对象所代表的class通过当前线程的context 类加载器加载进虚拟机里. 在调用该方法之前, 调用者必须拥有权限, 否则会抛出 SecurityException 异常.

The CtClass provides a convenience method toClass(), which requests the context class loader for the current thread to load the class represented by the CtClass object. To call this method, the caller must have appropriate permission; otherwise, a SecurityException may be thrown.

The following program shows how to use toClass():

下面的程序演示了如何使用toClass().
```java
public class Hello {
    public void say() {
        System.out.println("Hello");
    }
}

public class Test {
    public static void main(String[] args) throws Exception {
        ClassPool cp = ClassPool.getDefault();
        CtClass cc = cp.get("Hello");
        CtMethod m = cc.getDeclaredMethod("say");
        m.insertBefore("{ System.out.println(\"Hello.say():\"); }");
        Class c = cc.toClass();
        Hello h = (Hello)c.newInstance();
        h.say();
    }
}
```

Test.main() 在Hello类的say()方法中插入了一个对 println() 的方法调用. 然后将修改过的Hello class构建一个实例出来, 接着调用该实例的say()方法.

Test.main() inserts a call to println() in the method body of say() in Hello. Then it constructs an instance of the modified Hello class and calls say() on that instance.

> 注意, 上面的程序能运行成功取决于在toClass()执行之前, Hello class从来没有被加载过. 如果Hello已经被加载过的话, 在toClass() 加载修改过的Hello class之前,  JVM会先将原生的Hello class加载进来. 因此加载修改过的Hello class就会失败(抛出LinkageError 错误). 例如:

Note that the program above depends on the fact that the Hello class is never loaded before toClass() is invoked. If not, the JVM would load the original Hello class before toClass() requests to load the modified Hello class. Hence loading the modified Hello class would be failed (LinkageError is thrown). For example, if main() in Test is something like this:

```java
public static void main(String[] args) throws Exception {
    Hello orig = new Hello();
    ClassPool cp = ClassPool.getDefault();
    CtClass cc = cp.get("Hello");
        :
}
```
main 方法的第一行首先将原生的Hello class加载了进来, 后续再调用 toClass() 就会抛出异常, 这是因为同一个类加载器不能同时加载俩个相同版本的Hello class.

then the original Hello class is loaded at the first line of main and the call to toClass() throws an exception since the class loader cannot load two different versions of the Hello class at the same time.

如果这个应用程序运行在一些如JBoss或者Tomcat的应用服务器桑, toClass() 直接使用context 类加载器 可能就不太正确了. 在上面的例子中, 你会看到一个未检查异常 ClassCastException 被抛出. 要避免这种异常, 你必须给 toClass() 一个合适的类加载器. 例如, 如果变量 bean 是你的session bean对象的话, 你可以采用下面的代码:

If the program is running on some application server such as JBoss and Tomcat, the context class loader used by toClass() might be inappropriate. In this case, you would see an unexpected ClassCastException. To avoid this exception, you must explicitly give an appropriate class loader to toClass(). For example, if bean is your session bean object, then the following code:

```java
CtClass cc = ...;
Class c = cc.toClass(bean.getClass().getClassLoader());
```
上面的代码可以正确运行. 你应该将加载你程序的类加载器传递给toClass() (在上面的例子中, 是bean对象的class)

would work. You should give toClass() the class loader that has loaded your program (in the above example, the class of the bean object).

`toClass()` 只是一个便捷方法. 如果你需要更复杂的功能, 你应该实现自己的类加载器.

toClass() is provided for convenience. If you need more complex functionality, you should write your own class loader.


## 3.2 Class loading in Java

在Java中, 多个class loader是可以共存的, 每个ClassLoader都有它自己的命名空间. 不同的类加载器可以加载相同名称的不同的class. 加载进来的class被视为不一样的. 这个特性允许我们在同一个JVM运行包含相同名称的class的多个应用程序.

In Java, multiple class loaders can coexist and each class loader creates its own name space. Different class loaders can load different class files with the same class name. The loaded two classes are regarded as different ones. This feature enables us to run multiple application programs on a single JVM even if these programs include different classes with the same name.

> 注意, JVM不允许动态重新加载class. 一旦一个类加载器已经加载了一个class, 那么在运行期, 就不允许该类加载器再去加载一个已经修改过的class. 因此当JVM已经加载了一个class之后, 就不允许再去修改该class的定义了. 但是, JDPA(Java Platform Debugger Architecture) 提供了一些工具可以帮助重新加载一个类. See Section 3.6.

Note: The JVM does not allow dynamically reloading a class. Once a class loader loads a class, it cannot reload a modified version of that class during runtime. Thus, you cannot alter the definition of a class after the JVM loads it. However, the JPDA (Java Platform Debugger Architecture) provides limited ability for reloading a class. See Section 3.6.

如果相同的class 文件被不同的类加载器加载了, JVM就会创建俩个名称和定义相同的class. 但是这俩个class是被视为是不同的. 因为这俩个class是不同的, 一个class的实例是不允许赋值到另一个class的变量的. 在这俩个class之间的转换操作会失败, 同时抛出一个 ClassCastException.

If the same class file is loaded by two distinct class loaders, the JVM makes two distinct classes with the same name and definition. The two classes are regarded as different ones. Since the two classes are not identical, an instance of one class is not assignable to a variable of the other class. The cast operation between the two classes fails and throws a ClassCastException.

例如, 下面的代码片段抛出的异常.

For example, the following code snippet throws an exception:
```java
MyClassLoader myLoader = new MyClassLoader();
Class clazz = myLoader.loadClass("Box");
Object obj = clazz.newInstance();
Box b = (Box)obj;    // this always throws ClassCastException.
```

Box class 被俩个类加载器加载. 假设一个类加载器 CL将上面的代码片段的一个类. CL会将上述代码片段的MyClassLoader, Class, Object, and Box进行加载(除非CL被代理给了其他类加载器). 因此变量b的类型是Box 是被CL加载的. 然而,  myLoader 也加载了Box class. 变量obj指向的对象就是被myLoader加载的Box的实例. 因此最后语句就会抛出异常ClassCastException, 因为obj的class和变量b所引用的class不是同一个.

The Box class is loaded by two class loaders. Suppose that a class loader CL loads a class including this code snippet. Since this code snippet refers to MyClassLoader, Class, Object, and Box, CL also loads these classes (unless it delegates to another class loader). Hence the type of the variable b is the Box class loaded by CL. On the other hand, myLoader also loads the Box class. The object obj is an instance of the Box class loaded by myLoader. Therefore, the last statement always throws a ClassCastException since the class of obj is a different verison of the Box class from one used as the type of the variable b.

不同的类加载器构成了一个树结构. 除了bootstrap类加载器, 每个类加载器都有一个父加载器, which has normally loaded the class of that child class loader. 因为被请求加载的类可以被代理给这个层级中的其他类加载器, 因此一个class也许可以被不是你想使用的其他类加载器加载. 因此, 你希望加载类C的类加载器也许和实际加载类C的加载器不是同一个. 因此为了区分这俩个类加载器, 我们把前一个类加载器称为`the initiator of C`, 后一个类加载器称为`the real loader of C`.

Multiple class loaders form a tree structure. Each class loader except the bootstrap loader has a parent class loader, which has normally loaded the class of that child class loader. Since the request to load a class can be delegated along this hierarchy of class loaders, a class may be loaded by a class loader that you do not request the class loading. Therefore, the class loader that has been requested to load a class C may be different from the loader that actually loads the class C. For distinction, we call the former loader the initiator of C and we call the latter loader the real loader of C.

此外, 如果被请求加载类C的类加载器(`the initiator of C`)被代理给了父加载器PL, 那么类加载器CL也不会再起加载类C中依赖的任何其他的类. 类加载CL就不再是哪些类的initiator, 它的父加载器PL就成为了initiator, 然后PL负责去加载哪些类. 类C定义中指向的那些类将会被类C的真实加载器进行加载.

Furthermore, if a class loader CL requested to load a class C (the initiator of C) delegates to the parent class loader PL, then the class loader CL is never requested to load any classes referred to in the definition of the class C. CL is not the initiator of those classes. Instead, the parent class loader PL becomes their initiators and it is requested to load them. The classes that the definition of a class C referes to are loaded by the real loader of C.

下面看一个例子, 深入理解一下:

To understand this behavior, let's consider the following example.

```java
public class Point {    // loaded by PL
    private int x, y;
    public int getX() { return x; }
        :
}

public class Box {      // the initiator is L but the real loader is PL
    private Point upperLeft, size;
    public int getBaseX() { return upperLeft.x; }
        :
}

public class Window {    // loaded by a class loader L
    private Box box;
    public int getBaseX() { return box.getBaseX(); }
}
```

假设类`Window`是被类加载器`L`加载的. 那么类`Window`的initiator和真实加载器都是`L`. 因为`Window`定义里面指向了类`Box`, JVM还将事业`L`去加载类`Box`. 这里, 假设, `L`将加载动作委托给了父加载器`PL`. `Box`的initiator就是`L`, 但是真实加载器就成`PL`. 在这个例子中, `Point`的initiator就成了`PL`而不是`L`, 因为它和`Box`的真实加载器是一样的. 因此`L`从来都不会加载`Point`.

Suppose that a class Window is loaded by a class loader L. Both the initiator and the real loader of Window are L. Since the definition of Window refers to Box, the JVM will request L to load Box. Here, suppose that L delegates this task to the parent class loader PL. The initiator of Box is L but the real loader is PL. In this case, the initiator of Point is not L but PL since it is the same as the real loader of Box. Thus L is never requested to load Point.

Next, let's consider a slightly modified example.

下面的例子对刚才进行了一些稍微的修改:

```java
public class Point {
    private int x, y;
    public int getX() { return x; }
        :
}

public class Box {      // the initiator is L but the real loader is PL
    private Point upperLeft, size;
    public Point getSize() { return size; }
        :
}

public class Window {    // loaded by a class loader L
    private Box box;
    public boolean widthIs(int w) {
        Point p = box.getSize();
        return w == p.getX();
    }
}
```
现在, `Window`的定义也指向了`Point`. 在这个例子中, 如果类加载器`L`要加载`Point`, 它必须也被代理给`PL`. 你必须避免有俩个类加载器俩次加载相同一个类. 这俩个类加载器中的一个必须代理给另一个.

Now, the definition of Window also refers to Point. In this case, the class loader L must also delegate to PL if it is requested to load Point. You must avoid having two class loaders doubly load the same class. One of the two loaders must delegate to the other.

当`Point`被加载的时候, 如果`L`没有被代理给`PL`, `widthIs()` 将会抛出一个`ClassCastException`. 因为`Box`的真实类加载器是`PL`, `Box`中关联的`Point`也会被`PL`加载. 因此, `getSize()`真实调用的实例是由`PL`加载的类`Point`产生的, 而`widthIs()`中的变量`p`是由`L`加载的类`Point`. JVM将他们视作俩个类型, 因此会因为类型不匹配抛出一个异常.

If L does not delegate to PL when Point is loaded, widthIs() would throw a ClassCastException. Since the real loader of Box is PL, Point referred to in Box is also loaded by PL. Therefore, the resulting value of getSize() is an instance of Point loaded by PL whereas the type of the variable p in widthIs() is Point loaded by L. The JVM regards them as distinct types and thus it throws an exception because of type mismatch.

这个行为看起来是有点不方便, 但是却很必须的. 看下面的代码:

This behavior is somewhat inconvenient but necessary. If the following statement:
```java
Point p = box.getSize();
```
这就不会抛出异常, 写`Window`的程序员破坏了`Point`对象的封装. 例如, 被`PL`加载的类`Point`中有个字段`x`是私有的. 如果`L`加载下面程序描述的`Point`, `Window`类就可以直接访问`x`的值.

did not throw an exception, then the programmer of Window could break the encapsulation of Point objects. For example, the field x is private in Point loaded by PL. However, the Window class could directly access the value of x if L loads Point with the following definition:

```java
public class Point {
    public int x, y;    // not private
    public int getX() { return x; }
        :
}
```
更多关于Java类加载器的细节, 下面的文章会更优帮助:

For more details of class loaders in Java, the following paper would be helpful:

> Sheng Liang and Gilad Bracha, "Dynamic Class Loading in the Java Virtual Machine", 
> ACM OOPSLA'98, pp.36-44, 1998.

## 3.3 Using javassist.Loader

Javassist 提供了一个类加载器`javassist.Loader`. 这个类加载器使用`javassist.ClassPool`对象来读取class文件.

Javassist provides a class loader javassist.Loader. This class loader uses a javassist.ClassPool object for reading a class file.

例如, `javassist.Loader` 可以用来加载被Javassist修改过的class.

For example, javassist.Loader can be used for loading a particular class modified with Javassist.

```java
import javassist.*;
import test.Rectangle;

public class Main {
  public static void main(String[] args) throws Throwable {
     ClassPool pool = ClassPool.getDefault();
     Loader cl = new Loader(pool);

     CtClass ct = pool.get("test.Rectangle");
     ct.setSuperclass(pool.get("test.Point"));

     Class c = cl.loadClass("test.Rectangle");
     Object rect = c.newInstance();
         :
  }
}
```

这个应用程序修改了类`test.Rectangle`. `test.Rectangle`的父类被设置为了`test.Point`. 然后应用程序将修改过的class加载, 最后创建出一个新的`test.Rectangle`实例出来.

This program modifies a class test.Rectangle. The superclass of test.Rectangle is set to a test.Point class. Then this program loads the modified class, and creates a new instance of the test.Rectangle class.

如果用户想要当class被加载后, 后台会自动修改class, 可以通过向`javassist.Loader`添加事件监听器来完成. 当类加载器加载类的时候会自动通知注册了的事件监听器. 事件监听器必须下面的接口.

If the users want to modify a class on demand when it is loaded, the users can add an event listener to a javassist.Loader. The added event listener is notified when the class loader loads a class. The event-listener class must implement the following interface:

```java
public interface Translator {
    public void start(ClassPool pool)
        throws NotFoundException, CannotCompileException;
    public void onLoad(ClassPool pool, String classname)
        throws NotFoundException, CannotCompileException;
}
```

当通过调用`javassist.Loader`的`addTranslator()`向`javassist.Loader`添加完成事件监听器后, `start()`方法就会被调用. `onLoad()`方法会在`javassist.Loader`加载类之前被调用. 可以在`onLoad()` 方法中修改一个类的定义.

The method start() is called when this event listener is added to a javassist.Loader object by addTranslator() in javassist.Loader. The method onLoad() is called before javassist.Loader loads a class. onLoad() can modify the definition of the loaded class.

例如, 下面的事件监听器在class被加载之前全部被修改成`public`.

For example, the following event listener changes all classes to public classes just before they are loaded.

```java
public class MyTranslator implements Translator {
    void start(ClassPool pool)
        throws NotFoundException, CannotCompileException {}
    void onLoad(ClassPool pool, String classname)
        throws NotFoundException, CannotCompileException
    {
        CtClass cc = pool.get(classname);
        cc.setModifiers(Modifier.PUBLIC);
    }
}
```

> 注意, `onLoad()`方法中不用调用`toBytecode()` 或者 `writeFile()` 方法, `javassist.Loader`会自动去调用那些方法.

Note that onLoad() does not have to call toBytecode() or writeFile() since javassist.Loader calls these methods to obtain a class file.


To run an application class MyApp with a MyTranslator object, write a main class as following:

```java
import javassist.*;

public class Main2 {
  public static void main(String[] args) throws Throwable {
     Translator t = new MyTranslator();
     ClassPool pool = ClassPool.getDefault();
     Loader cl = new Loader();
     cl.addTranslator(pool, t);
     cl.run("MyApp", args);
  }
}
```
To run this program, do:

运行程序:
```java
% java Main2 arg1 arg2...
```

类`MyApp`和程序中其他的类都会被`MyTranslator`修改.

The class MyApp and the other application classes are translated by MyTranslator.

注意, 程序中像`MyApp`这样的类不能访问oader classes, 例如`Main2, MyTranslator, and ClassPool`, 因为它们是被不同的加载器加载的. 应用程序的类是被`javassist.Loader`而loader classes(例如`Main2`)是被Java默认的类加载器加载的.

Note that application classes like MyApp cannot access the loader classes such as Main2, MyTranslator, and ClassPool because they are loaded by different loaders. The application classes are loaded by javassist.Loader whereas the loader classes such as Main2 are by the default Java class loader.

`javassist.Loader`搜索类的顺序和`java.lang.ClassLoader`不一样. `ClassLoader`首先会将加载动作委托给他们父加载器, 只有当父加载器找不到, `ClassLoader`自己才会去加载. 而`javassist.Loader` 在委托给父类加载器之前, 自己首先加载一遍. 直接委托父加载器加载只取决于

* 在调用`ClassPool`对象的`get()`方法是没有找到搜索的类
* 或者通过`delegateLoadingOf()`设置指定由父加载器去进行加载.

javassist.Loader searches for classes in a different order from java.lang.ClassLoader. ClassLoader first delegates the loading operations to the parent class loader and then attempts to load the classes only if the parent class loader cannot find them. On the other hand, javassist.Loader attempts to load the classes before delegating to the parent class loader. It delegates only if:

* the classes are not found by calling get() on a ClassPool object, or
* the classes have been specified by using delegateLoadingOf() to be loaded by the parent class loader.

这种搜索顺序允许Javassist 加载修改过的类. 一旦它由于某些原因找不到修改过的类, 它仍然会将搜索动作委托给父加载器进行加载. 一旦类被父加载器加载到了, 那么类中其他的类也会被父加载器进行加载, 因此这些被父加载器加载的类是永远也不是被修改过的. 回想一下前文介绍的, 在类`C`中包含的类也会被`C`的真实加载器进行加载. 如果你的程序加载修改过的类失败了, 你应该确认一下使用那些类的其他类是否也被`javassist.Loader`进行加载的.

This search order allows loading modified classes by Javassist. However, it delegates to the parent class loader if it fails to find modified classes for some reason. Once a class is loaded by the parent class loader, the other classes referred to in that class will be also loaded by the parent class loader and thus they are never modified. Recall that all the classes referred to in a class C are loaded by the real loader of C. If your program fails to load a modified class, you should make sure whether all the classes using that class have been loaded by javassist.Loader.


## 3.4 Writing a class loader
A simple class loader using Javassist is as follows:

使用Javassist中的类加载器很简单:

```java
import javassist.*;

public class SampleLoader extends ClassLoader {
    /* Call MyApp.main().
     */
    public static void main(String[] args) throws Throwable {
        SampleLoader s = new SampleLoader();
        Class c = s.loadClass("MyApp");
        c.getDeclaredMethod("main", new Class[] { String[].class })
         .invoke(null, new Object[] { args });
    }

    private ClassPool pool;

    public SampleLoader() throws NotFoundException {
        pool = new ClassPool();
        pool.insertClassPath("./class"); // MyApp.class must be there.
    }

    /* Finds a specified class.
     * The bytecode for that class can be modified.
     */
    protected Class findClass(String name) throws ClassNotFoundException {
        try {
            CtClass cc = pool.get(name);
            // modify the CtClass object here
            byte[] b = cc.toBytecode();
            return defineClass(name, b, 0, b.length);
        } catch (NotFoundException e) {
            throw new ClassNotFoundException();
        } catch (IOException e) {
            throw new ClassNotFoundException();
        } catch (CannotCompileException e) {
            throw new ClassNotFoundException();
        }
    }
}
```
类`MyApp`是一个应用程序. 执行程序之前, 首先要将该类放到`./class`目录下, 但是不能包含在类搜索路径里. 否则`MyApp.class`会被系统默认的类加载器进行加载(会被`SampleLoader`父加载器加载). 通过在构建器中调用 `insertClassPath()` 设置了路径的名称`./class`. 你也可以不用`./class`, 换一个其他的名称, 然后执行:

The class MyApp is an application program. To execute this program, first put the class file under the ./class directory, which must not be included in the class search path. Otherwise, MyApp.class would be loaded by the default system class loader, which is the parent loader of SampleLoader. The directory name ./class is specified by insertClassPath() in the constructor. You can choose a different name instead of ./class if you want. Then do as follows:

```
% java SampleLoader
```
类加载器会从`./class/MyApp.class`加载类`MyApp`, 然后调用`MyApp.main()`方法.

The class loader loads the class MyApp (./class/MyApp.class) and calls MyApp.main() with the command line parameters.

这是使用`Javassist`最简单的方式. 然而, 如果你写了一个复杂的类加载器, 你必须熟悉java类加载机制的细节. 例如, 上面的应用程序将`MyApp`放到了与`SampleLoader`所属的不同的一个名称空间里, 因为这俩个类是由不同的类加载器进行加载的. 因此`MyApp`不能直接访问类`SampleLoader`.

This is the simplest way of using Javassist. However, if you write a more complex class loader, you may need detailed knowledge of Java's class loading mechanism. For example, the program above puts the MyApp class in a name space separated from the name space that the class SampleLoader belongs to because the two classes are loaded by different class loaders. Hence, the MyApp class cannot directly access the class SampleLoader.


## 3.5 Modifying a system class
系统类例如`java.lang.String`除了系统类加载器之外不能被其他的类加载加载. 因此, 上面提到的`SampleLoader`或者`javassist.Loader`在加载时不能修改系统的类.

The system classes like java.lang.String cannot be loaded by a class loader other than the system class loader. Therefore, SampleLoader or javassist.Loader shown above cannot modify the system classes at loading time.

但是如果你的程序想要修改系统类, 那么系统类必须被静态修改. 例如下面的程序在`java.lang.String`添加了一个字段`hiddenValue`:

If your application needs to do that, the system classes must be statically modified. For example, the following program adds a new field hiddenValue to java.lang.String:

```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.get("java.lang.String");
CtField f = new CtField(CtClass.intType, "hiddenValue", cc);
f.setModifiers(Modifier.PUBLIC);
cc.addField(f);
cc.writeFile(".");
```
这个程序产生了一个文件`./java/lang/String.class`.

This program produces a file "./java/lang/String.class".

To run your program MyApp with this modified String class, do as follows:

在`MyApp`中使用这个修改过的类`String`, 例如:
```java
% java -Xbootclasspath/p:. MyApp arg1 arg2...
```

假设`MyApp`定义如下:

Suppose that the definition of MyApp is as follows:
```java
public class MyApp {
    public static void main(String[] args) throws Exception {
        System.out.println(String.class.getField("hiddenValue").getName());
    }
}
```
如果修改过的`String`被正确地加载, `MyApp`会打印`hiddenValue`的值.

If the modified String class is correctly loaded, MyApp prints hiddenValue.

> 注意, 应用程序使用这个技术在覆盖`rt.jar`中的系统类的时候不应该被部署, 否则会违反`Java 2 Runtime Environment binary code license` 授权.

Note: Applications that use this technique for the purpose of overriding a system class in rt.jar should not be deployed as doing so would contravene the Java 2 Runtime Environment binary code license.



## 3.6 Reloading a class at runtime

如果JVM在运行时JPDA开启了, 类就可以动态重加载了. JVM加载一个类后, 旧版本的class可以被卸载, 新版本的class可以再次加载进来. 这样一来就完成了在运行期动态修改类. 但是, 新版本的类定义必须兼容旧版本的类定义. JVM不允许这俩个版本的类的schema发生改变. 他们必须拥有相同的方法和字段.

Javassist提供了一个工具类用于在运行期动态重加载. 更多的细节信息参考API文档`javassist.tools.HotSwapper`.

If the JVM is launched with the JPDA (Java Platform Debugger Architecture) enabled, a class is dynamically reloadable. After the JVM loads a class, the old version of the class definition can be unloaded and a new one can be reloaded again. That is, the definition of that class can be dynamically modified during runtime. However, the new class definition must be somewhat compatible to the old one. The JVM does not allow schema changes between the two versions. They have the same set of methods and fields.

Javassist provides a convenient class for reloading a class at runtime. For more information, see the API documentation of javassist.tools.HotSwapper.

