import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { elasticsearch } from '@/lib/elasticsearch';

const MONITOR_INDEX = 'frontend-monitor';

// GET - 获取 HTTP 请求详细数据列表（支持分页和过滤）
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
    const url = searchParams.get('url');
    const link = searchParams.get('link'); // 来源页面
    const requestType = searchParams.get('requestType'); // done, error, timeout
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const from = parseInt(searchParams.get('from') || '0');
    const size = parseInt(searchParams.get('size') || '20');

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

    if (startTime && endTime) {
      must.push({
        range: {
          userTimeStamp: {
            gte: new Date(startTime).getTime(),
            lte: new Date(endTime).getTime(),
          },
        },
      });
    }

    if (url) {
      must.push({ match: { url } });
    }

    if (link) {
      must.push({ match: { pageUrl: link } });
    }

    if (requestType) {
      must.push({ term: { requestType } });
    }

    try {
      const result = await elasticsearch.search({
        index: MONITOR_INDEX,
        body: {
          from,
          size,
          query: {
            bool: { must },
          },
          sort: [{ userTimeStamp: { order: 'desc' } }],
          _source: [
            'url',
            'method',
            'status',
            'requestType',
            'cost',
            'pageUrl',
            'userTimeStamp',
            'browserName',
            'osName',
            'province',
            'city',
          ],
        },
      });

      const hits = result.body?.hits || result.hits;
      const total = typeof hits.total === 'number' 
        ? hits.total 
        : hits.total?.value || 0;

      const list = hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        cost: Math.round((hit._source.cost || 0) * 100) / 100,
      }));

      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          list,
          total,
          from,
          size,
        },
      });
    } catch (error) {
      console.error('查询 HTTP 详细数据失败:', error);
      return NextResponse.json({
        code: 1000,
        message: '成功',
        data: {
          list: [],
          total: 0,
          from,
          size,
        },
      });
    }
  } catch (error) {
    console.error('获取 HTTP 详细数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取 HTTP 详细数据失败' },
      { status: 500 }
    );
  }
}
