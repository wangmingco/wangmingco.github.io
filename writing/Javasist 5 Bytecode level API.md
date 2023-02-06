---
title: Javasist Bytecode level API
date: 2019-05-06 20:15:00
---

Javassist also provides lower-level API for directly editing a class file. To use this level of API, you need detailed knowledge of the Java bytecode and the class file format while this level of API allows you any kind of modification of class files.

If you want to just produce a simple class file, javassist.bytecode.ClassFileWriter might provide the best API for you. It is much faster than javassist.bytecode.ClassFile although its API is minimum.

5.1 Obtaining a ClassFile object
A javassist.bytecode.ClassFile object represents a class file. To obtian this object, getClassFile() in CtClass should be called.

Otherwise, you can construct a javassist.bytecode.ClassFile directly from a class file. For example,

BufferedInputStream fin
    = new BufferedInputStream(new FileInputStream("Point.class"));
ClassFile cf = new ClassFile(new DataInputStream(fin));
This code snippet creats a ClassFile object from Point.class.

A ClassFile object can be written back to a class file. write() in ClassFile writes the contents of the class file to a given DataOutputStream.

You can create a new class file from scratch. For example,

ClassFile cf = new ClassFile(false, "test.Foo", null);
cf.setInterfaces(new String[] { "java.lang.Cloneable" });
 
FieldInfo f = new FieldInfo(cf.getConstPool(), "width", "I");
f.setAccessFlags(AccessFlag.PUBLIC);
cf.addField(f);

cf.write(new DataOutputStream(new FileOutputStream("Foo.class")));
this code generates a class file Foo.class that contains the implementation of the following class:

package test;
class Foo implements Cloneable {
    public int width;
}


5.2 Adding and removing a member
ClassFile provides addField() and addMethod() for adding a field or a method (note that a constructor is regarded as a method at the bytecode level). It also provides addAttribute() for adding an attribute to the class file.

Note that FieldInfo, MethodInfo, and AttributeInfo objects include a link to a ConstPool (constant pool table) object. The ConstPool object must be common to the ClassFile object and a FieldInfo (or MethodInfo etc.) object that is added to that ClassFile object. In other words, a FieldInfo (or MethodInfo etc.) object must not be shared among different ClassFile objects.

To remove a field or a method from a ClassFile object, you must first obtain a java.util.List object containing all the fields of the class. getFields() and getMethods() return the lists. A field or a method can be removed by calling remove() on the List object. An attribute can be removed in a similar way. Call getAttributes() in FieldInfo or MethodInfo to obtain the list of attributes, and remove one from the list.



5.3 Traversing a method body
To examine every bytecode instruction in a method body, CodeIterator is useful. To otbain this object, do as follows:

ClassFile cf = ... ;
MethodInfo minfo = cf.getMethod("move");    // we assume move is not overloaded.
CodeAttribute ca = minfo.getCodeAttribute();
CodeIterator i = ca.iterator();
A CodeIterator object allows you to visit every bytecode instruction one by one from the beginning to the end. The following methods are part of the methods declared in CodeIterator:

void begin()
Move to the first instruction.
void move(int index)
Move to the instruction specified by the given index.
boolean hasNext()
Returns true if there is more instructions.
int next()
Returns the index of the next instruction.
Note that it does not return the opcode of the next instruction.
int byteAt(int index)
Returns the unsigned 8bit value at the index.
int u16bitAt(int index)
Returns the unsigned 16bit value at the index.
int write(byte[] code, int index)
Writes a byte array at the index.
void insert(int index, byte[] code)
Inserts a byte array at the index. Branch offsets etc. are automatically adjusted.
The following code snippet displays all the instructions included in a method body:

CodeIterator ci = ... ;
while (ci.hasNext()) {
    int index = ci.next();
    int op = ci.byteAt(index);
    System.out.println(Mnemonic.OPCODE[op]);
}


5.4 Producing a bytecode sequence
A Bytecode object represents a sequence of bytecode instructions. It is a growable array of bytecode. Here is a sample code snippet:

ConstPool cp = ...;    // constant pool table
Bytecode b = new Bytecode(cp, 1, 0);
b.addIconst(3);
b.addReturn(CtClass.intType);
CodeAttribute ca = b.toCodeAttribute();
This produces the code attribute representing the following sequence:

iconst_3
ireturn
You can also obtain a byte array containing this sequence by calling get() in Bytecode. The obtained array can be inserted in another code attribute.

While Bytecode provides a number of methods for adding a specific instruction to the sequence, it provides addOpcode() for adding an 8bit opcode and addIndex() for adding an index. The 8bit value of each opcode is defined in the Opcode interface.

addOpcode() and other methods for adding a specific instruction are automatically maintain the maximum stack depth unless the control flow does not include a branch. This value can be obtained by calling getMaxStack() on the Bytecode object. It is also reflected on the CodeAttribute object constructed from the Bytecode object. To recompute the maximum stack depth of a method body, call computeMaxStack() in CodeAttribute.

Bytecode can be used to construct a method. For example,

ClassFile cf = ...
Bytecode code = new Bytecode(cf.getConstPool());
code.addAload(0);
code.addInvokespecial("java/lang/Object", MethodInfo.nameInit, "()V");
code.addReturn(null);
code.setMaxLocals(1);

MethodInfo minfo = new MethodInfo(cf.getConstPool(), MethodInfo.nameInit, "()V");
minfo.setCodeAttribute(code.toCodeAttribute());
cf.addMethod(minfo);
this code makes the default constructor and adds it to the class specified by cf. The Bytecode object is first converted into a CodeAttribute object and then added to the method specified by minfo. The method is finally added to a class file cf.



5.5 Annotations (Meta tags)
Annotations are stored in a class file as runtime invisible (or visible) annotations attribute. These attributes can be obtained from ClassFile, MethodInfo, or FieldInfo objects. Call getAttribute(AnnotationsAttribute.invisibleTag) on those objects. For more details, see the javadoc manual of javassist.bytecode.AnnotationsAttribute class and the javassist.bytecode.annotation package.

Javassist also let you access annotations by the higher-level API. If you want to access annotations through CtClass, call getAnnotations() in CtClass or CtBehavior.

