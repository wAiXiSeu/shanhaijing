import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

/**
 * Proxy (formerly middleware in Next.js < 16) that protects admin routes.
 *
 * - Matches /admin/:path* (all admin routes)
 * - Allows /admin/login without authentication
 * - Redirects authenticated users away from /admin/login → /admin
 * - Redirects unauthenticated users from protected admin routes → /admin/login
 * - Refreshes Supabase session cookies on every matched request
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh the session (sets updated cookies on the response)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/admin/login'

  // Authenticated user visiting login → redirect to dashboard
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Unauthenticated user visiting protected admin route → redirect to login
  if (!isLoginPage && !session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
