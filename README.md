版本信息
```
➜  BlogSpace git:(master) ✗ hexo -version
INFO  Validating config
hexo: 5.4.0
hexo-cli: 4.3.0
os: darwin 19.5.0 10.15.5

node: 16.13.0
v8: 9.4.146.19-node.13
uv: 1.42.0
zlib: 1.2.11
brotli: 1.0.9
ares: 1.17.2
modules: 93
nghttp2: 1.45.1
napi: 8
llhttp: 6.0.4
openssl: 1.1.1l+quic
cldr: 39.0
icu: 69.1
tz: 2021a
unicode: 13.0
ngtcp2: 0.1.0-DEV
nghttp3: 0.1.0-DEV
```

hexo 命令
```
运行
hexo server
生成
hexo generate
```

换主题需要在主题的head里添加搜索引擎爬取标记
```
<!-- google 爬取标记 -->
<meta name="google-site-verification" content="aH2bcbMuMlpfF61i9p--iBH54wvMywGXfWg8U6RpxFA" />
<!-- bing 爬取标记 -->
<meta name="msvalidate.01" content="CBAB9A13FF212142D6C250D9C0D31F28" />
```