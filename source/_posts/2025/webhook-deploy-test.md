---
title: Webhook 自动部署验证
date: 2026-03-06
tags:
  - 运维
---

这是一篇用于验证 GitHub Actions → Webhook → ECS 自动部署链路的测试文章。

如果你能在网站上看到这篇文章，说明整个自动化部署链路工作正常。

<!-- more -->

## 部署链路

```
PR merge → GitHub Actions 编译 → 推送 blog 分支 → Webhook 通知 ECS → git fetch + rsync → Nginx 更新
```
