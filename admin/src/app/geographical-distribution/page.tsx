'use client';

import { useEffect, useState } from 'react';
import { Card, Table, message } from 'antd';
import MainLayout from '@/components/MainLayout';

export default function GeographicalDistributionPage() {
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

  const columns = [
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '访问次数',
      dataIndex: 'visitCount',
      key: 'visitCount',
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
    },
    {
      title: '占比',
      dataIndex: 'ratio',
      key: 'ratio',
      render: (ratio: number) => `${ratio}%`,
    },
  ];

  return (
    <MainLayout
      apps={apps}
      activeApp={activeApp}
      onAppChange={setActiveApp}
      onCreateApp={() => setModalOpen(true)}
    >
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>地域分布</h2>
      </div>

      <Card title="中国地图分布">
        <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          地图可视化 - 待对接数据
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title="地域详细数据">
        <Table
          columns={columns}
          dataSource={[]}
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>
    </MainLayout>
  );
}
