---
category: Java
tag: JavaSE
date: 2017-04-18
title: java8 函数接口
---

* `BiConsumer<T,U>` 接受两个输入参数的操作，并且不返回任何结果
* `BiFunction<T,U,R>` 接受两个输入参数的方法，并且返回一个结果
* `BinaryOperator<T>` 作用于于两个同类型操作符的操作，并且返回了操作符同类型的结果
* `BiPredicate<T,U>` 两个参数的boolean值方法
* `BooleanSupplier` boolean值结果的提供方
* `Consumer<T>` 接受一个输入参数并且无返回的操作
* `DoubleBinaryOperator` 作用于两个double值操作符的操作，并且返回了一个double值的结果。
* `DoubleConsumer` 接受double值参数的操作，并且不返回结果。
* `DoubleFunction<R>` double值参数的方法，并且返回结果
* `DoublePredicate` 拥有double值参数的boolean值方法
* `DoubleSupplier` double值结构的提供方
* `DoubleToIntFunction` 接受一个double类型输入，返回一个int类型结果。
* `DoubleToLongFunction` 接受一个double类型输入，返回一个long类型结果
* `DoubleUnaryOperator` 接受一个参数同为类型double,返回值类型也为double 。
* `Function<T,R>` 接受一个输入参数，返回一个结果。
* `IntBinaryOperator` 接受两个参数同为类型int,返回值类型也为int 。
* `IntConsumer` 接受一个int类型的输入参数，无返回值 。
* `IntFunction<R>` 接受一个int类型输入参数，返回一个结果 。
* `IntPredicate` 接受一个int输入参数，返回一个布尔值的结果。
* `IntSupplier` 无参数，返回一个int类型结果。
* `IntToDoubleFunction` 接受一个int类型输入，返回一个double类型结果 。
* `IntToLongFunction` 接受一个int类型输入，返回一个long类型结果。
* `IntUnaryOperator` 接受一个参数同为类型int,返回值类型也为int 。
* `LongBinaryOperator` 接受两个参数同为类型long,返回值类型也为long。
* `LongConsumer` 接受一个long类型的输入参数，无返回值。
* `LongFunction<R>` 接受一个long类型输入参数，返回一个结果。
* `LongPredicate` R接受一个long输入参数，返回一个布尔值类型结果。
* `LongSupplier` 无参数，返回一个结果long类型的值。
* `LongToDoubleFunction` 接受一个long类型输入，返回一个double类型结果。
* `LongToIntFunction` 接受一个long类型输入，返回一个int类型结果。
* `LongUnaryOperator` 接受一个参数同为类型long,返回值类型也为long。
* `ObjDoubleConsumer<T>` 接受一个object类型和一个double类型的输入参数，无返回值。
* `ObjIntConsumer<T>` 接受一个object类型和一个int类型的输入参数，无返回值。
* `ObjLongConsumer<T>` 接受一个object类型和一个long类型的输入参数，无返回值。
* `Predicate<T>` 接受一个输入参数，返回一个布尔值结果。
* `Supplier<T>` 无参数，返回一个结果。
* `ToDoubleBiFunction<T,U>` 接受两个输入参数，返回一个double类型结果
* `ToDoubleFunction<T>` 接受一个输入参数，返回一个double类型结果
* `ToIntBiFunction<T,U>` 接受两个输入参数，返回一个int类型结果。
* `ToIntFunction<T>` 接受一个输入参数，返回一个int类型结果。
* `ToLongBiFunction<T,U>` 接受两个输入参数，返回一个long类型结果。
* `ToLongFunction<T>` 接受一个输入参数，返回一个long类型结果。
* `UnaryOperator<T>` 接受一个参数为类型T,返回值类型也为T。