---
category: Java
tag: jvm
date: 2022-07-14
title: JNI 返回 Java对象
---

Java代码
```java
package jnijava;

public class JniJava {
    public static void main(String[] args) {
        
        System.load("/Users/wangming/NetBeansProjects/jnicpp/dist/Debug/GNU-MacOSX/libjnicpp.dylib");
        System.out.println("JniJava");
        
        Obj obj = print();
        System.out.println(obj.str);
        System.out.println(obj.i);
    }
    
    public static native Obj print();
}

class Obj {
    public String str;
    public int i;
}
```

jni代码, 这是c语言的写法。如果要换成c++的需要将`(*env)->FindClass(env, "jnijava/Obj");`转换成`env->FindClass("jnijava/Obj")`

```cpp
#include "JniJava.h"

jobject JNICALL Java_jnijava_JniJava_print
  (JNIEnv *env, jclass object) {
    
    // 找到目标类
    jclass objClass = (*env)->FindClass(env, "jnijava/Obj");

    // 调用类的实例化方法，然后实例化
    jmethodID initMethod = (*env)->GetMethodID(env, objClass, "<init>", "()V");
    jobject obj = (*env)->NewObject(env, objClass, initMethod);
        
    // 找到要赋值的属性
    jfieldID str = (*env)->GetFieldID(env, objClass, "str", "Ljava/lang/String;");
    jfieldID i = (*env)->GetFieldID(env, objClass, "i", "I");

    // 对属性进行赋值
    (*env)->SetObjectField(env, obj, str, (*env)->NewStringUTF(env, "jnicpp"));
    (*env)->SetIntField(env, obj, i, 9999);

    return obj;
}
```

这就直接在jni里返回了一个Java对象，那么这个Java对象是如何与GC关联起来的呢？关键就在于`(*env)->NewObject(env, objClass, initMethod);`

在jdk17中`jdk-jdk-17-35/src/hotspot/share/prims/jni.cpp` 该方法时如下定义的
```cpp
JNI_ENTRY(jobject, jni_NewObject(JNIEnv *env, jclass clazz, jmethodID methodID, ...))
  HOTSPOT_JNI_NEWOBJECT_ENTRY(env, clazz, (uintptr_t) methodID);

  jobject obj = NULL;
  DT_RETURN_MARK(NewObject, jobject, (const jobject&)obj);

  instanceOop i = InstanceKlass::allocate_instance(JNIHandles::resolve_non_null(clazz), CHECK_NULL);
  obj = JNIHandles::make_local(THREAD, i);
  va_list args;
  va_start(args, methodID);
  JavaValue jvalue(T_VOID);
  JNI_ArgumentPusherVaArg ap(methodID, args);
  jni_invoke_nonstatic(env, &jvalue, obj, JNI_NONVIRTUAL, methodID, &ap, CHECK_NULL);
  va_end(args);
  return obj;
JNI_END
```

这里分配一个对象出来 `InstanceKlass::allocate_instance(JNIHandles::resolve_non_null(clazz), CHECK_NULL);`

`jdk-jdk-17-35/src/hotspot/share/oops/instanceKlass.inline.hpp`
```cpp
inline instanceOop InstanceKlass::allocate_instance(oop java_class, TRAPS) {
  Klass* k = java_lang_Class::as_Klass(java_class);
  if (k == NULL) {
    ResourceMark rm(THREAD);
    THROW_(vmSymbols::java_lang_InstantiationException(), NULL);
  }
  InstanceKlass* ik = cast(k);
  ik->check_valid_for_instantiation(false, CHECK_NULL);
  ik->initialize(CHECK_NULL);
  return ik->allocate_instance(THREAD);
}
```

最后一步直接调用`InstanceKlass`的`allocate_instance(THREAD)`方法

```cpp
instanceOop InstanceKlass::allocate_instance(TRAPS) {
  bool has_finalizer_flag = has_finalizer(); // Query before possible GC
  int size = size_helper();  // Query before forming handle.

  instanceOop i;

  i = (instanceOop)Universe::heap()->obj_allocate(this, size, CHECK_NULL);
  if (has_finalizer_flag && !RegisterFinalizersAtInit) {
    i = register_finalizer(i, CHECK_NULL);
  }
  return i;
}
```

