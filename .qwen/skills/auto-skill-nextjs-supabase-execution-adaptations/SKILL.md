---
name: nextjs-supabase-execution-adaptations
description: Adapt Next.js + Supabase implementation plans when tooling versions and runtime constraints diverge from plan assumptions (Tailwind v4, Next.js 16, ISR conflicts, Docker env vars, admin role auth, revalidation path validation)
source: auto-skill
extracted_at: '2026-06-27T17:08:14.080Z'
---

# Adapting Next.js + Supabase Plans to Runtime Reality

Use when executing an implementation plan for a Next.js + Supabase project and the scaffolded tooling versions or runtime behavior diverges from what the plan assumed. Each section below describes a specific divergence, the symptom, and the fix.

## 1. `create-next-app@latest` installs Next.js 16, not 15

**Symptom:** Plan says "Next.js 15" but `create-next-app@latest` installs Next.js 16. Reviewer flags version mismatch against global constraints.

**Resolution:** Accept Next.js 16 — it's functionally compatible for App Router, ISR, and standalone output. Document the deviation in the progress ledger. Key API differences to adapt in plan code:

| Plan assumption (v15) | Next.js 16 reality | Adaptation |
|---|---|---|
| `middleware.ts` | Renamed to `proxy.ts` | Create `proxy.ts` instead. Next.js 16 `AGENTS.md` warns about this deprecation. |
| `params` is a plain object | `params` is a Promise | Add `await` before accessing: `const { slug } = await params` |
| `searchParams` is a plain object | `searchParams` is a Promise | Add `await` before accessing: `const { category } = await searchParams` |

## 2. Tailwind v4 replaces `tailwind.config.ts` with CSS `@theme`

**Symptom:** Plan provides a `tailwind.config.ts` with `theme.extend` tokens. `create-next-app@latest` installs Tailwind v4 which has no JS config file.

**Resolution:** Translate all JS config to CSS `@theme` blocks in `globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Colors: --color-{name} → generates bg-{name}, text-{name}, border-{name} */
  --color-block-lime: #dceeb1;
  --color-block-navy: #1f1d3d;

  /* Font sizes with sub-properties use --{property} suffix */
  --text-display-xl: 86px;
  --text-display-xl--line-height: 1.0;
  --text-display-xl--letter-spacing: -1.72px;
  --text-display-xl--font-weight: 340;

  /* Spacing: --spacing-{name} → generates p-{name}, m-{name}, gap-{name} */
  --spacing-section: 96px;

  /* Radius: --radius-{name} → generates rounded-{name} */
  --radius-pill: 50px;
}
```

**Key rules:**
- Do NOT create `tailwind.config.ts` — Tailwind v4 ignores it
- Utility classes are auto-generated from `@theme` tokens
- Custom font sizes need separate `--text-{name}--{property}` declarations for each sub-property
- The `@theme inline` variant references other CSS variables (useful for font variable mapping from `next/font`)

## 3. Supabase SSR `cookies()` breaks Next.js ISR

**Symptom:** Public pages declare `export const revalidate = 3600` for ISR, but build output shows them as dynamic (`ƒ`). ISR caching never engages; `revalidatePath()` calls have no effect.

**Root cause:** `createServerClient()` from `@supabase/ssr` calls `cookies()` to manage the auth session. In Next.js, any call to `cookies()` opts the route into dynamic rendering, overriding `revalidate`.

**Resolution options (choose based on project needs):**

1. **Accept dynamic rendering** (simplest, Phase 1): Remove `revalidate` exports. Pages render on every request. Fine for low-traffic sites. The on-demand revalidation API becomes unnecessary — remove it too.

2. **Use service client for public pages** (preserves ISR): Create a separate client that doesn't call `cookies()`:
   ```ts
   import { createClient as createSupabaseClient } from '@supabase/supabase-js'
   
   export function createPublicClient() {
     return createSupabaseClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     )
   }
   ```
   Use this for public page data fetching (reads only, RLS-protected). Use `createServerClient()` only for admin pages that need the user session.

3. **Use `generateStaticParams` + SSG**: Pre-render all creature/story pages at build time. Works when content is known at build time but requires rebuild when content changes.

## 4. Docker build drops `NEXT_PUBLIC_*` env vars

**Symptom:** Docker image builds successfully but client-side Supabase calls fail with `undefined` URL/key. Server-side code works fine (runtime env vars from docker-compose).

**Root cause:** Next.js inlines `NEXT_PUBLIC_*` variables at **build time**. The Dockerfile's `.dockerignore` excludes `.env*.local`, so the builder stage has no access to these values.

**Resolution:** Add build args to the Dockerfile builder stage:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build
```

And in `docker-compose.yml`, pass them as build args:

```yaml
services:
  app:
    build:
      context: .
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    env_file: .env.local  # for runtime server-side vars
```

## 5. Revalidation API: session auth, not shared secret

**Symptom:** Plan uses a shared `REVALIDATE_SECRET` env var for the ISR revalidation API. Client-side code needs `NEXT_PUBLIC_REVALIDATE_SECRET` to call it, which exposes the secret to all users.

**Resolution:** Check the Supabase session in the API route instead:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { paths } = await request.json()
  paths.forEach((p: string) => revalidatePath(p))
  return NextResponse.json({ revalidated: true, paths })
}
```

