---
category: 前端
tag: JavaScript
date: 2017-02-17
title: JavaScript 页面跳转
---

```html
<!doctype html>
<html>
    <body>
        <input type="button" value="window.location" onclick="window_location()">
        <br/>
        <br/>

        <input type="button" value="window.location.href" onclick="window_location_href()">
        <br/>
        <br/>

        <input type="button" value="window.open" onclick="window_open()">
        <br/>
        <br/>

        <input type="button" value="self.location" onclick="self_location()">
        <br/>
        <br/>

        <script type="application/javascript">

             function window_location() {
                window.location="www.baidu.com";
             }

             function window_location_href() {
                window.location.href="www.sohu.com";
             }
            
             function window_open() {
                window.open("www.sohu.com");
             }

             function self_location() {
                self.location="www.baidu.com";
             }
             
        </script>
    </body>
</html>
```

window.location 与window.open区别

* window.location是window对象的属性，而window.open是window对象的方法 
* window.location是你对当前浏览器窗口的URL地址对象的参考！ 基于当前域进行url跳转
* window.open是用来打开一个新窗口的函数, 用一个新的窗口打开url
* window.open不一定是打开一个新窗口. 只要有窗口的名称和window.open中第二个参数中的一样就会将这个窗口替换，用这个特性的话可以在iframe和frame中来代替location.href。 