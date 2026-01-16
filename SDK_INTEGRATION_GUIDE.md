# SDK 集成指南

## 📦 集成步骤

### 1. 复制 SDK 文件

将 `desktop/src/sdk/index.ts` 复制到您的项目中。

### 2. 在项目中初始化 SDK

```typescript
import FrontendMonitor from './sdk';

// 在应用入口文件中初始化
const monitor = new FrontendMonitor({
  appId: 'your-app-id', // 从应用管理页面复制的 appId
  reportUrl: 'http://localhost:3000/api/report', // 数据上报地址
  // 可选配置
  delay: 1000, // 延迟上报时间（毫秒），默认 1000
  maxCacheSize: 10, // 最大缓存数量，默认 10
});
```

### 3. SDK 会自动收集以下数据

#### 📊 性能数据
- **DNS 解析时间**
- **TCP 连接时间**
- **白屏时间**
- **FCP** (First Contentful Paint) - 首次内容绘制
- **LCP** (Largest Contentful Paint) - 最大内容绘制
- **FID** (First Input Delay) - 首次输入延迟
- **TTFB** (Time to First Byte) - 首字节时间
- **资源加载信息**（JS、CSS、图片等）

#### 🐛 错误监控
- **JS 错误**：捕获运行时错误，包含堆栈信息
- **Promise 拒绝错误**：捕获未处理的 Promise 异常
- **资源加载错误**：捕获图片、JS、CSS 等资源加载失败

#### 🌐 HTTP 请求监控
- **XMLHttpRequest** 监控
- **Fetch API** 监控
- 记录请求 URL、方法、状态码、耗时

#### 📈 用户行为
- **页面访问**：记录页面 URL、停留时间
- **用户点击**：记录点击元素（可选）

## 🔧 配置选项

```typescript
interface MonitorOptions {
  appId: string;           // 应用ID（必填）
  reportUrl: string;       // 数据上报地址（必填）
  delay?: number;          // 延迟上报时间（毫秒），默认 1000
  maxCacheSize?: number;   // 最大缓存数量，默认 10
  userId?: string;         // 用户ID（可选）
}
```

## 📝 React 项目集成示例

### App.tsx / main.tsx

```typescript
import React from 'react';
import FrontendMonitor from './sdk';

// 初始化监控
const monitor = new FrontendMonitor({
  appId: 'your-app-id-here',
  reportUrl: 'http://localhost:3000/api/report',
  userId: 'user-123', // 可选，可以从用户登录信息中获取
});

function App() {
  return (
    <div className="App">
      {/* 你的应用内容 */}
    </div>
  );
}

export default App;
```

## 🌐 Vue 项目集成示例

### main.js

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import FrontendMonitor from './sdk';

// 初始化监控
const monitor = new FrontendMonitor({
  appId: 'your-app-id-here',
  reportUrl: 'http://localhost:3000/api/report',
});

const app = createApp(App);
app.mount('#app');
```

## 📍 Next.js 项目集成示例

### _app.tsx (Pages Router) 或 layout.tsx (App Router)

```typescript
import { useEffect } from 'react';
import FrontendMonitor from '@/lib/sdk';

export default function RootLayout({ children }) {
  useEffect(() => {
    // 初始化监控
    const monitor = new FrontendMonitor({
      appId: 'your-app-id-here',
      reportUrl: 'http://localhost:3000/api/report',
    });
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

## 🔍 验证集成

1. **启动监控系统**
   ```bash
   cd admin
   pnpm dev
   ```

2. **启动您的应用**
   ```bash
   npm run dev
   ```

3. **访问您的应用**，打开浏览器开发者工具（F12）

4. **查看 Network 标签**，应该能看到向 `/api/report` 发送的请求

5. **登录监控后台**，查看流量分析、性能分析等页面，应该能看到上报的数据

## ⚠️ 注意事项

1. **生产环境配置**：
   - 将 `reportUrl` 修改为生产环境的地址
   - 确保服务器支持跨域请求（CORS）

2. **性能影响**：
   - SDK 使用异步上报，不会阻塞主线程
   - 采用批量上报策略，减少网络请求

3. **隐私保护**：
   - 不要在敏感页面收集数据
   - 确保符合用户隐私政策

4. **错误处理**：
   - SDK 内部会捕获所有异常，不会影响应用运行
   - 上报失败会自动重试

## 🎯 数据流程

```
用户应用 → SDK 收集数据 → 批量缓存 → 
延迟上报 → GET /api/report → 
Elasticsearch 存储 → 监控后台展示
```

## 📚 相关文档

- [Elasticsearch 数据结构](./ELASTICSEARCH_SCHEMA.md)
- [API 接口文档](./API_DOCS.md)
- [部署指南](./DEPLOYMENT.md)
