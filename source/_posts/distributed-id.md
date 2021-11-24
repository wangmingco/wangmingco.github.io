---
title: 高并发无锁无IO等待分布式ID生成方案
date: 2018-11-18 11:40:00
---

# A)
网络上现在有很多的分布式ID生成算法, 各大厂商也开源了自己的分布式id生成算法. 前段时间项目里有个生成唯一id的需求, 思考了一下, 将flick的id生成方案和Twitter的id生成算法结合到一起, 写了个小算法, 也算是站在巨人的肩膀上做了点小东西, lol

# B)
原理大致是这样的, 利用mysql insert来计算出集群中某个节点处于集群中的位置, 算出serverId, 然后利用雪花算法在该id上生成分布式id.

目前的实现是采用long来进行存储的, 因此只能在生成时间维度, 节点数量, 和每毫秒内生成的数量上进行调节, 如果你们可以存储字符串的话, 那么可以拓展一下该算法, 加大时间和空间的容量.

<!--more-->

# C)
算法实现
```java
/**
 * ID 生成器
 * <p>
 * 整个ID算法很简单,
 * 1. 参考Flickr ID生成算法, 使用MYSQL获得一个自增ID, 然后对ID取模, 算出一个服务器ID
 * 2. 参考Twitter的雪花算法, 算出一个long型ID
 * <p>
 * 该算法保证在30年内, 6万台机器, 单机每秒可以产出128, 000个不重复ID
 * <p>
 * <p>
 * CREATE TABLE `account_server_id` (
 * `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
 * `stub` char(1) DEFAULT NULL,
 * PRIMARY KEY (`id`),
 * UNIQUE KEY `stub` (`stub`)
 * ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
 * <p>
 * <p>
 * |1, 000, 0000, 0000, 0000, 0000, 0000, 0000, 0000, 0000, 0000, 0 |000, 0000, 0000, 0000, 0 |000, 0000           |
 * | |                   时间戳(40位)                                |   服务器ID(16位)         | 单个时间戳内的Id(7位) |
 */
@Service
public class IDGeneratorService implements CommandLineRunner {

    private static final Logger LOG = LoggerFactory.getLogger(IDGeneratorService.class);

    // 时间戳从哪一年开始计时
    private static final int START_YEAR = 2018;

    // 时间取40位, 保证ID34年内不会重复
    private static final int timeBitsSize = 40;
    private static final int serverIdBitsSize = 16;
    private static final int countBitsSize = 7;

    private long maxIdPerMill;

    // 时间开始时间戳, 相当于System.currentTimeMillis()的1970年
    private long startDateTime;
    // 服务器ID表示位, 在集群中表示一个节点
    private long serverIdBits;
    // 单机中, 某个时刻生长得id
    private long currentID;

    private long maxTime;

    private long lastGenerateTime = System.currentTimeMillis();
    private Object lock = new Object();

    @Resource
    private AccountServerIdMapper accountServerIdMapper;

