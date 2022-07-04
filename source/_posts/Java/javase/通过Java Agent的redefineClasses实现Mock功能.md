---
category: Java
tag: JavaSE
date: 2018-11-17
title: 通过Java Agent的redefineClasses实现Mock功能
---

[通过 Java Agent 的 redefineClasses 实现 Mock 功能](https://zhuanlan.zhihu.com/p/50187515)

### A)

最近组内项目有个模块进行了较大规模的重构, 需要跑一下压力测试, 看一下性能如何. 但是介于产品的模式, 在正常场景下需要向通道发送消息, 然而在压测中, 我们希望这段行为能被mock掉. 当时想到的方案可以采用Spring AOP, JMockit或者自己通过Javasisit/ASM这种字节码框架来实现功能.

由于项目中我自己很少使用Spring AOP来做一些功能, 便没让它当首选方案, 研究了一下JMockit实现, 发现是使用动态Agent实现的.ok, 那么便初步定了一下方案Agent+Javasisit来实现(ASM手写字节码实在太痛苦).

### B)

    这一段貌似是废话, 你们也看不见代码发生的真实地转变, 我只是记录一下心路历程.

利用了2个小时, 采用Agent+Javasisit实现了一个小的模块, 基本功能也都实现了, 但是使用起来实在是太麻烦了, 代码耦合性太高. 于是又换了个思路, 去掉了Javasisit框架, 也完美地实现了功能.

### C)

整个mock框架分为俩部分. agent-core, mock的核心代码 agent-client, 在这个工程中, 我们只需要在pom中引入需要替换的工程的依赖, 然后再agent-client中把要替换的类重写一遍就好了

## 核心部分

```
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   │   └── co
    │   │       └── wangming
    │   │           └── agent
    │   │               ├── Agent.java
    │   │               └── ClassesLoadUtil.java
    │   └── resources
    │       └── META-INF
    │           └── MANIFEST.MF
    └── test
        └── java
            └── Test.java
```

核心就是俩个Java文件和一个MF文件

```java
public class Agent {

    static ScheduledExecutorService scheduledExecutorService = new ScheduledThreadPoolExecutor(1);

    static List<String> hashCached = new ArrayList<>();

    public static void premain(String agentArgs, Instrumentation instrumentation) {

        System.out.println("Agnet 进入!!! " + agentArgs);
        scheduledExecutorService.scheduleAtFixedRate(() -> tryRedefine(instrumentation, agentArgs), 0, 10, TimeUnit.SECONDS);
    }

    private static void tryRedefine(Instrumentation instrumentation, String agentArgs) {

        Class[] allLoadedClasses = instrumentation.getAllLoadedClasses();
//      System.out.println("allLoadedClasses数量:" + allLoadedClasses.length);

        Map<String, Class> finupAllLoadedClasses = new HashMap<>();
        try {
            for (Class loadedClass : allLoadedClasses) {

                if (loadedClass == null) {
                    continue;
                }
                if (loadedClass.getCanonicalName() == null) {
                    continue;
                }
                if (!loadedClass.getCanonicalName().startsWith("com.finup")) {
                    continue;
                }
                if (hashCached.contains(loadedClass.getCanonicalName())) {
                    continue;
                }
                finupAllLoadedClasses.put(loadedClass.getCanonicalName(), loadedClass);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        Map<String, byte[]> rewriteClasses = ClassesLoadUtil.getRewriteClasses(agentArgs);
        for (String className : hashCached) {
            rewriteClasses.remove(className);
        }

        if (finupAllLoadedClasses.size() == 0 || rewriteClasses.size() == 0) {
            return;
        }

        System.out.println("finupAllLoadedClasses数量:" + finupAllLoadedClasses.size());

        for (String className : rewriteClasses.keySet()) {
            byte[] classBytes = rewriteClasses.get(className);

            if (classBytes == null || classBytes.length == 0) {
                System.out.println("从 rewriteClasses 找不到class: " + className);
                continue;
            }

            Class redefineClass = finupAllLoadedClasses.get(className);
            if (redefineClass == null) {
                System.out.println("从 finupAllLoadedClasses 找不到class: " + className);
                continue;
            }

            System.out.println("开始redefineClasses: " + className);

            ClassDefinition classDefinition = new ClassDefinition(redefineClass, classBytes);

            try {
                instrumentation.redefineClasses(classDefinition);
                hashCached.add(className);

                System.out.println("结束redefineClasses: " + className);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (UnmodifiableClassException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

    }
}
public class ClassesLoadUtil {

    private static final Map<String, byte[]> path2Classes = new ConcurrentHashMap<>();
    private static final Map<String, byte[]> className2Classes = new ConcurrentHashMap<>();

    private static boolean havaLoaded = false;

    private static void loadFromZipFile(String jarPath) {
        try {
            ZipFile zipFile = new ZipFile(jarPath);
            Enumeration<? extends ZipEntry> entrys = zipFile.entries();
            while (entrys.hasMoreElements()) {
                ZipEntry zipEntry = entrys.nextElement();
                entryRead(jarPath, zipEntry);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    private static boolean entryRead(String jarPath, ZipEntry ze) throws IOException {
        if (ze.getSize() > 0) {
            String fileName = ze.getName();
            if (!fileName.endsWith(".class")) {
                return true;
            }
            if (!fileName.contains("finup")) {
                return true;
            }

            try (ZipFile zf = new ZipFile(jarPath); InputStream input = zf.getInputStream(ze);
                 ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {
                if (input == null) {
//                              logger.error("Code Reload cant find file : " + fileName);
                    return true;
                }
                int b = 0;
                while ((b = input.read()) != -1) {
                    byteArrayOutputStream.write(b);
                }
                byte[] bytes = byteArrayOutputStream.toByteArray();

                path2Classes.put(fileName, bytes);

                String name1 = fileName.replaceAll("\\.class", "");
                String name2 = name1.replaceAll("/", ".");

                className2Classes.put(name2, bytes);

                System.out.println("加载文件: fileName : " + fileName + ".  className:" + name2);
            }
        } else {
//          System.out.println(ze.getName() + " size is 0");
        }
        return false;
    }


    public static Map<String, byte[]> getRewriteClasses(String agentArgs) {
        synchronized (className2Classes) {
            if (!havaLoaded) {
                loadFromZipFile(agentArgs);
                havaLoaded = true;
            }
        }

        return className2Classes;
    }
}
```

MF

```
Manifest-Version: 1.0
Premain-Class: co.wangming.agent.Agent
Can-Redefine-Classes: true
Can-Retransform-Classes: true
```

基本上这三个文件就可以完成功能了.

## agent-client

```
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   │   └── co
    │   │       └── wangming
    │   │           └── agent_client
    │   │               └── service
    │   │                   └── TestService
    │   └── resources
    │       └── META-INF
    │           └── MANIFEST.MF
    └── test
        └── java
Manifest-Version: 1.0
Premain-Class: co.wangming.agent.Agent
Can-Redefine-Classes: true
Can-Retransform-Classes: true
```

我们只需要把需要覆盖的TestService类在这里重写一下就好了, 但是注意, 不能删除/增加 方法/字段, 不能修改继承结构. 总而言之就是不能修改类的结构, 但是只是修改方法实现应该也能满足大多数需求了.

 >   以后有时间再想想怎么用Spring AOP来实现
