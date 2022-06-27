---
category: JVM
date: 2015-11-24
title: Instrumentation
---
利用 `java.lang.instrument` 做动态 Instrumentation 是 Java SE 5 的新特性, 它把 Java 的 instrument 功能从本地代码中解放出来,使之可以用 Java 代码的方式解决问题.

使用 Instrumentation,开发者可以构建一个独立于应用程序的代理程序(Agent),用来监测和协助运行在 JVM 上的程序,甚至能够替换和修改某些类的定义.有了这样的功能,开发者就可以实现更为灵活的运行时虚拟机监控和 Java 类操作了,这样的特性实际上提供了一种虚拟机级别支持的 AOP 实现方式,使得开发者无需对 JDK 做任何升级和改动,就可以实现某些 AOP 的功能了.

在 Java SE 6 里面,instrumentation 包被赋予了更强大的功能：启动后的 instrument、本地代码(native code)instrument,以及动态改变 classpath 等等.这些改变,意味着 Java 具有了更强的动态控制、解释能力,它使得 Java 语言变得更加灵活多变.

在 Java SE6 里面,最大的改变使运行时的 Instrumentation 成为可能.在 Java SE 5 中,Instrument 要求在运行前利用命令行参数或者系统参数来设置代理类,在实际的运行之中,虚拟机在初始化之时(在绝大多数的 Java 类库被载入之前),instrumentation 的设置已经启动,并在虚拟机中设置了回调函数,检测特定类的加载情况,并完成实际工作.但是在实际的很多的情况下,我们没有办法在虚拟机启动之时就为其设定代理,这样实际上限制了 instrument 的应用.而 Java SE 6 的新特性改变了这种情况,通过 Java Tool API 中的 attach 方式,我们可以很方便地在运行过程中动态地设置加载代理类,以达到 instrumentation 的目的.

另外,对 native 的 Instrumentation 也是 Java SE 6 的一个崭新的功能,这使以前无法完成的功能 —— 对 native 接口的 instrumentation 可以在 Java SE 6 中,通过一个或者一系列的 prefix 添加而得以完成.
最后,Java SE 6 里的 Instrumentation 也增加了动态添加 class path 的功能.所有这些新的功能,都使得 instrument 包的功能更加丰富,从而使 Java 语言本身更加强大.

`java.lang.instrument`包的具体实现,依赖于 JVMTI. JVMTI(Java Virtual Machine Tool Interface)是一套由 Java 虚拟机提供的,为 JVM 相关的工具提供的本地编程接口集合. JVMTI 是从 Java SE 5 开始引入,整合和取代了以前使用的 Java Virtual Machine Profiler Interface (JVMPI) 和 the Java Virtual Machine Debug Interface (JVMDI),而在 Java SE 6 中,JVMPI 和 JVMDI 已经消失了.JVMTI 提供了一套”代理”程序机制,可以支持第三方工具程序以代理的方式连接和访问 JVM,并利用 JVMTI 提供的丰富的编程接口,完成很多跟 JVM 相关的功能.事实上,java.lang.instrument 包的实现,也就是基于这种机制的：在 Instrumentation 的实现当中,存在一个 JVMTI 的代理程序,通过调用 JVMTI 当中 Java 类相关的函数来完成 Java 类的动态操作.除开 Instrumentation 功能外,JVMTI 还在虚拟机内存管理,线程控制,方法和变量操作等等方面提供了大量有价值的函数.关于 JVMTI 的详细信息,请参考 Java SE 6 文档(请参见 参考资源)当中的介绍.
Instrumentation 的最大作用,就是类定义动态改变和操作.在 Java SE 5 及其后续版本当中,开发者可以在一个普通 Java 程序(带有 main 函数的 Java 类)运行时,通过 – javaagent参数指定一个特定的 jar 文件(包含 Instrumentation 代理)来启动 Instrumentation 的代理程序.

