---
category: Java
tag: JavaSE
date: 2016-11-30
title: Java 大小端
---

在计算机存储中是以字节(Byte, 8个bit)为单位进行存储的. 但是除了byte还有16位(2byte)的char, short, 32位(4byte)的int, 64位(8byte)的long等. 大小端就是为了解决在N个byte组成的新的存储单元中, byte的排列顺序.

* 大端模式 ：指数据的低位保存在内存的高地址中，而数据的高位，保存在内存的低地址中；
* 小端模式 ：指数据的低位保存在内存的低地址中，而数据的高位保存在内存的高地址中。

例如Short `0x1126`(10进制为4390), 大端为 `0x2611`, 小端为`0x1126` , 这二者表示的是同一个10进制数4390.

不同的主机采用了不同的字节序, 例如

* `x86，MOS Technology 6502，Z80，VAX，PDP-11`等处理器为Little endian。
* `Motorola 6800，Motorola 68000，PowerPC 970，System/370，SPARC`（除V9外）等处理器为Big endian。
* `ARM, PowerPC (除PowerPC 970外), DEC Alpha, SPARC V9, MIPS, PA-RISC and IA64`的字节序是可配置的。

TCP/IP协议隆重出场，RFC1700规定使用“大端”字节序为网络字节序，其他不使用大端的计算机要注意了，发送数据的时候必须要将自己的主机字节序转换为网络字节序（即“大端”字节序），接收到的数据再转换为自己的主机字节序


Java并非“都是大端”。
Java在语言层面上并未对字节序做规定——大小端那是实现细节。
JVM规范对Class文件的结构做了具体规定，确定其中的多字节数据采用大端的字节序：

> Chapter 4. The class File Format
>
> A class file consists of a stream of 8-bit bytes. All 16-bit, 32-bit, and 64-bit quantities are constructed by reading in two, four, and eight consecutive 8-bit bytes, respectively. Multibyte data items are always stored in big-endian order, where the high bytes come first. In the Java SE platform, this format is supported by interfaces java.io.DataInput and java.io.DataOutput and classes such as java.io.DataInputStream and java.io.DataOutputStream.

但要留意：Class文件只是Java程序的序列化形式；加载到内存之后JVM想怎样组织内存中的数据结构都没问题。之所以要规定清楚Class文件内的字节序，是为了在跨平台实现JVM时能确保JVM都知道要用大端方式来读取Class文件里的多字节数据，以保证跨平台兼容性。

以HotSpot VM在x86上为例。x86是一个原生使用小端的平台。HotSpot VM在该平台上读入Class文件时确实要做字节序转换，但这个转换只需要做一次——也就是在class loading / resolution时要把Class文件里的大端数据转换为内存中的小端数据，后面真正执行Java程序时内存里的数据都是用原生平台直接支持的小端形式存的。
例如说，一个Java的int，0x12345678，在x86上的HotSpot VM的内存里就是小端存储的，按单个字节来看它在内存里就是：

```
78 56 34 12
```

另外再放个例子：[JVM] 试试在32位HotSpot上跑这个？

所以说Class文件的大端数据对Java程序的执行性能有多少影响？几乎没有。

不过与此配套的，Java有些API设计是挺傻的——或者说为了跨平台兼容而“不近人情”。Java标准库所支持的序列化格式，跟Class文件一样，也是规定用大端方式存储多字节数据的。这就使得在x86上用Java自带的序列化/反序列化功能也要经过大小端转换。对此不爽的话就别用Java自带的序列化功能。

 本文摘自
 * [在 x86 上的 JVM 大小端转换有多少性能开销？ - RednaxelaFX的回答 - 知乎](https://www.zhihu.com/question/41263906/answer/91145060)
 * [“字节序”是个什么鬼？ 大端 小端 主机字节序 网络字节序](https://www.cnblogs.com/MYSQLZOUQI/p/5596690.html#:~:text=TCP%2FIP%E5%8D%8F%E8%AE%AE,%E5%B7%B1%E7%9A%84%E4%B8%BB%E6%9C%BA%E5%AD%97%E8%8A%82%E5%BA%8F%E3%80%82)