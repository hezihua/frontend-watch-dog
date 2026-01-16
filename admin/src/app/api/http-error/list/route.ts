import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { queryHttpErrors } from '@/services/monitor-query';

// GET - 获取 HTTP 错误列表
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

    // 从 Elasticsearch 获取真实 HTTP 错误数据
    const result = await queryHttpErrors({
      appId,
      startTime: undefined,
      endTime: undefined,
      size: 50,
    });

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: {
        list: result.errors,
        total: result.total,
        errorRate: result.errorRate,
      },
    });
  } catch (error) {
    console.error('获取 HTTP 错误列表失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取 HTTP 错误列表失败' },
      { status: 500 }
    );
  }
}
