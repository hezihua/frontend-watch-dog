# 📚 前端监控 SDK 集成指南

## 🎯 概述

`@frontend-watch-dog/web-sdk` 是一个轻量级的前端监控 SDK，用于自动收集和上报网页性能、错误、用户行为等数据。

## 📦 安装

### 方式 1：npm/pnpm/yarn 安装（推荐）

```bash
# npm
npm install @frontend-watch-dog/web-sdk

# pnpm
pnpm add @frontend-watch-dog/web-sdk

# yarn
yarn add @frontend-watch-dog/web-sdk
```

### 方式 2：本地构建安装

如果 SDK 还未发布到 npm，可以使用本地链接：

```bash
# 在 SDK 目录构建
cd packages/web-sdk
pnpm install
pnpm build

# 创建本地链接
pnpm link --global

# 在你的项目中链接
cd your-project
pnpm link --global @frontend-watch-dog/web-sdk
```

### 方式 3：CDN 引入（待发布）

```html
<script src="https://unpkg.com/@frontend-watch-dog/web-sdk@latest/dist/esm/index.js"></script>
```

## 🚀 快速开始

### 1. 创建应用并获取 appId

登录前端监控平台 → 点击"创建应用" → 复制生成的 **appId**

### 2. 初始化 SDK

#### React/Vue/Angular 等框架

```typescript
// 在应用入口文件（如 main.ts / index.tsx）中初始化
import { Monitor } from '@frontend-watch-dog/web-sdk';

// 创建监控实例
const monitor = new Monitor({
  appId: 'your-app-id-here',           // 必填：应用 ID
  api: 'https://your-domain.com/api/report', // 必填：数据上报接口
  cacheMax: 5,                         // 可选：缓存最大条数，默认 5
  webVitalsTimeouts: 3000,             // 可选：Web Vitals 超时时间（ms），默认 3000
});

// 如果需要设置用户 ID（登录后调用）
Monitor.setUserId('user-123');
```

#### 原生 HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>我的网站</title>
</head>
<body>
  <!-- 页面内容 -->
  
  <script type="module">
    import { Monitor } from './path/to/@frontend-watch-dog/web-sdk';
    
    new Monitor({
      appId: 'your-app-id-here',
      api: 'https://your-domain.com/api/report',
      cacheMax: 5,
    });
  </script>
</body>
</html>
```

## ⚙️ 配置参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `appId` | `string` | ✅ | - | 应用唯一标识，在监控平台创建应用时获取 |
| `api` | `string` | ✅ | - | 数据上报接口地址 |
| `cacheMax` | `number` | ❌ | `5` | 缓存队列最大条数，达到后自动上报 |
| `webVitalsTimeouts` | `number` | ❌ | `3000` | Web Vitals 采集超时时间（毫秒） |

## 📊 监控能力

### 1. 性能监控

自动采集以下性能指标：

- **DNS 解析时间** (`dnsTime`)
- **TCP 连接时间** (`tcpTime`)
- **白屏时间** (`whiteTime`)
- **首次内容绘制** (`FCP` - First Contentful Paint)
- **最大内容绘制** (`LCP` - Largest Contentful Paint)
- **首次输入延迟** (`FID` - First Input Delay)
- **首字节时间** (`TTFB` - Time to First Byte)
- **资源加载信息** (CSS/JS/图片等)

### 2. 错误监控

自动捕获并上报：

- **JavaScript 运行时错误**
  ```javascript
  {
    type: 'jsError',
    message: '错误信息',
    filename: '错误文件',
    lineno: 行号,
    colno: 列号,
    stack: '堆栈信息'
  }
  ```

- **资源加载错误**
  ```javascript
  {
    type: 'loadResourceError',
    resourceType: '资源类型',
    resourceUrl: '资源地址'
  }
  ```

- **Promise 未捕获错误**
  ```javascript
  {
    type: 'rejectError',
    reason: '错误原因'
  }
  ```

### 3. 接口监控

自动拦截并上报所有 HTTP 请求（XMLHttpRequest 和 Fetch）：

```javascript
{
  type: 'request',
  url: '接口地址',
  method: '请求方法',
  status: '响应状态码',
  cost: '请求耗时(ms)',
  requestType: 'done' | 'error',  // 请求结果
  reqHeaders: '请求头',
  reqBody: '请求体'
}
```

### 4. 用户行为监控

- **页面访问** (`pageStatus`)
  - 页面进入/离开时间
  - 页面停留时长
  - 页面 URL 和参数

- **用户点击** (`click`)
  - 点击元素的 DOM 路径
  - 点击时间和页面信息

- **路由变化**
  - 支持 History API (`pushState` / `replaceState`)
  - 支持 Hash 路由 (`hashchange`)

## 🔧 API 方法

### Monitor.setUserId(userId: string)

设置用户 ID，用于关联用户身份（通常在用户登录后调用）

```typescript
// 用户登录成功后
Monitor.setUserId('user-12345');

