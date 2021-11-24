---
category: Javasist
title: Javasist Introspection and customization
date: 2019-05-04 20:15:00
---

`CtClass`提供了方法以便于自省. Javassist 的自省能力和Java的反射API很像. CtClass 提供了getName(), getSuperclass(), getMethods()等方法. CtClass仍然提供了修改一个类定义的方法.它允许添加新的字段/构造器/方法. 修改(Instrumenting)方法体也是可以的.

CtClass provides methods for introspection. The introspective ability of Javassist is compatible with that of the Java reflection API. CtClass provides getName(), getSuperclass(), getMethods(), and so on. CtClass also provides methods for modifying a class definition. It allows to add a new field, constructor, and method. Instrumenting a method body is also possible.

CtMethod实例表示方法. CtMethod提供了一些方法用来修改方法的定义. 注意, 如果一个方法是继承而来的, 那么子类和基类的这个方法是由同一个CtMethod对象表示. 一个CtMethod对象对应一个方法的声明.

Methods are represented by CtMethod objects. CtMethod provides several methods for modifying the definition of the method. Note that if a method is inherited from a super class, then the same CtMethod object that represents the inherited method represents the method declared in that super class. A CtMethod object corresponds to every method declaration.

例如, 如果类Point声明了一个方法`move()`, 它的子类`ColorPoint`没有重载`move()`方法, 在Point中声明的move()方法和在子类`ColorPoint`中继承过来的move()方法是由同一个CtMethod对象表示的. 如果CtMethod对象所表示的方法被修改了, 那么父类和子类的方法都会被修改. 如果你只想修改ColorPoint的`move()`方法, 你首席必须得把Point里的move()方法制作一个副本, 然后将这个副本添加到ColorPoint里. 可以通过调用CtNewMethod.copy()得到一个CtMethod对象的副本.

For example, if class Point declares method move() and a subclass ColorPoint of Point does not override move(), the two move() methods declared in Point and inherited in ColorPoint are represented by the identical CtMethod object. If the method definition represented by this CtMethod object is modified, the modification is reflected on both the methods. If you want to modify only the move() method in ColorPoint, you first have to add to ColorPoint a copy of the CtMethod object representing move() in Point. A copy of the the CtMethod object can be obtained by CtNewMethod.copy().

Javassist不允许删除一个方法或者字段, 但是允许修改它的名字. 索引, 如果一个方法不再需要了, 应该调用CtMethod的setName()将其重命名以及setModifiers()修改它的访问级别到一个私有方法.

Javassist does not allow to remove a method or field, but it allows to change the name. So if a method is not necessary any more, it should be renamed and changed to be a private method by calling setName() and setModifiers() declared in CtMethod.

Javassist也不允许向一个已经存在的方法添加一个新的参数. 但是, 可以向相同的class里增加一个新的方法, 该方法在老的方法接口上增加新的参数. 例如, 如果你想要在一个方法上添加一个newZ参数:

Javassist does not allow to add an extra parameter to an existing method, either. Instead of doing that, a new method receiving the extra parameter as well as the other parameters should be added to the same class. For example, if you want to add an extra int parameter newZ to a method:

```java
void move(int newX, int newY) { x = newX; y = newY; }
```
in a Point class, then you should add the following method to the Point class:

在Point类中, 你应该添加一个新的方法:
```java
void move(int newX, int newY, int newZ) {
    // do what you want with newZ.
    move(newX, newY);
}
```

Javassist也提供了一些底层API用于修改一个原始的类结构. 例如, CtClass中的getClassFile()返回了一个表示原始类结构的ClassFile对象.CtMethod 中的 getMethodInfo() 返回了一个MethodInfo对象, 该对象表示的类结构中的一个method_info结构. 底层API使用了Java Virtual Machine规范中的词汇. 使用者必须有class文件和字节码的知识. 更多的细节, 使用者应该参考`javassist.bytecode`包下的内容.

