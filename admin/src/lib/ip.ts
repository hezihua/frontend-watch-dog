import { NextRequest } from 'next/server';

/**
 * 从请求中获取用户真实 IP 地址
 */
export function getUserIp(request: NextRequest): string {
  // 尝试从各种常见的 header 中获取 IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for 可能包含多个 IP，取第一个
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // 如果都没有，返回默认值
  return 'unknown';
}

/**
 * 根据 IP 地址获取地理位置信息
 * TODO: 集成 IP 地址库（如 GeoIP2、ip2region 等）
 */
export function getIpAddress(ip: string): {
  province: string;
  country: string;
  city: string;
} {
  // 目前返回默认值，后续可以集成 IP 地址库
  // 推荐使用：
  // 1. MaxMind GeoIP2
  // 2. ip2region（中国 IP 数据）
  // 3. 淘宝 IP 地址库 API

  // 处理本地 IP（IPv4 和 IPv6）
  if (
    ip === 'unknown' || 
    ip === '127.0.0.1' || 
    ip === '::1' || 
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.')
  ) {
    return {
      province: '北京',  // 测试环境使用默认地域
      country: '中国',
      city: '北京',
    };
  }

  // TODO: 实际的 IP 地址解析逻辑
  // 推荐使用 ip2region 或 GeoIP2 库
  return {
    province: '未知',
    country: '未知',
    city: '未知',
  };
}
