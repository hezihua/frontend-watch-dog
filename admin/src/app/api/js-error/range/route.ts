import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { elasticsearch } from '@/lib/elasticsearch';

const MONITOR_INDEX = 'frontend-monitor';

// GET - 获取 JS 错误时间范围统计
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
    const message = searchParams.get('message');
    const filename = searchParams.get('filename');

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
      { term: { type: 'jsError' } },
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

    if (message) {
      must.push({ match: { message } });
    }

    if (filename) {
      must.push({ match: { filename } });
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
              value_count: { field: 'message.keyword' },
            },
            by_message: {
              terms: { field: 'message.keyword', size: 20 },
              aggs: {
                count: { value_count: { field: 'message.keyword' } },
              },
            },
            by_filename: {
              terms: { field: 'filename', size: 20 },
            },
            time_distribution: {
              date_histogram: {
                field: 'userTimeStamp',
                calendar_interval: 'hour',
                time_zone: '+08:00',
              },
            },
            affected_users: {
              cardinality: { field: 'markUserId' },
            },
          },
        },
      });

      const aggs = result.body?.aggregations;

      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          totalErrors: aggs?.total_errors?.value || 0,
          affectedUsers: aggs?.affected_users?.value || 0,
          byMessage: (aggs?.by_message?.buckets || []).map((b: any) => ({
            message: b.key,
            count: b.doc_count,
          })),
          byFilename: (aggs?.by_filename?.buckets || []).map((b: any) => ({
            filename: b.key,
            count: b.doc_count,
          })),
          timeDistribution: (aggs?.time_distribution?.buckets || []).map((b: any) => ({
            time: b.key_as_string || new Date(b.key).toISOString(),
            count: b.doc_count,
          })),
        },
      });
    } catch (error) {
      console.error('查询 JS 错误范围失败:', error);
      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          totalErrors: 0,
          affectedUsers: 0,
          byMessage: [],
          byFilename: [],
          timeDistribution: [],
        },
      });
    }
  } catch (error) {
    console.error('获取 JS 错误范围失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取 JS 错误范围失败' },
      { status: 500 }
    );
  }
}
