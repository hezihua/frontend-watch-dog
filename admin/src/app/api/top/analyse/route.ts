import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { queryTopAnalyse } from '@/services/monitor-query';

// GET - 获取 Top 分析数据
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { code: 1005, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const type = searchParams.get('type'); // page, browser, device, os

    if (!appId) {
      return NextResponse.json(
        { code: 1001, message: '缺少 appId 参数' },
        { status: 400 }
      );
    }

    // 验证应用是否属于当前用户
    const app = await prisma.app.findFirst({
      where: {
        appId,
        createId: userId,
      },
    });

    if (!app) {
      return NextResponse.json(
        { code: 1001, message: '应用不存在或无权访问' },
        { status: 404 }
      );
    }

    // 从 Elasticsearch 获取真实 Top 数据
    const result = await queryTopAnalyse({
      appId,
      startTime: undefined,
      endTime: undefined,
    });

    let data;
    switch (type) {
      case 'page':
        data = result.topPages.map(p => ({ label: p.page, value: p.pv }));
        break;
      case 'browser':
        data = result.topBrowsers.map(b => ({ label: b.name, value: b.count }));
        break;
      case 'device':
        data = result.topDevices.map(d => ({ label: d.name || 'Unknown', value: d.count }));
        break;
      case 'os':
        data = result.topOs.map(o => ({ label: o.name, value: o.count }));
        break;
      default:
        data = result.topPages.map(p => ({ label: p.page, value: p.pv }));
    }

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data,
    });
  } catch (error) {
    console.error('获取 Top 分析数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取 Top 分析数据失败' },
      { status: 500 }
    );
  }
}
