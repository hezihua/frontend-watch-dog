# 🐕 Frontend Watch Dog

<p align="center">
  <strong>轻量级前端监控系统</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/frontend-watch-web-sdk">
    <img src="https://img.shields.io/npm/v/frontend-watch-web-sdk.svg" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/frontend-watch-web-sdk">
    <img src="https://img.shields.io/npm/dm/frontend-watch-web-sdk.svg" alt="npm downloads">
  </a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
</p>

---

## ✨ 特性

- 🚀 **性能监控** - 自动采集 FCP、LCP、FID、TTFB、DNS、TCP 等 Web Vitals 核心指标
- 🐛 **错误追踪** - 捕获 JS 运行时错误、资源加载错误、Promise 未捕获异常
- 📊 **接口监控** - 自动拦截 XMLHttpRequest 和 Fetch 请求，记录耗时和状态
- 👤 **用户行为** - 记录页面访问、点击事件、路由变化、停留时长
- 📦 **轻量级** - SDK 压缩后仅 ~10KB，零依赖
- 🔧 **零配置** - 开箱即用，3 行代码完成接入

---

## 📁 项目结构

```
frontend-watch-dog/
├── admin/                    # 监控管理后台 (Next.js 16)
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # React 组件
│   │   └── lib/              # 工具函数
│   └── prisma/               # 数据库模型
│
├── packages/
│   └── web-sdk/              # 前端监控 SDK
│       ├── src/              # 源代码
│       └── dist/             # 构建产物
│
└── imgs/                     # 截图
```

---

## 🚀 快速开始

### 安装 SDK

```bash
npm install frontend-watch-web-sdk
# 或
pnpm add frontend-watch-web-sdk
# 或
yarn add frontend-watch-web-sdk
```

### 初始化 SDK

```javascript
import { Monitor } from 'frontend-watch-web-sdk';

// 初始化监控
new Monitor({
  appId: 'your-app-id',                    // 应用 ID（从管理后台获取）
  api: 'https://your-domain.com/api/report', // 数据上报地址
  cacheMax: 5,                             // 缓存条数（达到后批量上报）
  webVitalsTimeouts: 10000,                // Web Vitals 采集超时时间 (ms)
});

// 可选：设置登录用户 ID
Monitor.setUserId('user-123');
```

### React / Next.js 集成

```jsx
// components/MonitorProvider.jsx
"use client";

import { useEffect } from "react";
import { Monitor } from "frontend-watch-web-sdk";

export default function MonitorProvider({ children }) {
  useEffect(() => {
    new Monitor({
      appId: "your-app-id",
      api: "https://your-domain.com/api/report",
      cacheMax: 5,
      webVitalsTimeouts: 10000,
    });
  }, []);

  return children;
}
```

```jsx
// app/layout.jsx
import MonitorProvider from "@/components/MonitorProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MonitorProvider>{children}</MonitorProvider>
      </body>
    </html>
  );
}
```

---

## 🖥️ 启动管理后台

### 环境要求

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Elasticsearch 7.x

### 安装与启动

```bash
# 进入 admin 目录
cd admin

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 配置数据库等连接信息

# 初始化数据库
pnpm prisma db push

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 进入管理后台。

---

## 📊 SDK 采集数据

### 性能指标

| 指标 | 说明 |
|------|------|
| `dnsTime` | DNS 解析时间 |
| `tcpTime` | TCP 连接时间 |
| `whiteTime` | 白屏时间 |
| `fcp` | 首次内容绘制 (First Contentful Paint) |
| `lcp` | 最大内容绘制 (Largest Contentful Paint) |
| `fid` | 首次输入延迟 (First Input Delay) |
| `ttfb` | 首字节时间 (Time to First Byte) |
| `resources` | 资源加载详情 |

### 错误类型

| 类型 | 说明 |
|------|------|
| `jsError` | JavaScript 运行时错误 |
| `loadResourceError` | 资源加载失败（图片、脚本等） |
| `rejectError` | Promise 未捕获异常 |

### 请求监控

| 字段 | 说明 |
|------|------|
| `url` | 请求地址 |
| `method` | 请求方法 |
| `status` | HTTP 状态码 |
| `cost` | 请求耗时 (ms) |
| `requestType` | 结果类型 (done/error) |

### 用户行为

| 类型 | 说明 |
|------|------|
| `click` | 点击事件（含元素路径） |
| `pageStatus` | 页面状态（进入/离开时间、停留时长） |

---

## 🎯 管理后台功能

### 流量分析
- ✅ 今日 PV/UV 统计
- ✅ 新用户趋势
- ✅ 分时流量图表
- ✅ 每日流量对比

### 性能分析
- ✅ 综合性能指标概览
- ✅ 各页面性能详情
- ✅ 性能趋势分析

### 首屏查询
- ✅ 首屏加载时间分布
- ✅ 慢加载页面排查

### 接口监控
- ✅ 接口异常趋势
- ✅ 高频错误接口
- ✅ 慢响应接口 Top50
- ✅ 接口详情查询

### 错误监控
- ✅ JS 错误趋势
- ✅ 错误详情查询
- ✅ 源码定位（SourceMap）

### Top 分析
- ✅ 页面访问量排行
- ✅ 浏览器分布
- ✅ 操作系统分布
- ✅ 设备类型分布

### 地域分布
- ✅ 用户地理位置分析
- ✅ 省份/城市分布

---

## 📸 截图预览

<details>
<summary>点击展开截图</summary>

### 流量分析
![流量分析](./imgs/1.jpg)

### 性能分析
![性能分析](./imgs/2.jpg)

### 首屏查询
![首屏查询](./imgs/3.jpg)

### 接口分析
![接口分析](./imgs/4.jpg)

### 接口查询
![接口查询](./imgs/5.jpg)

### JS 错误分析
![JS错误分析](./imgs/8.jpg)

### Top 分析
![Top分析](./imgs/9.jpg)

### 地域分布
![地域分布](./imgs/10.jpg)

### 设备分析
![设备分析](./imgs/11.jpg)

</details>

---

## 🔧 技术栈

### SDK
- TypeScript
- Web Vitals
- Father (构建工具)

### 管理后台
- Next.js 16 (App Router)
- React 19
- Ant Design 5
- TailwindCSS 4
- Prisma (ORM)
- Elasticsearch
- Redis
- ECharts

---

## 📄 License

[MIT](LICENSE)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
