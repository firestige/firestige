---
title: Java.util中的容器——List篇
date: 2024-06-10 16:41:00
tag:
  - 每日一篇
  - Java
  - 源码分析
---
## 继承结构

![类图](/img/java-keypoints/List.svg)

> 为什么ArrayList、Vector、LinkedList在继承了AbstractList之后还要再次申明实现了List接口呢？这是不是一种多余的行为？
> 就目前的结果而言确实多余，但是在util里所有的容器中，他们都采用了类似的写法。而且就我所知Josh Bloch没有解释为什么，所以这个问题可能没有官方解释。
> 我的理解是：在类定义中再次实现接口而不是通过继承抽象类获得接口的继承关系，意味着子类和接口有着明确的关系，不因父类的变化而变化。这在业务代码中是没哟意义的，但是作为标准库使用时就变得非常有必要，这样做可以避免修改的扩散。

## ArrayList

## LinkedList
