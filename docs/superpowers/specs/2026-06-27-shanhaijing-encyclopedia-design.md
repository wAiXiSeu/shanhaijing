# 山海图鉴 — 设计文档

> 创建日期：2026-06-27
> 状态：已确认，待实现

## 概述

基于《山海经》的异兽图鉴网站。一期收录 15 种详细异兽 + 13 篇神话故事，以浏览式百科为核心体验。使用 Next.js + Supabase + Docker 技术栈，视觉风格复用 Figma 设计规范（黑白主调 + 柔和色块分段）。

### 一期范围

- **内容**：15 种详细异兽（烛龙、凤凰、九尾狐、饕餮、穷奇、帝江、精卫、夸父、刑天、西王母、应龙、夔、比翼鸟、巴蛇、毕方）+ 13 篇故事
- **体验**：浏览式百科，无需登录即可阅读全部内容
- **鉴权**：仅后台管理（管理员登录后可 CRUD 异兽/故事/分类）
- **不包含**：用户注册、收藏、评论、解锁机制、全部 171 种异兽

---

## 1. 架构与技术栈

### 系统架构

```
用户浏览器
  ├── 公开页面 (ISR)        ── HTTPS ──┐
  └── 后台管理面板 (CSR+Auth)           │
                                        │
Next.js (Docker, standalone output)     │
  ├── 公开路由  /  /creatures  /stories │
  ├── Admin路由 /admin/*               │
  └── API路由   /api/revalidate        │
                                        │
Supabase                                │
  ├── PostgreSQL (creatures/stories/categories)
  ├── Storage (/images /stories)
  └── Auth (admin 邮箱密码登录) ◄──────┘
```

### 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Next.js 15 (App Router) | ISR 公开页面 + CSR 管理面板 |
| 样式 | Tailwind CSS | 与 Figma design tokens 对齐 |
| 数据 | Supabase PostgreSQL | 三张主表：creatures、stories、categories |
| 存储 | Supabase Storage | 异兽配图、故事配图 |
| 鉴权 | Supabase Auth | 邮箱密码登录，仅 admin 角色 |
| ORM | @supabase/supabase-js | 服务端用 service key，客户端用 anon key + RLS |
| 部署 | Docker (standalone) | `next:standalone` 输出，轻量镜像 |

### 渲染策略

- **公开页面**：ISR（Incremental Static Regeneration），默认 1 小时重新验证。后台编辑内容后通过 on-demand revalidation API 即时更新
- **管理面板**：CSR，客户端直接调 Supabase（受 RLS 保护，仅 admin 可写）
- **图片**：通过 Supabase Storage 公开 URL 引用，Next.js `<Image>` 组件优化

---

## 2. 数据模型

### PostgreSQL 表结构

```sql
-- ① categories（分类表）
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,          -- "鸟类"、"兽类"
  slug        TEXT NOT NULL UNIQUE,   -- "niao-lei"
  color_block TEXT NOT NULL,          -- "block-lime"、"block-coral" 等
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ② creatures（异兽表）
CREATE TABLE creatures (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,          -- "烛龙"
  slug         TEXT NOT NULL UNIQUE,   -- "zhulong"
  summary      TEXT,                   -- 一句话简介
  origin       TEXT,                   -- "《大荒北经》《海外北经》"
  appearance   TEXT,                   -- 外形特征描述
  abilities    TEXT,                   -- 特殊能力/寓意
  description  TEXT,                   -- 详细解读 (Markdown)
  category_id  UUID REFERENCES categories(id),
  attribute    TEXT,                   -- "祥瑞"、"凶兆"、"食人"、"药用"、"中性"
  image_path   TEXT,                   -- Supabase Storage 路径
  is_published BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ③ stories（故事表）
CREATE TABLE stories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,          -- "烛龙——掌控昼夜的神龙"
  slug         TEXT NOT NULL UNIQUE,
  content      TEXT NOT NULL,          -- 故事正文 (Markdown)
  creature_id  UUID REFERENCES creatures(id),  -- 关联异兽（可选）
  image_path   TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
```

### 分类 → 色块映射

| 物种类别 | Figma 色块 | 色值 | 视觉联想 |
|---|---|---|---|
| 鸟类 | `block-lime` | `#dceeb1` | 天空、自然 |
| 兽类 | `block-coral` | `#f3c9b6` | 大地、温暖 |
| 鱼类/水生类 | `block-mint` | `#c8e6cd` | 水、清凉 |
| 神灵/半神 | `block-navy` | `#1f1d3d` | 深邃、神圣 |
| 异族/国度 | `block-cream` | `#f4ecd6` | 人间、古朴 |
| 蛇/爬虫类 | `block-lilac` | `#c5b0f4` | 神秘、幽暗 |

