---
title: 如何实现高性能FIFO队列
date: 2025-02-28 20:00:00
tag:
  - 高性能
  - 高并发
  - DIY自己做
  - 面试
------

> 面试还遇到个题目，“如何实现高性能FIFO队列”
> 乍一听很唬人，实际上也是个纸老虎，重点在于拆解问题对症下药。

## 1. 问题分析

FIFO队列很简单，可以用LinkedList构建一个无界FIFO队列，或者用ArrayDeque构建一个有界队列，但他们是高性能的队列么？

回想一下队列的使用场景，队列用于连接生产者和消费者，帮助生产者和消费者解耦，可能的匹配模型有单生产者-单消费者，单生产者-多消费者，多生产者-单消费者，多生产者-多消费者。

当存在多个消费者或者生产者竞争时，就会涉及竞态条件问题，此时为了同步控制，必定有额外的系统开销，进而影响队列的吞吐量和延迟。所以高性能的目标是：

1. 低延迟
2. 高吞吐量
3. 线程安全

## 2. 设计要点

### 2.1. 无锁设计

存在竞态条件的前提下，为了实现同步控制，加锁是一种可行的方案，比如通过`ReentrantLock`控制入队和出队。但是锁竞争就意味着高延迟和低吞吐量，我们需要无锁的数据结构规避锁竞争成本。

### 2.2. 有界队列

同时为了规避频繁的对象创建和销毁操作带来的额外内存管理开销，我们需要一个有界队列。但有界队列需要额外的设计处理拥塞和饥饿问题，当队列满或者空时，生产者或者消费者需要等待或者被阻塞。

### 2.3. 批量操作优化

类似存储聚合IO写入换取高吞吐量，单次同步过程中转移的数据量越大，平摊到每一份数据的同步开销越小，对批量操作进行特殊优化也可以显著提高吞吐量。

### 2.4. 伪共享问题

由于CPU装载缓存时采用Cache line机制，现代CPU的多个核心同时访问连续空间的数据时有可能出现同一段数据在多个核心的Cache line中，不管其中哪一个数据修改，都会使得其他核心的Cache立即作废，需要重新访问，带来额外的数据加载开销。

## 3. 解决方案

### 3.1. 用RingBuffer搭建底座

由于FIFO的要求，队列的首尾元素一直在动。如果我们使用链表或者顺序表，前者面临不断创建和销毁Node的开销，后者需要不断移动整个队列元素，很难称得上高性能，但环形缓冲区仅需要移动首尾元素的标记即可实现FIFO。

```java
public class HighPerformanceFIFOQueue<T> {
    private final int capacity;
    private int count;

    private int head = 0;
    private int tail = 0;

    private final Object[] buffer;

    public HighPerformanceFIFOQueue(int capacity) {
        this.capacity = capacity;
        this.count = 0;
        this.buffer = new Object[capacity];
    }

    public boolean offer(E item){
        if (count == capacity) {
            return false;
        }
        final Object[] items = this.buffer;
        items[tail] = item;
        if (++tail == items.length) {
            tail = 0;
        }
        count++;
        return true;
    }

    public E poll() {
        final Object[] items = this.buffer;
        @SuppressWarnings("unchecked")
        E e = (E) items[head];
        items[head] = null;
        if (++head == items.length){
            head = 0;
        }
        count--;
        return e;
    }
}
```

### 3.2. 线程安全问题

接下来考虑线程安全问题，由于当前的实现没有保护，并发场景下head和tail的更新一定会出现竞态条件导致结果无法预测，最终程序出现预期之外的行为。

#### 3.2.1. 方案一：加锁

考虑到只有`offer()`和`poll()`方法需要修改head和tail，对`offer()`和`poll()`上锁即可满足线程安全要求。比如使用`synchronized`关键字:

```java
public boolean offer(E item){
    synchronized(this) {
        ...
    }
}
public E poll() {
    synchronized (this) {
        ...
    }
}
```

或者使用`ReentrantLock`，后面还能方便的设计阻塞功能。

