/**
 * Redis 缓存服务
 * 提供统一的缓存接口
 */

import redis from '@/lib/redis';

// 缓存键前缀
const PREFIX = {
  APP_LIST: 'apps:user:',
  APP_STATUS: 'app:status:',
  STATS: 'stats:',
  PERFORMANCE: 'perf:',
  USER_INFO: 'user:',
};

// 缓存过期时间（秒）
const TTL = {
  SHORT: 60,        // 1分钟
  MEDIUM: 300,      // 5分钟
  LONG: 600,        // 10分钟
  VERY_LONG: 3600,  // 1小时
};

/**
 * 获取缓存
 */
async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * 设置缓存
 */
async function setCache(key: string, value: any, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * 删除缓存
 */
async function delCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis del error:', error);
  }
}

/**
 * 删除匹配的所有缓存
 */
async function delCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis del pattern error:', error);
  }
}

// ==================== 应用相关缓存 ====================

/**
 * 缓存用户的应用列表
 */
export async function cacheUserApps(userId: number, apps: any[]): Promise<void> {
  const key = `${PREFIX.APP_LIST}${userId}`;
  await setCache(key, apps, TTL.MEDIUM);
}

/**
 * 获取用户的应用列表缓存
 */
export async function getUserAppsCache(userId: number): Promise<any[] | null> {
  const key = `${PREFIX.APP_LIST}${userId}`;
  return await getCache<any[]>(key);
}

/**
 * 清除用户的应用列表缓存
 */
export async function clearUserAppsCache(userId: number): Promise<void> {
  const key = `${PREFIX.APP_LIST}${userId}`;
  await delCache(key);
}

/**
 * 缓存应用状态
 */
export async function cacheAppStatus(appId: string, status: number): Promise<void> {
  const key = `${PREFIX.APP_STATUS}${appId}`;
  await setCache(key, status, TTL.LONG);
}

/**
 * 获取应用状态缓存
 */
export async function getAppStatusCache(appId: string): Promise<number | null> {
  const key = `${PREFIX.APP_STATUS}${appId}`;
  return await getCache<number>(key);
}

/**
 * 清除应用状态缓存
 */
export async function clearAppStatusCache(appId: string): Promise<void> {
  const key = `${PREFIX.APP_STATUS}${appId}`;
  await delCache(key);
}

// ==================== 统计数据缓存 ====================

/**
 * 缓存统计数据
 */
export async function cacheStats(
  appId: string,
  type: string,
  date: string,
  data: any
): Promise<void> {
  const key = `${PREFIX.STATS}${appId}:${type}:${date}`;
  await setCache(key, data, TTL.MEDIUM);
}

/**
 * 获取统计数据缓存
 */
export async function getStatsCache(
  appId: string,
  type: string,
  date: string
): Promise<any | null> {
  const key = `${PREFIX.STATS}${appId}:${type}:${date}`;
  return await getCache<any>(key);
}

/**
 * 清除应用的所有统计缓存
 */
export async function clearAppStatsCache(appId: string): Promise<void> {
  const pattern = `${PREFIX.STATS}${appId}:*`;
  await delCachePattern(pattern);
}

// ==================== 性能数据缓存 ====================

/**
 * 缓存性能数据
 */
export async function cachePerformance(
  appId: string,
  date: string,
  data: any
): Promise<void> {
  const key = `${PREFIX.PERFORMANCE}${appId}:${date}`;
  await setCache(key, data, TTL.MEDIUM);
}

/**
 * 获取性能数据缓存
 */
export async function getPerformanceCache(
  appId: string,
  date: string
): Promise<any | null> {
  const key = `${PREFIX.PERFORMANCE}${appId}:${date}`;
  return await getCache<any>(key);
}

// ==================== 用户信息缓存 ====================

/**
 * 缓存用户信息
 */
export async function cacheUserInfo(userId: number, userInfo: any): Promise<void> {
  const key = `${PREFIX.USER_INFO}${userId}`;
  await setCache(key, userInfo, TTL.VERY_LONG);
}

/**
 * 获取用户信息缓存
 */
export async function getUserInfoCache(userId: number): Promise<any | null> {
  const key = `${PREFIX.USER_INFO}${userId}`;
  return await getCache<any>(key);
}

/**
 * 清除用户信息缓存
 */
export async function clearUserInfoCache(userId: number): Promise<void> {
  const key = `${PREFIX.USER_INFO}${userId}`;
  await delCache(key);
}

// ==================== 通用缓存方法 ====================

/**
 * 缓存包装器 - 先查缓存，没有则执行查询并缓存结果
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // 尝试从缓存获取
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 执行查询
  const data = await fetchFn();

  // 缓存结果
  await setCache(key, data, ttl);

  return data;
}

export { TTL };
