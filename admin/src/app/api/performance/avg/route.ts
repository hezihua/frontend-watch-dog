import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { queryPerformanceStats } from '@/services/monitor-query';

// GET - 获取应用平均性能指标
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
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

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

    // 从 Elasticsearch 获取真实性能数据
    const stats = await queryPerformanceStats({
      appId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    console.log('📊 性能查询结果:', { appId, startTime, endTime, stats });

    const performanceData = {
      fcp: Math.round(stats.avgFcp * 100) / 100,  // First Contentful Paint
      lcp: Math.round(stats.avgLcp * 100) / 100, // Largest Contentful Paint
      fid: Math.round(stats.avgFid * 100) / 100,    // First Input Delay
      ttfb: Math.round(stats.avgTtfb * 100) / 100,  // Time to First Byte
      dnsTime: Math.round(stats.avgDns * 100) / 100,
      tcpTime: Math.round(stats.avgTcp * 100) / 100,
      whiteTime: Math.round(stats.avgWhiteTime * 100) / 100,
    };

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: performanceData,
    });
  } catch (error) {
    console.error('获取性能数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取性能数据失败' },
      { status: 500 }
    );
  }
}
