---
category: Java
tag: JavaSE
date: 2019-07-03
title: Java String intern() 实现细节
---

> [Java String intern() 实现细节](https://zhuanlan.zhihu.com/p/72054668)

在Java String这个类中有个intern()方法, 该方法是用来将String内部的char数组缓存到JVM内部的字符串常量池中去, 使用方法及方法声明如下
```java
String c = new String("123").intern();

public native String intern();
```

我们看到intern() 方法是个native方法.

```cpp
// openjdk-jdk8u-jdk8u/jdk/src/share/native/java/lang/String.c

#include "jvm.h"
#include "java_lang_String.h"

JNIEXPORT jobject JNICALL
Java_java_lang_String_intern(JNIEnv *env, jobject this)
{
    return JVM_InternString(env, this);
}
```

`Java_java_lang_String_intern` 实现非常简单, 就是直接调用 `JVM_InternString()` 方法

```cpp
// openjdk-jdk8u-jdk8u/hotspot/src/share/vm/prims/jvm.cpp

JVM_ENTRY(jstring, JVM_InternString(JNIEnv *env, jstring str))
  JVMWrapper("JVM_InternString");
  JvmtiVMObjectAllocEventCollector oam;
  if (str == NULL) return NULL;
  oop string = JNIHandles::resolve_non_null(str);
  oop result = StringTable::intern(string, CHECK_NULL);
  return (jstring) JNIHandles::make_local(env, result);
JVM_END
```

首先将`jstring`类型解析成oop类型的字符串, 接着调用`StringTable`的`intern()`.

`StringTable`定义在了`symbolTable.hpp`文件中, 下来看一下intern()方法的实现

```cpp
// openjdk-jdk8u-jdk8u/hotspot/src/share/vm/classfile/symbolTable.cpp

oop StringTable::intern(const char* utf8_string, TRAPS) {
  if (utf8_string == NULL) return NULL;
  ResourceMark rm(THREAD);
  int length = UTF8::unicode_length(utf8_string);
  jchar* chars = NEW_RESOURCE_ARRAY(jchar, length);
  UTF8::convert_to_unicode(utf8_string, chars, length);
  Handle string;
  oop result = intern(string, chars, length, CHECK_NULL);
  return result;
}
```

在上一步`intern()`方法中, 首先将字符数组转化为unicode编码, 然后接着调用下面的intern()方法

```cpp
oop StringTable::intern(Handle string_or_null, jchar* name,
                        int len, TRAPS) {
  unsigned int hashValue = hash_string(name, len);
  int index = the_table()->hash_to_index(hashValue);
  oop found_string = the_table()->lookup(index, name, len, hashValue);

  // Found
  if (found_string != NULL) {
    ensure_string_alive(found_string);
    return found_string;
  }

  // ... 此处代码省略

  Handle string;
  // try to reuse the string if possible
  if (!string_or_null.is_null()) {
    string = string_or_null;
  } else {
    string = java_lang_String::create_from_unicode(name, len, CHECK_NULL);
  }

  // ... 此处代码省略

  // Grab the StringTable_lock before getting the_table() because it could
  // change at safepoint.
  oop added_or_found;
  {
    MutexLocker ml(StringTable_lock, THREAD);
    // Otherwise, add to symbol to table
    added_or_found = the_table()->basic_add(index, string, name, len,
                                  hashValue, CHECK_NULL);
  }

  ensure_string_alive(added_or_found);
  return added_or_found;
}

static StringTable* the_table() { return _the_table; }

StringTable* StringTable::_the_table = NULL;
```

在上面的逻辑中我们可以看到, 首先是通过`the_table()`方法找到`StringTable`, 然后调用`lookup()`方法, 进行查找, 如果找到的话则直接返回找到的引用.如果找不到的话则调用`StringTable#basic_add()`方法将其添加. 添加完之后返回其引用地址.

StringTable的定义如下
```cpp
class StringTable : public RehashableHashtable<oop, mtSymbol> {
  friend class VMStructs;

private:
  // The string table
  static StringTable* _the_table;

  static oop intern(Handle string_or_null, jchar* chars, int length, TRAPS);
  oop basic_add(int index, Handle string_or_null, jchar* name, int len,
                unsigned int hashValue, TRAPS);

  oop lookup(int index, jchar* chars, int length, unsigned int hashValue);

public:
  // The string table
  static StringTable* the_table() { return _the_table; }

  static void create_table() {
    assert(_the_table == NULL, "One string table allowed.");
    _the_table = new StringTable();
  }

  // GC support
  //   Delete pointers to otherwise-unreachable objects.
  static void unlink(BoolObjectClosure* cl) {
    int processed = 0;
    int removed = 0;
    unlink_or_oops_do(cl, NULL, &processed, &removed);
  }

  // Probing
  static oop lookup(Symbol* symbol);
  static oop lookup(jchar* chars, int length);

  // Interning
  static oop intern(Symbol* symbol, TRAPS);
  static oop intern(oop string, TRAPS);
  static oop intern(const char *utf8_string, TRAPS);

  // Rehash the symbol table if it gets out of balance
  static void rehash_table();
  static bool needs_rehashing() { return _needs_rehashing; }

};
#endif // SHARE_VM_CLASSFILE_SYMBOLTABLE_HPP
```

我将一些常见的方法保留了下来, 我们看到`StringTable`继承自`RehashableHashtable`. 数据的存储其实还是存储在`RehashableHashtable`中.

需要注意的是`StringTable`内部的`_the_table`实例及其创建过程

```cpp
static StringTable* _the_table;

 static void create_table() {
    assert(_the_table == NULL, "One string table allowed.");
    _the_table = new StringTable();
  }
```

`StringTable`最终是通过自身的一个静态属性持有.

`create_table()`是在`universe.cpp`文件的`universe_init()`进行调用的.

```cpp
// openjdk-jdk8u-jdk8u/hotspot/src/share/vm/memory/universe.cpp

jint universe_init() {
 // ... 忽略部分代码
  JavaClasses::compute_hard_coded_offsets();

  jint status = Universe::initialize_heap();
  if (status != JNI_OK) {
    return status;
  }

  Metaspace::global_initialize();

  // Create memory for metadata.  Must be after initializing heap for
  // DumpSharedSpaces.
  ClassLoaderData::init_null_class_loader_data();

// ... 忽略部分代码

  if (UseSharedSpaces) {
    // Read the data structures supporting the shared spaces (shared
    // system dictionary, symbol table, etc.).  After that, access to
    // the file (other than the mapped regions) is no longer needed, and
    // the file is closed. Closing the file does not affect the
    // currently mapped regions.
    MetaspaceShared::initialize_shared_spaces();
    StringTable::create_table();
  } else {
    SymbolTable::create_table();
    StringTable::create_table();
    ClassLoader::create_package_info_table();

    if (DumpSharedSpaces) {
      MetaspaceShared::prepare_for_dumping();
    }
  }

  return JNI_OK;
}
```

创建完`StringTable`之后, 就可以直接通过`StringTable`的静态方法对其进行操作了.
