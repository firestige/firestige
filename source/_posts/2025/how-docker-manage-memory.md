---
title: docker是如何管理内存的？
date: 2025-07-19 20:00:00
tag:
  - 虚拟化
------

> 故事的起因是我们在内网环境部署skywalking的container失败，日志显示GC线程创建失败导致JVM退出。升级docker版本或者在docker run中添加特权参数都可以规避这个问题，但是1个MB的stack居然会申请失败，实在是让我感到匪夷所思。更神奇的是ulimit指令居然会直接导致container崩溃退出，连日志都没有。这不禁让我好奇这背后的原因。。。。


### 1. 引子：一次失败的部署

月黑风高夜，牛马搬砖天。明明在开发环境工作好好的skywalking镜像，在测试环境死活无法启动,日志提示GC线程创建失败。但这难不到作为资深牛马的你，不就是内存不足么，你反手就是一套组合拳：`-m 4g --swap-memory 4g --ulimit stack=2048:2048 -e JAVA_OPTS="-Xmx2g -Xss256k"`。然后就是一套操作猛如虎，一看结果250。不能说毫无效果，但也是完全没变。启动日志犹如耻辱柱上的钉子一般把你牢牢钉在上面。上去的时候多有信心，现在就多么窘迫，更有甚者，你在尝试使用ulimit参数时，容器跟你开了个大大的玩笑，连演都不演直接崩溃收工，让你毫无头绪。
```log
[0.003s][warning][os,thread]Failed to start thread "GC Thread#0" - pthread_create failed(EPERM) for attributes: stacksize:1024k, guardsize:4k, detached.
```

好在你只是被打的措手不及，作为资深专家，你有丰富的经验处理各种各样的难题。随着不断的尝试，你将注意力锁定在`docker`环境本身。你的开发环境docker server版本为28.3.0，而测试环境docker server版本是20.10.9。你发现不管是升级到最新版docker还是简单在docker run命令里添加--privileged参数开放特权，都可以规避这个问题正常启动镜像。

这不禁让你陷入沉思：
1. 为何仅仅1MB的线程栈空间会申请失败？
2. 为何`--ulimit`指令会导致容器直接崩溃？

### 2. Docker的内存管理机制
*   **核心技术：Cgroups**
    *   Cgroups是什么？它在Linux内核中如何工作？

Cgroups（Control Groups的缩写）是Linux内核提供的一项核心功能，它允许我们将一组进程（Process）组织起来，并对这组进程所使用的系统资源（如CPU、内存、磁盘I/O、网络等）进行精细化的限制、隔离和审计。可以说，Cgroups是实现容器化技术（如Docker、LXC）的基石之一，与Namespaces共同构成了容器资源隔离的左膀右臂。

Cgroups在内核中的工作原理
Cgroups的核心思想可以概括为“分组与挂钩（Grouping and Hooking）”。

分组（Grouping）: Cgroups将系统中的进程以“组”的形式进行管理。这个“组”是一个树状的层级结构（Hierarchy），类似于文件系统的目录树。你可以在一个Cgroup下创建子Cgroup，子Cgroup会继承父Cgroup的某些属性。

挂钩（Hooking）: 内核在各种与资源相关的系统调用路径上设置了“挂钩”（Hooks）。当一个进程尝试申请或使用资源时（例如，申请内存、执行CPU密集型计算），这些挂钩就会被触发。

子系统（Subsystems）: 每个挂钩都与一个或多个Cgroup子系统（也称为控制器，Controller）相关联。每个子系统负责一种特定类型的资源管理。常见的子系统有：

memory: 限制内存使用量，包括物理内存和交换空间。我们这次问题的核心就与它有关。
cpu: 限制CPU的使用率，可以设置CPU时间的权重或绝对上限。
blkio: 限制对块设备（如硬盘、SSD）的输入/输出速率。
pids: 限制一个Cgroup内可以创建的进程数量。
devices: 控制Cgroup中的进程能否访问某些设备。
一个形象的比喻
你可以把Cgroups想象成一个公司的组织架构：

> 整个公司 就是Linux系统。
各个部门（如研发部、市场部） 就是不同的Cgroup。
部门里的员工 就是系统中的进程。
公司的规章制度（如研发部每月预算、上班打卡时间） 就是Cgroup子系统施加的资源限制。
部门经理 可以为自己的部门制定更细的规则，就像在Cgroup下创建子Cgroup一样。
Cgroups与文件系统的结合
在Linux中，Cgroups被实现为一个虚拟文件系统。通常，它被挂载在cgroup目录下。当你在这个目录下创建一个子目录时，就相当于创建了一个新的Cgroup。而目录中的那些文件，就是你可以用来配置和监控这个Cgroup资源的“开关”和“仪表盘”。

例如，对于memory子系统，你会看到类似memory.limit_in_bytes这样的文件。向这个文件写入一个数值，就为这个Cgroup设定了内存使用的硬性上限。

总而言之，Cgroups通过这种巧妙的、基于文件系统的接口，为系统管理员和容器引擎（如Docker）提供了一个强大而直观的工具，来驾驭和分配系统资源。接下来，我们将具体看看Docker是如何利用memory这个子系统来管理容器内存的。


    *   Memory Cgroup：专门用于内存资源隔离与限制的子系统。