### Supabase Storage

```
bucket: shanhaijing-assets
├── creatures/{creature-slug}.webp
└── stories/{story-slug}.webp
```

### RLS 策略

- **公开读**：`SELECT` 对所有 anon 角色开放（仅 is_published=true 的记录）
- **管理写**：`INSERT/UPDATE/DELETE` 仅对 auth.users 中的 admin 角色开放
- **Storage**：公开读，仅 admin 可写

### 关系

```
categories 1 ──── N creatures 1 ──── 0..1 stories
```

一期 15 个异兽中 13 个有对应故事（巴蛇、毕方无故事）。故事表 `creature_id` 可选 NULL。

---

## 3. 页面结构与路由

### 公开页面

| 路由 | 说明 |
|---|---|
| `/` | 首页：hero + marquee + 精选异兽卡片 + 分类色块 + 故事入口 |
| `/creatures` | 异兽图鉴：全部异兽卡片网格 + 分类筛选 pills |
| `/creatures/[slug]` | 异兽详情：配图 + 基本信息 + 外形色块 + 能力 + 详细解读 + 关联故事 |
| `/stories` | 故事列表：故事卡片网格 |
| `/stories/[slug]` | 故事详情：标题 + 配图 + 正文 + 知识卡片 + 关联异兽 |
| `/about` | 关于山海经 |

### 管理页面

| 路由 | 说明 |
|---|---|
| `/admin/login` | 管理员登录 |
| `/admin` | 控制台首页（内容概览 + 最近编辑） |
| `/admin/creatures` | 异兽管理列表 |
| `/admin/creatures/[id]` | 异兽编辑表单 |
| `/admin/stories` | 故事管理列表 |
| `/admin/stories/[id]` | 故事编辑表单 |
| `/admin/categories` | 分类管理 |

### 首页布局

按 Figma 页面节奏设计——黑白主调与色块交替分段：

1. **TopNav**（白底/黑字, 56px）— Logo + 导航 + 搜索
2. **Hero**（白底）— display-xl "山海图鉴" + body-lg 副标题
3. **Marquee Strip**（黑底/白字, 36px）— 山海经原文金句滚动
4. **精选异兽**（白底）— 4 列卡片网格（surface-soft 底）
5. **分类色块**（交替色块）— 每个分类一个色块段，含分类名 + 描述 + 链接
6. **故事入口**（白底）— 2 列故事卡片
7. **Footer**（白底, caption 字体）

### 异兽详情页布局

1. 返回链接
2. 左图右信息：配图（rounded.lg）+ 分类标签 + 名称（display-lg）+ 简介 + 出处
3. 色块段（分类对应色）：外形特征
4. 白底段：特殊能力/寓意
5. 深色块段（block-navy）：详细解读（Markdown 渲染）
6. 关联故事卡片（如有）

### 故事详情页布局

1. 返回链接
2. Hero（白底）：标题（display-lg）+ 配图
3. 阅读区域（白底, 最大宽度 720px 居中）：故事正文（Markdown 渲染）
4. 分隔线后的"小朋友你知道吗？"知识卡片 → block-cream 色块包裹
5. 关联异兽卡片

---

## 4. 组件设计与样式系统

### 设计令牌（Tailwind CSS 配置）

```js
// tailwind.config.ts — 关键令牌
colors: {
  primary: '#000000',
  canvas: '#ffffff',
  ink: '#000000',
  'surface-soft': '#f7f7f5',
  hairline: '#e6e6e6',
  'block-lime': '#dceeb1',
  'block-coral': '#f3c9b6',
  'block-mint': '#c8e6cd',
  'block-navy': '#1f1d3d',
  'block-cream': '#f4ecd6',
  'block-lilac': '#c5b0f4',
  'accent-magenta': '#ff3d8b',
}
fontSize: {
  'display-xl': ['86px', { lineHeight: '1.0', letterSpacing: '-1.72px', fontWeight: '340' }],
  'display-lg': ['64px', { lineHeight: '1.1', letterSpacing: '-0.96px', fontWeight: '340' }],
  'display-md': ['32px', { lineHeight: '1.13', fontWeight: '500' }],
  'headline':   ['26px', { lineHeight: '1.35', letterSpacing: '-0.26px', fontWeight: '540' }],
  'subhead':    ['26px', { lineHeight: '1.35', letterSpacing: '-0.26px', fontWeight: '340' }],
  'body-lg':    ['20px', { lineHeight: '1.4',  letterSpacing: '-0.14px', fontWeight: '330' }],
  'body':       ['18px', { lineHeight: '1.45', letterSpacing: '-0.26px', fontWeight: '320' }],
  'body-sm':    ['16px', { lineHeight: '1.45', letterSpacing: '-0.14px', fontWeight: '330' }],
  'caption':    ['12px', { lineHeight: '1.0',  letterSpacing: '0.6px',  fontWeight: '400' }],
}
borderRadius: { 'xs': '2px', 'sm': '6px', 'md': '8px', 'lg': '24px', 'xl': '32px', 'pill': '50px', 'full': '9999px' }
fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }
```

