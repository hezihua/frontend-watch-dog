'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Table, Tag, message, DatePicker, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { RangePicker } = DatePicker;

export default function HttpSearchPage() {
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

      if (values.url) params.append('url', values.url);
      if (values.link) params.append('link', values.link);
      if (values.requestType) params.append('requestType', values.requestType);
      if (values.timeRange) {
        params.append('startTime', values.timeRange[0].toISOString());
        params.append('endTime', values.timeRange[1].toISOString());
      }

      const res = await fetch(`/api/http-error/detail?${params}`);
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
      title: '接口地址',
      dataIndex: 'url',
      key: 'url',
      width: '30%',
      ellipsis: true,
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      key: 'method',
      width: '10%',
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: '状态码',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status: number) => (
        <Tag color={status >= 200 && status < 300 ? 'success' : 'error'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'requestType',
      key: 'requestType',
      width: '10%',
      render: (type: string) => {
        const colorMap: any = { done: 'success', error: 'error', timeout: 'warning' };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: '耗时',
      dataIndex: 'cost',
      key: 'cost',
      width: '10%',
      render: (cost: number) => `${cost} ms`,
      sorter: (a: any, b: any) => a.cost - b.cost,
    },
    {
      title: '来源页面',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      width: '15%',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'userTimeStamp',
      key: 'userTimeStamp',
      width: '15%',
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
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>接口查询</h2>
      </div>

      <Card title="查询条件">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="url" label="接口地址">
            <Input placeholder="请输入接口地址" style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="link" label="来源页面">
            <Input placeholder="请输入来源页面" style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="requestType" label="请求类型">
            <Select placeholder="选择类型" style={{ width: 150 }} allowClear>
              <Select.Option value="done">成功</Select.Option>
              <Select.Option value="error">错误</Select.Option>
              <Select.Option value="timeout">超时</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="timeRange" label="时间范围">
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: 400 }}
            />
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
