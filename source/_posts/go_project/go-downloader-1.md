---
title: 从零开始的golang编程（day1）
date: 2023-9-3
tag:
  - go
  - home-center
  - go-downloader
  - 编程日志
---

> 第一天，完成go下载器的搭建

## 原型设计

首先我们要拆分问题，一个支持多任务，多分片，多协议，还能断点续传的下载器无疑是复杂的任务，一时半会儿想不出好的解决方案。所以先将问题拆分简化，刨除所有的定语，一个下载器首先要能发出请求，然后将收到的数据保存至文件，其次才是逐个完成定语对应的功能。

## 如何使用go完成http协议下载？

先写测试程序，目标：把baidu的首页html文件下载下来并保存到当前目录

```go
  func TestDownload(f *testing.T) {
    // 请求baidu首页
    resp, err := http.Get("http://www.baidu.com")
    if err != nil {
      fmt.Println("error", err)
    }
    // 不要忘记结束时关闭IO流
    defer func(Body io.ReadCloser) {
      err := Body.Close()
      if err != nil {
        fmt.Println("close error", err)
      }
    }(resp.Body)
    // 读取收到的数据
    body, err := io.ReadAll(resp.Body)
    if err != nil {
      fmt.Println("read failed", err)
    }
    // 写入文件
    err = WriteFile("./index.html", body)
    if err != nil {
      fmt.Println("=======failed=======")
      return
    }
    fmt.Println("=======finished=======")
  }

  func WriteFile(filePath string, content []byte) error {
    file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0666)
    if err != nil {
      fmt.Println("file: '" + filePath + "' open filed")
      return nil, err
    }
    defer func(file *os.File) {
      err := file.Close()
      if err != nil {
        return nil, err
      }
    }(file)
    write := bufio.NewWriter(file)
    if _, err := write.Write(content); err != nil {
      fmt.Println("file: '" + filePath + "' write failed")
      return nil, err
    }
    return nil
  }
```

至此我们已经可以将baidu的首页是保存至本地。但这代码既不支持断点续传，也不能多个分片并行，不能满足我们的要求。可是通过这段代码，我们得以明白，下载器的核心就是下载数据，然后写入指定的位置接。接下来，我们要逐步完善它。

## 实现断点续传

为什么先说断点续传，因为分片并行下载的前提就是支持断点续传

### http协议如何做到断点续传？

### 如何分片写入文件?
