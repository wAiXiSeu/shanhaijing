import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownRenderer } from '@/components/public/MarkdownRenderer'
import { ColorBlockSection } from '@/components/public/ColorBlockSection'
import { StoryCard } from '@/components/public/StoryCard'
import type { StoryWithCreature } from '@/lib/supabase/types'

describe('MarkdownRenderer — knowledge card split', () => {
  it('renders body and knowledge card when content has --- separator', () => {
    const content = '这是故事正文内容。\n---\n小朋友你知道吗？烛龙睁眼就是白天！'
    render(<MarkdownRenderer content={content} />)

    expect(screen.getByText('这是故事正文内容。')).toBeInTheDocument()
    expect(screen.getByText(/小朋友你知道吗/)).toBeInTheDocument()
    expect(screen.getByText(/烛龙睁眼就是白天/)).toBeInTheDocument()
  })

  it('renders only body when no separator present', () => {
    const content = '只有正文，没有知识卡片。'
    render(<MarkdownRenderer content={content} />)

    expect(screen.getByText('只有正文，没有知识卡片。')).toBeInTheDocument()
  })
})

describe('StoryCard — image branch', () => {
  it('renders image when image_path is provided', () => {
    const story: StoryWithCreature = {
      id: '2',
      title: '精卫填海',
      slug: 'jingwei-tianhai',
      content: '炎帝之女溺于东海...',
      creature_id: '2',
      image_path: 'https://example.supabase.co/storage/test.jpg',
      is_published: true,
      sort_order: 2,
      created_at: '',
      updated_at: '',
      creatures: {
        id: '2',
        name: '精卫',
        slug: 'jingwei',
        summary: '衔木填海的神鸟',
        image_path: null,
        category_id: 'cat2',
      },
    }

    const { container } = render(<StoryCard story={story} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toContain('test.jpg')
    expect(screen.getByText('精卫填海')).toBeInTheDocument()
    expect(screen.getByText(/相关异兽.*精卫/)).toBeInTheDocument()
  })
})

describe('ColorBlockSection — about page usage', () => {
  it('renders cream block with eyebrow and title as used on about page', () => {
    render(
      <ColorBlockSection block="block-cream" eyebrow="数据来源" title="内容依据">
        <p>本图鉴内容基于《山海经》全十八卷系统整理。</p>
      </ColorBlockSection>
    )

    expect(screen.getByText('数据来源')).toBeInTheDocument()
    expect(screen.getByText('内容依据')).toBeInTheDocument()
    expect(screen.getByText(/全十八卷系统整理/)).toBeInTheDocument()
  })
})
