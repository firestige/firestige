---
title: 初窥SkyWalking Java Agent插件命名规则
date: 2025-06-17 18:00:00
tag:
  - skywalking
  - 可观测性
---
## 1. 核心插件命名规则（agent/plugins目录）​​

### 1.1. 标准格式​

`apm-{技术名}-plugin-{版本}.jar`

- 示例：`apm-dubbo-plugin-8.15.0.jar`
- 技术名：被监控的中间件/框架（如dubbo、mysql、jdbc）

### 1.2. ​特殊约定插件​​

部分插件采用非标准命名（历史原因）：

- `spring-{version}-plugin.jar`
  (如`spring-commons-8.15.0.jar`)
- `trace-ignore-plugin-8.15.0.jar`
- `jdk-threading-plugin-8.15.0.jar`

## 2. 启动类加载器插件（bootstrap-plugins目录）​​

### 2.1. 标准格式​

`apm-jdk-{核心模块}-plugin-{版本}.jar`

- 特点：需在JVM启动早期加载
- 示例：apm-jdk-threading-plugin-8.15.0.jar

> 技术要求​​: 必须使用BootstrapClassLoader加载，避免类加载冲突

## 3. 激活器插件（activations目录）

### 3.1. 标准格式​

`apm-toolkit-{工具名}-activation-{版本}.jar`

- 功能：为监控工具包提供运行时桥接
- 示例：apm-toolkit-log4j-activation-8.15.0.jar

> 典型场景​​: 日志框架集成、OpenTracing API支持等被动集成场景

## 4. 协议扩展插件（reporter-plugins目录）​​

### 4.1. 标准格式​

`apm-{协议}-reporter-plugin-{版本}.jar`

- 功能：扩展数据上报协议
- 示例：apm-kafka-reporter-plugin-8.15.0.jar

## 5. 加载规则与目录对应关系​​

|目录|加载时机|命名模式|
|---|---|---|
|bootstrap-plugins|JVM启动时|apm-jdk-*-plugin-*.jar|
|plugins|Agent初始化阶段|apm-*-plugin-*.jar|
|activations|首次类加载时|apm-toolkit-*-activation-*.jar|
|reporter-plugins|OAP连接建立前|apm-*-reporter-plugin-*.jar|
|optional-plugins|不自动加载（需手动启用）|无固定规则|

## 6. 自定义插件命名开发建议​​

### 6.1. 标准格式​

`apm-{yourTech}-plugin-1.0.0.jar`

- 前缀 apm 表明Agent插件身份
- yourTech 明确标识监控的技术栈（如custom-rpc）

### 6.2. ​避免冲突的原则

- 插件ID在skywalking-plugin.def中全局唯一
- 禁止覆盖核心插件定义的类（如 org.apache.skywalking.*）
- 插件依赖需shade重打包

### 6.3. 目录部署位置​​

```bash
skywalking-agent/
  ├── plugins/
  │   └── apm-custom-plugin-1.0.0.jar  # 标准插件
  ├── optional-plugins/                # 手动启用时移动到这里
  ├── config/                          # 配置目录
  └── ...
```

## 7. 版本兼容性标记​​

在MANIFEST.MF中声明兼容版本：

```manifest
Skywalking-Agent-Version: 8.0.0-9.0.0  # 支持的Agent版本范围
Plugin-Required-Version: 8.8.0+        # 插件要求的最低核心版本
```

## 8. 动态加载机制

### 8.1. 插件扫描流程​​

```graph TD
  A[Agent启动] --> B{扫描plugins目录}
  B --> C[按文件名顺序加载JAR]
  C --> D[解析skywalking-plugin.def]
  D --> E[注册到PluginFinder]
```

### 8.2. ​​自定义插件热部署​​

- 修改后需重新打包JAR
- 重启应用生效（非热加载设计）