最终也就是调用`jdk-jdk-17-35/src/hotspot/share/gc/shared/collectedHeap.inline.hpp`的
```cpp
inline oop CollectedHeap::obj_allocate(Klass* klass, int size, TRAPS) {
  ObjAllocator allocator(klass, size, THREAD);
  return allocator.allocate();
}
```

继续往里面看`jdk-jdk-17-35/src/hotspot/share/gc/shared/memAllocator.cpp`

```cpp
oop MemAllocator::allocate() const {
  oop obj = NULL;
  {
    Allocation allocation(*this, &obj);
    HeapWord* mem = mem_allocate(allocation);
    if (mem != NULL) {
      obj = initialize(mem);
    } else {
      // The unhandled oop detector will poison local variable obj,
      // so reset it to NULL if mem is NULL.
      obj = NULL;
    }
  }
  return obj;
}
```

继续看`mem_allocate(allocation);`
```cpp
HeapWord* MemAllocator::mem_allocate(Allocation& allocation) const {
  if (UseTLAB) {
    HeapWord* result = allocate_inside_tlab(allocation);
    if (result != NULL) {
      return result;
    }
  }

  return allocate_outside_tlab(allocation);
}
```

这里是判断一下，是否在TLAB上面分配，我们关心的是heap的GC，直接看`allocate_outside_tlab(allocation);`

```cpp
HeapWord* MemAllocator::allocate_outside_tlab(Allocation& allocation) const {
  allocation._allocated_outside_tlab = true;
  HeapWord* mem = Universe::heap()->mem_allocate(_word_size, &allocation._overhead_limit_exceeded);
  if (mem == NULL) {
    return mem;
  }

  NOT_PRODUCT(Universe::heap()->check_for_non_bad_heap_word_value(mem, _word_size));
  size_t size_in_bytes = _word_size * HeapWordSize;
  _thread->incr_allocated_bytes(size_in_bytes);

  return mem;
}
```

`heap()->mem_allocate(_word_size, &allocation._overhead_limit_exceeded)` 这一个就是个多态方法了，取决于 `heap()` 方法返回的是`CollectedHeap`何种子类了

* `ParallelScavengeHeap` : `jdk-jdk-17-35/src/hotspot/share/gc/parallel/parallelScavengeHeap.hpp`
* `GenCollectedHeap` : `jdk-jdk-17-35/src/hotspot/share/gc/shared/genCollectedHeap.hpp`
* `EpsilonHeap` : `jdk-jdk-17-35/src/hotspot/share/gc/epsilon/epsilonHeap.hpp`
* `G1CollectedHeap` : `jdk-jdk-17-35/src/hotspot/share/gc/g1/g1CollectedHeap.hpp`
* `ShenandoahHeap` : `jdk-jdk-17-35/src/hotspot/share/gc/shenandoah/shenandoahHeap.hpp`
* `ZCollectedHeap` : `jdk-jdk-17-35/src/hotspot/share/gc/z/zCollectedHeap.hpp`

我们看一下`GenCollectedHeap` (分成年轻代和老年代俩种区域的分层回收heap)

```cpp
HeapWord* GenCollectedHeap::mem_allocate(size_t size,
                                         bool* gc_overhead_limit_was_exceeded) {
  return mem_allocate_work(size,
                           false /* is_tlab */,
                           gc_overhead_limit_was_exceeded);
}
```