    public void init() {
        // 1. 计算出开始生成ID的起始时间戳
        LocalDateTime start = LocalDateTime.of(START_YEAR, 1, 1, 0, 0);
        startDateTime = start.toInstant(ZoneOffset.of("+8")).toEpochMilli();

        // 2. 算出支持最大年限的时间
        maxTime = ((Double) Math.pow(2, timeBitsSize)).longValue();

        // 3. 算出每毫秒能产出多少ID
        maxIdPerMill = ((Double) Math.pow(2, countBitsSize)).longValue();

        /**
         * 4. 根据Mysql自增ID取模, 算出每个服务器ID, 在生产环境中, 应该保证服务器数量是该值的一半, 如此一来就可以避免, 服务器集群整体
         * 重启时, 不会拿到与重启之前的服务器相同的Id
         * 这个值的计算是为了适应这种场景, 在服务器灰度上线的时候, 有可能是原来的服务器还没有关闭, 但是新的服务器已经起来了, 此时会有俩套
         * 服务器同时在处理业务逻辑, 那么它们就有可能拿到一样的服务器ID, 从而导致产生一样的ID号
         */
        long serverSize = ((Double) Math.pow(2, serverIdBitsSize)).longValue();

        AccountServerId accountServerId = new AccountServerId();
        accountServerIdMapper.nextId(accountServerId);
        long serverId = (int) (accountServerId.getId() % serverSize);

        /**
         * 5. 算出每个服务器ID在long类型中的数据位置, 然后缓存起来
         */
        serverIdBits = (serverId << (countBitsSize));

        LOG.info("[ID生成器] 开始时间:{}, 时间戳:{} ", new Date(startDateTime), startDateTime);
        LOG.info("[ID生成器] 结束时间:{}, 时间戳:{} ", new Date(startDateTime + maxTime), maxTime);
        LOG.info("[ID生成器] 每毫秒生成最大ID数:{} ", maxIdPerMill);
        LOG.info("[ID生成器] 当前serverId: {}, serverIdSize:{}", serverId, serverSize);
        LOG.info("[ID生成器] serverIdBits: {}", Long.toBinaryString(serverIdBits));
    }

    /**
     * 生成一个64位的GUID
     * <p>
     * 在next()方法中, 没有使用任何的对象, 如此一来就可以减轻GC的压力.
     *
     * @return
     */
    public long next() {

        synchronized (lock) {
            long curTime = System.currentTimeMillis() - startDateTime;
            if (curTime >= maxTime) {
	            LOG.error("[ID生成器] 超过负载, {}, {}！返回 -1", curTime, maxTime);
                return -1;
            }

            if (lastGenerateTime != curTime) {
                currentID = 0;
            } else {

                if (currentID >= maxIdPerMill) {
	                LOG.error("[ID生成器] 同一毫秒[" + curTime + "]内生成" + currentID + "个ID！返回 -1");
                    return -1;
                }

                ++currentID;
            }

            lastGenerateTime = curTime;
            long gid = (curTime << countBitsSize + serverIdBitsSize) | serverIdBits;
            gid |= currentID;

            return gid;
        }
    }

    public String nextStrId() {
        return String.valueOf(next());
    }

    public long tryNextId() {
        for (int i = 0; i < 1000; i++) {

            long start = System.currentTimeMillis();
            long id = next();
            long diff = System.currentTimeMillis() - start;
            if (diff > 3) {
                String tid = Thread.currentThread().getName();
                LOG.warn("[ID生成器] 线程{} 生成ID: {} 大于3毫秒: {}", tid, id, diff);
            }

            if (id == -1) {
                try {
//					LOG.error("[ID生成器] 生成ID为-1, 可能超过每毫秒内生成最大数量, 等待1毫秒");
                    TimeUnit.MILLISECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                continue;
            }
            return id;
        }
        return -1;
    }

    public String tryNextStrId() {
        return String.valueOf(tryNextId());
    }

    @Override
    public void run(String... args) throws Exception {
        init();
    }
}
```
mybatis
```java
@Mapper
public interface AccountServerIdMapper {

