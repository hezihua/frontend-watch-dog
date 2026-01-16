import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { elasticsearch } from '@/lib/elasticsearch';

const MONITOR_INDEX = 'frontend-monitor';

// GET - 获取 HTTP 错误时间范围统计
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
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const url = searchParams.get('url');
    const statusCode = searchParams.get('statusCode');

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

    const must: any[] = [
      { term: { appId } },
      { term: { type: 'request' } },
      { term: { requestType: 'error' } },
    ];

    if (startTime && endTime) {
      must.push({
        range: {
          userTimeStamp: {
            gte: new Date(startTime).toISOString(),
            lte: new Date(endTime).toISOString(),
          },
        },
      });
    }

    if (url) {
      must.push({ match: { url } });
    }

    if (statusCode) {
      must.push({ term: { status: parseInt(statusCode) } });
    }

    try {
      const result = await elasticsearch.search({
        index: MONITOR_INDEX,
        body: {
          size: 0,
          query: {
            bool: { must },
          },
          aggs: {
            total_errors: {
              value_count: { field: 'url' },
            },
            by_status: {
              terms: { field: 'status', size: 20 },
            },
            by_url: {
              terms: { field: 'url', size: 20 },
              aggs: {
                count: { value_count: { field: 'url' } },
              },
            },
            time_distribution: {
              date_histogram: {
                field: 'userTimeStamp',
                calendar_interval: 'hour',
                time_zone: '+08:00',
              },
            },
          },
        },
      });

      const aggs = result.aggregations;

      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          totalErrors: aggs?.total_errors?.value || 0,
          byStatus: (aggs?.by_status?.buckets || []).map((b: any) => ({
            statusCode: b.key,
            count: b.doc_count,
          })),
          byUrl: (aggs?.by_url?.buckets || []).map((b: any) => ({
            url: b.key,
            count: b.doc_count,
          })),
          timeDistribution: (aggs?.time_distribution?.buckets || []).map((b: any) => ({
            time: b.key_as_string || new Date(b.key).toISOString(),
            count: b.doc_count,
          })),
        },
      });
    } catch (error) {
      console.error('查询 HTTP 错误范围失败:', error);
      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          totalErrors: 0,
          byStatus: [],
          byUrl: [],
          timeDistribution: [],
        },
      });
    }
  } catch (error) {
    console.error('获取 HTTP 错误范围失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取 HTTP 错误范围失败' },
      { status: 500 }
    );
  }
}