使用 Instrumentation,开发者可以构建一个独立于应用程序的代理程序(Agent),用来监测和协助运行在 JVM 上的程序,甚至能够替换和修改某些类的定义.

Instrumentation提供了这样的功能：
* 获取某个对象的大小
* 热加载class文件
* 获取JVM信息

> 要知道一个对象所使用的内存量,需要将所有实例变量使用的内存和对象本身的开销(一般是16字节)相加.这些开销包括一个指向对象的类的引用,垃圾收集信息和同步信息.另外一般内存的使用会被填充为8字节的倍数.


## Premain

premain函数是JavaSE5中实现instrument的方式.

使用premain我们要自定义MANIFEST.MF文件, 定义Premain-Class
```java
Manifest-Version: 1.0
Premain-Class: wang.yu66.instrument.core.Premain
```
然后我们在maven文件中输出该文件
```xml
<build>
    <plugins>
        <plugin>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-jar-plugin</artifactId>
            <configuration>
                <archive>
                    <manifestFile>
                        src/main/resources/META-INF/MANIFEST.MF
                    </manifestFile>
                    <manifest>
                        <addClasspath>true</addClasspath>
                        <classpathPrefix>lib/</classpathPrefix>
                        <mainClass>
                        </mainClass>
                    </manifest>
                </archive>
            </configuration>
        </plugin>
    </plugins>
</build>
```


#### 获取对象大小
首先我们要写一个代理文件出来(该文件放在`core-1.0-SNAPSHOT.jar`中)
```java
public class Premain {

	private static Instrumentation instrumentation;

	public static void premain(String agentArgs, Instrumentation inst) {
		instrumentation = inst;
	};

	public static Instrumentation getInstrumentation() {
		return instrumentation;
	}
}
```
然后在自己的应用程序中引用该文件(在`examples-1.0-SNAPSHOT.jar`中)
```java
public class PrintObjectSize {

	public static void main(String[] args) {
		System.out.println("Hello world, App");

		objectSize();
	}

	public static void objectSize() {
		Instrumentation inst = Premain.getInstrumentation();
		String str = "123456789";
		long size = inst.getObjectSize(str);
		System.out.println(str + " 对象大小: " + size);
	}
}
```
然后执行命令
```java
java -javaagent:../instrument/target/core-1.0-SNAPSHOT.jar -cp ./target/examples-1.0-SNAPSHOT.jar wang.yu66.instrument.examples.PrintObjectSize
```
然后就会获得对象的大小
```java
Hello world, App
123456789 对象大小: 24
```

#### 加载jar包
我们在Premain类中增加一个动态向系统cp加载jar的功能
```java
public static void appendJarToSystemClassLoader(String path) {
	JarFile jarFile = null;
	try {
		jarFile = new JarFile(path);
	} catch (IOException e) {
		e.printStackTrace();
	}
	instrumentation.appendToSystemClassLoaderSearch(jarFile);

}

public static void appendJarToBootstrapClassLoader(Instrumentation inst, String path) {
	JarFile jarFile = null;
	try {
		jarFile = new JarFile(path);
	} catch (IOException e) {
		e.printStackTrace();
	}
	inst.appendToBootstrapClassLoaderSearch(jarFile);

}
```
然后我们写一个测试类
```java
public class TestJarLoader {

	public static void main(String[] args) {
		for (int i = 0; i < 120; i++) {
			Premain.appendJarToSystemClassLoader(args[0]);
			Print.print();

			Stream.of(Premain.getInstrumentation().getAllLoadedClasses())
					.filter(clazz -> clazz.getName().contains("Print"))
					.forEach(aClass -> System.out.println(aClass.getName() + "  " + aClass.getMethods().length));

			try {
				TimeUnit.SECONDS.sleep(5);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}
}
```
然后执行命令
```java
java -javaagent:../instrument/target/core-1.0-SNAPSHOT.jar -cp ./target/examples-1.0-SNAPSHOT.jar wang.yu66.instrument.examples.TestJarLoader D:/workspace/idea/instrument/trunk/print/target/print-1.0-SNAPSHOT.jar
```
结果输出为
```java
Now Time is Thu Dec 31 10:50:39 CST 2015

wang.yu66.instrument.print.Print  11
java.io.PrintStream  44
Now Time is Thu Dec 31 10:50:44 CST 2015

wang.yu66.instrument.print.Print  11
java.io.PrintStream  44
```