```java
public class HighPerformanceFIFOQueue<T> {
    ...
    private final ReentrantLock lock;

    public HighPerformanceFIFOQueue(int capacity) {
        ...
        this.lock = new ReentrantLock(true);
    }

    public boolean offer(E item){
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            ...
        } finally {
            lock.unlock()
        }
    }

    public E poll() {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            ...
        } finally {
            lock.unlock()
        }
    }
}
```

恭喜，我们已经实现了ArrayBlockingQueue的核心逻辑。赶紧翻一翻源码，看看有什么不同？
> ABQ = ArrayBlockingQueue，HP = HighPerformanceFIFOQueue

|Benchmark                        |(capacity) | (consumers) | (producers) |  Mode  |  Score  |  Units  |
|---------------------------------|-----------|-------------|-------------|--------|---------|---------|
|HP.throughput                    |       1024|            4|            4|  thrpt |195.490  |ops/ms   |
|HP.throughput:throughputConsumer |       1024|            4|            4|  thrpt |97.748   |ops/ms   |
|HP.throughput:throughputProducer |       1024|            4|            4|  thrpt |97.741   |ops/ms   |
|ABQ.throughput                   |       1024|            4|            4|  thrpt |195.983  |ops/ms   |
|ABQ.throughput:throughputConsumer|       1024|            4|            4|  thrpt |98.132   |ops/ms   |
|ABQ.throughput:throughputProducer|       1024|            4|            4|  thrpt |97.851   |ops/ms   |

可以看到，两者因为同步机制相同，吞吐量也相同。但是这个吞吐量高么？如果我们不考虑FIFO，使用非公平锁会是什么结果？

|Benchmark                        |(capacity) | (consumers) | (producers) |  Mode  |  Score  |  Units  |
|---------------------------------|-----------|-------------|-------------|--------|---------|---------|
|HP.throughput                    |       1024|            4|            4|  thrpt |83856.887| ops/ms  |
|HP.throughput:throughputConsumer |       1024|            4|            4|  thrpt |61293.762| ops/ms  |
|HP.throughput:throughputProducer |       1024|            4|            4|  thrpt |22563.125| ops/ms  |
|ABQ.throughput                   |       1024|            4|            4|  thrpt |92083.911| ops/ms  |
|ABQ.throughput:throughputConsumer|       1024|            4|            4|  thrpt |73741.456| ops/ms  |
|ABQ.throughput:throughputProducer|       1024|            4|            4|  thrpt |18342.456| ops/ms  |

可以看到吞吐量有数量级程度的提升，但是看数值生产者和消费者缺不能匹配，这是因为offer方法中如果发现队列是空的就会立即返回，导致两边吞吐量不匹配。

**为什么公平锁对性能的影响这么严重？**

公平锁保证了线程获取锁的顺序是按照请求锁的先后顺序来进行的，也就是先到先得，在这里主要是对生产者而言需要公平才能保证FIFO。非公平锁不保证线程获取锁的顺序，当锁被释放时，任何一个等待的线程都有机会获取锁，而不是按照请求的先后顺序。

>设想一个电话客服排队场景，接线员就是消费者，客户是生产者。当客户电话请求超过接线员数量时出现生产者竞争，大家需要排队等待接线员接入。正常逻辑需要按照先来后到的原则排队，如果此时使用非公平锁，就可能出现客户A等了10分钟没有接通反而客户B等了2分钟就接通的情况，因为非公平锁不保证先来后到，在等待池的所有请求都有可能争抢到锁。

由于公平锁必须保证请求按照先来后到的顺序获得锁，所以为了维护请求顺序，必须有额外的资源用于排队和调度。而队列的读写使用同一把锁，所以两者必须交替进行。因此我们可以看到使用公平锁模式时生产者和消费者的吞吐量几乎一致，而频繁的唤醒、阻塞以及上下文切换也进一步拖慢了整体吞吐量。
所以要想实现高性能，就不能依赖基于ObjectMonitor的重量锁同步机制。其次，要考虑缩小锁的粒度，尽可能避免offer和poll操作互相争抢锁。

