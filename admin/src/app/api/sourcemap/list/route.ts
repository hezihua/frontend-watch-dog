import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { listSourceMaps, deleteSourceMap } from '@/lib/sourcemap';

// GET - 获取 SourceMap 文件列表
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

    // 获取 SourceMap 列表
    const files = await listSourceMaps(appId);

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: files,
    });
  } catch (error) {
    console.error('获取 SourceMap 列表失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取列表失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除 SourceMap 文件
export async function DELETE(request: NextRequest) {
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
    const filename = searchParams.get('filename');

    if (!appId || !filename) {
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

    // 删除 SourceMap
    const success = await deleteSourceMap(appId, filename);

    if (success) {
      return NextResponse.json({
        code: 1000,
        message: '删除成功',
      });
    } else {
      return NextResponse.json(
        { code: 1001, message: '删除失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('删除 SourceMap 失败:', error);
    return NextResponse.json(
      { code: 1001, message: '删除失败' },
      { status: 500 }
    );
  }
}
