import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { runAlertChecks } from '@/services/alert';

// POST - 手动触发告警检查
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { code: 1005, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appId } = body;

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

    // 运行告警检查
    await runAlertChecks(appId);

    return NextResponse.json({
      code: 1000,
      message: '告警检查已完成',
    });
  } catch (error) {
    console.error('告警检查失败:', error);
    return NextResponse.json(
      { code: 1001, message: '告警检查失败' },
      { status: 500 }
    );
  }
}

// GET - 获取所有应用的告警检查（可用于定时任务）
export async function GET(request: NextRequest) {
  try {
    // 简单验证（可以使用 API Key 等方式）
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.ALERT_API_KEY || 'dev-alert-key';

    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { code: 1005, message: '无权访问' },
        { status: 401 }
      );
    }

    // 获取所有启用的应用
    const apps = await prisma.app.findMany({
      where: { status: 1 },
      select: { appId: true, appName: true },
    });

    // 对每个应用运行告警检查
    const results = await Promise.allSettled(
      apps.map((app) => runAlertChecks(app.appId))
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      code: 1000,
      message: '批量告警检查完成',
      data: {
        total: apps.length,
        success: successCount,
        fail: failCount,
      },
    });
  } catch (error) {
    console.error('批量告警检查失败:', error);
    return NextResponse.json(
      { code: 1001, message: '批量告警检查失败' },
      { status: 500 }
    );
  }
}
