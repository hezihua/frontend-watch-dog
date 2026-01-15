import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - 获取应用统计数据
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

    // TODO: 从真实数据源获取统计数据
    // 目前返回模拟数据
    const stats = {
      // 今日活跃用户
      activeUsers: Math.floor(Math.random() * 1000),
      // 总用户数
      allUsers: Math.floor(Math.random() * 5000) + 1000,
      // 新用户数
      newUsers: Math.floor(Math.random() * 200),
      // 最近7天活跃用户趋势
      lastWeekActiveUsers: Array.from({ length: 7 }, () => Math.floor(Math.random() * 500)),
      // 今日 PV
      todayPV: Math.floor(Math.random() * 10000),
      // 今日 UV
      todayUV: Math.floor(Math.random() * 2000),
      // 较昨日增长
      growth: (Math.random() * 20 - 10).toFixed(2),
    };

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: stats,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
