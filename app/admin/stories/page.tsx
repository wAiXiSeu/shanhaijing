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