*   **Docker如何使用Memory Cgroup**
    *   硬限制 (`memory.limit_in_bytes`): 容器内存使用的上限，超过会触发OOM Killer。
    *   软限制 (`memory.soft_limit_in_bytes`): 内核会尽量将容器内存维持在此限制之下。

Docker利用Memory Cgroup子系统为我们提供了简单直观的内存控制接口。当我们运行一个容器时，Docker会自动在Cgroup虚拟文件系统中为该容器创建一个唯一的组，通常路径类似于 /sys/fs/cgroup/memory/docker/<container-id>/。然后，Docker会根据我们在docker run命令中指定的参数，去修改这个目录下的配置文件，主要是以下两个核心参数：

1. 硬限制（Hard Limit）：--memory 或 -m
这是我们最常用的内存限制参数，它直接对应到Cgroup中的 memory.limit_in_bytes 文件。

作用：设置容器可以使用的最大内存量。这是一个严格的、强制性的上限。
行为：如果容器中的所有进程使用的总内存（包括文件系统缓存）超过了这个硬限制，Linux内核会立即调用OOM Killer（Out-of-Memory Killer）。OOM Killer会选择并“杀死”（kill）容器中的一个或多个进程，以释放内存，强制使内存使用回到限制之下。这通常会导致容器内的应用异常终止。在我们的案例中，虽然不是OOM Killer直接导致的问题，但理解这个机制至关重要。
示例：docker run -m 512m nginx 会将Nginx容器的内存上限设置为512MB。Docker会自动将512 * 1024 * 1024这个值写入对应Cgroup的memory.limit_in_bytes文件中。
2. 软限制（Soft Limit）：--memory-reservation
这个参数对应Cgroup中的 memory.soft_limit_in_bytes 文件，提供了一种更灵活的内存管理方式。

作用：设置一个内存预留值或“软性”的限制。内核会尽力确保容器的内存使用量不会低于这个预留值，并且在系统内存紧张时，会优先回收那些没有设置软限制或超出软限制的容器内存。
行为：它不是一个强制性的上限。容器在没有内存竞争的情况下，可以自由使用超过软限制的内存，最高可达到硬限制（如果设置了的话）。软限制的主要目的是在多个容器争抢内存资源时，为设置了该值的容器提供一定程度的保障。
示例：docker run -m 1g --memory-reservation 512m my_app。这个命令意味着：
my_app容器的内存硬上限是1GB。
我们希望系统为它预留512MB的内存。当系统内存充足时，my_app可以用满1GB；当系统内存紧张时，内核会尽量保证my_app至少能拥有512MB内存。
通过这两个参数的组合，Docker为我们提供了从“严格控制”到“弹性管理”的内存限制能力。然而，仅仅在容器层面做了限制还不够，容器内的应用程序，特别是像JVM这样自己管理内存的“大家伙”，是否能正确地“感知”到这些限制，就成了下一个关键问题。

*   **JVM在容器中的内存感知问题**
    *   早期JDK版本：无法识别Cgroup限制，错误地读取宿主机内存信息。
    *   新版JDK的改进：增加`UseCGroupMemoryLimitForHeap`等参数，让JVM能够感知到容器的真实内存限制。

### 3. 问题根因分析
*   **GC线程创建失败的原因**:
    1.  旧版JVM启动时，根据宿主机内存（而非Cgroup限制）计算出一个过大的默认堆内存（Heap）。
    2.  堆内存几乎占满了容器的所有虚拟内存空间。
    3.  当JVM尝试创建新的GC线程时，无法申请到足够的栈空间（Stack），导致线程创建失败。
*   **`ulimit`导致崩溃的原因**:
    *   `ulimit`尝试修改的资源限制（如`stack size`）与Cgroup的限制发生冲突。
    *   在某些旧版本的Docker和内核中，这种冲突会引发内核层面的错误，导致容器异常退出。

### 4. 解决方案与验证
*   **方案一：显式配置JVM内存**
    *   通过`-Xmx`, `-Xms`等参数，手动为JVM设置一个合理的堆大小。
    *   使用新版JDK，并开启`-XX:+UseCGroupMemoryLimitForHeap`和`-XX:MaxRAMPercentage`，让JVM自动适应容器环境。
*   **方案二：升级基础设施**
    *   升级Docker和Linux内核，获取更稳定、更完善的Cgroup支持。
*   **方案三：特权模式（不推荐）**
    *   分析`--privileged`为何能“解决”问题：它本质上是绕过了Cgroup的限制，赋予了容器几乎等同于宿主机的权限，也带来了安全风险。

### 5. 追本溯源：比对Docker的改动
*   **目标**: 验证我们的猜想。
*   **方法**:
    *   查阅相关Docker版本的Release Notes和代码提交记录。
    *   寻找与Cgroups、内存管理、`ulimit`相关的修复和改进。
    *   将官方的改动与我们的问题分析进行比对，形成闭环。

### 6. 总结与思考
*   容器化环境中运行JVM的最佳实践。
*   深入理解底层技术（如Cgroups）对于解决复杂问题的重要性。


