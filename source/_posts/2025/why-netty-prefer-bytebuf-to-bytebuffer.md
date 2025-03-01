---
title: 为什么Netty宁可自己实现ByteBuf也不愿意使用ByteBuffer
date: 2025-02-28 19:00:00
tag:
  - netty
  - 网络编程
  - 面试
---
> 面试遇到个题目，“为什么Netty宁可自己实现ByteBuf也不愿意使用ByteBuffer”
> 正常说来就是引用计数好回收和大小可变，可是面试官提出不同的看法，热烈讨论一番之后我们谁也不能说服谁。
> 虽然面试黄了但总结不能少，不能及时拿出成体系的论据证明自己的观点，还是平时还是过于怠惰。

## 1. 接口差异

先看二者的接口差异，找到netty到底比jdk自带的ByteBuffer多做了哪些事情

### 1.1. 实例化

`ByteBuffer`主要通过静态方法进行内存分配，有堆内和对外两种模式。

```java
import java.nio.ByteBuffer;

// 分配堆内缓冲区
ByteBuffer heapBuffer = ByteBuffer.allocate(1024);
// 分配堆外缓冲区
ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
```

`ByteBuf`主要通过`Unpooled`工具类创建，也可以使用`PooledByteBufAllocator`在池化的内存空间中创建`ByteBuf`，避开系统反复开辟和回收的开销。

```java
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.buffer.PooledByteBufAllocator;

// 创建非池化的堆内存 ByteBuf
ByteBuf heapByteBuf = Unpooled.buffer(1024);
// 创建非池化的直接内存 ByteBuf
ByteBuf directByteBuf = Unpooled.directBuffer(1024);

// 获取池化的 ByteBuf 分配器
PooledByteBufAllocator allocator = PooledByteBufAllocator.DEFAULT;
// 分配一个池化的 ByteBuf 实例
ByteBuf byteBuf = allocator.buffer(1024);
try {
    // 使用 ByteBuf
    byteBuf.writeByte(1);
    System.out.println("ByteBuf 写入成功");
} finally {
    // 释放 ByteBuf
    byteBuf.release();
}
```

从对象创建角度来看，两者区别不大。Netty额外提供了池化的内存分配工具。

### 1.2. 读写操作

`ByteBuffer`需要手动调用`filp()`方法从写模式切换到读模式，调用`clear()`或`compact()`方法从读模式切换到写模式

```java
ByteBuffer buffer = ByteBuffer.allocate(10);
buffer.put((byte) 1); // 写操作
buffer.flip(); // 切换到读模式
byte value = buffer.get(); // 读操作
buffer.clear(); // 切换回写模式
```

`ByteBuf`读写模式分离，有独立的读索引和写索引，不需要切换模式，操作更简单。

```java
ByteBuf byteBuf = Unpooled.buffer(10);
byteBuf.writeByte(1); // 写操作
byte readValue = byteBuf.readByte(); // 读操作
```

从读写方面来看，`ByteBuffer`操作繁琐，由于只有一个索引，读和写需要调用`filp()`或者`clear()`切换，编写代码容易出错。

### 1.3. 容量管理

`ByteBuffer`容量固定，一旦分配不能动态扩展，需要创建新的`ByteBuffer`实例然后手动复制数据至新的实例。

```java
ByteBuffer original = ByteBuffer.allocate(10);
// 如果需要更大容量，需要重新分配
ByteBuffer newBuffer = ByteBuffer.allocate(20);
original.flip();
newBuffer.put(original);
```

`ByteBuf`容量可以通过`ensureWritable(int minWritableBytes)`方法保证有足够空间写入数据，如果不够，会自动扩展不需要手动复制。

```java
ByteBuf byteBuf = Unpooled.buffer(10);
byteBuf.ensureWritable(20); // 确保有 20 字节的可写空间
```

这里比较有意思的是`ByteBuf`根据实现会提供不同的行为，主要看`capacity()`的具体实现。比如`UnpooledDirectByteBuf`在实际扩容时依然进行了复制，但是`PooledByteBuf`由于使用池化资源，仅移动了计数器。可以看到，`ByteBuf`通过暴露的接口可以方便的调整大小而不用手动复制，比起`ByteBuffer`使用更为便捷。

### 1.4. 垃圾回收

`ByteBuffer`依赖垃圾回收，堆外的直接内存需要手动调用`java.lang.ref.Cleaner`进行释放(cleaner并不堆外暴露清除直接内存的方法)，或者等待ByteBuffer不再被引用后在某个时段被GC回收。

`ByteBuf`使用引用计数来管理内存，通过`retain()`方法来增加引用计数，`release()`方法减少引用计数。当计数为0时，会自动释放。

```java
ByteBuf byteBuf = Unpooled.buffer(10);
byteBuf.retain(); // 增加引用计数
byteBuf.release(); // 减少引用计数
```

### 1.5. 切片与复制

`ByteBuffer`通过`slice()`方法创建的切片与原缓冲区共享底层数据，修改切片会影响原缓冲区

```java
ByteBuffer buffer = ByteBuffer.allocate(10);
ByteBuffer slice = buffer.slice();
slice.put((byte) 1); // 会影响原缓冲区
```