// 用户退出后清除
Monitor.setUserId('');
```

## 💡 使用示例

### React 应用

```typescript
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Monitor } from '@frontend-watch-dog/web-sdk';
import App from './App';

// 初始化监控
new Monitor({
  appId: 'abc123def456',
  api: 'https://monitor.example.com/api/report',
  cacheMax: 10,
});

// 在登录后设置用户 ID
function onUserLogin(userId: string) {
  Monitor.setUserId(userId);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Vue 3 应用

```typescript
// src/main.ts
import { createApp } from 'vue';
import { Monitor } from '@frontend-watch-dog/web-sdk';
import App from './App.vue';

// 初始化监控
new Monitor({
  appId: 'abc123def456',
  api: 'https://monitor.example.com/api/report',
  cacheMax: 10,
});

const app = createApp(App);
app.mount('#app');
```

### Next.js 应用

```typescript
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { Monitor } from '@frontend-watch-dog/web-sdk';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 仅在客户端初始化
    if (typeof window !== 'undefined') {
      new Monitor({
        appId: process.env.NEXT_PUBLIC_MONITOR_APP_ID!,
        api: process.env.NEXT_PUBLIC_MONITOR_API!,
        cacheMax: 10,
      });
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

## 🔒 数据隐私

SDK 自动处理用户隐私：

1. **匿名用户标识** (`markUserId`)：自动生成并存储在 localStorage
2. **可选用户 ID** (`userId`)：需要手动设置，用于关联业务用户
3. **敏感数据过滤**：建议在上报前过滤敏感信息（如密码、token）

## 📝 注意事项

### 1. 上报接口配置

确保 `api` 参数指向正确的数据上报接口：

```typescript
// 开发环境
const monitor = new Monitor({
  appId: 'your-app-id',
  api: 'http://localhost:3000/api/report',  // 本地开发
});

// 生产环境
const monitor = new Monitor({
  appId: 'your-app-id',
  api: 'https://your-domain.com/api/report',  // 生产地址
});
```

### 2. 跨域配置

如果监控平台和应用不在同一域名，需要配置 CORS：

```javascript
// 监控平台后端
app.use(cors({
  origin: ['https://your-app.com'],
  credentials: true,
}));
```

### 3. 性能优化

- SDK 采用队列批量上报，默认缓存 5 条后上报
- 使用 Image 标签上报（兼容页面卸载场景）
- 建议在生产环境调大 `cacheMax` 减少请求次数

### 4. 浏览器兼容性

- 支持现代浏览器（Chrome、Firefox、Safari、Edge）
- 需要浏览器支持：
  - `Performance API`
  - `Web Vitals API`
  - `localStorage`
  - `XMLHttpRequest` / `Fetch`

## 🐛 常见问题

### Q1：数据没有上报？

1. 检查 `appId` 是否正确
2. 检查 `api` 地址是否可访问
3. 打开浏览器控制台，查看网络请求
4. 确认应用状态为"启用"

### Q2：如何在开发环境禁用 SDK？

```typescript
if (process.env.NODE_ENV === 'production') {
  new Monitor({
    appId: 'your-app-id',
    api: 'https://your-domain.com/api/report',
  });
}
```

### Q3：如何自定义上报数据？

目前 SDK 自动采集数据，暂不支持手动上报。如有需要，可以通过修改源码扩展功能。

## 📦 是否发布到 npm？

### 推荐发布到 npm，原因：

✅ **优点：**
1. **便于安装**：`npm install` 一键安装
2. **版本管理**：语义化版本控制
3. **自动更新**：用户可以轻松升级到最新版本
4. **CDN 支持**：unpkg、jsDelivr 自动提供 CDN 服务
5. **生态集成**：更容易被其他开发者使用

❌ **不发布的情况：**
- 仅内部使用
- 包含敏感信息
- 不希望公开

### 发布到 npm 的步骤：

```bash
# 1. 登录 npm（首次需要注册 npmjs.com 账号）
npm login

# 2. 构建 SDK
cd packages/web-sdk
pnpm install
pnpm build

# 3. 发布到 npm
npm publish --access public

# 4. 后续更新版本
npm version patch  # 修复版本 0.0.1 -> 0.0.2
npm version minor  # 次版本 0.0.2 -> 0.1.0
npm version major  # 主版本 0.1.0 -> 1.0.0
npm publish
```

### 私有 npm 仓库（企业内部）

如果不想公开发布，可以使用私有仓库：

```bash
# 使用 Verdaccio（私有 npm 仓库）
npm install -g verdaccio
verdaccio

# 或使用企业私有仓库
npm config set registry https://your-private-registry.com
npm publish
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- 项目地址：[GitHub Repository]
- 文档地址：[Documentation]
- 问题反馈：[Issues]