#### 热加载
* `redefineClasses()`使用新的字节码全部替换原先存在的Class字节码. (它并不会触发初始化操作, 也不会抛出初始化时的异常. 因此一些静态属性并不会被重新赋值)
* `retransformClasses()` 修改原先存在的Class字节码.

> 对于已经在栈帧中的字节码, 他们会继续执行下去, 但是当方法再次调用的时候,则会使用刚刚加载完成的新的字节码. 在重新加载类的时候, 该类已经实例化出的对象同时也不会受到影响.

该方法的操作过程是一个基于操作集合的, 也就是说在redefine的时候, 可能有A B俩个类都进行, 而且A依赖于B, 那么在redefine的时候这俩个操作是同时完成的, 类似于原子操作.

redefine 操作可以改变修改如下字节码
* 方法体
* 常量池
* 属性
但是redefine过程不能产生如下影响
* 对方法进行增加,删除,重命名的操作
* 对属性进行增加,删除,重命名的操作
* 不能修改方法签名以及修改继承关系.

在redefine过程中,一旦抛出异常, 那么此过程执已经redefine成功的class也会被会滚成原来的.

想使用这个功能我们需要在MANIFEST.MF文件中增加这样一行`Can-Redefine-Classes: true`, 然后我们在Premain中增加一个load方法, 用于重新加载某个文件夹下所有的文件
```java
import org.apache.log4j.Logger;

import java.io.*;
import java.lang.instrument.ClassDefinition;
import java.lang.instrument.Instrumentation;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;

/**
 * 实现服务器局部代码热加载功能
 *      目前只支持方法体代码热更以及对属性值的改变
 *      但是不能修改类的继承结构, 不能修改方法签名, 不能增加删除方法以及属性成员
 *
 *  使用方法
 *      java -javaagent:D:\premain\target\agent-1.0-SNAPSHOT.jar -cp .;./* MainServerStart
 *      只需要将该项目打包出来然后参照上面的例子进行代理处理就好了, 然后正常启动游戏服就好
 *
 */
public class Premain {
    private static final Logger logger = Logger.getLogger(Premain.class);

    private static Instrumentation instrumentation;
    public static void premain(String agentArgs, Instrumentation inst) {
        instrumentation = inst;
    }

	private static int classSize = 0;

    /**
     * 遍历某个目录加载所有的class文件
     * @param directionPath
     */
    public static void loadFromDirection(String directionPath) {
        loadFromDirection(new File(directionPath), "");
    }

    private static void loadFromDirection(File dir, String parantName) {
        try {
            for (File file : dir.listFiles()) {
                if (file.isFile() && !file.getName().endsWith(".class")) {
                    continue;
                }
                if (file.isDirectory()) {
                    String fileName = file.getName();
                    if (parantName != null && !parantName.equals("")) {
                        fileName = parantName + "." + fileName;
                    }
                    loadFromDirection(file, fileName);
                    continue;
                }
                try(InputStream input = new FileInputStream(file);) {
                    String fileName = file.getPath();
                    String className = findClassName(fileName);
                    if (parantName != null && !parantName.equals("")) {
                        className = parantName + "." + className;
                    }
                    redefineClassesFromBytes(input, className, null);
                } catch (final Exception e) {
                    e.printStackTrace();
                }
            }
        } catch (final Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 从jar包或者ZIP里加载所有的class文件
     * @param jarPath
     */
    public static void loadFromZipFile(String jarPath, String prfixName) {
		Class[] allLoadClasses = instrumentation.getAllLoadedClasses();
		Map<String, Class> allLoadClassesMap = new HashMap<>(classSize);
		for (Class loadedClass : allLoadClasses) {
			if (loadedClass.getName().startsWith(prfixName)) {
				allLoadClassesMap.put(loadedClass.getName(), loadedClass);
			}
		}
		// 加载的类我们不会主动去卸载它, 因此, 我们记录下来上次更新时的类的数量, 下次就根据这个数量直接分配, 避免动态扩容
		classSize = allLoadClassesMap.size();

		try(InputStream in = new BufferedInputStream(new FileInputStream(new File(jarPath)));
            ZipInputStream zin = new ZipInputStream(in);) {
            ZipEntry ze;
            while ((ze = zin.getNextEntry()) != null) {
                if (ze.isDirectory()) {
                    // TODO 检查是否还有其他操作要做
                } else {
                    long size = ze.getSize();
                    if (size > 0) {
                        String fileName = ze.getName();
                        if (!fileName.endsWith(".class")) {
                            continue;
                        }
                        ZipFile zf = new ZipFile(jarPath);
                        InputStream input = zf.getInputStream(ze);
                        if (input == null) {
                            logger.error("Code Reload cant find file : " + fileName);
                            continue;
                        }
                        redefineClassesFromBytes(input, fileName, allLoadClassesMap);
                        input.close();
                        zf.close();
                    }
                }
            }
        } catch (final Exception e) {
            e.printStackTrace();
        }
    }

    private static String findClassName(String fileName) {
        int idx = fileName.lastIndexOf("\\");
        fileName = fileName.substring(idx + 1);
        fileName = fileName.split("\\.class")[0];
        return fileName;
    }

    /* 使用instrumentation将读取的class byte数组加载进虚拟机
     */
    private static void redefineClassesFromBytes(InputStream input, String fileName, Map<String, Class> allLoadClassesMap) {
        try {
        	String className = getClassName(fileName);
            logger.info("Start Hot Reload Class : " + fileName + "  (" + className + ")");
	        byte[] bytes = new byte[input.available()];
    	    input.read(bytes);
			Class loadedClass = allLoadClassesMap.get(className);
			if (loadedClass != null) {
				instrumentation.redefineClasses(new ClassDefinition(loadedClass, bytes));
			}
        } catch (final Exception e) {
            logger.error("Code Reload Failed : " + fileName, e);
        } catch (Error error) {
			logger.error("Code Reload Failed : " + fileName, error);
		}
    }

    private static String getClassName(String fileName) {
        fileName = fileName.split("\\.class")[0];
        fileName = fileName.replace("\\\\", ".");
        fileName = fileName.replace("/", ".");
        return fileName;
    }
```
然后我们写一个测试类
```java
import java.util.concurrent.TimeUnit;

public class TestReload {

	public static void main(String[] args) throws InterruptedException {
        fromDirection();
    }

    public static void fromJar() throws InterruptedException{
        for (int i = 0; i < 300; i++) {
            Premain.loadFromJarFile("D:\\ming\\test\\target\\test-1.0-SNAPSHOT.jar");
            TestReload.printTime();
            new TestReload().printNewTime();
            TimeUnit.SECONDS.sleep(5);
        }
    }

    public static void fromDirection() throws InterruptedException {
        for (int i = 0; i < 300; i++) {
            Premain.loadFromDirection("D:\\ming\\test\\target\\classes");
            TestReload.printTime();
            new TestReload().printNewTime();
            TimeUnit.SECONDS.sleep(5);
        }
    }

    public static void printTime() {
        System.out.println(2);
    }

    public void printNewTime() {
        System.out.println(2);
        System.out.println(id);
    }

    public int id = 2;
}
```
我们不断地修改printTime()和printNewTime()以及Id的值, 最后成功输出
```java
1
1
1
1
1
1
1
1
1
2
2
2
```

