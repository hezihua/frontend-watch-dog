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

    // TODO: 从 Elasticsearch 或数据库获取真实页面性能数据
    // 目前返回模拟数据
    const pages = [
      {
        id: 1,
        url: '/home',
        fcp: Math.floor(Math.random() * 1000 + 500),
        lcp: Math.floor(Math.random() * 2000 + 1000),
        fid: Math.floor(Math.random() * 100 + 50),
        ttfb: Math.floor(Math.random() * 500 + 200),
        sampleCount: Math.floor(Math.random() * 1000 + 100),
      },
      {
        id: 2,
        url: '/product/detail',
        fcp: Math.floor(Math.random() * 1000 + 500),
        lcp: Math.floor(Math.random() * 2000 + 1000),
        fid: Math.floor(Math.random() * 100 + 50),
        ttfb: Math.floor(Math.random() * 500 + 200),
        sampleCount: Math.floor(Math.random() * 1000 + 100),
      },
    ];

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
