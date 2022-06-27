---
category: 杂文
title: Protobuf lua 64int 报错
date: 2017-03-10
---

报错结构体
```protobuf
message C2S_EquipCompose{
    required int32 itemMetaItemID = 1;
    repeated MsgItemInfo consumeItems = 2; //消耗装备
}

message MsgItemInfo {
    optional int64 itemGUID = 1 [default = 0]; // 物品唯一ID
    optional int32 itemCount = 2 [default = 0]; // 叠加数量
    optional int32 metaItemID = 3 [default = 0]; // 静态数据ID
    optional int32 enhanceLevel = 4 [default = 0]; // 物品强化等级
    optional int32 affinageLevel = 5 [default = 0]; // 物品精炼等级
    optional int64 overdueTime = 6 [default = 0]; // 物品过期时间
    optional int32 lucky = 7 [default = 0]; // 幸运值
    optional string appearance = 8 [default = ""]; // 外观,物品表id组成的字符串(采用英文 , 分割)
    optional string polish = 9 [default = ""]; // 洗练属性
}
```

在lua端, 当consumeItems数组含有数据, 且数据itemGUID有数据时, java服务器在解析时报错

```java
com.google.protobuf.InvalidProtocolBufferException: While parsing a protocol message, the input ended unexpectedly in the middle of a field.  This could mean either than the input has been truncated or that an embedded message misreported its own length.

    at com.google.protobuf.InvalidProtocolBufferException.truncatedMessage(InvalidProtocolBufferException.java:70)
    at com.google.protobuf.CodedInputStream.readRawBytes(CodedInputStream.java:789)
    at com.google.protobuf.CodedInputStream.readBytes(CodedInputStream.java:329)
    at com.google.protobuf.UnknownFieldSet$Builder.mergeFieldFrom(UnknownFieldSet.java:484)
    at com.google.protobuf.GeneratedMessage.parseUnknownField(GeneratedMessage.java:193)
    at com.xxx.commons.msg.proto.ClientItemMessage$C2S_GemCompose.<init>(ClientItemMessage.java:23509)
    at com.xxx.commons.msg.proto.ClientItemMessage$C2S_GemCompose.<init>(ClientItemMessage.java:23467)
    at com.xxx.commons.msg.proto.ClientItemMessage$C2S_GemCompose$1.parsePartialFrom(ClientItemMessage.java:23555)
    at com.xxx.commons.msg.proto.ClientItemMessage$C2S_GemCompose$1.parsePartialFrom(ClientItemMessage.java:23550)
    at com.google.protobuf.AbstractParser.parsePartialFrom(AbstractParser.java:104)
    at com.google.protobuf.AbstractParser.parseFrom(AbstractParser.java:128)
    at com.google.protobuf.AbstractParser.parseFrom(AbstractParser.java:133)
    at com.google.protobuf.AbstractParser.parseFrom(AbstractParser.java:49)
    at com.xxx.zone.TestProtobufParse.parse(TestProtobufParse.java:42)
    at com.xxx.zone.TestProtobufParse.testParse(TestProtobufParse.java:32)
    at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.lang.reflect.Method.invoke(Method.java:498)
    at org.junit.runners.model.FrameworkMethod$1.runReflectiveCall(FrameworkMethod.java:47)
    at org.junit.internal.runners.model.ReflectiveCallable.run(ReflectiveCallable.java:12)
    at org.junit.runners.model.FrameworkMethod.invokeExplosively(FrameworkMethod.java:44)
    at org.junit.internal.runners.statements.InvokeMethod.evaluate(InvokeMethod.java:17)
    at org.junit.runners.ParentRunner.runLeaf(ParentRunner.java:271)
    at org.junit.runners.BlockJUnit4ClassRunner.runChild(BlockJUnit4ClassRunner.java:70)
    at org.junit.runners.BlockJUnit4ClassRunner.runChild(BlockJUnit4ClassRunner.java:50)
    at org.junit.runners.ParentRunner$3.run(ParentRunner.java:238)
    at org.junit.runners.ParentRunner$1.schedule(ParentRunner.java:63)
    at org.junit.runners.ParentRunner.runChildren(ParentRunner.java:236)
    at org.junit.runners.ParentRunner.access$000(ParentRunner.java:53)
    at org.junit.runners.ParentRunner$2.evaluate(ParentRunner.java:229)
    at org.junit.runners.ParentRunner.run(ParentRunner.java:309)
    at org.junit.runner.JUnitCore.run(JUnitCore.java:160)
    at com.intellij.junit4.JUnit4IdeaTestRunner.startRunnerWithArgs(JUnit4IdeaTestRunner.java:68)
    at com.intellij.rt.execution.junit.IdeaTestRunner$Repeater.startRunnerWithArgs(IdeaTestRunner.java:51)
    at com.intellij.rt.execution.junit.JUnitStarter.prepareStreamsAndStart(JUnitStarter.java:237)
    at com.intellij.rt.execution.junit.JUnitStarter.main(JUnitStarter.java:70)
    at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.lang.reflect.Method.invoke(Method.java:498)
    at com.intellij.rt.execution.application.AppMain.main(AppMain.java:147)
```

为了测试这个问题, 我们添加了一些测试的protobuf消息

```
package message;
option java_package = "com.xxx.commons.msg.proto";
option java_outer_classname = "ClientTestMessage";
import "MsgData.proto";

message C2S_OneUint64 {
    required uint64 createrGUID = 1;
}

message C2S_ArrayUint64 {
    repeated uint64 createrGUID = 1;
}

message C2S_ArrayWrapUint64 {
    repeated Uint64Wrap ids = 1;
}

message Uint64Wrap {
    optional uint64 createrGUID = 1;
}

message C2S_ArrayWrapUint64Ex {
    repeated Uint64WrapEx ids = 1;
}

message Uint64WrapEx {
    optional uint64 createrGUID = 1;
    optional string str= 2;
}
```

发现C2S_OneUint64 和 C2S_ArrayUint64都是ok的, 但是 C2S_ArrayWrapUint64 和 C2S_ArrayWrapUint64Ex都会产生异常

在结构体 里使用fixed64就解决这个问题.

这是因为lua只支持32位的int ,所以它底层在编译protobuf的时候, 就是按照32位处理的, 但是服务器在解析的时候,是按照64位处理的, 导致那个protobuf的tag错误  