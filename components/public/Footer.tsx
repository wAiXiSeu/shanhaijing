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
      <div className="max-w-[1280px] mx-auto mt-lg pt-lg border-t border-hairline text-center">
        <p className="text-caption text-gray-400">
          苏ICP备2026043420号-1
        </p>
      </div>
    </footer>
  )
}
