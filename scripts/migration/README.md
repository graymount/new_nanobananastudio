# Nano Banana Studio - Data Migration Tool

从老站迁移用户数据、图片历史和订阅信息到新站。

## 数据映射关系

| 老站表 | 新站表 | 说明 |
|--------|--------|------|
| `users` | `user` + `account` | 用户基本信息 + OAuth 关联 |
| `image_history` | `ai_task` | 图片生成历史 |
| `usage` | `subscription` + `credit` | 订阅和积分 |

## 前置要求

1. **Node.js 18+** 和 **pnpm**
2. 老站 Supabase 的 **Service Role Key**（管理员密钥）
3. 新站数据库的连接字符串
4. 确保新站数据库已运行 migrations（`pnpm db:migrate`）

## 安装依赖

```bash
# 在项目根目录
pnpm install

# 如果缺少依赖
pnpm add -D @supabase/supabase-js postgres tsx
```

## 配置

### 方法一：环境变量

```bash
# 老站配置
export OLD_SUPABASE_URL="https://xxxxxxxxxx.supabase.co"
export OLD_SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxx"
export OLD_R2_DOMAIN="https://images.nanobananastudio.com"

# 新站配置
export DATABASE_URL="postgresql://user:password@host:5432/database"
export DB_SCHEMA="nanobananastudio_new"

# 迁移选项
export DRY_RUN="true"      # 先用 true 测试，确认无误后改为 false
export BATCH_SIZE="100"
export LOG_LEVEL="info"    # debug | info | warn | error
```

### 方法二：配置文件

```bash
# 复制示例配置
cp scripts/migration/config.local.example.ts scripts/migration/config.local.ts

# 编辑配置文件
vim scripts/migration/config.local.ts
```

## 运行迁移

### 完整迁移（推荐）

```bash
# 1. 先进行 Dry Run 测试
DRY_RUN=true pnpm migrate

# 2. 检查输出，确认数据量正确

# 3. 执行实际迁移
DRY_RUN=false pnpm migrate
```

### 单步迁移

如果需要分步执行或重试某一步：

```bash
# 只迁移用户
pnpm migrate:users

# 只迁移订阅/积分
pnpm migrate:usage

# 只迁移图片
pnpm migrate:images
```

### 使用 tsx 直接运行

```bash
# 完整迁移
npx tsx scripts/migration/run-all.ts

# 单步迁移
npx tsx scripts/migration/run-all.ts --step users
npx tsx scripts/migration/run-all.ts --step usage
npx tsx scripts/migration/run-all.ts --step images
```

## 迁移顺序

脚本会按以下顺序执行：

1. **Users** - 必须最先执行，其他表依赖用户 ID
2. **Usage/Subscriptions** - 授予用户积分
3. **Images** - 导入图片历史

## 迁移逻辑说明

### 用户迁移

- 保持用户 ID 不变（关键！）
- 将 `google_sub` 映射到 `account` 表（OAuth 关联）
- 所有迁移用户标记为 `emailVerified: true`

### 图片迁移

- 转换 `r2_key` 为完整 URL
- 将 `mode` 映射到 `scene`：
  - `text-to-image` → `text-to-image`
  - `image_edit` / `image-edit` → `image-to-image`
- `taskInfo` 格式：`{ images: [{ imageUrl, createTime }], status: 'SUCCESS' }`
- 通过 `options.migrated_from` 记录原始 ID，避免重复迁移

### 订阅/积分迁移

- 付费用户（pro/max）创建 `subscription` 记录
- 有剩余配额的用户创建 `credit` 记录
- 过期的订阅标记为 `expired` 状态
- 过期的积分 `remainingCredits` 设为 0

## 图片存储

新旧站可以共用同一个 R2 Bucket，只需确保：

1. 新站配置相同的 R2 域名
2. 或者将图片复制到新 Bucket：

```bash
# 使用 rclone 同步
rclone sync r2-old:bucket-name r2-new:bucket-name --progress
```

## 常见问题

### Q: 迁移失败，如何重试？

迁移脚本是幂等的（Idempotent），可以安全重复运行：
- 已存在的用户会被跳过
- 已迁移的图片（通过 `options.migrated_from` 判断）会被跳过
- 已迁移的积分（通过 `transactionNo` 前缀 `MIG-` 判断）会被跳过

### Q: 迁移后用户如何登录？

用户使用相同的 Google 账号或邮箱登录新站即可，因为：
- 用户 ID 保持不变
- Google OAuth 关联已迁移到 `account` 表

### Q: 如何验证迁移结果？

```sql
-- 检查用户数量
SELECT COUNT(*) FROM "user";

-- 检查图片数量
SELECT COUNT(*) FROM ai_task WHERE options LIKE '%migrated_from%';

-- 检查积分总额
SELECT SUM("remainingCredits") FROM credit WHERE "transactionNo" LIKE 'MIG-%';
```

## 回滚

如果需要回滚迁移的数据：

```sql
-- 删除迁移的图片
DELETE FROM ai_task WHERE options LIKE '%migrated_from%';

-- 删除迁移的积分
DELETE FROM credit WHERE "transactionNo" LIKE 'MIG-%';

-- 删除迁移的订阅
DELETE FROM subscription WHERE "orderId" LIKE 'migrated-%';

-- 删除迁移的用户（谨慎！会删除所有相关数据）
-- DELETE FROM "user" WHERE id IN (SELECT id FROM old_site_users);
```

## 文件结构

```
scripts/migration/
├── config.ts                  # 配置定义
├── config.local.ts            # 本地配置（不提交到 git）
├── config.local.example.ts    # 配置示例
├── db.ts                      # 数据库连接和工具
├── migrate-users.ts           # 用户迁移
├── migrate-images.ts          # 图片迁移
├── migrate-usage.ts           # 订阅/积分迁移
├── run-all.ts                 # 主入口
└── README.md                  # 本文档
```
