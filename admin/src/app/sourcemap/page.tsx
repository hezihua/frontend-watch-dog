'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, Table, Button, Upload, message, Popconfirm, Empty, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import MainLayout from '@/components/MainLayout';

interface SourceMapFile {
  filename: string;
  size?: number;
  uploadTime?: string;
}

export default function SourceMapPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fileList, setFileList] = useState<SourceMapFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (activeApp) {
      fetchFileList();
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

  const fetchFileList = async () => {
    if (!activeApp) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sourcemap/list?appId=${activeApp}`);
      const data = await res.json();
      if (data.code === 1000) {
        // 将文件名数组转换为对象数组
        const files = (data.data || []).map((filename: string) => ({
          filename,
        }));
        setFileList(files);
      } else {
        message.error(data.message || '获取列表失败');
      }
    } catch (error) {
      message.error('获取 SourceMap 列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!activeApp) {
      message.warning('请先选择应用');
      return;
    }

    if (!file.name.endsWith('.map')) {
      message.error('请上传 .map 格式的 SourceMap 文件');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('appId', activeApp);
    formData.append('file', file);
    formData.append('filename', file.name);

    try {
      const res = await fetch('/api/sourcemap/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.code === 1000) {
        message.success('上传成功');
        fetchFileList();
      } else {
        message.error(data.message || '上传失败');
      }
    } catch (error) {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!activeApp) return;

    try {
      const res = await fetch(
        `/api/sourcemap/list?appId=${activeApp}&filename=${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.code === 1000) {
        message.success('删除成功');
        fetchFileList();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename: string) => (
        <span>
          <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          {filename}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: SourceMapFile) => (
        <Popconfirm
          title="确定删除这个 SourceMap 文件吗？"
          onConfirm={() => handleDelete(record.filename)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
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
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          SourceMap 管理
        </h2>
      </div>

      <Card
        title="上传 SourceMap"
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', marginBottom: 16 }}>
            上传构建生成的 SourceMap 文件（.map），用于解析 JS 错误的原始代码位置。
          </p>
          <p style={{ color: '#999', fontSize: 12, marginBottom: 16 }}>
            提示：请上传与线上 JS 文件对应的 SourceMap 文件，文件名应与 JS 文件名匹配（如 main.js 对应 main.js.map）
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".map"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            const files = e.target.files;
            if (files) {
              Array.from(files).forEach((file) => handleUpload(file));
            }
            e.target.value = '';
          }}
        />

        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={uploading}
          onClick={() => fileInputRef.current?.click()}
          disabled={!activeApp}
        >
          选择文件上传
        </Button>

        {!activeApp && (
          <span style={{ marginLeft: 16, color: '#ff4d4f' }}>
            请先在顶部选择应用
          </span>
        )}
      </Card>

      <Card title={`已上传文件（${fileList.length} 个）`}>
        {fileList.length === 0 ? (
          <Empty
            description="暂无 SourceMap 文件"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={fileList}
            loading={loading}
            rowKey="filename"
            pagination={{
              showTotal: (total) => `共 ${total} 个文件`,
              showSizeChanger: true,
            }}
          />
        )}
      </Card>

      <Card title="使用说明" style={{ marginTop: 16 }}>
        <div style={{ color: '#666', lineHeight: 2 }}>
          <h4 style={{ marginBottom: 8 }}>1. 生成 SourceMap</h4>
          <p style={{ paddingLeft: 16, marginBottom: 16 }}>
            在构建配置中启用 SourceMap 生成（如 webpack 的 devtool: &apos;source-map&apos;）
          </p>

          <h4 style={{ marginBottom: 8 }}>2. 上传 SourceMap</h4>
          <p style={{ paddingLeft: 16, marginBottom: 16 }}>
            将构建产物中的 .map 文件上传到此页面，文件名需与线上 JS 文件对应
          </p>

          <h4 style={{ marginBottom: 8 }}>3. 解析错误</h4>
          <p style={{ paddingLeft: 16, marginBottom: 16 }}>
            在「健康情况」页面点击错误详情，即可解析出原始源码位置
          </p>

          <h4 style={{ marginBottom: 8, color: '#faad14' }}>⚠️ 注意事项</h4>
          <ul style={{ paddingLeft: 32, marginBottom: 0 }}>
            <li>每次发布新版本后，需要重新上传对应的 SourceMap 文件</li>
            <li>建议在 CI/CD 流程中自动上传 SourceMap</li>
            <li>SourceMap 文件包含源码信息，请勿将其部署到生产环境</li>
          </ul>
        </div>
      </Card>
    </MainLayout>
  );
}
