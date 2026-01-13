# Frontend Watch Dog 部署文档

> 本文档适用于已完成代码修复的版本（包含 workspace 配置、依赖修复等）

---

## 📋 环境要求

### 必需环境
- **Node.js**: >= 18.0.0（推荐 20.x LTS）
- **pnpm**: >= 8.0.0
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **操作系统**: Linux / macOS / Windows WSL2

### 端口要求
确保以下端口未被占用：
- `3306` - MySQL
- `6379` - Redis
- `7001` - 后端服务
- `8080/8081` - 前端服务（开发）
- `9200` - Elasticsearch
- `5601` - Kibana

---

## 🚀 快速部署（开发环境）

### 1. 克隆代码

```bash
git clone <your-repository-url>
cd frontend-watch-dog
```

### 2. 安装依赖

```bash
# 安装所有项目依赖
pnpm install
```

**重要**: 由于 pnpm 默认跳过构建脚本，需要手动构建 bcrypt：

```bash
cd node_modules/.pnpm/bcrypt@5.1.1*/node_modules/bcrypt
npx node-pre-gyp install --fallback-to-build
cd ../../../../..
```

### 3. 启动 Docker 基础服务

```bash
cd service

# 设置环境变量（根据实际情况修改）
export hostIP='localhost'  # 本地开发使用 localhost
# 或者：export hostIP='192.168.x.x'  # 实际 IP 地址

# 启动 Docker 服务（MySQL、Redis、Elasticsearch、Kibana）
docker-compose up -d

# 验证服务状态
docker ps

cd ..
```

### 4. 启动后端服务

```bash
cd service
pnpm dev
```

服务启动成功后，会监听在 **7001** 端口。

### 5. 启动前端服务（新终端）

打开新的终端窗口：

```bash
cd desktop
pnpm dev
```

服务启动成功后，会监听在 **8080** 或 **8081** 端口。

### 6. 访问应用

打开浏览器访问：http://localhost:8080

**首次使用**：
1. 点击"注册"按钮
2. 输入账号和密码（6-10位，仅数字和字母）
3. 注册后登录系统

---

## 🏭 生产环境部署

### 方式一：使用 PM2 管理进程（推荐）

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 准备部署

```bash
# 克隆代码
git clone <your-repository-url>
cd frontend-watch-dog

# 安装依赖
pnpm install

# 构建 bcrypt（必须）
cd node_modules/.pnpm/bcrypt@5.1.1*/node_modules/bcrypt
npx node-pre-gyp install --fallback-to-build
cd ../../../../..

# 启动 Docker 服务
cd service
export hostIP='<服务器IP>'
docker-compose up -d
cd ..

# 构建前端
cd desktop
pnpm build
cd ..
```

#### 3. 创建 PM2 配置文件

在项目根目录创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'frontend-watch-dog-api',
      script: 'node_modules/.bin/egg-scripts',
      args: 'start --daemon --title=egg-server-blubiu',
      cwd: './service',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

#### 4. 启动服务

```bash
# 启动后端
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs frontend-watch-dog-api
```

