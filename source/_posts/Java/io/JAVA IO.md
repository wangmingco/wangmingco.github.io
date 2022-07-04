---
category: Java
tag: Java IO
date: 2017-04-20
title: Java 输入输出IO API
---

## 读文件

### BufferedInputStream

我们使用FileInputStream, BufferedInputStream来读取文件
```java
// 读取二进制文件try (BufferedInputStream bf = new BufferedInputStream(
                new FileInputStream(new File("")));) {

        byte[] data = new byte[bf.available()];
        bf.read(data);

} catch (final IOException e) {
        e.printStackTrace();
}
```

BufferedInputStream是一个带有缓冲区域的InputStream, 支持mark()标记和reset()重置方法.输入到byte[]数组里.只将数据读取进byte字节数组里, 因此这种方式只能读取二进制字节流

FileInputStream 一个字节一个字节的从文件里读取数据

### BufferedReader

BufferedReader 从字符输入流中读取文本,缓冲各个字符.提供字符、数组和行的高效读取. 我们有俩种方式创建BufferedReader.
* 使用带缓冲区的写入器 Files.newBufferedReader(Paths.get("new.txt"), StandardCharsets.UTF_8);;
* 读取UTF-8格式编码的文件 new BufferedReader(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8))

InputStreamReader 是字节流通向字符流的桥梁：它使用指定的 charset 读写字节并将其解码为字符.将“字节输入流”转换成“字符输入流”.它继承于Reader.

```
BufferedReader reader = Files.newBufferedReader(Paths.get("new.txt"), StandardCharsets.UTF_8);
reader.lines().forEach(line -> System.out.println(line));
```

我们可以使用JAVA8中的Stream来快捷的遍历每一行

从标准IO中输入. 按照标准的IO模型,Java提供了System.out, System.out, System.err System.out,System.err 已经被包装成了PrintStream对象,但是System.in作为原生InputStream却没有进行过任何包装. 所以在使用System.in时必须对其进行包装,下例中展示了,我们使用InputStreamReader将System.in包装Reader,然后再包装一层BufferedReader

另外还有一点需要提到的是FileReader, 它一个字符一个字符地读取.

### LineNumberInputStream

此类是一个输入流过滤器,它提供跟踪当前行号的附加功能.行是以回车符 (\r)、换行符 (\n)或回车符后面紧跟换行符结尾的字节序列.在所有这三种情况下,都以单个换行符形式返回行终止字符.行号以 0 开头,并在 read 返回换行符时递增 1.

### LineNumberReader

跟踪行号的缓冲字符输入流.此类定义了方法 setLineNumber(int) 和 getLineNumber(),它们可分别用于设置和获取当前行号.默认情况下,行编号从 0 开始.该行号随数据读取在每个行结束符处递增,并且可以通过调用 setLineNumber(int) 更改行号.但要注意的是,setLineNumber(int) 不会实际更改流中的当前位置；它只更改将由getLineNumber()返回的值.可认为行在遇到以下符号之一时结束：换行符（\n）、回车符（\r）、回车后紧跟换行符.

```
//  获取行数int lineCount = 0;
try (FileReader reader = new FileReader(IOUtils.newFile(""));
                LineNumberReader lnr = new LineNumberReader(reader);) {
        while (lnr.readLine() != null) {
                lineCount++;
        }
} catch (final Exception e) {
        e.printStackTrace();
}
```

### RandomAccessFile

读写随机访问文件 RandomAccessFile除了实现了DataInput和DataOutput接口之外,有效地与IO继承层次结构的其他部分实现了分离.
因为它不支持装饰模式,所以不能将其与InputStream和OutputStream子类的任何部分组合起来而且必须假定RandomAccessFile已经被正确的缓冲
用来访问那些保存数据记录的文件的,你就可以用seek()方法来访问记录,并进行读写了.这些记录的大小不必相同；但是其大小和位置必须是可知的.但是该类仅限于操作文件.

