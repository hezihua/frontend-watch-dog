# 前端监控系统 - Admin 项目文档

## 📖 文档导航

- [项目介绍](#项目介绍)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [相关文档](#相关文档)

## 项目介绍

基于 **Next.js 15** 构建的前端监控系统管理后台，提供完整的前端性能监控、错误追踪、用户行为分析功能。

### ✨ 核心功能

- 📊 **流量分析**：PV/UV 统计、访问趋势分析
- ⚡ **性能监控**：FCP、LCP、FID、TTFB 等核心指标
- 🐛 **错误追踪**：JS 错误、HTTP 错误实时监控
- 👤 **用户行为**：页面访问、停留时长、点击轨迹
- 📈 **Top 分析**：热门页面、浏览器、设备、操作系统
- 🗺️ **地域分布**：用户地理位置可视化
- 👥 **团队协作**：多成员协作、权限管理
- 📤 **数据导出**：支持 XLSX/CSV 格式导出

## 技术栈

### 前端框架
- **Next.js 15** - React 全栈框架
- **React 19** - UI 库
- **TypeScript** - 类型系统
- **Ant Design 5** - UI 组件库
- **ECharts** - 数据可视化
- **TailwindCSS** - 样式框架

### 后端技术
- **Next.js API Routes** - 后端 API
- **Prisma 5** - ORM 数据库工具
- **MySQL** - 关系型数据库
- **Redis** - 缓存数据库
- **Elasticsearch 7** - 搜索引擎

### 认证与安全
- **JWT** - 身份认证
- **bcryptjs** - 密码加密

### 开发工具
- **pnpm** - 包管理器
- **ESLint** - 代码检查
- **Prettier** - 代码格式化

## 快速开始

### 1. 环境要求

- Node.js >= 18
- pnpm >= 8
- MySQL >= 5.7
- Redis >= 5.0
- Elasticsearch >= 7.x

### 2. 安装依赖

```bash
cd admin
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env.local`，并配置：

```env
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/database_development"

# JWT 密钥
JWT_SECRET="your-secret-key-change-in-production"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Elasticsearch
ELASTICSEARCH_NODE="http://localhost:9200"

# Next.js API URL
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 4. 初始化数据库

```bash
pnpm prisma generate
pnpm prisma db push
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 6. 构建生产版本

```bash
pnpm build
pnpm start
```

## 项目结构

```
admin/
├── docs/                    # 项目文档
│   ├── README.md           # 本文档
│   ├── DEPLOYMENT.md       # 部署指南
│   ├── SDK_INTEGRATION.md  # SDK 集成文档
│   ├── API.md              # API 接口文档
│   └── DEVELOPMENT.md      # 开发指南
├── prisma/                  # Prisma 数据库
│   └── schema.prisma       # 数据库模型
├── public/                  # 静态资源
│   └── test-report.html    # 测试上报页面
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/        # 认证路由组
│   │   │   └── login/     # 登录页面
│   │   ├── api/           # API 路由
│   │   │   ├── auth/      # 认证相关
│   │   │   ├── apps/      # 应用管理
│   │   │   ├── report/    # 数据上报
│   │   │   ├── analyse/   # 流量分析
│   │   │   ├── performance/ # 性能分析
│   │   │   ├── http-error/  # HTTP 错误
│   │   │   ├── js-error/    # JS 错误
│   │   │   ├── top/         # Top 分析
│   │   │   └── geo/         # 地域分布
│   │   ├── visitor-stats/       # 流量分析页面
│   │   ├── performance/         # 性能分析页面
│   │   ├── http-error/          # HTTP 错误页面
│   │   ├── js-error/            # JS 错误页面
│   │   ├── top-analyse/         # Top 分析页面
│   │   ├── geographical-distribution/ # 地域分布页面
│   │   ├── layout.tsx           # 根布局
│   │   ├── page.tsx             # 首页
│   │   └── globals.css          # 全局样式
│   ├── components/         # React 组件
│   │   ├── MainLayout.tsx  # 主布局
│   │   ├── AppItem.tsx     # 应用卡片
│   │   └── ChinaMap.tsx    # 中国地图
│   ├── lib/                # 工具库
│   │   ├── auth.ts         # 认证工具
│   │   ├── prisma.ts       # Prisma 客户端
│   │   ├── redis.ts        # Redis 客户端
│   │   ├── elasticsearch.ts # Elasticsearch 客户端
│   │   ├── ip.ts           # IP 解析
│   │   ├── request.ts      # 请求工具
│   │   └── init.ts         # 初始化脚本
│   ├── services/           # 业务服务
│   │   ├── cache.ts        # 缓存服务
│   │   └── monitor-query.ts # 监控数据查询
│   └── types/              # TypeScript 类型
│       └── report.ts       # 上报数据类型
├── .env.local              # 环境变量（需创建）
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖
├── tsconfig.json           # TypeScript 配置
└── tailwind.config.ts      # TailwindCSS 配置
```

## 相关文档

- 📦 [部署指南](./DEPLOYMENT.md) - 生产环境部署文档
- 🔌 [SDK 集成](./SDK_INTEGRATION.md) - SDK 接入指南
- 📡 [API 文档](./API.md) - 后端 API 接口文档
- 💻 [开发指南](./DEVELOPMENT.md) - 开发规范和最佳实践

## 常见问题

### Q1: 如何重置数据库？

```bash
pnpm prisma db push --force-reset
```

### Q2: 如何查看 Elasticsearch 数据？

```bash
# 查看所有索引
curl http://localhost:9200/_cat/indices

# 查看监控数据
curl http://localhost:9200/frontend-monitor/_search?pretty
```

### Q3: 如何清空 Redis 缓存？

```bash
redis-cli FLUSHALL
```

### Q4: 端口被占用怎么办？

修改 `.env.local` 中的 `PORT` 环境变量，或在启动时指定：

```bash
PORT=3001 pnpm dev
```

## 许可证

MIT License

## 联系方式

- 问题反馈：[GitHub Issues](https://github.com/your-repo/issues)
- 项目地址：[GitHub Repository](https://github.com/your-repo)
