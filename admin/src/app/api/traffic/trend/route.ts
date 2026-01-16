import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { elasticsearch } from '@/lib/elasticsearch';

const MONITOR_INDEX = 'frontend-monitor';

// GET - 获取流量趋势数据
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
    const type = searchParams.get('type') || 'hour'; // hour 或 day
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

    const must: any[] = [{ term: { appId } }];

    // 默认查询最近7天或24小时
    let start: Date;
    let end: Date = new Date();

    if (startTime && endTime) {
      start = new Date(startTime);
      end = new Date(endTime);
    } else {
      if (type === 'hour') {
        // 最近24小时
        start = new Date(Date.now() - 24 * 60 * 60 * 1000);
      } else {
        // 最近7天
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    must.push({
      range: {
        userTimeStamp: {
          gte: start.toISOString(),
          lte: end.toISOString(),
        },
      },
    });

    try {
      const result = await elasticsearch.search({
        index: MONITOR_INDEX,
        body: {
          size: 0,
          query: {
            bool: { must },
          },
          aggs: {
            trend: {
              date_histogram: {
                field: 'userTimeStamp',
                calendar_interval: type === 'hour' ? 'hour' : 'day',
                time_zone: '+08:00',
                min_doc_count: 0,
                extended_bounds: {
                  min: start.getTime(),
                  max: end.getTime(),
                },
              },
              aggs: {
                pv: {
                  filter: {
                    terms: { type: ['performance', 'pageStatus'] },
                  },
                },
                uv: {
                  cardinality: {
                    field: 'markUserId',
                  },
                },
              },
            },
          },
        },
      });

      const buckets = result.aggregations?.trend?.buckets || [];
      const trendData = buckets.map((bucket: any) => ({
        time: bucket.key_as_string || new Date(bucket.key).toISOString(),
        timestamp: bucket.key,
        pv: bucket.pv?.doc_count || 0,
        uv: bucket.uv?.value || 0,
      }));

      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          type,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          trend: trendData,
        },
      });
    } catch (error) {
      console.error('查询流量趋势失败:', error);
      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          type,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          trend: [],
        },
      });
    }
  } catch (error) {
    console.error('获取流量趋势失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取流量趋势失败' },
      { status: 500 }
    );
  }
}
