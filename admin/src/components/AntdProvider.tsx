'use client';

// 必须在 antd 之前导入 React 19 兼容补丁
import '@ant-design/v5-patch-for-react-19';
import { App } from 'antd';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return <App>{children}</App>;
}
