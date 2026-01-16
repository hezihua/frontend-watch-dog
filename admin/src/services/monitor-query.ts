/**
 * 监控数据查询服务
 * 从 Elasticsearch 查询各类监控数据
 */

import { elasticsearch } from '@/lib/elasticsearch';

const MONITOR_INDEX = 'frontend-monitor';

// 查询参数接口
interface QueryParams {
  appId: string;
  startTime?: Date;
  endTime?: Date;
  pageUrl?: string;
  from?: number;
  size?: number;
}

/**
 * 查询流量统计数据
 */
export async function queryTrafficStats(params: QueryParams) {
  const { appId, startTime, endTime } = params;

  const must: any[] = [{ term: { appId } }];

  // 添加时间范围过滤
  if (startTime || endTime) {
    const timeRange: any = {};
    if (startTime) timeRange.gte = startTime.toISOString();
    if (endTime) timeRange.lte = endTime.toISOString();
    must.push({ range: { userTimeStamp: timeRange } });
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
          // PV (Page View) - 页面访问次数
          pv: {
            filter: {
              terms: { type: ['performance', 'pageStatus'] },
            },
          },
          // UV (Unique Visitor) - 独立访问用户数
          uv: {
            cardinality: {
              field: 'markUserId',
            },
          },
          // 新用户数（首次访问）
          new_users: {
            filter: {
              bool: {
                must: [
                  { term: { type: 'performance' } },
                  { term: { isFirst: true } },
                ],
              },
            },
            aggs: {
              count: {
                cardinality: {
                  field: 'markUserId',
                },
              },
            },
          },
          // 按小时分组统计（用于趋势图）
          trend_by_hour: {
            date_histogram: {
              field: 'userTimeStamp',
              calendar_interval: 'hour',
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

    return {
      pv: result.aggregations?.pv?.doc_count || 0,
      uv: result.aggregations?.uv?.value || 0,
      newUsers: result.aggregations?.new_users?.count?.value || 0,
      trend: result.aggregations?.trend_by_hour?.buckets || [],
    };
  } catch (error) {
    console.error('查询流量统计失败:', error);
    return { pv: 0, uv: 0, newUsers: 0, trend: [] };
  }
}

/**
 * 查询性能统计数据
 */
export async function queryPerformanceStats(params: QueryParams) {
  const { appId, startTime, endTime, pageUrl } = params;

  const must: any[] = [
    { term: { appId } },
    { term: { type: 'performance' } },
  ];

  if (startTime || endTime) {
    const timeRange: any = {};
    if (startTime) timeRange.gte = startTime.toISOString();
    if (endTime) timeRange.lte = endTime.toISOString();
    must.push({ range: { userTimeStamp: timeRange } });
  }

  if (pageUrl) {
    must.push({ match: { pageUrl } });
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
          avg_fcp: { avg: { field: 'fcp' } },
          avg_lcp: { avg: { field: 'lcp' } },
          avg_fid: { avg: { field: 'fid' } },
          avg_ttfb: { avg: { field: 'ttfb' } },
          avg_dns: { avg: { field: 'dnsTime' } },
          avg_tcp: { avg: { field: 'tcpTime' } },
          avg_white_time: { avg: { field: 'whiteTime' } },
          // 按页面分组
          by_page: {
            terms: {
              field: 'pageUrl',
              size: 10,
            },
            aggs: {
              avg_fcp: { avg: { field: 'fcp' } },
              avg_lcp: { avg: { field: 'lcp' } },
              avg_ttfb: { avg: { field: 'ttfb' } },
            },
          },
        },
      },
    });

    const aggs = result.aggregations;
    return {
      avgFcp: aggs?.avg_fcp?.value || 0,
      avgLcp: aggs?.avg_lcp?.value || 0,
      avgFid: aggs?.avg_fid?.value || 0,
      avgTtfb: aggs?.avg_ttfb?.value || 0,
      avgDns: aggs?.avg_dns?.value || 0,
      avgTcp: aggs?.avg_tcp?.value || 0,
      avgWhiteTime: aggs?.avg_white_time?.value || 0,
      byPage: aggs?.by_page?.buckets || [],
    };
  } catch (error) {
    console.error('查询性能统计失败:', error);
    return {
      avgFcp: 0,
      avgLcp: 0,
      avgFid: 0,
      avgTtfb: 0,
      avgDns: 0,
      avgTcp: 0,
      avgWhiteTime: 0,
      byPage: [],
    };
  }
}