#### 3.2.2. 方案二：CAS自旋

回到开头，我们希望head和tail的更新可以分开，同时由于需要判断head和tail重合时RingBuffer为空还是满了的问题，需要保证可见性。
先使用原子类改造head和tail，利用CAS自旋解决同步问题。

```java
public class HighPerformanceFIFOQueue<E> {
    private final int capacity;

    // 将 head 和 tail 改造成原子类
    private final AtomicInteger head = new AtomicInteger(0);
    private final AtomicInteger tail = new AtomicInteger(0);

    private final Object[] buffer;

    public HighPerformanceFIFOQueue(int capacity) {
        this.capacity = capacity;
        this.buffer = new Object[capacity];
    }

    public boolean offer(E item) {
        int currentTail = tail.get();
        int nextTail = (currentTail + 1) % buffer.length;
        if (nextTail == head.get()) {
            // 队列已满
            return false;
        }
        buffer[currentTail] = item;
        tail.set(nextTail);
        return true;
    }

    public E poll() {
        if (head.get() == tail.get()) {
            // 队列为空
            return null;
        }
        int currentHead = head.get();
        @SuppressWarnings("unchecked")
        E e = (E) buffer[currentHead];
        buffer[currentHead] = null;
        head.set((currentHead + 1) % buffer.length);
        return e;
    }
}
```

基准测试结果如下：

|Benchmark                        |(capacity) | (consumers) | (producers) |  Mode  |  Score  |  Units  |
|---------------------------------|-----------|-------------|-------------|--------|---------|---------|
|HP.throughput                    |       1024|            4|            4|  thrpt |19352.535|ops/ms   |
|HP.throughput:throughputConsumer |       1024|            4|            4|  thrpt |11265.928|ops/ms   |
|HP.throughput:throughputProducer |       1024|            4|            4|  thrpt |8086.607 |ops/ms   |
|HP.throughput                    |       1024|           16|           16|  thrpt |14997.528|ops/ms   |
|HP.throughput:throughputConsumer |       1024|           16|           16|  thrpt | 7732.578|ops/ms   |
|HP.throughput:throughputProducer |       1024|           16|           16|  thrpt | 7264.950|ops/ms   |

可以看到，随着并发数的增加，整体吞吐量在下降，但仍然远远领先公平锁模式。可见频繁唤醒、阻塞以及上下文切换带来的影响之大。

### 3.3. 更进一步

如果我们只是需要验证设计思路，那到这里基本上已经可以收工了。但是我们肯定不能做这种浅尝辄止的事情，还记得前面提到的伪共享问题么？

#### 3.3.1. 消除伪共享

简单复习一下Cache Line的机制，CPU为了提高缓存命中率和使用效率，每次都会按行获取数据。考虑下面的情况：

> 由于`head`和`tail`二者在字节码文件中相近，会被放置在内存中靠近的位置，核心在装载缓存时会直接从主存中拉取一个Cache Line的数据，有可能同时把`head`和`tail`同时拉走。
> 核心0负责生产者，需要更新`tail`，而核心1负责消费者，需要更新`head`。当核心0更新时会作废核心1中一整个Cache Line的数据，导致核心1需要重新从主存读取数据。

上面这种情况，两个核心访问两个不同的变量，不产生竞态条件，但是依然表现出资源的互斥性看起来就像是共享资源一样，就是伪共享。

知道原理后解决起来也很简单，用无效数据填充空间，保证要访问的数据不会出现在同一个Cache Line中即可。现代x86架构CPU一个Cache Line通常是64B，arm架构CPU普遍是128B。
填充方法有很多种：

**1. 使用`@Contended`注解**
通过`sun.misc.Contended`可以由java自动完成填充工作，但是由于这是内部注解，从规范上来说它是不稳定的，并不承诺永远不变。所以虽然这种方法最简单，但我们不会采用。

