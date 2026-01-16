# @frontend-watch-dog/web-sdk

[![NPM version](https://img.shields.io/npm/v/@frontend-watch-dog/web-sdk.svg?style=flat)](https://npmjs.org/package/@frontend-watch-dog/web-sdk)
[![NPM downloads](http://img.shields.io/npm/dm/@frontend-watch-dog/web-sdk.svg?style=flat)](https://npmjs.org/package/@frontend-watch-dog/web-sdk)
[![License](https://img.shields.io/npm/l/@frontend-watch-dog/web-sdk.svg)](https://github.com/your-repo/LICENSE)

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
npm install @frontend-watch-dog/web-sdk
# or
pnpm add @frontend-watch-dog/web-sdk
# or
yarn add @frontend-watch-dog/web-sdk
```

## 🚀 快速开始

```typescript
import { Monitor } from '@frontend-watch-dog/web-sdk';

// 初始化监控
new Monitor({
  appId: 'your-app-id',                  // 应用 ID
  api: 'https://your-api.com/api/report', // 上报接口
  cacheMax: 5,                           // 缓存条数
});

// 设置用户 ID（可选）
Monitor.setUserId('user-123');
```

## 📖 详细文档

完整的集成文档请查看项目根目录的 [SDK_INTEGRATION_GUIDE.md](../../SDK_INTEGRATION_GUIDE.md)

## 🔧 配置选项

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `appId` | `string` | ✅ | - | 应用唯一标识 |
| `api` | `string` | ✅ | - | 数据上报接口地址 |
| `cacheMax` | `number` | ❌ | `5` | 缓存队列最大条数 |
| `webVitalsTimeouts` | `number` | ❌ | `3000` | Web Vitals 采集超时时间（ms） |

## 📊 监控数据

### 性能指标
- DNS 解析时间
- TCP 连接时间
- 白屏时间
- FCP / LCP / FID / TTFB
- 资源加载详情

### 错误信息
- JavaScript 运行时错误
- 资源加载失败
- Promise 未捕获异常

### 接口监控
- 请求 URL、方法、状态码
- 请求耗时
- 请求/响应数据

### 用户行为
- 页面访问记录
- 停留时长
- 点击事件
- 路由跳转

## 🌐 浏览器支持

- Chrome (现代版本)
- Firefox (现代版本)
- Safari (现代版本)
- Edge (现代版本)

## 📄 License

MIT © [Your Name]

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 相关链接

- [监控平台](https://your-monitor-platform.com)
- [完整文档](../../SDK_INTEGRATION_GUIDE.md)
- [问题反馈](https://github.com/your-repo/issues)
