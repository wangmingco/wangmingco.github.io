@echo off

REM 生成 Hexo 站点
hexo generate

REM 删除现有的 docs 文件夹
del docs

REM 将 public 文件夹重命名为 docs
move public docs

del docs/bj.js
del docs/bjb.html
del docs/bjg.html

copy source/bj.js docs/bj.js
copy source/bjb.html docs/bjb.html
copy source/bjg.html docs/bjg.html