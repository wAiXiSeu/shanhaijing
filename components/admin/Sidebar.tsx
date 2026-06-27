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
    <aside className="w-[200px] border-r border-hairline bg-canvas flex flex-col shrink-0">
      <div className="p-lg border-b border-hairline">
        <Link href="/admin" className="text-display-sm font-medium">
          山海图鉴
        </Link>
        <p className="text-caption text-gray-500 mt-xxs font-mono uppercase tracking-wider">
          管理后台
        </p>
      </div>
      <nav className="flex-1 py-md">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-lg py-sm text-body-sm font-medium',
                isActive
                  ? 'bg-surface-soft text-ink'
                  : 'text-gray-500 hover:text-ink'
              )}
            >
              {item.label}
            </Link>
          )
        })}
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
