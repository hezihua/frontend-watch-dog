# ✅ Admin 项目配置完成

## 📋 已完成配置

### 1. 环境变量 (`.env.local`)
```env
DATABASE_URL="mysql://root:123456@localhost:3306/database_development"
JWT_SECRET="dev-secret-key-change-in-production-2026"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
ELASTICSEARCH_NODE="http://localhost:9200"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

**说明**：
- ✅ 连接到现有 Docker MySQL 服务（端口 3306）
- ✅ 连接到现有 Docker Redis 服务（端口 6379）
- ✅ 连接到现有 Docker Elasticsearch 服务（端口 9200）
- ✅ 数据库已存在 1 个用户、2 个应用

### 2. 数据库配置
- ✅ Prisma Client 已生成
- ✅ 数据库 Schema 已同步
- ✅ `user` 和 `app` 表已就绪

### 3. 依赖安装
- ✅ 所有 npm 依赖已安装
- ✅ dotenv 已配置用于环境变量加载

---

## 🚀 启动项目

### 开发环境启动
```bash
cd /home/hezihua/workspace/frontend-watch-dog/admin
npm run dev
```

访问地址：**http://localhost:3000**

### 生产环境构建
```bash
# 构建
npm run build

# 启动生产服务器
npm run start
```

---

## 📝 重要说明

### Docker 服务依赖
在启动 `admin` 项目前，请确保以下 Docker 服务正在运行：

```bash
# 检查 Docker 服务状态
cd /home/hezihua/workspace/frontend-watch-dog
docker-compose ps

# 如果未启动，运行：
docker-compose up -d mysql redis elasticsearch
```

### 端口占用
- **3000**: Next.js 应用（admin）
- **3306**: MySQL（Docker）
- **6379**: Redis（Docker）
- **9200**: Elasticsearch（Docker）
- **7001**: 旧的 Egg.js 服务（service）
- **8000**: 旧的 React 应用（desktop）

---

## 🔄 与旧项目的关系

### 当前状态
- ✅ **admin** (Next.js): 新项目，使用相同的数据库和 Redis
- 🔄 **service** (Egg.js): 旧后端，端口 7001，暂时保留
- 🔄 **desktop** (React): 旧前端，端口 8000，暂时保留

### 数据共享
新的 `admin` 项目和旧的 `service` + `desktop` 共享：
- ✅ 同一个 MySQL 数据库
- ✅ 同一个 Redis 实例
- ✅ 同一个 Elasticsearch 实例

所以你在旧系统中创建的用户和应用，在新系统中也能看到！

### 迁移计划
1. **当前阶段**：新旧系统并存，共享数据
2. **下一步**：逐步将功能迁移到 admin 项目
3. **最终**：移除 `service` 和 `desktop` 目录

---

## 🧪 快速测试

### 1. 启动 admin 项目
```bash
cd /home/hezihua/workspace/frontend-watch-dog/admin
npm run dev
```

### 2. 访问页面
打开浏览器：http://localhost:3000

### 3. 测试登录
使用你在旧系统中创建的账号登录，应该能正常工作！

---

## 📚 技术栈

- **框架**: Next.js 16 + React 19
- **UI 库**: Ant Design 5
- **状态管理**: Zustand + TanStack Query
- **数据库**: Prisma + MySQL
- **缓存**: ioredis
- **搜索**: Elasticsearch
- **认证**: NextAuth + JWT
- **代码规范**: Biome
- **样式**: Tailwind CSS 4

---

## 💡 下一步建议

1. **启动并测试** `admin` 项目
2. **验证数据访问**：确认能看到现有的用户和应用
3. **开始开发**：在 `admin` 中实现新功能
4. **逐步迁移**：将 `service` 和 `desktop` 的功能迁移到 `admin`
5. **最终清理**：当功能完全迁移后，删除旧代码

---

## 🐛 故障排查

### 数据库连接失败
```bash
# 检查 MySQL 是否运行
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql
```

### Redis 连接失败
```bash
# 检查 Redis 是否运行
docker-compose ps redis

# 测试 Redis 连接
docker exec -it frontend-watch-dog-redis-1 redis-cli ping
```

### Elasticsearch 连接失败
```bash
# 检查 ES 是否运行
docker-compose ps elasticsearch

# 测试 ES 连接
curl http://localhost:9200
```

---

🎉 **配置完成！现在可以启动项目了！**