/**
 * 查询 HTTP 错误列表
 */
export async function queryHttpErrors(params: QueryParams) {
  const { appId, startTime, endTime, from = 0, size = 20 } = params;

  const must: any[] = [
    { term: { appId } },
    { term: { type: 'request' } },
    { term: { requestType: 'error' } },
  ];

  if (startTime || endTime) {
    const timeRange: any = {};
    if (startTime) timeRange.gte = startTime.toISOString();
    if (endTime) timeRange.lte = endTime.toISOString();
    must.push({ range: { userTimeStamp: timeRange } });
  }

  try {
    // 按 URL 聚合统计错误
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
            },
            aggs: {
              error_count: {
                value_count: { field: 'url' },
              },
              avg_cost: {
                avg: { field: 'cost' },
              },
              status_codes: {
                terms: { field: 'status' },
              },
              latest: {
                top_hits: {
                  size: 1,
                  sort: [{ userTimeStamp: { order: 'desc' } }],
                  _source: ['method', 'status', 'cost', 'pageUrl', 'userTimeStamp'],
                },
              },
            },
          },
          total_errors: {
            value_count: { field: 'url' },
          },
          total_requests: {
            filter: {
              bool: {
                must: [
                  { term: { appId } },
                  { term: { type: 'request' } },
                ],
              },
            },
          },
        },
      },
    });

    const buckets = result.aggregations?.by_url?.buckets || [];
    const totalErrors = result.aggregations?.total_errors?.value || 0;
    const totalRequests = result.aggregations?.total_requests?.doc_count || 1;
    const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);

    const errors = buckets.map((bucket: any, index: number) => {
      const latest = bucket.latest?.hits?.hits?.[0]?._source || {};
      return {
        id: index + 1,
        url: bucket.key,
        method: latest.method || 'GET',
        errorCount: bucket.error_count?.value || 0,
        errorRate: ((bucket.doc_count / totalRequests) * 100).toFixed(2) + '%',
        statusCode: bucket.status_codes?.buckets?.[0]?.key || 500,
        avgCost: bucket.avg_cost?.value?.toFixed(2) || 0,
        lastErrorTime: latest.userTimeStamp,
      };
    });

    return {
      errors,
      total: totalErrors,
      errorRate: errorRate + '%',
    };
  } catch (error) {
    console.error('查询 HTTP 错误失败:', error);
    return { errors: [], total: 0, errorRate: '0%' };
  }
}

/**
 * 查询 JS 错误列表
 */
export async function queryJsErrors(params: QueryParams) {
  const { appId, startTime, endTime, from = 0, size = 20 } = params;

  const must: any[] = [
    { term: { appId } },
    { term: { type: 'jsError' } },
  ];

  if (startTime || endTime) {
    const timeRange: any = {};
    if (startTime) timeRange.gte = startTime.toISOString();
    if (endTime) timeRange.lte = endTime.toISOString();
    must.push({ range: { userTimeStamp: timeRange } });
  }

  try {
    // 按错误消息聚合
    const result = await elasticsearch.search({
      index: MONITOR_INDEX,
      body: {
        size: 0,
        query: {
          bool: { must },
        },
        aggs: {
          by_message: {
            terms: {
              field: 'message.keyword',
              size,
            },
            aggs: {
              count: {
                value_count: { field: 'message.keyword' },
              },
              latest: {
                top_hits: {
                  size: 1,
                  sort: [{ userTimeStamp: { order: 'desc' } }],
                  _source: ['filename', 'lineno', 'colno', 'stack', 'pageUrl', 'userTimeStamp'],
                },
              },
            },
          },
          total_errors: {
            value_count: { field: 'message.keyword' },
          },
        },
      },
    });

    const buckets = result.aggregations?.by_message?.buckets || [];
    const totalErrors = result.aggregations?.total_errors?.value || 0;

    const errors = buckets.map((bucket: any, index: number) => {
      const latest = bucket.latest?.hits?.hits?.[0]?._source || {};
      return {
        id: index + 1,
        message: bucket.key,
        count: bucket.count?.value || 0,
        filename: latest.filename || 'unknown',
        lineno: latest.lineno || 0,
        colno: latest.colno || 0,
        stack: latest.stack || '',
        pageUrl: latest.pageUrl || '',
        lastErrorTime: latest.userTimeStamp,
      };
    });

    return {
      errors,
      total: totalErrors,
    };
  } catch (error) {
    console.error('查询 JS 错误失败:', error);
    return { errors: [], total: 0 };
  }
}

