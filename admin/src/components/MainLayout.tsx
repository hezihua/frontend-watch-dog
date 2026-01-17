'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Modal, Select, Button } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  PoweroffOutlined,
  PlusCircleFilled,
  AppstoreOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  FileSearchOutlined,
  NodeIndexOutlined,
  MedicineBoxOutlined,
  OrderedListOutlined,
  RadarChartOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface MainLayoutProps {
  children: React.ReactNode;
  apps: any[];
  activeApp: string | null;
  onAppChange: (appId: string) => void;
  onCreateApp: () => void;
}

export default function MainLayout({
  children,
  apps,
  activeApp,
  onAppChange,
  onCreateApp,
}: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const munuRouters = [
    {
      path: '/',
      name: '应用列表',
      icon: AppstoreOutlined,
    },
  ];

  const hasAppRouters = [
    {
      path: '/visitor-stats',
      name: '流量分析',
      icon: BarChartOutlined,
    },
    {
      path: '/performance',
      name: '性能分析',
      icon: ThunderboltOutlined,
    },
    {
      path: '/performance-search',
      name: '首屏查询',
      icon: FileSearchOutlined,
    },
    {
      path: '/http-error',
      name: '接口分析',
      icon: NodeIndexOutlined,
    },
    {
      path: '/http-search',
      name: '接口查询',
      icon: FileSearchOutlined,
    },
    {
      path: '/js-error',
      name: '健康情况',
      icon: MedicineBoxOutlined,
    },
    {
      path: '/sourcemap',
      name: 'SourceMap',
      icon: CodeOutlined,
    },
    {
      path: '/top-analyse',
      name: 'Top分析',
      icon: OrderedListOutlined,
    },
    {
      path: '/geographical-distribution',
      name: '地域分布',
      icon: RadarChartOutlined,
    },
  ];

  const menus: MenuItem[] = (apps.length === 0 ? munuRouters : [...munuRouters, ...hasAppRouters]).map(
    (item) => ({
      key: item.path,
      icon: <item.icon />,
      label: item.name,
    })
  );

  const handleLogout = () => {
    Modal.confirm({
      title: '确定退出登录？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
      },
    });
  };

  const leftSideWidth = collapsed ? 80 : 255;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 左侧边栏 */}
      <div
        style={{
          width: leftSideWidth,
          height: '100vh',
          background: 'white',
          transition: 'all cubic-bezier(0.2, 0, 0, 1) 0.3s',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '100%',
            height: 70,
            background: 'white',
            color: '#333',
            padding: '15px 0',
            overflow: 'hidden',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ width: '100%', height: 40, overflow: 'hidden', display: 'flex', alignItems: 'center', paddingLeft: 20 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              监
            </div>
            {!collapsed && (
              <span style={{ marginLeft: 10, fontSize: 16, fontWeight: 500, color: '#333' }}>
                前端监控平台
              </span>
            )}
          </div>
        </div>

        {/* 菜单 */}
        <div style={{ height: 'calc(100vh - 70px)', overflowY: 'auto', background: 'white' }}>
          <Sider
            style={{ width: leftSideWidth, maxWidth: leftSideWidth, background: 'white' }}
            collapsed={collapsed}
            collapsible
            trigger={null}
          >
            <Menu
              selectedKeys={[pathname]}
              theme="light"
              style={{ width: leftSideWidth, fontSize: 16, background: 'white', border: 'none' }}
              mode="inline"
              onSelect={(info) => router.push(info.key)}
              items={menus}
            />
          </Sider>
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div
        style={{
          width: `calc(100vw - ${leftSideWidth}px)`,
          transition: 'all cubic-bezier(0.2, 0, 0, 1) 0.3s',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* 顶部导航栏 */}
        <div
          style={{
            height: 70,
            background: 'white',
            boxShadow: '0px 0px 0.8px 0px rgba(0, 21, 41, 0.51)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed ? (
              <MenuUnfoldOutlined
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 20, cursor: 'pointer' }}
              />
            ) : (
              <MenuFoldOutlined
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 20, cursor: 'pointer' }}
              />
            )}
            {apps.length > 0 && (
              <Select
                style={{ marginLeft: 20, minWidth: 200 }}
                onChange={onAppChange}
                value={activeApp}
                placeholder="选择应用"
              >
                {apps.map((item) => (
                  <Select.Option key={item.id} value={item.appId}>
                    {item.appName}
                  </Select.Option>
                ))}
              </Select>
            )}
            <Button
              type="primary"
              onClick={onCreateApp}
              icon={<PlusCircleFilled />}
              style={{ marginLeft: 20 }}
            >
              创建应用
            </Button>
          </div>
          <PoweroffOutlined
            onClick={handleLogout}
            style={{ fontSize: 20, cursor: 'pointer' }}
          />
        </div>

        {/* 内容区域 */}
        <div
          style={{
            flex: 1,
            background: '#f5f5f5',
            height: 'calc(100vh - 70px)',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          <div style={{ padding: 16 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
