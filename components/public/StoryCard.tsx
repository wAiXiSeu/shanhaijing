import Link from 'next/link'
import Image from 'next/image'
import type { StoryWithCreature } from '@/lib/supabase/types'

type Props = {
  story: StoryWithCreature
}

export function StoryCard({ story }: Props) {
  return (
    <Link href={`/stories/${story.slug}`} className="block group">
      <div className="bg-surface-soft rounded-md overflow-hidden transition-shadow hover:shadow-soft">
        <div className="aspect-[16/9] relative bg-surface-soft">
          {story.image_path ? (
            <Image
              src={story.image_path}
              alt={story.title}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-block-cream">
              <span className="text-display-sm font-medium text-ink">{story.title}</span>
            </div>
          )}
        </div>
        <div className="p-md">
          <h3 className="text-card-title font-bold mb-xs">{story.title}</h3>
          <p className="text-body-sm line-clamp-3 text-gray-700">
            {story.content.replace(/[#*>\-\[\]]/g, '').slice(0, 100)}...
          </p>
          {story.creatures && (
            <p className="text-caption text-gray-500 mt-xs font-mono uppercase tracking-wider">
              相关异兽: {story.creatures.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
