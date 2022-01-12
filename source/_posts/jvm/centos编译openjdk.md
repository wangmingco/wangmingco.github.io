---
category: JVM
date: 2022-01-10
title: Centos7 编译调试 OpenJDK11
---

## 编译

按照如下过程进行编译(测试机是一台2核4G内存的云虚拟机，编译过程较慢且偶尔会失败，最好是使用一个多核机器进行编译)

> 本次构建是JDK11当前最新版[jdk11u-jdk-11.0.14-8](https://github.com/openjdk/jdk11u/archive/refs/tags/jdk-11.0.14+8.zip), 构建过程出现问题，参考构建教程 `jdk11u-jdk-11.0.14-8/doc/building.html`.

```shell
# 查看系统版本
cat /proc/version
rpm -q centos-release

# 安装依赖环境
## 安装 FreeType
yum install -y freetype-devel 

## 安装 CUPS
yum install -y cups-devel 

## 安装 ALSA
yum install -y alsa-lib-devel

## 安装 libffi
yum install -y libffi-devel

## 安装 Autoconf
yum install -y autoconf

## 安装 X11
yum install -y libxext-dev libx11-dev libXtst-devel libXt-devel libXrender-devel libXi-devel libXrandr-devel

## 安装 fontconfig
yum install -y fontconfig

# 安装Boot-JDK, 编译openjdk-11，需要以jdk-11为bootjdk
yum install -y java-11-openjdk-devel

# 安装开发工具
yum groupinstall -y "Development Tools"

# 开始编译
# sh ./configure --enable-debug
sh ./configure --with-debug-level=slowdebug --with-native-debug-symbols=external

# make all
make images
```

> 本次编译使用centos7自带的gcc4.8版本，如果使用高版本，大于文档说的7.4版本，可能会出现编译错误, 那么在运行`./configure`时打开`--disable-warnings-as-errors` 配置,即可

> jdk11u-jdk-11.0.14-8 版本JDK默认是ascii编码，如果想要使用UTF8编码的话，修改 `jdk11u-jdk-11.0.14-8/make/common/SetupJavaCompilers.gmk` 文件，将`-encoding ascii` 修改成 `-encoding utf-8`

整个安装编译环境以及编译过程如下:

[@asciinema](/videos/centos7_compile_openjdk11.cast)

或者打开    [Centos7 编译调试 OpenJDK11](/html/centos7_compile_debug_openjdk11.html)

升级GCC11(下面的方式只针对当前session有效)
```
sudo yum install centos-release-scl
sudo yum install devtoolset-11-gcc*
scl enable devtoolset-11 bash
```

## debug

在vscode中进行远程debug

