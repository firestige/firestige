---
title: 垃圾回收的算法与实现学习笔记——基本概念
date: 2023-10-11 16:41:00
tag:
  - GC
  - 学习笔记
  - 垃圾回收的算法与实现
---
## 对象

- 不同于OOP，这里的对象指的是应用程序使用的数据的集合。
- 对象配置在内存空间里。
- 对象时GC的基本运作单位

一般说来，对象由头（`Header`）和域（`Field`）构成

### 头

对象中保存对象本身信息的部分称为头，主要包含：
- 对象的大小
- 对象的种类

### 域

对象使用者在对象中可访问的部分称为域。

> 可以将域理解为java中class的成员变量，如
> class A {
>   int val;
> }
> 若有A的实例a，则a.val就是对象a的域

域的值有两种：
- 指针
- 非指针

指针就是执行啊内存空间中某块区域的值，C语言中有明确的指针类型，java则没有。对于没有暴露指针的语言，可以将其理解为引用

非指针值得是在编程过程中直接使用值本身，比如java中的int、bool等都是非指针。

## 指针

GC程序通过指针找到需要销毁或者保留对象，另一方面GC程序不处理非指针。

有两点需要注意：

- 程序是否能判别指针和非指针
- 指针会指向对象的哪个部分

## Mutator

如果说GC程序负责回收垃圾，那么mutator就是负责创建对象的程序

mutator实际进行的操作有以下两种：
- 生成对象
- 更新指针

## 堆

堆是用于动态存放对象的内存空间。当mutator申请存放对象时，所需内存空间会从这个堆中被分配给mutator。

## 活动对象/非活动对象

堆中能被mutator引用的对象称为“活动对象”；堆中不能通过遍历引用访问到的对象称为“非活动对象”。换言之，这些“非活动对象”就是“垃圾”。

>需要注意，成为垃圾的对象不能活过来，因为mutator再也找不到它。

## 分配

当mutator需要创建新对象时，就会向allocator申请一个大小合适的空间。而allocator在堆的可用空间中寻找满足要求的连续空间，并返回给mutator。

## 分块

分块（chunk）在这里指的是为利用对象而事分配好的单元。

初始状态下，堆被一个大的分块所占据

程序会根据mutator的要求把这个分块分割成合适的大小，作为（活动）对象使用。

内存里的各个区块都重复着分块-〉活动对象-〉垃圾（非活动对象）-〉分块-〉……这样的过程

## 根

根是指向对象的指针的“起点”部分。

## 评价标准

### 吞吐量

一般意义上，吞吐量指的是“在单位时间内的处理能力”。

即便是同一GC算法，其吞吐量也是受mutator的动作左右的。评价GC算法的吞吐量，有必要吧mutator的动作考虑在内。

### 最大暂停时间

最大暂停时间指的是“因执行GC而暂停执行mutator的最长时间”

> 不管尝试哪种GC算法，大吞吐量和低延迟不可兼得

### 堆使用率

左右堆使用效率的因素有二，对象头的大小和调度堆空间的算法。

> 不可能三角：堆使用效率，吞吐量和最大延迟不能兼顾

### 访问的局部性

根据局部性原理，把有引用关系的对象安排在堆中较近的位置可以提高读取效率，提高mutator的运行速度。