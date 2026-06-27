import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { createServiceClient } from '@/lib/supabase/server'

export async function seedStories() {
  const supabase = createServiceClient()

  // Get creature IDs for linking
  const { data: creatures } = await supabase.from('creatures').select('id, name')
  const creatureMap = new Map(
    (creatures ?? []).map((c: { id: string; name: string }) => [c.name, c.id] as [string, string]),
  )

  const storiesDir = join(process.cwd(), 'stories')
  const files = readdirSync(storiesDir).filter((f) => f.endsWith('.md') && !f.includes('workflow'))

  console.log(`Found ${files.length} story files`)

  const stories = files.map((filename, i) => {
    const content = readFileSync(join(storiesDir, filename), 'utf-8')

    // Parse title from first line: "# 烛龙——掌控昼夜的神龙"
    const titleLine = content.split('\n')[0] || ''
    const title = titleLine.replace(/^# /, '').trim()

    // Extract creature name from title (before "——")
    const creatureName = title.split('——')[0].trim()
    const creatureId = creatureMap.get(creatureName) || null

    // Use the full content (including the "小朋友你知道吗？" section after ---)
    return {
      title,
      slug: creatureName, // Use creature name as slug
      content,
      creature_id: creatureId,
      image_path: null,
      is_published: true,
      sort_order: i,
    }
  })

  const { error } = await supabase.from('stories').upsert(stories, { onConflict: 'slug' })
  if (error) throw new Error(`Failed to seed stories: ${error.message}`)
  console.log(`✓ Seeded ${stories.length} stories`)
  return stories
}
