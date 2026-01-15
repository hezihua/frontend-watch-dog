import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

    // 检查账号是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { account },
    });

    if (existingUser) {
      return NextResponse.json(
        { code: 1004, message: '该账号已被注册' },
        { status: 409 }
      );
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        account,
        encPassword: hashedPassword,
        status: 1,
      },
    });

    return NextResponse.json({
      code: 1000,
      message: '注册成功',
      data: {
        userId: user.id,
        account: user.account,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { code: 500, message: '服务器错误' },
      { status: 500 }
    );
  }
}
