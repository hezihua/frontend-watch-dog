import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getUserAppsCache, cacheUserApps, clearUserAppsCache } from '@/services/cache';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// 获取用户 ID
function getUserIdFromToken(request: NextRequest): number | null {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

// 生成短 UUID
function generateShortUUID(): string {
  return uuidv4().replace(/-/g, '').substring(0, 16);
}

// GET - 获取应用列表
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { code: 1005, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    // 尝试从缓存获取
    const cachedApps = await getUserAppsCache(userId);
    if (cachedApps) {
      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: cachedApps,
      });
    }

    // 从数据库查询
    const apps = await prisma.app.findMany({
      where: { createId: userId },
      orderBy: { id: 'desc' },
    });

    // 缓存结果
    await cacheUserApps(userId, apps);

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: apps,
    });
  } catch (error) {
    console.error('获取应用列表失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取应用列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建应用
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { code: 1005, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appName, appType = 1 } = body;

    if (!appName) {
      return NextResponse.json(
        { code: 1001, message: '应用名称不能为空' },
        { status: 400 }
      );
    }

    const appId = generateShortUUID();

    const app = await prisma.app.create({
      data: {
        appId,
        appName,
        appType,
        createId: userId,
        status: 1,
      },
    });

    // 清除用户的应用列表缓存
    await clearUserAppsCache(userId);

    return NextResponse.json({
      code: 1000,
      message: '应用创建成功',
      data: {
        appId: app.appId,
        appName: app.appName,
      },
    });
  } catch (error) {
    console.error('创建应用失败:', error);
    return NextResponse.json(
      { code: 1001, message: '创建应用失败' },
      { status: 500 }
    );
  }
}
