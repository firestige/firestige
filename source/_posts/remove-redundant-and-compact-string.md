---
title: 移除重复字符串和字符串压缩
date: 2023-6-20
tags:
- 字符串优化
- 内存优化
- Java
---
> *请注意：案例中关键信息已经被匿名化处理*

## 背景

上一轮质量改进分析内存堆栈发现，运行时堆内存会驻留大量重复字符串。一段长度20个ASCII字符的设备编码，在系统中最多可能出现m个内容相同的字符串实例（m是系统最大管理设备数量，量级：百万）。这造成堆内存空间极大浪费，大量的冗余数据将本该用于支撑业务运行的空间占用，导致系统的设备管理规格上不去，成本下不来，对友商的竞争力降低。
![原理展示，非实际数据]()

## 问题分析

### 为什么有重复

由于模块负责GB28181协议中目录树功能，有大量层次化数据，即目录和目录下的设备。这些数据会驻留在内存中共查询和修改，数据之间的关系通过`ParentID`以及`externalDomainID`来表示。下面是个3层目录的示意图：
![示意图]()
可以很明显看出，每个节点都会持有一个指向父节点和指向根节点的指针。这个指针实际使用以对应元素的id来表示并用String来保存。由于每次反序列化时都是创建一个新的String对象，所以堆内存中有多少个设备对象，就会有多少个重复的指向根节点的id，以及指向不同父节点的id。

### 还有没有其他问题

编码用String保存，还有没有优化空间呢？查看JDK8的源码，String对象内部使用char[]保存数据，而单个char使用16bit Unicode保存。[^1]
> char: The char data type is a single 16-bit Unicode character. It has a minimum value of `\u0000` (or 0) and a maximum value of `\uffff` (or 65,535 inclusive).

可是，按照**GB28181-2022附录E 统一编码规则**[^2]的描述，编码仅会使用0到9的数字。即编码中单个字符仅需要4bit, 即`\u0`到`\uf`，就可以表示。所以使用String保存编码，实际上会造成大量空间浪费，利用率只有25%。我们需要一种新的方法来存储编码。

## 解决方案

### 在JDK8的环境下，提供一种新的实现，降低设备编码在系统中内存占用

首先，我们要确立初步目标：

1. 不再使用String保存设备编码，采用自定义类型；
2. 新实现使用byte[]保存设备编码，采用的字符集编码单个字符占用空间应小于16bit。

现在让我们看看类似的情况，别人都做了哪些工作：

#### JEP 254: Compact Strings[^3]

实际上，早在JDK9，Java就实装了一项增强。JEP 254，压缩字符串，简单说来就是想办法用更节省空间的办法来表示字符串。参考原文描述

