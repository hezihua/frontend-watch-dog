# API 接口文档

## 📡 接口概览

所有接口基于 Next.js API Routes 实现，路径前缀为 `/api`。

## 🔐 认证相关

### 1. 用户注册

**POST** `/api/auth/register`

**请求体：**
```json
{
  "account": "user123",     // 6-10位字母数字
  "password": "pass123"     // 6-10位字母数字
}
```

**响应：**
```json
{
  "code": 1000,
  "message": "注册成功"
}
```

**错误码：**
- `1001`: 账号已存在
- `1002`: 参数格式错误

---

### 2. 用户登录

**POST** `/api/auth/login`

**请求体：**
```json
{
  "account": "user123",
  "password": "pass123"
}
```

**响应：**
```json
{
  "code": 1000,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**说明：**
- 成功后会设置 `token` Cookie（HttpOnly）
- Token 有效期：7 天

---

### 3. 用户退出

**POST** `/api/auth/logout`

**响应：**
```json
{
  "code": 1000,
  "message": "退出成功"
}
```

---

## 📱 应用管理

### 1. 获取应用列表

**GET** `/api/apps`

**请求头：**
```
Cookie: token=xxx
```

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "appId": "abc123def456",
      "appName": "我的电商网站",
      "appType": 1,
      "status": 1,
      "createId": 1,
      "createdAt": "2026-01-17T10:00:00.000Z",
      "updatedAt": "2026-01-17T10:00:00.000Z"
    }
  ]
}
```

---

### 2. 创建应用

**POST** `/api/apps`

**请求头：**
```
Cookie: token=xxx
Content-Type: application/json
```

**请求体：**
```json
{
  "appName": "我的应用",
  "appType": 1  // 1:Web 2:H5 3:小程序
}
```

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": {
    "id": 1,
    "appId": "abc123def456",
    "appName": "我的应用",
    "appType": 1,
    "status": 1,
    "createId": 1
  }
}
```

---

### 3. 更新应用状态

**PUT** `/api/apps/status`

**请求体：**
```json
{
  "appId": "abc123def456",
  "status": 0  // 0:禁用 1:启用
}
```

**响应：**
```json
{
  "code": 1000,
  "message": "成功"
}
```

---

### 4. 获取应用统计

**GET** `/api/apps/{appId}/stats`

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": {
    "activeUsers": 150,
    "allUsers": 1200,
    "newUsers": 30,
    "lastWeekActiveUers": [100, 120, 110, 130, 150, 140, 160]
  }
}
```

---

## 📊 数据上报

### 数据上报接口

**GET** `/api/report`

**查询参数：**
- `appId`: 应用ID
- `data`: 上报数据（JSON 字符串，需 URL 编码）

**请求示例：**
```
GET /api/report?appId=abc123&data=%5B%7B%22type%22%3A%22performance%22%7D%5D
```

**上报数据格式：**
```json
[
  {
    "type": "performance",
    "domain": "example.com",
    "pageUrl": "https://example.com/page",
    "isFirst": true,
    "dnsTime": 20,
    "tcpTime": 30,
    "whiteTime": 500,
    "fcp": 800,
    "lcp": 1200,
    "fid": 50,
    "ttfb": 200,
    "rescources": []
  }
]
```

**数据类型：**
- `performance`: 性能数据
- `jsError`: JS 错误
- `request`: HTTP 请求
- `pageStatus`: 页面状态
- `click`: 点击事件

**响应：**
```json
{
  "code": 1000,
  "message": "数据上报成功"
}
```

---

## 📈 流量分析

### 1. 获取流量统计

**GET** `/api/analyse/stats`

**查询参数：**
- `appId`: 应用ID
- `startTime`: 开始时间（毫秒时间戳，可选）
- `endTime`: 结束时间（毫秒时间戳，可选）

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": {
    "todayPV": 5000,
    "todayUV": 1200,
    "newUsers": 150,
    "activeUsers": 800,
    "pvGrowth": 15.5,
    "uvGrowth": 12.3,
    "trafficTrend": [
      {
        "key": "2026-01-17 10:00",
        "pv": { "doc_count": 500 },
        "uv": { "value": 120 }
      }
    ]
  }
}
```

---

### 2. 获取流量趋势

**GET** `/api/traffic/trend`

**查询参数：**
- `appId`: 应用ID
- `interval`: 时间间隔（`hour` 或 `day`）
- `startTime`: 开始时间（可选）
- `endTime`: 结束时间（可选）

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": [
    {
      "key_as_string": "2026-01-17 10:00",
      "pv": { "doc_count": 500 },
      "uv": { "value": 120 }
    }
  ]
}
```

