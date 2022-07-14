---
category: 编程语言
tag: c/cpp
date: 2022-07-10
title: NetBeans Debug Cpp
---

## 安装插件

NetBeans 自带的 C/Cpp 插件叫做 CPPLite Kit，需要安装ccls。这个我不熟悉，改用以前的插件

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/NetBeans/cpp_env_1.png)

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/NetBeans/cpp_env_2.png)

> 安装这个插件目前需要jdk8(主要是使用upack2000那个工具)

> 在Mac上NetBeans是使用gdb调试的，但是Mac上使用gdb需要对gdb签名。网络上一堆签名教程，但是对于10.14之后的系统，需要如下签名
> 创建文件 gdb-entitlement.xml
> 
> ```xml
> <?xml version="1.0" encoding="UTF-8"?>
> <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
> <plist version="1.0">
> <dict>
>     <key>com.apple.security.cs.debugger</key>
>     <true/>
> </dict>
> </plist>
> </pre>
> ```
> 
> 然后调用`codesign --entitlements gdb-entitlement.xml -fs gdb-cert $(which gdb)`
> 
> 参考[解决GDB在Mac下不能调试的问题 - ikingye的回答](https://segmentfault.com/q/1010000004136334/a-1020000019448851)
> 


接下来就可以重新打开基于Makefile文件的Cpp工程了。

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/NetBeans/cpp_imort_1.png)

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/NetBeans/cpp_imort_2.png)

## Debug JNI

使用NetBeans进行jni Debug



## Debug JVM
