import { createServerClient } from '@/lib/supabase/server'
import { CreatureCard } from '@/components/public/CreatureCard'
import { FilterPillsClient } from './filter-client'
import type { CreatureWithCategory, Category } from '@/lib/supabase/types'

export const revalidate = 3600

export default async function CreaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: categoryFilter } = await searchParams
  const supabase = await createServerClient()

  const [{ data: creatures }, { data: categories }] = await Promise.all([
    supabase.from('creatures').select('*, categories(*)').eq('is_published', true).order('sort_order'),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  const typedCreatures = (creatures || []) as unknown as CreatureWithCategory[]
  const typedCategories = (categories || []) as unknown as Category[]

  const filtered = categoryFilter
    ? typedCreatures.filter((c) => c.categories?.slug === categoryFilter)
    : typedCreatures

  const filterOptions = [
    { label: '全部', value: 'all' },
    ...typedCategories.map((c) => ({ label: c.name, value: c.slug })),
  ]

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <h1 className="text-display-lg font-normal mb-sm">异兽图鉴</h1>
      <p className="text-body-lg text-gray-600 mb-xl">共收录 {typedCreatures.length} 种山海经奇珍异兽</p>

      <div className="mb-xl">
        <FilterPillsClient options={filterOptions} initialValue={categoryFilter || 'all'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        {filtered.map((creature) => (
          <CreatureCard key={creature.id} creature={creature} />
        ))}
      </div>
    </div>
  )
}
