---
category: JVM
date: 2022-01-10
title: Centos 编译 OpenJDK
---

按照如下过程进行编译
```
echo "进入 openjdk-jdk-11-28版本JDK，如果没有请下载:"

cd openjdk-jdk-11-28

echo "查看系统版本"
cat /proc/version
rpm -q centos-release

echo ""
echo "安装依赖环境"
yum install -y freetype-devel cups-devel libXtst-devel libXt-devel libXrender-devel libXi-devel alsa-lib-devel libffi-devel autoconf fontconfig-devel


echo ""
echo "安装Boot-JDK, 编译openjdk-11，需要以jdk-11为bootjdk"
yum install -y java-11-openjdk-devel

echo ""
echo "安装开发工具"
yum groupinstall -y "Development Tools"

echo ""
echo "开始编译"
sh ./configure
make
```

整个安装编译环境以及编译过程如下:
[@asciinema](/videos/jdk.cast)
或者打开 

[Centos 编译 OpenJDK](/html/compile_jdk.html)

