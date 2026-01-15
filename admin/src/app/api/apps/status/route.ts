import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

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

// POST - 更新应用状态
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
    const { id, status } = body;

    if (typeof id !== 'number' || typeof status !== 'number') {
      return NextResponse.json(
        { code: 1001, message: '参数错误' },
        { status: 400 }
      );
    }

    // 验证应用是否属于当前用户
    const app = await prisma.app.findFirst({
      where: {
        id,
        createId: userId,
      },
    });

    if (!app) {
      return NextResponse.json(
        { code: 1001, message: '应用不存在' },
        { status: 404 }
      );
    }

    await prisma.app.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      code: 1000,
      message: status === 1 ? '应用已启用' : '应用已停用',
      data: null,
    });
  } catch (error) {
    console.error('更新应用状态失败:', error);
    return NextResponse.json(
      { code: 1001, message: '更新应用状态失败' },
      { status: 500 }
    );
  }
}
