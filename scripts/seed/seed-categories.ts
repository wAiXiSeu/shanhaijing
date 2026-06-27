import { createServiceClient } from '@/lib/supabase/server'

const categories = [
  { name: '鸟类', slug: 'niao-lei', color_block: 'block-lime', sort_order: 0 },
  { name: '兽类', slug: 'shou-lei', color_block: 'block-coral', sort_order: 1 },
  { name: '鱼类/水生类', slug: 'yu-lei', color_block: 'block-mint', sort_order: 2 },
  { name: '神灵/半神', slug: 'shen-ling', color_block: 'block-navy', sort_order: 3 },
  { name: '异族/国度', slug: 'yi-zu', color_block: 'block-cream', sort_order: 4 },
  { name: '蛇/爬虫类', slug: 'she-lei', color_block: 'block-lilac', sort_order: 5 },
]

export async function seedCategories() {
  const supabase = createServiceClient()
  const { error } = await supabase.from('categories').upsert(categories, { onConflict: 'slug' })
  if (error) throw new Error(`Failed to seed categories: ${error.message}`)
  console.log(`✓ Seeded ${categories.length} categories`)
  return categories
}
