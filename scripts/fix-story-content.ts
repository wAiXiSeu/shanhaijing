import { createServiceClient } from '@/lib/supabase/server'

async function fixStoryContent() {
  const supabase = createServiceClient()

  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, slug, content')

  if (error) throw new Error(`Failed to fetch stories: ${error.message}`)

  let updated = 0
  for (const story of stories || []) {
    const lines = story.content.split('\n')
    if (lines[0]?.startsWith('# ')) {
      const newContent = lines.slice(1).join('\n').trimStart()
      const { error: updateError } = await supabase
        .from('stories')
        .update({ content: newContent })
        .eq('id', story.id)

      if (updateError) {
        console.error(`✗ Failed to update ${story.slug}: ${updateError.message}`)
      } else {
        console.log(`✓ ${story.slug}: removed title line`)
        updated++
      }
    }
  }

  console.log(`\nDone! Updated ${updated} stories.`)
}

fixStoryContent().catch(console.error)
