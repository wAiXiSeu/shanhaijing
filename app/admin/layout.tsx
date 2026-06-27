import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/Sidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No user means this is the login page.
  // The proxy has already redirected unauthenticated users away from
  // other admin routes, so reaching the layout without a user only
  // happens on /admin/login.
  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar />
      <div className="flex-1 p-xl overflow-auto">{children}</div>
    </div>
  )
}