```java
// 读取所有的行try (RandomAccessFile r = new RandomAccessFile(file, "rw")) {
        for (int i = 0; i < r.length(); i++) {
                r.read();    // r.readLine();
        }
}
// 写入数据,第二个参数必须为 "r", "rw", "rws", or "rwd"try (RandomAccessFile w = new RandomAccessFile(file, "rw")) {
        for (int i = 0; i < 1024 * 1024 * 10; i++)
                w.writeByte(1);
}
try (FileChannel fc = new RandomAccessFile(new File("temp.tmp"), "rw").getChannel();) {
        IntBuffer ib = fc.map(FileChannel.MapMode.READ_WRITE, 0, fc.size()).asIntBuffer();
        for (int i = 1; i < 10000; i++)
                ib.put(ib.get(i - 1));

}
RandomAccessFile raf = new RandomAccessFile(new File("temp.tmp"), "rw");
raf.writeInt(1);
for (int i = 0; i < 2000000; i++) {
        raf.seek(raf.length() - 4);
        raf.writeInt(raf.readInt());
}
raf.close();
```

### getResourceAsStream

我们还可以使用类加载器的getResourceAsStream()从指定路径或者jar包中加载文件资源
1. Class.getResourceAsStream(String path) ： path 不以’/'开头时默认是从此类所在的包下取资源，以’/'开头则是从ClassPath根下获取。其只是通过path构造一个绝对路径，最终还是由ClassLoader获取资源。
2. Class.getClassLoader.getResourceAsStream(String path) ：默认则是从ClassPath根下获取，path不能以’/'开头，最终是由ClassLoader获取资源。


```java
public class TestReadFile {
        public static void main(String[] args) throws IOException {

                InputStream in = TestReadFile.class.getClassLoader().getResourceAsStream("./mybatis-config.xml");
                BufferedReader buffer = new BufferedReader(new InputStreamReader(in));
                System.out.println(buffer.readLine());
                in = new TestReadFile().getClass().getResourceAsStream("./mybatis-config.xml");
                buffer = new BufferedReader(new InputStreamReader(in));
                System.out.println(buffer.readLine());

                System.out.println(new File(".").getCanonicalPath());
                System.out.println(new File(".").getAbsolutePath());
                System.out.println(new File(".").getPath());
        }
}
输出结果为

<?xml version="1.0" encoding="UTF-8" ?>
<?xml version="1.0" encoding="UTF-8" ?>
D:\ming\test
D:\ming\test\.
.
```

### 读取压缩包文件

```java
public static Map<String, byte[]> getLoadedClass(String jarPath) {
        Map<String, byte[]> loadClass = new HashMap<>();
        try(InputStream in = new BufferedInputStream(new FileInputStream(new File(jarPath)));
                ZipInputStream zin = new ZipInputStream(in)) {
        ZipEntry ze;
        while ((ze = zin.getNextEntry()) != null) {
            if (ze.isDirectory()) {
                // TODO 检查是否还有其他操作要做
            } else {
                if (ze.getSize() > 0) {
                    String fileName = ze.getName();
                    if (!fileName.endsWith(".class")) {
                        continue;
                    }
                                        try(ZipFile zf = new ZipFile(jarPath); InputStream input = zf.getInputStream(ze);
                                                ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {
                                                if (input == null) {
                                                        logger.error("Code Reload cant find file : " + fileName);
                                                        continue;
                                                }
                                                int b = 0;
                                                while ((b = input.read()) != -1) {
                                                        byteArrayOutputStream.write(b);
                                                }
                                                byte[] bytes = byteArrayOutputStream.toByteArray();
                                                // TODO 
                                        }
                }
            }
        }
    } catch (final Exception e) {
        e.printStackTrace();
    }
        return loadClass;
}
```

在写这个东西的时候遇到个小坑, 刚开始使用的是input.available()读取的文件内容, 但是大概要读取100多个文件, 总有6个文件读取的不完整,查看JDK的文档,上面说

> Returns an estimate of the number of bytes that can be read (or skipped over) from this input stream without blocking by the next invocation of a method for this input stream. The next invocation might be the same thread or another thread.  A single read or skip of this many bytes will not block, but may read or skip fewer bytes.
> 
> Note that while some implementations of InputStream will return the total number of bytes in the stream, many will not.  It is never correct to use the return value of this method to allocate a buffer intended to hold all data in this stream.

