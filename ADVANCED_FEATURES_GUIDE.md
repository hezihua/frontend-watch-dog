# 高级功能扩展指南

本文档介绍如何扩展系统的高级功能，包括团队协作、Kafka 集成等。

## 📋 已实现的增强功能

### ✅ 1. Redis 缓存层

**位置：** `admin/src/services/cache.ts`

**功能：**
- 应用列表缓存（5分钟）
- 应用状态缓存（10分钟）
- 统计数据缓存（5分钟）
- 用户信息缓存（1小时）

**使用方式：**
```typescript
import { withCache, TTL } from '@/services/cache';

// 方式 1: 直接使用缓存方法
import { getUserAppsCache, cacheUserApps } from '@/services/cache';
const cached = await getUserAppsCache(userId);

// 方式 2: 使用包装器
const data = await withCache(
  `key:${id}`,
  TTL.MEDIUM,
  async () => await fetchDataFromDB()
);
```

### ✅ 2. 数据导出

**导出性能数据：**
```bash
GET /api/export/performance?appId=xxx&format=xlsx
GET /api/export/performance?appId=xxx&format=csv
```

**导出错误数据：**
```bash
GET /api/export/errors?appId=xxx&type=all&format=xlsx
GET /api/export/errors?appId=xxx&type=http&format=csv
GET /api/export/errors?appId=xxx&type=js&format=xlsx
```

### ✅ 3. 告警系统

**手动触发告警检查：**
```bash
POST /api/alert/check
Body: { "appId": "xxx" }
```

**批量检查（用于定时任务）：**
```bash
GET /api/alert/check
Headers: { "x-api-key": "your-api-key" }
```

**配置环境变量：**
```env
ALERT_API_KEY=your-secret-key
```

**设置定时任务（Linux Cron）：**
```bash
# 每小时检查一次告警
0 * * * * curl -H "x-api-key: your-key" http://localhost:3000/api/alert/check
```

---

## 🔧 待扩展的高级功能

### 1️⃣ 团队协作和权限管理

**需求：** 多人共享应用、不同角色权限

#### 步骤 1: 更新数据库 Schema

在 `admin/prisma/schema.prisma` 中添加：

```prisma
// 用户模型（已存在，需要添加关联）
model User {
  id          Int      @id @default(autoincrement())
  account     String   @unique
  encPassword String
  status      Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  apps        App[]
  appMembers  AppMember[]  // 新增：作为成员的应用

  @@map("user")
}

// 应用模型（已存在，需要添加关联）
model App {
  id        Int         @id @default(autoincrement())
  appId     String      @unique
  appName   String
  appType   Int
  status    Int         @default(1)
  createId  Int
  creator   User        @relation(fields: [createId], references: [id])
  members   AppMember[] // 新增：应用成员列表
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@map("app")
}

// 新增：应用成员表
model AppMember {
  id        Int      @id @default(autoincrement())
  appId     String
  userId    Int
  role      String   // owner, admin, developer, viewer
  app       App      @relation(fields: [appId], references: [appId])
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([appId, userId])
  @@map("app_member")
}
```

#### 步骤 2: 运行数据库迁移

```bash
cd admin
npx prisma migrate dev --name add_team_collaboration
npx prisma generate
```

#### 步骤 3: 创建权限检查中间件

创建 `admin/src/lib/permission.ts`:

```typescript
import prisma from '@/lib/prisma';

export enum AppRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}

export const RolePermissions = {
  [AppRole.OWNER]: ['read', 'write', 'delete', 'manage_members'],
  [AppRole.ADMIN]: ['read', 'write', 'manage_members'],
  [AppRole.DEVELOPER]: ['read', 'write'],
  [AppRole.VIEWER]: ['read'],
};

export async function checkAppPermission(
  userId: number,
  appId: string,
  permission: string
): Promise<boolean> {
  // 检查是否是创建者
  const app = await prisma.app.findFirst({
    where: { appId, createId: userId },
  });

  if (app) return true; // 创建者拥有所有权限

  // 检查是否是成员
  const member = await prisma.appMember.findUnique({
    where: {
      appId_userId: { appId, userId },
    },
  });

  if (!member) return false;

  const permissions = RolePermissions[member.role as AppRole] || [];
  return permissions.includes(permission);
}
```

#### 步骤 4: 创建团队管理 API

创建 `admin/src/app/api/team/members/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkAppPermission, AppRole } from '@/lib/permission';

// GET - 获取应用成员列表
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { code: 1005, message: '未登录' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');

  if (!appId) {
    return NextResponse.json(
      { code: 1001, message: '缺少 appId' },
      { status: 400 }
    );
  }

  // 检查权限
  const hasPermission = await checkAppPermission(userId, appId, 'read');
  if (!hasPermission) {
    return NextResponse.json(
      { code: 1001, message: '无权访问' },
      { status: 403 }
    );
  }

  const members = await prisma.appMember.findMany({
    where: { appId },
    include: {
      user: {
        select: { id: true, account: true },
      },
    },
  });

  return NextResponse.json({
    code: 1000,
    data: members,
  });
}

// POST - 添加成员
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { code: 1005, message: '未登录' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { appId, memberUserId, role } = body;

  // 检查管理权限
  const hasPermission = await checkAppPermission(userId, appId, 'manage_members');
  if (!hasPermission) {
    return NextResponse.json(
      { code: 1001, message: '无权操作' },
      { status: 403 }
    );
  }

  const member = await prisma.appMember.create({
    data: {
      appId,
      userId: memberUserId,
      role: role || AppRole.VIEWER,
    },
  });

  return NextResponse.json({
    code: 1000,
    data: member,
  });
}

// DELETE - 移除成员
export async function DELETE(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { code: 1005, message: '未登录' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');
  const memberUserId = searchParams.get('userId');

  if (!appId || !memberUserId) {
    return NextResponse.json(
      { code: 1001, message: '缺少参数' },
      { status: 400 }
    );
  }

  // 检查管理权限
  const hasPermission = await checkAppPermission(userId, appId, 'manage_members');
  if (!hasPermission) {
    return NextResponse.json(
      { code: 1001, message: '无权操作' },
      { status: 403 }
    );
  }

  await prisma.appMember.delete({
    where: {
      appId_userId: {
        appId,
        userId: parseInt(memberUserId),
      },
    },
  });

  return NextResponse.json({
    code: 1000,
    message: '成员已移除',
  });
}
```

