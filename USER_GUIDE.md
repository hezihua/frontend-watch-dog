# Frontend Watch Dog 使用指南

## 📖 系统说明

Frontend Watch Dog 是一个**前端监控系统**，用于监控你的网站/Web 应用的：
- 📊 流量数据（UV、PV、IP）
- ⚡ 性能指标（FCP、LCP、TTFB）
- 🐛 JavaScript 错误
- 🌐 API 接口异常
- 📍 用户地域分布
- 💻 浏览器和设备信息

---

## 🎯 使用流程

### 步骤 1: 创建应用

1. 登录监控平台：http://localhost:8080
2. 点击左侧菜单"应用列表"
3. 点击"创建应用"按钮
4. 填写应用名称（例如：`我的官网`、`电商项目`）
5. 点击确定，系统会生成一个唯一的 **appId**

**重要**: 记住这个 appId，后面需要用到！

---

### 步骤 2: 在你的前端项目中集成 SDK

#### 方式一：NPM 安装（推荐）

```bash
npm install @frontend-watch-dog/web-sdk
# 或
pnpm add @frontend-watch-dog/web-sdk
```

在你的项目入口文件（如 `main.js`、`index.js`、`App.js`）中：

```javascript
import { Monitor } from '@frontend-watch-dog/web-sdk';

// 初始化监控
new Monitor({
  appId: 'your-app-id-here',           // 替换为你的 appId
  api: 'http://your-domain.com/report', // 监控后端地址
  cacheMax: 10,                         // 最大缓存数
  webVitalsTimeouts: 5000,              // 性能指标超时时间(ms)
});
```

#### 方式二：直接引入（本地开发）

如果你在本地开发，可以直接使用构建好的 SDK：

```bash
# 1. 构建 SDK
cd packages/web-sdk
pnpm build

# 2. 在你的项目中引入
```

```html
<!-- 在 HTML 中引入 -->
<script src="path/to/web-sdk/dist/index.js"></script>
<script>
  new Monitor({
    appId: 'your-app-id-here',
    api: 'http://localhost:7001/report',
    cacheMax: 10,
    webVitalsTimeouts: 5000,
  });
</script>
```

---

### 步骤 3: 配置说明

```javascript
new Monitor({
  // 必填配置
  appId: 'wgnfezuv1706513953473',      // 应用ID（在平台创建应用时生成）
  api: 'http://localhost:7001/report',  // 数据上报地址
  
  // 可选配置
  cacheMax: 10,                         // 数据缓存队列最大长度，默认 10
  webVitalsTimeouts: 5000,              // Web Vitals 指标采集超时时间(ms)，默认 5000
});
```

#### 配置说明

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| `appId` | string | ✅ | 应用唯一标识，在平台创建应用时生成 | - |
| `api` | string | ✅ | 数据上报接口地址 | - |
| `cacheMax` | number | ❌ | 本地缓存队列最大长度 | 10 |
| `webVitalsTimeouts` | number | ❌ | 性能指标采集超时时间(毫秒) | 5000 |

---

### 步骤 4: 验证集成

#### 1. 检查控制台

打开浏览器开发者工具（F12），查看 Network 标签页：
- 应该能看到向 `/report` 接口发送的请求
- 请求中包含 `appId`、性能数据、错误信息等

#### 2. 查看监控平台

返回监控平台 http://localhost:8080：
- 选择你创建的应用
- 等待 1-2 分钟，数据会开始显示
- 查看"流量分析"、"性能分析"等模块

---

## 📊 监控功能说明

### 1. 流量分析

**位置**: 左侧菜单 → 流量分析

**功能**:
- **今日流量**: 实时查看 UV、PV、IP 等数据
- **新用户趋势**: 查看新用户增长情况
- **分时流量**: 按小时统计流量分布
- **每日流量**: 按天统计流量趋势

**使用场景**:
- 了解网站访问量
- 分析流量高峰时段
- 监控推广效果

---

### 2. 性能分析

**位置**: 左侧菜单 → 性能分析

**功能**:
- **综合应用性能**: 查看平均 FCP、LCP、TTFB 等指标
- **Top 性能分析**: 找出加载最慢的页面

**监控指标**:
- `FCP` (First Contentful Paint): 首次内容绘制时间
- `LCP` (Largest Contentful Paint): 最大内容绘制时间
- `TTFB` (Time To First Byte): 首字节响应时间
- `FID` (First Input Delay): 首次输入延迟

**使用场景**:
- 优化页面加载速度
- 发现性能瓶颈
- 对比优化前后效果

---

### 3. 接口分析

**位置**: 左侧菜单 → 接口分析

**功能**:
- **接口异常走势**: 查看 API 错误率趋势
- **高频错误**: 找出最常出错的接口
- **慢响应 Top50**: 找出响应最慢的接口

**使用场景**:
- 监控 API 稳定性
- 快速定位接口问题
- 优化慢接口

---

### 4. 接口查询

**位置**: 左侧菜单 → 接口查询

**功能**:
- 查询具体接口的调用记录
- 查看请求参数、响应时间、错误信息

**使用场景**:
- 排查特定接口问题
- 分析接口调用情况

---

### 5. 监控概况（JS 错误）

**位置**: 左侧菜单 → 监控概况

**功能**:
- **JS 异常走势**: 查看错误数量趋势
- **日常查询**: 查看具体错误详情
- **错误源码定位**: 上传 SourceMap 后可定位到源码位置

