'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Tooltip, message, Spin, Tag } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

interface AppItemProps {
  appInfo: {
    id: number;
    appId: string;
    appName: string;
    status: number;
  };
  onUpdate: () => void;
}

interface AppStats {
  activeUsers: number;
  allUsers: number;
  newUsers: number;
  lastWeekActiveUers: number[];
}

export default function AppItem({ appInfo, onUpdate }: AppItemProps) {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [appInfo.appId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/apps/${appInfo.appId}/stats`);
      const data = await res.json();
      if (data.code === 1000) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAppId = () => {
    navigator.clipboard.writeText(appInfo.appId);
    message.success('AppId 已复制到剪贴板');
  };

  const toggleStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/apps/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appInfo.id,
          status: appInfo.status === 1 ? 0 : 1,
        }),
      });

      const data = await res.json();
      if (data.code === 1000) {
        message.success(data.message);
        onUpdate();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <Card
      style={{
        position: 'relative',
        minHeight: 200,
      }}
      styles={{
        body: { padding: 20 }
      }}
    >
      {appInfo.status !== 1 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            borderRadius: 8,
          }}
        >
          <div style={{ color: 'white', marginBottom: 16, fontSize: 16 }}>
            应用已关闭
          </div>
          <Button 
            type="primary" 
            onClick={toggleStatus}
            loading={statusLoading}
          >
            立即开启
          </Button>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8
        }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{appInfo.appName}</h3>
          {appInfo.status === 1 ? (
            <Tag color="success">运行中</Tag>
          ) : (
            <Tag color="default">已停用</Tag>
          )}
        </div>
        <div style={{ 
          fontSize: 12, 
          color: '#999', 
          display: 'flex', 
          alignItems: 'center',
          gap: 8
        }}>
          <span>AppId: {appInfo.appId.substring(0, 8)}...</span>
          <Tooltip title="复制完整 AppId">
            <CopyOutlined
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={copyAppId}
            />
          </Tooltip>
        </div>
      </div>

      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '40px 0' 
        }}>
          <Spin />
        </div>
      ) : stats ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 16 
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>用户总数</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {stats.allUsers.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>今日活跃</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              {stats.activeUsers.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>新用户数</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
              {stats.newUsers.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
              一周活跃趋势
            </div>
            <div style={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'flex-end',
              height: 30
            }}>
              {stats.lastWeekActiveUers.map((count, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    background: '#1890ff',
                    height: `${(count / Math.max(...stats.lastWeekActiveUers)) * 100}%`,
                    minHeight: 4,
                    borderRadius: 2,
                  }}
                  title={`${count} 人`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ 
        marginTop: 16, 
        paddingTop: 16, 
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        gap: 8
      }}>
        <Button type="link" style={{ padding: 0 }}>
          进入控制台
        </Button>
        {appInfo.status === 1 && (
          <Button 
            type="link" 
            danger 
            style={{ padding: 0 }}
            onClick={toggleStatus}
            loading={statusLoading}
          >
            停用
          </Button>
        )}
      </div>
    </Card>
  );
}
