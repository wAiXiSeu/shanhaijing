import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createServerClient()

  const [
    { count: creatureCount },
    { count: publishedCreatureCount },
    { count: storyCount },
    { count: publishedStoryCount },
    { count: categoryCount },
  ] = await Promise.all([
    supabase.from('creatures').select('*', { count: 'exact', head: true }),
    supabase
      .from('creatures')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <h1 className="text-display-md font-medium mb-xl">控制台</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        <div className="bg-surface-soft rounded-md p-xl">
          <p className="text-caption text-gray-500 font-mono uppercase tracking-wider mb-xs">
            异兽
          </p>
          <p className="text-display-md font-medium">{creatureCount || 0}</p>
          <p className="text-body-sm text-gray-500">
            已发布 {publishedCreatureCount || 0}
          </p>
          <Link
            href="/admin/creatures"
            className="text-body-sm text-gray-700 hover:text-ink mt-sm inline-block"
          >
            管理 →
          </Link>
        </div>
        <div className="bg-surface-soft rounded-md p-xl">
          <p className="text-caption text-gray-500 font-mono uppercase tracking-wider mb-xs">
            故事
          </p>
          <p className="text-display-md font-medium">{storyCount || 0}</p>
          <p className="text-body-sm text-gray-500">
            已发布 {publishedStoryCount || 0}
          </p>
          <Link
            href="/admin/stories"
            className="text-body-sm text-gray-700 hover:text-ink mt-sm inline-block"
          >
            管理 →
          </Link>
        </div>
        <div className="bg-surface-soft rounded-md p-xl">
          <p className="text-caption text-gray-500 font-mono uppercase tracking-wider mb-xs">
            分类
          </p>
          <p className="text-display-md font-medium">{categoryCount || 0}</p>
          <Link
            href="/admin/categories"
            className="text-body-sm text-gray-700 hover:text-ink mt-sm inline-block"
          >
            管理 →
          </Link>
        </div>
      </div>
    </div>
  )
}