> Inter 替代 figmaSans，JetBrains Mono 替代 figmaMono。Inter 的 x-height 略高，line-height 需下调约 0.02 补偿。

### 核心组件

**TopNav** — 固定顶部，白底黑字，1px hairline 底边。Logo 用 display-md，导航用 body-sm-strong，搜索用 40px 圆形 icon button（surface-soft 底）。移动端折叠汉堡。

**CreatureCard** — surface-soft 底，rounded.md，16px padding。顶部 4px 分类色条，配图正方形（rounded.md），名称 card-title（24px/700），属性 caption 灰色，简介 body-sm 两行截断。hover 微浮 + level-2 阴影。

**ColorBlockSection** — 分类色块背景，rounded.lg，48px padding。内文最大宽度 65% 居左。eyebrow 标签（mono 大写）+ display-lg 标题 + body-lg 描述 + link 链接。

**FilterPills** — pill 形按钮组。选中态：黑底白字（button-primary）；未选态：白底黑字（button-secondary）。20px button 字体。

**StoryCard** — surface-soft 底，rounded.md，16px padding。配图 16:9（rounded.md），标题 card-title，摘要 body-sm 三行截断，关联异兽 caption + link。

**MarkdownRenderer** — 渲染 Markdown 正文。标题映射 headline/subhead，正文 body 字号，最大宽度 720px 居中。故事末尾 `---` 后的"小朋友你知道吗？"段落用 block-cream 色块包裹。

### 响应式断点

| 断点 | 宽度 | 变化 |
|---|---|---|
| Mobile | <640px | 导航折叠汉堡，卡片 1 列，色块 padding 缩至 24px |
| Tablet | 640–1024px | 卡片 2 列，导航展开 |
| Desktop | >1024px | 卡片 3-4 列，色块完整 padding 48px |

---

## 5. 后台管理与内容工作流

### 管理面板布局

- **左侧边栏**（200px）：导航（控制台 / 异兽 / 故事 / 分类）
- **右侧主区域**：数据表格 + 编辑表单

### 异兽编辑流程

1. `/admin/creatures` 列表页：每行显示名称、分类·属性、发布状态
2. 点击进入 `/admin/creatures/[id]` 编辑表单
3. 表单字段：名称、Slug、分类（下拉）、属性、出处、配图（拖拽上传）、简介、外形（Markdown 编辑器）、能力（Markdown 编辑器）、解读（Markdown 编辑器）
4. 操作：保存草稿（is_published=false）/ 发布（is_published=true）/ 取消发布 / 删除（需确认）

### 内容工作流

```
新增异兽 → 填写表单 → 保存草稿 (is_published=false)
                      → 发布 (is_published=true) → 触发 ISR on-demand revalidate
                      → 取消发布 → 页面自动 404
```

**ISR on-demand revalidation**：管理面板保存后调用 `/api/revalidate`，传入路径和密钥，触发对应页面的 ISR 重新生成。需 revalidate 的路径：`/creatures/[slug]`、`/creatures`、`/`。

### Markdown 编辑器

使用 `@uiw/react-md-editor`：左编辑右预览分屏模式，工具栏支持粗体/斜体/标题/列表/引用/分隔线，预览区使用与前台相同的 MarkdownRenderer 组件。

### 图片上传

拖拽或点击上传，支持 webp/jpg/png。上传到 Supabase Storage `creatures/{slug}.webp`。自动压缩为 WebP（最大 1920px 宽）。上传后返回公开 URL 填入 `image_path`。限制 5MB 以内。

---

## 6. 数据导入、错误处理与测试

### 数据导入脚本

```
scripts/seed/
├── seed-categories.ts    ← 导入6个分类
├── seed-creatures.ts     ← 解析汇总.md，提取15个详细异兽
├── seed-stories.ts       ← 解析 stories/*.md，导入13篇故事
└── run-all.ts            ← 按顺序执行：分类 → 异兽 → 故事
```

**seed-creatures.ts 逻辑：**