> 在上面的实现中我分别实现了从目录和jar包对class文件进行热加载

下面我们测试一下,如果增加了属性和方法成员, 看看有什么变化(下面只列出了TestReload.java的新增以及修改部分)
```java
public class TestReload {

	...

        public void printNewTime() {
        System.out.println(id);
        printName();
    }

    public int id = 2;

    public String name = "abc";

    public void printName() {
        System.out.println(name);
    }
}
```
当我们再次重新加载的时候就会抛出异常
```xml
D:\ming\test\target>java -javaagent:D:\premain\target\agent-1.0-SNAPSHOT.jar -cp .;./* TestReload
1
1
2
2
2
2
java.lang.UnsupportedOperationException: class redefinition failed: attempted to change the schema (add/remove fields)
	at sun.instrument.InstrumentationImpl.redefineClasses0(Native Method)
	at sun.instrument.InstrumentationImpl.redefineClasses(Unknown Source)
	at Premain.redefineClassesFromBytes(Premain.java:44)
	at Premain.loadFromDirection(Premain.java:24)
	at TestReload.fromDirection(TestReload.java:19)
	at TestReload.main(TestReload.java:6)
2
java.lang.UnsupportedOperationException: class redefinition failed: attempted to change the schema (add/remove fields)
	at sun.instrument.InstrumentationImpl.redefineClasses0(Native Method)
	at sun.instrument.InstrumentationImpl.redefineClasses(Unknown Source)
	at Premain.redefineClassesFromBytes(Premain.java:44)
	at Premain.loadFromDirection(Premain.java:24)
	at TestReload.fromDirection(TestReload.java:19)
	at TestReload.main(TestReload.java:6)
2
```

