---
title: Javasist Generics
date: 2019-05-07 20:15:00
---

The lower-level API of Javassist fully supports generics introduced by Java 5. On the other hand, the higher-level API such as CtClass does not directly support generics. However, this is not a serious problem for bytecode transformation.

The generics of Java is implemented by the erasure technique. After compilation, all type parameters are dropped off. For example, suppose that your source code declares a parameterized type Vector<String>:

Vector<String> v = new Vector<String>();
  :
String s = v.get(0);
The compiled bytecode is equivalent to the following code:

Vector v = new Vector();
  :
String s = (String)v.get(0);
So when you write a bytecode transformer, you can just drop off all type parameters. Because the compiler embedded in Javassist does not support generics, you must insert an explicit type cast at the caller site if the source code is compiled by Javassist, for example, through CtMethod.make(). No type cast is necessary if the source code is compiled by a normal Java compiler such as javac.

For example, if you have a class:

public class Wrapper<T> {
  T value;
  public Wrapper(T t) { value = t; }
}
and want to add an interface Getter<T> to the class Wrapper<T>:

public interface Getter<T> {
  T get();
}
then the interface you really have to add is Getter (the type parameters <T> drops off) and the method you also have to add to the Wrapper class is this simple one:

public Object get() { return value; }
Note that no type parameters are necessary. Since get returns an Object, an explicit type cast is needed at the caller site if the source code is compiled by Javassist. For example, if the type parameter T is String, then (String) must be inserted as follows:

Wrapper w = ...
String s = (String)w.get();
The type cast is not needed if the source code is compiled by a normal Java compiler because it will automatically insert a type cast.

If you need to make type parameters accessible through reflection during runtime, you have to add generic signatures to the class file. For more details, see the API documentation (javadoc) of the setGenericSignature method in the CtClass.