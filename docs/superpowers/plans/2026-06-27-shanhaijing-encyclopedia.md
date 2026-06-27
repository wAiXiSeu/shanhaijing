# 山海图鉴 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Shan Hai Jing illustrated-encyclopedia website with Next.js + Supabase, featuring 15 creature profiles and 15 stories, with a Figma-inspired design system and an admin panel for content management.

**Architecture:** Next.js 15 App Router with ISR for public pages and CSR for admin. Supabase provides PostgreSQL (3 tables), Storage (images), and Auth (admin-only). Docker standalone deployment.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, @supabase/supabase-js, @uiw/react-md-editor, Vitest, Playwright, Docker.

## Global Constraints

- Node.js >= 20
- Next.js 15 with App Router, `output: 'standalone'` in next.config
- Tailwind CSS for all styling — no CSS modules or styled-components
- Inter font replaces figmaSans; JetBrains Mono replaces figmaMono
- All Chinese text in UI (no i18n framework needed for Phase 1)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`
- RLS enabled on all tables — anon can read published rows, only authed admin can write
- Images stored in Supabase Storage bucket `shanhaijing-assets`

---

## File Structure

```
shanhaijing/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # Home page
│   │   ├── creatures/
│   │   │   ├── page.tsx                 # Creatures list
│   │   │   └── [slug]/page.tsx          # Creature detail
│   │   ├── stories/
│   │   │   ├── page.tsx                 # Stories list
│   │   │   └── [slug]/page.tsx          # Story detail
│   │   └── about/page.tsx               # About page
│   ├── admin/
│   │   ├── login/page.tsx               # Admin login
│   │   ├── layout.tsx                   # Admin layout (auth guard)
│   │   ├── page.tsx                     # Dashboard
│   │   ├── creatures/
│   │   │   ├── page.tsx                 # Creatures list
│   │   │   ├── new/page.tsx             # New creature
│   │   │   └── [id]/page.tsx            # Edit creature
│   │   ├── stories/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── categories/page.tsx
│   ├── api/
│   │   └── revalidate/route.ts          # ISR on-demand
│   ├── layout.tsx                       # Root layout
│   ├── not-found.tsx                    # Custom 404
│   └── globals.css                      # Global styles
├── components/
│   ├── public/
│   │   ├── TopNav.tsx
│   │   ├── Footer.tsx
│   │   ├── ColorBlockSection.tsx
│   │   ├── FilterPills.tsx
│   │   ├── CreatureCard.tsx
│   │   ├── StoryCard.tsx
│   │   └── MarkdownRenderer.tsx
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── Sidebar.tsx
│       ├── CreatureForm.tsx
│       ├── StoryForm.tsx
│       ├── ImageUploader.tsx
│       └── MarkdownEditor.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   └── utils.ts
├── scripts/
│   └── seed/
│       ├── seed-categories.ts
│       ├── seed-creatures.ts
│       ├── seed-stories.ts
│       └── run-all.ts
├── supabase/
│   └── migrations/
│       └── 001_init.sql
├── __tests__/
│   ├── components/
│   └── e2e/
├── Dockerfile
├── docker-compose.yml
├── tailwind.config.ts
├── next.config.js
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `.env.example`, `.gitignore`, `app/globals.css`, `app/layout.tsx`
- Modify: n/a

**Interfaces:**
- Consumes: n/a
- Produces: A working Next.js project with Tailwind configured, all dependencies installed

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /root/codebase/shanhaijing
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

This creates `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr @uiw/react-md-editor @uiw/react-md-editor/markdown
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test @types/node
```

- [ ] **Step 3: Configure next.config.js for standalone output**

Write to `next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create .env.example**

Write to `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
REVALIDATE_SECRET=your-random-secret-for-revalidation
```

- [ ] **Step 5: Update .gitignore**

Append to `.gitignore`:
```
.env*.local
next-env.d.ts
```

- [ ] **Step 6: Create vitest config**

Write to `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

Write to `__tests__/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

Install the vite plugin for react:
```bash
npm install -D @vitejs/plugin-react
```

- [ ] **Step 7: Verify build succeeds**

Run:
```bash
npm run build
```
Expected: Build completes without errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind, Vitest, dependencies"
```

---

## Task 2: Supabase Schema & Migrations

**Files:**
- Create: `supabase/migrations/001_init.sql`
- Test: Manual verification against Supabase dashboard

**Interfaces:**
- Consumes: Supabase project (URL + keys)
- Produces: Three tables (`categories`, `creatures`, `stories`), RLS policies, Storage bucket

- [ ] **Step 1: Write the migration SQL**

Write to `supabase/migrations/001_init.sql`:
```sql
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  color_block TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Creatures table
CREATE TABLE IF NOT EXISTS creatures (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  summary      TEXT,
  origin       TEXT,
  appearance   TEXT,
  abilities    TEXT,
  description  TEXT,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  attribute    TEXT,
  image_path   TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  content      TEXT NOT NULL,
  creature_id  UUID REFERENCES creatures(id) ON DELETE SET NULL,
  image_path   TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: public read for published content
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read creatures" ON creatures FOR SELECT USING (is_published = true);
CREATE POLICY "Public read stories" ON stories FOR SELECT USING (is_published = true);

-- RLS Policies: admin write (authenticated users)
CREATE POLICY "Admin write categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write creatures" ON creatures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write stories" ON stories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creatures_updated_at BEFORE UPDATE ON creatures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('shanhaijing-assets', 'shanhaijing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin write
CREATE POLICY "Public read storage" ON storage.objects FOR SELECT USING (bucket_id = 'shanhaijing-assets');
CREATE POLICY "Admin write storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shanhaijing-assets');
CREATE POLICY "Admin update storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shanhaijing-assets');
CREATE POLICY "Admin delete storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shanhaijing-assets');
```

- [ ] **Step 2: Run migration against Supabase**

Run (requires `.env.local` with real Supabase credentials):
```bash
# Apply via Supabase dashboard SQL editor, or:
# npx supabase db push (if using Supabase CLI)
```
Expected: All tables, policies, triggers, and storage bucket created successfully.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/001_init.sql
git commit -m "feat: add Supabase schema — tables, RLS, storage bucket"
```

---

## Task 3: Supabase Client Libraries & Types

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/types.ts`
- Test: `__tests__/components/supabase-clients.test.ts`

**Interfaces:**
- Consumes: Environment variables
- Produces: `createClient()` (browser), `createServerClient()` (server), `Database` type

- [ ] **Step 1: Write the Database type**

Write to `lib/supabase/types.ts`:
```ts
export type Category = {
  id: string
  name: string
  slug: string
  color_block: string
  sort_order: number
  created_at: string
}

export type Creature = {
  id: string
  name: string
  slug: string
  summary: string | null
  origin: string | null
  appearance: string | null
  abilities: string | null
  description: string | null
  category_id: string | null
  attribute: string | null
  image_path: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type Story = {
  id: string
  title: string
  slug: string
  content: string
  creature_id: string | null
  image_path: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type CreatureWithCategory = Creature & {
  categories: Category | null
}

export type StoryWithCreature = Story & {
  creatures: { id: string; name: string; slug: string; summary: string | null; image_path: string | null; category_id: string | null } | null
}

export type Database = {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      creatures: { Row: Creature; Insert: Partial<Creature>; Update: Partial<Creature> }
      stories: { Row: Story; Insert: Partial<Story>; Update: Partial<Story> }
    }
  }
}
```

- [ ] **Step 2: Write the browser client**

Write to `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Write the server client**

Write to `lib/supabase/server.ts`:
```ts
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createServerClient() {
  const cookieStore = await cookies()
  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}

export function createServiceClient() {
  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}
```

- [ ] **Step 4: Write utils**

Write to `lib/utils.ts`:
```ts
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
```

- [ ] **Step 5: Write test**

Write to `__tests__/components/supabase-clients.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { slugify, cn } from '@/lib/utils'

