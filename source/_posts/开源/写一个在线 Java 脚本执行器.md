---
category: 开源
date: 2020-04-15
title: 写一个在线 Java 脚本执行器
---

> [写一个在线 Java 脚本执行器](https://zhuanlan.zhihu.com/p/130425196)

在生产环境中，有时候我们想要快速执行一段代码，但是又不得不经历上线的痛苦（分情况哈，有时候这种痛苦是必须的）或者在某些场景中，不能重启避免破坏现场，那么有个在线脚本执行器就最好不过了。于是在工作之余，便写了这么一个 jrc 小工具 （当然市场上可能会有更好的选择，比如阿里巴巴的arthas，大家如果有更习惯的工具，也可以不参考我这个哈）

这个工具主要就是利用了java自带的javac包里的相关api实现的。先放一段效果图

{% dplayer 'url=https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/videos/java_srcipt.mp4' "api=https://api.prprpr.me/dplayer/" "theme=#FADFA3" "autoplay=false" %} 

写一个在线Java脚本执行器

编译代码
```java
public JrcResult compile(String javaCode) throws Exception {

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();

        JrcJavaFileManager fileManager = JavaFileManagerFactory.getJavaFileManager(compiler.getStandardFileManager(diagnostics, null, null));

        ClassInfo classInfo = getClassFileFromJavaSource(javaCode);
        List<JavaFileObject> javaFileObjects = new ArrayList<>();
        javaFileObjects.add(new StringJavaFileObject(classInfo.className, javaCode));

        //使用编译选项可以改变默认编译行为。编译选项是一个元素为String类型的Iterable集合
        List<String> options = new ArrayList<>();
        options.add("-encoding");
        options.add("UTF-8");
        options.add("-classpath");
        options.add(classpath);

        StringWriter outWriter = new StringWriter();
        JavaCompiler.CompilationTask task = compiler.getTask(outWriter, fileManager, diagnostics, options, null, javaFileObjects);
        // 编译源程序
        boolean success = task.call();
    }
```

整段代码还是比较简单的

1. 获取系统Java编译器
2. 获取源码的类信息，比如名称，方法等等
3. 将源码存储进`StringJavaFileObject`
4. 设置cp等进行编译

大体的流程就是这几步就完成了。

整个过程中的难点是如果我们的工程是基于springboot的话，那么需要遍历springboot里面的文件夹和文件，针对springboot的处理可以参考 SpringBoot Loader 浅析

下面主要是说一下 对JavaFileManager的处理。在SpringBootLauncher里只是实现了对springboot fat jar的处理，但是具体和JavaCompiler 的融合还是在 SpringBootJavaFileManager 这个里处理的

```java
public class SpringBootJavaFileManager extends JrcJavaFileManager {

    private static final Logger logger = LoggerFactory.getLogger(SpringBootJavaFileManager.class);

    SpringBootLauncher springBootLauncher;

    public SpringBootJavaFileManager(StandardJavaFileManager standardManager) {
        super(standardManager);

        try {
            springBootLauncher = new SpringBootLauncher();
            springBootLauncher.launch();
        } catch (Exception e) {
            logger.error("", e);
        }
    }

    @Override
    public ClassLoader getClassLoader(Location location) {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();

        ClassLoaderUtil.setClassLoader(new JrcLaunchedURLClassLoader(cl));
        return cl;
    }

    @Override
    public Iterable<JavaFileObject> list(Location location, String packageName, Set set, boolean recurse) throws IOException {

        String packagePath = packageName.replaceAll("\\.", "/");
        List<SpringBootArchiveEntry> entries = springBootLauncher.getEntries(packagePath);

        List<JavaFileObject> list = entries.stream().map(it -> new JarJavaFileObject(it, JavaFileObject.Kind.CLASS)).collect(Collectors.toList());

        Iterable<JavaFileObject> superList = super.list(location, packageName, set, recurse);
        if (superList == null) {
            return list;
        }

        for (JavaFileObject o : superList) {
            list.add(o);
        }

        return list;
    }

    /**
     * 将 JavaFileObject 转换成className
     *
     * @param location PLATFORM_CLASS_PATH
     * @param file     /Library/Java/JavaVirtualMachines/jdk1.8.0_144.jdk/Contents/Home/lib/ct.sym(META-INF/sym/rt.jar/java/lang/Comparable.class)
     * @return java.lang.Comparable
     */
    @Override
    public String inferBinaryName(Location location, JavaFileObject file) {
        if (file instanceof JarJavaFileObject) {
            return file.getName();
        } else {
            return super.inferBinaryName(location, file);
        }
    }

}
```

1. 在构造`SpringBootJavaFileManager`实例的时候，开启SpringBoot fat jar的扫描。
2. 重写 `getClassLoader()` 获取springboot loader里的 `LaunchedURLClassLoader` ，并将它设置成全局的classloader，主要是后面在执行方法时使用该classloader加载类
3. 重写`list()` 方法，利用`SpringBootLauncher` 找到springboot fat jar里面的文件和文件夹
4. 重写`inferBinaryName()` 方法，这是因为在list()方法中返回的是自定义的`JarJavaFileObject`，而`super.inferBinaryName()` 里有个校验，file 必须是 `BaseFileObject`,因此这里有个判断，如果是`JarJavaFileObject类型`，直接获取名字返回

还有一点是对于classloader的处理，因为在执行方法的时候需要将编译的class字节码加载进jvm里，所以自定义了一个classloader
```java
public class JrcLaunchedURLClassLoader implements JrcClassLoader {

    private static final Logger logger = LoggerFactory.getLogger(JrcLaunchedURLClassLoader.class);

    private ClassLoader launchedURLClassLoader;

    public JrcLaunchedURLClassLoader(ClassLoader launchedURLClassLoader) {
        this.launchedURLClassLoader = launchedURLClassLoader;
    }

    public Class defineClass(String name, byte[] b) {
        try {
            return launchedURLClassLoader.loadClass(name);
        } catch (ClassNotFoundException e) {
        }
        try {
            Method defineClassMethod = ClassLoader.class.getDeclaredMethod("defineClass", new Class[]{String.class, byte[].class, int.class, int.class});
            boolean isAccessible = defineClassMethod.isAccessible();
            if (!isAccessible) {
                defineClassMethod.setAccessible(true);
            }

            Object result = defineClassMethod.invoke(launchedURLClassLoader, name, b, 0, b.length);
            defineClassMethod.setAccessible(isAccessible);

            return (Class) result;
        } catch (NoSuchMethodException e) {
            logger.error("defineClass name:{}", name, e);
            return null;
        } catch (IllegalAccessException e) {
            logger.error("defineClass name:{}", name, e);
            return null;
        } catch (InvocationTargetException e) {
            logger.error("defineClass name:{}", name, e);
            return null;
        }
    }
}
```

大体的思路就是这样，具体的细节可以参考 jrc

PS: 当然大家也可以选择不上传java代码，直接将本地编译好的class字节码上传就可以了，这里也就是给大家提供一个思路。

另外更加产品化的东西可以考虑接入maven api实现依赖包的搜索下载，目前只能提供手动jar包上传方式。 -------》 这个已经实现了

