import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { queryTrafficStats } from '@/services/monitor-query';

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

    // 获取今日数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayStats = await queryTrafficStats({
      appId,
      startTime: today,
      endTime: todayEnd,
    });

    // 获取昨日数据
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(today);
    yesterdayEnd.setMilliseconds(-1);

    const yesterdayStats = await queryTrafficStats({
      appId,
      startTime: yesterday,
      endTime: yesterdayEnd,
    });

    // 计算增长率
    const growth = yesterdayStats.uv
      ? (((todayStats.uv - yesterdayStats.uv) / yesterdayStats.uv) * 100).toFixed(2)
      : '0';

    const stats = {
      // 今日活跃用户（UV）
      activeUsers: todayStats.uv,
      // 总用户数（需要查询全部时间）
      allUsers: todayStats.uv, // 简化处理，实际应该查询全部
      // 新用户数
      newUsers: todayStats.newUsers,
      // 最近7天活跃用户趋势
      lastWeekActiveUsers: todayStats.trend.map((t: any) => t.uv?.value || 0),
      // 今日 PV
      todayPV: todayStats.pv,
      // 今日 UV
      todayUV: todayStats.uv,
      // 较昨日增长
      growth,
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
