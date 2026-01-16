import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - 获取页面性能详情列表
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

    // 从 Elasticsearch 获取真实页面性能数据
    const { queryPerformanceStats } = await import('@/services/monitor-query');
    
    const stats = await queryPerformanceStats({
      appId,
      startTime: undefined,
      endTime: undefined,
    });

    const pages = stats.byPage.map((page: any, index: number) => ({
      id: index + 1,
      url: page.key,
      fcp: Math.round((page.avg_fcp?.value || 0) * 100) / 100,
      lcp: Math.round((page.avg_lcp?.value || 0) * 100) / 100,
      ttfb: Math.round((page.avg_ttfb?.value || 0) * 100) / 100,
      sampleCount: page.doc_count,
    }));

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: pages,
    });
  } catch (error) {
    console.error('获取页面性能数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取页面性能数据失败' },
      { status: 500 }
    );
  }
}