Javassist also provides low-level API for directly editing a raw class file. For example, getClassFile() in CtClass returns a ClassFile object representing a raw class file. getMethodInfo() in CtMethod returns a MethodInfo object representing a method_info structure included in a class file. The low-level API uses the vocabulary from the Java Virtual machine specification. The users must have the knowledge about class files and bytecode. For more details, the users should see the javassist.bytecode package.



The class files modified by Javassist requires the javassist.runtime package for runtime support only if some special identifiers starting with $ are used. Those special identifiers are described below. The class files modified without those special identifiers do not need the javassist.runtime package or any other Javassist packages at runtime. For more details, see the API documentation of the javassist.runtime package.



## 4.1 Inserting source text at the beginning/end of a method body

CtMethod and CtConstructor 中提供了insertBefore(), insertAfter(), and addCatch() 这三个方法. 这些方法用于向一个已经存在的方法中添加代码片段. 这些代码片段可以试Java代码. Javassist包含了一个简单的Java编译器用来编译这些Java源码. 该编译器接受Java语言编写的源代码, 然后将其编译成Java字节码, 然后将其内联到一个方法体中. 

CtMethod and CtConstructor provide methods insertBefore(), insertAfter(), and addCatch(). They are used for inserting a code fragment into the body of an existing method. The users can specify those code fragments with source text written in Java. Javassist includes a simple Java compiler for processing source text. It receives source text written in Java and compiles it into Java bytecode, which will be inlined into a method body.

如果class文件中包含了line number表的话, 可以在指定的line number中插入一个代码片段.

Inserting a code fragment at the position specified by a line number is also possible (if the line number table is contained in the class file). insertAt() in CtMethod and CtConstructor takes source text and a line number in the source file of the original class definition. It compiles the source text and inserts the compiled code at the line number.

The methods insertBefore(), insertAfter(), addCatch(), and insertAt() receive a String object representing a statement or a block. A statement is a single control structure like if and while or an expression ending with a semi colon (;). A block is a set of statements surrounded with braces {}. Hence each of the following lines is an example of valid statement or block:

```java
System.out.println("Hello");
{ System.out.println("Hello"); }
if (i < 0) { i = -i; }
```

The statement and the block can refer to fields and methods. They can also refer to the parameters to the method that they are inserted into if that method was compiled with the -g option (to include a local variable attribute in the class file). Otherwise, they must access the method parameters through the special variables $0, $1, $2, ... described below. Accessing local variables declared in the method is not allowed although declaring a new local variable in the block is allowed. However, insertAt() allows the statement and the block to access local variables if these variables are available at the specified line number and the target method was compiled with the -g option.
The String object passed to the methods insertBefore(), insertAfter(), addCatch(), and insertAt() are compiled by the compiler included in Javassist. Since the compiler supports language extensions, several identifiers starting with $ have special meaning:

* `$0, $1, $2, ...`    	this and actual parameters
* `$args`	An array of parameters. The type of $args is Object[].
* `$$`	All actual parameters. For example, m($$) is equivalent to m($1,$2,...)
* `$cflow(...)`	cflow variable
* `$r`	The result type. It is used in a cast expression.
* `$w`	The wrapper type. It is used in a cast expression.
* `$_`	The resulting value
* `$sig`	An array of java.lang.Class objects representing the formal parameter types.
* `$type`	A java.lang.Class object representing the formal result type.
* `$class`	A java.lang.Class object representing the class currently edited.

#### $0, $1, $2, ...
The parameters passed to the target method are accessible with $1, $2, ... instead of the original parameter names. $1 represents the first parameter, $2 represents the second parameter, and so on. The types of those variables are identical to the parameter types. $0 is equivalent to this. If the method is static, $0 is not available.

