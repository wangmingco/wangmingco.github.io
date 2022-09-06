---
category: 翻译
tag: soot
title: Packs and phases in Soot [译]
date: 2022-08-08 10:56:00
---

One frequent question that comes up on the Soot mailing list is when to run a particular analysis in Soot. Soot’s execution is divided in a set of different packs and each pack contains different phases. Therefore the question could be rephrased as “In which pack do I have to run my analysis or transformation?”. This tutorial tries to help you answer this question.

## Phase options

Soot 命令行有非常多的选项用于处理你的分析和优化需求。

命令行一般的参数格式是`-p PHASE OPT:VAL`. 接下来会详细讨论所有的选项。例如，当我们再Soot中进行分析时，想要保存本地变量的名称，那么我们就可以添加选项`-p jb use-original-names:true`(也可以使用缩写`-p jb use-original-names`, 此时该值默认为true). 

Soot supports hundreds of very fine grained options that allow you to tune all the analyses and optimizations to your needs, directly from the command line.

The general format of these command line options is -p PHASE OPT:VAL. A complete document of all phase options is available here. For instance, let’s say that we want to preserve the names of local variables (if possible) when performing an analysis within Soot. Then we can add the command line option -p jb use-original-names:true. A shortcut is -p jb use-original-names, where the true is implicitly assumed.

## jb: Jimple Body Creation

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/soot/sootphases.png)

上图展示了Soot现存不同的`pack`之间的差异。首先Soot对每个单独的方法体(换句话说只支持拥有方法体的方法)都支持`jb`pack. 注意，像`System.currentTimeMillis()`这种native方法是没有方法体的。

The diagram above shows you the different packs that exist in Soot. First, Soot applies the jb pack to every single method body, or in other terms to every method that has a body. Native methods such as System.currentTimeMillis() have no body. The jb pack is fixed and it is concerned with the creation of the Jimple representation. It cannot be changed!

## Whole-program packs

Soot支持下面四种整个程序阶段。

Then Soot next applies four whole-program packs

1. [wjpp](https://soot-build.cs.uni-paderborn.de/public/origin/master/soot/soot-master/3.0.0/options/soot_options.htm#phase_3), 整个jimple程序的预处理阶段。这个阶段只会在接下来 Jimple IR 
2. [cg](https://soot-build.cs.uni-paderborn.de/public/origin/master/soot/soot-master/3.0.0/options/soot_options.htm#phase_5), 
3. [wjtp](https://soot-build.cs.uni-paderborn.de/public/origin/master/soot/soot-master/3.0.0/options/soot_options.htm#phase_8), 
4. [wjop](https://soot-build.cs.uni-paderborn.de/public/origin/master/soot/soot-master/3.0.0/options/soot_options.htm#phase_9), 
5. [wjap](https://soot-build.cs.uni-paderborn.de/public/origin/master/soot/soot-master/3.0.0/options/soot_options.htm#phase_10), 

1. wjpp, the whole-jimple pre-processing pack. This pack is used only in cases where the Jimple IR needs to be changed (typically augmented) in order for the subsequent call-graph generation to produce in more complete or precise call-graph. A prime example would be the insertion of (virtual or static) calls that model reflective calls, or method calls that model some implicit control flow through frameworks.
2. cg, the call graph pack builds the call graph using one of various construction algorithms, see the parameters here. Also, Ondrej Lhotak's Master thesis is helpful in explaining the related concepts.
3. wjtp, the whole-jimple transformation pack. This is the primary pack into which you should insert any inter-procedural/whole-program analysis. When it executes, a call-graph has already been computed and can be accessed right away.
4. wjop, the whole-jimple optimization pack. This is the pack that should be used if you wish to implement code optimizations or other transformations of the Jimple IR based on your whole-program analysis results.
5. wjap, the whole-jimple annotation pack, can be used to annotate Jimple statements with additional metadata. This metadata can be persisted in Java bytecode attributes.

All of these packs can be changed, and in particular one can add SceneTransformers to these packs that conduct a whole-program analysis. A SceneTransformer accesses the program through the Scene in order to analyze and transform the program. This code snippet here adds a dummy transformer to the wjtp pack:

```java
public static void main(String[] args) {
  PackManager.v().getPack("wjtp").add(
      new Transform("wjtp.myTransform", new SceneTransformer() {
        protected void internalTransform(String phaseName,
            Map options) {
          System.err.println(Scene.v().getApplicationClasses());
        }
      }));
  soot.Main.main(args);
} 
```

Note: Whole-program packs are not enabled by default. You have to state the -w option on Soot’s command line to enable them.

## Jimple packs jtp, jop, jap

Similar to Soot’s whole-program packs, Soot then applies –again to each body– a sequence of three packs:

1. jtp, the jimple transformation pack,
2. jop, the jimple optimization pack, and
3. jap, the jimple annotation pack.

jtp is empty and enabled by default. This is usually where you want to place your intra-procedural analyses.

jop comes pre-equipped with a set of Jimple optimizations. It is disabled by default and can be enabled by using Soot’s -o command line option, or by using the switch –p jop enabled.

jap is the annotation pack for Jimple. Here, annotations are added to each Jimple body that let you or others or a JVM assess the results of the optimizations. By default, this pack is enabled but all default phases in the pack are disabled. Hence, if you add your own analysis to this pack it will automatically be enabled by default.

The following code snippet enabled the null pointer tagger and registers a new BodyTransformer which prints out tags for each statement in every method:

```java
public static void main(String[] args) {
  PackManager.v().getPack("jap").add(
      new Transform("jap.myTransform", new BodyTransformer() {

        protected void internalTransform(Body body, String phase, Map options) {
          for (Unit u : body.getUnits()) {
            System.out.println(u.getTags());
          }
        }
      }));
  Options.v().set_verbose(true);
  PhaseOptions.v().setPhaseOption("jap.npc", "on");
  soot.Main.main(args);
}
```

Note: Every Transform added to a (non-whole) Jimple pack must be a BodyTransformer.

## Packs bb and tag

As the diagram at the top shows, Soot next applied the packs bb and tag to each body. The bb pack converts the (optimized and tagged) Jimple bodies into Baf bodies. Baf is Soot’s stack based intermediate representation from which Soot creates bytecode. The tag pack last but not least aggregates certain tags. For instance, if multiple Jimple (or Baf) statements share the same line number tag then Soot will retain this tag only on the first instruction that carries this tag, to gain uniqueness.

## The Dava body pack db

Since a little more than a year, Soot has an additional pack, db, not shown on the slide at the top. Its sole use is to enable or disable certain transformations when decompiling code into java using the –f dava command line option. It contains no actual transforms, and nothing should be added to it.

## Which packs are enabled when?

One other big point confusion is always which packs are enabled when. The following document explains all the settings in question and their defaults.

* Soot command line (watch out for the –w and –O options) –O will enable the optimization packs bop, gop, jop and sop (i.e. sets e.g. –p jop enabled:true), –w will enable the whole-program packs, i.e., wjpp, cg, and wjap, –W enables wjop and wsop

This document now also describes every single phase in every pack and its settings.

