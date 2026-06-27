import { describe, it, expect, vi } from 'vitest'
import { slugify, cn } from '@/lib/utils'

describe('utils', () => {
  it('slugify converts Chinese text to slug', () => {
    expect(slugify('烛龙')).toBe('烛龙')
  })

  it('slugify handles mixed text', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('cn joins truthy classes', () => {
    expect(cn('a', 'b', false, null, 'c')).toBe('a b c')
  })
})
