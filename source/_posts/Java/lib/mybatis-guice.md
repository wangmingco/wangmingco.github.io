---
category: Mybatis
date: 2015-12-09
title: Guice Mybatis 使用笔记
---
参考文档[mybatis-guice](http://mybatis.org/guice/index.html)

mybatis-guice需要依赖
```xml
<dependency>
    <groupId>com.google.inject</groupId>
    <artifactId>guice</artifactId>
    <version>4.0</version>
</dependency>
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis-guice</artifactId>
    <version>3.7</version>
</dependency>
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.2.2</version>
</dependency>
<dependency>
    <groupId>com.google.inject.extensions</groupId>
    <artifactId>guice-multibindings</artifactId>
    <version>4.0</version>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>5.1.37</version>
</dependency>
</dependencies>
```
表结构
```sql
CREATE TABLE `user` (
  `userId` varchar(100) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

我们首先定义使用到的model类和mapper类
```java
class User {
    public String userId;
    public String name;
}

interface UserMapper {
    @Select("SELECT * FROM user WHERE userId = #{userId}")
    User getUser(@Param("userId") String userId);
}
```
然后我们实现Guice对Mybatis的注解管理
```java
class MySqlManager {
    private static final Injector injector;
    static {
        injector = Guice.createInjector(JdbcHelper.MySQL, new MysqlModule());
    }
    private MySqlManager() {
    }

    public static <T> T getInstance(Class<T> var1) {
        return injector.getInstance(var1);
    }

    private static class MysqlModule extends MyBatisModule {

        @Override
        protected void initialize() {
            bindDataSourceProviderType(PooledDataSourceProvider.class);
            bindTransactionFactoryType(JdbcTransactionFactory.class);
            Names.bindProperties(binder(), createUnpooledProperties());

            addMapperClass();
        }

        // 添加映射类
        private void addMapperClass() {
            addMapperClass(UserMapper.class);
        }

        private Properties createUnpooledProperties() {
            Properties myBatisProperties = new Properties();
            myBatisProperties.setProperty("mybatis.environment.id", "test");
            myBatisProperties.setProperty("JDBC.schema", "test");
//			myBatisProperties.setProperty("JDBC.url", "localhost");
//			myBatisProperties.setProperty("JDBC.driver", "");
            myBatisProperties.setProperty("JDBC.username", "root");
            myBatisProperties.setProperty("JDBC.password", "root");
            myBatisProperties.setProperty("JDBC.loginTimeout", "10");
            myBatisProperties.setProperty("JDBC.autoCommit", "false");
            myBatisProperties.setProperty("derby.create", "true");
            return myBatisProperties;
        }
    }
}
```
然后我们写一个测试类
```java
public class GettingStarted {

    public static void main(String[] args) {
        UserMapper user = MySqlManager.getInstance(UserMapper.class);
        User user1 = user.getUser("1");
        System.out.println(user1.name);
		
		UserMapper userMapper = new UserMapper();
		injector.injectMembers(userMapper);
		System.out.println(userMapper.name);
    }
}
```

`MyBatisModule`还为我们提供了下述功能的接口
* 添加自己的拦截器 : `addInterceptorClass(MySqlInterceptor.class);`
* 添加自己的类型转换器 : `handleType()`
* 添加别名 : `addSimpleAlias(User.class);`或者`addAlias("AUser").to(User.class);`

## 开启事务
我们在`FooServiceMapperImpl`中还能定义开启事务
```java
// 开启事务
@Transactional(
        executorType = ExecutorType.BATCH,
        isolation = Isolation.READ_UNCOMMITTED,
//		rethrowExceptionsAs = MyDaoException.class,
        exceptionMessage = "Something went wrong"
)
public User getUser(String userId) {
    return this.userMapper.getUser(userId);
}
```


## 定义自己的连接池
```java
private void addPooledProperties(Binder binder) {
    // 连接池并发访问数据的连接数, 默认为10
    binder.bindConstant().annotatedWith(Names.named("mybatis.pooled.maximumActiveConnections")).to(10);
    // 在被强制返回之前，池中连接被检查的时间
    binder.bindConstant().annotatedWith(Names.named("mybatis.pooled.maximumCheckoutTime")).to(20000);
    // 连接池里空闲连接数, 默认为5
    binder.bindConstant().annotatedWith(Names.named("mybatis.pooled.maximumIdleConnections")).to(5);
    // 由于数据库会检查连接达到8小时(默认值)闲置会单方面断开连接, 而客户端如果继续使用已经断开的连接,则会产生异常.
    // mybatis里内带了ping机制, 设置该值为true的话, 就开启了ping机制
    binder.bindConstant().annotatedWith(Names.named("mybatis.pooled.pingEnabled")).to(false);
    // 设置空闲连接ping时间间隔, 如果超时就进行ping,查看连接是否有效
    binder.bindConstant().annotatedWith(Names.named("mybatis.pooled.pingConnectionsNotUsedFor")).to(3600000);
    // 执行ping时执行的语句
	//	binder.bindConstant().annotatedWith(Names.named("mybatis.pooled.pingQuery")).to("");
    // 这是一个低层设置，如果获取连接花费的相当长的时间，它会给连接池打印日志并重新尝试获取一个连接的机会（避免在误配置的情况下一直安静的失败），默认值：20000 毫秒（即 20 秒）。
    binder.bindConstant().annotatedWith(Names.named("mybatis.pooled.timeToWait")).to(0);
}

private void addC3P0Properties(Binder binder) {
    // 当连接池中的的连接耗尽的时候c3p0一次同时获取的连接数，但是池中最大数不会超过maxPoolSize
    binder.bindConstant().annotatedWith(Names.named("c3p0.acquireIncrement")).to(1);
    // 从数据库请求连接失败之后,尝试的次数
    binder.bindConstant().annotatedWith(Names.named("c3p0.acquireRetryAttempts")).to(1);
    // 连接池耗尽, 连续获得俩个连接直接的间隔时间. 单位ms
    binder.bindConstant().annotatedWith(Names.named("c3p0.acquireRetryDelay")).to(1000);
    binder.bindConstant().annotatedWith(Names.named("c3p0.automaticTestTable")).to("test");
    // 如果为true，则当连接获取失败时自动关闭数据源
    binder.bindConstant().annotatedWith(Names.named("c3p0.breakAfterAcquireFailure")).to(false);
    // 连接池所有连接耗尽时,应用程序获得新的连接的等待时间. 为0则无限等待直至有其他连接释放或者创建新的连接，
    binder.bindConstant().annotatedWith(Names.named("c3p0.checkoutTimeout")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.connectionCustomizerClassName")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.connectionTesterClassName")).to(1);
    // 检查所有连接池中的空闲连接的时间间隔, 单位秒
    binder.bindConstant().annotatedWith(Names.named("c3p0.idleConnectionTestPeriod")).to(900);
    // 连接池初始化时创建的连接数,default : 3
    binder.bindConstant().annotatedWith(Names.named("c3p0.initialPoolSize")).to(3);
    binder.bindConstant().annotatedWith(Names.named("c3p0.maxAdministrativeTaskTime")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.maxConnectionAge")).to(1);
    // 池中连接最大空闲时长,如果超时则断开这个连接. 单位是秒
    binder.bindConstant().annotatedWith(Names.named("c3p0.maxIdleTime")).to(600);

    binder.bindConstant().annotatedWith(Names.named("c3p0.maxIdleTimeExcessConnections")).to(1);
    // 接池中拥有的最大连接数，如果获得新连接时会使连接总数超过这个值则不会再获取新连接，而是等待其他连接释放
    binder.bindConstant().annotatedWith(Names.named("c3p0.maxPoolSize")).to(15);
    binder.bindConstant().annotatedWith(Names.named("c3p0.maxStatements")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.maxStatementsPerConnection")).to(1);
    // 连接池保持的最小连接数
    binder.bindConstant().annotatedWith(Names.named("c3p0.minPoolSize")).to(3);
    binder.bindConstant().annotatedWith(Names.named("c3p0.preferredTestQuery")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.propertyCycle")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.testConnectionOnCheckin")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.testConnectionOnCheckout")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.unreturnedConnectionTimeout")).to(1);
    binder.bindConstant().annotatedWith(Names.named("c3p0.usesTraditionalReflectiveProxies")).to(1);
}
```

我们还可以采用配置文件的方式设置
```java
import org.mybatis.guice.XMLMyBatisModule;
import org.mybatis.guice.datasource.helper.JdbcHelper;

import com.google.inject.Guice;
import com.google.inject.Injector;

public class MybatisManager {
    private static Injector injector;
    static {
        injector = Guice.createInjector(JdbcHelper.MySQL, new MysqlModule());
    }
    private MybatisManager() {
    }

    public static <T> T getInstance(Class<T> var1) {
        return injector.getInstance(var1);
    }

	private static class MysqlModule extends XMLMyBatisModule {

		@Override
		protected void initialize() {
            setClassPathResource("configuration.xml");
		}
	}
}
```