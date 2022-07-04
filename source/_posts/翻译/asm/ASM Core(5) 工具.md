---
category: 翻译
tag: asm
date: 2016-01-14
title: ASM Core(5) 工具
---
ASM通过`org.objectweb.asm.util`对`ClassVisitor, ClassReader, ClassWriter`提供非常多有帮助的类，通过这些类可以帮助开发者简化字节码的操作过程.

## Type
在前面的文章中我们看到ASM API暴露了存储在字节码中的类型信息等等, 但是上文中的信息我们看到了可读性比较差, 因此ASM提供了`Type`这个工具类,让我们可以像源码中那样看到可读性更高的类型信息.

每个`Type`对象都代表着一个java类型, 我们可以通过类型描述符或者`Class`对象中构建出一个`Type`对象. 另外`Type`中还包含一些静态成员属性用于表示原生类型, 例如`e Type.INT_TYPE`就表示int类型.

`getInternalName`方法用于获取类型的全限定名, 例如`Type.getType(String.class).getInternalName()`我们会得到一个`"java/lang/String".`值, 需要注意的是这个方法只能用在class或者interface类型上.

`getDescriptor`方法返回一个类型的描述符. 例如`"Ljava/lang/String;"`代表一个字符串类型, 但是我们可以在代码中使用`Type.getType(String.class).getDescriptor()`替代这种写法, 来换取更高的可读性. 

`Type`对象还可以表示一个方法类型. 方法类型的`Type`对象可以通过方法描述符或者`Method`对象构建出来. 同样的除了我们可以使用`getDescriptor`方法外,还可以使用`getArgumentTypes`和`getReturnType`来获取方法的参数或者返回值类型. 例如`Type.getArgumentTypes("(I)V")`和`Type.getReturnType("(I)V")`来获得更好的可读性.


## TraceClassVisitor
我们使用`ClassWriter`生成的新的class字节码是一个byte数组, 这种东西根本不具有可读性,因此ASM为我们提供了`TraceClassVisitor`, 它同样是继承自`ClassVisitor`, 他会输出一个文本格式的可读的新的类出来. 下面的例子中我们同时使用了`ClassWriter`和`TraceClassVisitor`, `TraceClassVisitor`代理了`ClassWriter`的全部方法调用
```java
ClassWriter cw = new ClassWriter(0);
TraceClassVisitor cv = new TraceClassVisitor(cw, printWriter);
cv.visit(...);
...
cv.visitEnd();
byte b[] = cw.toByteArray();
```

## CheckClassAdapter
`ClassWriter`并不会检查生成的方法在调用的时候是顺序且参数是否都是正确的. 因此当JVM加载类进行验证的时候可能会抛出异常. 因此当我们秉持着错误越早发现越好, ASM为我们提供了`CheckClassAdapter`, 这个工具类会为我们检查上述问题. 同样的`CheckClassAdapter`继承自`ClassWriter.`, 它可以代理`TraceClassVisitor`或者`ClassWriter`的全部方法. 下面我们给出一个示例
```java
ClassWriter cw = new ClassWriter(0);
TraceClassVisitor tcv = new TraceClassVisitor(cw, printWriter);
CheckClassAdapter cv = new CheckClassAdapter(tcv);
cv.visit(...);
...
cv.visitEnd();
byte b[] = cw.toByteArray();
```
注意, 我们要确定visitor之间的顺序关系, 如下
```java
ClassWriter cw = new ClassWriter(0);
CheckClassAdapter cca = new CheckClassAdapter(cw);
TraceClassVisitor cv = new TraceClassVisitor(cca, printWriter);
```
上面的例子是先进行文本输出然后再进行方法检查, 这是因为相当于`TraceClassVisitor`最终代理了所有的方法调用







