/**
 * 告警服务
 * 支持邮件、钉钉、企业微信等多种通知方式
 */

import { elasticsearch } from '@/lib/elasticsearch';
import prisma from '@/lib/prisma';

const MONITOR_INDEX = 'frontend-monitor';

// 告警类型
export enum AlertType {
  ERROR_RATE_HIGH = 'ERROR_RATE_HIGH',           // 错误率过高
  PERFORMANCE_DEGRADED = 'PERFORMANCE_DEGRADED',  // 性能降级
  JS_ERROR_SPIKE = 'JS_ERROR_SPIKE',             // JS 错误激增
  HTTP_ERROR_SPIKE = 'HTTP_ERROR_SPIKE',         // HTTP 错误激增
}

// 告警级别
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

// 告警配置
export interface AlertConfig {
  appId: string;
  enabled: boolean;
  rules: {
    errorRateThreshold?: number;      // 错误率阈值（百分比）
    fcpThreshold?: number;             // FCP 阈值（毫秒）
    lcpThreshold?: number;             // LCP 阈值（毫秒）
    jsErrorCountThreshold?: number;    // JS 错误数量阈值
    httpErrorCountThreshold?: number;  // HTTP 错误数量阈值
  };
  channels: string[];  // 通知渠道: email, dingtalk, wecom, sms
  recipients: string[]; // 接收人列表
}

// 告警消息
export interface AlertMessage {
  type: AlertType;
  level: AlertLevel;
  appId: string;
  appName: string;
  title: string;
  message: string;
  detail?: any;
  timestamp: Date;
}

/**
 * 发送告警通知
 */
export async function sendAlert(alert: AlertMessage): Promise<void> {
  console.log('📢 告警通知:', {
    type: alert.type,
    level: alert.level,
    app: alert.appName,
    message: alert.message,
  });

  // 获取告警配置
  // const config = await getAlertConfig(alert.appId);
  // if (!config || !config.enabled) {
  //   return;
  // }

  // TODO: 实际发送到各个渠道
  // 这里提供接口示例，实际需要配置相应的服务

  // 邮件通知
  // await sendEmailAlert(alert, config.recipients);

  // 钉钉通知
  // await sendDingTalkAlert(alert);

  // 企业微信通知
  // await sendWeComAlert(alert);

  // 短信通知（仅严重告警）
  // if (alert.level === AlertLevel.CRITICAL) {
  //   await sendSmsAlert(alert, config.recipients);
  // }
}

/**
 * 检查错误率告警
 */
