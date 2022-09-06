---
category: 翻译
tag: soot
title: A brief overview of Shimple [译]
date: 2022-08-07 10:21:00
---

This document briefly describes Shimple, an SSA variant of Soot's Jimple internal representation. It assumes general knowledge of Soot, Jimple and SSA form. You may wish to jump directly to the walk-through section for a demonstration of why you might be interested in using Shimple either by implementing analyses or by applying existing optimizations.

> Note: While Soot supports SSA through Shimple, please note that most other analyses are implemented on top of Jimple. Hence, if you implement an analysis on top of SSA/Shimple, you may need to handle this gap somehow, mapping results from the one representation to the other.

## Why Shimple?

Static Single Assignment (SSA) form guarantees a single static definition point for every variable used in a program, thereby significantly simplifying as well as enabling certain analyses.

Shimple provides you with an IR in SSA form that is almost entirely identical to Jimple except for the introduction of Phi nodes. The idea is that Shimple can be treated almost identically to Jimple with the added benefits of SSA.

For example, the additional variable splitting due to SSA form may turn a previously flow-insensitive analysis into a flow-sensitive one with little or no additional work.

## Hacking Overview

The public API of Shimple is fully described in the Soot API documentation. In particular, in the soot.shimple package, the Shimple class provides the Shimple grammar constructors and various utility functions, the ShimpleBody class describes Shimple bodies and PhiExpr provides the interface to Phi expressions.

Use/Definition and Definition/Use chains for Shimple bodies can be obtained with ShimpleLocalDefs or ShimpleLocalUses available in package soot.shimple.toolkits.scalar.

Currently, the only Shimple optimization available is the powerful, control flow aware, SConstantPropagatorAndFolder. The latter as well as some simple Shimple analyses are available in package soot.shimple.toolkits.scalar. Please consult the Soot source for details.

## Command Line Walk Through

For fun, you may wish to run Shimple from the command-line and study its output. Consider the following (compiled) Java code of the ShimpleTest class:

```java
public int test()
{
    int x = 100;
        
    while(doIt){
        if(x < 200)
            x = 100;
        else
            x = 200;
    }

    return x;
}
```

## Producing Jimple

If you produce Jimple with soot.Main -f jimple ShimpleTest you obtain the following code for the test() method:
```java
    i0 = 100;
    goto label2;

 label0:
    if i0 >= 200 goto label1;

    i0 = 100;
    goto label2;

 label1:
    i0 = 200;

 label2:
    if $z0 != 0 goto label0;

    return i0;
```

## Producing Shimple

To produce Shimple instead, use soot.Main -f shimple ShimpleTest:
```java
        i0 = 100;
(0)     goto label2;

     label0:
        if i0_1 >= 200 goto label1;

        i0_2 = 100;
(1)     goto label2;

     label1:
(2)     i0_3 = 200;

     label2:
        i0_1 = Phi(i0 #0, i0_3 #2, i0_2 #1);
        if $z0 != 0 goto label0;

        return i0_1;
```

The difference between the Jimple and Shimple output is that the latter guarantees unique local definition points in the program (for scalars). Notice here that the variable i0 has been split into the four variables i0, i0_1, i0_2 and i0_3, each with a unique definition point.

