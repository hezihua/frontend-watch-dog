# frontend-watch-web-sdk

[![NPM version](https://img.shields.io/npm/v/frontend-watch-web-sdk.svg?style=flat)](https://npmjs.org/package/frontend-watch-web-sdk)
[![NPM downloads](http://img.shields.io/npm/dm/frontend-watch-web-sdk.svg?style=flat)](https://npmjs.org/package/frontend-watch-web-sdk)
[![License](https://img.shields.io/npm/l/frontend-watch-web-sdk.svg)](https://github.com/user/frontend-watch-dog/LICENSE)

轻量级前端监控 SDK，自动采集性能指标、错误信息、用户行为等数据。

## ✨ 特性

- 🚀 **性能监控**：自动采集 FCP、LCP、FID、TTFB 等核心指标
- 🐛 **错误追踪**：捕获 JS 错误、资源加载错误、Promise 错误
- 📊 **接口监控**：自动拦截 XHR 和 Fetch 请求
- 👤 **用户行为**：记录页面访问、点击事件、路由变化
- 📦 **轻量级**：压缩后仅 ~10KB
- 🔧 **零配置**：开箱即用，3 行代码完成接入

## 📦 安装

```bash
npm install frontend-watch-web-sdk
# or
pnpm add frontend-watch-web-sdk
# or
yarn add frontend-watch-web-sdk
```

## 🚀 快速开始

```javascript
import { Monitor } from 'frontend-watch-web-sdk';

// 初始化监控
const monitor = new Monitor({
  appId: 'your-app-id',                    // 应用 ID
  api: 'https://your-api.com/api/report',  // 上报接口
  cacheMax: 5,                             // 缓存条数（达到后批量上报）
  webVitalsTimeouts: 10000,                // Web Vitals 超时时间（ms）
});

// 设置用户 ID（可选，用于关联用户）
Monitor.setUserId('user-123');
```

### React/Next.js 集成示例

```javascript
// components/MonitorProvider.js
"use client";

import { useEffect } from "react";
import { Monitor } from "frontend-watch-web-sdk";

export default function MonitorProvider({ children }) {
  useEffect(() => {
    new Monitor({
      appId: "my-app",
      api: "https://your-api.com/api/report",
      cacheMax: 5,
      webVitalsTimeouts: 10000,
    });
  }, []);

  return children;
}
```

```javascript
// app/layout.js
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

## 🔧 配置选项

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `appId` | `string` | ✅ | - | 应用唯一标识 |
| `api` | `string` | ✅ | - | 数据上报接口地址 |
| `cacheMax` | `number` | ❌ | `5` | 缓存队列最大条数，达到后批量上报 |
| `webVitalsTimeouts` | `number` | ❌ | `3000` | Web Vitals 采集超时时间（ms） |

## 📊 监控数据类型

### 🚀 性能指标 (Performance)

| 指标 | 说明 |
|------|------|
| `dnsTime` | DNS 解析时间 |
| `tcpTime` | TCP 连接时间 |
| `whiteTime` | 白屏时间 |
| `fcp` | 首次内容绘制 (First Contentful Paint) |
| `lcp` | 最大内容绘制 (Largest Contentful Paint) |
| `fid` | 首次输入延迟 (First Input Delay) |
| `ttfb` | 首字节时间 (Time to First Byte) |
| `resources` | 资源加载详情（URL、耗时、大小、类型） |

### ❌ 错误信息 (Errors)

| 类型 | 说明 |
|------|------|
| `jsError` | JavaScript 运行时错误（包含堆栈信息） |
| `loadResourceError` | 资源加载失败（图片、脚本等） |
| `rejectError` | Promise 未捕获异常 |

### 🌐 接口监控 (Requests)

自动拦截 `XMLHttpRequest` 和 `Fetch` 请求：

| 字段 | 说明 |
|------|------|
| `url` | 请求地址 |
| `method` | 请求方法 |
| `status` | HTTP 状态码 |
| `cost` | 请求耗时（ms） |
| `reqHeaders` | 请求头 |
| `reqBody` | 请求体 |
| `requestType` | 请求结果（done/error） |

### 👤 用户行为 (Behaviors)

| 类型 | 说明 |
|------|------|
| `pageStatus` | 页面访问（进入时间、离开时间、停留时长） |
| `click` | 点击事件（元素路径，如 `div#app>button.submit`） |

### 📄 页面信息 (Page Info)

每条上报数据都包含：

| 字段 | 说明 |
|------|------|
| `domain` | 域名 |
| `pageUrl` | 页面路径 |
| `query` | URL 查询参数 |
| `userTimeStamp` | 事件时间戳 |
| `markUserId` | 匿名用户标识（自动生成） |
| `userId` | 登录用户 ID |
| `appId` | 应用 ID |

## 📡 数据上报

SDK 采用以下策略上报数据：

1. **批量上报**：数据缓存达到 `cacheMax` 条时批量上报
2. **离开上报**：页面关闭（`beforeunload`）时上报剩余数据
3. **上报方式**：通过 Image Beacon 方式上报，数据在 URL 参数中

上报格式：
```
GET {api}?data={encodeURIComponent(JSON.stringify(reportStack))}&appId={appId}
```

## 🌐 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 相关链接

- [GitHub 仓库](https://github.com/user/frontend-watch-dog)
- [问题反馈](https://github.com/user/frontend-watch-dog/issues)