1. 读取 `山海经奇珍异兽汇总.md`
2. 定位 "第三部分：著名异兽详细介绍" 章节
3. 按 `---` 分隔符拆分为 15 个异兽块
4. 每块解析：名称（`### ` 标题）、出处（`> ` 引用）、外形、能力、详细解读
5. 根据名称匹配分类和属性（硬编码映射表）
6. 插入 creatures 表，is_published=true

**seed-stories.ts 逻辑：**

1. 遍历 `stories/*.md`
2. 文件名解析序号和异兽名（`01_烛龙_掌控昼夜的神龙.md`）
3. 正文全文作为 content（含 `---` 后的知识卡片段落）
4. 通过异兽名匹配 creatures.id，填入 creature_id
5. 插入 stories 表，is_published=true

### 错误处理

| 场景 | 处理方式 |
|---|---|
| 公开页面查询失败 | ISR 缓存兜底，展示上次成功缓存内容 + 日志记录 |
| 异兽/故事不存在 | 自定义 404 页面（黑底白字，display-lg "异兽未找到"） |
| 图片加载失败 | 降级为分类色块占位 + 异兽名称文字 |
| 管理面板未登录 | 重定向 `/admin/login` |
| 管理面板 API 403 | 提示"无权限"并重定向登录 |
| Supabase 连接失败 | 500 页面 + 错误日志 |
| 图片上传超限 | 前端提示"图片不超过 5MB" |

### 测试策略

**E2E 测试（Playwright）：**
- 首页加载、卡片导航、筛选交互
- 异兽详情页渲染、故事详情页渲染
- 管理员登录流程

**组件测试（Vitest + Testing Library）：**
- CreatureCard 渲染、点击导航
- FilterPills 筛选状态切换
- ColorBlockSection 内容渲染
- MarkdownRenderer 格式输出

**数据层测试（Vitest）：**
- 种子脚本解析正确性（输入 markdown → 输出结构）
- Supabase 查询函数 mock 测试
- RLS 策略验证（anon 不可写，admin 可写）

### Docker 部署

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
services:
  shanhaijing:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REVALIDATE_SECRET=${REVALIDATE_SECRET}
    restart: unless-stopped
```

### 项目目录结构

```
shanhaijing/
├── app/
│   ├── (public)/                # 公开页面路由组
│   │   ├── page.tsx             # 首页
│   │   ├── creatures/
│   │   │   ├── page.tsx         # 异兽列表
│   │   │   └── [slug]/page.tsx  # 异兽详情
│   │   ├── stories/
│   │   │   ├── page.tsx         # 故事列表
│   │   │   └── [slug]/page.tsx  # 故事详情
│   │   └── about/page.tsx       # 关于
│   ├── admin/                   # 管理面板路由组
│   │   ├── login/page.tsx
│   │   ├── page.tsx             # 控制台
│   │   ├── creatures/
│   │   │   ├── page.tsx         # 列表
│   │   │   └── [id]/page.tsx    # 编辑
│   │   ├── stories/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── categories/page.tsx
│   ├── api/
│   │   └── revalidate/route.ts  # ISR on-demand
│   ├── layout.tsx               # 根布局
│   └── globals.css              # 全局样式
├── components/
│   ├── public/                  # 公开页面组件
│   │   ├── TopNav.tsx
│   │   ├── Footer.tsx
│   │   ├── CreatureCard.tsx
│   │   ├── StoryCard.tsx
│   │   ├── ColorBlockSection.tsx
│   │   ├── FilterPills.tsx
│   │   └── MarkdownRenderer.tsx
│   └── admin/                   # 管理面板组件
│       ├── AdminLayout.tsx
│       ├── Sidebar.tsx
│       ├── CreatureForm.tsx
│       ├── StoryForm.tsx
│       ├── ImageUploader.tsx
│       └── MarkdownEditor.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # 浏览器端 client
│   │   ├── server.ts            # 服务端 client (service key)
│   │   └── types.ts             # 数据库类型定义
│   └── utils.ts                 # 通用工具函数
├── scripts/
│   └── seed/                    # 数据导入脚本
│       ├── seed-categories.ts
│       ├── seed-creatures.ts
│       ├── seed-stories.ts
│       └── run-all.ts
├── supabase/
│   └── migrations/
│       └── 001_init.sql         # 建表 + RLS SQL
├── public/
│   └── ...                      # 静态资源
├── __tests__/                   # 测试
│   ├── e2e/
│   ├── components/
│   └── data/
├── Dockerfile
├── docker-compose.yml
├── tailwind.config.ts
├── next.config.js
├── package.json
└── .env.local
```

---

## 环境变量

| 变量名 | 说明 | 作用域 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 前端 + 后端 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | 前端 + 后端 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | 仅后端 |
| `REVALIDATE_SECRET` | ISR on-demand revalidation 密钥 | 仅后端 |
