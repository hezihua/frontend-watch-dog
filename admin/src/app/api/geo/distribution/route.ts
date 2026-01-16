import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { queryGeoDistribution } from '@/services/monitor-query';

// GET - 获取地域分布数据
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

    // 从 Elasticsearch 获取真实地域分布数据
    const result = await queryGeoDistribution({
      appId,
      startTime: undefined,
      endTime: undefined,
    });

    // 转换为前端期望的格式: { key, doc_count, uv }
    const data = result.provinces.map((province) => ({
      key: province.name,
      doc_count: province.pv,
      uv: {
        value: province.uv,
      },
    }));

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data,
    });
  } catch (error) {
    console.error('获取地域分布数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取地域分布数据失败' },
      { status: 500 }
    );
  }
}
