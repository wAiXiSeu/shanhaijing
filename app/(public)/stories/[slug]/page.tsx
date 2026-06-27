import { createServerClient } from '@/lib/supabase/server'
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { StoryWithCreature } from '@/lib/supabase/types'

export const revalidate = 3600

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: story } = await supabase
    .from('stories')
    .select('*, creatures(id, name, slug, summary, image_path, category_id)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!story) notFound()

  const typedStory = story as unknown as StoryWithCreature

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <Link href="/stories" className="text-body-sm text-gray-500 hover:text-ink mb-lg inline-block">
        ← 返回故事列表
      </Link>

      {/* Hero */}
      <div className="text-center mb-section">
        <h1 className="text-display-lg font-normal mb-lg">{typedStory.title}</h1>
        {typedStory.image_path && (
          <div className="aspect-[16/9] relative rounded-lg overflow-hidden max-w-3xl mx-auto">
            <Image
              src={typedStory.image_path}
              alt={typedStory.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <MarkdownRenderer content={typedStory.content} />

      {/* Related creature */}
      {typedStory.creatures && (
        <section className="py-section border-t border-hairline mt-section">
          <p className="font-mono uppercase tracking-wider text-eyebrow mb-md opacity-70">相关异兽</p>
          <Link
            href={`/creatures/${typedStory.creatures.slug}`}
            className="flex items-center gap-lg bg-surface-soft rounded-md p-lg hover:shadow-soft transition-shadow"
          >
            <div className="w-20 h-20 relative rounded-md overflow-hidden bg-surface-soft flex-shrink-0">
              {typedStory.creatures.image_path ? (
                <Image
                  src={typedStory.creatures.image_path}
                  alt={typedStory.creatures.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-block-cream">
                  <span className="text-body-sm font-medium">{typedStory.creatures.name}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-card-title font-bold">{typedStory.creatures.name}</h3>
              {typedStory.creatures.summary && (
                <p className="text-body-sm text-gray-600">{typedStory.creatures.summary}</p>
              )}
              <p className="text-link font-medium mt-xs">查看详情 →</p>
            </div>
          </Link>
        </section>
      )}
    </div>
  )
}