These variables are used as following. Suppose that a class Point:
```java
class Point {
    int x, y;
    void move(int dx, int dy) { x += dx; y += dy; }
}
```
To print the values of dx and dy whenever the method move() is called, execute this program:
```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.get("Point");
CtMethod m = cc.getDeclaredMethod("move");
m.insertBefore("{ System.out.println($1); System.out.println($2); }");
cc.writeFile();
```
Note that the source text passed to insertBefore() is surrounded with braces {}. insertBefore() accepts only a single statement or a block surrounded with braces.

The definition of the class Point after the modification is like this:
```java
class Point {
    int x, y;
    void move(int dx, int dy) {
        { System.out.println(dx); System.out.println(dy); }
        x += dx; y += dy;
    }
}
```
$1 and $2 are replaced with dx and dy, respectively.

$1, $2, $3 ... are updatable. If a new value is assigend to one of those variables, then the value of the parameter represented by that variable is also updated.

#### $args
The variable $args represents an array of all the parameters. The type of that variable is an array of class Object. If a parameter type is a primitive type such as int, then the parameter value is converted into a wrapper object such as java.lang.Integer to store in $args. Thus, $args[0] is equivalent to $1 unless the type of the first parameter is a primitive type. Note that $args[0] is not equivalent to $0; $0 represents this.

If an array of Object is assigned to $args, then each element of that array is assigned to each parameter. If a parameter type is a primitive type, the type of the corresponding element must be a wrapper type. The value is converted from the wrapper type to the primitive type before it is assigned to the parameter.

#### $$
The variable $$ is abbreviation of a list of all the parameters separated by commas. For example, if the number of the parameters to method move() is three, then

```java
move($$)
```
is equivalent to this:
```java
move($1, $2, $3)
```
If move() does not take any parameters, then move($$) is equivalent to move().

$$ can be used with another method. If you write an expression:

```java
exMove($$, context)
```
then this expression is equivalent to:

```java
exMove($1, $2, $3, context)
```
Note that $$ enables generic notation of method call with respect to the number of parameters. It is typically used with $proceed shown later.

#### $cflow
$cflow means "control flow". This read-only variable returns the depth of the recursive calls to a specific method.

Suppose that the method shown below is represented by a CtMethod object cm:

```java
int fact(int n) {
    if (n <= 1)
        return n;
    else
        return n * fact(n - 1);
}
```

To use $cflow, first declare that $cflow is used for monitoring calls to the method fact():

```java
CtMethod cm = ...;
cm.useCflow("fact");
```

The parameter to useCflow() is the identifier of the declared $cflow variable. Any valid Java name can be used as the identifier. Since the identifier can also include . (dot), for example, "my.Test.fact" is a valid identifier.

Then, $cflow(fact) represents the depth of the recursive calls to the method specified by cm. The value of $cflow(fact) is 0 (zero) when the method is first called whereas it is 1 when the method is recursively called within the method. For example,

```java
cm.insertBefore("if ($cflow(fact) == 0)"
              + "    System.out.println(\"fact \" + $1);");
```
translates the method fact() so that it shows the parameter. Since the value of $cflow(fact) is checked, the method fact() does not show the parameter if it is recursively called within fact().

The value of $cflow is the number of stack frames associated with the specified method cm under the current topmost stack frame for the current thread. $cflow is also accessible within a method different from the specified method cm.

#### $r
$r represents the result type (return type) of the method. It must be used as the cast type in a cast expression. For example, this is a typical use:

```java
Object result = ... ;
$_ = ($r)result;
```

If the result type is a primitive type, then ($r) follows special semantics. First, if the operand type of the cast expression is a primitive type, ($r) works as a normal cast operator to the result type. On the other hand, if the operand type is a wrapper type, ($r) converts from the wrapper type to the result type. For example, if the result type is int, then ($r) converts from java.lang.Integer to int.

If the result type is void, then ($r) does not convert a type; it does nothing. However, if the operand is a call to a void method, then ($r) results in null. For example, if the result type is void and foo() is a void method, then

```java
$_ = ($r)foo();
```
is a valid statement.

The cast operator ($r) is also useful in a return statement. Even if the result type is void, the following return statement is valid:

```java
return ($r)result;
```
Here, result is some local variable. Since ($r) is specified, the resulting value is discarded. This return statement is regarded as the equivalent of the return statement without a resulting value:
```java
return;
```

#### $w
$w represents a wrapper type. It must be used as the cast type in a cast expression. ($w) converts from a primitive type to the corresponding wrapper type. The following code is an example:

```java
Integer i = ($w)5;
```
The selected wrapper type depends on the type of the expression following ($w). If the type of the expression is double, then the wrapper type is java.lang.Double.

If the type of the expression following ($w) is not a primitive type, then ($w) does nothing.

#### $_
insertAfter() in CtMethod and CtConstructor inserts the compiled code at the end of the method. In the statement given to insertAfter(), not only the variables shown above such as $0, $1, ... but also $_ is available.

The variable $_ represents the resulting value of the method. The type of that variable is the type of the result type (the return type) of the method. If the result type is void, then the type of $_ is Object and the value of $_ is null.

Although the compiled code inserted by insertAfter() is executed just before the control normally returns from the method, it can be also executed when an exception is thrown from the method. To execute it when an exception is thrown, the second parameter asFinally to insertAfter() must be true.

If an exception is thrown, the compiled code inserted by insertAfter() is executed as a finally clause. The value of $_ is 0 or null in the compiled code. After the execution of the compiled code terminates, the exception originally thrown is re-thrown to the caller. Note that the value of $_ is never thrown to the caller; it is rather discarded.

#### $sig
The value of $sig is an array of java.lang.Class objects that represent the formal parameter types in declaration order.

#### $type
The value of $type is an java.lang.Class object representing the formal type of the result value. This variable refers to Void.class if this is a constructor.

#### $class
The value of $class is an java.lang.Class object representing the class in which the edited method is declared. This represents the type of $0.

#### addCatch()
addCatch() inserts a code fragment into a method body so that the code fragment is executed when the method body throws an exception and the control returns to the caller. In the source text representing the inserted code fragment, the exception value is referred to with the special variable $e.

For example, this program:
```java
CtMethod m = ...;
CtClass etype = ClassPool.getDefault().get("java.io.IOException");
m.addCatch("{ System.out.println($e); throw $e; }", etype);
translates the method body represented by m into something like this:

try {
    the original method body
}
catch (java.io.IOException e) {
    System.out.println(e);
    throw e;
}
```
Note that the inserted code fragment must end with a throw or return statement.



## 4.2 Altering a method body
CtMethod and CtConstructor provide setBody() for substituting a whole method body. They compile the given source text into Java bytecode and substitutes it for the original method body. If the given source text is null, the substituted body includes only a return statement, which returns zero or null unless the result type is void.

In the source text given to setBody(), the identifiers starting with $ have special meaning

* `$0, $1, $2, ...`    	this and actual parameters
* `$args`	An array of parameters. The type of $args is Object[].
* `$$`	All actual parameters.
* `$cflow(...)`	cflow variable
* `$r`	The result type. It is used in a cast expression.
* `$w`	The wrapper type. It is used in a cast expression.
* `$sig`	An array of java.lang.Class objects representing the formal parameter types.
* `$type`	A java.lang.Class object representing the formal result type.
* `$class`	A java.lang.Class object representing the class that declares the method
currently edited (the type of $0).
 
Note that $_ is not available.

### Substituting source text for an existing expression
Javassist allows modifying only an expression included in a method body. javassist.expr.ExprEditor is a class for replacing an expression in a method body. The users can define a subclass of ExprEditor to specify how an expression is modified.

To run an ExprEditor object, the users must call instrument() in CtMethod or CtClass. For example,

```java
CtMethod cm = ... ;
cm.instrument(
    new ExprEditor() {
        public void edit(MethodCall m)
                      throws CannotCompileException
        {
            if (m.getClassName().equals("Point")
                          && m.getMethodName().equals("move"))
                m.replace("{ $1 = 0; $_ = $proceed($$); }");
        }
    });
```

