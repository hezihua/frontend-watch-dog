import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { queryHttpErrors, queryJsErrors } from '@/services/monitor-query';
import * as XLSX from 'xlsx';

// GET - 导出错误数据
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
    const type = searchParams.get('type') || 'all'; // all, http, js
    const format = searchParams.get('format') || 'xlsx';

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

    const wb = XLSX.utils.book_new();

    // HTTP 错误数据
    if (type === 'all' || type === 'http') {
      const httpErrors = await queryHttpErrors({
        appId,
        size: 100,
      });

      const httpData = httpErrors.errors.map((error: any) => ({
        接口URL: error.url,
        请求方法: error.method,
        错误次数: error.errorCount,
        错误率: error.errorRate,
        状态码: error.statusCode,
        平均耗时: `${error.avgCost} ms`,
        最近错误时间: error.lastErrorTime ? new Date(error.lastErrorTime).toLocaleString('zh-CN') : '-',
      }));

      if (httpData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(httpData);
        XLSX.utils.book_append_sheet(wb, ws, 'HTTP错误');
      }
    }

    // JS 错误数据
    if (type === 'all' || type === 'js') {
      const jsErrors = await queryJsErrors({
        appId,
        size: 100,
      });

      const jsData = jsErrors.errors.map((error: any) => ({
        错误消息: error.message,
        文件名: error.filename,
        行号: error.lineno,
        列号: error.colno,
        发生次数: error.count,
        最近错误时间: error.lastErrorTime ? new Date(error.lastErrorTime).toLocaleString('zh-CN') : '-',
        错误堆栈: error.stack ? error.stack.substring(0, 100) + '...' : '',
      }));

      if (jsData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(jsData);
        XLSX.utils.book_append_sheet(wb, ws, 'JS错误');
      }
    }

    // 生成文件
    const filename = `errors_${type}_${app.appName}_${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      // CSV 只导出第一个 sheet
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(firstSheet);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    } else {
      // 导出 Excel
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }
  } catch (error) {
    console.error('导出错误数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '导出失败' },
      { status: 500 }
    );
  }
}
