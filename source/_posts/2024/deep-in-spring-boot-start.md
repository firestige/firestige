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

```java
Startup startup = Startup.create();
if (this.registerShutdownHook) {
  SpringApplication.shutdownHook.enableShutdownHookAddition();
}
DefaultBootstrapContext bootstrapContext = createBootstrapContext();
ConfigurableApplicationContext context = null;
configureHeadlessProperty();
SpringApplicationRunListeners listeners = getRunListeners(args);
listeners.starting(bootstrapContext, this.mainApplicationClass);
```

准备阶段按顺序完成以下工作：

1. 调用Startup.create()创建启动标志
2. 如果有注册关闭事件的生命周期钩子，开启对应的生命周期钩子
3. 创建启动上下文
4. 配置无头模式
5. 获取监听器
6. 发布启动事件

其中，下面的日志发生在第三步，创建启动上下文时。

```log {.line-numbers}
02:55:58.664 [main] INFO com.example.springdemo.initializer.MyInitializer -- Initializing MyInitializer
02:55:58.705 [restartedMain] INFO com.example.springdemo.initializer.MyInitializer -- Initializing MyInitializer
```

```java
private DefaultBootstrapContext createBootstrapContext() {
  DefaultBootstrapContext bootstrapContext = new DefaultBootstrapContext();
  this.bootstrapRegistryInitializers.forEach((initializer) -> initializer.initialize(bootstrapContext));
  return bootstrapContext;
}

@Slf4j
public class MyInitializer implements BootstrapRegistryInitializer {
    @Override
    public void initialize(BootstrapRegistry registry) {
        log.info("Initializing MyInitializer");
    }
}
```

当调用forEach方法挨个执行从spring.factories中读取的`BootstrapRegistryInitializer`接口的实现类时，便会调用initialize接口，本例中仅输出一条日志。

第5步获取监听器配置是一个重要的拓展模式。请注意`SpringApplicationRunListener`的定义：

```java
/**
 * Listener for the {@link SpringApplication} {@code run} method.
 * {@link SpringApplicationRunListener}s are loaded through the
 * {@link SpringFactoriesLoader} and should declare a public constructor that accepts a
 * {@link SpringApplication} instance and a {@code String[]} of arguments. A new
 * {@link SpringApplicationRunListener} instance will be created for each run.
 *
 * @author Phillip Webb
 * @author Dave Syer
 * @author Andy Wilkinson
 * @author Chris Bono
 * @since 1.0.0
 */
public interface SpringApplicationRunListener {

	/**
	 * Called immediately when the run method has first started. Can be used for very
	 * early initialization.
	 * @param bootstrapContext the bootstrap context
	 */
	default void starting(ConfigurableBootstrapContext bootstrapContext) {
	}

	/**
	 * Called once the environment has been prepared, but before the
	 * {@link ApplicationContext} has been created.
	 * @param bootstrapContext the bootstrap context
	 * @param environment the environment
	 */
	default void environmentPrepared(ConfigurableBootstrapContext bootstrapContext,
			ConfigurableEnvironment environment) {
	}

	/**
	 * Called once the {@link ApplicationContext} has been created and prepared, but
	 * before sources have been loaded.
	 * @param context the application context
	 */
	default void contextPrepared(ConfigurableApplicationContext context) {
	}

	/**
	 * Called once the application context has been loaded but before it has been
	 * refreshed.
	 * @param context the application context
	 */
	default void contextLoaded(ConfigurableApplicationContext context) {
	}

	/**
	 * The context has been refreshed and the application has started but
	 * {@link CommandLineRunner CommandLineRunners} and {@link ApplicationRunner
	 * ApplicationRunners} have not been called.
	 * @param context the application context.
	 * @param timeTaken the time taken to start the application or {@code null} if unknown
	 * @since 2.6.0
	 */
	default void started(ConfigurableApplicationContext context, Duration timeTaken) {
	}

	/**
	 * Called immediately before the run method finishes, when the application context has
	 * been refreshed and all {@link CommandLineRunner CommandLineRunners} and
	 * {@link ApplicationRunner ApplicationRunners} have been called.
	 * @param context the application context.
	 * @param timeTaken the time taken for the application to be ready or {@code null} if
	 * unknown
	 * @since 2.6.0
	 */
	default void ready(ConfigurableApplicationContext context, Duration timeTaken) {
	}

	/**
	 * Called when a failure occurs when running the application.
	 * @param context the application context or {@code null} if a failure occurred before
	 * the context was created
	 * @param exception the failure
	 * @since 2.0.0
	 */
	default void failed(ConfigurableApplicationContext context, Throwable exception) {
	}

}
```

可以看到，Springboot为上下文设置了七个生命周期状态，即七个拓展点。分别是：

- starting
- environmentPrepared
- contextPrepared
- contextLoaded
- started
- ready
- failed

##### 启动阶段

##### 善后阶段


### 总结

![启动流程图](/img/spring-boot-start.jpg)