**2. 手动填充**
手动填充通过插入无效数据填满Cache Line从而实现Cache Line对齐。
例如在本例中，我们期望`head`和`tail`在不同的缓存行，使用`long`填充，服务器是x86架构CPU预计填充到64B以上。

- 每个long类型占8字节，7个long字段共56字节
- 结合AtomicInteger（4字节）和对象头（8-16字节），确保head和tail分布在不同的缓存行

字段排列策略：

```java
// 内存布局示意图（64字节缓存行）：
[ head (4B) | 对象头 (12B) | p1-p7 (56B) ] → 4+12+56=72B（跨缓存行）
[ tail (4B) | p8-p14 (56B) | ... ] → 新的缓存行起始
```

**3.注意事项**
​JVM内存布局不确定性：

- 使用-XX:FieldsAllocationStyle=1强制字段顺序（HotSpot参数）
- 通过Unsafe.objectFieldOffset验证字段偏移量

​对象大小验证工具：

```bash
# 使用JOL工具分析对象布局
java -jar jol-cli.jar internals HighPerformanceQueue
```

**最终代码：**

```java
private final AtomicInteger head = new AtomicInteger(0);
private volatile long p1, p2, p3, p4, p5, p6, p7;
private final AtomicInteger tail = new AtomicInteger(0);
private volatile long p8, p9, p10, p11, p12, p13, p14, p15;
```

**基准测试结果**
可以看到对齐Cache Line之后，高并发情况下吞吐量有了明显改善。对齐Cache Line明显减少了伪共享导致的同步开销。

>未对齐Cache line
|Benchmark                        |(capacity) | (consumers) | (producers) |  Mode  |  Score  |  Units  |
|---------------------------------|-----------|-------------|-------------|--------|---------|---------|
|HP.throughput                    |       1024|            4|            4|  thrpt |19352.535|ops/ms   |
|HP.throughput:throughputConsumer |       1024|            4|            4|  thrpt |11265.928|ops/ms   |
|HP.throughput:throughputProducer |       1024|            4|            4|  thrpt |8086.607 |ops/ms   |
|HP.throughput                    |       1024|           16|           16|  thrpt |14997.528|ops/ms   |
|HP.throughput:throughputConsumer |       1024|           16|           16|  thrpt | 7732.578|ops/ms   |
|HP.throughput:throughputProducer |       1024|           16|           16|  thrpt | 7264.950|ops/ms   |
>
>对齐Cache Line
|Benchmark                        |(capacity) | (consumers) | (producers) |  Mode  |  Score  |  Units  |
|---------------------------------|-----------|-------------|-------------|--------|---------|---------|
|HP.throughput                    |       1024|            4|            4|  thrpt |18715.221|ops/ms   |
|HP.throughput:throughputConsumer |       1024|            4|            4|  thrpt |10845.742|ops/ms   |
|HP.throughput:throughputProducer |       1024|            4|            4|  thrpt |7869.480 |ops/ms   |
|HP.throughput                    |       1024|           16|           16|  thrpt |22896.964|ops/ms   |
|HP.throughput:throughputConsumer |       1024|           16|           16|  thrpt |12737.297|ops/ms   |
|HP.throughput:throughputProducer |       1024|           16|           16|  thrpt |10159.668|ops/ms   |

## 总结

至此，一个基础的具备高吞吐量低延迟的FIFO队列已经做好。可以看出问题被拆解之后并不复杂，重点是设计上做好取舍，然后动手做起来。相关代码已上传至GitHub，感兴趣可以前往元宝的百宝箱里获取。

通过这个实践，我们可以看到在追求高性能的过程中，其对场景的限制条件一定是越来越严格的。比如队列最好是有界的，强如disruptor也不提供无界队列。再比如Cache Line对齐，需要针对具体的硬件参数调整填充的长度，优化和硬件设计进行绑定。没有万灵药，大而全的设计往往意味着低效。设计的过程中要懂得取舍，集中力量解决关键问题，适合自己的才是最好的。
