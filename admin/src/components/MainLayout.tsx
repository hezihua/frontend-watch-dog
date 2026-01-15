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
          background: 'rgb(70, 132, 255)',
          transition: 'all cubic-bezier(0.2, 0, 0, 1) 0.3s',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 装饰圆角 - 顶部 */}
        <svg
          style={{
            position: 'absolute',
            width: 35,
            height: 35,
            left: '100%',
            top: 0,
            zIndex: 100,
          }}
          width="35"
          height="35"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M35,0 A35,35 0 0,0 0,35 L0,0 Z" fill="#4684ff" stroke="#4684ff" />
        </svg>
        
        {/* 装饰圆角 - 底部 */}
        <svg
          style={{
            position: 'absolute',
            width: 35,
            height: 35,
            left: '100%',
            bottom: 0,
            zIndex: 100,
          }}
          width="35"
          height="35"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,0 A35,35 0 0,0 35,35 L0,35 Z" fill="#4684ff" stroke="#4684ff" />
        </svg>

        {/* Logo */}
        <div
          style={{
            width: '100%',
            height: 70,
            background: 'rgb(70, 132, 255)',
            color: 'white',
            padding: '15px 0',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', height: 40, overflow: 'hidden', display: 'flex', alignItems: 'center', paddingLeft: 20 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 'bold',
                color: 'rgb(70, 132, 255)',
              }}
            >
              监
            </div>
            {!collapsed && (
              <span style={{ marginLeft: 10, fontSize: 16, fontWeight: 500 }}>
                前端监控平台
              </span>
            )}
          </div>
        </div>

        {/* 菜单 */}
        <div style={{ height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
          <Sider
            style={{ width: leftSideWidth, maxWidth: leftSideWidth }}
            collapsed={collapsed}
            collapsible
            trigger={null}
          >
            <Menu
              selectedKeys={[pathname]}
              theme="dark"
              style={{ width: leftSideWidth, fontSize: 16 }}
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
