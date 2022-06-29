---
category: Java
tag: JavaSE
date: 2016-08-26
title: Java ClassPath 的秘密
---

### 各种path获取到的路径的区别

* Main.class.getResource(""); 得到的是当前class所在的路径
* Main.class.getResourceAsStream(""); 是从当前路径查找资源资源
* Main.class.getClassLoader.getResource("");得到的是当前类classloader加载类的起始位置
* Main.class.getClassLoader.getResourceAsStream("");从classpath的起始位置查找资源

但是`Main.class.getResource("/");` 表示从classpath目录下找, 也就是说 `Main.class.getResource("/");` 等价于 `Main.class.getClassLoader.getResource("");`, 然而 `Main.class.getClassLoader.getResourceAsStream("/");` 返回的是null

写了一段简单的测试代码

```java
import com.alibaba.fastjson.JSONObject;
import java.util.concurrent.TimeUnit;
public class Test {
	public static void main(String[] args) throws InterruptedException {
		JSONObject json = new JSONObject();
		TimeUnit.HOURS.sleep(1);
	}
}
```
然后分别执行
```bash
[root@root wangming]# javac -cp ./* Test.java
javac: invalid flag: ./Test.class
Usage: javac <options> <source files>
use -help for a list of possible options
[root@root wangming]# javac -cp . Test.java
Test.java:2: error: package com.alibaba.fastjson does not exist
import com.alibaba.fastjson.JSONObject;
                           ^
Test.java:9: error: cannot find symbol
                JSONObject json = new JSONObject();
                ^
  symbol:   class JSONObject
  location: class Test
Test.java:9: error: cannot find symbol
                JSONObject json = new JSONObject();
                                      ^
  symbol:   class JSONObject
  location: class Test
3 errors
[root@root wangming]# javac -cp .:./ Test.java
Test.java:2: error: package com.alibaba.fastjson does not exist
import com.alibaba.fastjson.JSONObject;
                           ^
Test.java:9: error: cannot find symbol
                JSONObject json = new JSONObject();
                ^
  symbol:   class JSONObject
  location: class Test
Test.java:9: error: cannot find symbol
                JSONObject json = new JSONObject();
                                      ^
  symbol:   class JSONObject
  location: class Test
3 errors
[root@root wangming]# javac -cp .:./* Test.java 
```

在[Setting the class path](http://docs.oracle.com/javase/7/docs/technotes/tools/solaris/classpath.html)这篇文章中, 说classpath 可以是以下三种形式
* jar包(.jar结尾的文件) 里面包含了class文件
* zip包(.zip结尾的文件) 里面包含了class文件
* 目录(文件夹) 如果class文件里有package, 那么目录里一定要有和package相应的目录结构

如果一个classpath中包含了通配符(`*`), 那么Java就不会在这个目录下搜索class文件了. 

例如`lib/*`, 如果classpath是这个, 那么classpath就只会在`lib`目录下搜索jar文件, 然后从jar文件中去加载class, 如果想要在lib目录下既搜索jar文件也搜索class文件的话, 那么可以写成`lib:lib/*`或者`lib/*:lib`.

还有一点很重要的是, 如果`lib`目录下有子目录的话`lib/jetty`的话, Java是不会进行递归搜索子目录的。

说到这里, Java为什么不会在`lib/*`下搜索class文件呢？是这样的, 如果`lib`目录下有`a.jar`和`b.jar`, 其实现在的`lib/*`就被替换成了`lib/a.jar:lib/b.jar`. 我们可以在Java的系统变量里看到这个结果.

看到这,我们应该就推断出上面错误的原因了, `.`只会搜索`class`文件但是不会搜索jar, 而`*`通配符则自动帮我换成了jar文件的classpath的替换.

> 安装上JDK后, 系统会自动设置一个CLASSPATH的环境变量(.:/home/jdk1.8/lib/dt.jar:/home/jdk1.8/lib/tools.jar), 但是当运行Java命令, 指定`-cp`的时候,会覆盖掉这个classpath, 所以在新的classpath上一定要指定`.`

classpath适用于下列工具
[JDK Tools and Utilities](http://docs.oracle.com/javase/7/docs/technotes/tools/index.html)

[How Classes are Found](http://docs.oracle.com/javase/7/docs/technotes/tools/findingclasses.html)


### Servlet 资源路径

`ServletContext.getRealPath("/")` 返回的是 war 包展开后的从系统根目录到war展开地址的根路径，比如windows 就是 `file:///d/path/to/war/`, 也就是上面做了两个动作， 先从 war 根目录找到资源， 然后返回资源完整路径.
同样的 `ServletContext.getResource("/")` 返回的的是从war 根目录查找到的资源，只不过返回的是 `URL ServletContext.getResourceAsStream("/")` 返回的是和上面一样的 InputStream, 但是 `ServletContext.getResource("")` 返回的是相对于URL的路径，相当于从当前URL根路径查找资源 `ServletContext.getResourceAsStream("")` 和上面一样，只不过返回`InputStream`

### maven工程下springmvc资源路径配置

Java 源代码文件资源在Maven工程中的默认路径是: `src/main/java`，这个路径就是放置你的Java源代码文件。默认的路径是无需在Maven的pom.xml配置文件中指定的
资源文件的缺省路径为`src/main/resources`，这样Maven在打包成war文件的时候，会将`src/main/resources`的资源文件复制到class目录。
因此对于Spring mvc项目，servlet的配置文件`springmvc-context.xml`缺省会放置在 `src/main/resources/springmvc-context.xml`。
对应的的web.xml指定的`<param-value>classpath:springmvc-context.xml</param-value>` 中，servlet的配置文件`springmvc-context.xml` 需要从 class目录下查找。