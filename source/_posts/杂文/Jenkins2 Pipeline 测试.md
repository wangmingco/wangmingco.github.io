---
category: 杂文
title: Jenkins2 Pipeline 测试
date: 2017-04-21
---

我们使用gitlab + maven + jenkins2 环境进行测试.
首先在gitlab上创建一个项目

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins1.png)

然后我检出到本地, 在项目里创建一个maven项目

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins2.png)

然后创建一个Jenkinsfile文件

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins3.png)

这里要注意这个Jenkinsfile文件的写法.

然后我们将这些提交到仓库里.

接下来我们创建一个jenkins job

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins4.png)


![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins5.png)

别的不需要动, 我们只修改一下pipeline

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins6.png)

然后我们构建一下

![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins7.png)


![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins8.png)


![](https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/images/jenkins/jenkins9.png)

ok, 构建成功

从上述过程我们可以看出, 使用jenkins2的pipeline功能非常强大, 我们把构建过程写到了jenkinsfile文件里, 然后将这个文件放到了版本控制系统里, 这么着以后我们就可以任意的去搭建新的jenkins, 也很容易的进行持续部署