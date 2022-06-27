---
category: Java
tag: JavaSE
title: 通过Function转换list和map
date: 2016-12-30 14:13:00
---

list转换到map
```java
public static <K, V> Map<K, V> listToMap(List<V> list, Function<V, K> function) {
  Map<K, V>  map = new HashMap<>();
  for (V object : list) {
      map.put(function.apply(object), object);
  }
  return map;
}
```

map转换到list
```java
public static <K, V, T> Map<K, T> listToMap(List<V> list, Function<V, K> keyFunction, Function<V, T> valueFunction) {
  Map<K, T>  map = new HashMap<>();
  for (V object : list) {
      map.put(keyFunction.apply(object), valueFunction.apply(object));
  }
  return map;
}
```