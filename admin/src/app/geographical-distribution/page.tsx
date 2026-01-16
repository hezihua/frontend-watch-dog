'use client';

import { useEffect, useState } from 'react';
import { Card, Table, message, Progress } from 'antd';
import MainLayout from '@/components/MainLayout';
import { get } from '@/lib/request';

interface GeoData {
  key: string;
  doc_count: number;
  uv?: { value: number };
}

export default function GeographicalDistributionPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoData, setGeoData] = useState<GeoData[]>([]);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (activeApp) {
      fetchGeoData();
    }
  }, [activeApp]);

  const fetchApps = async () => {
    try {
      const data = await get('/api/apps');
      if (data && data.code === 1000) {
        setApps(data.data || []);
        if (data.data && data.data.length > 0) {
          setActiveApp(data.data[0].appId);
        }
      }
    } catch (error) {
      message.error('获取应用列表失败');
    }
  };

  const fetchGeoData = async () => {
    if (!activeApp) return;
    setLoading(true);
    
    try {
      const data = await get(`/api/geo/distribution?appId=${activeApp}`);
      if (data && data.code === 1000) {
        setGeoData(data.data || []);
      }
    } catch (error) {
      message.error('获取地域分布数据失败');
    } finally {
      setLoading(false);
    }
  };

  const totalPv = geoData.reduce((sum, item) => sum + item.doc_count, 0);
  const totalUv = geoData.reduce((sum, item) => sum + (item.uv?.value || 0), 0);

  const tableData = geoData.map((item, index) => ({
    key: index,
    province: item.key || '未知',
    visitCount: item.doc_count,
    userCount: item.uv?.value || 0,
    ratio: totalPv > 0 ? ((item.doc_count / totalPv) * 100).toFixed(2) : '0.00',
  }));

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <span style={{ 
          display: 'inline-block', 
          width: 24, 
          height: 24, 
          lineHeight: '24px', 
          textAlign: 'center',
          borderRadius: '50%',
          backgroundColor: index < 3 ? '#1890ff' : '#f0f0f0',
          color: index < 3 ? 'white' : '#666',
          fontSize: 12,
        }}>
          {index + 1}
        </span>
      ),
    },
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
    },
    {
      title: '访问次数',
      dataIndex: 'visitCount',
      key: 'visitCount',
      sorter: (a: any, b: any) => a.visitCount - b.visitCount,
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      sorter: (a: any, b: any) => a.userCount - b.userCount,
    },
    {
      title: '占比',
      dataIndex: 'ratio',
      key: 'ratio',
      render: (ratio: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress 
            percent={parseFloat(ratio)} 
            showInfo={false} 
            strokeColor="#1890ff"
            style={{ width: 100 }}
          />
          <span>{ratio}%</span>
        </div>
      ),
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

      <Card title="数据概览" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 48 }}>
          <div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>总访问量</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {totalPv.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>独立用户数</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              {totalUv.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>覆盖省份</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
              {geoData.length}
            </div>
          </div>
        </div>
      </Card>

      <Card title="中国地图分布">
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <div>地图可视化功能</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              可集成 ECharts 实现中国地图热力图
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title="地域详细数据">
        <Table
          columns={columns}
          dataSource={tableData}
          loading={loading}
          locale={{ emptyText: '暂无数据' }}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </MainLayout>
  );
}
