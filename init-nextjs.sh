#!/bin/bash

echo "🚀 开始创建 Next.js 版本的 Frontend Watch Dog"
echo "================================================"

# 颜色定义
GREEN='\033[0.32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="admin"

# 1. 创建 Next.js 项目
echo -e "${BLUE}📦 步骤 1/8: 创建 Next.js 项目...${NC}"
npx create-next-app@latest $PROJECT_NAME \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

cd $PROJECT_NAME

# 2. 安装依赖
echo -e "${BLUE}📦 步骤 2/8: 安装依赖包...${NC}"
pnpm install @prisma/client prisma \
  next-auth bcryptjs jsonwebtoken jose \
  ioredis \
  @elastic/elasticsearch \
  antd @ant-design/icons \
  zustand \
  @tanstack/react-query \
  dayjs \
  axios \
  web-vitals

# 开发依赖
pnpm install -D @types/bcryptjs @types/jsonwebtoken

# 3. 初始化 Prisma
echo -e "${BLUE}📦 步骤 3/8: 初始化 Prisma...${NC}"
npx prisma init

# 4. 创建目录结构
echo -e "${BLUE}📦 步骤 4/8: 创建目录结构...${NC}"
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/register
mkdir -p src/app/\(dashboard\)
mkdir -p src/app/api/auth/login
mkdir -p src/app/api/auth/register
mkdir -p src/app/api/app/create
mkdir -p src/app/api/app/list
mkdir -p src/app/api/report
mkdir -p src/components/ui
mkdir -p src/components/charts
mkdir -p src/components/layout
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p public/sdk

# 5. 创建 Prisma Schema
echo -e "${BLUE}📦 步骤 5/8: 创建 Prisma Schema...${NC}"
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id          Int      @id @default(autoincrement())
  account     String   @unique
  encPassword String
  status      Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  apps        App[]

  @@map("user")
}

model App {
  id        Int      @id @default(autoincrement())
  appId     String   @unique
  appName   String
  appType   Int
  status    Int      @default(1)
  createId  Int
  creator   User     @relation(fields: [createId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("app")
}
EOF

# 6. 创建工具库文件
echo -e "${BLUE}📦 步骤 6/8: 创建工具库...${NC}"

# Prisma Client
cat > src/lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
EOF

# Redis Client
cat > src/lib/redis.ts << 'EOF'
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

export { redis };
EOF

# Elasticsearch Client
cat > src/lib/elasticsearch.ts << 'EOF'
import { Client } from '@elastic/elasticsearch';

export const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
});
EOF

# Auth Utils
cat > src/lib/auth.ts << 'EOF'
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from './prisma';

export async function getUser(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
    );

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as number }
    });

    return user;
  } catch (error) {
    return null;
  }
}
EOF

# Utils
cat > src/lib/utils.ts << 'EOF'
export function generateShortUUID(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
}

export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
EOF

# 7. 创建环境变量文件
echo -e "${BLUE}📦 步骤 7/8: 创建环境配置...${NC}"
cat > .env.local << 'EOF'
# Database
DATABASE_URL="mysql://root:123456@localhost:3306/frontend_watch_dog"

# JWT
JWT_SECRET="your-secret-key-change-this-in-production"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Elasticsearch
ELASTICSEARCH_NODE="http://localhost:9200"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"
EOF

# 8. 创建中间件
echo -e "${BLUE}📦 步骤 8/8: 创建中间件...${NC}"
cat > src/middleware.ts << 'EOF'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径
  const publicPaths = ['/login', '/register', '/api/auth', '/api/report'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 验证 token
  const token = request.cookies.get('token')?.value;
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { code: 1005, message: '登录已过期' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
    );
    return NextResponse.next();
  } catch (error) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { code: 1005, message: '登录已过期' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
EOF

echo -e "${GREEN}✅ Next.js 项目初始化完成！${NC}"
echo ""
echo "下一步操作："
echo "1. cd $PROJECT_NAME"
echo "2. 修改 .env.local 中的配置"
echo "3. npx prisma migrate dev --name init"
echo "4. pnpm dev"
echo ""
echo "详细的迁移文档请查看: NEXTJS_MIGRATION.md"
