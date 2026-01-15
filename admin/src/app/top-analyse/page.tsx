'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, message } from 'antd';
import MainLayout from '@/components/MainLayout';

export default function TopAnalysePage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      if (data.code === 1000) {
        setApps(data.data || []);
        if (data.data && data.data.length > 0) {
          setActiveApp(data.data[0].appId);
        }
      }
    } catch (error) {
      message.error('获取应用列表失败');
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
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Top 分析</h2>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Top 页面访问">
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              页面访问排行 - 待对接数据
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top 浏览器">
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              浏览器排行 - 待对接数据
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top 设备">
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              设备排行 - 待对接数据
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top 操作系统">
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              操作系统排行 - 待对接数据
            </div>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