We have also introduced a Phi node. You can read i0_1 = Phi(i0 #0, i0_3 #2, i0_2 #1) as saying that i0_1 will be assigned value i0 if control flow comes from unit #0 or it will be assigned i0_3 if control flow comes from unit #2 or... and so on.

If you have a prejudice against variable names with underscores, you may use soot.Main -f shimple -p shimple standard-local-names ShimpleTest instead so that Shimple applies the Local Name Standardizer each time new locals are introduced.

Feel free to skip the following digression and move on to the next subsection.

## A Digression on Shimple Pointers

Because Soot represents the body of a method internally as a Unit chain, we need to store explicit pointers (such as #0 and #1 in the above example) to keep track of the control flow predecessors of the Phi statements.

Shimple's internal implementation of PatchingChain attempts to move and maintain these pointers in a manner that will be as transparent as possible to the user. For example, in the simplest case, if a statement is appended to block:
```java
     label0:
(1)     i0_1 = 1000;
```

to obtain:
```java
     label0:
        i0_1 = 1000;
(1)     new_stmt;
```

Shimple will automatically move the #1 pointer down to the new statement since it is in the same basic block.

The intent is to provide maximum flexibility for code motion optimizations as well as other transformations. In this case, i0_1 = 1000 is free to move up or down the Unit chain as long as the new location dominates the original CFG block it was in.

## Producing Jimple, Again

Since we eventually have to get rid of those pesky Phi nodes, you may wish to see what the code looks like after going from Jimple to Shimple and back again to Jimple. Do this with java soot.Main -f jimple -via-shimple ShimpleTest:
```java
    i0_1 = 100;
    goto label2;

 label0:
    if i0_1 >= 200 goto label1;

    i0_1 = 100;
    goto label2;

 label1:
    i0_1 = 200;

 label2:
    if $z0 != 0 goto label0;

    return i0_1;
```

Happily, in this case, the Jimple produced looks exactly like the original Jimple code. As usual you may specify -p shimple standard-local-names if the underscores hurt your eyes; they are otherwise quite harmless.

To understand what's really going on when Shimple eliminates Phi nodes, you can tell it to eliminate them naively with soot.Main -f jimple -via-shimple -p shimple phi-elim-opt:none ShimpleTest:
```java
    i0 = 100;
    i0_1 = i0;
    goto label2;

 label0:
    if i0_1 >= 200 goto label1;

    i0_2 = 100;
    i0_1 = i0_2;
    goto label2;

 label1:
    i0_3 = 200;
    i0_1 = i0_3;

 label2:
    if $z0 != 0 goto label0;

    return i0_1;
```

Now you can see that all Shimple did was to replace the Phi node with equivalent copy statements.

## Applying Shimple Optimizations

So, what good is Shimple?

If you were paying attention, you may have noticed that despite the control flow and different assignments to x, the variable x is in fact a constant 100 and is only ever used by a single return statement. In other words, all the computations are quite useless and need to be optimized away.

Let's try to apply Jimple's Constant Propagator and Folder. In fact, to be fair, let's try all the available Jimple optimizations activated with soot.Main -f jimple -O ShimpleTest:
```java
    i0 = 100;
    goto label2;

 label0:
    if i0 >= 200 goto label1;

    i0 = 100;
    goto label2;

 label1:
    i0 = 200;

 label2:
    if $z0 != 0 goto label0;

    return i0;
```

As you can see in this case, the Jimple optimizations failed to deduce that x is a constant. Jimple may be forgiven for this since reasoning about control flow is not always an easy task to automate. Shimple, on the other hand, encodes control flow information explicitly in the Phi nodes thereby allowing optimizations to make use of the information.

Currently, the only optimization we have implemented specifically for Shimple is a version of the powerful constant propagation algorithm sketched by the Cytron et el. The implementation can reason about control flow and can currently handle the conditional branching statements IfStmt, TableSwitchStmt and LookupSwitchStmt.

Let's apply it with soot.Main -f jimple -via-shimple -O ShimpleTest:
```java
 label0:
    if $z0 != 0 goto label0;

    return 100;
```

Et voilà, Shimple optimized out the x variable completely. What happened is that the optimization propagated reachable definitions to the Phi node and then noticed that the Phi node was useless (because it made a selection from identical values) and therefore trimmed it out. In the process, dead code was exposed which was ultimately eliminated.

To understand what is really going on, you can look at the output from soot.Main -f shimple -p sop on, soot.Main -f shimple -p sop on -p sop.cpf prune-cfg:false and soot.Main -f jimple -via-shimple -p shimple phi-elim-opt:none -p sop on -p sop.cpf prune-cfg:false on this and other examples:
```java
public int test2()
{
    int i = 1000;
    int j = 1000;

    while(doIt){
        if(i == j){
            if(anotherIt)
                i = j;
            else
                j = i;
        }
        else{
            i = 5;
            j = 6;
        }
    }

    return i + j;
}
```