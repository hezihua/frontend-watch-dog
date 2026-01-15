import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, password } = body;

    // 验证输入
    if (!account || !password) {
      return NextResponse.json(
        { code: 1001, message: '账号和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证格式：6-10位，只包含字母和数字
    const reg = /^[a-zA-Z0-9]{6,10}$/;
    if (!reg.test(account) || !reg.test(password)) {
      return NextResponse.json(
        { code: 1001, message: '账号和密码必须是6-10位，只包含数字和字母' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { account },
    });

    if (!user) {
      return NextResponse.json(
        { code: 1003, message: '账号或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.encPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { code: 1003, message: '账号或密码错误' },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (user.status !== 1) {
      return NextResponse.json(
        { code: 1006, message: '账号已被禁用' },
        { status: 403 }
      );
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, account: user.account },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    // 创建响应，设置 cookie
    const response = NextResponse.json({
      code: 1000,
      message: '登录成功',
      data: {
        userId: user.id,
        account: user.account,
      },
    });

    // 设置 HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { code: 500, message: '服务器错误' },
      { status: 500 }
    );
  }
}
