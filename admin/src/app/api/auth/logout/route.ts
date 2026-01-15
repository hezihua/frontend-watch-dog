import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // 清除 token cookie
    const cookieStore = await cookies();
    cookieStore.delete('token');

    return NextResponse.json({
      code: 1000,
      message: '退出登录成功',
      data: null,
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    return NextResponse.json(
      { code: 1001, message: '退出登录失败' },
      { status: 500 }
    );
  }
}
