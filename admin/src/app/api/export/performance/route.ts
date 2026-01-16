import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { queryPerformanceStats } from '@/services/monitor-query';
import * as XLSX from 'xlsx';

// GET - 导出性能数据
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
    const format = searchParams.get('format') || 'xlsx'; // xlsx or csv
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

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

    // 获取性能数据
    const stats = await queryPerformanceStats({
      appId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    // 准备导出数据
    const exportData = [
      {
        指标: '平均 FCP',
        值: `${stats.avgFcp.toFixed(2)} ms`,
        说明: 'First Contentful Paint - 首次内容绘制',
      },
      {
        指标: '平均 LCP',
        值: `${stats.avgLcp.toFixed(2)} ms`,
        说明: 'Largest Contentful Paint - 最大内容绘制',
      },
      {
        指标: '平均 FID',
        值: `${stats.avgFid.toFixed(2)} ms`,
        说明: 'First Input Delay - 首次输入延迟',
      },
      {
        指标: '平均 TTFB',
        值: `${stats.avgTtfb.toFixed(2)} ms`,
        说明: 'Time to First Byte - 首字节时间',
      },
      {
        指标: '平均 DNS 时间',
        值: `${stats.avgDns.toFixed(2)} ms`,
        说明: 'DNS 解析时间',
      },
      {
        指标: '平均 TCP 时间',
        值: `${stats.avgTcp.toFixed(2)} ms`,
        说明: 'TCP 连接时间',
      },
      {
        指标: '平均白屏时间',
        值: `${stats.avgWhiteTime.toFixed(2)} ms`,
        说明: '页面白屏时间',
      },
    ];

    // 页面性能详情
    const pageData = stats.byPage.map((page: any) => ({
      页面URL: page.key,
      样本数: page.doc_count,
      平均FCP: `${(page.avg_fcp?.value || 0).toFixed(2)} ms`,
      平均LCP: `${(page.avg_lcp?.value || 0).toFixed(2)} ms`,
      平均TTFB: `${(page.avg_ttfb?.value || 0).toFixed(2)} ms`,
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 添加概览sheet
    const ws1 = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws1, '性能概览');

    // 添加页面详情sheet
    if (pageData.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(pageData);
      XLSX.utils.book_append_sheet(wb, ws2, '页面性能详情');
    }

    // 生成文件
    const filename = `performance_${app.appName}_${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      // 导出 CSV (只导出第一个 sheet)
      const csv = XLSX.utils.sheet_to_csv(ws1);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
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
    console.error('导出性能数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '导出失败' },
      { status: 500 }
    );
  }
}
