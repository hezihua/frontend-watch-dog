'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Progress, message } from 'antd';
import MainLayout from '@/components/MainLayout';

export default function JsErrorPage() {
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
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '错误类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="red">{type}</Tag>,
    },
    {
      title: '发生次数',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '影响用户数',
      dataIndex: 'userCount',
      key: 'userCount',
    },
    {
      title: '操作',
      key: 'action',
      render: () => <a>查看详情</a>,
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
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>健康情况</h2>
      </div>

      <Card title="应用健康度">
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Progress
            type="circle"
            percent={100}
            format={() => '健康'}
            size={200}
            strokeColor="#52c41a"
          />
          <div style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
            暂无 JS 错误
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title="JS 错误列表">
        <Table
          columns={columns}
          dataSource={[]}
          locale={{ emptyText: '暂无错误数据' }}
        />
      </Card>

      <Card style={{ marginTop: 16 }} title="错误趋势">
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          错误趋势图表 - 待对接数据
        </div>
      </Card>
    </MainLayout>
  );
}
