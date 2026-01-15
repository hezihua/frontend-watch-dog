'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Table, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

export default function PerformanceSearchPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

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
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: 'FCP (ms)',
      dataIndex: 'fcp',
      key: 'fcp',
    },
    {
      title: 'LCP (ms)',
      dataIndex: 'lcp',
      key: 'lcp',
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link">查看详情</Button>,
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
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>首屏查询</h2>
      </div>

      <Card>
        <Form form={form} layout="inline">
          <Form.Item name="url" label="页面URL">
            <Input placeholder="请输入页面URL" style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="userId" label="用户ID">
            <Input placeholder="请输入用户ID" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }} title="查询结果">
        <Table
          columns={columns}
          dataSource={[]}
          locale={{ emptyText: '暂无数据，请先进行查询' }}
        />
      </Card>
    </MainLayout>
  );
}
