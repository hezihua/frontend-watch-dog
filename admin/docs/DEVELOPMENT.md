# 开发指南

## 📖 目录

- [技术栈详解](#技术栈详解)
- [项目架构](#项目架构)
- [开发规范](#开发规范)
- [常用命令](#常用命令)
- [调试技巧](#调试技巧)
- [最佳实践](#最佳实践)

---

## 技术栈详解

### Next.js 15

#### App Router

本项目使用 Next.js 15 的 **App Router**（而非 Pages Router）：

```
app/
├── (auth)/           # 路由组（不影响 URL）
│   └── login/       # /login
├── api/             # API Routes
│   └── apps/        # /api/apps
├── visitor-stats/   # /visitor-stats
├── layout.tsx       # 根布局
└── page.tsx         # / 首页
```

#### 服务端组件 vs 客户端组件

- **服务端组件（默认）**：直接访问数据库、性能更好
- **客户端组件**：需要交互、状态管理，使用 `'use client'`

```tsx
// 服务端组件
export default async function ServerComponent() {
  const data = await prisma.app.findMany(); // 直接查询数据库
  return <div>{JSON.stringify(data)}</div>;
}

// 客户端组件
'use client';
export default function ClientComponent() {
  const [count, setCount] = useState(0); // 使用 React Hooks
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

### Prisma ORM

#### 数据库操作

```typescript
import prisma from '@/lib/prisma';

// 查询
const apps = await prisma.app.findMany({
  where: { createId: userId },
  orderBy: { id: 'desc' },
});

// 创建
const app = await prisma.app.create({
  data: {
    appId: 'abc123',
    appName: '我的应用',
    appType: 1,
    createId: userId,
  },
});

// 更新
await prisma.app.update({
  where: { appId },
  data: { status: 0 },
});

// 删除
await prisma.app.delete({
  where: { id: 1 },
});
```

#### Schema 更新流程

```bash
# 1. 修改 prisma/schema.prisma

# 2. 生成 Prisma Client
pnpm prisma generate

# 3. 同步到数据库
pnpm prisma db push

# 或使用 migration（推荐生产环境）
pnpm prisma migrate dev --name add_team_models
```

---

### Elasticsearch

#### 查询示例

```typescript
import { elasticsearch, MONITOR_INDEX } from '@/lib/elasticsearch';

// 基础查询
const result = await elasticsearch.search({
  index: MONITOR_INDEX,
  body: {
    size: 10,
    query: {
      bool: {
        must: [
          { term: { appId } },
          { range: { userTimeStamp: { gte: startTime, lte: endTime } } },
        ],
      },
    },
  },
});

// 聚合查询
const aggResult = await elasticsearch.search({
  index: MONITOR_INDEX,
  body: {
    size: 0,
    query: { term: { appId } },
    aggs: {
      avg_fcp: { avg: { field: 'fcp' } },
      top_pages: {
        terms: { field: 'pageUrl.keyword', size: 10 },
      },
    },
  },
});

const avgFcp = aggResult.body.aggregations.avg_fcp.value;
const topPages = aggResult.body.aggregations.top_pages.buckets;
```

#### 注意事项

- Elasticsearch 7.x 返回数据在 `result.body` 中
- 聚合字段需要使用 `.keyword` 后缀（如 `pageUrl.keyword`）
- 时间戳必须是毫秒级数字，不能是 ISO 字符串

---

### Redis 缓存

#### 缓存封装

```typescript
import { withCache, invalidateCache } from '@/services/cache';

// 使用缓存
export async function GET(request: NextRequest) {
  const cacheKey = `app_list_${userId}`;
  
  return withCache(cacheKey, async () => {
    const apps = await prisma.app.findMany();
    return NextResponse.json({ code: 1000, data: apps });
  }, 300); // 缓存 5 分钟
}

// 失效缓存
await invalidateCache(`app_list_${userId}`);
```

---

## 项目架构

### 分层架构

```
┌─────────────────────────────────┐
│         前端组件层 (UI)         │
│  MainLayout, AppItem, ChinaMap  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│       API Routes (后端)         │
│  /api/apps, /api/performance    │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│        服务层 (Services)        │
│  monitor-query, cache           │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│       数据层 (Data Layer)       │
│  Prisma, Elasticsearch, Redis   │
└─────────────────────────────────┘
```

### 文件命名规范

- **页面组件**: `page.tsx` (Next.js 约定)
- **布局组件**: `layout.tsx` (Next.js 约定)
- **API 路由**: `route.ts` (Next.js 约定)
- **React 组件**: `PascalCase.tsx` (如 `MainLayout.tsx`)
- **工具函数**: `camelCase.ts` (如 `request.ts`)
- **类型定义**: `*.d.ts` 或 `*.ts`

---

## 开发规范

### 代码风格

#### TypeScript

```typescript
// ✅ 推荐：使用接口定义
interface AppInfo {
  id: number;
  appId: string;
  appName: string;
}

// ✅ 推荐：使用类型推导
const apps: AppInfo[] = await fetchApps();

// ❌ 避免：使用 any
const data: any = await fetchData(); // 不推荐
```

#### React 组件

```tsx
// ✅ 推荐：函数式组件 + Hooks
export default function MyComponent({ title }: { title: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // 副作用逻辑
  }, []);
  
  return <div>{title}: {count}</div>;
}

// ❌ 避免：类组件
class MyComponent extends React.Component { ... }
```

#### API 响应格式

```typescript
// ✅ 统一响应格式
return NextResponse.json({
  code: 1000,
  message: '成功',
  data: result,
});

// ❌ 不规范
return NextResponse.json(result);
```

---

### Git 提交规范

使用 **Conventional Commits** 规范：

```bash
# 格式
<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
perf:     性能优化
test:     测试
chore:    构建/工具配置

# 示例
feat(auth): 添加用户登录功能
fix(api): 修复性能数据查询错误
docs: 更新 API 文档
style: 统一代码格式
```

---

## 常用命令

### 开发相关

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 数据库相关

```bash
# 生成 Prisma Client
pnpm prisma generate

# 同步数据库 Schema
pnpm prisma db push

# 重置数据库
pnpm prisma db push --force-reset

# 打开 Prisma Studio（数据库可视化工具）
pnpm prisma studio

# 创建 migration
pnpm prisma migrate dev --name migration_name
```

### Docker 相关

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启某个服务
docker-compose restart mysql
```

---

## 调试技巧

### 1. 后端 API 调试

```typescript
// 在 API Route 中添加调试日志
export async function GET(request: NextRequest) {
  console.log('📊 请求参数:', request.nextUrl.searchParams.toString());
  
  const result = await queryData();
  console.log('📊 查询结果:', result);
  
  return NextResponse.json({ code: 1000, data: result });
}
```

### 2. Elasticsearch 查询调试

```typescript
// 打印完整查询语句
console.log('🔍 ES Query:', JSON.stringify(query, null, 2));

// 打印响应结果
console.log('🔍 ES Response:', JSON.stringify(result.body, null, 2));
```

### 3. 前端调试

```tsx
'use client';

export default function MyComponent() {
  useEffect(() => {
    console.log('🎨 组件挂载');
    return () => console.log('🎨 组件卸载');
  }, []);
  
  // 使用 React DevTools 查看组件树和状态
  return <div>...</div>;
}
```

### 4. 网络请求调试

```typescript
// 使用 request.ts 工具自动处理 401
import { get, post } from '@/lib/request';

const data = await get('/api/apps'); // 自动重定向到登录页
```

---

## 最佳实践

### 1. 错误处理

```typescript
// API Route
export async function GET(request: NextRequest) {
  try {
    const data = await queryData();
    return NextResponse.json({ code: 1000, data });
  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json(
      { code: 1001, message: '查询失败' },
      { status: 500 }
    );
  }
}
```

### 2. 环境变量

```typescript
// ✅ 使用环境变量
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ 硬编码
const apiUrl = 'http://localhost:3000';
```

### 3. 性能优化

```tsx
// ✅ 使用 React.memo 避免不必要的重渲染
const AppItem = React.memo(({ appInfo }: { appInfo: AppInfo }) => {
  return <div>{appInfo.appName}</div>;
});

// ✅ 使用 useMemo 缓存计算结果
const sortedApps = useMemo(() => {
  return apps.sort((a, b) => b.id - a.id);
}, [apps]);

// ✅ 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### 4. 安全性

```typescript
// ✅ 验证用户权限
const userId = getUserIdFromRequest(request);
if (!userId) {
  return NextResponse.json(
    { code: 1005, message: '未登录' },
    { status: 401 }
  );
}

// ✅ 过滤敏感数据
const user = await prisma.user.findUnique({ where: { id: userId } });
const { encPassword, ...safeUser } = user; // 不返回密码
return NextResponse.json({ code: 1000, data: safeUser });
```

---

## 常见问题

### Q1: 修改了代码但页面没更新？

```bash
# 清除 Next.js 缓存
rm -rf .next
pnpm dev
```

### Q2: Prisma Client 找不到？

```bash
pnpm prisma generate
```

### Q3: Elasticsearch 连接失败？

```bash
# 检查 Elasticsearch 是否运行
curl http://localhost:9200

# 检查环境变量
cat .env.local | grep ELASTICSEARCH
```

### Q4: 数据库连接失败？

```bash
# 检查 MySQL 是否运行
docker ps | grep mysql

# 测试连接
pnpm prisma db pull
```

---

## 性能监控

### 开发环境监控

```typescript
// 使用 console.time 测量性能
console.time('查询耗时');
const data = await queryData();
console.timeEnd('查询耗时');
```

### 生产环境监控

建议集成：
- **Sentry** - 错误追踪
- **New Relic** - 性能监控
- **LogRocket** - 会话回放

---

## 🔗 相关资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [Prisma 官方文档](https://www.prisma.io/docs)
- [Elasticsearch 官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Ant Design 官方文档](https://ant.design/components/overview-cn/)
- [ECharts 官方文档](https://echarts.apache.org/handbook/zh/get-started/)

---

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

---

## 📞 获取帮助

- 📖 查看[API 文档](./API.md)
- 🚀 查看[部署文档](./DEPLOYMENT.md)
- 💬 提交 [GitHub Issue](https://github.com/your-repo/issues)