Client-side forms call `/api/revalidate` without any secret — the session cookie authenticates automatically.

## 6. Admin layout auth guard: don't use layout, use proxy/middleware

**Symptom:** Plan puts auth check in `app/admin/layout.tsx`. But the login page is also under `app/admin/`, creating a redirect loop (unauthenticated user → layout redirects to login → login is under the same layout → redirect again).

**Resolution:** Use `proxy.ts` (Next.js 16) or `middleware.ts` (Next.js 15) for auth:

```ts
// proxy.ts (Next.js 16) or middleware.ts (Next.js 15)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Skip auth for login page
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) return NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
  return NextResponse.next()
}
```

The admin layout then just renders the Sidebar + children without any auth check.

## 7. Root layout vs route group layouts

**Symptom:** TopNav and Footer are placed in the root `app/layout.tsx`, but admin pages shouldn't show them.

**Resolution:** Keep root layout as HTML-only wrapper. Create route group layouts:

```
app/
├── layout.tsx              # <html><body>{children}</body></html> — no nav
├── (public)/
│   ├── layout.tsx          # <TopNav>{children}<Footer/> — public pages only
│   ├── page.tsx
│   └── creatures/...
├── admin/
│   ├── layout.tsx          # <Sidebar>{children} — admin pages only
│   └── ...
```

Route groups `(public)` don't affect URL paths but allow different layouts.

## 8. Seed scripts need `--env-file` for tsx

**Symptom:** `npm run seed` (using `tsx`) can't connect to Supabase — environment variables from `.env.local` aren't loaded.

**Root cause:** Unlike `next dev`, `tsx` doesn't automatically load `.env.local`.

**Resolution:** Add `--env-file` flag to the seed script in `package.json`:

```json
"seed": "npx tsx --env-file=.env.local scripts/seed/run-all.ts"
```

## 9. Supabase query missing `.select()`

**Symptom:** TypeScript build fails on `supabase.from('table').order(...)` — the query is missing the `.select()` call.

**Resolution:** Always chain `.select('*')` (or specific columns) before `.order()`, `.eq()`, `.single()` etc. This was a recurring bug in plan code — check every Supabase query.

## 11. Admin role checks: session existence ≠ admin authorization

**Symptom:** Admin routes and API endpoints only check `if (!user)` (session exists), but don't verify the user has an admin role. If Supabase has public sign-up enabled (the default), **anyone who creates an account can access the full admin panel** — CRUD operations, file uploads, cache revalidation.

**Root cause:** Supabase Auth distinguishes "authenticated" from "authorized." A session proves identity, not privilege. The `proxy.ts` middleware and API routes must both enforce role-based access.

**Resolution:** Three-part fix:

### Part A: Create `profiles` table with admin flag

```sql
-- supabase/migrations/002_add_profiles.sql
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin   BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users read own profile; admins read all
CREATE POLICY "Users read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, is_admin) VALUES (NEW.id, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

After migration, grant admin to your first user:
```sql
UPDATE profiles SET is_admin = true WHERE id = 'YOUR-USER-UUID';
```

### Part B: Middleware role check in `proxy.ts`

```ts
// After session check, before returning response:
if (!isLoginPage && session) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
```

### Part C: API route role check

```ts
// In API routes (e.g., /api/revalidate):
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single()

if (!profile?.is_admin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Part D: Defense in depth — also disable public sign-up

In Supabase Dashboard: Authentication > Providers > Email > uncheck "Enable signup." This is the single highest-impact config change — it prevents unauthorized accounts entirely.

**Also validate revalidation paths:** The `/api/revalidate` endpoint should whitelist allowed path prefixes to prevent cache poisoning:
```ts
const ALLOWED_PATH_PREFIXES = ['/', '/creatures', '/stories']
const paths: string[] = (body.paths || ['/']).filter((p: string) =>
  ALLOWED_PATH_PREFIXES.some(prefix =>
    p === prefix || p.startsWith(prefix + '/') || p.startsWith(prefix + '?')
  )
)
```

**Key lesson:** Defense in depth — check roles at middleware layer (UX redirect), API layer (403 response), AND Supabase config (disable public signup). Never rely on a single gate.

## 10. Parsing structured markdown for data seeding

**Pattern for parsing existing markdown files into database records:**

1. Read the file with `readFileSync`
2. Find the section by heading: `content.indexOf('## Section Title')`
3. Find the end: `content.indexOf('## Next Section')`
4. Slice the section
5. Split by `\n---\n` delimiter into blocks
6. **Watch for the first block**: It may start with the section heading (`## ...`), not the first record (`### ...`). Slice from the first `### ` if needed.
7. Parse each block by scanning lines: headings (`### `), blockquotes (`> `), bold markers (`**`)

**Test the parser independently** — write a unit test that verifies the count, first item name, and last item name before running the seed against a live database.
