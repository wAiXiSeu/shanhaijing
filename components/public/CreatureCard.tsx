import Link from 'next/link'
import Image from 'next/image'
import type { CreatureWithCategory } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const blockBarColors: Record<string, string> = {
  'block-lime': 'bg-block-lime',
  'block-coral': 'bg-block-coral',
  'block-mint': 'bg-block-mint',
  'block-navy': 'bg-block-navy',
  'block-cream': 'bg-block-cream',
  'block-lilac': 'bg-block-lilac',
  'block-pink': 'bg-block-pink',
}

type Props = {
  creature: CreatureWithCategory
}

export function CreatureCard({ creature }: Props) {
  const colorBar = creature.categories
    ? blockBarColors[creature.categories.color_block] || 'bg-surface-soft'
    : 'bg-surface-soft'

  return (
    <Link href={`/creatures/${creature.slug}`} className="block group">
      <div className="bg-surface-soft rounded-md overflow-hidden transition-shadow hover:shadow-soft">
        <div className={cn('h-1', colorBar)} />
        <div className="p-md">
          <div className="aspect-square relative rounded-md overflow-hidden bg-surface-soft mb-md">
            {creature.image_path ? (
              <Image
                src={creature.image_path}
                alt={creature.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center', colorBar)}>
                <span className="text-display-md font-medium">{creature.name}</span>
              </div>
            )}
          </div>
          <h3 className="text-card-title font-bold mb-xxs">{creature.name}</h3>
          <p className="text-caption text-gray-500 mb-xs font-mono uppercase tracking-wider">
            {creature.categories?.name} · {creature.attribute}
          </p>
          {creature.summary && (
            <p className="text-body-sm line-clamp-2 text-gray-700">{creature.summary}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
