---
title: Javasist Varargs
date: 2019-05-08 20:15:00
---

Currently, Javassist does not directly support varargs. So to make a method with varargs, you must explicitly set a method modifier. But this is easy. Suppose that now you want to make the following method:

public int length(int... args) { return args.length; }
The following code using Javassist will make the method shown above:

CtClass cc = /* target class */;
CtMethod m = CtMethod.make("public int length(int[] args) { return args.length; }", cc);
m.setModifiers(m.getModifiers() | Modifier.VARARGS);
cc.addMethod(m);
The parameter type int... is changed into int[] and Modifier.VARARGS is added to the method modifiers.

To call this method in the source code compiled by the compiler embedded in Javassist, you must write:

length(new int[] { 1, 2, 3 });
instead of this method call using the varargs mechanism:

length(1, 2, 3);
