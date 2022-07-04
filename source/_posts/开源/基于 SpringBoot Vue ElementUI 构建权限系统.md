---
category: 开源
date: 2020-04-14
title: 基于SpringBoot/Vue/ElementUI 构建权限系统
---

> [基于 SpringBoot/Vue/ElementUI 构建权限系统](https://zhuanlan.zhihu.com/p/130412007)


记录一下前几天写的一个权限系统。

{% dplayer 'url=https://raw.githubusercontent.com/wangmingco/wangmingco.github.io/main/static/videos/admin.mp4' "api=https://api.prprpr.me/dplayer/" "theme=#FADFA3" "autoplay=false" %} 

整个系统基于RBAC模型构建，提供了前端权限控制(动态路由生成)和后端权限控制(接口访问权限)，其实还应该做一层数据访问权限，但是这和具体的业务结合比较紧凑，因此就没实现。

1. `User` 表存储用户登录信息
2. `Role` 表存储角色
3. `UserRoleRelation` 表存储用户角色关系
4. `BackendPermission` 表存储后端权限(当服务器启动时会将所有路径都自动保存在该表里)
5. `RoleBackendPermissionRelation` 表存储角色拥有的后端权限
6. `FrontendPermission` 表存储前端路由信息.
7. `RoleFrontendPermissionRelation` 表存储角色拥有的前端路由信息

## 后端系统

后端系统是基于Springboot+shiro构建的，整个系统的核心就在shiro的配置上
```java
@Configuration
public class ShiroConfig {

    private static final Logger LOGGER = LoggerFactory.getSystemLogger(ShiroConfig.class);

    @Autowired
    private ApplicationContext applicationContext;

    @Resource
    private SecurityManager securityManager;

    @PostConstruct
    private void initStaticSecurityManager() {
        SecurityUtils.setSecurityManager(securityManager);
    }

    @Bean(name = "securityManager")
    public DefaultWebSecurityManager defaultWebSecurityManager(@Autowired DatabaseRealm shiroDatabaseRealm) {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setRealm(shiroDatabaseRealm);
        securityManager.setSessionManager(buildSessionManager());
        return securityManager;
    }

    private SessionManager buildSessionManager() {
        DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
        sessionManager.setSessionIdCookie(buildCookie());
        sessionManager.setSessionIdCookieEnabled(true);
        sessionManager.setSessionIdUrlRewritingEnabled(false);
        // 全局会话超时时间（单位毫秒），默认30分钟
        sessionManager.setGlobalSessionTimeout(AuthConstant.GlobalSessionTimeout);
        // 是否开启删除无效的session对象  默认为true
        sessionManager.setDeleteInvalidSessions(true);
        // 是否开启定时调度器进行检测过期session 默认为true
        sessionManager.setSessionValidationSchedulerEnabled(true);
        // 设置session失效的扫描时间, 清理用户直接关闭浏览器造成的孤立会话 默认30分钟
        sessionManager.setSessionValidationInterval(AuthConstant.SessionValidationInterval);
        return sessionManager;
    }

    public SimpleCookie buildCookie() {
        SimpleCookie simpleCookie = new SimpleCookie(TOKEN_NAME);
        simpleCookie.setPath("/");
        // 对服务器生成的TOKEN设置 HttpOnly 属性. 前端无法读写该TOKEN, 提供系统安全, 防止XSS攻击
        simpleCookie.setHttpOnly(true);
        // 设置浏览器关闭时失效此Cookie
        simpleCookie.setMaxAge(-1);
        return simpleCookie;
    }

    /**
     * 设置接口权限验证, 目前只针对api接口进行权限验证
     *
     * @param securityManager
     * @return
     */
    @Bean(name = "shiroFilter")
    public ShiroFilterFactoryBean shiroFilter(SecurityManager securityManager) {
        LOGGER.info("start shiroFilter setting");

        ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
        shiroFilterFactoryBean.setSecurityManager(securityManager);

        shiroFilterFactoryBean.setLoginUrl("/");
        shiroFilterFactoryBean.setSuccessUrl("/#/dashboard");
        shiroFilterFactoryBean.setUnauthorizedUrl("/403");

        Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>();

        Map<String, Filter> filtersMap = new LinkedHashMap<>();
        filtersMap.put("apiAccessControlFilter", new ApiAccessControlFilter());
        shiroFilterFactoryBean.setFilters(filtersMap);

        filterChainDefinitionMap.put("/static/**", "anon");
        filterChainDefinitionMap.put("/#/login/**", "anon");
        filterChainDefinitionMap.put("/api/user/auth/login", "anon");
        filterChainDefinitionMap.put("/logout", "logout");
        filterChainDefinitionMap.put("/api/**", "apiAccessControlFilter");
        filterChainDefinitionMap.put("/**", "logFilter");
        filterChainDefinitionMap.put("/**", "authc");

        shiroFilterFactoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);

        LOGGER.info("shirFilter config fineshed");
        return shiroFilterFactoryBean;
    }

    @Bean
    public CorsFilter corsFilter() {
        // CORS配置信息
        CorsConfiguration config = new CorsConfiguration();

        if (!SpringUtil.isInProduction(applicationContext)) {
            LOGGER.info("进行非生产模式CORS配置");
            config.addAllowedOrigin("*");
            config.setAllowCredentials(true);
            config.addAllowedMethod("*");
            config.addAllowedHeader("*");
            config.addExposedHeader("Set-Cookie");
        }

        UrlBasedCorsConfigurationSource configSource = new UrlBasedCorsConfigurationSource();
        configSource.registerCorsConfiguration("/**", config);
        return new CorsFilter(configSource);
    }
}
```

整个配置有几个关键的地方

```java
SimpleCookie simpleCookie = new SimpleCookie(TOKEN_NAME);
simpleCookie.setHttpOnly(true);
```

token是存储在cookie中，由后端传给前端的。而且这个cookie前端是不可读的，避免xss攻击。

```java
Map<String, Filter> filtersMap = new LinkedHashMap<>();
filtersMap.put("apiAccessControlFilter", new ApiAccessControlFilter());
filterChainDefinitionMap.put("/api/user/auth/login", "anon");
filterChainDefinitionMap.put("/api/**", "apiAccessControlFilter");
```

定义了一个`ApiAccessControlFilter`，只有当访问以`/api/`开头的接口时才会受到后端权限控制。

```java
if (!SpringUtil.isInProduction(applicationContext)) {
            LOGGER.info("进行非生产模式CORS配置");
            config.addAllowedOrigin("*");
            config.setAllowCredentials(true);
            config.addAllowedMethod("*");
            config.addAllowedHeader("*");
            config.addExposedHeader("Set-Cookie");
}
```

这里做了一个是否在生产环境中的判断，因为在开发模式中，前端工程是直接运行在node服务中的，因此要做跨域访问，所以在非生产环境中允许跨域访问。

后端还有一些其他的功能，比如日志记录，参数校验，请求统计等等，这些非核心功能可以参考最后的工程代码。

## 前端系统

前端系统是基于vue-element-admin 进行二次开发的。

主要修改的就是cookie的存储，vue-element-admin 默认是通过http response body获取token，但是我修改成了通过header cookie返回，并且cookie默认不可读。

vue-element-admin 自带
```javascript
// 登录  
login({ commit }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ username: username.trim(), password: password }).then(response => {
        const { data } = response
        commit('SET_TOKEN', data.token)
        setToken(data.token)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })

// 通信前获取token
service.interceptors.request.use(
  config => {
    // do something before request is sent
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)
```

还有一点修改就是前端路由的修改。

vue-element-admin 默认的是权限控制是在前端代码中控制的，后端只需要返回用户拥有的角色，然后前端根据角色信息找到权限然后生成路由。我修改成了整个前端的路由都是由后端控制返回的
```javascript
const actions = {
  generateRoutes({ commit }, roles) {
    return new Promise(resolve => {
      getUserFrontendPermissions().then(response => {
        
        let routeNodes = response.data.routeNodes
        importComponent(routeNodes)
        
        commit('SET_ROUTES', routeNodes)
        resolve(routeNodes)
      })
      
    })
  }
}

function importComponent(routeNodes) {

  for(var rn of routeNodes) {
    if(rn.component == "Layout") {
      rn.component = Layout
    } else {
      let componentPath = rn.component
      rn.component = () => import(`@/views/${componentPath}`)
    }
   
    if(rn.children && rn.children.length > 0) {
      importComponent(rn.children)
    }
  }
}
```

主要的函数就是importComponent(routeNodes), 采用递归的方式import组件.

> 这里遇到一点小问题，webpack 编译es6 动态引入 import() 时不能传入变量, 但一定要用变量的时候，可以通过字符串模板来提供部分信息给webpack；例如import(./path/${myFile}), 这样编译时会编译所有./path下的模块. 参考在vue中import()语法为什么不能传入变量?

整体的代码就是这么多吧，当然在整个调试过程中还是花了些时间的，具体的可以参考我的提交记录 admin-solution

