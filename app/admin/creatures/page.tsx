import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { CreatureWithCategory } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

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
