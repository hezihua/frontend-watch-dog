# Next.js 项目功能对比清单

## 📊 功能对比总览

### ✅ 已实现的核心功能

| 模块 | 原项目 (Service + Desktop) | Next.js (Admin) | 状态 |
|------|---------------------------|-----------------|------|
| **用户认证** | | | |
| 用户注册 | `POST /api/desktop/register` | `POST /api/auth/register` | ✅ 已实现 |
| 用户登录 | `POST /api/desktop/login` | `POST /api/auth/login` | ✅ 已实现 |
| 用户登出 | `POST /api/desktop/loginOut` | `POST /api/auth/logout` | ✅ 已实现 |
| 获取用户信息 | `GET /api/desktop/getUserInfo` | 中间件验证 | ✅ 已实现 |
| **应用管理** | | | |
| 获取应用列表 | `GET /api/desktop/getAppList` | `GET /api/apps` | ✅ 已实现 |
| 创建应用 | `POST /api/desktop/createApp` | `POST /api/apps` | ✅ 已实现 |
| 更新应用状态 | `POST /api/desktop/updateAppStatus` | `POST /api/apps/status` | ✅ 已实现 |
| 获取应用统计 | - | `GET /api/apps/[appId]/stats` | ✅ 已实现 |
| **数据上报** | | | |
| 监控数据上报 | `GET /report` | `GET /api/report` | ✅ 已实现 |

### ⚠️ 已创建但使用模拟数据的功能

| 模块 | 原项目接口 | Next.js 接口 | 状态 |
|------|-----------|--------------|------|
| **流量分析** | | | |
| 今日流量数据 | `GET /api/desktop/analyse/getTodayTraffic` | `GET /api/analyse/stats` | ⚠️ 模拟数据 |
| 活跃用户 | `GET /api/desktop/analyse/getActiveUsers` | 🔴 未实现 | |
| 每日活跃用户 | `GET /api/desktop/analyse/getDayActiveUsers` | 🔴 未实现 | |
| 新用户统计 | `GET /api/desktop/analyse/getNewUsers` | 🔴 未实现 | |
| 总用户统计 | `GET /api/desktop/analyse/getAllUsers` | 🔴 未实现 | |
| 页面访问排行 | `GET /api/desktop/analyse/getWebVisitTop` | 🔴 未实现 | |
| **性能分析** | | | |
| 应用平均性能 | `GET /api/desktop/performance/getAppAvgPerformance` | `GET /api/performance/avg` | ⚠️ 模拟数据 |
| 页面平均性能 | `GET /api/desktop/performance/getPageAvgPerformance` | `GET /api/performance/pages` | ⚠️ 模拟数据 |
| 性能查询 | `GET /api/desktop/performance/getPerformance` | 🔴 未实现 | |
| **HTTP 错误** | | | |
| HTTP 错误列表 | `GET /api/desktop/httpError/getHttpList` | `GET /api/http-error/list` | ⚠️ 模拟数据 |
| HTTP 错误排行 | `GET /api/desktop/httpError/getHttpErrorRank` | 🔴 未实现 | |
| HTTP 完成排行 | `GET /api/desktop/httpError/getHttpDoneRank` | 🔴 未实现 | |
| HTTP 错误范围 | `GET /api/desktop/httpError/getHttpErrorRang` | 🔴 未实现 | |
| **JS 错误** | | | |
| JS 错误列表 | `GET /api/desktop/jsError/getJsErrorList` | `GET /api/js-error/list` | ⚠️ 模拟数据 |
| JS 错误范围 | `GET /api/desktop/jsError/getJsErrorRang` | 🔴 未实现 | |
| 错误附近代码 | `POST /api/desktop/jsError/getNearbyCode` | 🔴 未实现 | |
| **其他分析** | | | |
| Top 分析 | - | `GET /api/top/analyse` | ⚠️ 模拟数据 |
| 地域分布 | - | `GET /api/geo/distribution` | ⚠️ 模拟数据 |
| **流量趋势** | | | |
| 按小时流量 | `GET /api/desktop/traffic/getTrafficTimes` | 🔴 未实现 | |
| 按天流量 | `GET /api/desktop/traffic/getTrafficDays` | 🔴 未实现 | |

### 🎨 前端页面对比

| 页面 | Desktop 项目 | Next.js Admin 项目 | 状态 |
|------|-------------|-------------------|------|
| 登录/注册 | `/login` | `/login` | ✅ 已实现 |
| 应用首页 | `/home` | `/` (page.tsx) | ✅ 已实现 |
| 流量分析 | `/visitorStats` | `/visitor-stats` | ⚠️ UI完成，数据模拟 |
| 性能分析 | `/performance` | `/performance` | ⚠️ UI完成，数据模拟 |
| 首屏查询 | `/performanceSearch` | `/performance-search` | ✅ 页面存在 |
| HTTP 错误 | `/httpError` | `/http-error` | ⚠️ UI完成，数据模拟 |
| 接口查询 | `/httpSearch` | `/http-search` | ✅ 页面存在 |
| JS 错误 | `/jsError` | `/js-error` | ✅ 页面存在 |
| Top 分析 | `/topAnalyse` | `/top-analyse` | ✅ 页面存在 |
| 地域分布 | `/geographicalDistribution` | `/geographical-distribution` | ✅ 页面存在 |
| 健康情况 | `/content` | 🔴 未实现 | |

