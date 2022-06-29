---
category: Java
tag: jvm
date: 2018-01-12
title: 用NetBeans打开JDK
---

参考文章[hack-openjdk-netbeans-ide](https://dzone.com/articles/hack-openjdk-netbeans-ide)

1. 首先需要下载一个支持c/c++的NetBeans
2. 然后用NetBeans打开下载好的openjdk
3. 用NetBeans打开目录为`openjdk-jdk8u-jdk8u/common/nb_native`

在Mac上如果导入之后报错
```
xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance
configure: error: Xcode 4 is required to build JDK 8, the version found was . Use --with-xcode-path to specify the location of Xcode 4 or make Xcode 4 active by using xcode-select.
configure exiting with result code 1
```
那么需要安装个xcode 版本是4的