---
category: Java
tag: JavaSE
date: 2019-05-20
title: JDK 动态代理实现与原理
---

[JDK 动态代理实现与原理](https://zhuanlan.zhihu.com/p/60288881)

在使用JDK自带的动态代理的时候, 分为三部分:

* 目标接口和目标类
* Proxy代理工具类
* InvocationHandler 代理逻辑实现类

```java
public class ProxyTest {

	public static void main(String[] args) {

		// 调用Proxy代理工具类生成B的接口的代理类
		A a = (A) Proxy.newProxyInstance(
				B.class.getClassLoader(),
				B.class.getInterfaces(),
				new SimpleInvocationHandler(new B()));

		System.out.println(a.getClass());
		System.out.println(a.getClass().getSuperclass());

		a.printHelloWorld();
	}

	// 代理逻辑实现
	public static class SimpleInvocationHandler implements InvocationHandler {

		private A a;

		public SimpleInvocationHandler(A a) {
			this.a = a;
		}

		@Override
		public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
			System.out.println("Proxy Object : " + proxy.getClass());
			return method.invoke(a, args);
		}
	}

	// 目标接口
	interface A {
		void printHelloWorld();
	}

	// 目标类
	public static class B implements A {
		@Override
		public void printHelloWorld() {
			System.out.println("B said HelloWorld");
		}
	}
}
```

上面整个测试代码都很简单, 核心就在于Proxy.newProxyInstance()这个方法, 下面就是这个核心方法的源码时序图

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/jdk_proxy1.jpg)

上面就是整个Proxy.newProxyInstance()的运行过程. 很简单对不对.

那现在比较好奇的是代理类长什么样子呢? 我将生成的内部类导出来, 长下面这个样子

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.lang.reflect.UndeclaredThrowableException;
import test.ProxyTest.A;

final class $Proxy0 extends Proxy implements A {
    private static Method m1;
    private static Method m3;
    private static Method m2;
    private static Method m0;

    public $Proxy0(InvocationHandler var1) {
        super(var1);
    }

    static {
        try {
            m1 = Class.forName("java.lang.Object").getMethod("equals", Class.forName("java.lang.Object"));
            m3 = Class.forName("test.ProxyTest$A").getMethod("printHelloWorld");
            m2 = Class.forName("java.lang.Object").getMethod("toString");
            m0 = Class.forName("java.lang.Object").getMethod("hashCode");
        } catch (NoSuchMethodException var2) {
            throw new NoSuchMethodError(var2.getMessage());
        } catch (ClassNotFoundException var3) {
            throw new NoClassDefFoundError(var3.getMessage());
        }
    }

    public final boolean equals(Object var1) {
        try {
            return (Boolean)super.h.invoke(this, m1, new Object[]{var1});
        } catch (RuntimeException | Error var3) {
            throw var3;
        } catch (Throwable var4) {
            throw new UndeclaredThrowableException(var4);
        }
    }

    public final String toString() {
        try {
            return (String)super.h.invoke(this, m2, (Object[])null);
        } catch (RuntimeException | Error var2) {
            throw var2;
        } catch (Throwable var3) {
            throw new UndeclaredThrowableException(var3);
        }
    }

    public final int hashCode() {
        try {
            return (Integer)super.h.invoke(this, m0, (Object[])null);
        } catch (RuntimeException | Error var2) {
            throw var2;
        } catch (Throwable var3) {
            throw new UndeclaredThrowableException(var3);
        }
    }

    public final void printHelloWorld() {
        try {
            super.h.invoke(this, m3, (Object[])null);
        } catch (RuntimeException | Error var2) {
            throw var2;
        } catch (Throwable var3) {
            throw new UndeclaredThrowableException(var3);
        }
    }
}
```

通过代理类, 我们看到, 当代理类生成的时候, 是将目标类的所有接口方法都拿到, 然后将所有的方法都通过反射的方式, 拿到所有方法的引用, 最后将该方法传递给InvokeHandler进行调用.

生成代理类的过程我画了一个时序图

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/javase/jdk_proxy2.jpg)

真正的生成代理类逻辑是在ProxyMethod中. 通过调用generateMethod() 手写字节码的方式生成了字节码byte数组.


希望通过这篇短短地文章能够帮助大家了解JDK动态代理的实现机制