describe('utils', () => {
  it('slugify converts Chinese text to slug', () => {
    expect(slugify('烛龙')).toBe('烛龙')
  })

  it('slugify handles mixed text', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('cn joins truthy classes', () => {
    expect(cn('a', 'b', false, null, 'c')).toBe('a b c')
  })
})
```

- [ ] **Step 6: Run test**

Run: `npx vitest run __tests__/components/supabase-clients.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/ __tests__/
git commit -m "feat: add Supabase client libraries, types, and utils"
```

---

## Task 4: Design Tokens & Global Styles

**Files:**
- Create: `tailwind.config.ts` (overwrite), `app/globals.css` (overwrite)
- Test: Visual verification

**Interfaces:**
- Consumes: Figma design tokens from spec
- Produces: Tailwind theme with Figma color/typography/spacing tokens, global CSS resets

- [ ] **Step 1: Write tailwind.config.ts**

Write to `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        canvas: '#ffffff',
        ink: '#000000',
        'surface-soft': '#f7f7f5',
        hairline: '#e6e6e6',
        'hairline-soft': '#f1f1f1',
        'block-lime': '#dceeb1',
        'block-coral': '#f3c9b6',
        'block-mint': '#c8e6cd',
        'block-navy': '#1f1d3d',
        'block-cream': '#f4ecd6',
        'block-lilac': '#c5b0f4',
        'block-pink': '#efd4d4',
        'accent-magenta': '#ff3d8b',
        'inverse-canvas': '#000000',
        'inverse-ink': '#ffffff',
        'semantic-success': '#1ea64a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['86px', { lineHeight: '1.0', letterSpacing: '-1.72px', fontWeight: '340' }],
        'display-lg': ['64px', { lineHeight: '1.1', letterSpacing: '-0.96px', fontWeight: '340' }],
        'display-md': ['32px', { lineHeight: '1.13', fontWeight: '500' }],
        'display-sm': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        headline: ['26px', { lineHeight: '1.35', letterSpacing: '-0.26px', fontWeight: '540' }],
        subhead: ['26px', { lineHeight: '1.35', letterSpacing: '-0.26px', fontWeight: '340' }],
        'card-title': ['24px', { lineHeight: '1.45', fontWeight: '700' }],
        'body-lg': ['20px', { lineHeight: '1.4', letterSpacing: '-0.14px', fontWeight: '330' }],
        body: ['18px', { lineHeight: '1.45', letterSpacing: '-0.26px', fontWeight: '320' }],
        'body-sm': ['16px', { lineHeight: '1.45', letterSpacing: '-0.14px', fontWeight: '330' }],
        link: ['20px', { lineHeight: '1.4', letterSpacing: '-0.1px', fontWeight: '480' }],
        button: ['20px', { lineHeight: '1.4', letterSpacing: '-0.1px', fontWeight: '480' }],
        eyebrow: ['18px', { lineHeight: '1.3', letterSpacing: '0.54px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.0', letterSpacing: '0.6px', fontWeight: '400' }],
      },
      borderRadius: {
        xs: '2px',
        sm: '6px',
        md: '8px',
        lg: '24px',
        xl: '32px',
        pill: '50px',
        full: '9999px',
      },
      spacing: {
        hair: '1px',
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '96px',
      },
      boxShadow: {
        'soft': '0 4px 16px rgba(0,0,0,0.06)',
        'modal': '0 24px 48px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Write globals.css**

Write to `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-canvas text-ink font-sans;
    font-feature-settings: 'kern';
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

- [ ] **Step 3: Write root layout with font imports**

Write to `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '山海图鉴 — 山海经奇珍异兽视觉百科',
  description: '探索《山海经》奇珍异兽的视觉百科图鉴',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds, fonts load.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat: add Figma design tokens, global styles, root layout"
```

---

## Task 5: Shared Layout Components (TopNav, Footer, ColorBlockSection, FilterPills)

**Files:**
- Create: `components/public/TopNav.tsx`, `components/public/Footer.tsx`, `components/public/ColorBlockSection.tsx`, `components/public/FilterPills.tsx`
- Test: `__tests__/components/shared-components.test.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`, `Category` type
- Produces: `<TopNav>`, `<Footer>`, `<ColorBlockSection>`, `<FilterPills>` components

- [ ] **Step 1: Write TopNav component**

Write to `components/public/TopNav.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-canvas border-b border-hairline h-14 flex items-center px-lg md:px-xl">
      <Link href="/" className="text-display-md font-medium mr-auto">
        山海图鉴
      </Link>
      <nav className="hidden md:flex items-center gap-lg">
        <Link href="/creatures" className="text-body-sm font-medium hover:opacity-70">
          异兽
        </Link>
        <Link href="/stories" className="text-body-sm font-medium hover:opacity-70">
          故事
        </Link>
        <Link href="/about" className="text-body-sm font-medium hover:opacity-70">
          关于
        </Link>
      </nav>
      <button
        className="md:hidden w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="菜单"
      >
        ☰
      </button>
      {menuOpen && (
        <nav className="absolute top-14 left-0 right-0 bg-canvas border-b border-hairline flex flex-col p-lg md:hidden">
          <Link href="/creatures" className="py-sm text-body-sm font-medium" onClick={() => setMenuOpen(false)}>
            异兽
          </Link>
          <Link href="/stories" className="py-sm text-body-sm font-medium" onClick={() => setMenuOpen(false)}>
            故事
          </Link>
          <Link href="/about" className="py-sm text-body-sm font-medium" onClick={() => setMenuOpen(false)}>
            关于
          </Link>
        </nav>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Write Footer component**

Write to `components/public/Footer.tsx`:
```tsx
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-canvas border-t border-hairline px-xl py-section">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between gap-xl">
        <div>
          <p className="text-display-sm font-medium mb-sm">山海图鉴</p>
          <p className="text-caption text-gray-500 font-mono uppercase tracking-wider">
            Shan Hai Jing Illustrated Encyclopedia
          </p>
        </div>
        <nav className="flex flex-col gap-xs text-body-sm text-gray-500">
          <Link href="/creatures" className="hover:text-ink">异兽图鉴</Link>
          <Link href="/stories" className="hover:text-ink">神话故事</Link>
          <Link href="/about" className="hover:text-ink">关于</Link>
        </nav>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Write ColorBlockSection component**

Write to `components/public/ColorBlockSection.tsx`:
```tsx
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ColorBlock = 'block-lime' | 'block-coral' | 'block-mint' | 'block-navy' | 'block-cream' | 'block-lilac' | 'block-pink'

const blockStyles: Record<ColorBlock, { bg: string; text: string }> = {
  'block-lime':   { bg: 'bg-block-lime',   text: 'text-ink' },
  'block-coral':  { bg: 'bg-block-coral',  text: 'text-ink' },
  'block-mint':   { bg: 'bg-block-mint',   text: 'text-ink' },
  'block-navy':   { bg: 'bg-block-navy',   text: 'text-inverse-ink' },
  'block-cream':  { bg: 'bg-block-cream',  text: 'text-ink' },
  'block-lilac':  { bg: 'bg-block-lilac',  text: 'text-ink' },
  'block-pink':   { bg: 'bg-block-pink',   text: 'text-ink' },
}

type Props = {
  block: ColorBlock
  eyebrow?: string
  title: string
  children?: React.ReactNode
  linkHref?: string
  linkText?: string
}

export function ColorBlockSection({ block, eyebrow, title, children, linkHref, linkText }: Props) {
  const style = blockStyles[block]
  return (
    <section className={cn('rounded-lg px-xxl py-xxl md:py-section my-section', style.bg, style.text)}>
      <div className="max-w-[65%]">
        {eyebrow && (
          <p className="font-mono uppercase tracking-wider text-eyebrow mb-md opacity-70">
            {eyebrow}
          </p>
        )}
        <h2 className="text-display-lg font-normal mb-lg">{title}</h2>
        {children && <div className="text-body-lg">{children}</div>}
        {linkHref && linkText && (
          <Link href={linkHref} className="inline-block mt-lg text-link font-medium underline underline-offset-4">
            {linkText} →
          </Link>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Write FilterPills component**

Write to `components/public/FilterPills.tsx`:
```tsx
'use client'

import { cn } from '@/lib/utils'

export type FilterOption = {
  label: string
  value: string
}

type Props = {
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

export function FilterPills({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-sm">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-pill px-lg py-xs text-button font-medium transition-colors',
            value === option.value
              ? 'bg-primary text-canvas'
              : 'bg-canvas text-ink border border-hairline hover:border-ink'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Write test**

Write to `__tests__/components/shared-components.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ColorBlockSection } from '@/components/public/ColorBlockSection'
import { FilterPills } from '@/components/public/FilterPills'

describe('ColorBlockSection', () => {
  it('renders title and eyebrow', () => {
    render(
      <ColorBlockSection block="block-lime" eyebrow="鸟类" title="天空之翼">
        <p>45种异兽</p>
      </ColorBlockSection>
    )
    expect(screen.getByText('天空之翼')).toBeInTheDocument()
    expect(screen.getByText('鸟类')).toBeInTheDocument()
    expect(screen.getByText('45种异兽')).toBeInTheDocument()
  })
})

describe('FilterPills', () => {
  it('renders all options', () => {
    const options = [
      { label: '全部', value: 'all' },
      { label: '鸟类', value: 'birds' },
    ]
    render(<FilterPills options={options} value="all" onChange={() => {}} />)
    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('鸟类')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run __tests__/components/shared-components.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add components/public/ __tests__/components/shared-components.test.tsx
git commit -m "feat: add TopNav, Footer, ColorBlockSection, FilterPills components"
```

---

## Task 6: Content Components (CreatureCard, StoryCard, MarkdownRenderer)

**Files:**
- Create: `components/public/CreatureCard.tsx`, `components/public/StoryCard.tsx`, `components/public/MarkdownRenderer.tsx`
- Test: `__tests__/components/content-components.test.tsx`

**Interfaces:**
- Consumes: `CreatureWithCategory`, `StoryWithCreature` types from `@/lib/supabase/types`
- Produces: `<CreatureCard>`, `<StoryCard>`, `<MarkdownRenderer>` components

- [ ] **Step 1: Write CreatureCard component**

Write to `components/public/CreatureCard.tsx`:
```tsx
import Link from 'next/link'
import Image from 'next/image'
import type { CreatureWithCategory } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const blockBarColors: Record<string, string> = {
  'block-lime': 'bg-block-lime',
  'block-coral': 'bg-block-coral',
  'block-mint': 'bg-block-mint',
  'block-navy': 'bg-block-navy',
  'block-cream': 'bg-block-cream',
  'block-lilac': 'bg-block-lilac',
  'block-pink': 'bg-block-pink',
}

type Props = {
  creature: CreatureWithCategory
}

export function CreatureCard({ creature }: Props) {
  const colorBar = creature.categories
    ? blockBarColors[creature.categories.color_block] || 'bg-surface-soft'
    : 'bg-surface-soft'

  return (
    <Link href={`/creatures/${creature.slug}`} className="block group">
      <div className="bg-surface-soft rounded-md overflow-hidden transition-shadow hover:shadow-soft">
        <div className={cn('h-1', colorBar)} />
        <div className="p-md">
          <div className="aspect-square relative rounded-md overflow-hidden bg-surface-soft mb-md">
            {creature.image_path ? (
              <Image
                src={creature.image_path}
                alt={creature.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center', colorBar)}>
                <span className="text-display-md font-medium">{creature.name}</span>
              </div>
            )}
          </div>
          <h3 className="text-card-title font-bold mb-xxs">{creature.name}</h3>
          <p className="text-caption text-gray-500 mb-xs font-mono uppercase tracking-wider">
            {creature.categories?.name} · {creature.attribute}
          </p>
          {creature.summary && (
            <p className="text-body-sm line-clamp-2 text-gray-700">{creature.summary}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Write StoryCard component**

Write to `components/public/StoryCard.tsx`:
```tsx
import Link from 'next/link'
import Image from 'next/image'
import type { StoryWithCreature } from '@/lib/supabase/types'

type Props = {
  story: StoryWithCreature
}

export function StoryCard({ story }: Props) {
  return (
    <Link href={`/stories/${story.slug}`} className="block group">
      <div className="bg-surface-soft rounded-md overflow-hidden transition-shadow hover:shadow-soft">
        <div className="aspect-[16/9] relative bg-surface-soft">
          {story.image_path ? (
            <Image
              src={story.image_path}
              alt={story.title}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-block-cream">
              <span className="text-display-sm font-medium text-ink">{story.title}</span>
            </div>
          )}
        </div>
        <div className="p-md">
          <h3 className="text-card-title font-bold mb-xs">{story.title}</h3>
          <p className="text-body-sm line-clamp-3 text-gray-700">
            {story.content.replace(/[#*>\-\[\]]/g, '').slice(0, 100)}...
          </p>
          {story.creatures && (
            <p className="text-caption text-gray-500 mt-xs font-mono uppercase tracking-wider">
              相关异兽: {story.creatures.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Write MarkdownRenderer component**

Write to `components/public/MarkdownRenderer.tsx`:
```tsx'
'use client'

import { useMemo } from 'react'

type Props = {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: Props) {
  const { body, knowledgeCard } = useMemo(() => {
    const parts = content.split(/\n---\n/)
    const body = parts[0]
    const knowledgeCard = parts.length > 1 ? parts.slice(1).join('\n---\n') : null
    return { body, knowledgeCard }
  }, [content])

  return (
    <div className={className}>
      <div className="prose prose-lg max-w-[720px] mx-auto">
        <SimpleMarkdown text={body} />
      </div>
      {knowledgeCard && (
        <div className="bg-block-cream rounded-lg p-xxl mt-xl max-w-[720px] mx-auto">
          <SimpleMarkdown text={knowledgeCard} />
        </div>
      )}
    </div>
  )
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-headline font-medium mt-xl mb-md">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-display-md font-medium mt-xl mb-md">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-display-lg font-normal mt-0 mb-lg">{line.slice(2)}</h1>)
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].replace(/^> ?/, ''))
        i++
      }
      elements.push(
        <blockquote key={i} className="border-l-2 border-ink pl-lg my-lg text-body-lg italic opacity-80">
          {quoteLines.join('\n')}
        </blockquote>
      )
      continue
    }
    // Horizontal rule (skip, handled by parent)
    else if (line === '---') {
      // skip
    }
    // Empty line
    else if (line.trim() === '') {
      // skip
    }
    // Paragraph
    else {
      elements.push(<p key={i} className="text-body leading-relaxed my-md">{renderInline(line)}</p>)
    }
    i++
  }

  return <>{elements}</>
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}
```

- [ ] **Step 4: Write test**

Write to `__tests__/components/content-components.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CreatureCard } from '@/components/public/CreatureCard'
import { StoryCard } from '@/components/public/StoryCard'
import type { CreatureWithCategory, StoryWithCreature } from '@/lib/supabase/types'

const mockCreature: CreatureWithCategory = {
  id: '1', name: '烛龙', slug: 'zhulong', summary: '掌控昼夜的神龙',
  origin: '《大荒北经》', appearance: '人面蛇身', abilities: '视为昼，瞑为夜',
  description: '详细解读', category_id: 'cat1', attribute: '凶兆',
  image_path: null, is_published: true, sort_order: 1,
  created_at: '', updated_at: '',
  categories: { id: 'cat1', name: '神灵/半神', slug: 'shenling', color_block: 'block-navy', sort_order: 4, created_at: '' }
}

const mockStory: StoryWithCreature = {
  id: '1', title: '烛龙故事', slug: 'zhulong-story',
  content: '很久很久以前...', creature_id: '1',
  image_path: null, is_published: true, sort_order: 1,
  created_at: '', updated_at: '',
  creatures: { id: '1', name: '烛龙', slug: 'zhulong', summary: '神龙', image_path: null, category_id: 'cat1' }
}

describe('CreatureCard', () => {
  it('renders creature name and summary', () => {
    render(<CreatureCard creature={mockCreature} />)
    expect(screen.getByText('烛龙')).toBeInTheDocument()
    expect(screen.getByText('掌控昼夜的神龙')).toBeInTheDocument()
  })
})

describe('StoryCard', () => {
  it('renders story title and related creature', () => {
    render(<StoryCard story={mockStory} />)
    expect(screen.getByText('烛龙故事')).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run __tests__/components/content-components.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/public/ __tests__/components/content-components.test.tsx
git commit -m "feat: add CreatureCard, StoryCard, MarkdownRenderer components"
```

---

## Task 7: Home Page

**Files:**
- Create: `app/(public)/page.tsx`
- Modify: `app/layout.tsx` (add TopNav + Footer wrapper)
- Test: `__tests__/components/home-page.test.tsx`

**Interfaces:**
- Consumes: `createServerClient` from `@/lib/supabase/server`, all public components
- Produces: Home page at `/`

- [ ] **Step 1: Update root layout to include TopNav and Footer**

Write to `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { TopNav } from '@/components/public/TopNav'
import { Footer } from '@/components/public/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '山海图鉴 — 山海经奇珍异兽视觉百科',
  description: '探索《山海经》奇珍异兽的视觉百科图鉴',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <TopNav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Write the home page**

Write to `app/(public)/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { ColorBlockSection } from '@/components/public/ColorBlockSection'
import { CreatureCard } from '@/components/public/CreatureCard'
import { StoryCard } from '@/components/public/StoryCard'
import type { CreatureWithCategory, StoryWithCreature, Category } from '@/lib/supabase/types'

export const revalidate = 3600 // ISR: revalidate every hour

const marqueeQuotes = [
  '见则天下安宁',
  '能食人',
  '食者不蛊',
  '见则天下大旱',
  '佩之宜子孙',
  '见则其国大穰',
]

export default async function HomePage() {
  const supabase = await createServerClient()

  const [
    { data: creatures },
    { data: stories },
    { data: categories },
  ] = await Promise.all([
    supabase.from('creatures').select('*, categories(*)').eq('is_published', true).order('sort_order'),
    supabase.from('stories').select('*, creatures(id, name, slug, summary, image_path, category_id)').eq('is_published', true).order('sort_order'),
    supabase.from('categories').order('sort_order'),
  ])

  const typedCreatures = (creatures || []) as unknown as CreatureWithCategory[]
  const typedStories = (stories || []) as unknown as StoryWithCreature[]
  const typedCategories = (categories || []) as unknown as Category[]

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl">
      {/* Hero */}
      <section className="py-section text-center">
        <h1 className="text-display-xl font-normal mb-lg">山海图鉴</h1>
        <p className="text-body-lg max-w-2xl mx-auto">
          探索《山海经》奇珍异兽的视觉百科
        </p>
      </section>

      {/* Marquee Strip */}
      <div className="bg-inverse-canvas text-inverse-ink py-sm overflow-hidden">
        <div className="flex gap-xl whitespace-nowrap text-body-sm font-mono uppercase tracking-wider">
          {marqueeQuotes.map((quote, i) => (
            <span key={i}>{quote} · </span>
          ))}
        </div>
      </div>

      {/* Featured Creatures */}
      <section className="py-section">
        <p className="font-mono uppercase tracking-wider text-eyebrow mb-md opacity-70">精选异兽</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          {typedCreatures.map((creature) => (
            <CreatureCard key={creature.id} creature={creature} />
          ))}
        </div>
      </section>

      {/* Category Color Blocks */}
      {typedCategories.map((category) => (
        <ColorBlockSection
          key={category.id}
          block={category.color_block as 'block-lime'}
          eyebrow={category.name}
          title={getCategoryTitle(category.name)}
          linkHref={`/creatures?category=${category.slug}`}
          linkText={`查看全部${category.name}`}
        >
          <p>{getCategoryDescription(category.name)}</p>
        </ColorBlockSection>
      ))}

      {/* Story Entries */}
      <section className="py-section">
        <p className="font-mono uppercase tracking-wider text-eyebrow mb-md opacity-70">神话故事</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {typedStories.slice(0, 4).map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>
    </div>
  )
}

function getCategoryTitle(name: string): string {
  const titles: Record<string, string> = {
    '鸟类': '天空之翼',
    '兽类': '大地之灵',
    '鱼类/水生类': '深渊之鳞',
    '神灵/半神': '混沌之主',
    '异族/国度': '八荒之民',
    '蛇/爬虫类': '幽暗之蟒',
  }
  return titles[name] || name
}

function getCategoryDescription(name: string): string {
  const descriptions: Record<string, string> = {
    '鸟类': '45种，占全书26%。凤凰、毕方、精卫……翱翔于山海之间的神鸟。',
    '兽类': '42种，占全书25%。九尾狐、穷奇、饕餮……行走于大地之上的异兽。',
    '鱼类/水生类': '30种，占全书18%。赤鱬、文鳐鱼、巴蛇……潜游于深渊之中的生灵。',
    '神灵/半神': '22种，占全书13%。西王母、烛龙、应龙……掌控天地法则的神灵。',
    '异族/国度': '17种，占全书10%。夸父、刑天、不死民……散居八荒的异族之民。',
    '蛇/爬虫类': '15种，占全书9%。肥遗、相柳、鸣蛇……蜿蜒于幽暗之中的爬虫。',
  }
  return descriptions[name] || ''
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds (may need Supabase env vars or will use fallback).

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx "app/(public)/page.tsx"
git commit -m "feat: add home page with hero, marquee, creature grid, color blocks, story entries"
```

---

## Task 8: Creatures List & Detail Pages

**Files:**
- Create: `app/(public)/creatures/page.tsx`, `app/(public)/creatures/[slug]/page.tsx`
- Test: `__tests__/components/creatures-pages.test.tsx`

**Interfaces:**
- Consumes: `createServerClient`, `CreatureCard`, `FilterPills`, `ColorBlockSection`, `MarkdownRenderer`
- Produces: `/creatures` (list with filter), `/creatures/[slug]` (detail)

- [ ] **Step 1: Write creatures list page**

Write to `app/(public)/creatures/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { CreatureCard } from '@/components/public/CreatureCard'
import { FilterPillsClient } from './filter-client'
import type { CreatureWithCategory, Category } from '@/lib/supabase/types'

export const revalidate = 3600

export default async function CreaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: categoryFilter } = await searchParams
  const supabase = await createServerClient()

  const [{ data: creatures }, { data: categories }] = await Promise.all([
    supabase.from('creatures').select('*, categories(*)').eq('is_published', true).order('sort_order'),
    supabase.from('categories').order('sort_order'),
  ])

  const typedCreatures = (creatures || []) as unknown as CreatureWithCategory[]
  const typedCategories = (categories || []) as unknown as Category[]

  const filtered = categoryFilter
    ? typedCreatures.filter((c) => c.categories?.slug === categoryFilter)
    : typedCreatures

  const filterOptions = [
    { label: '全部', value: 'all' },
    ...typedCategories.map((c) => ({ label: c.name, value: c.slug })),
  ]

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <h1 className="text-display-lg font-normal mb-sm">异兽图鉴</h1>
      <p className="text-body-lg text-gray-600 mb-xl">共收录 {typedCreatures.length} 种山海经奇珍异兽</p>

      <div className="mb-xl">
        <FilterPillsClient options={filterOptions} initialValue={categoryFilter || 'all'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        {filtered.map((creature) => (
          <CreatureCard key={creature.id} creature={creature} />
        ))}
      </div>
    </div>
  )
}
```

Write to `app/(public)/creatures/filter-client.tsx`:
```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FilterPills } from '@/components/public/FilterPills'
import type { FilterOption } from '@/components/public/FilterPills'

export function FilterPillsClient({ options, initialValue }: { options: FilterOption[]; initialValue: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <FilterPills
      options={options}
      value={initialValue}
      onChange={(value) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
          params.delete('category')
        } else {
          params.set('category', value)
        }
        router.push(`/creatures?${params.toString()}`)
      }}
    />
  )
}
```

- [ ] **Step 2: Write creature detail page**

Write to `app/(public)/creatures/[slug]/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { ColorBlockSection } from '@/components/public/ColorBlockSection'
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer'
import { StoryCard } from '@/components/public/StoryCard'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { CreatureWithCategory, StoryWithCreature } from '@/lib/supabase/types'

export const revalidate = 3600

export default async function CreatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: creature } = await supabase
    .from('creatures')
    .select('*, categories(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!creature) notFound()

  const typedCreature = creature as unknown as CreatureWithCategory

  const { data: stories } = await supabase
    .from('stories')
    .select('*, creatures(id, name, slug, summary, image_path, category_id)')
    .eq('creature_id', typedCreature.id)
    .eq('is_published', true)

  const typedStories = (stories || []) as unknown as StoryWithCreature[]
  const category = typedCreature.categories

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <Link href="/creatures" className="text-body-sm text-gray-500 hover:text-ink mb-lg inline-block">
        ← 返回图鉴
      </Link>

      {/* Header: image + info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-section">
        <div className="aspect-square relative rounded-lg overflow-hidden bg-surface-soft">
          {typedCreature.image_path ? (
            <Image
              src={typedCreature.image_path}
              alt={typedCreature.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-block-cream">
              <span className="text-display-xl font-normal">{typedCreature.name}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <p className="font-mono uppercase tracking-wider text-eyebrow mb-sm opacity-70">
            {category?.name} · {typedCreature.attribute}
          </p>
          <h1 className="text-display-lg font-normal mb-md">{typedCreature.name}</h1>
          {typedCreature.summary && (
            <p className="text-body-lg text-gray-700 mb-lg">{typedCreature.summary}</p>
          )}
          {typedCreature.origin && (
            <p className="text-caption text-gray-500 font-mono uppercase tracking-wider">
              出处: {typedCreature.origin}
            </p>
          )}
        </div>
      </div>

      {/* Appearance section (color block) */}
      {typedCreature.appearance && (
        <ColorBlockSection
          block={(category?.color_block || 'block-cream') as 'block-cream'}
          eyebrow="外形特征"
          title={`${typedCreature.name}的模样`}
        >
          <p>{typedCreature.appearance}</p>
        </ColorBlockSection>
      )}

      {/* Abilities section (white) */}
      {typedCreature.abilities && (
        <section className="py-section max-w-[720px] mx-auto">
          <h2 className="text-headline font-medium mb-md">特殊能力 / 寓意</h2>
          <p className="text-body text-gray-700">{typedCreature.abilities}</p>
        </section>
      )}

      {/* Detailed description (navy block) */}
      {typedCreature.description && (
        <ColorBlockSection block="block-navy" eyebrow="详细解读" title={typedCreature.name}>
          <MarkdownRenderer content={typedCreature.description} />
        </ColorBlockSection>
      )}

      {/* Related stories */}
      {typedStories.length > 0 && (
        <section className="py-section">
          <h2 className="text-headline font-medium mb-lg">相关故事</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {typedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/creatures/"
git commit -m "feat: add creatures list page with filter and creature detail page"
```

---

## Task 9: Stories List, Detail & About Pages

**Files:**
- Create: `app/(public)/stories/page.tsx`, `app/(public)/stories/[slug]/page.tsx`, `app/(public)/about/page.tsx`
- Test: `__tests__/components/stories-pages.test.tsx`

**Interfaces:**
- Consumes: `createServerClient`, `StoryCard`, `MarkdownRenderer`, `CreatureCard`
- Produces: `/stories` (list), `/stories/[slug]` (detail), `/about`

- [ ] **Step 1: Write stories list page**

Write to `app/(public)/stories/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { StoryCard } from '@/components/public/StoryCard'
import type { StoryWithCreature } from '@/lib/supabase/types'

export const revalidate = 3600

export default async function StoriesPage() {
  const supabase = await createServerClient()
  const { data: stories } = await supabase
    .from('stories')
    .select('*, creatures(id, name, slug, summary, image_path, category_id)')
    .eq('is_published', true)
    .order('sort_order')

  const typedStories = (stories || []) as unknown as StoryWithCreature[]

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <h1 className="text-display-lg font-normal mb-sm">神话故事</h1>
      <p className="text-body-lg text-gray-600 mb-xl">共 {typedStories.length} 篇山海经神话故事</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {typedStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write story detail page**

Write to `app/(public)/stories/[slug]/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { StoryWithCreature } from '@/lib/supabase/types'

export const revalidate = 3600

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: story } = await supabase
    .from('stories')
    .select('*, creatures(id, name, slug, summary, image_path, category_id)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!story) notFound()

  const typedStory = story as unknown as StoryWithCreature

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <Link href="/stories" className="text-body-sm text-gray-500 hover:text-ink mb-lg inline-block">
        ← 返回故事列表
      </Link>

      {/* Hero */}
      <div className="text-center mb-section">
        <h1 className="text-display-lg font-normal mb-lg">{typedStory.title}</h1>
        {typedStory.image_path && (
          <div className="aspect-[16/9] relative rounded-lg overflow-hidden max-w-3xl mx-auto">
            <Image
              src={typedStory.image_path}
              alt={typedStory.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <MarkdownRenderer content={typedStory.content} />

      {/* Related creature */}
      {typedStory.creatures && (
        <section className="py-section border-t border-hairline mt-section">
          <p className="font-mono uppercase tracking-wider text-eyebrow mb-md opacity-70">相关异兽</p>
          <Link
            href={`/creatures/${typedStory.creatures.slug}`}
            className="flex items-center gap-lg bg-surface-soft rounded-md p-lg hover:shadow-soft transition-shadow"
          >
            <div className="w-20 h-20 relative rounded-md overflow-hidden bg-surface-soft flex-shrink-0">
              {typedStory.creatures.image_path ? (
                <Image
                  src={typedStory.creatures.image_path}
                  alt={typedStory.creatures.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-block-cream">
                  <span className="text-body-sm font-medium">{typedStory.creatures.name}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-card-title font-bold">{typedStory.creatures.name}</h3>
              {typedStory.creatures.summary && (
                <p className="text-body-sm text-gray-600">{typedStory.creatures.summary}</p>
              )}
              <p className="text-link font-medium mt-xs">查看详情 →</p>
            </div>
          </Link>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write about page**

Write to `app/(public)/about/page.tsx`:
```tsx
import { ColorBlockSection } from '@/components/public/ColorBlockSection'

export const revalidate = 3600

export default function AboutPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <h1 className="text-display-lg font-normal mb-xl">关于山海图鉴</h1>

      <div className="max-w-[720px] mx-auto">
        <p className="text-body-lg text-gray-700 mb-lg">
          《山海经》是中国上古古籍，全书十八卷，涵盖约448座山川及四海八荒，记载约171种不重复异兽。
          本图鉴一期收录其中15种最具代表性的奇珍异兽及其神话故事。
        </p>
        <p className="text-body text-gray-700 mb-lg">
          从掌控昼夜的烛龙，到百鸟之王凤凰；从贪婪之兽饕餮，到衔木填海的精卫——每一种异兽都承载着先民对自然、宇宙和人性的想象。
        </p>
      </div>

      <ColorBlockSection block="block-cream" eyebrow="数据来源" title="内容依据">
        <p className="mb-md">
          本图鉴内容基于《山海经》全十八卷系统整理，涵盖山经五卷、海外经四卷、海内经四卷、大荒经四卷、海内经一卷。
        </p>
        <p>
          异兽分类遵循原文的物种类别（鸟类、兽类、鱼类/水生类、蛇/爬虫类、神灵/半神、异族/国度）和吉凶属性（祥瑞、凶兆、食人、药用、中性）两个维度。
        </p>
      </ColorBlockSection>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/stories/" "app/(public)/about/"
git commit -m "feat: add stories list, story detail, and about pages"
```

---

## Task 10: Admin Auth & Layout & Dashboard

**Files:**
- Create: `app/admin/login/page.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx`, `components/admin/AdminLayout.tsx`, `components/admin/Sidebar.tsx`, `app/not-found.tsx`
- Test: `__tests__/components/admin-auth.test.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client`, `createServerClient`
- Produces: Admin login, auth-protected layout, dashboard

- [ ] **Step 1: Write admin login page**

Write to `app/admin/login/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-lg">
      <div className="w-full max-w-md">
        <h1 className="text-display-md font-medium mb-xl text-center">管理员登录</h1>
        <form onSubmit={handleSubmit} className="space-y-lg">
          <div>
            <label className="block text-body-sm font-medium mb-xs">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-hairline px-md py-sm text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium mb-xs">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-hairline px-md py-sm text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          {error && <p className="text-body-sm text-accent-magenta">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-primary text-canvas py-sm text-button font-medium disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write admin layout (auth guard)**

Write to `app/admin/layout.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Check if user has admin role (via user metadata or a profiles table)
  // For Phase 1, any authenticated user is admin
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-xl overflow-auto">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write Sidebar component**

Write to `components/admin/Sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: '控制台' },
  { href: '/admin/creatures', label: '异兽' },
  { href: '/admin/stories', label: '故事' },
  { href: '/admin/categories', label: '分类' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-[200px] border-r border-hairline bg-canvas flex flex-col">
      <div className="p-lg border-b border-hairline">
        <Link href="/admin" className="text-display-sm font-medium">山海图鉴</Link>
        <p className="text-caption text-gray-500 mt-xxs font-mono uppercase tracking-wider">管理后台</p>
      </div>
      <nav className="flex-1 py-md">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-lg py-sm text-body-sm font-medium',
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                ? 'bg-surface-soft text-ink'
                : 'text-gray-500 hover:text-ink'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-lg border-t border-hairline">
        <button
          onClick={handleLogout}
          className="text-body-sm text-gray-500 hover:text-ink"
        >
          退出登录
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Write dashboard page**

Write to `app/admin/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createServerClient()

  const [
    { count: creatureCount },
    { count: publishedCreatureCount }
  ] = await Promise.all([
    supabase.from('creatures').select('*', { count: 'exact', head: true }),
    supabase.from('creatures').select('*', { count: 'exact', head: true }).eq('is_published', true),
  ])

  const [
    { count: storyCount }
  ] = await Promise.all([
    supabase.from('stories').select('*', { count: 'exact', head: true }),
  ])

  const [
    { count: publishedStoryCount }
  ] = await Promise.all([
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('is_published', true),
  ])

  const [
    { count: categoryCount }
  ] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <h1 className="text-display-md font-medium mb-xl">控制台</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        <div className="bg-surface-soft rounded-md p-xl">
          <p className="text-caption text-gray-500 font-mono uppercase tracking-wider mb-xs">异兽</p>
          <p className="text-display-md font-medium">{creatureCount || 0}</p>
          <p className="text-body-sm text-gray-500">已发布 {publishedCreatureCount || 0}</p>
          <Link href="/admin/creatures" className="text-body-sm text-gray-700 hover:text-ink mt-sm inline-block">管理 →</Link>
        </div>
        <div className="bg-surface-soft rounded-md p-xl">
          <p className="text-caption text-gray-500 font-mono uppercase tracking-wider mb-xs">故事</p>
          <p className="text-display-md font-medium">{storyCount || 0}</p>
          <p className="text-body-sm text-gray-500">已发布 {publishedStoryCount || 0}</p>
          <Link href="/admin/stories" className="text-body-sm text-gray-700 hover:text-ink mt-sm inline-block">管理 →</Link>
        </div>
        <div className="bg-surface-soft rounded-md p-xl">
          <p className="text-caption text-gray-500 font-mono uppercase tracking-wider mb-xs">分类</p>
          <p className="text-display-md font-medium">{categoryCount || 0}</p>
          <Link href="/admin/categories" className="text-body-sm text-gray-700 hover:text-ink mt-sm inline-block">管理 →</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write custom 404 page**

Write to `app/not-found.tsx`:
```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-inverse-canvas text-inverse-ink">
      <div className="text-center">
        <h1 className="text-display-lg font-normal mb-md">异兽未找到</h1>
        <p className="text-body-lg opacity-70 mb-xl">这片山林中似乎没有你要找的生灵</p>
        <Link href="/" className="inline-block rounded-pill bg-canvas text-ink px-lg py-xs text-button font-medium">
          返回首页
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add app/admin/login/ app/admin/layout.tsx app/admin/page.tsx components/admin/Sidebar.tsx app/not-found.tsx
git commit -m "feat: add admin login, auth-guarded layout, sidebar, dashboard, 404 page"
```

---

## Task 11: Admin ImageUploader & MarkdownEditor Components

**Files:**
- Create: `components/admin/ImageUploader.tsx`, `components/admin/MarkdownEditor.tsx`
- Test: `__tests__/components/admin-components.test.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client`
- Produces: `<ImageUploader>`, `<MarkdownEditor>` components

- [ ] **Step 1: Write ImageUploader component**

Write to `components/admin/ImageUploader.tsx`:
```tsx
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Props = {
  bucket: string
  path: string
  value: string | null
  onChange: (url: string | null) => void
}

export function ImageUploader({ bucket, path, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('图片不超过 5MB')
      return
    }

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp'
    const filePath = `${path}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed border-hairline rounded-md p-xl text-center cursor-pointer hover:border-ink transition-colors',
          value && 'bg-surface-soft'
        )}
      >
        {value ? (
          <div className="space-y-sm">
            <img src={value} alt="预览" className="max-h-48 mx-auto rounded-md" />
            <p className="text-body-sm text-gray-500">点击替换</p>
          </div>
        ) : (
          <div className="space-y-sm">
            <p className="text-body-sm text-gray-500">拖拽或点击上传图片</p>
            <p className="text-caption text-gray-400">支持 webp/jpg/png, 最大 5MB</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png"
        onChange={handleUpload}
        className="hidden"
      />
      {uploading && <p className="text-body-sm text-gray-500 mt-xs">上传中...</p>}
      {error && <p className="text-body-sm text-accent-magenta mt-xs">{error}</p>}
      {value && (
        <button
          onClick={() => onChange(null)}
          className="text-body-sm text-gray-500 hover:text-ink mt-xs"
        >
          移除图片
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write MarkdownEditor component**

Write to `components/admin/MarkdownEditor.tsx`:
```tsx
'use client'

import dynamic from 'next/dynamic'
import type { ReactMarkdownMarkdownEditorProps } from '@uiw/react-md-editor'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
)

type Props = {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function MarkdownEditor({ value, onChange, label }: Props) {
  return (
    <div>
      {label && (
        <label className="block text-body-sm font-medium mb-xs">{label}</label>
      )}
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={300}
        preview="live"
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/ImageUploader.tsx components/admin/MarkdownEditor.tsx
git commit -m "feat: add ImageUploader and MarkdownEditor admin components"
```

---

## Task 12: Admin Creatures CRUD

**Files:**
- Create: `app/admin/creatures/page.tsx`, `app/admin/creatures/new/page.tsx`, `app/admin/creatures/[id]/page.tsx`, `components/admin/CreatureForm.tsx`
- Test: Manual verification

**Interfaces:**
- Consumes: `createClient`, `ImageUploader`, `MarkdownEditor`, `Category` type
- Produces: Full CRUD for creatures at `/admin/creatures`

- [ ] **Step 1: Write CreatureForm component**

Write to `components/admin/CreatureForm.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageUploader } from './ImageUploader'
import { MarkdownEditor } from './MarkdownEditor'
import { slugify } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Category, Creature } from '@/lib/supabase/types'

type Props = {
  creature?: Creature
  categories: Category[]
}

export function CreatureForm({ creature, categories }: Props) {
  const isEditing = !!creature
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(creature?.name || '')
  const [slug, setSlug] = useState(creature?.slug || '')
  const [summary, setSummary] = useState(creature?.summary || '')
  const [origin, setOrigin] = useState(creature?.origin || '')
  const [appearance, setAppearance] = useState(creature?.appearance || '')
  const [abilities, setAbilities] = useState(creature?.abilities || '')
  const [description, setDescription] = useState(creature?.description || '')
  const [categoryId, setCategoryId] = useState(creature?.category_id || '')
  const [attribute, setAttribute] = useState(creature?.attribute || '')
  const [imagePath, setImagePath] = useState<string | null>(creature?.image_path || null)
  const [isPublished, setIsPublished] = useState(creature?.is_published || false)
  const [sortOrder, setSortOrder] = useState(creature?.sort_order || 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(publish: boolean) {
    setSaving(true)
    setError(null)

    const data = {
      name,
      slug: slug || slugify(name),
      summary: summary || null,
      origin: origin || null,
      appearance: appearance || null,
      abilities: abilities || null,
      description: description || null,
      category_id: categoryId || null,
      attribute: attribute || null,
      image_path: imagePath,
      is_published: publish,
      sort_order: sortOrder,
    }

    let response
    if (isEditing) {
      response = await supabase.from('creatures').update(data).eq('id', creature!.id)
    } else {
      response = await supabase.from('creatures').insert(data)
    }

    if (response.error) {
      setError(response.error.message)
      setSaving(false)
      return
    }

    // Trigger ISR revalidation
    await fetch(`/api/revalidate?secret=${process.env.NEXT_PUBLIC_REVALIDATE_SECRET || ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/creatures', `/creatures/${data.slug}`, '/'] }),
    })

    router.push('/admin/creatures')
    router.refresh()
  }

  async function handleDelete() {
    if (!isEditing) return
    if (!confirm('确认删除此异兽？')) return

    const { error } = await supabase.from('creatures').delete().eq('id', creature!.id)
    if (error) {
      setError(error.message)
      return
    }

    await fetch(`/api/revalidate?secret=${process.env.NEXT_PUBLIC_REVALIDATE_SECRET || ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/creatures', '/'] }),
    })

    router.push('/admin/creatures')
    router.refresh()
  }

  return (
    <div className="space-y-xl max-w-2xl">
      <h1 className="text-display-md font-medium">{isEditing ? '编辑异兽' : '新增异兽'}</h1>

      {error && <p className="text-body-sm text-accent-magenta">{error}</p>}

      <div>
        <label className="block text-body-sm font-medium mb-xs">名称</label>
        <input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">Slug (URL)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div className="grid grid-cols-2 gap-lg">
        <div>
          <label className="block text-body-sm font-medium mb-xs">分类</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-hairline px-md py-sm text-body">
            <option value="">无</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-body-sm font-medium mb-xs">属性</label>
          <select value={attribute} onChange={(e) => setAttribute(e.target.value)}
            className="w-full rounded-md border border-hairline px-md py-sm text-body">
            <option value="">无</option>
            <option value="祥瑞">祥瑞</option>
            <option value="凶兆">凶兆</option>
            <option value="食人">食人</option>
            <option value="药用">药用</option>
            <option value="中性">中性</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">出处</label>
        <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="如：《大荒北经》《海外北经》"
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">配图</label>
        <ImageUploader bucket="shanhaijing-assets" path={`creatures/${slug || slugify(name)}`} value={imagePath} onChange={setImagePath} />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">简介</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <MarkdownEditor label="外形特征" value={appearance} onChange={setAppearance} />
      <MarkdownEditor label="特殊能力/寓意" value={abilities} onChange={setAbilities} />
      <MarkdownEditor label="详细解读" value={description} onChange={setDescription} />

      <div>
        <label className="block text-body-sm font-medium mb-xs">排序</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-24 rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div className="flex gap-sm">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="rounded-pill border border-hairline px-lg py-xs text-button font-medium disabled:opacity-50">
          保存草稿
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="rounded-pill bg-primary text-canvas px-lg py-xs text-button font-medium disabled:opacity-50">
          发布
        </button>
        {isEditing && (
          <button onClick={handleDelete} disabled={saving}
            className="rounded-pill text-accent-magenta px-lg py-xs text-button font-medium ml-auto">
            删除
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write creatures list page**

Write to `app/admin/creatures/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { CreatureWithCategory } from '@/lib/supabase/types'

export default async function AdminCreaturesPage() {
  const supabase = await createServerClient()
  const { data: creatures } = await supabase
    .from('creatures')
    .select('*, categories(*)')
    .order('sort_order')

  const typed = (creatures || []) as unknown as CreatureWithCategory[]

  return (
    <div>
      <div className="flex items-center justify-between mb-xl">
        <h1 className="text-display-md font-medium">异兽管理</h1>
        <Link href="/admin/creatures/new" className="rounded-pill bg-primary text-canvas px-lg py-xs text-button font-medium">
          + 新增异兽
        </Link>
      </div>

      <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">名称</th>
              <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">分类</th>
              <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">属性</th>
              <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">状态</th>
              <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {typed.map((c) => (
              <tr key={c.id} className="border-b border-hairline-soft">
                <td className="px-lg py-sm text-body-sm">{c.name}</td>
                <td className="px-lg py-sm text-body-sm text-gray-500">{c.categories?.name || '—'}</td>
                <td className="px-lg py-sm text-body-sm text-gray-500">{c.attribute || '—'}</td>
                <td className="px-lg py-sm text-body-sm">
                  {c.is_published ? <span className="text-semantic-success">已发布</span> : <span className="text-gray-400">草稿</span>}
                </td>
                <td className="px-lg py-sm">
                  <Link href={`/admin/creatures/${c.id}`} className="text-body-sm text-gray-700 hover:text-ink">编辑</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write new creature page**

Write to `app/admin/creatures/new/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { CreatureForm } from '@/components/admin/CreatureForm'
import type { Category } from '@/lib/supabase/types'

export default async function NewCreaturePage() {
  const supabase = await createServerClient()
  const { data: categories } = await supabase.from('categories').order('sort_order')
  const typedCategories = (categories || []) as unknown as Category[]

  return <CreatureForm categories={typedCategories} />
}
```

- [ ] **Step 4: Write edit creature page**

Write to `app/admin/creatures/[id]/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { CreatureForm } from '@/components/admin/CreatureForm'
import type { Category, Creature } from '@/lib/supabase/types'

export default async function EditCreaturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: creature }, { data: categories }] = await Promise.all([
    supabase.from('creatures').select('*').eq('id', id).single(),
    supabase.from('categories').order('sort_order'),
  ])

  return (
    <CreatureForm
      creature={creature as unknown as Creature}
      categories={(categories || []) as unknown as Category[]}
    />
  )
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/admin/creatures/ components/admin/CreatureForm.tsx
git commit -m "feat: add admin creatures CRUD — list, new, edit, delete"
```

---

## Task 13: Admin Stories & Categories CRUD

**Files:**
- Create: `app/admin/stories/page.tsx`, `app/admin/stories/new/page.tsx`, `app/admin/stories/[id]/page.tsx`, `components/admin/StoryForm.tsx`, `app/admin/categories/page.tsx`
- Test: Manual verification

**Interfaces:**
- Consumes: `createClient`, `ImageUploader`, `MarkdownEditor`, `Creature` type
- Produces: Full CRUD for stories and categories

- [ ] **Step 1: Write StoryForm component**

Write to `components/admin/StoryForm.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageUploader } from './ImageUploader'
import { MarkdownEditor } from './MarkdownEditor'
import { slugify } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Story, Creature } from '@/lib/supabase/types'

type Props = {
  story?: Story
  creatures: Pick<Creature, 'id' | 'name'>[]
}

export function StoryForm({ story, creatures }: Props) {
  const isEditing = !!story
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(story?.title || '')
  const [slug, setSlug] = useState(story?.slug || '')
  const [content, setContent] = useState(story?.content || '')
  const [creatureId, setCreatureId] = useState(story?.creature_id || '')
  const [imagePath, setImagePath] = useState<string | null>(story?.image_path || null)
  const [isPublished, setIsPublished] = useState(story?.is_published || false)
  const [sortOrder, setSortOrder] = useState(story?.sort_order || 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(publish: boolean) {
    setSaving(true)
    setError(null)

    const data = {
      title,
      slug: slug || slugify(title),
      content,
      creature_id: creatureId || null,
      image_path: imagePath,
      is_published: publish,
      sort_order: sortOrder,
    }

    let response
    if (isEditing) {
      response = await supabase.from('stories').update(data).eq('id', story!.id)
    } else {
      response = await supabase.from('stories').insert(data)
    }

    if (response.error) {
      setError(response.error.message)
      setSaving(false)
      return
    }

    await fetch(`/api/revalidate?secret=${process.env.NEXT_PUBLIC_REVALIDATE_SECRET || ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/stories', `/stories/${data.slug}`, '/'] }),
    })

    router.push('/admin/stories')
    router.refresh()
  }

  async function handleDelete() {
    if (!isEditing) return
    if (!confirm('确认删除此故事？')) return

    const { error } = await supabase.from('stories').delete().eq('id', story!.id)
    if (error) { setError(error.message); return }

    await fetch(`/api/revalidate?secret=${process.env.NEXT_PUBLIC_REVALIDATE_SECRET || ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/stories', '/'] }),
    })

    router.push('/admin/stories')
    router.refresh()
  }

  return (
    <div className="space-y-xl max-w-2xl">
      <h1 className="text-display-md font-medium">{isEditing ? '编辑故事' : '新增故事'}</h1>
      {error && <p className="text-body-sm text-accent-magenta">{error}</p>}

      <div>
        <label className="block text-body-sm font-medium mb-xs">标题</label>
        <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">关联异兽</label>
        <select value={creatureId} onChange={(e) => setCreatureId(e.target.value)}
          className="w-full rounded-md border border-hairline px-md py-sm text-body">
          <option value="">无</option>
          {creatures.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">配图</label>
        <ImageUploader bucket="shanhaijing-assets" path={`stories/${slug || slugify(title)}`} value={imagePath} onChange={setImagePath} />
      </div>

      <MarkdownEditor label="故事正文" value={content} onChange={setContent} />

      <div>
        <label className="block text-body-sm font-medium mb-xs">排序</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-24 rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div className="flex gap-sm">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="rounded-pill border border-hairline px-lg py-xs text-button font-medium disabled:opacity-50">保存草稿</button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="rounded-pill bg-primary text-canvas px-lg py-xs text-button font-medium disabled:opacity-50">发布</button>
        {isEditing && (
          <button onClick={handleDelete} disabled={saving}
            className="rounded-pill text-accent-magenta px-lg py-xs text-button font-medium ml-auto">删除</button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write admin stories pages**

Write to `app/admin/stories/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { StoryWithCreature } from '@/lib/supabase/types'

export default async function AdminStoriesPage() {
  const supabase = await createServerClient()
  const { data: stories } = await supabase
    .from('stories')
    .select('*, creatures(id, name)')
    .order('sort_order')
  const typed = (stories || []) as unknown as StoryWithCreature[]

  return (
    <div>
      <div className="flex items-center justify-between mb-xl">
        <h1 className="text-display-md font-medium">故事管理</h1>
        <Link href="/admin/stories/new" className="rounded-pill bg-primary text-canvas px-lg py-xs text-button font-medium">+ 新增故事</Link>
      </div>
      <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-hairline">
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">标题</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">关联异兽</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">状态</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>
            {typed.map((s) => (
              <tr key={s.id} className="border-b border-hairline-soft">
                <td className="px-lg py-sm text-body-sm">{s.title}</td>
                <td className="px-lg py-sm text-body-sm text-gray-500">{s.creatures?.name || '—'}</td>
                <td className="px-lg py-sm text-body-sm">{s.is_published ? <span className="text-semantic-success">已发布</span> : <span className="text-gray-400">草稿</span>}</td>
                <td className="px-lg py-sm"><Link href={`/admin/stories/${s.id}`} className="text-body-sm text-gray-700 hover:text-ink">编辑</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

Write to `app/admin/stories/new/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { StoryForm } from '@/components/admin/StoryForm'
import type { Creature } from '@/lib/supabase/types'

export default async function NewStoryPage() {
  const supabase = await createServerClient()
  const { data: creatures } = await supabase.from('creatures').select('id, name').order('name')
  return <StoryForm creatures={(creatures || []) as unknown as Pick<Creature, 'id' | 'name'>[]} />
}
```

Write to `app/admin/stories/[id]/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { StoryForm } from '@/components/admin/StoryForm'
import type { Story, Creature } from '@/lib/supabase/types'

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const [{ data: story }, { data: creatures }] = await Promise.all([
    supabase.from('stories').select('*').eq('id', id).single(),
    supabase.from('creatures').select('id, name').order('name'),
  ])
  return <StoryForm story={story as unknown as Story} creatures={(creatures || []) as unknown as Pick<Creature, 'id' | 'name'>[]} />
}
```

- [ ] **Step 3: Write categories page**

Write to `app/admin/categories/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import type { Category } from '@/lib/supabase/types'

const colorBlocks = [
  { label: 'Lime', value: 'block-lime' },
  { label: 'Coral', value: 'block-coral' },
  { label: 'Mint', value: 'block-mint' },
  { label: 'Navy', value: 'block-navy' },
  { label: 'Cream', value: 'block-cream' },
  { label: 'Lilac', value: 'block-lilac' },
  { label: 'Pink', value: 'block-pink' },
]

export default function CategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [colorBlock, setColorBlock] = useState('block-lime')
  const [sortOrder, setSortOrder] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').order('sort_order')
    setCategories((data || []) as unknown as Category[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = { name, slug: slug || slugify(name), color_block: colorBlock, sort_order: sortOrder }
    if (editingId) {
      await supabase.from('categories').update(data).eq('id', editingId)
    } else {
      await supabase.from('categories').insert(data)
    }
    setName(''); setSlug(''); setSortOrder(0); setEditingId(null)
    fetchCategories()
  }

  async function handleEdit(cat: Category) {
    setEditingId(cat.id); setName(cat.name); setSlug(cat.slug); setColorBlock(cat.color_block); setSortOrder(cat.sort_order)
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除此分类？')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  return (
    <div>
      <h1 className="text-display-md font-medium mb-xl">分类管理</h1>
      <form onSubmit={handleSubmit} className="space-y-sm mb-xl max-w-md">
        <div className="grid grid-cols-2 gap-sm">
          <input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }} placeholder="分类名称" className="rounded-md border border-hairline px-md py-sm text-body" />
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="rounded-md border border-hairline px-md py-sm text-body" />
        </div>
        <select value={colorBlock} onChange={(e) => setColorBlock(e.target.value)} className="rounded-md border border-hairline px-md py-sm text-body">
          {colorBlocks.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} placeholder="排序" className="w-24 rounded-md border border-hairline px-md py-sm text-body" />
        <button type="submit" className="rounded-pill bg-primary text-canvas px-lg py-xs text-button font-medium">{editingId ? '更新' : '新增'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setSlug('') }} className="ml-sm text-body-sm text-gray-500">取消</button>}
      </form>
      <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-hairline">
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">名称</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">色块</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">排序</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-hairline-soft">
                <td className="px-lg py-sm text-body-sm">{c.name}</td>
                <td className="px-lg py-sm"><div className={`inline-block w-6 h-6 rounded-sm ${c.color_block === 'block-navy' ? 'bg-block-navy' : `bg-${c.color_block}`}`} /></td>
                <td className="px-lg py-sm text-body-sm text-gray-500">{c.sort_order}</td>
                <td className="px-lg py-sm">
                  <button onClick={() => handleEdit(c)} className="text-body-sm text-gray-700 hover:text-ink">编辑</button>
                  <button onClick={() => handleDelete(c.id)} className="text-body-sm text-accent-magenta hover:text-ink ml-sm">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/admin/stories/ app/admin/categories/ components/admin/StoryForm.tsx
git commit -m "feat: add admin stories CRUD and categories management"
```

---

## Task 14: ISR Revalidation API

**Files:**
- Create: `app/api/revalidate/route.ts`
- Test: Manual verification

**Interfaces:**
- Consumes: `REVALIDATE_SECRET` env var, `revalidatePath` from `next/cache`
- Produces: POST `/api/revalidate` endpoint

- [ ] **Step 1: Write revalidation API route**

Write to `app/api/revalidate/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const paths: string[] = body.paths || ['/']

    for (const path of paths) {
      revalidatePath(path)
    }

    return NextResponse.json({ revalidated: true, paths })
  } catch (error) {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/revalidate/route.ts
git commit -m "feat: add ISR on-demand revalidation API endpoint"
```

---

## Task 15: Data Seeding Scripts

**Files:**
- Create: `scripts/seed/seed-categories.ts`, `scripts/seed/seed-creatures.ts`, `scripts/seed/seed-stories.ts`, `scripts/seed/run-all.ts`
- Test: `__tests__/components/seed-creatures.test.ts`

**Interfaces:**
- Consumes: `山海经奇珍异兽汇总.md`, `stories/*.md`, `createServiceClient`
- Produces: Scripts that populate Supabase with all initial content

- [ ] **Step 1: Write seed-categories script**

Write to `scripts/seed/seed-categories.ts`:
```ts
import { createServiceClient } from '@/lib/supabase/server'

const categories = [
  { name: '鸟类', slug: 'niao-lei', color_block: 'block-lime', sort_order: 0 },
  { name: '兽类', slug: 'shou-lei', color_block: 'block-coral', sort_order: 1 },
  { name: '鱼类/水生类', slug: 'yu-lei', color_block: 'block-mint', sort_order: 2 },
  { name: '神灵/半神', slug: 'shen-ling', color_block: 'block-navy', sort_order: 3 },
  { name: '异族/国度', slug: 'yi-zu', color_block: 'block-cream', sort_order: 4 },
  { name: '蛇/爬虫类', slug: 'she-lei', color_block: 'block-lilac', sort_order: 5 },
]

export async function seedCategories() {
  const supabase = createServiceClient()
  const { error } = await supabase.from('categories').upsert(categories, { onConflict: 'slug' })
  if (error) throw new Error(`Failed to seed categories: ${error.message}`)
  console.log(`✓ Seeded ${categories.length} categories`)
  return categories
}
```

- [ ] **Step 2: Write the creature-category mapping**

Write to `scripts/seed/seed-creatures.ts`:
```ts
import { readFileSync } from 'fs'
import { join } from 'path'
import { createServiceClient } from '@/lib/supabase/server'

// Hardcoded mapping: creature name → { category slug, attribute }
const creatureMeta: Record<string, { categorySlug: string; attribute: string; summary: string }> = {
  '烛龙':   { categorySlug: 'shen-ling', attribute: '凶兆', summary: '掌控昼夜的混沌之神' },
  '凤凰':   { categorySlug: 'niao-lei',  attribute: '祥瑞', summary: '百鸟之王，太平之兆' },
  '九尾狐': { categorySlug: 'shou-lei',  attribute: '凶兆', summary: '从瑞兽到妖狐的千年演变' },
  '饕餮':   { categorySlug: 'shou-lei',  attribute: '食人', summary: '贪婪之兽，青铜纹饰之源' },
  '穷奇':   { categorySlug: 'shou-lei',  attribute: '食人', summary: '助纣为虐的凶兽' },
  '帝江':   { categorySlug: 'shen-ling', attribute: '凶兆', summary: '无面目的混沌之神' },
  '精卫':   { categorySlug: 'niao-lei',  attribute: '中性', summary: '衔木填海，不屈之魂' },
  '夸父':   { categorySlug: 'yi-zu',     attribute: '中性', summary: '逐日英雄，悲壮之歌' },
  '刑天':   { categorySlug: 'shen-ling', attribute: '中性', summary: '断首不屈，猛志常在' },
  '西王母': { categorySlug: 'shen-ling', attribute: '凶兆', summary: '从豹尾虎齿到仙界至尊' },
  '应龙':   { categorySlug: 'shen-ling', attribute: '中性', summary: '助黄帝斩蚩尤的王权神兽' },
  '夔':     { categorySlug: 'shou-lei',  attribute: '凶兆', summary: '雷神之源，声震五百里' },
  '比翼鸟': { categorySlug: 'niao-lei',  attribute: '凶兆', summary: '生死相依，爱情的象征' },
  '巴蛇':   { categorySlug: 'she-lei',  attribute: '中性', summary: '蛇吞象，贪欲的化身' },
  '毕方':   { categorySlug: 'niao-lei',  attribute: '凶兆', summary: '火神一足鹤' },
}

function parseSummaryFile(): { name: string; origin: string; description: string }[] {
  const filePath = join(process.cwd(), '山海经奇珍异兽汇总.md')
  const content = readFileSync(filePath, 'utf-8')

  // Find "第三部分：著名异兽详细介绍"
  const partStart = content.indexOf('## 第三部分：著名异兽详细介绍')
  const partEnd = content.indexOf('## 第四部分')
  if (partStart === -1 || partEnd === -1) throw new Error('Cannot find creature section in summary file')

  const section = content.slice(partStart, partEnd)

  // Split by "---" delimiter
  const blocks = section.split('\n---\n').filter((b) => b.trim().startsWith('### '))

  return blocks.map((block) => {
    const lines = block.split('\n')
    // Parse name from heading: "### 一、烛龙（烛九阴）——混沌之神，掌控昼夜"
    const heading = lines.find((l) => l.startsWith('### ')) || ''
    const headingText = heading.replace(/^### \S+、/, '') // Remove "### 一、"
    // Extract name: text before "——" or "（"
    const name = headingText.split(/[——（]/)[0].trim()

    // Parse origin from blockquote: "> **出处**：..."
    const originLine = lines.find((l) => l.includes('**出处**')) || ''
    const origin = originLine.replace(/^>.*\*\*出处\*\*：/, '').trim()

    // Everything after "详细解读" is the description
    const descStart = lines.findIndex((l) => l.includes('**详细解读**'))
    let description = ''
    if (descStart !== -1) {
      // Skip the "**详细解读**：" line itself, take rest
      description = lines.slice(descStart + 1).join('\n').trim()
    }

    return { name, origin, description }
  })
}

export async function seedCreatures() {
  const supabase = createServiceClient()

  // Get category IDs
  const { data: categories } = await supabase.from('categories').select('id, slug')
  const categoryMap = new Map((categories || []).map((c: any) => [c.slug, c.id]))

  const parsed = parseSummaryFile()
  console.log(`Parsed ${parsed.length} creatures from summary file`)

  const creatures = parsed.map((c, i) => {
    const meta = creatureMeta[c.name]
    if (!meta) {
      console.warn(`⚠ No metadata for creature: ${c.name}`)
      return null
    }
    return {
      name: c.name,
      slug: c.name, // Use Chinese name as slug (works in Next.js URLs)
      origin: c.origin,
      description: c.description,
      category_id: categoryMap.get(meta.categorySlug) || null,
      attribute: meta.attribute,
      summary: meta.summary,
      image_path: null,
      is_published: true,
      sort_order: i,
    }
  }).filter(Boolean)

  const { error } = await supabase.from('creatures').upsert(creatures, { onConflict: 'slug' })
  if (error) throw new Error(`Failed to seed creatures: ${error.message}`)
  console.log(`✓ Seeded ${creatures.length} creatures`)
  return creatures
}
```

- [ ] **Step 3: Write seed-stories script**

Write to `scripts/seed/seed-stories.ts`:
```ts
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { createServiceClient } from '@/lib/supabase/server'

export async function seedStories() {
  const supabase = createServiceClient()

  // Get creature IDs for linking
  const { data: creatures } = await supabase.from('creatures').select('id, name')
  const creatureMap = new Map((creatures || []).map((c: any) => [c.name, c.id]))

  const storiesDir = join(process.cwd(), 'stories')
  const files = readdirSync(storiesDir).filter((f) => f.endsWith('.md') && !f.includes('workflow'))

  console.log(`Found ${files.length} story files`)

  const stories = files.map((filename, i) => {
    const content = readFileSync(join(storiesDir, filename), 'utf-8')

    // Parse title from first line: "# 烛龙——掌控昼夜的神龙"
    const titleLine = content.split('\n')[0] || ''
    const title = titleLine.replace(/^# /, '').trim()

    // Extract creature name from title (before "——")
    const creatureName = title.split('——')[0].trim()
    const creatureId = creatureMap.get(creatureName) || null

    // Use the full content (including the "小朋友你知道吗？" section after ---)
    return {
      title,
      slug: creatureName, // Use creature name as slug
      content,
      creature_id: creatureId,
      image_path: null,
      is_published: true,
      sort_order: i,
    }
  })

  const { error } = await supabase.from('stories').upsert(stories, { onConflict: 'slug' })
  if (error) throw new Error(`Failed to seed stories: ${error.message}`)
  console.log(`✓ Seeded ${stories.length} stories`)
  return stories
}
```

- [ ] **Step 4: Write run-all script**

Write to `scripts/seed/run-all.ts`:
```ts
import { seedCategories } from './seed-categories'
import { seedCreatures } from './seed-creatures'
import { seedStories } from './seed-stories'

async function main() {
  console.log('Starting data seeding...\n')

  await seedCategories()
  await seedCreatures()
  await seedStories()

  console.log('\n✅ All data seeded successfully!')
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
```

- [ ] **Step 5: Add seed script to package.json**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "seed": "npx tsx scripts/seed/run-all.ts"
  }
}
```

Install tsx:
```bash
npm install -D tsx
```

- [ ] **Step 6: Write test for creature parser**

Write to `__tests__/components/seed-creatures.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

function parseSummaryFile() {
  const filePath = join(process.cwd(), '山海经奇珍异兽汇总.md')
  const content = readFileSync(filePath, 'utf-8')
  const partStart = content.indexOf('## 第三部分：著名异兽详细介绍')
  const partEnd = content.indexOf('## 第四部分')
  const section = content.slice(partStart, partEnd)
  const blocks = section.split('\n---\n').filter((b) => b.trim().startsWith('### '))
  return blocks.map((block) => {
    const lines = block.split('\n')
    const heading = lines.find((l) => l.startsWith('### ')) || ''
    const headingText = heading.replace(/^### \S+、/, '')
    const name = headingText.split(/[——（]/)[0].trim()
    const originLine = lines.find((l) => l.includes('**出处**')) || ''
    const origin = originLine.replace(/^>.*\*\*出处\*\*：/, '').trim()
    return { name, origin }
  })
}

describe('seed-creatures parser', () => {
  it('parses 15 creatures', () => {
    const result = parseSummaryFile()
    expect(result.length).toBe(15)
  })

  it('first creature is 烛龙', () => {
    const result = parseSummaryFile()
    expect(result[0].name).toBe('烛龙')
  })

  it('last creature is 毕方', () => {
    const result = parseSummaryFile()
    expect(result[14].name).toBe('毕方')
  })

  it('all creatures have origin text', () => {
    const result = parseSummaryFile()
    result.forEach((c) => {
      expect(c.origin).toBeTruthy()
      expect(c.origin.length).toBeGreaterThan(0)
    })
  })
})
```

- [ ] **Step 7: Run test**

Run: `npx vitest run __tests__/components/seed-creatures.test.ts`
Expected: PASS (15 creatures parsed correctly)

- [ ] **Step 8: Commit**

```bash
git add scripts/ __tests__/components/seed-creatures.test.ts package.json
git commit -m "feat: add data seeding scripts — categories, creatures, stories"
```

---

## Task 16: Docker & E2E Tests

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `__tests__/e2e/home.spec.ts`, `playwright.config.ts`
- Test: Docker build + E2E test run

**Interfaces:**
- Consumes: All previous tasks
- Produces: Dockerized app, Playwright E2E tests

- [ ] **Step 1: Write Dockerfile**

Write to `Dockerfile`:
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

- [ ] **Step 2: Write docker-compose.yml**

Write to `docker-compose.yml`:
```yaml
services:
  shanhaijing:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REVALIDATE_SECRET=${REVALIDATE_SECRET}
    restart: unless-stopped
```

- [ ] **Step 3: Write .dockerignore**

Write to `.dockerignore`:
```
node_modules
.next
.git
.env*.local
__tests__
docs
stories
```

- [ ] **Step 4: Write Playwright config**

Write to `playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 5: Write E2E tests**

Write to `__tests__/e2e/home.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('home page loads and shows title', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('山海图鉴')
})

test('navigation to creatures page works', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/creatures"]')
  await expect(page).toHaveURL(/\/creatures/)
  await expect(page.locator('h1')).toContainText('异兽图鉴')
})

test('navigation to stories page works', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/stories"]')
  await expect(page).toHaveURL(/\/stories/)
  await expect(page.locator('h1')).toContainText('神话故事')
})

test('filter pills are visible on creatures page', async ({ page }) => {
  await page.goto('/creatures')
  await expect(page.locator('button:has-text("全部")')).toBeVisible()
})

test('admin login page loads', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.locator('h1')).toContainText('管理员登录')
})
```

- [ ] **Step 6: Verify Docker build**

Run:
```bash
docker build -t shanhaijing .
```
Expected: Image builds successfully.

- [ ] **Step 7: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore playwright.config.ts __tests__/e2e/
git commit -m "feat: add Docker deployment and Playwright E2E tests"
```

---

## Self-Review Notes

### Spec Coverage
- ✅ Architecture (Next.js + Supabase + Docker) — Task 1, 2, 14, 16
- ✅ Data Model (3 tables, RLS, Storage) — Task 2
- ✅ Supabase Client Libraries — Task 3
- ✅ Page Structure (6 public pages + 7 admin pages) — Tasks 7-9, 10-13
- ✅ Component Design (Figma tokens, 7 public + 6 admin components) — Tasks 4-6, 11
- ✅ Admin Panel (auth, CRUD, ImageUploader, MarkdownEditor) — Tasks 10-13
- ✅ ISR Revalidation — Task 14
- ✅ Data Seeding — Task 15
- ✅ Error Handling (404 page, image fallback) — Tasks 6, 10
- ✅ Docker Deployment — Task 16
- ✅ Testing (Vitest + Playwright) — Tasks 3, 5, 6, 15, 16

### Placeholder Scan
- No TBD/TODO found
- All code blocks contain complete implementations

### Type Consistency
- `CreatureWithCategory` used consistently in Tasks 5-9, 12
- `StoryWithCreature` used consistently in Tasks 5-9, 13
- `Category` type used consistently in Tasks 5, 7, 12, 13
- `createClient()` (browser) vs `createServerClient()` (server) used correctly throughout
