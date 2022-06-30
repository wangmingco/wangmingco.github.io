---
category: Java
tag: Java 三方库
date: 2020-11-05
title: HttpClient 多线程请求
---

写一段客户端测试的代码
```
public class HttpClient {

   private static final Logger LOGGER = LoggerFactory.getLogger(HttpClient.class);

   private static final CloseableHttpClient staticClient;
   static {
      RequestConfig requestConfig = RequestConfig.custom()
            .setSocketTimeout(8000)
            .setConnectTimeout(8000)
            .build();


      staticClient = HttpClients.custom()
            .setDefaultRequestConfig(requestConfig)
            .useSystemProperties()
            .build();
   }


   public static void main(String[] args) throws InterruptedException {

      TimeUnit.SECONDS.sleep(10);

      for (int i = 1; i < 20; i++) {
         startRequest(i);
      }
   }


   private static void startRequest(int idx) {
      new Thread(() -> {

         HttpHost httpHost = new HttpHost("localhost", 8080);
         HttpRequest httpRequest = new HttpGet("/" + idx);
         try {
            CloseableHttpClient httpClient = getClient();
            print(httpClient);


            LOGGER.info("请求开始: " + idx);
            httpClient.execute(httpHost, httpRequest);
            LOGGER.info("请求结束: " + idx);
         } catch (IOException e) {
            LOGGER.error("请求异常: " + idx, e);
         }
      }).start();
   }


   private static CloseableHttpClient getClient() {
      return staticClient;
   }

   private static void print(CloseableHttpClient httpClient) {
      try {

         Field field = httpClient.getClass().getDeclaredField("connManager");
         field.setAccessible(true);

         PoolingHttpClientConnectionManager clientConnectionManager = (PoolingHttpClientConnectionManager)field.get(httpClient);
         PoolStats stats = clientConnectionManager.getTotalStats();
         System.out.println("Max : " + stats.getMax()
               + ". Available : " + stats.getAvailable()
               + ". Leased : " + stats.getLeased()
               + ". Pending : " + stats.getPending()
               + ". DefaultMaxPerRoute : " + clientConnectionManager.getDefaultMaxPerRoute()
               + ". MaxTotal : " + clientConnectionManager.getMaxTotal()
         );

         field.setAccessible(false);
      } catch (Exception e) {
         e.printStackTrace();
      }
   }
}
```


服务端沉睡3秒钟，每次执行这段代码的话，都只会有2个请求执行完成。
这是因为在`HttpClient`的连接池中`MaxtTotal`， `DefaultMaxPerRoute`有这么俩个参数，

* `MaxtTotal` 表示连接池中最大的连接数，
* `DefaultMaxPerRoute` 表示某个地址最大的并发连接数。

比如`MaxtTotal`为20，`DefaultMaxPerRoute`为2（这俩个值也是默认值）。
现在有10个并发请求，其中4个请求www.baidu.com, 6个请求www.qq.com, 如果服务器都阻塞住的话，那么现在的并发连接是4个，baidu2个，qq俩个。
如果在`RequestConfig#setConnectionRequestTimeout`这个没有设置的话，其他的请求线程就会一直阻塞了。

解决这个问题的话，有三种方案

1. 设置`RequestConfig#setConnectionRequestTimeout`这个值，大于0的话，如果到达时间没有可用连接的话，就会抛出异常
2. 设置`System.setProperty("http.maxConnections", "20”);` 这个值会调大 `DefaultMaxPerRoute` 这个值
3. 不要共享`HttpClient`，如果想要降低new的话，可以使用`ThreadLocal`
