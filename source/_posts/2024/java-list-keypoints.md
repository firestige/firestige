---
title: Java.util中的容器——List篇
date: 2024-06-10 16:41:00
tag:
  - 每周一篇
  - Java
  - 源码分析
---
## 1. 继承结构

可以看到

![类图](/img/java-keypoints/List.svg)

> 为什么ArrayList、Vector、LinkedList在继承了AbstractList之后还要再次申明实现了List接口呢？这是不是一种多余的行为？
> 就目前的结果而言确实多余，但是在util里所有的容器中，他们都采用了类似的写法。而且就我所知Josh Bloch没有解释为什么，所以这个问题可能没有官方解释。
> 我的理解是：在类定义中再次实现接口而不是通过继承抽象类获得接口的继承关系，意味着子类和接口有着明确的关系，不因父类的变化而变化。这在业务代码中是没哟意义的，但是作为标准库使用时就变得非常有必要，这样做可以避免修改的扩散。

## 2. ArrayList

### 2.1. EMPTY_ELEMENTDATA和DEFAULTCAPACITY_EMPTY_ELEMENTDATA的关系

```java
    /**
     * Shared empty array instance used for empty instances.
     */
    private static final Object[] EMPTY_ELEMENTDATA = {};

    /**
     * Shared empty array instance used for default sized empty instances. We
     * distinguish this from EMPTY_ELEMENTDATA to know how much to inflate when
     * first element is added.
     */
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};
```

ArrayList定义了两个全局唯一的空对象数组用于表示空列表。其中`DEFAULTCAPACITY_EMPTY_ELEMENTDATA`仅用于使用无参构造器创建的空列表对象。其他场景下，都使用`EMPTY_ELEMENTDATA`来表示空列表。为什么要分别使用两个空数组，为何不更极致一些只用一个空数组呢？

答：为了精细化控制数组扩容长度。两者的分歧点在于`grow(int)`方法，使用无参构造器创建的列表在首次扩容时至少会被赋予10的长度。而通过反序列化、有参构造器创建出来的空数组，只会使用`EMPTY_ELEMENTDATA`，此时grow不受10的制约，会按照

### 2.2. 方法内联优化

在阅读源码时可以看到如下内容：

```java
public boolean add(E e) {
    modCount++;
    add(e, elementData, size);
    return true;
}

/**
 * This helper method split out from add(E) to keep method
 * bytecode size under 35 (the -XX:MaxInlineSize default value),
 * which helps when add(E) is called in a C1-compiled loop.
 */
private void add(E e, Object[] elementData, int s) {
    if (s == elementData.length)
        elementData = grow();
    elementData[s] = e;
    size = s + 1;
}
```

这个私有的add方法仅在add(E)中出现，注释中说明这么做的目的是为了让方法体的字节码小于35从而保证激活内联优化。那么，内联优化的原理是什么？

### 并发修改的判断

通过方法内final标记，以及独立的modcount计数器，数组长度来判断

## 3. LinkedList
