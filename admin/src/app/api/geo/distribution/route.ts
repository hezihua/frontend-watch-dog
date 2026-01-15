import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    // TODO: 从数据库获取真实地域分布数据
    // 目前返回模拟数据
    const cities = [
      { province: '广东省', city: '深圳市', visitCount: 1234, userCount: 567, ratio: 23.5 },
      { province: '广东省', city: '广州市', visitCount: 987, userCount: 432, ratio: 18.7 },
      { province: '北京市', city: '北京市', visitCount: 876, userCount: 389, ratio: 16.6 },
      { province: '上海市', city: '上海市', visitCount: 765, userCount: 345, ratio: 14.5 },
      { province: '浙江省', city: '杭州市', visitCount: 654, userCount: 289, ratio: 12.4 },
    ];

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: cities,
    });
  } catch (error) {
    console.error('获取地域分布数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取地域分布数据失败' },
      { status: 500 }
    );
  }
}