export async function checkErrorRateAlert(appId: string): Promise<void> {
  try {
    // 查询最近1小时的请求数据
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const result = await elasticsearch.search({
      index: MONITOR_INDEX,
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              { term: { appId } },
              { term: { type: 'request' } },
              {
                range: {
                  userTimeStamp: {
                    gte: oneHourAgo.toISOString(),
                    lte: now.toISOString(),
                  },
                },
              },
            ],
          },
        },
        aggs: {
          total_requests: {
            value_count: { field: 'url' },
          },
          error_requests: {
            filter: {
              term: { requestType: 'error' },
            },
          },
        },
      },
    });

    const total = result.aggregations?.total_requests?.value || 0;
    const errors = result.aggregations?.error_requests?.doc_count || 0;

    if (total === 0) return;

    const errorRate = (errors / total) * 100;

    // 如果错误率超过 5%，发送告警
    if (errorRate > 5) {
      const app = await prisma.app.findUnique({ where: { appId } });

      await sendAlert({
        type: AlertType.ERROR_RATE_HIGH,
        level: errorRate > 10 ? AlertLevel.CRITICAL : AlertLevel.WARNING,
        appId,
        appName: app?.appName || appId,
        title: '错误率告警',
        message: `应用 ${app?.appName} 的错误率达到 ${errorRate.toFixed(2)}%`,
        detail: {
          total,
          errors,
          errorRate: `${errorRate.toFixed(2)}%`,
          period: '最近1小时',
        },
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('检查错误率告警失败:', error);
  }
}

/**
 * 检查性能告警
 */
export async function checkPerformanceAlert(appId: string): Promise<void> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const result = await elasticsearch.search({
      index: MONITOR_INDEX,
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              { term: { appId } },
              { term: { type: 'performance' } },
              {
                range: {
                  userTimeStamp: {
                    gte: oneHourAgo.toISOString(),
                    lte: now.toISOString(),
                  },
                },
              },
            ],
          },
        },
        aggs: {
          avg_fcp: { avg: { field: 'fcp' } },
          avg_lcp: { avg: { field: 'lcp' } },
        },
      },
    });

    const avgFcp = result.aggregations?.avg_fcp?.value || 0;
    const avgLcp = result.aggregations?.avg_lcp?.value || 0;

    // 如果 FCP > 3秒 或 LCP > 4秒，发送告警
    if (avgFcp > 3000 || avgLcp > 4000) {
      const app = await prisma.app.findUnique({ where: { appId } });

      await sendAlert({
        type: AlertType.PERFORMANCE_DEGRADED,
        level: AlertLevel.WARNING,
        appId,
        appName: app?.appName || appId,
        title: '性能降级告警',
        message: `应用 ${app?.appName} 性能指标异常`,
        detail: {
          avgFcp: `${avgFcp.toFixed(2)} ms`,
          avgLcp: `${avgLcp.toFixed(2)} ms`,
          period: '最近1小时',
          threshold: {
            fcp: '3000 ms',
            lcp: '4000 ms',
          },
        },
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('检查性能告警失败:', error);
  }
}

/**
 * 检查 JS 错误告警
 */
export async function checkJsErrorAlert(appId: string): Promise<void> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const result = await elasticsearch.search({
      index: MONITOR_INDEX,
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              { term: { appId } },
              { term: { type: 'jsError' } },
              {
                range: {
                  userTimeStamp: {
                    gte: oneHourAgo.toISOString(),
                    lte: now.toISOString(),
                  },
                },
              },
            ],
          },
        },
        aggs: {
          error_count: {
            value_count: { field: 'message.keyword' },
          },
        },
      },
    });

    const errorCount = result.aggregations?.error_count?.value || 0;

    // 如果错误数量超过 50，发送告警
    if (errorCount > 50) {
      const app = await prisma.app.findUnique({ where: { appId } });

      await sendAlert({
        type: AlertType.JS_ERROR_SPIKE,
        level: errorCount > 100 ? AlertLevel.CRITICAL : AlertLevel.WARNING,
        appId,
        appName: app?.appName || appId,
        title: 'JS 错误激增告警',
        message: `应用 ${app?.appName} JS 错误数量激增`,
        detail: {
          errorCount,
          period: '最近1小时',
          threshold: 50,
        },
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('检查 JS 错误告警失败:', error);
  }
}

/**
 * 运行所有告警检查
 */
export async function runAlertChecks(appId: string): Promise<void> {
  await Promise.all([
    checkErrorRateAlert(appId),
    checkPerformanceAlert(appId),
    checkJsErrorAlert(appId),
  ]);
}

/**
 * 邮件告警（示例）
 */
async function sendEmailAlert(alert: AlertMessage, recipients: string[]): Promise<void> {
  // TODO: 集成邮件服务
  // 推荐使用 nodemailer
  console.log('📧 邮件告警:', { recipients, alert });
}

/**
 * 钉钉告警（示例）
 */
async function sendDingTalkAlert(alert: AlertMessage): Promise<void> {
  // TODO: 集成钉钉机器人
  // Webhook URL: https://oapi.dingtalk.com/robot/send?access_token=xxx
  console.log('📱 钉钉告警:', alert);
}

/**
 * 企业微信告警（示例）
 */
async function sendWeComAlert(alert: AlertMessage): Promise<void> {
  // TODO: 集成企业微信机器人
  console.log('💬 企业微信告警:', alert);
}

/**
 * 短信告警（示例）
 */
async function sendSmsAlert(alert: AlertMessage, recipients: string[]): Promise<void> {
  // TODO: 集成短信服务（如阿里云、腾讯云）
  console.log('📲 短信告警:', { recipients, alert });
}
