import type { Metadata } from "next";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AntdProvider from '@/components/AntdProvider';
import "./globals.css";
import '@/lib/init'; // 初始化 Elasticsearch

export const metadata: Metadata = {
  title: "前端监控系统",
  description: "前端性能监控和错误追踪系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <AntdProvider>{children}</AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
