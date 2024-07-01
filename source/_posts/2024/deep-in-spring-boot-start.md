---
title: Spring boot启动过程分析
date: 2024-06-24 12:41:00
tag:
  - 每周一篇
  - Java
  - 源码分析
  - spring boot
---
## Spring boot启动过程分析

调用SpringbootApplication.run()之后到底发生了什么？
Spring是如何启动应用的？
拓展点有很多，我该选谁？
过程中有哪些设计可以借鉴？

### 观察现象

让我们看一段Spring Boot应用启动日志

```log {.line-numbers}

02:55:58.664 [main] INFO com.example.springdemo.initializer.MyInitializer -- Initializing MyInitializer
02:55:58.705 [restartedMain] INFO com.example.springdemo.initializer.MyInitializer -- Initializing MyInitializer

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.0)

2024-06-24T02:55:58.893+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.SpringDemoApplication     : Starting SpringDemoApplication using Java 21 with PID 1364008 (\spring-demo\target\classes started by adam in \spring-demo)
2024-06-24T02:55:58.894+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.SpringDemoApplication     : No active profile set, falling back to 1 default profile: "default"
2024-06-24T02:55:58.926+08:00  INFO 1364008 --- [  restartedMain] .e.DevToolsPropertyDefaultsPostProcessor : Devtools property defaults active! Set 'spring.devtools.add-properties' to 'false' to disable
2024-06-24T02:55:58.926+08:00  INFO 1364008 --- [  restartedMain] .e.DevToolsPropertyDefaultsPostProcessor : For additional web related logging consider setting the 'logging.level.web' property to 'DEBUG'
2024-06-24T02:55:59.500+08:00  INFO 1364008 --- [  restartedMain] c.e.s.a.MyAppAutoConfiguration           : MyAppAutoConfiguration built!
2024-06-24T02:55:59.526+08:00  INFO 1364008 --- [  restartedMain] o.s.b.d.a.OptionalLiveReloadServer       : LiveReload server is running on port 35729
2024-06-24T02:55:59.612+08:00  INFO 1364008 --- [  restartedMain] o.s.b.web.embedded.netty.NettyWebServer  : Netty started on port 8080
2024-06-24T02:55:59.613+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.GoodListener     : GoodListener event receive event: org.springframework.boot.web.reactive.context.ReactiveWebServerInitializedEvent[source=org.springframework.boot.web.embedded.netty.NettyWebServer@58fb4529]
2024-06-24T02:55:59.614+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.DemoListener     : Application event received: org.springframework.boot.web.reactive.context.ReactiveWebServerInitializedEvent
2024-06-24T02:55:59.614+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.EmoListener      : EmoListener event receive event: org.springframework.boot.web.reactive.context.ReactiveWebServerInitializedEvent[source=org.springframework.boot.web.embedded.netty.NettyWebServer@58fb4529]
2024-06-24T02:55:59.614+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.GoodListener     : GoodListener event receive event: org.springframework.context.event.ContextRefreshedEvent[source=org.springframework.boot.web.reactive.context.AnnotationConfigReactiveWebServerApplicationContext@630d7a02, started on Mon Jun 24 02:55:58 CST 2024]
2024-06-24T02:55:59.617+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.DemoListener     : Application event received: org.springframework.context.event.ContextRefreshedEvent
2024-06-24T02:55:59.617+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.EmoListener      : EmoListener event receive event: org.springframework.context.event.ContextRefreshedEvent[source=org.springframework.boot.web.reactive.context.AnnotationConfigReactiveWebServerApplicationContext@630d7a02, started on Mon Jun 24 02:55:58 CST 2024]
2024-06-24T02:55:59.617+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.SpringDemoApplication     : Started SpringDemoApplication in 0.913 seconds (process running for 1.276)
2024-06-24T02:55:59.618+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.GoodListener     : GoodListener event receive event: org.springframework.boot.context.event.ApplicationStartedEvent[source=org.springframework.boot.SpringApplication@4a35486f]
2024-06-24T02:55:59.618+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.DemoListener     : Application event received: org.springframework.boot.context.event.ApplicationStartedEvent
2024-06-24T02:55:59.618+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.EmoListener      : EmoListener event receive event: org.springframework.boot.context.event.ApplicationStartedEvent[source=org.springframework.boot.SpringApplication@4a35486f]
2024-06-24T02:55:59.618+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.GoodListener     : GoodListener event receive event: org.springframework.boot.availability.AvailabilityChangeEvent[source=org.springframework.boot.web.reactive.context.AnnotationConfigReactiveWebServerApplicationContext@630d7a02, started on Mon Jun 24 02:55:58 CST 2024]
2024-06-24T02:55:59.618+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.DemoListener     : Application event received: org.springframework.boot.availability.AvailabilityChangeEvent
2024-06-24T02:55:59.618+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.EmoListener      : EmoListener event receive event: org.springframework.boot.availability.AvailabilityChangeEvent[source=org.springframework.boot.web.reactive.context.AnnotationConfigReactiveWebServerApplicationContext@630d7a02, started on Mon Jun 24 02:55:58 CST 2024]
2024-06-24T02:55:59.619+08:00  INFO 1364008 --- [  restartedMain] c.example.springdemo.runner.GammaRunner  : GammaRunner with highest precedence invoked
2024-06-24T02:55:59.619+08:00  INFO 1364008 --- [  restartedMain] c.example.springdemo.runner.AlphaRunner  : AlphaRunner without order annotation invoked
2024-06-24T02:55:59.619+08:00  INFO 1364008 --- [  restartedMain] c.example.springdemo.runner.BetaRunner   : BetaRunner without order annotation invoked
2024-06-24T02:55:59.620+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.GoodListener     : GoodListener event receive event: org.springframework.boot.context.event.ApplicationReadyEvent[source=org.springframework.boot.SpringApplication@4a35486f]
2024-06-24T02:55:59.620+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.DemoListener     : Application event received: org.springframework.boot.context.event.ApplicationReadyEvent
2024-06-24T02:55:59.620+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.EmoListener      : EmoListener event receive event: org.springframework.boot.context.event.ApplicationReadyEvent[source=org.springframework.boot.SpringApplication@4a35486f]
2024-06-24T02:55:59.620+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.GoodListener     : GoodListener event receive event: org.springframework.boot.availability.AvailabilityChangeEvent[source=org.springframework.boot.web.reactive.context.AnnotationConfigReactiveWebServerApplicationContext@630d7a02, started on Mon Jun 24 02:55:58 CST 2024]
2024-06-24T02:55:59.620+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.DemoListener     : Application event received: org.springframework.boot.availability.AvailabilityChangeEvent
2024-06-24T02:55:59.620+08:00  INFO 1364008 --- [  restartedMain] c.e.springdemo.listener.EmoListener      : EmoListener event receive event: org.springframework.boot.availability.AvailabilityChangeEvent[source=org.springframework.boot.web.reactive.context.AnnotationConfigReactiveWebServerApplicationContext@630d7a02, started on Mon Jun 24 02:55:58 CST 2024]

```