searches the method body represented by cm and replaces all calls to move() in class Point with a block:

```java
{ $1 = 0; $_ = $proceed($$); }
```
so that the first parameter to move() is always 0. Note that the substituted code is not an expression but a statement or a block. It cannot be or contain a try-catch statement.

The method instrument() searches a method body. If it finds an expression such as a method call, field access, and object creation, then it calls edit() on the given ExprEditor object. The parameter to edit() is an object representing the found expression. The edit() method can inspect and replace the expression through that object.

Calling replace() on the parameter to edit() substitutes the given statement or block for the expression. If the given block is an empty block, that is, if replace("{}") is executed, then the expression is removed from the method body. If you want to insert a statement (or a block) before/after the expression, a block like the following should be passed to replace():

```java
{ before-statements;
  $_ = $proceed($$);
  after-statements; }
```
whichever the expression is either a method call, field access, object creation, or others. The second statement could be:

```java
$_ = $proceed();
```
if the expression is read access, or

```java
$proceed($$);
```
if the expression is write access.

Local variables available in the target expression is also available in the source text passed to replace() if the method searched by instrument() was compiled with the -g option (the class file includes a local variable attribute).

### javassist.expr.MethodCall
A MethodCall object represents a method call. The method replace() in MethodCall substitutes a statement or a block for the method call. It receives source text representing the substitued statement or block, in which the identifiers starting with $ have special meaning as in the source text passed to insertBefore().

$0	The target object of the method call.
This is not equivalent to this, which represents the caller-side this object.
$0 is null if the method is static.
 
 
$1, $2, ...    	The parameters of the method call.
$_	The resulting value of the method call.
$r	The result type of the method call.
$class    	A java.lang.Class object representing the class declaring the method.
$sig    	An array of java.lang.Class objects representing the formal parameter types.
$type    	A java.lang.Class object representing the formal result type.
$proceed    	The name of the method originally called in the expression.
Here the method call means the one represented by the MethodCall object.

The other identifiers such as $w, $args and $$ are also available.

Unless the result type of the method call is void, a value must be assigned to $_ in the source text and the type of $_ is the result type. If the result type is void, the type of $_ is Object and the value assigned to $_ is ignored.

$proceed is not a String value but special syntax. It must be followed by an argument list surrounded by parentheses ( ).

### javassist.expr.ConstructorCall
A ConstructorCall object represents a constructor call such as this() and super included in a constructor body. The method replace() in ConstructorCall substitutes a statement or a block for the constructor call. It receives source text representing the substituted statement or block, in which the identifiers starting with $ have special meaning as in the source text passed to insertBefore().

$0	The target object of the constructor call. This is equivalent to this.
$1, $2, ...    	The parameters of the constructor call.
$class    	A java.lang.Class object representing the class declaring the constructor.
$sig    	An array of java.lang.Class objects representing the formal parameter types.
$proceed    	The name of the constructor originally called in the expression.
Here the constructor call means the one represented by the ConstructorCall object.

The other identifiers such as $w, $args and $$ are also available.

Since any constructor must call either a constructor of the super class or another constructor of the same class, the substituted statement must include a constructor call, normally a call to $proceed().

$proceed is not a String value but special syntax. It must be followed by an argument list surrounded by parentheses ( ).

### javassist.expr.FieldAccess
A FieldAccess object represents field access. The method edit() in ExprEditor receives this object if field access is found. The method replace() in FieldAccess receives source text representing the substitued statement or block for the field access.

In the source text, the identifiers starting with $ have special meaning:

$0	The object containing the field accessed by the expression. This is not equivalent to this.
this represents the object that the method including the expression is invoked on.
$0 is null if the field is static.
 
 
$1	The value that would be stored in the field if the expression is write access. 
Otherwise, $1 is not available.
 
$_	The resulting value of the field access if the expression is read access. 
Otherwise, the value stored in $_ is discarded.
 
