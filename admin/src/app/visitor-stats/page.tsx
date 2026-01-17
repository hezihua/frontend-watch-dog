'use client';

import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, message, Spin } from 'antd';
import { UserOutlined, EyeOutlined, RiseOutlined } from '@ant-design/icons';
import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function VisitorStatsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (activeApp) {
      fetchStats();
    }
  }, [activeApp]);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      if (data.code === 1000) {
        setApps(data.data || []);
        // 优先使用 URL 参数中的 appId
        const urlAppId = searchParams.get('appId');
        if (urlAppId) {
          setActiveApp(urlAppId);
        } else if (data.data && data.data.length > 0) {
          setActiveApp(data.data[0].appId);
        }
      }
    } catch (error) {
      message.error('获取应用列表失败');
    }
  };

  const fetchStats = async () => {
    if (!activeApp) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analyse/stats?appId=${activeApp}`);
      const data = await res.json();
      if (data.code === 1000) {
        setStats(data.data);
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      apps={apps}
      activeApp={activeApp}
      onAppChange={setActiveApp}
      onCreateApp={() => setModalOpen(true)}
    >
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>流量分析</h2>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card>
              <Statistic
                title="今日访问量(PV)"
                value={stats?.todayPV || 0}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="今日访客数(UV)"
                value={stats?.todayUV || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="较昨日"
                value={stats?.growth || 0}
                prefix={<RiseOutlined />}
                suffix="%"
                valueStyle={{ color: parseFloat(stats?.growth || '0') >= 0 ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Card style={{ marginTop: 16 }} title="流量趋势">
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          图表区域 - 待对接数据
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title="用户活跃度">
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          图表区域 - 待对接数据
        </div>
      </Card>
    </MainLayout>
  );
}
