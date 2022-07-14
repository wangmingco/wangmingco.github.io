---
category: 编程语言
tag: PHP
title: PHP 加密 Http 发送
date: 2018-05-28 20:43:00
---

```php
<?php
$messageData = "{'accountname':'张晓','accountno':'6208293748','amount':'0.01','merchantcode':'app','bankcode':'102'}";

$messageKey = "r79h90m2AD9A4c6C";

$cert =
"-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCpxURQsvBaJgPq+Z/12ZU/4Wdc75INS9H6rAyc
Q545Zi7nc+zDCkxUrljWPTILD133+shqK8sTu0Xbp8en/wSpGCqbb5uiKOSYvjSzr2Ka6wDnSIMt
k4+HWgDkydu+aznTXUd0RaZzcZnF4Kk6/GwqoeKwdR9Rr3J8NXyTtUtSywIDAQAB
-----END PUBLIC KEY-----";

$key = openssl_pkey_get_public($cert);
$crypted = "";

openssl_public_encrypt($messageKey, $crypted, $cert);
$encryptkey = base64_encode($crypted);

$data = base64_encode(openssl_encrypt($messageData, 'aes-128-ecb', $messageKey, OPENSSL_PKCS1_PADDING));

$post_data = array(
"data" =>$data,
"encryptkey" => $encryptkey,
"merchantcode" => "app"
);

$curl = curl_init();
//设置抓取的url
curl_setopt($curl, CURLOPT_URL, 'http://api.server.beta/api/v2/pay/');
//设置头文件的信息作为数据流输出
curl_setopt($curl, CURLOPT_HEADER, 1);
//设置获取的信息以文件流的形式返回，而不是直接输出。
curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
//设置post方式提交
curl_setopt($curl, CURLOPT_POST, 1);
curl_setopt($curl, CURLOPT_POSTFIELDS, $post_data);
//执行命令
$data = curl_exec($curl);
//关闭URL请求
curl_close($curl);
//显示获得的数据
print_r($data);
?>

```
