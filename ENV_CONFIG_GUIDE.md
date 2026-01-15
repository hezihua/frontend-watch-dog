# 环境变量配置指南

## 📋 配置文件位置

运行 `./init-nextjs.sh` 后，会在项目根目录 `admin/.env.local` 自动创建配置文件。

## 🔧 完整配置说明

### 1. 数据库配置 (DATABASE_URL)

**格式**: `mysql://用户名:密码@主机:端口/数据库名`

#### 选项 A: 使用现有数据库

```env
# 复用原项目的数据库
DATABASE_URL="mysql://root:123456@localhost:3306/database_development"
```

#### 选项 B: 创建新数据库（推荐）

```bash
# 1. 先创建数据库
mysql -u root -p
CREATE DATABASE frontend_watch_dog_nextjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# 2. 配置 .env.local
DATABASE_URL="mysql://root:123456@localhost:3306/frontend_watch_dog_nextjs"
```

#### 常见配置示例

```env
# 本地开发
DATABASE_URL="mysql://root:123456@localhost:3306/frontend_watch_dog_nextjs"

# 使用不同端口
DATABASE_URL="mysql://root:password@localhost:3307/frontend_watch_dog_nextjs"

# 连接远程数据库
DATABASE_URL="mysql://admin:secretpass@192.168.1.100:3306/frontend_watch_dog_nextjs"

# Docker 容器内
DATABASE_URL="mysql://root:123456@mysql:3306/frontend_watch_dog_nextjs"
```

---

### 2. JWT 密钥配置 (JWT_SECRET)

**重要**: 生产环境必须修改！

#### 生成安全的密钥

```bash
# 方法 1: 使用 openssl
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 3: 在线生成
# https://generate-random.org/api-token-generator
```

#### 配置示例

```env
# ❌ 不安全（默认值，仅用于开发）
JWT_SECRET="your-secret-key-change-this"

# ✅ 安全（生产环境）
JWT_SECRET="8fK9mN2pQ5rT7wX0zA3bC6eF9hJ2kM5nP8qS1tV4wY7z"
```

---

### 3. Redis 配置

#### 本地 Redis

```env
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

#### 带密码的 Redis

```env
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"
```

#### 远程 Redis

```env
REDIS_HOST="192.168.1.100"
REDIS_PORT="6379"
REDIS_PASSWORD="redis-password"
```

#### Docker Redis

```env
REDIS_HOST="redis"  # Docker Compose 服务名
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

#### Redis Cloud / 云服务

```env
REDIS_HOST="redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com"
REDIS_PORT="12345"
REDIS_PASSWORD="your-cloud-redis-password"
```

---

### 4. Elasticsearch 配置

#### 本地 Elasticsearch

```env
ELASTICSEARCH_NODE="http://localhost:9200"
```

#### 带认证的 ES

```env
ELASTICSEARCH_NODE="http://elastic:password@localhost:9200"
```

#### Docker ES

```env
ELASTICSEARCH_NODE="http://elasticsearch:9200"
```

#### 云 ES (Elastic Cloud)

```env
ELASTICSEARCH_NODE="https://my-cluster.es.us-east-1.aws.found.io:9243"
```

---

### 5. Next.js 配置

#### 开发环境

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

#### 生产环境

```env
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

---

## 📝 完整配置示例

### 开发环境 (.env.local)

```env
# ============================================
# 数据库配置
# ============================================
DATABASE_URL="mysql://root:123456@localhost:3306/frontend_watch_dog_nextjs"

# ============================================
# JWT 密钥（生产环境务必修改！）
# ============================================
JWT_SECRET="dev-secret-key-only-for-development"

# ============================================
# Redis 配置
# ============================================
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# ============================================
# Elasticsearch 配置
# ============================================
ELASTICSEARCH_NODE="http://localhost:9200"

# ============================================
# Next.js 配置
# ============================================
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 生产环境 (.env.production)

```env
# ============================================
# 数据库配置
# ============================================
DATABASE_URL="mysql://dbuser:StrongPassword123!@prod-db-server:3306/frontend_watch_dog_prod"

# ============================================
# JWT 密钥
# ============================================
JWT_SECRET="8fK9mN2pQ5rT7wX0zA3bC6eF9hJ2kM5nP8qS1tV4wY7zAbCdEfGh"

# ============================================
# Redis 配置
# ============================================
REDIS_HOST="prod-redis-server.internal"
REDIS_PORT="6379"
REDIS_PASSWORD="RedisStrongPassword456!"

# ============================================
# Elasticsearch 配置
# ============================================
ELASTICSEARCH_NODE="http://elastic:ElasticPassword789!@prod-es-server:9200"

# ============================================
# Next.js 配置
# ============================================
NEXT_PUBLIC_API_URL="https://monitor.your-domain.com"
```