> We propose to change the internal representation of the String class from a UTF-16 char array to a byte array plus an encoding-flag field. The new String class will store characters encoded either as ISO-8859-1/Latin-1 (one byte per character), or as UTF-16 (two bytes per character), based upon the contents of the string. The encoding flag will indicate which encoding is used.
>
>String-related classes such as AbstractStringBuilder, StringBuilder, and StringBuffer will be updated to use the same representation, as will the HotSpot VM's intrinsic string operations.
>
>This is purely an implementation change, with no changes to existing public interfaces. There are no plans to add any new public APIs or other interfaces.
>
>The prototyping work done to date confirms the expected reduction in memory footprint, substantial reductions of GC activity, and minor performance regressions in some corner cases.
>
>For further detail, see:
>
> - [State of String Density Performance](http://cr.openjdk.java.net/~shade/density/state-of-string-density-v1.txt)
> - [String Density Impact on SPECjbb2005 on SPARC](http://cr.openjdk.java.net/~huntch/string-density/reports/String-Density-SPARC-jbb2005-Report.pdf)

从JDK9开始，String的内部实现会判断要表示的字符串能否用Latin-1编码，如果可以则使用Latin-1编码[^4]。Latin-1会占用8bit，刚好是UTF-16的一半。根据介绍，采用新的实现后证实内存使用量减少，GC活动大幅减少，以及某些极端情况下的性能轻微下降。

#### Netty: AsciiString

类似JEP254，其实高性能网络框架也对String有类似的改进。参考Netty对AsciiString类的注释：

> A string which has been encoded into a character encoding whose character always takes a single byte, similarly to ASCII. It internally keeps its content in a byte array unlike `String`, which uses a character array, for reduced memory footprint and faster data transfer from/to byte-based data structures such as a byte array and `ByteBuffer`. It is often used in conjunction with Headers that require a `CharSequence`.
>
> This class was designed to provide an immutable array of bytes, and caches some internal state based upon the value of this array. However underlying access to this byte array is provided via not copying the array on construction or `array()`. If any changes are made to the underlying byte array it is the user's responsibility to call `arrayChanged()` so the state of this class can be reset.

这里的AsciiString通常被用在Netty内部表示请求的报文头这一类只会使用英文字符，数字，一些常见标点符号如“*”、“/”等场景。使用ASCII编码可以减少内存占用，同时利用byte存储，还能在拷贝数据的时候减少操作，提高性能。

#### 我们怎么办?

看过别人的解决方案之后，我们认识到：使用`byte[]`代替`char[]`是正确的方向，但是我们需要关注如何编码`byte[]`的问题。

**为此，需要先确认一个字符可能出现多少种信息？** 参考GB28181的设计以及实际运行中的dump分析结果，再结合netty的实践，我们可以得出结论：使用新的设计表示设备编码、各种命令、报文头信息收益最大，因为这些场景的字符仅限于a-z，A-Z，0-9和一些常见字符，可能得取值不会超过80种。

**然后我们需要寻找一个合适的编码方式。** 一个字符有80种可能性，则基于公式：

{% katex '{"displayMode": true}'%}
S = \log_{2}N
{% endkatex %}

将N=80带入后可知，S≈6.32，即需要至少7个bit才能表示这个字符的所有可能性。但为了方便通过下标找到对应的字符，所以使用一个byte（即8bit）表示。此时我们既可以学JEP5254，使用Latin-1，也可以学Netty用ASCII编码。因为在我们的输入条件下，最终都会被编码成一个byte。实际实现中，为了简化编码，直接在byte中保存char。

参考代码如下：

```java
class DeviceID {

    private final byte[] value;

    private DeviceID(String id) {
        this.value = parse(id);
    }

    private static byte[] parse(String id) {
        byte[] value = new byte[id.length()];
        for (int i = 0; i < id.length(); i++) {
            char c = id.charAt(i);
            if (!Character.isLetterOrDigit(c)) {
                throw new IllegalArgumentException("unsupported id: " + id);
            }
            value[i] = (byte) c;
        }
        return value;
    }
}
```

### 借鉴领域驱动的概念解决大量重复问题

熟悉DDD（领域驱动设计）的朋友们肯定知道一个概念，**实体对象（EntityObject）**。实体对象在系统内是唯一的，不论属性如何变化。而在GB28181的体系内，设备的id类似身份证号，是设备的唯一标识。设备的属性如在线状态可能变化，但是只要设备不被替换，其id不能改变。所以如果我们重写模块中的反序列化组件，让相同编码都指向一个对象引用，就可以保证系统内部不再出现重复的编码对象。

这里我们对前面定义的DeviceID进行改造，内部新增一个缓存，用于记录系统内当前已有的DeviceID对象。当我们需要创建一个新的DeviceID时，先在缓存中查找是否已经创建值相同的DeviceID对象，如果有就返回已创建对象的引用，没有就创建个新的然后返回新创建对象的引用。

```java
final class DeviceID {
    private static final Map<String, DeviceID> referenceCache = new HashMap<>();
    
    private final byte[] value;

    private DeviceID(String id) {
        this.value = parse(id);
    }

    public static DeviceID of(String id) {
        return referenceCache.computeIfAbsent(id, new DeviceID(id));
    }
}
```

但这样设计存在几个问题：

1. 如前所述，String做key，空间利用太低，削弱了优化效果；
2. 当DeviceID对应的设备从系统中移除的时候，如何将DeviceID从缓存中驱逐；
3. HashMap实现不是线程安全的，并发调用getOrDefault的时候方法可能会空转不返回。
4. 由于DeviceID会作为key，每次进行比对都会求一遍哈希值，对性能有负面影响

**问题1**，使用DeviceID替代String作为key是个不错的选择。这里我们本身就要返回DeviceID，那么key只存放对象引用显然划算的多。同时还能利用重写的hashcode与equals方法找到重复的对象。

**问题2**，可以采用两种办法：1）使用引用计数器，要求开发人员在不使用某个DeviceID的时候显式调用release方法，定时扫描引用计数器，为0的时候从缓存中移除对应DeviceID对象；2）参考ThreadLocal的设计，利用**弱引用**的机制，在GC的时候自动完成对应数据的清理动作。

这里采用弱引用机制完成自动的数据清理动作。原因有3：

1. 引用计数器虽然逻辑简单，但是使用者必须在编写代码时记得释放，否则就会有泄露风险。旧代码改造变更太多，非常容易引入问题，也不利于代码检视。
2. ThreadLocal的泄露风险在此案例中不存在
3. 可以直接使用WeakHashMap，不需要额外代码

**问题3**，虽然换用了WeakHashMap，但它也是线程不安全的，这里可以利用Collections.synchronizedMap简单创建一个同步的map来解决问题。

**问题4**，因为DeviceID对象本身设计为不可变对象，所以可以提前计算哈希值并保存，重写hashcode方法，令其返回保存的哈希值即可解决。

完成修改后的参考代码如下：

```java
final class DeviceID implements CharSequence {
    private static final Map<DeviceID, WeakReference<DeviceID>> cache =
            Collections.synchronizedMap(new WeakHashMap<>());

    private final byte[] value;
    private final int hash;

    private DeviceID(String id) {
        this.value = parse(id);
        this.hash = hash(this.value);
    }

    private static byte[] parse(String id) {
        byte[] value = new byte[id.length()];
        for (int i = 0; i < id.length(); i++) {
            char c = id.charAt(i);
            if (!Character.isLetterOrDigit(c)) {
                throw new IllegalArgumentException("unsupported id: " + id);
            }
            value[i] = (byte) c;
        }
        return value;
    }

    private static int hash(byte[] value) {
        return Arrays.hashCode(value);
    }

    public static DeviceID of(String id) {
        DeviceID obj = new DeviceID(id);
        return cache.computeIfAbsent(obj, k -> new WeakReference<>(obj)).get();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DeviceID deviceID)) return false;
        return Arrays.equals(value, deviceID.value);
    }

    @Override
    public int hashCode() {
        return hash;
    }

    @Override
    public int length() {
        return this.value.length;
    }

    @Override
    public char charAt(int index) {
        return (char) this.value[index];
    }

    @Override
    public String subSequence(int start, int end) {
        return toString(start, end);
    }

    @Override
    public String toString() {
        return toString(0, length());
    }

    private String toString(int start, int end) {
        if (start < 0 || end > length() || start > end) {
            throw new IndexOutOfBoundsException();
        }
        StringBuilder sb = new StringBuilder();
        for (int i = start; i < end; i++) {
            sb.append((char) this.value[i]);
        }
        return sb.toString();
    }
}
```

## 实际效果

### 测试用例

下面将通过测试用例验证字符串压缩和缓存自动回收的结果。

```java
/**
 * 不GC，多次将值相同但不是同实例的字符串传入DeviceID.of方法，获得的DeviceID实例相同
 * */
@Test
void should_return_same_instance_after_create() {
    String code1 = "01010020002001234567";
    String code2 = new String(code1);
    assertNotEquals(System.identityHashCode(code1), System.identityHashCode(code2));
    DeviceID id = DeviceID.of(code1);
    int first = System.identityHashCode(id);
    id = DeviceID.of(code2);
    int second = System.identityHashCode(id);
    assertEquals(first, second);
}

/**
 * 一段字符串实例，创建DeviceID对象后移除强引用，然后GC，再次使用该字符串创建DeviceID对象，两次得到的DeviceID对象是不同实例
 * */
@Test
void should_return_new_instance_after_gc() {
    String code = "01010020002001234567";
    DeviceID id = DeviceID.of(code);
    int first = System.identityHashCode(id);
    id = null;
    System.gc();
    id = DeviceID.of(code);
    int second = System.identityHashCode(id);
    assertNotEquals(first, second);
}

@Test
void should_be_thread_safe_when_create_in_multi_thread() {
    Callable<List<DeviceID>> callable = () -> Stream.generate(UUID::randomUUID)
            .map(UUID::toString)
            .distinct()
            .limit(100)
            .map(DeviceID::of)
            .toList();
    ExecutorService executor = Executors.newFixedThreadPool(10);
    List<Callable<List<DeviceID>>> tasks = Stream.generate(() -> callable).limit(10).toList();
    await().atMost(Duration.ofSeconds(2)).untilAsserted(() -> {
        List<Future<List<DeviceID>>> futures = executor.invokeAll(tasks);
        futures.forEach(future -> assertTrue(future.isDone()));
    });
    executor.shutdown();
}
```

特殊的：下面这个用例只有在未包含JEP254的jdk8及老版本才能执行成功

```java
@Test
void size_should_less_than_string() {
    String code = "01010020002001234567";
    DeviceID id = DeviceID.of(code);
    System.out.println(GraphLayout.parseInstance(code).toFootprint());
    System.out.println(GraphLayout.parseInstance(id).toFootprint());
    assertTrue(GraphLayout.parseInstance(code).totalSize() > GraphLayout.parseInstance(id).totalSize());
}
```

在JDK8中会有如下输出，可以看到对20位编码，一个实例下新类可以降低20%的总内存占用

```console
java.lang.String@4f638935d footprint:
     COUNT       AVG       SUM   DESCRIPTION
         1        56        56   [C
         1        24        24   java.lang.String
         2                  80   (total)


io.firestige.iris.DeviceID@7c417213d footprint:
     COUNT       AVG       SUM   DESCRIPTION
         1        40        40   [B
         1        24        24   io.firestige.iris.DeviceID
         2                  64   (total)
```

当code的长度变为40时（实际使用中有时会将设备编码和域编码拼接），新的类可以节省33.33%内存空间

```console
java.lang.String@4f638935d footprint:
     COUNT       AVG       SUM   DESCRIPTION
         1        96        96   [C
         1        24        24   java.lang.String
         2                 120   (total)


io.firestige.iris.DeviceID@7880cdf3d footprint:
     COUNT       AVG       SUM   DESCRIPTION
         1        56        56   [B
         1        24        24   io.firestige.iris.DeviceID
         2                  80   (total)
```

即随着字符串越来越长，对象头占用空间对实例占用内存的贡献降低，新类的压缩率会逐渐上升，最终可以节省接近50%内存空间。

### dump对比

通过dump的分析结果，我们可以很明显的看到总的内存占用降低，重复字符串的消失。

## Reference

[^1]: [The Java™ Tutorials](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html#:~:text=char%3A%20The%20char%20data%20type,'%20(or%2065%2C535%20inclusive)).
[^2]: [GB/T 28181-2022, 公共安全视频监控联网系统信息传输、交换、控制技术要求](https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=8BBC2475624A6C31DC34A28052B3923D)
[^3]: [JEP 254: Compact Strings](https://openjdk.org/jeps/254)
[^4]: [ISO/IEC 8859-1/Latin-1](https://en.wikipedia.org/wiki/ISO/IEC_8859-1)