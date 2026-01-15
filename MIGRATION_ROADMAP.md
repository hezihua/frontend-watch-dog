# 完整迁移路线图

## 🎯 目标

最终只保留 **Next.js 全栈项目**，完全移除 `service` 和 `desktop`。

## 📅 迁移策略

### 阶段 1: 并行开发（1-2周）

**目标**: Next.js 项目和原项目同时运行

#### 1.1 数据库策略

**推荐**: 共用数据库，方便数据对比和验证

```env
# admin/.env.local
DATABASE_URL="mysql://root:123456@localhost:3306/database_development"
```

**优势**:
- ✅ 实时数据同步
- ✅ 方便对比功能
- ✅ 无需数据迁移
- ✅ 可以逐个功能切换

**目录结构**:
```
frontend-watch-dog/
├── service/          # 现有后端（暂时保留）
├── desktop/          # 现有前端（暂时保留）
├── admin/            # Next.js 新项目（开发中）
├── packages/         # SDK（共用）
└── docker-compose.yml # 共用的 Docker 服务
```

#### 1.2 端口规划

```
service (Egg.js):   http://localhost:7001  ← 暂时保留
desktop (React):    http://localhost:8080  ← 暂时保留
admin (Next.js):    http://localhost:3000  ← 新项目
```

#### 1.3 开发流程

```bash
# 终端 1: 原有服务（参考对比用）
cd service && pnpm dev

# 终端 2: 原有前端（参考对比用）
cd desktop && pnpm dev

# 终端 3: Next.js 新项目（主要开发）
cd admin && pnpm dev
```

---

### 阶段 2: 功能迁移（2-3周）

**逐个迁移功能，边开发边测试**

#### Week 1: 核心功能
- [x] 用户认证（登录/注册）
- [x] 应用管理（CRUD）
- [x] 数据上报接口
- [ ] 测试：创建应用，集成 SDK，验证数据上报

#### Week 2: 监控功能
- [ ] 流量分析
- [ ] 性能分析
- [ ] 接口分析
- [ ] 测试：对比两个系统的数据展示

#### Week 3: 高级功能
- [ ] JS 错误监控
- [ ] Top 分析
- [ ] 地域分布
- [ ] SourceMap 上传
- [ ] 测试：完整功能测试

---

### 阶段 3: 灰度切换（1周）

**逐步将流量切换到 Next.js**

#### 3.1 内部测试

```bash
# 使用 Next.js 版本
http://localhost:3000

# 对比原版本
http://localhost:8080
```

**验证清单**:
- [ ] 所有页面正常访问
- [ ] 数据展示一致
- [ ] 性能指标正常
- [ ] 错误率低于 0.1%

#### 3.2 小流量测试

**方案**: 使用 Nginx 分流

```nginx
# nginx.conf
upstream backend {
    server localhost:7001 weight=9;  # 90% 流量到旧版本
    server localhost:3000 weight=1;  # 10% 流量到新版本
}
```

#### 3.3 全量切换

```nginx
# nginx.conf
upstream backend {
    server localhost:3000;  # 100% 流量到 Next.js
}
```

---

### 阶段 4: 数据库独立（可选）

**如果需要完全独立，创建新数据库**

#### 4.1 创建新数据库

```bash
# 创建数据库
docker exec -it service-mysql-1 mysql -uroot -p123456 << EOF
CREATE DATABASE frontend_watch_dog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
```

#### 4.2 迁移数据

```bash
# 备份现有数据
docker exec service-mysql-1 mysqldump -uroot -p123456 database_development > backup.sql

# 导入到新数据库
docker exec -i service-mysql-1 mysql -uroot -p123456 frontend_watch_dog < backup.sql
```

#### 4.3 更新配置

```env
# admin/.env.local
DATABASE_URL="mysql://root:123456@localhost:3306/frontend_watch_dog"
```

---

### 阶段 5: 清理旧代码（1天）

**确认 Next.js 稳定运行后，移除旧项目**

#### 5.1 停止旧服务

```bash
# 停止 Egg.js 服务
cd service && pnpm stop

# 前端不需要停止，直接不访问即可
```

#### 5.2 备份旧代码

```bash
# 创建备份分支
git checkout -b backup/old-architecture
git add .
git commit -m "备份: 旧架构代码（Egg.js + React）"
git push origin backup/old-architecture

# 回到主分支
git checkout main
```