    @Insert("REPLACE INTO server_id (stub) VALUES ('a');")
    @SelectKey(statement = "SELECT LAST_INSERT_ID()", keyProperty = "id", before = false, resultType = Long.class)
    Long nextId(AccountServerId accountServerId);

}
```
SQL
```sql
CREATE TABLE `server_id` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `stub` char(1) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stub` (`stub`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```
测试
```java
@RunWith(JMockit.class)
public class IDGeneratorUtilTest {

	private static final Logger logger = LoggerFactory.getLogger(IDGeneratorUtilTest.class);

	private static final int MAX_TIMES = 2000000;
	private static final int PRINT_TIMES = 100;

	@Tested
	private IDGeneratorService idGeneratorUtil;

	@Injectable
	private AccountServerIdMapper accountServerIdMapper;

	/**
	 * 21026 [main] DEBUG c.f.l.service.IDGeneratorUtilTest - 20506 毫秒内生成 2000000 个ID
	 * <p>
	 * 单线程的情况下, 在MacBook Pro上是每毫秒钟生成 97 个id
	 */
	@Test
	public void testOneServerIdGenerate() {
		new Expectations() {
			{
				accountServerIdMapper.nextId((AccountServerId) any);
				result = 2;
			}
		};
		idGeneratorUtil.init();

		Set<Long> ids = new HashSet<>();

		long start = System.currentTimeMillis();

		for (int i = 0; i < MAX_TIMES; i++) {
			long id = idGeneratorUtil.tryNextId();
			if (ids.contains(id)) {
				System.out.println(id);
			}
			ids.add(id);
		}
		logger.debug((System.currentTimeMillis() - start) + " 毫秒内生成 " + ids.size() + " 个ID");
		Assert.assertEquals(ids.size(), MAX_TIMES);

		Object[] idArray = ids.toArray();
		for (int i = 0; i < PRINT_TIMES; i++) {
			logger.debug(idArray[i] + " : " + Long.toBinaryString((Long) idArray[i]));
		}
	}

	/**
	 * 207703 [Thread-7] DEBUG c.f.l.service.IDGeneratorUtilTest - 207136 毫秒内生成 2000000 个ID
	 * 208031 [Thread-3] DEBUG c.f.l.service.IDGeneratorUtilTest - 207465 毫秒内生成 2000000 个ID
	 * 208626 [Thread-10] DEBUG c.f.l.service.IDGeneratorUtilTest - 208059 毫秒内生成 2000000 个ID
	 * 208630 [Thread-9] DEBUG c.f.l.service.IDGeneratorUtilTest - 208063 毫秒内生成 2000000 个ID
	 * 209153 [Thread-6] DEBUG c.f.l.service.IDGeneratorUtilTest - 208586 毫秒内生成 2000000 个ID
	 * 209170 [Thread-5] DEBUG c.f.l.service.IDGeneratorUtilTest - 208603 毫秒内生成 2000000 个ID
	 * 209373 [Thread-2] DEBUG c.f.l.service.IDGeneratorUtilTest - 208807 毫秒内生成 2000000 个ID
	 * 209412 [Thread-1] DEBUG c.f.l.service.IDGeneratorUtilTest - 208846 毫秒内生成 2000000 个ID
	 * 209508 [Thread-4] DEBUG c.f.l.service.IDGeneratorUtilTest - 208941 毫秒内生成 2000000 个ID
	 * 209536 [Thread-8] DEBUG c.f.l.service.IDGeneratorUtilTest - 208969 毫秒内生成 2000000 个ID
	 * <p>
	 * 多线程的情况下, 在MacBook Pro上是每毫秒钟生成 9 个id, 可见由于锁的竞争, 产生的影响还是非常大的
	 */
	@Test
	public void testMutilServerIdGenerate() {
		new Expectations() {
			{
				accountServerIdMapper.nextId((AccountServerId) any);
				result = 2;
			}
		};
		idGeneratorUtil.init();

		Runnable runnable = () -> {
			Set<Long> ids = new HashSet<>();

			long start = System.currentTimeMillis();

			for (int i = 0; i < MAX_TIMES; i++) {
				long id = idGeneratorUtil.tryNextId();
				ids.add(id);
			}
			logger.debug((System.currentTimeMillis() - start) + " 毫秒内生成 " + ids.size() + " 个ID");
			Assert.assertEquals(ids.size(), MAX_TIMES);
		};

		List<Thread> list = new ArrayList<>();
		int cpus = Runtime.getRuntime().availableProcessors() + 2;
		logger.debug("CPU : " + cpus);

		for (int i = 0; i < cpus; i++) {
			Thread thread = new Thread(runnable);
			list.add(thread);
			thread.start();
		}

		for (Thread thread : list) {
			try {
				thread.join();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}

	}
}
```