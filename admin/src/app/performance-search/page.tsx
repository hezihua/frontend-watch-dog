'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Table, message, DatePicker, Select, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function PerformanceSearchPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

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

  const handleSearch = async (values: any) => {
    if (!activeApp) {
      message.warning('请先选择应用');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        appId: activeApp,
        from: String((pagination.current - 1) * pagination.pageSize),
        size: String(pagination.pageSize),
      });

      if (values.pageUrl) params.append('pageUrl', values.pageUrl);
      if (values.timeRange) {
        params.append('startTime', values.timeRange[0].toISOString());
        params.append('endTime', values.timeRange[1].toISOString());
      }
      if (values.whiteTimeRange) params.append('whiteTimeRange', values.whiteTimeRange);

      const res = await fetch(`/api/performance/detail?${params}`);
      const data = await res.json();

      if (data.code === 1000) {
        setDataSource(data.data?.list || []);
        setTotal(data.data?.total || 0);
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
    form.submit();
  };

  const columns = [
    {
      title: '页面 URL',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '白屏时间',
      dataIndex: 'whiteTime',
      key: 'whiteTime',
      width: '10%',
      render: (val: number) => {
        const color = val < 1000 ? 'green' : val < 2000 ? 'orange' : 'red';
        return <Tag color={color}>{val} ms</Tag>;
      },
      sorter: (a: any, b: any) => a.whiteTime - b.whiteTime,
    },
    {
      title: 'FCP',
      dataIndex: 'fcp',
      key: 'fcp',
      width: '8%',
      render: (val: number) => `${val} ms`,
      sorter: (a: any, b: any) => a.fcp - b.fcp,
    },
    {
      title: 'LCP',
      dataIndex: 'lcp',
      key: 'lcp',
      width: '8%',
      render: (val: number) => `${val} ms`,
      sorter: (a: any, b: any) => a.lcp - b.lcp,
    },
    {
      title: 'FID',
      dataIndex: 'fid',
      key: 'fid',
      width: '8%',
      render: (val: number) => `${val} ms`,
    },
    {
      title: 'TTFB',
      dataIndex: 'ttfb',
      key: 'ttfb',
      width: '8%',
      render: (val: number) => `${val} ms`,
    },
    {
      title: '浏览器',
      dataIndex: 'browserName',
      key: 'browserName',
      width: '10%',
    },
    {
      title: '地域',
      key: 'location',
      width: '10%',
      render: (_: any, record: any) => `${record.province || ''} ${record.city || ''}`,
    },
    {
      title: '时间',
      dataIndex: 'userTimeStamp',
      key: 'userTimeStamp',
      width: '13%',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
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

      <Card title="查询条件">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="pageUrl" label="页面 URL">
            <Input placeholder="请输入页面 URL" style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="timeRange" label="时间范围">
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: 400 }}
            />
          </Form.Item>
          <Form.Item name="whiteTimeRange" label="白屏时间">
            <Select placeholder="选择范围" style={{ width: 150 }} allowClear>
              <Select.Option value="1">1s 以内</Select.Option>
              <Select.Option value="2">1-2s</Select.Option>
              <Select.Option value="3">2-3s</Select.Option>
              <Select.Option value="4">3s 以上</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }} title={`查询结果（共 ${total} 条）`}>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          locale={{ emptyText: '暂无数据，请先进行查询' }}
          rowKey="id"
          pagination={{
            ...pagination,
            total,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => {
              handleTableChange({ current: page, pageSize });
            },
          }}
        />
      </Card>
    </MainLayout>
  );
}
