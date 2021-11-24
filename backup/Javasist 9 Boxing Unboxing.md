---
title: Javasist Boxing Unboxing
date: 2019-05-09 20:15:00
---

Boxing and unboxing in Java are syntactic sugar. There is no bytecode for boxing or unboxing. So the compiler of Javassist does not support them. For example, the following statement is valid in Java:

Integer i = 3;
since boxing is implicitly performed. For Javassist, however, you must explicitly convert a value type from int to Integer:

Integer i = new Integer(3);