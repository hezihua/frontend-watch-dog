import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { elasticsearch } from '@/lib/elasticsearch';

const MONITOR_INDEX = 'frontend-monitor';

// GET - 获取 HTTP 错误排行
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
    const type = searchParams.get('type') || 'error'; // error 或 done
    const size = parseInt(searchParams.get('size') || '10');

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
    ];

    if (type === 'error') {
      must.push({ term: { requestType: 'error' } });
    } else {
      must.push({ term: { requestType: 'done' } });
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
            by_url: {
              terms: {
                field: 'url',
                size,
                order: { _count: 'desc' },
              },
              aggs: {
                avg_cost: {
                  avg: { field: 'cost' },
                },
                status_codes: {
                  terms: { field: 'status', size: 5 },
                },
              },
            },
          },
        },
      });

      const aggs = result.body?.aggregations;
      const buckets = aggs?.by_url?.buckets || [];
      const rank = buckets.map((bucket: any, index: number) => ({
        rank: index + 1,
        url: bucket.key,
        count: bucket.doc_count,
        avgCost: Math.round((bucket.avg_cost?.value || 0) * 100) / 100,
        statusCodes: bucket.status_codes?.buckets?.map((b: any) => ({
          code: b.key,
          count: b.doc_count,
        })) || [],
      }));

      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          type,
          rank,
        },
      });
    } catch (error) {
      console.error('查询 HTTP 排行失败:', error);
      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: { type, rank: [] },
      });
    }
  } catch (error) {
    console.error('获取 HTTP 排行失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取 HTTP 排行失败' },
      { status: 500 }
    );
  }
}