完整项目[JVM-reload](https://github.com/yu66/JVM-reload)

## Agentmain
在 Java SE 5 中premain 所作的 Instrumentation 也仅限与 main 函数执行前,这样的方式存在一定的局限性.Java SE 6 针对这种状况做出了改进,开发者可以在 main 函数开始执行以后,再启动自己的 Instrumentation 程序.在 Java SE 6 的 Instrumentation 当中,有一个跟 premain“并驾齐驱”的“agentmain”方法,可以在 main 函数开始运行之后再运行.

首先我们还是需要修改MANIFEST.MF文件, 在其中添加
```java
Manifest-Version: 1.0
Agent-Class: AgentMain
Can-Redefine-Classes: true

```

然后我们写一个代理类
```java
import javax.xml.transform.Transformer;
import java.lang.instrument.Instrumentation;
import java.lang.instrument.UnmodifiableClassException;

public class AgentMain {

    public static void agentmain(String agentArgs, Instrumentation inst)
            throws ClassNotFoundException, UnmodifiableClassException,
            InterruptedException {
        for (Class clazz : inst.getAllLoadedClasses()) {
            System.out.println("Loaded Class : " + clazz.getName());
        }
        Printer.printTime();
    }
}

class Printer {

    public static void printTime() {
        System.out.println("now is " + new Date());
    }
}
```
然后写一个启动类
```java
import com.sun.tools.attach.VirtualMachine;

import java.lang.management.ManagementFactory;
import java.util.concurrent.TimeUnit;

public class AgentLoader {

    public static void main(String[] args) throws Exception {
        String name = ManagementFactory.getRuntimeMXBean().getName();
        String pid = name.split("@")[0];
        System.out.println(pid);
        VirtualMachine vm = VirtualMachine.attach(pid);
        for (int i = 0; i < 100; i++) {
//            vm.loadAgent("D:\\ming\\test\\target\\test-1.0-SNAPSHOT.jar");
            vm.loadAgentPath("D:\\ming\\test\\target\\test-1.0-SNAPSHOT.jar");
            System.out.println("Load Agent Over!!!");
            TimeUnit.SECONDS.sleep(10);
        }
    }
}
```
打包后, 执行命令
```java
java -cp .;./* AgentLoader
```
