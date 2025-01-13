@echo off
REM 删除现有的 docs 文件夹
rmdir /s /q docs

REM 生成 Hexo 站点
hexo generate

REM 将 public 文件夹重命名为 docs
move public docs