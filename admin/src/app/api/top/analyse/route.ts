import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - 获取 Top 分析数据
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
    const type = searchParams.get('type'); // page, browser, device, os

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

    // TODO: 从 Elasticsearch 或数据库获取真实 Top 数据
    // 目前返回模拟数据
    const generateTopData = (names: string[]) => {
      return names.map((name, index) => ({
        label: name,
        value: Math.floor(Math.random() * 1000 + 100 * (names.length - index)),
      }));
    };

    let data;
    switch (type) {
      case 'page':
        data = generateTopData(['/home', '/product', '/about', '/contact', '/blog']);
        break;
      case 'browser':
        data = generateTopData(['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera']);
        break;
      case 'device':
        data = generateTopData(['Desktop', 'Mobile', 'Tablet', 'Unknown']);
        break;
      case 'os':
        data = generateTopData(['Windows', 'macOS', 'iOS', 'Android', 'Linux']);
        break;
      default:
        data = generateTopData(['/home', '/product', '/about']);
    }

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data,
    });
  } catch (error) {
    console.error('获取 Top 分析数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取 Top 分析数据失败' },
      { status: 500 }
    );
  }
}
