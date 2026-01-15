import { NextRequest, NextResponse } from 'next/server';
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

// GET - 获取应用统计数据（模拟数据，后续可以对接真实数据源）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { code: 1005, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    const { appId } = await params;

    // TODO: 对接真实的数据统计逻辑
    // 这里返回模拟数据
    const stats = {
      activeUsers: Math.floor(Math.random() * 1000),
      allUsers: Math.floor(Math.random() * 5000) + 1000,
      newUsers: Math.floor(Math.random() * 200),
      lastWeekActiveUers: Array.from({ length: 7 }, () => Math.floor(Math.random() * 500)),
    };

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: stats,
    });
  } catch (error) {
    console.error('获取应用统计失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取应用统计失败' },
      { status: 500 }
    );
  }
}
