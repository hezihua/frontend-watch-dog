import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseErrorStack, getSourceContext } from '@/lib/sourcemap';

// POST - 解析 JS 错误堆栈
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
    const { appId, filename, line, column } = body;

    if (!appId || !filename || line === undefined || column === undefined) {
      return NextResponse.json(
        { code: 1001, message: '缺少必要参数' },
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

    // 解析错误位置
    const originalPosition = await parseErrorStack(
      appId,
      filename,
      parseInt(line),
      parseInt(column)
    );

    if (!originalPosition) {
      return NextResponse.json({
        code: 1000,
        message: 'SourceMap 不存在或解析失败',
        data: null,
      });
    }

    // 获取源代码上下文
    const sourceContext = await getSourceContext(
      appId,
      filename,
      originalPosition.line,
      5
    );

    return NextResponse.json({
      code: 1000,
      message: '解析成功',
      data: {
        original: {
          filename,
          line,
          column,
        },
        parsed: {
          source: originalPosition.source,
          line: originalPosition.line,
          column: originalPosition.column,
          name: originalPosition.name,
        },
        context: sourceContext,
      },
    });
  } catch (error) {
    console.error('解析 JS 错误堆栈失败:', error);
    return NextResponse.json(
      { code: 1001, message: '解析失败' },
      { status: 500 }
    );
  }
}
