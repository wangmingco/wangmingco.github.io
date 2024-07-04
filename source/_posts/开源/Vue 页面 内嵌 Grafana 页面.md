---
category: 开源
date: 2024-05-10
title: Vue 页面 内嵌 Grafana 页面
---

前端页面
```vue
<template>
    <div>
      <div>
        <iframe id="iframeId" :src="uri" :width="width" :height="height" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" oallowfullscreen="true" msallowfullscreen="true" frameborder="0"></iframe>
        <el-button id="btnId" class="el-icon-full-screen" size="mini"></el-button>
    </div>
    </div>
  </template>
  
  <script>
  import Cookies from 'js-cookie'
  export default {
    name: 'Grafana',
    props: {
        clusterId: {
          type: Number,
          default: 1
        },
        url: {
            type: String,
            default: '/grafana/d/xxx/xxxx-xxxx-xxx-xxx-xxx?orgId=1&kiosk&refresh=15s'
        },
        width: {
            type: String,
        },
        height: {
            type: String,
        }
    },
    watch: {
        clusterId(n) {
            this.setCookie()
        },
        url(n) {
            this.setCookie()
            this.uri = n
        },
        width(n) {
            // console.log('width', n)
        },
        height(n) {
            // console.log('height', n)
        },
    },
    data() {
      return {
        uri: ''
      }
    },
    mounted() {
        this.setCookie()
        this.uri = this.url

        document.getElementById('btnId').addEventListener('click', function() {
        // 获取iframe元素
        var iframe = document.getElementById('iframeId');

        // 请求全屏
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) { /* Chrome, Safari 和 Opera */
          iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) { /* IE/Edge */
          iframe.msRequestFullscreen();
        }
      });
    },
    methods: {
      setCookie() {
        let seconds = 60 * 15; // 15分钟过期
        let expires = new Date(new Date() * 1 + seconds * 1000);
        Cookies.set('token', sessionStorage.getItem('token'), { expires: expires, sameSite: 'Strict' });
        Cookies.set('clusterId', this.clusterId, { expires: expires, sameSite: 'Strict' });
      }
    }
  }
  </script>
  
  <style lang="stylus" scoped>
  #btnId {
    position: absolute;
    top: 10px; /* 根据需要调整 */
    right: 10px; /* 根据需要调整 */
    z-index: 1000; /* 确保按钮在iframe之上 */
}
  </style>
```