/**
 * 查询 Top 分析数据
 */
export async function queryTopAnalyse(params: QueryParams) {
  const { appId, startTime, endTime } = params;

  const must: any[] = [{ term: { appId } }];

  if (startTime || endTime) {
    const timeRange: any = {};
    if (startTime) timeRange.gte = startTime.toISOString();
    if (endTime) timeRange.lte = endTime.toISOString();
    must.push({ range: { userTimeStamp: timeRange } });
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
          // Top 页面
          top_pages: {
            terms: {
              field: 'pageUrl',
              size: 10,
            },
            aggs: {
              uv: {
                cardinality: { field: 'markUserId' },
              },
            },
          },
          // Top 浏览器
          top_browsers: {
            terms: {
              field: 'browserName',
              size: 10,
            },
          },
          // Top 操作系统
          top_os: {
            terms: {
              field: 'osName',
              size: 10,
            },
          },
          // Top 设备
          top_devices: {
            terms: {
              field: 'deviceVendor',
              size: 10,
            },
          },
        },
      },
    });

    const aggs = result.aggregations;

    return {
      topPages: (aggs?.top_pages?.buckets || []).map((b: any) => ({
        page: b.key,
        pv: b.doc_count,
        uv: b.uv?.value || 0,
      })),
      topBrowsers: (aggs?.top_browsers?.buckets || []).map((b: any) => ({
        name: b.key || 'Unknown',
        count: b.doc_count,
      })),
      topOs: (aggs?.top_os?.buckets || []).map((b: any) => ({
        name: b.key || 'Unknown',
        count: b.doc_count,
      })),
      topDevices: (aggs?.top_devices?.buckets || []).map((b: any) => ({
        name: b.key || 'Unknown',
        count: b.doc_count,
      })),
    };
  } catch (error) {
    console.error('查询 Top 分析失败:', error);
    return {
      topPages: [],
      topBrowsers: [],
      topOs: [],
      topDevices: [],
    };
  }
}

/**
 * 查询地域分布数据
 */
export async function queryGeoDistribution(params: QueryParams) {
  const { appId, startTime, endTime } = params;

  const must: any[] = [{ term: { appId } }];

  if (startTime || endTime) {
    const timeRange: any = {};
    if (startTime) timeRange.gte = startTime.toISOString();
    if (endTime) timeRange.lte = endTime.toISOString();
    must.push({ range: { userTimeStamp: timeRange } });
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
          // 按省份统计
          by_province: {
            terms: {
              field: 'province',
              size: 50,
            },
            aggs: {
              uv: {
                cardinality: { field: 'markUserId' },
              },
            },
          },
          // 按城市统计
          by_city: {
            terms: {
              field: 'city',
              size: 50,
            },
            aggs: {
              uv: {
                cardinality: { field: 'markUserId' },
              },
            },
          },
        },
      },
    });

    const aggs = result.aggregations;

    return {
      provinces: (aggs?.by_province?.buckets || []).map((b: any) => ({
        name: b.key,
        pv: b.doc_count,
        uv: b.uv?.value || 0,
      })),
      cities: (aggs?.by_city?.buckets || []).map((b: any) => ({
        name: b.key,
        pv: b.doc_count,
        uv: b.uv?.value || 0,
      })),
    };
  } catch (error) {
    console.error('查询地域分布失败:', error);
    return { provinces: [], cities: [] };
  }
}
