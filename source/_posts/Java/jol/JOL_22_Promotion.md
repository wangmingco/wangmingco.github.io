---
category: Java
tag: jol
date: 2016-12-04 21:30:00
title: JOL 22 Promotion
---

本篇文章基于[V0.16 JOLSample_22_Promotion](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_22_Promotion.java)


    /*
     * The example of object promotion.
     *
     * Once the object survives the garbage collections, it is getting
     * promoted to another generation. In this example, we can track
     * the addresses of the objects, as it changes over time.
     *
     * VM also needs to record the "age" (that is, the number of GC
     * cycles the object had survived) of the object somewhere, and
     * it is stored in mark word as well. See how particular mark word
     * bits change with each promotion.
     *
     * Run with test with smaller heap (about 1 GB) for best results.
     */

```java
public class JOLSample_22_Promotion {

    static volatile Object sink;

    public static void main(String[] args) {
        out.println(VM.current().details());

        PrintWriter pw = new PrintWriter(System.out, true);

        Object o = new Object();

        ClassLayout layout = ClassLayout.parseInstance(o);

        long lastAddr = VM.current().addressOf(o);
        pw.printf("*** Fresh object is at %x%n", lastAddr);
        out.println(layout.toPrintable());

        int moves = 0;
        for (int i = 0; i < 100000; i++) {
            long cur = VM.current().addressOf(o);
            if (cur != lastAddr) {
                moves++;
                pw.printf("*** Move %2d, object is at %x%n", moves, cur);
                out.println(layout.toPrintable());
                lastAddr = cur;
            }

            // make garbage
            for (int c = 0; c < 10000; c++) {
                sink = new Object();
            }
        }

        long finalAddr = VM.current().addressOf(o);
        pw.printf("*** Final object is at %x%n", finalAddr);
        out.println(layout.toPrintable());

        pw.close();
    }

}
```

运行结果
```js
# Running 64-bit HotSpot VM.
# Using compressed oop with 3-bit shift.
# Using compressed klass with 3-bit shift.
# WARNING | Compressed references base/shifts are guessed by the experiment!
# WARNING | Therefore, computed addresses are just guesses, and ARE NOT RELIABLE.
# WARNING | Make sure to attach Serviceability Agent to get the reliable addresses.
# Objects are 8 bytes aligned.
# Field sizes by type: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]
# Array element sizes: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]

*** Fresh object is at 76bd8a388
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000005 (biasable; age: 0)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

*** Move  1, object is at 76eb28000
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x000000000000000d (biasable; age: 1)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

*** Move  2, object is at 76f5a8058
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000015 (biasable; age: 2)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

*** Move  3, object is at 76eb270d0
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x000000000000001d (biasable; age: 3)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

*** Move  4, object is at 773588f40
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000025 (biasable; age: 4)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

*** Move  5, object is at 772b201d0
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x000000000000002d (biasable; age: 5)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

*** Move  6, object is at 77ad80a78
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000035 (biasable; age: 6)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

*** Move  7, object is at 6c000cef8
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000035 (biasable; age: 6)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total

*** Final object is at 6c000cef8
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000035 (biasable; age: 6)
  8   4        (object header: class)    0xf80001e5
 12   4        (object alignment gap)    
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```