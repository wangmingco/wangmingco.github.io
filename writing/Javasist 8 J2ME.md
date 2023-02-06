---
title: Javasist J2ME
date: 2019-05-09 20:15:00
---

If you modify a class file for the J2ME execution environment, you must perform preverification. Preverifying is basically producing stack maps, which is similar to stack map tables introduced into J2SE at JDK 1.6. Javassist maintains the stack maps for J2ME only if javassist.bytecode.MethodInfo.doPreverify is true.

You can also manually produce a stack map for a modified method. For a given method represented by a CtMethod object m, you can produce a stack map by calling the following methods:

m.getMethodInfo().rebuildStackMapForME(cpool);
Here, cpool is a ClassPool object, which is available by calling getClassPool() on a CtClass object. A ClassPool object is responsible for finding class files from given class pathes. To obtain all the CtMethod objects, call the getDeclaredMethods method on a CtClass object.