`ByteBuf`的切片和复制更灵活，`slice()`方法创建的切片同样共享底层数据，但`duplicate()`方法创建的副本也共享底层数据，而`copy()`方法创建的是独立的副本，修改副本不会影响原`ByteBuf`。

```java
ByteBuf byteBuf = Unpooled.buffer(10);
ByteBuf slice = byteBuf.slice();
ByteBuf copy = byteBuf.copy();
slice.setByte(0, 1); // 会影响原 ByteBuf
copy.setByte(0, 2); // 不会影响原 ByteBuf
```

## 2. 网络编程场景对比

### 2.1. 频繁数据读写

#### 2.1.1. 场景描述

在网络编程中，服务器需要不断接收客户端发送的数据并进行处理，同时也需要向客户端发送响应数据，数据的读写操作非常频繁。

#### 2.1.2. `ByteBuffer`的潜在风险

使用`ByteBuffer`需要确认当前读写模式，如果处于读模式，忘记调用filp()就会抛出异常。在业务复杂的情况下，容易出现难以察觉的编码失误，出错风险增加。

#### 2.1.3. `ByteBuf`的好处

采用读写分离的索引，不需要手动切换读写模式，代码更加简洁，减少了出错的可能性。

### 2.2. 数据量不确定的情况

#### 2.2.1. 场景描述

网络传输中，待接收的数据量往往不确定。例如在文件上传场景中，客户端上传的文件大小就不确定。再比如接收一段分成多个chunk发送的长报文，比如GB28181的设备目录，协议仅提供条目总数信息，并不能给出每个条目占用多大空间。此时需要动态处理不同大小的数据。

#### 2.2.2. `ByteBuffer`的问题

`ByteBuffer`的容量固定，一旦分配就无法动态扩展，如果数据量超过一开始开辟的大小，需要手动创建新的`ByteBuffer`对象并复制数据，这会增加内存开销和代码复杂度。

#### 2.2.3. `ByteBuf`的好处

`ByteBuf`可以通过`ensureWritable(int minWritableBytes)`方法动态扩展容量，当数据量超过当前容量时，会自动进行扩容，无需手动处理。尤其池化的`ByteBuf`没有创建新对象和数据复制的开销。

### 2.3. 高并发场景下的内存管理

#### 2.3.1. 场景描述

在高并发的网络编程中，会有大量的连接同时进行数据传输，每个连接都需要分配一定的内存来处理数据。如果内存管理不当，会导致内存泄漏或内存溢出。

#### 2.3.2. `ByteBuffer`的潜在风险

`ByteBuffer`的内存管理依赖于`Java`的垃圾回收机制，对于堆外内存如果不等待GC，还需要手动调用`Cleaner`进行释放。在高并发场景下，频繁的创建和销毁`ByteBuffer`会给垃圾回收带来很大压力，影响系统性能。

#### 2.3.3. `ByteBuf`的优势

`ByteBuf`采用引用计数机制，通过`retain()`和`release()`方法来管理内存。当一个`ByteBuf`不再使用时，只要其引用计数为0，就会立即释放内存，避免了垃圾回收的压力。在Netty中，还提供了池化的 `ByteBuf`分配器，可以复用`ByteBuf`实例，减少内存分配和释放的开销。

## 3. Netty 何时使用池化的`ByteBuf`

### 3.1. 高并发场景

在高并发的网络编程环境中，大量的连接会频繁地进行数据读写操作。每次创建和销毁`ByteBuf`会带来显著的内存分配和回收开销，这可能会成为系统性能的瓶颈。池化的`ByteBuf`可以通过复用已有的`ByteBuf`实例，减少内存分配和垃圾回收的压力，从而提高系统的性能和响应速度。
例如，在一个基于Netty构建的高并发服务器中，每秒可能会处理数千甚至数万个请求，每个请求都需要分配一定的内存来处理数据。使用池化的`ByteBuf`可以避免频繁的内存分配和回收操作，使得系统能够更高效地处理大量请求。

### 3.2. 内存资源紧张的场景

当系统的内存资源有限时，池化的`ByteBuf`可以更好地管理内存使用。通过复用`ByteBuf`实例，减少了内存碎片的产生，提高了内存的利用率。这对于一些资源受限的设备（如嵌入式系统）或者在云计算环境中需要严格控制内存使用的场景尤为重要。

### 3.3. 长连接场景

在长连接的网络应用中，客户端和服务器之间会保持长时间的连接，不断地进行数据传输。在这种情况下，使用池化的`ByteBuf`可以减少每次数据传输时的内存分配开销，提高连接的稳定性和性能。

## 总结

为什么Netty宁可自己实现ByteBuf也不愿意使用`ByteBuffer`呢？虽然没有机会直接询问作者，但是从源码入手可以明显感受到，jdk自带的`ByteBuffer`在使用上存在诸多不便，比如没有池化，回收条件苛刻等。netty作为网络框架需要更高效和便捷的工具，为此不得不额外增加大量设计。

对了，还有`ByteBuf`的容量是否可变的争论。从接口定义来看，是可变的。细纠实现，非池化的`ByteBuf`会创建新的数组并且复制数据，池化的`ByteBuf`仅会改变内部的计数器，没有其他副作用。
