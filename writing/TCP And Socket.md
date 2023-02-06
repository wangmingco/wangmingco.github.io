---
category: 网络
title: TCP Buffer
date: 2022-12-03 20:43:00
---

```
Linux VM-0-11-centos 3.10.0-1127.19.1.el7.x86_64 #1 SMP Tue Aug 25 17:23:54 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux
```

在Linux系统中，对TCP缓冲区的配置有如下参数
* `net.core.rmem_default = 212992`: socket 读缓冲区默认值(`208KB`)
* `net.core.rmem_max     = 212992`: socket 读缓冲区最大值(`208KB`)
* `net.core.wmem_default = 212992`: socket 写缓冲区默认值(`208KB`)
* `net.core.wmem_max     = 212992`: socket 写缓冲区最大值(`208KB`)
* `net.ipv4.tcp_wmem     = 4096   16384  4194304`: tcp 写缓冲区的最小值(`4KB`)，默认值(`16KB`)和最大值(`4MB`)
* `net.ipv4.tcp_rmem     = 4096   87380  6291456`: tcp 读缓冲区的最小值(`4KB`)，默认值(`8KB`)和最大值(`6MB`)
* `net.ipv4.tcp_mem      = 42456  56610  84912`: tcp 缓冲区的最小值(`41KB`)，默认值(`55KB`)和最大值(`82KB`)

```
[root@VM-0-11-centos]~# cat /proc/sys/net/core/rmem_default
212992
[root@VM-0-11-centos]~# cat /proc/sys/net/core/rmem_max
212992
[root@VM-0-11-centos]~# cat /proc/sys/net/core/wmem_default
212992
[root@VM-0-11-centos]~# cat /proc/sys/net/core/wmem_max
212992
[root@VM-0-11-centos]~# cat /proc/sys/net/ipv4/tcp_wmem
4096    16384   4194304
[root@VM-0-11-centos]~# cat /proc/sys/net/ipv4/tcp_rmem
4096    87380   6291456
```

