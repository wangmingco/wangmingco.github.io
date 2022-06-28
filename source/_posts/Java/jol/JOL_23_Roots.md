---
category: Java
tag: jol
date: 2016-12-04 21:50:00
title: JOL 23 Roots
---

本篇文章基于[V0.16 JOLSample_23_Roots](https://github.com/openjdk/jol/blob/0.16/jol-samples/src/main/java/org/openjdk/jol/samples/JOLSample_23_Roots.java)

/*
     * The example how VM traverses the root sets.
     *
     * During the GC, object reachability graph should be traversed
     * starting from somewhere. The root set is the set of intrinsically
     * reachable objects. Static fields are the part of root set, local
     * variables are the part of root set as well.
     *
     * In this example, we build the "ring" of objects, and reference
     * only the single link from that ring from the local variable.
     * This will have the effect of having the different parts of ring
     * in the root set, which will, in the end, change the ring layout
     * in memory.
     *
     * Run with test with smaller heap (about 1 GB) for best results.
     */

```java
public class JOLSample_23_Roots {

    static volatile Object sink;

    public interface L {
        L link();
        void bind(L l);
    }

    public static abstract class AL implements L {
        L l;
        public L link() { return l; }
        public void bind(L l) { this.l = l; }
    }

    public static class L1 extends AL {}
    public static class L2 extends AL {}
    public static class L3 extends AL {}
    public static class L4 extends AL {}
    public static class L5 extends AL {}
    public static class L6 extends AL {}

    public static void main(String[] args) {
        out.println(VM.current().details());

        PrintWriter pw = new PrintWriter(System.out, true);

        // create links
        L l1 = new L1();
        L l2 = new L2();
        L l3 = new L3();
        L l4 = new L4();
        L l5 = new L5();
        L l6 = new L6();

        // bind the ring
        l1.bind(l2);
        l2.bind(l3);
        l3.bind(l4);
        l4.bind(l5);
        l5.bind(l6);
        l6.bind(l1);

        // current root
        L r = l1;

        // break all other roots
        l1 = l2 = l3 = l4 = l5 = l6 = null;

        long lastAddr = VM.current().addressOf(r);
        pw.printf("Fresh object is at %x%n", lastAddr);

        int moves = 0;
        for (int i = 0; i < 100000; i++) {

            // scan for L1 and determine it's address
            L s = r;
            while (!((s = s.link()) instanceof L1)) ;

            long cur = VM.current().addressOf(s);
            s = null;

            // if L1 had moved, then probably the entire ring had also moved
            if (cur != lastAddr) {
                moves++;
                pw.printf("*** Move %2d, L1 is at %x%n", moves, cur);
                pw.println("*** Root is " + r.getClass());

                pw.println(GraphLayout.parseInstance(r).toPrintable());

                // select another link
                Random random = new Random();
                for (int c = 0; c < random.nextInt(100); c++) {
                    r = r.link();
                }

                lastAddr = cur;
            }

            // make garbage
            for (int c = 0; c < 10000; c++) {
                sink = new Object();
            }
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

Fresh object is at 76bd956f8
*** Move  1, L1 is at 76eb18178
*** Root is class org.openjdk.jol.samples.JOLSample_23_Roots$L1
org.openjdk.jol.samples.JOLSample_23_Roots$L1@43556938d object externals:
          ADDRESS       SIZE TYPE                                          PATH                           VALUE
        76eb18178         16 org.openjdk.jol.samples.JOLSample_23_Roots$L1                                (object)
        76eb18188      68776 (something else)                              (somewhere else)               (something else)
        76eb28e30         16 org.openjdk.jol.samples.JOLSample_23_Roots$L2 .l                             (object)
        76eb28e40         16 org.openjdk.jol.samples.JOLSample_23_Roots$L3 .l.l                           (object)
        76eb28e50         16 org.openjdk.jol.samples.JOLSample_23_Roots$L4 .l.l.l                         (object)
        76eb28e60         16 org.openjdk.jol.samples.JOLSample_23_Roots$L5 .l.l.l.l                       (object)
        76eb28e70         16 org.openjdk.jol.samples.JOLSample_23_Roots$L6 .l.l.l.l.l                     (object)

Addresses are stable after 1 tries.


*** Move  2, L1 is at 76f5ec3c0
*** Root is class org.openjdk.jol.samples.JOLSample_23_Roots$L4
org.openjdk.jol.samples.JOLSample_23_Roots$L4@47089e5fd object externals:
          ADDRESS       SIZE TYPE                                          PATH                           VALUE
        76f590260         16 org.openjdk.jol.samples.JOLSample_23_Roots$L4                                (object)
        76f590270     377136 (something else)                              (somewhere else)               (something else)
        76f5ec3a0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L5 .l                             (object)
        76f5ec3b0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L6 .l.l                           (object)
        76f5ec3c0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L1 .l.l.l                         (object)
        76f5ec3d0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L2 .l.l.l.l                       (object)
        76f5ec3e0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L3 .l.l.l.l.l                     (object)

Addresses are stable after 1 tries.


*** Move  3, L1 is at 76eb286f0
*** Root is class org.openjdk.jol.samples.JOLSample_23_Roots$L2
org.openjdk.jol.samples.JOLSample_23_Roots$L2@532760d8d object externals:
          ADDRESS       SIZE TYPE                                          PATH                           VALUE
        76eb20000         16 org.openjdk.jol.samples.JOLSample_23_Roots$L2                                (object)
        76eb20010      34464 (something else)                              (somewhere else)               (something else)
        76eb286b0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L3 .l                             (object)
        76eb286c0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L4 .l.l                           (object)
        76eb286d0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L5 .l.l.l                         (object)
        76eb286e0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L6 .l.l.l.l                       (object)
        76eb286f0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L1 .l.l.l.l.l                     (object)

Addresses are stable after 1 tries.


*** Move  4, L1 is at 7736031a8
*** Root is class org.openjdk.jol.samples.JOLSample_23_Roots$L6
org.openjdk.jol.samples.JOLSample_23_Roots$L6@4c3e4790d object externals:
          ADDRESS       SIZE TYPE                                          PATH                           VALUE
        773580f20         16 org.openjdk.jol.samples.JOLSample_23_Roots$L6                                (object)
        773580f30     533112 (something else)                              (somewhere else)               (something else)
        7736031a8         16 org.openjdk.jol.samples.JOLSample_23_Roots$L1 .l                             (object)
        7736031b8         16 org.openjdk.jol.samples.JOLSample_23_Roots$L2 .l.l                           (object)
        7736031c8         16 org.openjdk.jol.samples.JOLSample_23_Roots$L3 .l.l.l                         (object)
        7736031d8         16 org.openjdk.jol.samples.JOLSample_23_Roots$L4 .l.l.l.l                       (object)
        7736031e8         16 org.openjdk.jol.samples.JOLSample_23_Roots$L5 .l.l.l.l.l                     (object)

Addresses are stable after 1 tries.


*** Move  5, L1 is at 772b568c0
*** Root is class org.openjdk.jol.samples.JOLSample_23_Roots$L5
org.openjdk.jol.samples.JOLSample_23_Roots$L5@68f7aae2d object externals:
          ADDRESS       SIZE TYPE                                          PATH                           VALUE
        772b201c0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L5                                (object)
        772b201d0     222944 (something else)                              (somewhere else)               (something else)
        772b568b0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L6 .l                             (object)
        772b568c0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L1 .l.l                           (object)
        772b568d0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L2 .l.l.l                         (object)
        772b568e0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L3 .l.l.l.l                       (object)
        772b568f0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L4 .l.l.l.l.l                     (object)

Addresses are stable after 1 tries.


*** Move  6, L1 is at 77adbe8e0
*** Root is class org.openjdk.jol.samples.JOLSample_23_Roots$L6
org.openjdk.jol.samples.JOLSample_23_Roots$L6@4c3e4790d object externals:
          ADDRESS       SIZE TYPE                                          PATH                           VALUE
        77ada0178         16 org.openjdk.jol.samples.JOLSample_23_Roots$L6                                (object)
        77ada0188     124760 (something else)                              (somewhere else)               (something else)
        77adbe8e0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L1 .l                             (object)
        77adbe8f0         16 org.openjdk.jol.samples.JOLSample_23_Roots$L2 .l.l                           (object)
        77adbe900         16 org.openjdk.jol.samples.JOLSample_23_Roots$L3 .l.l.l                         (object)
        77adbe910         16 org.openjdk.jol.samples.JOLSample_23_Roots$L4 .l.l.l.l                       (object)
        77adbe920         16 org.openjdk.jol.samples.JOLSample_23_Roots$L5 .l.l.l.l.l                     (object)

Addresses are stable after 1 tries.


*** Move  7, L1 is at 6c002e270
*** Root is class org.openjdk.jol.samples.JOLSample_23_Roots$L4
org.openjdk.jol.samples.JOLSample_23_Roots$L4@47089e5fd object externals:
          ADDRESS       SIZE TYPE                                          PATH                           VALUE
        6c001c010         16 org.openjdk.jol.samples.JOLSample_23_Roots$L4                                (object)
        6c001c020      74288 (something else)                              (somewhere else)               (something else)
        6c002e250         16 org.openjdk.jol.samples.JOLSample_23_Roots$L5 .l                             (object)
        6c002e260         16 org.openjdk.jol.samples.JOLSample_23_Roots$L6 .l.l                           (object)
        6c002e270         16 org.openjdk.jol.samples.JOLSample_23_Roots$L1 .l.l.l                         (object)
        6c002e280         16 org.openjdk.jol.samples.JOLSample_23_Roots$L2 .l.l.l.l                       (object)
        6c002e290         16 org.openjdk.jol.samples.JOLSample_23_Roots$L3 .l.l.l.l.l                     (object)

Addresses are stable after 1 tries.
```