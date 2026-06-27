import { createServerClient } from '@/lib/supabase/server'
import { StoryCard } from '@/components/public/StoryCard'
import type { StoryWithCreature } from '@/lib/supabase/types'

export const revalidate = 3600

export default async function StoriesPage() {
  const supabase = await createServerClient()
  const { data: stories } = await supabase
    .from('stories')
    .select('*, creatures(id, name, slug, summary, image_path, category_id)')
    .eq('is_published', true)
    .order('sort_order')

  const typedStories = (stories || []) as unknown as StoryWithCreature[]

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <h1 className="text-display-lg font-normal mb-sm">神话故事</h1>
      <p className="text-body-lg text-gray-600 mb-xl">共 {typedStories.length} 篇山海经神话故事</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {typedStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  )
}
