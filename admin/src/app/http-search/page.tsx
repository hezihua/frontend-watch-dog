'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Table, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

export default function HttpSearchPage() {
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
      title: '接口地址',
      dataIndex: 'url',
      key: 'url',
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: '状态码',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status >= 200 && status < 300 ? 'success' : 'error'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '耗时 (ms)',
      dataIndex: 'duration',
      key: 'duration',
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
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>接口查询</h2>
      </div>

      <Card>
        <Form form={form} layout="inline">
          <Form.Item name="url" label="接口地址">
            <Input placeholder="请输入接口地址" style={{ width: 300 }} />
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
