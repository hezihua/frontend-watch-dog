import { Client } from '@elastic/elasticsearch';
import { ReportItem } from '@/types/report';

export const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

// 索引名称
const MONITOR_INDEX = 'frontend-monitor';

/**
 * 初始化 Elasticsearch 索引
 */
export async function initElasticsearchIndex() {
  try {
    const indexExists = await elasticsearch.indices.exists({
      index: MONITOR_INDEX,
    });

    if (!indexExists) {
      await elasticsearch.indices.create({
        index: MONITOR_INDEX,
        body: {
          mappings: {
            properties: {
              // 时间戳
              userTimeStamp: { type: 'date' },
              // 用户标识
              markUserId: { type: 'keyword' },
              userId: { type: 'keyword' },
              appId: { type: 'keyword' },
              // 数据类型
              type: { type: 'keyword' },
              // 页面信息
              domain: { type: 'keyword' },
              pageUrl: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              isFirst: { type: 'boolean' },
              // 性能指标
              dnsTime: { type: 'float' },
              tcpTime: { type: 'float' },
              whiteTime: { type: 'float' },
              fcp: { type: 'float' },
              ttfb: { type: 'float' },
              lcp: { type: 'float' },
              fid: { type: 'float' },
              // HTTP 请求
              url: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              method: { type: 'keyword' },
              status: { type: 'integer' },
              requestType: { type: 'keyword' },
              cost: { type: 'float' },
              // JS 错误
              message: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              colno: { type: 'integer' },
              lineno: { type: 'integer' },
              stack: { type: 'text' },
              filename: { type: 'text' },
              // 资源错误
              resourceType: { type: 'keyword' },
              resourceUrl: { type: 'text' },
              // 页面状态
              inTime: { type: 'date' },
              leaveTime: { type: 'date' },
              residence: { type: 'float' },
              // User-Agent 信息
              browserName: { type: 'keyword' },
              browserVersion: { type: 'keyword' },
              browserMajor: { type: 'keyword' },
              osName: { type: 'keyword' },
              osVersion: { type: 'keyword' },
              deviceVendor: { type: 'keyword' },
              deviceModel: { type: 'keyword' },
              ua: { type: 'text' },
              // IP 地址信息
              ip: { type: 'ip' },
              province: { type: 'keyword' },
              city: { type: 'keyword' },
              country: { type: 'keyword' },
            },
          },
        },
      });
      console.log(`✅ Elasticsearch 索引 ${MONITOR_INDEX} 创建成功`);
    }
  } catch (error) {
    console.error('❌ 初始化 Elasticsearch 索引失败:', error);
  }
}

/**
 * 保存监控数据到 Elasticsearch
 */
export async function saveMonitorData(data: ReportItem) {
  try {
    await elasticsearch.index({
      index: MONITOR_INDEX,
      body: data,
    });
    return true;
  } catch (error) {
    console.error('❌ 保存监控数据到 Elasticsearch 失败:', error);
    return false;
  }
}

/**
 * 批量保存监控数据到 Elasticsearch
 */
export async function bulkSaveMonitorData(dataList: ReportItem[]) {
  try {
    const body = dataList.flatMap((doc) => [
      { index: { _index: MONITOR_INDEX } },
      doc,
    ]);

    const result = await elasticsearch.bulk({ body });

    if (result.errors) {
      console.error('❌ 批量保存部分数据失败');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 批量保存监控数据到 Elasticsearch 失败:', error);
    return false;
  }
}