Spring的启动日志中，总共出现了：

- MyInitializer
- MyAppAutoConfiguration
- DemoListener
- EmoListener
- GoodListener
- AlphaRunner
- BetaRunner
- GammaRunner

共计8个自定义类，分属四种拓展形式。我们可以看到，它们的输出有特定顺序，并且可以人为调整。接下来，让我们阅读SPringbootApplication.run()方法的源码，了解Springboot是如何启动应用的。

### 第一步 SpringbootApplication.run()

```java
@SpringBootApplication
public class SpringDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringDemoApplication.class, args);
    }

}
```

当我们执行上面这样的代码时，spring完成了两件工作：

1. 创建`SpringApplication`实例
2. 执行`SpringApplication`的run方法

#### 创建`SpringBootApplication`实例

```java {.line-numbers}
// org.springframework.boot.SpringApplication

/**
 * Create a new {@link SpringApplication} instance. The application context will load
 * beans from the specified primary sources (see {@link SpringApplication class-level}
 * documentation for details). The instance can be customized before calling
 * {@link #run(String...)}.
 * @param resourceLoader the resource loader to use
 * @param primarySources the primary bean sources
 * @see #run(Class, String[])
 * @see #setSources(Set)
 */
@SuppressWarnings({ "unchecked", "rawtypes" })
public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
    this.resourceLoader = resourceLoader;
    Assert.notNull(primarySources, "PrimarySources must not be null");
    this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
    this.webApplicationType = WebApplicationType.deduceFromClasspath();
    this.bootstrapRegistryInitializers = new ArrayList<>(
            getSpringFactoriesInstances(BootstrapRegistryInitializer.class));
    setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
    setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
    this.mainApplicationClass = deduceMainApplicationClass();
}
```

