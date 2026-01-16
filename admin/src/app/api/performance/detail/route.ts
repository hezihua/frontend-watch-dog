import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { elasticsearch } from '@/lib/elasticsearch';

const MONITOR_INDEX = 'frontend-monitor';

// GET - 获取性能详细数据列表（支持分页和过滤）
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
    const pageUrl = searchParams.get('pageUrl');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const whiteTimeRange = searchParams.get('whiteTimeRange'); // 1:1s以内 2:1~2s 3:2~3s 4:3s以上
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
      { term: { type: 'performance' } },
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

    if (pageUrl) {
      must.push({ match: { pageUrl } });
    }

    // 白屏时间范围过滤
    if (whiteTimeRange) {
      const range: any = {};
      switch (whiteTimeRange) {
        case '1':
          range.lte = 1000;
          break;
        case '2':
          range.gte = 1000;
          range.lte = 2000;
          break;
        case '3':
          range.gte = 2000;
          range.lte = 3000;
          break;
        case '4':
          range.gte = 3000;
          break;
      }
      must.push({ range: { whiteTime: range } });
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
            'pageUrl',
            'domain',
            'fcp',
            'lcp',
            'fid',
            'ttfb',
            'dnsTime',
            'tcpTime',
            'whiteTime',
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
        fcp: Math.round((hit._source.fcp || 0) * 100) / 100,
        lcp: Math.round((hit._source.lcp || 0) * 100) / 100,
        fid: Math.round((hit._source.fid || 0) * 100) / 100,
        ttfb: Math.round((hit._source.ttfb || 0) * 100) / 100,
        dnsTime: Math.round((hit._source.dnsTime || 0) * 100) / 100,
        tcpTime: Math.round((hit._source.tcpTime || 0) * 100) / 100,
        whiteTime: Math.round((hit._source.whiteTime || 0) * 100) / 100,
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
      console.error('查询性能详细数据失败:', error);
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
    console.error('获取性能详细数据失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取性能详细数据失败' },
      { status: 500 }
    );
  }
}
