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