$r	The type of the field if the expression is read access. 
Otherwise, $r is void.
 
$class    	A java.lang.Class object representing the class declaring the field.
$type	A java.lang.Class object representing the field type.
$proceed    	The name of a virtual method executing the original field access. .
The other identifiers such as $w, $args and $$ are also available.

If the expression is read access, a value must be assigned to $_ in the source text. The type of $_ is the type of the field.

### javassist.expr.NewExpr
A NewExpr object represents object creation with the new operator (not including array creation). The method edit() in ExprEditor receives this object if object creation is found. The method replace() in NewExpr receives source text representing the substitued statement or block for the object creation.

In the source text, the identifiers starting with $ have special meaning:

$0	null.
$1, $2, ...    	The parameters to the constructor.
$_	The resulting value of the object creation. 
A newly created object must be stored in this variable.
 
$r	The type of the created object.
$sig    	An array of java.lang.Class objects representing the formal parameter types.
$type    	A java.lang.Class object representing the class of the created object.
$proceed    	The name of a virtual method executing the original object creation. .
The other identifiers such as $w, $args and $$ are also available.

### javassist.expr.NewArray
A NewArray object represents array creation with the new operator. The method edit() in ExprEditor receives this object if array creation is found. The method replace() in NewArray receives source text representing the substitued statement or block for the array creation.

In the source text, the identifiers starting with $ have special meaning:

$0	null.
$1, $2, ...    	The size of each dimension.
$_	The resulting value of the array creation. 
A newly created array must be stored in this variable.
 
$r	The type of the created array.
$type    	A java.lang.Class object representing the class of the created array.
$proceed    	The name of a virtual method executing the original array creation. .
The other identifiers such as $w, $args and $$ are also available.

For example, if the array creation is the following expression,

```java
String[][] s = new String[3][4];
```
then the value of $1 and $2 are 3 and 4, respectively. $3 is not available.
If the array creation is the following expression,

```java
String[][] s = new String[3][];
```
then the value of $1 is 3 but $2 is not available.

### javassist.expr.Instanceof
A Instanceof object represents an instanceof expression. The method edit() in ExprEditor receives this object if an instanceof expression is found. The method replace() in Instanceof receives source text representing the substitued statement or block for the expression.

In the source text, the identifiers starting with $ have special meaning:

$0	null.
$1	The value on the left hand side of the original instanceof operator.
$_	The resulting value of the expression. The type of $_ is boolean.
$r	The type on the right hand side of the instanceof operator.
$type	A java.lang.Class object representing the type on the right hand side of the instanceof operator.
$proceed    	The name of a virtual method executing the original instanceof expression. 
It takes one parameter (the type is java.lang.Object) and returns true 
if the parameter value is an instance of the type on the right hand side of 
the original instanceof operator. Otherwise, it returns false.
 
 
 
The other identifiers such as $w, $args and $$ are also available.

### javassist.expr.Cast
A Cast object represents an expression for explicit type casting. The method edit() in ExprEditor receives this object if explicit type casting is found. The method replace() in Cast receives source text representing the substitued statement or block for the expression.

In the source text, the identifiers starting with $ have special meaning:

$0	null.
$1	The value the type of which is explicitly cast.
$_	The resulting value of the expression. The type of $_ is the same as the type 
after the explicit casting, that is, the type surrounded by ( ).
 
$r	the type after the explicit casting, or the type surrounded by ( ).
$type	A java.lang.Class object representing the same type as $r.
$proceed    	The name of a virtual method executing the original type casting. 
It takes one parameter of the type java.lang.Object and returns it after 
the explicit type casting specified by the original expression.
 
 
The other identifiers such as $w, $args and $$ are also available.

### javassist.expr.Handler
A Handler object represents a catch clause of try-catch statement. The method edit() in ExprEditor receives this object if a catch is found. The method insertBefore() in Handler compiles the received source text and inserts it at the beginning of the catch clause.

In the source text, the identifiers starting with $ have meaning:

