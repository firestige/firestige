# Copilot Instructions

## 文章维护工作流

当用户表达**维护文章**的意图时（包括但不限于：写文章、新建博文、修改文章、删除文章、更新内容等），自动执行以下流程：

### 开始阶段

1. 确认当前在 `master` 分支，如不在则切换
2. 执行 `git pull` 同步最新代码
3. 基于用户意图推断分支名，格式为 `post/<slug>`（slug 用英文小写短横线命名）
4. 创建并切换到新分支
5. 告知用户分支已就绪，可以开始编辑

### 结束阶段

当用户表达**完成修改**的意图时（包括但不限于：完成了、提交吧、发布、ok 了等），自动执行：

1. `git add` 所有变更文件
2. `git commit`，message 格式：
   - 新文章：`post: <文章标题>`
   - 修改文章：`update: <文章标题>`
   - 删除文章：`remove: <文章标题>`
3. `git push`
4. `gh pr create --base master --title "<commit message>" --body ""`
5. `gh pr merge --merge --delete-branch --admin`
6. 切换回 `master` 并 `git pull`

### 文章规范

- 新文章放在 `source/_posts/2025/` 目录下（按当年年份）
- 文件名使用英文小写短横线命名，如 `my-new-post.md`
- Front-matter 模板：

```markdown
---
title: 文章标题
date: YYYY-MM-DD
tags:
  - 标签
---

摘要内容

<!-- more -->

正文内容
```
