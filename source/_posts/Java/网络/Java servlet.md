---
category: Java
tag: Java 网络
date: 2018-03-15
title: Java Servlet
---

什么是Servlet呢? 官网如是说:

> Java Servlet is the foundation web specification in the Java Enterprise Platform. Developers can build web applications using the Servlet API to interact with the request/response workflow. This project provides information on the continued development of the Java Servlet specification.

Java Servlet是Java Enterprise平台上的一个功能性web规范(敲重点, 是个web规范). 开发者可以通过Servlet API 处理网络 request/response 从而构建一个web应用程序. 

这个Servlet只是一套规范, 一套协议, 它规定了如何处理网络请求以及如何应答, 开发人员只需要实现相应的Servlet就能开发出一套应答程序, 但是Servlet并不care网络部分, 你的网络部分可以试Tomcat, jetty, netty等等, who care, 你只要按照我的接口来给我传递消息就可以了.