---

## ⚡ 性能分析

### 1. 获取平均性能指标

**GET** `/api/performance/avg`

**查询参数：**
- `appId`: 应用ID
- `startTime`: 开始时间（可选）
- `endTime`: 结束时间（可选）

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": {
    "fcp": 800,
    "lcp": 1200,
    "fid": 50,
    "ttfb": 200,
    "dnsTime": 20,
    "tcpTime": 30,
    "whiteTime": 500
  }
}
```

---

### 2. 获取页面性能详情

**GET** `/api/performance/pages`

**查询参数：**
- `appId`: 应用ID
- `startTime`: 开始时间（可选）
- `endTime`: 结束时间（可选）

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": [
    {
      "key": "/home",
      "doc_count": 1000,
      "avg_fcp": { "value": 800 },
      "avg_lcp": { "value": 1200 },
      "avg_ttfb": { "value": 200 }
    }
  ]
}
```

---

## 🐛 错误监控

### 1. 获取 HTTP 错误列表

**GET** `/api/http-error/list`

**查询参数：**
- `appId`: 应用ID
- `page`: 页码（可选，默认 1）
- `pageSize`: 每页条数（可选，默认 10）

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": {
    "list": [
      {
        "id": "_doc_id",
        "url": "https://api.example.com/user",
        "method": "get",
        "status": 404,
        "cost": 150,
        "pageUrl": "https://example.com/home",
        "userTimeStamp": 1705478400000
      }
    ],
    "total": 50,
    "errorRate": "2.5"
  }
}
```

---

### 2. 获取 HTTP 错误排行

**GET** `/api/http-error/rank`

**查询参数：**
- `appId`: 应用ID

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": [
    {
      "key": "https://api.example.com/user",
      "error_count": { "value": 150 }
    }
  ]
}
```

---

### 3. 获取 JS 错误列表

**GET** `/api/js-error/list`

**查询参数：**
- `appId`: 应用ID
- `page`: 页码（可选）
- `pageSize`: 每页条数（可选）

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": {
    "list": [
      {
        "id": "_doc_id",
        "message": "Cannot read property 'name' of undefined",
        "filename": "app.js",
        "lineno": 10,
        "colno": 20,
        "stack": "Error: ...",
        "pageUrl": "https://example.com/home",
        "userTimeStamp": 1705478400000
      }
    ],
    "total": 25,
    "errorCount": 100,
    "userCount": 50,
    "healthScore": 95
  }
}
```

---

## 📊 Top 分析

### 获取 Top 分析数据

**GET** `/api/top/analyse`

**查询参数：**
- `appId`: 应用ID
- `type`: 分析类型（`page` | `browser` | `device` | `os`）

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": [
    {
      "label": "/home",
      "value": 5000,
      "uv": 1200
    }
  ]
}
```

---

## 🗺️ 地域分布

### 获取地域分布数据

**GET** `/api/geo/distribution`

**查询参数：**
- `appId`: 应用ID

**响应：**
```json
{
  "code": 1000,
  "message": "成功",
  "data": {
    "provinces": [
      {
        "key": "北京市",
        "doc_count": 1000,
        "uv": { "value": 500 }
      }
    ],
    "totalVisits": 5000,
    "totalUsers": 1200,
    "coveredProvinces": 15
  }
}
```

---

## 📋 错误码说明

| 错误码 | 说明 |
|--------|------|
| `1000` | 成功 |
| `1001` | 业务错误（具体看 message） |
| `1002` | 参数错误 |
| `1003` | 数据库错误 |
| `1004` | 服务器内部错误 |
| `1005` | 未登录或登录已过期 |

---

## 🔒 认证方式

所有需要认证的接口通过 **Cookie** 传递 JWT Token：

```http
GET /api/apps
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token 失效时返回：
```json
{
  "code": 1005,
  "message": "未登录或登录已过期"
}
```

---

## 📝 注意事项

1. **时间格式**：所有时间戳均为毫秒级 Unix 时间戳
2. **缓存策略**：部分接口使用 Redis 缓存，默认缓存 5 分钟
3. **分页参数**：`page` 从 1 开始，`pageSize` 默认 10，最大 100
4. **跨域支持**：开发环境自动配置 CORS，生产环境需手动配置
5. **速率限制**：生产环境建议配置 API 速率限制

---

## 🔗 相关文档

- [开发指南](./DEVELOPMENT.md)
- [SDK 集成](./SDK_INTEGRATION.md)
- [部署文档](./DEPLOYMENT.md)
