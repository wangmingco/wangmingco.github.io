---
category: Java
tag: jol
date: 2016-12-04
title: JOL 20 Allocation
---

本篇文章基于[V0.16 JOLSample_20_Allocation](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_20_Allocation.java)


    /*
     * The example of allocation addresses.
     *
     * This example shows the addresses of newly allocated objects
     * grow linearly in HotSpot. This is because the allocation in
     * parallel collectors is linear. We can also see it rewinds back
     * to the same offsets -- that's the start of some GC generation.
     *
     * For Parallel-like GCs, while GC adjusts for the allocation rate.
     * For G1-like GCs, the allocation address changes by region size,
     * as collector switches to another region for allocation.
     *
     * Run with test with smaller heap (about 1 GB) for best results.
     */


```java
public class JOLSample_20_Allocation {

    public static void main(String[] args) {
        out.println(VM.current().details());

        PrintWriter pw = new PrintWriter(out, true);

        long last = VM.current().addressOf(new Object());
        for (int l = 0; l < 1000 * 1000 * 1000; l++) {
            long current = VM.current().addressOf(new Object());

            long distance = Math.abs(current - last);
            if (distance > 4096) {
                pw.printf("Jumping from %x to %x (distance = %d bytes, %dK, %dM)%n",
                        last,
                        current,
                        distance,
                        distance / 1024,
                        distance / 1024 / 1024);
            }

            last = current;
        }

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

Jumping from 76eafffe0 to 76ab00000 (distance = 67108832 bytes, 65535K, 63M)
Jumping from 76eafffd8 to 76ab00000 (distance = 67108824 bytes, 65535K, 63M)
Jumping from 76ac3d010 to 76ad84b28 (distance = 1342232 bytes, 1310K, 1M)
Jumping from 76eafffe0 to 76ab00000 (distance = 67108832 bytes, 65535K, 63M)
Jumping from 76ac3e720 to 76ace24d0 (distance = 671152 bytes, 655K, 0M)
Jumping from 76eafffe0 to 76ab00000 (distance = 67108832 bytes, 65535K, 63M)
Jumping from 76eafffe0 to 76ab00000 (distance = 67108832 bytes, 65535K, 63M)
Jumping from 76e97ffd8 to 76ab00000 (distance = 65535960 bytes, 63999K, 62M)
Jumping from 76e7fffd8 to 76ab00000 (distance = 63963096 bytes, 62463K, 60M)
Jumping from 76e6fffd8 to 76ab00000 (distance = 62914520 bytes, 61439K, 59M)
Jumping from 76e5fffd8 to 76ab00000 (distance = 61865944 bytes, 60415K, 58M)
Jumping from 76ac28350 to 76ac88bc0 (distance = 395376 bytes, 386K, 0M)
Jumping from 76e4fffe0 to 76ab00000 (distance = 60817376 bytes, 59391K, 57M)
Jumping from 76e3fffd8 to 76ab00000 (distance = 59768792 bytes, 58367K, 56M)
Jumping from 76e2fffd8 to 76ab00000 (distance = 58720216 bytes, 57343K, 55M)
Jumping from 76e1fffd8 to 76ab00000 (distance = 57671640 bytes, 56319K, 54M)
Jumping from 76e0fffd8 to 76ab00000 (distance = 56623064 bytes, 55295K, 53M)
Jumping from 76dffffd8 to 76ab00000 (distance = 55574488 bytes, 54271K, 52M)
Jumping from 76defffd8 to 76ab00000 (distance = 54525912 bytes, 53247K, 51M)
Jumping from 76ddfffd8 to 76ab00000 (distance = 53477336 bytes, 52223K, 50M)
Jumping from 76dcfffd8 to 76ab00000 (distance = 52428760 bytes, 51199K, 49M)
Jumping from 76dbfffd8 to 76ab00000 (distance = 51380184 bytes, 50175K, 48M)
Jumping from 76dafffd8 to 76ab00000 (distance = 50331608 bytes, 49151K, 47M)
Jumping from 76d9fffd8 to 76ab00000 (distance = 49283032 bytes, 48127K, 46M)
Jumping from 76d97ffd8 to 76ab00000 (distance = 48758744 bytes, 47615K, 46M)
Jumping from 76d8fffd8 to 76ab00000 (distance = 48234456 bytes, 47103K, 45M)
Jumping from 76d87ffd8 to 76ab00000 (distance = 47710168 bytes, 46591K, 45M)
Jumping from 76d7fffd8 to 76ab00000 (distance = 47185880 bytes, 46079K, 44M)
Jumping from 76d77ffd8 to 76ab00000 (distance = 46661592 bytes, 45567K, 44M)
Jumping from 76d6fffd8 to 76ab00000 (distance = 46137304 bytes, 45055K, 43M)
Jumping from 76d67ffd8 to 76ab00000 (distance = 45613016 bytes, 44543K, 43M)
Jumping from 76d5fffd8 to 76ab00000 (distance = 45088728 bytes, 44031K, 42M)
Jumping from 76d57ffd8 to 76ab00000 (distance = 44564440 bytes, 43519K, 42M)
Jumping from 76d4fffd8 to 76ab00000 (distance = 44040152 bytes, 43007K, 41M)
Jumping from 76d47ffd8 to 76ab00000 (distance = 43515864 bytes, 42495K, 41M)
Jumping from 76d3fffd8 to 76ab00000 (distance = 42991576 bytes, 41983K, 40M)
Jumping from 76d37ffd8 to 76ab00000 (distance = 42467288 bytes, 41471K, 40M)
Jumping from 76d2fffd8 to 76ab00000 (distance = 41943000 bytes, 40959K, 39M)
Jumping from 76d27ffd8 to 76ab00000 (distance = 41418712 bytes, 40447K, 39M)
Jumping from 76abc7ae0 to 76abf1e00 (distance = 172832 bytes, 168K, 0M)
Jumping from 76d1fffe0 to 76ab00000 (distance = 40894432 bytes, 39935K, 38M)
Jumping from 76d17ffd8 to 76ab00000 (distance = 40370136 bytes, 39423K, 38M)
Jumping from 76d0fffd8 to 76ab00000 (distance = 39845848 bytes, 38911K, 37M)
Jumping from 76d07ffd8 to 76ab00000 (distance = 39321560 bytes, 38399K, 37M)
Jumping from 76cffffd8 to 76ab00000 (distance = 38797272 bytes, 37887K, 36M)
Jumping from 76cf7ffd8 to 76ab00000 (distance = 38272984 bytes, 37375K, 36M)
Jumping from 76cefffd8 to 76ab00000 (distance = 37748696 bytes, 36863K, 35M)
Jumping from 76ce7ffd8 to 76ab00000 (distance = 37224408 bytes, 36351K, 35M)
Jumping from 76cdfffd8 to 76ab00000 (distance = 36700120 bytes, 35839K, 34M)
Jumping from 76cd7ffd8 to 76ab00000 (distance = 36175832 bytes, 35327K, 34M)
Jumping from 76ccfffd8 to 76ab00000 (distance = 35651544 bytes, 34815K, 33M)
Jumping from 76cc7ffd8 to 76ab00000 (distance = 35127256 bytes, 34303K, 33M)
Jumping from 76cbfffd8 to 76ab00000 (distance = 34602968 bytes, 33791K, 32M)
Jumping from 76cb7ffd8 to 76ab00000 (distance = 34078680 bytes, 33279K, 32M)
Jumping from 76cafffd8 to 76ab00000 (distance = 33554392 bytes, 32767K, 31M)
Jumping from 76ca7ffd8 to 76ab00000 (distance = 33030104 bytes, 32255K, 31M)
Jumping from 76c9fffd8 to 76ab00000 (distance = 32505816 bytes, 31743K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76ab9c280 to 76abb19d0 (distance = 87888 bytes, 85K, 0M)
Jumping from 76c97ffe0 to 76ab00000 (distance = 31981536 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76ab9c290 to 76abaa1c8 (distance = 57144 bytes, 55K, 0M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76ab00000 to 76ab012a0 (distance = 4768 bytes, 4K, 0M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
Jumping from 76c97ffd8 to 76ab00000 (distance = 31981528 bytes, 31231K, 30M)
```