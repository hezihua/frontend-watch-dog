import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { elasticsearch } from '@/lib/elasticsearch';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const MONITOR_INDEX = 'frontend-monitor';

function getUserIdFromToken(request: NextRequest): number | null {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET - 获取应用统计数据
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { code: 1005, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    const { appId } = await params;

    // 查询真实数据
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7DaysStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    // 使用毫秒时间戳（而不是 ISO 字符串）
    const todayStartMs = todayStart.getTime();
    const last7DaysStartMs = last7DaysStart.getTime();
    const nowMs = now.getTime();

    // 1. 总用户数和今日活跃用户
    const userStatsResult = await elasticsearch.search({
      index: MONITOR_INDEX,
      body: {
        size: 0,
        query: {
          term: { appId },
        },
        aggs: {
          total_users: {
            cardinality: { field: 'markUserId' },
          },
          today_active_users: {
            filter: {
              range: {
                userTimeStamp: { gte: todayStartMs },
              },
            },
            aggs: {
              count: {
                cardinality: { field: 'markUserId' },
              },
            },
          },
        },
      },
    });

    // 2. 新用户数（今天首次访问）
    const newUsersResult = await elasticsearch.search({
      index: MONITOR_INDEX,
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              { term: { appId } },
              { term: { isFirst: true } },
              {
                range: {
                  userTimeStamp: { gte: todayStartMs },
                },
              },
            ],
          },
        },
        aggs: {
          new_users: {
            cardinality: { field: 'markUserId' },
          },
        },
      },
    });

    // 3. 最近7天每天的活跃用户数
    const last7DaysResult = await elasticsearch.search({
      index: MONITOR_INDEX,
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              { term: { appId } },
              {
                range: {
                  userTimeStamp: {
                    gte: last7DaysStartMs,
                    lte: nowMs,
                  },
                },
              },
            ],
          },
        },
        aggs: {
          daily_users: {
            date_histogram: {
              field: 'userTimeStamp',
              calendar_interval: 'day',
              time_zone: '+08:00',
              min_doc_count: 0,
              extended_bounds: {
                min: last7DaysStartMs,
                max: nowMs,
              },
            },
            aggs: {
              unique_users: {
                cardinality: { field: 'markUserId' },
              },
            },
          },
        },
      },
    });

    const allUsers = userStatsResult.aggregations?.total_users?.value || 0;
    const activeUsers = userStatsResult.aggregations?.today_active_users?.count?.value || 0;
    const newUsers = newUsersResult.aggregations?.new_users?.value || 0;
    
    const dailyBuckets = last7DaysResult.aggregations?.daily_users?.buckets || [];
    const lastWeekActiveUers = dailyBuckets.map((bucket: any) => bucket.unique_users?.value || 0);

    const stats = {
      activeUsers,
      allUsers,
      newUsers,
      lastWeekActiveUers,
    };

    return NextResponse.json({
      code: 1000,
      message: '成功',
      data: stats,
    });
  } catch (error) {
    console.error('获取应用统计失败:', error);
    return NextResponse.json(
      { code: 1001, message: '获取应用统计失败' },
      { status: 500 }
    );
  }
}
