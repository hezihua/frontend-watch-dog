'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, message } from 'antd';
import MainLayout from '@/components/MainLayout';

export default function HttpErrorPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorList, setErrorList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (activeApp) {
      fetchErrorList();
    }
  }, [activeApp]);

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

  const fetchErrorList = async () => {
    if (!activeApp) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/http-error/list?appId=${activeApp}`);
      const data = await res.json();
      if (data.code === 1000) {
        // API 返回的数据结构是 { list, total, errorRate }
        setErrorList(data.data?.list || []);
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error('获取错误列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
      title: '错误次数',
      dataIndex: 'errorCount',
      key: 'errorCount',
    },
    {
      title: '错误率',
      dataIndex: 'errorRate',
      key: 'errorRate',
      render: (rate: number) => `${rate}%`,
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
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>接口分析</h2>
      </div>

      <Card title="接口错误排行">
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          错误排行图表 - 待对接数据
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title="接口错误详情">
        <Table
          columns={columns}
          dataSource={errorList}
          loading={loading}
          locale={{ emptyText: '暂无数据' }}
          rowKey="id"
        />
      </Card>
    </MainLayout>
  );
}