## 🔴 缺失的核心功能

### 1. **Elasticsearch 真实数据查询**

目前所有分析接口都返回模拟数据，需要实现：

#### 需要实现的 Elasticsearch 查询逻辑：

```typescript
// 1. 流量分析查询
- 按时间范围统计 PV、UV
- 活跃用户统计
- 新用户、总用户统计
- 页面访问排行

// 2. 性能分析查询  
- 聚合计算平均 FCP、LCP、TTFB
- 按页面分组统计性能
- 性能趋势图数据
- 白屏时间分布

// 3. HTTP 错误分析
- 按 URL 聚合错误统计
- 错误率计算
- 状态码分布
- 错误排行榜

// 4. JS 错误分析
- 按错误消息聚合
- 错误堆栈信息
- 错误发生频率
- 错误趋势

// 5. 地域分布
- 按省份/城市聚合访问量
- IP 地址分布

// 6. Top 分析
- 浏览器分布
- 操作系统分布
- 设备类型分布
- 热门页面
```

### 2. **Redis 缓存层**

原项目使用 Redis 缓存：
- 应用状态缓存
- 用户会话
- 高频查询结果缓存

Next.js 项目中 Redis 连接已配置但**未使用**。

### 3. **Kafka 消息队列**（可选）

原项目流程：
```
SDK 上报 → Egg.js → Kafka → Elasticsearch
```

Next.js 项目流程：
```
SDK 上报 → Next.js → 直接写入 Elasticsearch
```

**是否需要 Kafka？**
- ✅ **不需要**：数据量小（< 10万/天），直接写入即可
- ⚠️ **考虑**：数据量中等（10万-100万/天），可选
- 🔴 **必须**：数据量大（> 100万/天），需要异步处理

### 4. **SourceMap 支持**（JS 错误追踪）

原项目功能：
```typescript
POST /api/desktop/jsError/getNearbyCode
```

作用：
- 上传 SourceMap 文件
- 解析压缩后的错误堆栈
- 显示原始代码位置

### 5. **定时任务/数据统计**

原项目可能有定时任务（需要检查 `service/app/schedule/`）：
- 数据清理
- 报表生成
- 数据聚合

### 6. **用户权限管理**

原项目功能：
- 用户角色
- 应用访问权限
- 团队协作

Next.js 项目目前是**简化版权限**：
- 只验证登录状态
- 应用与创建者绑定

## 📋 建议实现优先级

### 🔥 高优先级（核心功能）

1. **实现 Elasticsearch 真实数据查询**
   - 流量分析（PV、UV、活跃用户）
   - 性能分析（FCP、LCP、TTFB 聚合）
   - HTTP 错误统计
   - JS 错误统计

2. **完善查询接口**
   - 按时间范围过滤
   - 分页功能
   - 排序功能
   - 搜索功能

3. **数据可视化组件**
   - 时间趋势图（ECharts/Recharts）
   - 地域分布地图
   - 数据表格

### ⚠️ 中优先级（增强功能）

4. **Redis 缓存集成**
   - 高频查询结果缓存
   - 应用状态缓存

5. **更多统计维度**
   - 流量趋势（按小时、按天）
   - 用户留存分析
   - 页面漏斗分析

6. **SourceMap 支持**
   - 错误堆栈解析
   - 原始代码定位

### 🔵 低优先级（优化功能）

7. **Kafka 消息队列**（仅在数据量大时）

8. **数据导出功能**
   - 导出 Excel
   - 导出 CSV

9. **告警系统**
   - 错误率告警
   - 性能告警

10. **权限系统增强**
    - 团队管理
    - 角色权限

## 🎯 总结

### ✅ 已完成（约 40%）
- 用户认证系统
- 应用管理
- 数据上报接口
- 基础 UI 框架
- 模拟数据接口

### 🔄 需要完善（约 50%）
- **Elasticsearch 真实查询**（最重要！）
- 数据可视化
- 查询过滤、分页、排序
- Redis 缓存

### ⭐ 可选增强（约 10%）
- SourceMap 支持
- Kafka 集成
- 高级权限管理
- 告警系统

## 🚀 下一步行动建议

**立即要做的 3 件事：**

1. **实现 Elasticsearch 查询服务**
   ```typescript
   // admin/src/services/elasticsearch-query.ts
   - queryPerformanceStats()
   - queryTrafficStats()  
   - queryHttpErrors()
   - queryJsErrors()
   ```

2. **替换模拟数据接口**
   - 修改所有 API 路由调用真实 Elasticsearch
   - 处理真实的时间范围、分页参数

3. **测试数据流**
   - 使用 SDK 上报真实数据
   - 验证数据能正确存储和查询
   - 在前端页面显示真实数据

需要我立即开始实现 **Elasticsearch 真实数据查询**吗？这是最关键的缺失功能！