这里创建了一个SpringApplication实例，`resourceLoader`为null，`primarySources`是我们的启动类`SpringDemoApplication.class`。先通过`WebApplicationType.deduceFromClasspath()`判断应用类型；然后通过`getSpringFactoriesInstances()`访问\*.factories文件，以类似SPI加载的方式获取服务配置；最终完成SpringApplication实例的初始化工作。

#### 执行SpringApplication的run方法

```java {.line-numbers}
/**
 * Run the Spring application, creating and refreshing a new
 * {@link ApplicationContext}.
 * @param args the application arguments (usually passed from a Java main method)
 * @return a running {@link ApplicationContext}
 */
public ConfigurableApplicationContext run(String... args) {
  Startup startup = Startup.create();
  if (this.registerShutdownHook) {
    SpringApplication.shutdownHook.enableShutdownHookAddition();
  }
  DefaultBootstrapContext bootstrapContext = createBootstrapContext();
  ConfigurableApplicationContext context = null;
  configureHeadlessProperty();
  SpringApplicationRunListeners listeners = getRunListeners(args);
  listeners.starting(bootstrapContext, this.mainApplicationClass);
  try {
    ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
    ConfigurableEnvironment environment = prepareEnvironment(listeners, bootstrapContext, applicationArguments);
    Banner printedBanner = printBanner(environment);
    context = createApplicationContext();
    context.setApplicationStartup(this.applicationStartup);
    prepareContext(bootstrapContext, context, environment, listeners, applicationArguments, printedBanner);
    refreshContext(context);
    afterRefresh(context, applicationArguments);
    startup.started();
    if (this.logStartupInfo) {
      new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), startup);
    }
    listeners.started(context, startup.timeTakenToStarted());
    callRunners(context, applicationArguments);
  }
  catch (Throwable ex) {
    if (ex instanceof AbandonedRunException) {
      throw ex;
    }
    handleRunFailure(context, ex, listeners);
    throw new IllegalStateException(ex);
  }
  try {
    if (context.isRunning()) {
      listeners.ready(context, startup.ready());
    }
  }
  catch (Throwable ex) {
    if (ex instanceof AbandonedRunException) {
      throw ex;
    }
    handleRunFailure(context, ex, null);
    throw new IllegalStateException(ex);
  }
  return context;
}
```

run方法的流程可以拆分为以下三个主要阶段：

1. 准备阶段
2. 启动阶段
3. 善后阶段

##### 准备阶段

准备阶段对应下面的日志

```log {.line-numbers}
02:55:58.664 [main] INFO com.example.springdemo.initializer.MyInitializer -- Initializing MyInitializer
02:55:58.705 [restartedMain] INFO com.example.springdemo.initializer.MyInitializer -- Initializing MyInitializer
```

首先，通过Startup.create()方法创建一个启动状态标志对象，Startup，标志着开始启动流程。
然后，视情况注册关闭时生命周期函数；
再然后，调用createBootstrapContext()方法创建启动上下文对象。

##### 启动阶段

##### 善后阶段


### 总结

![启动流程图](/img/spring-boot-start.jpg)