### Docker Compose 环境 (.env.docker)

```env
# ============================================
# 数据库配置（使用 Docker 服务名）
# ============================================
DATABASE_URL="mysql://root:123456@mysql:3306/frontend_watch_dog"

# ============================================
# JWT 密钥
# ============================================
JWT_SECRET="docker-environment-secret-key"

# ============================================
# Redis 配置（使用 Docker 服务名）
# ============================================
REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# ============================================
# Elasticsearch 配置（使用 Docker 服务名）
# ============================================
ELASTICSEARCH_NODE="http://elasticsearch:9200"

# ============================================
# Next.js 配置
# ============================================
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## 🚀 快速配置步骤

### 步骤 1: 进入项目目录

```bash
cd admin
```

### 步骤 2: 编辑配置文件

```bash
# 使用你喜欢的编辑器
nano .env.local
# 或
vim .env.local
# 或
code .env.local
```

### 步骤 3: 修改配置

复制以下内容并根据实际情况修改：

```env
# 修改数据库密码和数据库名
DATABASE_URL="mysql://root:你的MySQL密码@localhost:3306/frontend_watch_dog_nextjs"

# 生成并填入新的 JWT 密钥
JWT_SECRET="运行 openssl rand -base64 32 生成的密钥"

# 如果 Redis 有密码，填入密码
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Elasticsearch 配置
ELASTICSEARCH_NODE="http://localhost:9200"

# API 地址
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 步骤 4: 保存并验证

```bash
# 保存文件后，验证配置
cat .env.local

# 测试数据库连接
npx prisma db pull
```

---

## ✅ 配置检查清单

使用前请确认：

- [ ] 数据库 URL 正确（用户名、密码、端口、数据库名）
- [ ] JWT_SECRET 已修改（生产环境）
- [ ] Redis 连接信息正确
- [ ] Elasticsearch 地址正确
- [ ] 所有服务都在运行（MySQL、Redis、ES）

---

## 🔍 验证配置

### 1. 验证数据库连接

```bash
cd admin
npx prisma db pull
```

**成功输出**:
```
✔ Introspected 2 models and wrote them into prisma/schema.prisma
```

**失败输出**:
```
Error: P1001: Can't reach database server
```

### 2. 验证 Redis 连接

```bash
# 测试 Redis 连接
redis-cli -h localhost -p 6379 ping
```

**成功输出**:
```
PONG
```

### 3. 验证 Elasticsearch

```bash
curl http://localhost:9200
```

**成功输出**:
```json
{
  "name" : "...",
  "cluster_name" : "...",
  "version" : { ... }
}
```

---

## ⚠️ 常见错误

### 错误 1: 数据库连接失败

```
Error: P1001: Can't reach database server at localhost:3306
```

**解决方案**:
1. 确认 MySQL 正在运行：`docker ps | grep mysql`
2. 检查端口是否正确：`ss -tlnp | grep 3306`
3. 验证用户名和密码
4. 确认数据库已创建

### 错误 2: JWT_SECRET 未设置

```
Error: JWT_SECRET is not defined
```

**解决方案**:
确保 `.env.local` 文件中有 `JWT_SECRET="xxx"`

### 错误 3: Redis 连接失败

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**解决方案**:
1. 确认 Redis 正在运行：`docker ps | grep redis`
2. 测试连接：`redis-cli ping`

---

## 🔐 安全建议

### 开发环境
- ✅ 使用简单密码方便开发
- ✅ 可以使用默认配置
- ⚠️ 不要提交 `.env.local` 到 Git

### 生产环境
- ❌ 不要使用默认密钥
- ✅ 使用强密码（16+ 字符）
- ✅ 使用环境变量注入
- ✅ 定期轮换密钥
- ✅ 使用密钥管理服务（如 AWS Secrets Manager）

---

## 📚 更多配置选项

如需添加其他环境变量：

```env
# 日志级别
LOG_LEVEL="info"

# 允许的域名（CORS）
ALLOWED_ORIGINS="http://localhost:3000,https://your-domain.com"

# 上传文件大小限制
MAX_UPLOAD_SIZE="50mb"

# Session 过期时间（秒）
SESSION_EXPIRY="604800"  # 7天
```

---

需要帮助？查看配置是否正确，可以运行：

```bash
cd admin
pnpm dev
```

如果能正常启动，说明配置正确！🎉
