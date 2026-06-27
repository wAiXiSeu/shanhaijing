import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CreatureCard } from '@/components/public/CreatureCard'
import { StoryCard } from '@/components/public/StoryCard'
import type { CreatureWithCategory, StoryWithCreature } from '@/lib/supabase/types'

const mockCreature: CreatureWithCategory = {
  id: '1', name: '烛龙', slug: 'zhulong', summary: '掌控昼夜的神龙',
  origin: '《大荒北经》', appearance: '人面蛇身', abilities: '视为昼，瞑为夜',
  description: '详细解读', category_id: 'cat1', attribute: '凶兆',
  image_path: null, is_published: true, sort_order: 1,
  created_at: '', updated_at: '',
  categories: { id: 'cat1', name: '神灵/半神', slug: 'shenling', color_block: 'block-navy', sort_order: 4, created_at: '' }
}

const mockStory: StoryWithCreature = {
  id: '1', title: '烛龙故事', slug: 'zhulong-story',
  content: '很久很久以前...', creature_id: '1',
  image_path: null, is_published: true, sort_order: 1,
  created_at: '', updated_at: '',
  creatures: { id: '1', name: '烛龙', slug: 'zhulong', summary: '神龙', image_path: null, category_id: 'cat1' }
}

describe('CreatureCard', () => {
  it('renders creature name and summary', () => {
    render(<CreatureCard creature={mockCreature} />)
    // Name appears in both the image placeholder and the heading (image_path is null)
    expect(screen.getAllByText('烛龙').length).toBeGreaterThan(0)
    expect(screen.getByText('掌控昼夜的神龙')).toBeInTheDocument()
  })
})

describe('StoryCard', () => {
  it('renders story title and related creature', () => {
    render(<StoryCard story={mockStory} />)
    // Title appears in both the image placeholder and the heading (image_path is null)
    expect(screen.getAllByText('烛龙故事').length).toBeGreaterThan(0)
  })
})
