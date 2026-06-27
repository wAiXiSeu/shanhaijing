import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-inverse-canvas text-inverse-ink">
      <div className="text-center">
        <h1 className="text-display-lg font-normal mb-md">异兽未找到</h1>
        <p className="text-body-lg opacity-70 mb-xl">
          这片山林中似乎没有你要找的生灵
        </p>
        <Link
          href="/"
          className="inline-block rounded-pill bg-canvas text-ink px-lg py-xs text-button font-medium"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
