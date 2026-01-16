'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Progress, message } from 'antd';
import MainLayout from '@/components/MainLayout';

export default function JsErrorPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorList, setErrorList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

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
      const res = await fetch(`/api/js-error/list?appId=${activeApp}`);
      const data = await res.json();
      if (data.code === 1000) {
        setErrorList(data.data?.list || []);
        setTotal(data.data?.total || 0);
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
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      width: '40%',
      ellipsis: true,
    },
    {
      title: '文件',
      dataIndex: 'filename',
      key: 'filename',
      width: '20%',
      ellipsis: true,
    },
    {
      title: '位置',
      key: 'location',
      width: '10%',
      render: (_: any, record: any) => `${record.lineno}:${record.colno}`,
    },
    {
      title: '发生次数',
      dataIndex: 'count',
      key: 'count',
      width: '10%',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: '最近发生',
      dataIndex: 'lastErrorTime',
      key: 'lastErrorTime',
      width: '15%',
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: '5%',
      render: (_: any, record: any) => <a onClick={() => console.log('查看详情:', record)}>详情</a>,
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
            percent={total === 0 ? 100 : Math.max(0, 100 - Math.min(total, 100))}
            format={(percent) => (total === 0 ? '健康' : `${percent}分`)}
            size={200}
            strokeColor={total === 0 ? '#52c41a' : total < 10 ? '#faad14' : '#ff4d4f'}
          />
          <div style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
            {total === 0 ? '暂无 JS 错误' : `共发现 ${total} 个错误`}
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title={`JS 错误列表（共 ${total} 条）`}>
        <Table
          columns={columns}
          dataSource={errorList}
          loading={loading}
          locale={{ emptyText: '暂无错误数据' }}
          rowKey="id"
          pagination={{
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
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