这个方法返回的是在非阻塞情况下对该流进行下一次某个方法(读或者skip操作)调用时的预估字节数.下一个方法调用可以在同一个线程或者在不同的线程中。下一次读取或者skip掉available预估字节数不会产生阻塞的情况，但是实际读取出来的字节数可能小于预估数。
因此在ZipFileInputStream中，它依赖于native方法实现，我们也不知道它返回的究竟是流里剩下的全部的字节数还是部分的。最后文档也说了，永远不要使用这个方法返回的预估字节数分配buffer大小的buffer.


## 写文件

### BufferedOutputStream

我们使用FileOutputStream, BufferedOutputStream来读取文件

```java
try (BufferedOutputStream bf = new BufferedOutputStream(new FileOutputStream(new File("")));) {
        bf.write(1);
} catch (final IOException e) {
        e.printStackTrace();
}
```

BufferedOutputStream 缓冲输出流。它继承于FilterOutputStream。作用是为另一个输出流提供“缓冲功能”。输出byte[]字节数组 BufferedOutputStream只提供了输出byte数据的方式,因此这种方式只能读取二进制流
FileOutputStream 一个字节一个字节的向文件里输出数据

### BufferedWriter

1. 支持字符串输出
2. 支持换行输出
3. 支持文件追加输出

```java
BufferedWriter writer = Files.newBufferedWriter(Paths.get("new.txt"), StandardCharsets.UTF_8);
writer.write("123456\n"); // 换行输出
```

另外还有一点需要提到的是FileWriter, 它一个字符一个字符地输出

### OutputStreamWriter

OutputStreamWriter 将字节流转换为字符流。是字节流通向字符流的桥梁。如果不指定字符集编码，该解码过程将使用平台默认的字符编码，如：GBK。
```java
// 写入UTF-8格式编码的文件StringBuffer buffer = new StringBuffer();
try (Writer out = new BufferedWriter(new OutputStreamWriter(
                new FileOutputStream(file), "UTF8"))) {

        out.append("Website UTF-8").append("\r\n");
        out.append("中文 UTF-8").append("\r\n");

        out.flush();
} catch (final Exception e) {
        e.printStackTrace();
}
```

### PrintStream

标准IO重定向
打印输出流,用来装饰其它输出流。它能为其他输出流添加了功能，使它们能够方便地打印各种数据值表示形式。PrintStream永远不会抛出IOException；PrintStream提供了自动flush和字符集设置功能。所谓自动flush，就是往PrintStream写入的数据会立刻调用flush()函数。
System类提供了一些简单的静态方法调用,以允许我们对标准输入,输出和错误IO进行重定向IO重定向是对字节流的操纵而不是字符流,因此在该例中使用的是InputStream和OutputStream而不是Reader和Writer
示例 如果在显示器上创建大量输出,而这些输出滚动地太快而无法阅读时,IO重定向就显得很有用

```java
PrintStream console = System.out;
BufferedInputStream in = new BufferedInputStream(new FileInputStream("Redirecting.java"));

PrintStream out = new PrintStream(new BufferedOutputStream(new FileOutputStream("MapDB.test.out")));

System.setIn(in);
System.setOut(out);
System.setErr(out);

BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
String s;
while ((s = br.readLine()) != null)
        System.out.println(s);

out.close(); // Remember this!System.setOut(console);
```

### PrintWriter

用于向文本输出流打印对象的格式化表示形式。它实现在 PrintStream 中的所有 print 方法。它不包含用于写入原始字节的方法，对于这些字节，程序应该使用未编码的字节流进行写入。
FileWriter可以向文件输出数据. 首先创建一个与指定文件连接的FileWriter.然后使用BufferedWriter对其进行包装进行性能提升 最后使用PrintWriter提供格式化功能
```java
try (PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(file)));) {
        out.println(string);
}
```

System.out 是一个PrintStream,而PrintStream是一个OutputStream而PrintWriter有一个参数是接受OutputStream,因此我们可以将System.out转换成PrintWriter
```java
try (PrintWriter out = new PrintWriter(System.out);) {
out.println(string);
}
```