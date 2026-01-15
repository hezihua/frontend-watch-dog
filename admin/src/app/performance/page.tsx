'use client';

import { useEffect, useState } from 'react';
import { Card, Table, message } from 'antd';
import MainLayout from '@/components/MainLayout';

export default function PerformancePage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [pageList, setPageList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (activeApp) {
      fetchPerformanceData();
      fetchPageList();
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

  const fetchPerformanceData = async () => {
    if (!activeApp) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/performance/avg?appId=${activeApp}`);
      const data = await res.json();
      if (data.code === 1000) {
        setPerformanceData(data.data);
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error('获取性能数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPageList = async () => {
    if (!activeApp) return;
    try {
      const res = await fetch(`/api/performance/pages?appId=${activeApp}`);
      const data = await res.json();
      if (data.code === 1000) {
        setPageList(data.data);
      }
    } catch (error) {
      message.error('获取页面列表失败');
    }
  };

  const columns = [
    {
      title: '页面URL',
      dataIndex: 'url',
      key: 'url',
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
      title: 'FID (ms)',
      dataIndex: 'fid',
      key: 'fid',
    },
    {
      title: 'TTFB (ms)',
      dataIndex: 'ttfb',
      key: 'ttfb',
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
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>性能分析</h2>
      </div>

      <Card title="应用平均性能指标" loading={loading}>
        {performanceData && (
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '20px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, color: '#1890ff', fontWeight: 'bold' }}>{performanceData.fcp}ms</div>
              <div style={{ marginTop: 8, color: '#999' }}>FCP</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, color: '#52c41a', fontWeight: 'bold' }}>{performanceData.lcp}ms</div>
              <div style={{ marginTop: 8, color: '#999' }}>LCP</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, color: '#faad14', fontWeight: 'bold' }}>{performanceData.fid}ms</div>
              <div style={{ marginTop: 8, color: '#999' }}>FID</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, color: '#722ed1', fontWeight: 'bold' }}>{performanceData.ttfb}ms</div>
              <div style={{ marginTop: 8, color: '#999' }}>TTFB</div>
            </div>
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 16 }} title="页面性能详情">
        <Table
          columns={columns}
          dataSource={pageList}
          locale={{ emptyText: '暂无数据' }}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </MainLayout>
  );
}
