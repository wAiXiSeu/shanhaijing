import { describe, it, expect, vi } from 'vitest'

// Mock the Supabase server client so importing the seed script never loads
// `next/headers` or attempts DB access. The test only exercises the pure
// `parseSummaryFile` parser, which does not touch Supabase.
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({}),
}))

import { parseSummaryFile } from '@/scripts/seed/seed-creatures'

describe('seed-creatures parser', () => {
  it('parses 15 creatures', () => {
    const result = parseSummaryFile()
    expect(result.length).toBe(15)
  })

  it('first creature is 烛龙', () => {
    const result = parseSummaryFile()
    expect(result[0].name).toBe('烛龙')
  })

  it('last creature is 毕方', () => {
    const result = parseSummaryFile()
    expect(result[14].name).toBe('毕方')
  })

  it('all creatures have origin text', () => {
    const result = parseSummaryFile()
    result.forEach((c) => {
      expect(c.origin).toBeTruthy()
      expect(c.origin.length).toBeGreaterThan(0)
    })
  })

  it('all creatures have a non-empty description', () => {
    const result = parseSummaryFile()
    result.forEach((c) => {
      expect(c.description).toBeTruthy()
      expect(c.description.length).toBeGreaterThan(0)
    })
  })

  it('parses expected creature names in order', () => {
    const result = parseSummaryFile()
    expect(result.map((c) => c.name)).toEqual([
      '烛龙', '凤凰', '九尾狐', '饕餮', '穷奇',
      '帝江', '精卫', '夸父', '刑天', '西王母',
      '应龙', '夔', '比翼鸟', '巴蛇', '毕方',
    ])
  })
})