下面就直接调用GC算法分配
```cpp
HeapWord* GenCollectedHeap::mem_allocate_work(size_t size,
                                              bool is_tlab,
                                              bool* gc_overhead_limit_was_exceeded) {
  // In general gc_overhead_limit_was_exceeded should be false so
  // set it so here and reset it to true only if the gc time
  // limit is being exceeded as checked below.
  *gc_overhead_limit_was_exceeded = false;

  HeapWord* result = NULL;

  // Loop until the allocation is satisfied, or unsatisfied after GC.
  for (uint try_count = 1, gclocker_stalled_count = 0; /* return or throw */; try_count += 1) {

    // First allocation attempt is lock-free.
    Generation *young = _young_gen;
    assert(young->supports_inline_contig_alloc(),
      "Otherwise, must do alloc within heap lock");
    if (young->should_allocate(size, is_tlab)) {
      result = young->par_allocate(size, is_tlab);
      if (result != NULL) {
        assert(is_in_reserved(result), "result not in heap");
        return result;
      }
    }
    uint gc_count_before;  // Read inside the Heap_lock locked region.
    {
      MutexLocker ml(Heap_lock);
      log_trace(gc, alloc)("GenCollectedHeap::mem_allocate_work: attempting locked slow path allocation");
      // Note that only large objects get a shot at being
      // allocated in later generations.
      bool first_only = !should_try_older_generation_allocation(size);

      result = attempt_allocation(size, is_tlab, first_only);
      if (result != NULL) {
        assert(is_in_reserved(result), "result not in heap");
        return result;
      }

      if (GCLocker::is_active_and_needs_gc()) {
        if (is_tlab) {
          return NULL;  // Caller will retry allocating individual object.
        }
        if (!is_maximal_no_gc()) {
          // Try and expand heap to satisfy request.
          result = expand_heap_and_allocate(size, is_tlab);
          // Result could be null if we are out of space.
          if (result != NULL) {
            return result;
          }
        }

        if (gclocker_stalled_count > GCLockerRetryAllocationCount) {
          return NULL; // We didn't get to do a GC and we didn't get any memory.
        }

        // If this thread is not in a jni critical section, we stall
        // the requestor until the critical section has cleared and
        // GC allowed. When the critical section clears, a GC is
        // initiated by the last thread exiting the critical section; so
        // we retry the allocation sequence from the beginning of the loop,
        // rather than causing more, now probably unnecessary, GC attempts.
        JavaThread* jthr = JavaThread::current();
        if (!jthr->in_critical()) {
          MutexUnlocker mul(Heap_lock);
          // Wait for JNI critical section to be exited
          GCLocker::stall_until_clear();
          gclocker_stalled_count += 1;
          continue;
        } else {
          if (CheckJNICalls) {
            fatal("Possible deadlock due to allocating while"
                  " in jni critical section");
          }
          return NULL;
        }
      }

      // Read the gc count while the heap lock is held.
      gc_count_before = total_collections();
    }

    VM_GenCollectForAllocation op(size, is_tlab, gc_count_before);
    VMThread::execute(&op);
    if (op.prologue_succeeded()) {
      result = op.result();
      if (op.gc_locked()) {
         assert(result == NULL, "must be NULL if gc_locked() is true");
         continue;  // Retry and/or stall as necessary.
      }

      // Allocation has failed and a collection
      // has been done.  If the gc time limit was exceeded the
      // this time, return NULL so that an out-of-memory
      // will be thrown.  Clear gc_overhead_limit_exceeded
      // so that the overhead exceeded does not persist.

      const bool limit_exceeded = size_policy()->gc_overhead_limit_exceeded();
      const bool softrefs_clear = soft_ref_policy()->all_soft_refs_clear();

      if (limit_exceeded && softrefs_clear) {
        *gc_overhead_limit_was_exceeded = true;
        size_policy()->set_gc_overhead_limit_exceeded(false);
        if (op.result() != NULL) {
          CollectedHeap::fill_with_object(op.result(), size);
        }
        return NULL;
      }
      assert(result == NULL || is_in_reserved(result),
             "result not in heap");
      return result;
    }

    // Give a warning if we seem to be looping forever.
    if ((QueuedAllocationWarningCount > 0) &&
        (try_count % QueuedAllocationWarningCount == 0)) {
          log_warning(gc, ergo)("GenCollectedHeap::mem_allocate_work retries %d times,"
                                " size=" SIZE_FORMAT " %s", try_count, size, is_tlab ? "(TLAB)" : "");
    }
  }
}
```