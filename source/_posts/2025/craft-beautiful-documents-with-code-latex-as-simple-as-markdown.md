---
title: 用代码打造精美文档：像Markdown一样简单的LaTeX
date: 2025-03-04 12:00:00
tag:
  - latex
  - 排版
------
**「当你厌倦了在Word里手动调整格式到凌晨三点，当毕业论文的页眉页码像多米诺骨牌一样连环错位，或许该试试这个学术界『隐形规则』——用代码写文档的艺术：LaTeX。」**​

无论你是被导师要求「必须用LaTeX」，还是单纯受够了传统排版软件的反复无常，这篇指南将带你：
✅ 5分钟在Windows/macOS搭建LaTeX「瑞士军刀」环境（附避坑清单）
✅ 用三行代码解锁中文支持，告别方框乱码的绝望时刻
✅ 插入图表像发朋友圈一样简单：坐标轴、流程图、论文级数据可视化
✅ 偷师学术大牛的排版秘笈：直接套用清华/IEEE等官方模板文档类

从第一行\documentclass{article}到生成打印店老板都夸专业的PDF，你会发现：​用纯文本控制每一毫米的页边距，比鼠标拖拽格式高效得多——毕竟，代码不会在你按下回车键时突然把参考文献变成表情符号😉

（P.S. 文末附赠「LaTeX防秃指南」：VSCode智能补全配置+中国镜像加速指令，教你把编译时间从10秒砍到1秒内。准备好了？Let's LaTeX!）

## 「LaTeX防秃指南」

### 🇨🇳 中国镜像加速（TeX Live/MacTeX适用）​##

```powershell
# 终端执行（Windows用管理员权限打开cmd/powershell）
tlmgr option repository https://mirrors.ustc.edu.cn/CTAN/systems/texlive/tlnet/
tlmgr update --self --all
```

效果：包下载速度从10KB/s飙升到10MB/s，告别tlmgr: Remote repository is newer than local的玄学错误

### ⚡VSCode智能补全配置
​
安装扩展：搜索并安装 LaTeX Workshop + Code Spell Checker（防\secion这种手残错误）
​配置自动编译​（在.vscode/settings.json添加）：

```json
{
  "latex-workshop.latex.autoBuild.run": "onFileChange",
  "latex-workshop.latex.tools": [
    {
      "name": "latexmk",
      "command": "latexmk",
      "args": ["-synctex=1", "-interaction=nonstopmode", "-file-line-error", "-pdf", "%DOC%"]
    }
  ]
}
```

​代码片段：在VSCode按Ctrl+Shift+P → Preferences: Configure User Snippets → 选latex.json → 粘贴：

```json
{
  "Equation": {
    "prefix": "eq",
    "body": ["\\begin{equation}", "    ${1:equation}", "\\end{equation}"]
  }
}
```

效果：输入eq自动生成公式环境，Ctrl+Alt+V实时预览PDF，编译日志直接嵌入编辑器

### 🚀 进阶提速（Windows版命令）​

适用条件：已安装TeX Live且能执行latexmk --version

#### ​方案一：CMD命令（传统命令提示符）​

```cmd
echo $pdflatex = "pdflatex -synctex=1 -interaction=nonstopmode %%O %%S" > "%USERPROFILE%\.latexmkrc"
echo $max_repeat = 3; >> "%USERPROFILE%\.latexmkrc"
```

注：%%是为了转义CMD的百分号，直接复制执行即可

#### ​方案二：PowerShell命令（推荐）​

```powershell
"`$pdflatex = 'pdflatex -synctex=1 -interaction=nonstopmode %O %S'; `$max_repeat = 3;" | Out-File -Encoding UTF8 "$env:USERPROFILE\.latexmkrc"
```

注：反引号` 转义$符号，-Encoding UTF8 防止乱码

**​效果验证**
打开终端执行：latexmk -v
如果看到Maximum iterations: 3 表示配置成功
编译时若临时文件冲突，latexmk会自动重试3次，无需手动清空aux文件

**​给初学者的操作图示**
​CMD用户：Win+R → 输入cmd → 回车 → 粘贴上方CMD命令 → 回车
​PowerShell用户：Win+X → 选Windows Terminal → 粘贴PowerShell命令 → 回车
​文件位置：配置会自动保存到C:\Users\[你的用户名]\.latexmkrc（隐藏文件需开启资源管理器显示隐藏项目）
需要制作分步截图或视频演示可随时告知，避免新手路径错误~