#### 5. 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/frontend-watch-dog`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改为实际域名

    # 前端静态文件
    location / {
        root /path/to/frontend-watch-dog/desktop/dist;  # 修改为实际路径
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 上报接口代理
    location /report {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # 日志
    access_log /var/log/nginx/frontend-watch-dog-access.log;
    error_log /var/log/nginx/frontend-watch-dog-error.log;
}
```

#### 6. 启用 Nginx 配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/frontend-watch-dog /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 7. 配置 SSL（可选但推荐）

```bash
# 使用 certbot 获取 Let's Encrypt 证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### 方式二：Docker 完整部署

#### 1. 创建 Dockerfile（后端）

在 `service/Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --production

COPY . .

EXPOSE 7001

CMD ["pnpm", "start"]
```

#### 2. 创建 Dockerfile（前端）

在 `desktop/Dockerfile`：

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

#### 3. 创建 docker-compose.prod.yml

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:5.7
    environment:
      - "MYSQL_ROOT_PASSWORD=your_secure_password"
      - "MYSQL_DATABASE=database_development"
      - "TZ=Asia/Shanghai"
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    ports:
      - 3306:3306
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always

  redis:
    image: redis:3.2
    ports:
      - 6379:6379
    restart: always

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
    ports:
      - 9200:9200
    volumes:
      - es_data:/usr/share/elasticsearch/data
    restart: always

  backend:
    build: ./service
    ports:
      - 7001:7001
    depends_on:
      - mysql
      - redis
      - elasticsearch
    restart: always

  frontend:
    build: ./desktop
    ports:
      - 80:80
    depends_on:
      - backend
    restart: always

volumes:
  mysql_data:
  es_data:
```

#### 4. 启动完整服务

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 常用命令

### 服务管理

```bash
# 查看所有服务状态
pm2 status
docker ps

# 重启后端服务
pm2 restart frontend-watch-dog-api

# 查看日志
pm2 logs frontend-watch-dog-api
docker logs service-mysql-1

# 停止服务
pm2 stop frontend-watch-dog-api
docker-compose down
```

### 数据库管理

```bash
# 连接 MySQL
docker exec -it service-mysql-1 mysql -uroot -p123456

# 备份数据库
docker exec service-mysql-1 mysqldump -uroot -p123456 database_development > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i service-mysql-1 mysql -uroot -p123456 database_development < backup.sql
```

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖（如有更新）
pnpm install

# 重新构建前端
cd desktop && pnpm build && cd ..

# 重启服务
pm2 restart frontend-watch-dog-api
sudo systemctl reload nginx
```

---

## 🔧 故障排查

### 1. bcrypt 模块错误

**症状**: 
```
Cannot find module 'bcrypt/lib/binding/napi-v3/bcrypt_lib.node'
```

**解决**: 
```bash
cd node_modules/.pnpm/bcrypt@5.1.1*/node_modules/bcrypt
npx node-pre-gyp install --fallback-to-build
```

### 2. 端口被占用

**症状**: 
```
Error: listen EADDRINUSE: address already in use :::7001
```

**解决**: 
```bash
# 查找占用端口的进程
lsof -i :7001
# 或
netstat -tlnp | grep 7001

# 杀死进程
kill -9 <PID>
```

### 3. Docker 服务无法启动

**症状**: 容器频繁重启

**解决**: 
```bash
# 查看日志
docker logs service-mysql-1
docker logs service-redis-1

# 清理并重启
docker-compose down -v
docker-compose up -d
```

### 4. 前端无法连接后端

**检查项**:
1. 后端服务是否正常运行：`curl http://localhost:7001/api/desktop/getAppList`
2. Nginx 配置是否正确：`sudo nginx -t`
3. 防火墙是否开放端口：`sudo ufw status`

### 5. 数据库连接失败

**检查项**:
1. MySQL 容器是否运行：`docker ps | grep mysql`
2. 数据库配置是否正确：查看 `service/config/config.local.ts`
3. 测试连接：`docker exec -it service-mysql-1 mysql -uroot -p123456`

---

## 🔒 安全建议

### 生产环境必做项

1. **修改默认密码**
   ```bash
   # MySQL: 修改 docker-compose.yml 中的 MYSQL_ROOT_PASSWORD
   # Redis: 配置密码认证
   # JWT: 修改后端 JWT 密钥
   ```

2. **配置 HTTPS**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **配置防火墙**
   ```bash
   # 仅开放必要端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

4. **定期备份数据**
   ```bash
   # 添加到 crontab
   0 2 * * * docker exec service-mysql-1 mysqldump -uroot -pYOUR_PASSWORD database_development > /backup/db_$(date +\%Y\%m\%d).sql
   ```

5. **监控服务状态**
   - 使用 PM2 监控 Node.js 进程
   - 使用 Prometheus + Grafana 监控系统
   - 配置告警通知

---

## 📊 性能优化

### 1. Node.js 配置

```bash
# 设置环境变量
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. MySQL 优化

编辑 `docker-compose.yml`，添加 MySQL 配置：

```yaml
mysql:
  command: >
    --character-set-server=utf8mb4
    --collation-server=utf8mb4_unicode_ci
    --max_connections=1000
    --innodb_buffer_pool_size=1G
```

### 3. Nginx 优化

在 Nginx 配置中添加：

```nginx
# 连接优化
keepalive_timeout 65;
keepalive_requests 100;

# 缓冲区优化
client_body_buffer_size 128k;
client_max_body_size 50m;
```

### 4. Redis 优化

```bash
# 配置持久化
docker exec service-redis-1 redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

---

## 📈 监控方案

### 使用 PM2 监控

```bash
# 安装 PM2 Plus（可选）
pm2 link <secret_key> <public_key>

# 查看监控面板
pm2 monit
```

### 使用 Docker Stats

```bash
# 查看容器资源使用
docker stats
```

### 日志管理

```bash
# PM2 日志
pm2 logs --lines 100

# Docker 日志
docker logs -f service-mysql-1 --tail 100

# Nginx 日志
tail -f /var/log/nginx/frontend-watch-dog-access.log
tail -f /var/log/nginx/frontend-watch-dog-error.log
```

---

## 🆘 技术支持

### 获取帮助

- **GitHub Issues**: https://github.com/luoguoxiong/frontend-watch-dog/issues
- **文档**: 查看项目根目录的 README.md

### 常用链接

- [Egg.js 文档](https://www.eggjs.org/)
- [Docker 文档](https://docs.docker.com/)
- [PM2 文档](https://pm2.keymetrics.io/)
- [Nginx 文档](https://nginx.org/en/docs/)

---

## 📄 版本信息

- **Node.js**: 20.x LTS
- **MySQL**: 5.7
- **Redis**: 3.2
- **Elasticsearch**: 7.17.0
- **Kibana**: 7.17.0

---

## ✅ 部署检查清单

部署前确认：

- [ ] Node.js、pnpm、Docker 已安装
- [ ] 端口未被占用（3306, 6379, 7001, 8080, 9200, 5601）
- [ ] 已配置环境变量 `hostIP`
- [ ] 已构建 bcrypt 模块
- [ ] Docker 服务已启动
- [ ] 已创建数据库管理员账号
- [ ] 已配置 Nginx 反向代理
- [ ] 已配置 SSL 证书（生产环境）
- [ ] 已设置防火墙规则
- [ ] 已配置数据备份计划
- [ ] 已设置监控告警

---

**最后更新**: 2026-01-13
