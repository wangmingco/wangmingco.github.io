---
category: 翻译
tag: soot
title: Soot 基础对象 [译]
date: 2022-08-05 10:21:00
---

## Fundamental Soot objects

![Fundamental Soot objects](https://github.com/soot-oss/soot/wiki/Fundamental-Soot-objects)

Soot的类继承结构非常庞大和复杂，本节为读者介绍一些在Soot开发中最重要的类。

我们会详细介绍如下几个类的概念`Body`, `Unit`, `Local`, `Value`, `UnitBox` 和 `ValueBox`

### Body

在教程![Creating a class from scratch]() 中已经提到过`Body`这个概念。下面我们会更加详细的阐述`Body`特性。

Soot使用`Body`存储方法的代码。在Soot中有四种类型的`Body`，每种`Body`都是一种中间表示(IR)
* BafBody
* JimpleBody
* ShimpleBody
* GrimpBody

Also, recall that a chain is a list-like data structure providing constant-time access to chain elements, including insertion and removal.

在`Body`中三个最主要的链就是 
* `Unit`链
* `Local`链
* `Trap`链。

下面的例子将演示每个链的具体规则：

看一下下面的Java方法
```java
public static void main(String[] argv) throws Exception
{
    int x = 2, y = 6;

    System.out.println("Hi!");
    System.out.println(x * y + y);
    try
    {
        int z = y * x;
    }
    catch (Exception e)
    {
        throw e;
    }
}
```

经过`Jimplification`之后，我们得到了经过简化的`jimple`代码

```java
public static void main(java.lang.String[]) throws java.lang.Exception
{
    java.lang.String[] r0;
    int i0, i1, i2, $i3, $i4;
    java.io.PrintStream $r1, $r2;
    java.lang.Exception $r3, r4;

    r0 := @parameter0;
    i0 = 2;
    i1 = 6;
    $r1 = java.lang.System.out;
    $r1.println(``Hi!'');
    $r2 = java.lang.System.out;
    $i3 = i0 * i1;
    $i4 = $i3 + i1;
    $r2.println($i4);

 label0:
    i2 = i1 * i0;

 label1:
    goto label3;

 label2:
    $r3 := @caughtexception;
    r4 = $r3;
    throw r4;

 label3:
    return;

    catch java.lang.Exception from label0 to label1 with label2;
}
```

### Local variables

该方法体的本地变量如下

```java
java.lang.String[] r0;
int i0, i1, i2, $i3, $i4;
java.io.PrintStream $r1, $r2;
java.lang.Exception $r3, r4;
```
本地变量存储在`localChain`里，可以通过`body.getLocals()`方法访问这些本地变量。每一种中间表示都可以用自己的方式实现本地变量。但是，不管如何实现，对于每一个变量`Local r0`都要能正确调用`r0.getName()`, `r0.getType()`, `r0.setName()` 和 `r0.setType()`。注意本地变量是必须包含类型的。

### Traps

为了支持Java的异常处理，Soot定义了traps概念。在Java的字节码中处理异常是通过一个元组(tuple)表示的(`exception`, `start`, `stop`, `handler`). 在start和stop之间(`[start, stop)`)的字节码中,如果有异常抛出来，后面的handler将处理该异常 

下面的trap就对应一个异常处理
```java
catch java.lang.Exception from label0 to label1 with label2;
```


### Units

`Body`中最有趣的部分就是它的`Unit`链了。这是`Body`中真正的代码部分。`Jimple`提供了`Unit`的`Stmt`实现，而`Gimp`提供了`Unit`的`Inst`实现。这说明，每一个IR都有它自己独有的语句概念。

Jimple 一个简单的`Stmt`例子就是`AssignStmt`, 这是一个Jimple的赋值语句。例如

```java
x = y + z;
```

### Value

代码总是基于数据运行。为了表达数据，Soot提供了`Value`接口。下面是一些不同的`Value`实现

* `Local`s
* `Constant`s
* `Expressions` (`Expr`)
* `ParameterRefs`, `CaughtExceptionRefs` 和 `ThisRefs`.

`Expr` 接口有一整套的实现，例如 `NewExpr` 和 `AddExpr`。一般来说，`Expr` 接受一个或者多个`Value`然后产出一个`Value`。

下面我们看一个真实的`Value`示例

```java
x = y + 2;
```

这是一个 `AssignStmt`, 做操作符是`x`, 右操作符是`y + 2`(这是一个`AddExpr`). `AddExpr` 包含俩个操作数`y`和`2`, `y`是一个变量`Local`而`2`是一个常量`Constant`.

在Jimple中，我们强制要求，所有的`Value`最多只能包含一个表达式。Grimp取消了这个限制，从而可以产生更加易读但是更难分析的代码。

### Boxes

Boxes 在Soot中是无处不在的。要时刻记住`Box 就是一个指针`。它提供了直接访问Soot对象的方式。

其实更能表达指针含义的名字是`Ref`而不是`Box`，可是`Ref`在Soot中已经被赋予了其他含义，因此我们只能用`Box`这个名字了。

在Soot中有俩种`Box`
* `ValueBox`
* `UnitBox`

通过名字也能很清晰地看出，`ValueBox` 指向的是`Value`而`UnitBox`指向的是`Unit`，这很类似于c++中的`Unit *`和`Value *`

### UnitBox

某些`Unit`需要包含一些指向其他Unit的引用。例如`GotoStmt`需要知道它的目标是什么。因此Soot提供了`UnitBox`。

例如下面的jimple代码
```java
    x = 5;
    goto l2;
    y = 3;
l2: z = 9;
```

每一个`Unit`都必须提供`getUnitBoxes()`方法。对于大多数`UnitBox`返回的都是一个空列表。但是在`GotoStmt`中，`getUnitBoxes()`返回了一个单元素列表，它返回的是一个指向了`l2`的`Box`。

注意，`SwitchStmt` 通常会返回一个多元素的`Box`列表。

`Box`在修改代码时非常有用。例如我们有如下一个语句
```java
  s: goto l2;
```
还有一个l2语句
```java
l2:  goto l3;
```

我们可以很清楚的看到，不管s是什么类型，s都会指向l3，而不是l2. 对于这种情况, 我们可以将所有的`Unit`统一修改
```java
public void readjustJumps(Unit s, Unit oldU, Unit newU)
{
    Iterator ubIt = s.getUnitBoxes.iterator();
    while (ubIt.hasNext())
    {
        StmtBox tb = (StmtBox)ubIt.next();
        Stmt targ = (Stmt)tb.getUnit();

        if (targ == oldU)
            tb.setUnit(newU);
    }
}
```


Some code similar to this is used in Unit itself, to enable the creation of PatchingChain, an implementation of Chain which adjusts pointers to Units which get removed from the Chain.

### ValueBox

与`Unit`情况类似，我们需要一种指向`Value`的指针，`ValueBox`. 

我们可以用`ValueBox`做常量展开，例如`AssignStmt`会运算一个`AddExpr`加法表达式将俩个常量加到一起，我们可以静态地将它们加到一起，然后再将结果放到`UseBox`.

下面是`AddExpr`的一种展开

```java
public void foldAdds(Unit u)
{
    Iterator ubIt = u.getUseBoxes().iterator();
    while (ubIt.hasNext())
    {
        ValueBox vb = (ValueBox) ubIt.next();
        Value v = vb.getValue();
        if (v instanceof AddExpr)
        {
            AddExpr ae = (AddExpr) v;
            Value lo = ae.getOp1(), ro = ae.getOp2();
            if (lo instanceof IntConstant && ro instanceof IntConstant)
            {
                IntConstant l = (IntConstant) lo,
                      r = (IntConstant) ro;
                int sum = l.value + r.value;
                vb.setValue(IntConstant.v(sum));
            }
        }
    }
}
```

注意，这段代码可以忽略类型，基于任何Unit都可以正常工作。

### Unit revisited

现在我们看看`Unit`还必须提供哪些方法

```java
public List getUseBoxes();
public List getDefBoxes();
public List getUseAndDefBoxes();
```

上面这些方法会返回当前`Unit`使用到或者定义的`ValueBox`列表。`getUseBoxes()`会返回所有使用到的value，其中包含了构成它们的表达式。

```java
public List getUnitBoxes();
```

这个方法返回`UnitBox`列表, 指向当前方法的所有的unit(方法调用图？).

```java
public List getBoxesPointingToThis();
```

这个方法返回`UnitBox`列表, 包含了所有目标是当前unit的Unit列表。

```java
public boolean fallsThrough();
public boolean branches();
```

These methods have to do with the flow of execution after this Unit. The former method returns true if execution can continue to the following Unit, while the latter returns true if execution might continue to some Unit which isn't immediately after this one.

```java
public void redirectJumpsToThisTo(Unit newLocation);
```

This method uses getBoxesPointingToThis to change all jumps to this Unit, pointing them instead at newLocation.