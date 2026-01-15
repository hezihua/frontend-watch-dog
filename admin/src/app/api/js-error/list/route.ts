import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - 获取 JS 错误列表
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

    // TODO: 从 Elasticsearch 或数据库获取真实 JS 错误数据
    // 目前返回模拟数据
    const errors = [
      {
        id: 1,
        message: 'Cannot read property of undefined',
        type: 'TypeError',
        count: Math.floor(Math.random() * 50 + 5),
        userCount: Math.floor(Math.random() * 30 + 3),
        stack: 'at App.tsx:123:45',
      },
      {
        id: 2,
        message: 'Network request failed',
        type: 'NetworkError',
        count: Math.floor(Math.random() * 20 + 2),
        userCount: Math.floor(Math.random() * 15 + 2),
        stack: 'at api.ts:67:12',
      },
    ];

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: errors,
    });
  } catch (error) {
    console.error('获取 JS 错误列表失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取 JS 错误列表失败' },
      { status: 500 }
    );
  }
}