#### 5.3 移除目录

```bash
# 移动到 archive 目录（而不是直接删除）
mkdir -p archive
mv service archive/
mv desktop archive/

# 或者直接删除（确认无误后）
# rm -rf service desktop
```

#### 5.4 更新项目结构

```bash
frontend-watch-dog/
├── admin/              # Next.js 主项目（重命名为根目录）
├── packages/           # SDK
├── archive/            # 旧代码备份
│   ├── service/
│   └── desktop/
└── docker-compose.yml  # Docker 服务
```

#### 5.5 重命名项目（可选）

```bash
# 将 admin 目录提升为主项目
mv admin/* .
mv admin/.* . 2>/dev/null
rmdir admin

# 最终结构
frontend-watch-dog/
├── src/                # Next.js 源码
├── prisma/             # 数据库
├── public/             # 静态资源
├── packages/           # SDK
├── .env.local
├── package.json
└── docker-compose.yml
```

---

## 📋 完整配置建议

### 现阶段配置（阶段 1-3）

```env
# admin/.env.local

# 共用数据库（方便迁移和对比）
DATABASE_URL="mysql://root:123456@localhost:3306/database_development"

# JWT 密钥
JWT_SECRET="dev-secret-key-change-in-production"

# 共用 Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# 共用 Elasticsearch
ELASTICSEARCH_NODE="http://localhost:9200"

# Next.js API
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 独立后配置（阶段 4-5）

```env
# .env.local（已经是根目录）

# 独立数据库
DATABASE_URL="mysql://root:123456@localhost:3306/frontend_watch_dog"

# JWT 密钥（生产环境记得改）
JWT_SECRET="production-secret-key-generated-by-openssl"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Elasticsearch
ELASTICSEARCH_NODE="http://localhost:9200"

# API
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

---

## 🎯 关键检查点

### ✅ 阶段 1 完成标志
- [ ] Next.js 项目成功运行
- [ ] 能连接到所有数据库中间件
- [ ] 完成基础认证功能

### ✅ 阶段 2 完成标志
- [ ] 所有核心功能已迁移
- [ ] 功能测试通过
- [ ] 数据展示一致

### ✅ 阶段 3 完成标志
- [ ] 灰度测试完成
- [ ] 性能指标达标
- [ ] 错误率可控

### ✅ 阶段 4 完成标志（可选）
- [ ] 数据成功迁移
- [ ] 新数据库运行稳定

### ✅ 阶段 5 完成标志
- [ ] 旧代码已备份
- [ ] 旧服务已停止
- [ ] 项目结构清理完毕

---

## 🚀 当前行动指南

### 立即执行（现在）

```bash
# 1. 配置 .env.local（共用数据库）
cd admin
cat > .env.local << 'EOF'
DATABASE_URL="mysql://root:123456@localhost:3306/database_development"
JWT_SECRET="dev-secret-key"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
ELASTICSEARCH_NODE="http://localhost:9200"
NEXT_PUBLIC_API_URL="http://localhost:3000"
EOF

# 2. 初始化数据库
npx prisma db push

# 3. 启动开发
pnpm dev
```

### 短期目标（本周）

- [ ] 完成 Next.js 基础搭建
- [ ] 实现登录/注册功能
- [ ] 实现应用管理
- [ ] 测试数据上报

### 中期目标（2-3周）

- [ ] 完成所有功能迁移
- [ ] 功能对比测试
- [ ] 性能优化

### 长期目标（1个月后）

- [ ] 灰度切换
- [ ] 全量上线
- [ ] 移除旧代码

---

## 💡 建议

1. **不要急于删除旧代码** - 保留 1-2 个月作为备份
2. **逐步迁移** - 不要一次性全部重写
3. **持续对比** - 确保新旧功能一致
4. **做好备份** - 定期备份数据库
5. **写好文档** - 记录迁移过程中的问题和解决方案

---

## 📞 需要帮助？

迁移过程中遇到问题，可以参考：
- `NEXTJS_MIGRATION.md` - 技术实现细节
- `NEXTJS_README.md` - 完整使用指南
- `ENV_CONFIG_GUIDE.md` - 环境配置说明

---

**现在开始第一步：配置 .env.local 并启动 Next.js 项目！** 🚀
