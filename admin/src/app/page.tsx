'use client';

import { useEffect, useState } from 'react';
import { Empty, Button, Modal, Form, Input, Radio, message, Spin } from 'antd';
import { PlusCircleFilled } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import AppItem from '@/components/AppItem';
import MainLayout from '@/components/MainLayout';

interface AppInfo {
  id: number;
  appId: string;
  appName: string;
  createId: number;
  appType: number;
  status: number;
}

export default function Home() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  // 获取应用列表
  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      
      if (data.code === 1005) {
        // 未登录，跳转到登录页
        router.push('/login');
        return;
      }
      
      if (data.code === 1000) {
        setApps(data.data || []);
      } else {
        message.error(data.message || '获取应用列表失败');
      }
    } catch (error) {
      message.error('获取应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // 创建应用
  const handleCreateApp = async () => {
    try {
      await form.validateFields();
      setCreateLoading(true);
      
      const values = form.getFieldsValue();
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      const data = await res.json();
      
      if (data.code === 1000) {
        Modal.success({
          title: '应用创建成功！',
          content: (
            <div>
              <p>应用名称：{data.data.appName}</p>
              <p>
                应用ID：
                <strong style={{ 
                  color: '#1890ff', 
                  userSelect: 'all',
                  cursor: 'text',
                  padding: '2px 8px',
                  background: '#f0f0f0',
                  borderRadius: 4,
                  display: 'inline-block',
                  marginLeft: 8
                }}>
                  {data.data.appId}
                </strong>
              </p>
              <p style={{ marginTop: 16, color: '#666' }}>
                请复制上面的 appId，在集成 SDK 时使用
              </p>
            </div>
          ),
          width: 500,
        });
        setModalOpen(false);
        form.resetFields();
        fetchApps();
      } else {
        message.error(data.message || '创建应用失败');
      }
    } catch (error) {
      console.error('创建应用失败:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <MainLayout
      apps={apps}
      activeApp={activeApp}
      onAppChange={setActiveApp}
      onCreateApp={() => setModalOpen(true)}
    >
      {apps.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 'calc(100vh - 150px)' 
        }}>
          <Empty
            description={
              <div>
                <span>您还没有应用，快去创建应用吧！</span>
                <br />
                <br />
                <Button
                  type="primary"
                  onClick={() => setModalOpen(true)}
                  icon={<PlusCircleFilled />}
                >
                  立即创建
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
          gap: 24 
        }}>
          {apps.map((app) => (
            <AppItem key={app.id} appInfo={app} onUpdate={fetchApps} />
          ))}
        </div>
      )}

      <Modal
        title="创建应用"
        open={modalOpen}
        onOk={handleCreateApp}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
        confirmLoading={createLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="appName"
            label="应用名称"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="请输入应用名称" />
          </Form.Item>
          <Form.Item
            name="appType"
            label="应用类型"
            initialValue={1}
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value={1}>Web 应用</Radio>
              <Radio value={2} disabled>
                小程序（暂未开放）
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
