'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Progress, message, Drawer, Alert, Modal } from 'antd';
import MainLayout from '@/components/MainLayout';

interface ErrorDetail {
  id?: string | number;
  message: string;
  filename: string;
  lineno: number;
  colno: number;
  stack?: string;
  count?: number;
  lastErrorTime?: string;
  userIds?: string[];
}

interface CodeParseResult {
  open: boolean;
  code: string[];
  originalPosition: {
    source: string;
    line: number;
    column: number;
    name: string;
  };
  start: number;
}

export default function JsErrorPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorList, setErrorList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [detailDrawer, setDetailDrawer] = useState<{
    open: boolean;
    record: ErrorDetail | null;
  }>({ open: false, record: null });
  const [codeMsg, setCodeMsg] = useState<CodeParseResult>({
    open: false,
    code: [],
    originalPosition: {
      source: '',
      line: 0,
      column: 0,
      name: '',
    },
    start: 12,
  });

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

  // 查看错误详情
  const showDetail = (record: ErrorDetail) => {
    setDetailDrawer({
      open: true,
      record,
    });
  };

  // 解析源码位置
  const handleParseSource = async (record: ErrorDetail) => {
    try {
      const res = await fetch('/api/js-error/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: activeApp,
          filename: record.filename,
          line: record.lineno,
          column: record.colno,
        }),
      });
      
      if (!res.ok) {
        message.warning('请求失败，请稍后重试');
        return;
      }
      
      const data = await res.json();
      
      if (data.code === 1000 && data.data) {
        setCodeMsg({
          open: true,
          code: data.data.context?.lines || [],
          originalPosition: {
            source: data.data.parsed?.source || '',
            line: data.data.parsed?.line || 0,
            column: data.data.parsed?.column || 0,
            name: data.data.parsed?.name || '',
          },
          start: data.data.context?.startLine || 1,
        });
      } else if (data.code === 1000 && !data.data) {
        // SourceMap 不存在
        Modal.info({
          title: '提示',
          content: '未找到对应的 SourceMap 文件，请先在「SourceMap」页面上传',
          okText: '知道了',
        });
      } else {
        Modal.warning({
          title: '解析失败',
          content: data.message ? String(data.message) : '解析失败，请稍后重试',
          okText: '知道了',
        });
      }
    } catch (error) {
      console.error('源码解析错误:', error);
      message.error('源码解析失败');
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
      render: (_: any, record: any) => <a onClick={() => showDetail(record)}>详情</a>,
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

      {/* 错误详情抽屉 */}
      <Drawer
        title="错误详情"
        width={700}
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, record: null })}
      >
        {detailDrawer.record && (
          <div>
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <p><strong>错误信息：</strong>{detailDrawer.record.message}</p>
              <p><strong>发生位置：</strong>{detailDrawer.record.filename} ({detailDrawer.record.lineno}:{detailDrawer.record.colno})</p>
              <p><strong>发生次数：</strong>{detailDrawer.record.count || 1} 次</p>
              {detailDrawer.record.lastErrorTime && (
                <p><strong>最近发生：</strong>{new Date(detailDrawer.record.lastErrorTime).toLocaleString('zh-CN')}</p>
              )}
              {detailDrawer.record.userIds && (
                <p><strong>影响用户：</strong>{detailDrawer.record.userIds.length} 人</p>
              )}
            </Card>

            <Card 
              title="错误堆栈" 
              size="small" 
              style={{ marginBottom: 16 }}
            >
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 16, 
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 300,
                fontSize: 12,
                lineHeight: 1.6,
              }}>
                {detailDrawer.record.stack || '暂无堆栈信息'}
              </pre>
            </Card>

            <Card title="源码解析" size="small">
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#666', marginBottom: 8 }}>
                  解析源码需要先上传对应的 SourceMap 文件（.map）到系统。
                </p>
                <p style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>
                  提示：请在 "SourceMap 管理" 中上传对应 JS 文件的 SourceMap，然后再点击解析按钮。
                </p>
                <button
                  onClick={() => detailDrawer.record && handleParseSource(detailDrawer.record)}
                  style={{
                    background: '#1890ff',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  解析源码位置
                </button>
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      {/* 源码解析结果抽屉 */}
      <Drawer
        title="源码解析结果"
        width={800}
        open={codeMsg.open}
        onClose={() => setCodeMsg({ ...codeMsg, open: false })}
      >
        <Alert
          message={
            <span>
              源代码位置：{codeMsg.originalPosition.source}
              {` (${codeMsg.originalPosition.line}, ${codeMsg.originalPosition.column})`}
            </span>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
        
        <div style={{ 
          background: '#1e1e1e', 
          padding: 16, 
          borderRadius: 4,
          overflow: 'auto',
        }}>
          <pre style={{ margin: 0, color: '#d4d4d4', fontSize: 13, lineHeight: 1.6 }}>
            {codeMsg.code.map((line, index) => {
              const lineNumber = codeMsg.start + index;
              const isHighlight = lineNumber === codeMsg.originalPosition.line;
              return (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    background: isHighlight ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
                  }}
                >
                  <span style={{ 
                    width: 50, 
                    textAlign: 'right', 
                    paddingRight: 16,
                    color: isHighlight ? '#ff6b6b' : '#858585',
                    userSelect: 'none',
                  }}>
                    {lineNumber}
                  </span>
                  <span style={{ color: isHighlight ? '#ff6b6b' : '#d4d4d4' }}>
                    {line}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </Drawer>
    </MainLayout>
  );
}
