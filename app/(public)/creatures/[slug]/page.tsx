import { createServerClient } from '@/lib/supabase/server'
import { ColorBlockSection } from '@/components/public/ColorBlockSection'
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer'
import { StoryCard } from '@/components/public/StoryCard'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { CreatureWithCategory, StoryWithCreature } from '@/lib/supabase/types'

export const revalidate = 3600

export default async function CreatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: creature } = await supabase
    .from('creatures')
    .select('*, categories(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!creature) notFound()

  const typedCreature = creature as unknown as CreatureWithCategory

  const { data: stories } = await supabase
    .from('stories')
    .select('*, creatures(id, name, slug, summary, image_path, category_id)')
    .eq('creature_id', typedCreature.id)
    .eq('is_published', true)

  const typedStories = (stories || []) as unknown as StoryWithCreature[]
  const category = typedCreature.categories

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <Link href="/creatures" className="text-body-sm text-gray-500 hover:text-ink mb-lg inline-block">
        ← 返回图鉴
      </Link>

      {/* Header: image + info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-section">
        <div className="aspect-square relative rounded-lg overflow-hidden bg-surface-soft">
          {typedCreature.image_path ? (
            <Image
              src={typedCreature.image_path}
              alt={typedCreature.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-block-cream">
              <span className="text-display-xl font-normal">{typedCreature.name}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <p className="font-mono uppercase tracking-wider text-eyebrow mb-sm opacity-70">
            {category?.name} · {typedCreature.attribute}
          </p>
          <h1 className="text-display-lg font-normal mb-md">{typedCreature.name}</h1>
          {typedCreature.summary && (
            <p className="text-body-lg text-gray-700 mb-lg">{typedCreature.summary}</p>
          )}
          {typedCreature.origin && (
            <p className="text-caption text-gray-500 font-mono uppercase tracking-wider">
              出处: {typedCreature.origin}
            </p>
          )}
        </div>
      </div>

      {/* Appearance section (color block) */}
      {typedCreature.appearance && (
        <ColorBlockSection
          block={(category?.color_block || 'block-cream') as 'block-cream'}
          eyebrow="外形特征"
          title={`${typedCreature.name}的模样`}
        >
          <p>{typedCreature.appearance}</p>
        </ColorBlockSection>
      )}

      {/* Abilities section (white) */}
      {typedCreature.abilities && (
        <section className="py-section max-w-[720px] mx-auto">
          <h2 className="text-headline font-medium mb-md">特殊能力 / 寓意</h2>
          <p className="text-body text-gray-700">{typedCreature.abilities}</p>
        </section>
      )}

      {/* Detailed description (navy block) */}
      {typedCreature.description && (
        <ColorBlockSection block="block-navy" eyebrow="详细解读" title={typedCreature.name}>
          <MarkdownRenderer content={typedCreature.description} />
        </ColorBlockSection>
      )}

      {/* Related stories */}
      {typedStories.length > 0 && (
        <section className="py-section">
          <h2 className="text-headline font-medium mb-lg">相关故事</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {typedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
