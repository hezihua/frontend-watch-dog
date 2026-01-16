'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, message, List, Progress } from 'antd';
import MainLayout from '@/components/MainLayout';
import { get } from '@/lib/request';

interface TopItem {
  key: string;
  doc_count: number;
  count?: { value: number };
  uv?: { value: number };
}

export default function TopAnalysePage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [pageData, setPageData] = useState<TopItem[]>([]);
  const [browserData, setBrowserData] = useState<TopItem[]>([]);
  const [osData, setOsData] = useState<TopItem[]>([]);
  const [deviceData, setDeviceData] = useState<TopItem[]>([]);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (activeApp) {
      fetchTopData();
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

  const fetchTopData = async () => {
    if (!activeApp) return;
    setLoading(true);
    
    try {
      // 并发获取四种类型的数据
      const [pageRes, browserRes, osRes, deviceRes] = await Promise.all([
        get(`/api/top/analyse?appId=${activeApp}&type=page`),
        get(`/api/top/analyse?appId=${activeApp}&type=browser`),
        get(`/api/top/analyse?appId=${activeApp}&type=os`),
        get(`/api/top/analyse?appId=${activeApp}&type=device`),
      ]);

      if (pageRes && pageRes.code === 1000) {
        setPageData(pageRes.data || []);
      }
      if (browserRes && browserRes.code === 1000) {
        setBrowserData(browserRes.data || []);
      }
      if (osRes && osRes.code === 1000) {
        setOsData(osRes.data || []);
      }
      if (deviceRes && deviceRes.code === 1000) {
        setDeviceData(deviceRes.data || []);
      }
    } catch (error) {
      message.error('获取 Top 数据失败');
    } finally {
      setLoading(false);
    }
  };

  const renderTopList = (data: TopItem[], title: string) => {
    if (!data || data.length === 0) {
      return (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          暂无数据
        </div>
      );
    }

    const maxCount = Math.max(...data.map(item => item.doc_count));

    return (
      <List
        itemLayout="horizontal"
        dataSource={data.slice(0, 10)}
        renderItem={(item, index) => {
          const percentage = maxCount > 0 ? (item.doc_count / maxCount) * 100 : 0;
          const uv = item.uv?.value || 0;
          
          return (
            <List.Item>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>
                    <span style={{ 
                      display: 'inline-block', 
                      width: 24, 
                      height: 24, 
                      lineHeight: '24px', 
                      textAlign: 'center',
                      borderRadius: '50%',
                      backgroundColor: index < 3 ? '#1890ff' : '#f0f0f0',
                      color: index < 3 ? 'white' : '#666',
                      marginRight: 8,
                      fontSize: 12,
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {item.key || '未知'}
                    </span>
                  </span>
                  <span style={{ color: '#666' }}>
                    {item.doc_count} 次
                    {uv > 0 && ` / ${uv} 人`}
                  </span>
                </div>
                <Progress 
                  percent={percentage} 
                  showInfo={false} 
                  strokeColor={index < 3 ? '#1890ff' : '#91d5ff'}
                />
              </div>
            </List.Item>
          );
        }}
      />
    );
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
          <Card title="Top 页面访问" loading={loading}>
            {renderTopList(pageData, '页面')}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top 浏览器" loading={loading}>
            {renderTopList(browserData, '浏览器')}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top 设备" loading={loading}>
            {renderTopList(deviceData, '设备')}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top 操作系统" loading={loading}>
            {renderTopList(osData, '操作系统')}
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