**使用场景**:
- 监控前端错误率
- 快速修复线上 Bug
- 错误归类和分析

---

### 6. 首屏查询

**位置**: 左侧菜单 → 首屏查询

**功能**:
- 查询每次页面访问的首屏加载时间
- 分析首屏性能分布

**使用场景**:
- 优化首屏加载速度
- 对比不同用户的加载体验

---

### 7. Top 分析

**位置**: 左侧菜单 → Top分析

**功能**:
- **网页访问量 Top**: 最受欢迎的页面
- **省份分布 Top**: 用户地域分布
- **浏览器 Top**: 用户浏览器分布
- **操作系统 Top**: 用户系统分布
- **设备型号**: 用户设备分布

**使用场景**:
- 了解用户画像
- 优化兼容性
- 针对性优化体验

---

### 8. 地域分布

**位置**: 左侧菜单 → 地域分布

**功能**:
- 在地图上查看用户分布
- 按省份统计访问量

**使用场景**:
- 了解用户地域分布
- 制定区域运营策略

---

## 🎨 完整示例

### React 项目示例

```jsx
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Monitor } from '@frontend-watch-dog/web-sdk';
import App from './App';

// 初始化监控（放在最前面）
new Monitor({
  appId: 'wgnfezuv1706513953473',
  api: 'http://localhost:7001/report',
  cacheMax: 10,
  webVitalsTimeouts: 5000,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Vue 项目示例

```javascript
// main.js
import { createApp } from 'vue'
import { Monitor } from '@frontend-watch-dog/web-sdk'
import App from './App.vue'

// 初始化监控
new Monitor({
  appId: 'wgnfezuv1706513953473',
  api: 'http://localhost:7001/report',
  cacheMax: 10,
  webVitalsTimeouts: 5000,
})

createApp(App).mount('#app')
```

### 原生 HTML 示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Hello World</h1>
  
  <!-- 引入 SDK -->
  <script src="https://unpkg.com/@frontend-watch-dog/web-sdk/dist/index.js"></script>
  <script>
    // 初始化监控
    new Monitor({
      appId: 'wgnfezuv1706513953473',
      api: 'http://localhost:7001/report',
      cacheMax: 10,
      webVitalsTimeouts: 5000,
    });
  </script>
</body>
</html>
```

---

## 🔍 高级功能

### 1. SourceMap 上传（错误源码定位）

当发生 JavaScript 错误时，上传 SourceMap 可以定位到源码位置：

**步骤**:
1. 构建项目时保留 SourceMap 文件
2. 在监控平台的"监控概况"中找到错误
3. 点击"上传 SourceMap"按钮
4. 上传对应的 `.map` 文件
5. 系统会自动解析并显示源码位置

### 2. 自定义数据上报

如果需要自定义上报数据，可以查看 SDK 源码扩展功能。

---

## ❓ 常见问题

### Q1: 为什么没有数据？

**检查项**:
1. ✅ 确认 SDK 已正确集成，查看浏览器控制台是否有错误
2. ✅ 确认 appId 正确
3. ✅ 确认 api 地址正确（开发环境用 localhost，生产环境用实际域名）
4. ✅ 查看 Network 标签页，确认数据已发送到 `/report` 接口
5. ✅ 等待 1-2 分钟，数据有延迟

### Q2: 数据不准确怎么办？

**原因**:
- 浏览器插件（如广告拦截器）可能阻止数据上报
- 用户关闭了 JavaScript
- 跨域问题

**解决**:
- 在后端配置 CORS 允许跨域
- 检查是否有报错信息

### Q3: 如何监控多个网站？

**答案**:
- 在平台创建多个应用，每个应用有独立的 appId
- 在不同网站集成 SDK 时使用对应的 appId

### Q4: 生产环境如何配置？

**配置**:
```javascript
new Monitor({
  appId: 'your-production-app-id',
  api: 'https://your-domain.com/report',  // 使用 HTTPS
  cacheMax: 10,
  webVitalsTimeouts: 5000,
});
```

### Q5: 性能影响大吗？

**答案**:
- SDK 采用异步上报，不会阻塞页面
- 数据会批量上报，减少请求次数
- SDK 体积小，加载快
- 对页面性能影响极小（<5%）

---

## 📞 技术支持

- **GitHub**: https://github.com/luoguoxiong/frontend-watch-dog
- **Issues**: https://github.com/luoguoxiong/frontend-watch-dog/issues

---

## 📝 工作流程图

```
┌─────────────────────────────────────────────────────────────┐
│                      监控工作流程                              │
└─────────────────────────────────────────────────────────────┘

1. 创建应用
   ├─ 登录监控平台
   ├─ 创建应用并获取 appId
   └─ 记录 appId

2. 集成 SDK
   ├─ 在前端项目中安装 SDK
   ├─ 配置 appId 和 api 地址
   └─ 初始化 Monitor

3. 自动收集数据
   ├─ 页面访问（PV、UV）
   ├─ 性能指标（FCP、LCP、TTFB）
   ├─ JavaScript 错误
   ├─ API 调用情况
   └─ 用户行为数据

4. 数据上报
   ├─ SDK 自动批量上报到 /report 接口
   ├─ 后端接收并存储到数据库/ES
   └─ 数据实时处理和聚合

5. 数据展示
   ├─ 登录监控平台
   ├─ 选择对应应用
   └─ 查看各项监控指标
```

---

**最后更新**: 2026-01-13