$1	The exception object caught by the catch clause.
$r	the type of the exception caught by the catch clause. It is used in a cast expression.
$w	The wrapper type. It is used in a cast expression.
$type    	A java.lang.Class object representing 
the type of the exception caught by the catch clause.
 
If a new exception object is assigned to $1, it is passed to the original catch clause as the caught exception.



## 4.3 Adding a new method or field

### Adding a method
Javassist allows the users to create a new method and constructor from scratch. CtNewMethod and CtNewConstructor provide several factory methods, which are static methods for creating CtMethod or CtConstructor objects. Especially, make() creates a CtMethod or CtConstructor object from the given source text.

For example, this program:

```java
CtClass point = ClassPool.getDefault().get("Point");
CtMethod m = CtNewMethod.make(
                 "public int xmove(int dx) { x += dx; }",
                 point);
point.addMethod(m);
```
adds a public method xmove() to class Point. In this example, x is a int field in the class Point.

The source text passed to make() can include the identifiers starting with $ except $_ as in setBody(). It can also include $proceed if the target object and the target method name are also given to make(). For example,

```java
CtClass point = ClassPool.getDefault().get("Point");
CtMethod m = CtNewMethod.make(
                 "public int ymove(int dy) { $proceed(0, dy); }",
                 point, "this", "move");
```

this program creates a method ymove() defined below:

public int ymove(int dy) { this.move(0, dy); }
Note that $proceed has been replaced with this.move.

Javassist provides another way to add a new method. You can first create an abstract method and later give it a method body:
```java
CtClass cc = ... ;
CtMethod m = new CtMethod(CtClass.intType, "move",
                          new CtClass[] { CtClass.intType }, cc);
cc.addMethod(m);
m.setBody("{ x += $1; }");
cc.setModifiers(cc.getModifiers() & ~Modifier.ABSTRACT);
```

Since Javassist makes a class abstract if an abstract method is added to the class, you have to explicitly change the class back to a non-abstract one after calling setBody().

### Mutual recursive methods
Javassist cannot compile a method if it calls another method that has not been added to a class. (Javassist can compile a method that calls itself recursively.) To add mutual recursive methods to a class, you need a trick shown below. Suppose that you want to add methods m() and n() to a class represented by cc:

```java
CtClass cc = ... ;
CtMethod m = CtNewMethod.make("public abstract int m(int i);", cc);
CtMethod n = CtNewMethod.make("public abstract int n(int i);", cc);
cc.addMethod(m);
cc.addMethod(n);
m.setBody("{ return ($1 <= 0) ? 1 : (n($1 - 1) * $1); }");
n.setBody("{ return m($1); }");
cc.setModifiers(cc.getModifiers() & ~Modifier.ABSTRACT);
```

You must first make two abstract methods and add them to the class. Then you can give the method bodies to these methods even if the method bodies include method calls to each other. Finally you must change the class to a not-abstract class since addMethod() automatically changes a class into an abstract one if an abstract method is added.

### Adding a field
Javassist also allows the users to create a new field.

```java
CtClass point = ClassPool.getDefault().get("Point");
CtField f = new CtField(CtClass.intType, "z", point);
point.addField(f);
```

This program adds a field named z to class Point.

If the initial value of the added field must be specified, the program shown above must be modified into:

```java
CtClass point = ClassPool.getDefault().get("Point");
CtField f = new CtField(CtClass.intType, "z", point);
point.addField(f, "0");    // initial value is 0.
```

Now, the method addField() receives the second parameter, which is the source text representing an expression computing the initial value. This source text can be any Java expression if the result type of the expression matches the type of the field. Note that an expression does not end with a semi colon (;).

Furthermore, the above code can be rewritten into the following simple code:

```java
CtClass point = ClassPool.getDefault().get("Point");
CtField f = CtField.make("public int z = 0;", point);
point.addField(f);
```

### Removing a member
To remove a field or a method, call removeField() or removeMethod() in CtClass. A CtConstructor can be removed by removeConstructor() in CtClass.