---

### 2️⃣ Kafka 消息队列集成

**需求：** 处理大流量数据（日 PV > 100万）

#### 步骤 1: 安装依赖

```bash
cd admin
pnpm add kafkajs
```

#### 步骤 2: 创建 Kafka 服务

创建 `admin/src/lib/kafka.ts`:

```typescript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'frontend-monitor',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'monitor-consumer' });

// 初始化生产者
export async function initKafkaProducer() {
  await producer.connect();
  console.log('✅ Kafka Producer 已连接');
}

// 初始化消费者
export async function initKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'monitor-data', fromBeginning: false });
  console.log('✅ Kafka Consumer 已连接');
}

// 发送消息
export async function sendToKafka(topic: string, message: any) {
  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  });
}
```

#### 步骤 3: 修改数据上报流程

修改 `admin/src/app/api/report/route.ts`:

```typescript
// 原来：直接写入 Elasticsearch
await bulkSaveMonitorData(enrichedData);

// 改为：发送到 Kafka
import { sendToKafka } from '@/lib/kafka';
for (const data of enrichedData) {
  await sendToKafka('monitor-data', data);
}
```

#### 步骤 4: 创建 Kafka 消费者服务

创建 `admin/src/scripts/kafka-consumer.ts`:

```typescript
import { consumer } from '@/lib/kafka';
import { bulkSaveMonitorData } from '@/lib/elasticsearch';

async function startConsumer() {
  await consumer.run({
    eachBatch: async ({ batch }) => {
      const messages = batch.messages.map((message) =>
        JSON.parse(message.value!.toString())
      );

      // 批量写入 Elasticsearch
      await bulkSaveMonitorData(messages);

      console.log(`处理了 ${messages.length} 条消息`);
    },
  });
}

startConsumer().catch(console.error);
```

#### 步骤 5: 运行消费者

```bash
# 在单独的进程中运行
npx ts-node src/scripts/kafka-consumer.ts

# 或使用 PM2
pm2 start npx --name kafka-consumer -- ts-node src/scripts/kafka-consumer.ts
```

---

### 3️⃣ 实际配置告警通知渠道

#### 钉钉机器人

```typescript
// 在 src/services/alert.ts 中实现
async function sendDingTalkAlert(alert: AlertMessage): Promise<void> {
  const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msgtype: 'markdown',
      markdown: {
        title: alert.title,
        text: `### ${alert.title}\n\n` +
              `**应用：** ${alert.appName}\n\n` +
              `**级别：** ${alert.level}\n\n` +
              `**消息：** ${alert.message}\n\n` +
              `**时间：** ${alert.timestamp.toLocaleString('zh-CN')}`,
      },
    }),
  });
}
```

#### 邮件通知

```bash
pnpm add nodemailer @types/nodemailer
```

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmailAlert(alert: AlertMessage, recipients: string[]): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: recipients.join(','),
    subject: `[${alert.level}] ${alert.title}`,
    html: `
      <h2>${alert.title}</h2>
      <p><strong>应用：</strong>${alert.appName}</p>
      <p><strong>消息：</strong>${alert.message}</p>
      <p><strong>时间：</strong>${alert.timestamp.toLocaleString('zh-CN')}</p>
      <pre>${JSON.stringify(alert.detail, null, 2)}</pre>
    `,
  });
}
```

---

## 🎯 功能优先级建议

1. **立即可用（无需额外开发）**
   - ✅ Redis 缓存
   - ✅ 数据导出
   - ✅ 告警检查（控制台输出）

2. **简单配置即可使用（1-2小时）**
   - 钉钉/企业微信告警
   - 邮件告警
   - 定时任务

3. **需要开发（半天）**
   - 团队协作功能
   - 权限管理系统

4. **需要基础设施（1-2天）**
   - Kafka 消息队列
   - 数据归档
   - 高可用部署

---

## 📝 环境变量配置

在 `admin/.env.local` 中添加：

```env
# Redis 缓存（已配置）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 告警系统
ALERT_API_KEY=your-secret-key

# 钉钉告警
DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?access_token=xxx

# 邮件告警
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM="监控系统 <no-reply@example.com>"

# Kafka（可选）
KAFKA_BROKERS=localhost:9092,localhost:9093
```

---

## 🚀 总结

所有增强功能的基础代码已实现！

**立即可用：**
- Redis 缓存 ✅
- 数据导出 ✅
- 告警检查框架 ✅

**需要配置：**
- 实际告警通知（钉钉/邮件）
- 定时任务
- 团队协作（需要数据库迁移）
- Kafka（需要 Kafka 服务）

建议根据实际需求逐步实施！
