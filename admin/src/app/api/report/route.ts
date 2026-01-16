import { NextRequest, NextResponse } from 'next/server';
import UAParser from 'ua-parser-js';
import { ReportItem } from '@/types/report';
import { getUserIp, getIpAddress } from '@/lib/ip';
import { bulkSaveMonitorData } from '@/lib/elasticsearch';
import prisma from '@/lib/prisma';

/**
 * GET /api/report - 接收监控数据上报
 * 参数：
 *   - appId: 应用ID
 *   - data: JSON 字符串，包含监控数据数组
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const dataStr = searchParams.get('data');

    // 验证参数
    if (!appId || !dataStr) {
      return NextResponse.json(
        { code: 1001, message: '缺少必要参数 appId 或 data' },
        { status: 400 }
      );
    }

    // 解析数据
    let data: ReportItem[];
    try {
      data = JSON.parse(dataStr);
      if (!Array.isArray(data)) {
        throw new Error('data 必须是数组');
      }
    } catch (error) {
      return NextResponse.json(
        { code: 1001, message: '数据格式错误，data 必须是 JSON 数组' },
        { status: 400 }
      );
    }

    // 验证应用是否存在且启用
    const app = await prisma.app.findUnique({
      where: { appId },
      select: { status: true },
    });

    if (!app) {
      return NextResponse.json(
        { code: 1001, message: '应用不存在' },
        { status: 404 }
      );
    }

    if (app.status !== 1) {
      return NextResponse.json(
        { code: 1001, message: '应用未启用' },
        { status: 403 }
      );
    }

    // 解析 User-Agent
    const parser = new UAParser();
    const userAgent = request.headers.get('user-agent') || '';
    parser.setUA(userAgent);
    const uaResult = parser.getResult();

    // 获取 IP 地址信息
    const ip = getUserIp(request);
    const { province, country, city } = getIpAddress(ip);

    // 为每条数据添加环境信息
    const enrichedData: ReportItem[] = data.map((item) => ({
      ...item,
      appId,
      // User-Agent 信息
      browserName: uaResult.browser.name,
      browserVersion: uaResult.browser.version,
      browserMajor: uaResult.browser.major,
      osName: uaResult.os.name,
      osVersion: uaResult.os.version,
      deviceVendor: uaResult.device.vendor,
      deviceModel: uaResult.device.model,
      ua: uaResult.ua,
      // IP 地址信息
      ip,
      province,
      country,
      city,
    }));

    // 批量保存到 Elasticsearch
    const saved = await bulkSaveMonitorData(enrichedData);

    if (saved) {
      console.log(
        `✅ 成功接收并保存 ${enrichedData.length} 条监控数据，appId: ${appId}`
      );
      return NextResponse.json({
        code: 1000,
        message: '数据上报成功',
      });
    } else {
      return NextResponse.json(
        { code: 1001, message: '数据保存失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ 处理监控数据上报失败:', error);
    return NextResponse.json(
      { code: 1001, message: '服务器错误' },
      { status: 500 }
    );
  }
}