## 4.4 Annotations
CtClass, CtMethod, CtField and CtConstructor provides a convenient method getAnnotations() for reading annotations. It returns an annotation-type object.

For example, suppose the following annotation:
```java
public @interface Author {
    String name();
    int year();
}
```
This annotation is used as the following:
```java
@Author(name="Chiba", year=2005)
public class Point {
    int x, y;
}
```
Then, the value of the annotation can be obtained by getAnnotations(). It returns an array containing annotation-type objects.
```java
CtClass cc = ClassPool.getDefault().get("Point");
Object[] all = cc.getAnnotations();
Author a = (Author)all[0];
String name = a.name();
int year = a.year();
System.out.println("name: " + name + ", year: " + year);
```
This code snippet should print:
```
name: Chiba, year: 2005
```

Since the annoation of Point is only @Author, the length of the array all is one and all[0] is an Author object. The member values of the annotation can be obtained by calling name() and year() on the Author object.

To use getAnnotations(), annotation types such as Author must be included in the current class path. They must be also accessible from a ClassPool object. If the class file of an annotation type is not found, Javassist cannot obtain the default values of the members of that annotation type.



## 4.5 Runtime support classes
In most cases, a class modified by Javassist does not require Javassist to run. However, some kinds of bytecode generated by the Javassist compiler need runtime support classes, which are in the javassist.runtime package (for details, please read the API reference of that package). Note that the javassist.runtime package is the only package that classes modified by Javassist may need for running. The other Javassist classes are never used at runtime of the modified classes.



## 4.6 Import
All the class names in source code must be fully qualified (they must include package names). However, the java.lang package is an exception; for example, the Javassist compiler can resolve Object as well as java.lang.Object.

To tell the compiler to search other packages when resolving a class name, call importPackage() in ClassPool. For example,
```java
ClassPool pool = ClassPool.getDefault();
pool.importPackage("java.awt");
CtClass cc = pool.makeClass("Test");
CtField f = CtField.make("public Point p;", cc);
cc.addField(f);
```
The seconde line instructs the compiler to import the java.awt package. Thus, the third line will not throw an exception. The compiler can recognize Point as java.awt.Point.

Note that importPackage() does not affect the get() method in ClassPool. Only the compiler considers the imported packages. The parameter to get() must be always a fully qualified name.



## 4.7 Limitations
In the current implementation, the Java compiler included in Javassist has several limitations with respect to the language that the compiler can accept. Those limitations are:

The new syntax introduced by J2SE 5.0 (including enums and generics) has not been supported. Annotations are supported by the low level API of Javassist. See the javassist.bytecode.annotation package (and also getAnnotations() in CtClass and CtBehavior). Generics are also only partly supported. See the latter section for more details.
Array initializers, a comma-separated list of expressions enclosed by braces { and }, are not available unless the array dimension is one.
Inner classes or anonymous classes are not supported. Note that this is a limitation of the compiler only. It cannot compile source code including an anonymous-class declaration. Javassist can read and modify a class file of inner/anonymous class.
Labeled continue and break statements are not supported.
The compiler does not correctly implement the Java method dispatch algorithm. The compiler may confuse if methods defined in a class have the same name but take different parameter lists.
For example,
```java
class A {} 
class B extends A {} 
class C extends B {} 

class X { 
    void foo(A a) { .. } 
    void foo(B b) { .. } 
}
```
If the compiled expression is x.foo(new C()), where x is an instance of X, the compiler may produce a call to foo(A) although the compiler can correctly compile foo((B)new C()).

The users are recommended to use # as the separator between a class name and a static method or field name. For example, in regular Java,
javassist.CtClass.intType.getName()
calls a method getName() on the object indicated by the static field intType in javassist.CtClass. In Javassist, the users can write the expression shown above but they are recommended to write:
```
javassist.CtClass#intType.getName()
```
so that the compiler can quickly parse the expression.
