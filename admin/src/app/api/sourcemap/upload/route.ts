import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { saveSourceMap } from '@/lib/sourcemap';

// POST - 上传 SourceMap 文件
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { code: 1005, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const appId = formData.get('appId') as string;
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!appId || !file || !filename) {
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

    // 读取文件内容
    const content = await file.text();

    // 保存 SourceMap
    await saveSourceMap(appId, filename, content);

    return NextResponse.json({
      code: 1000,
      message: 'SourceMap 上传成功',
      data: {
        appId,
        filename,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('上传 SourceMap 失败:', error);
    return NextResponse.json(
      { code: 1001, message: '上传 SourceMap 失败' },
      { status: 500 }
    );
  }
}
