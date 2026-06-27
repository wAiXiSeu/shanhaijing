import { createServerClient } from '@/lib/supabase/server'
import { StoryForm } from '@/components/admin/StoryForm'
import type { Story, Creature } from '@/lib/supabase/types'

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const [{ data: story }, { data: creatures }] = await Promise.all([
    supabase.from('stories').select('*').eq('id', id).single(),
    supabase.from('creatures').select('id, name').order('name'),
  ])
  return <StoryForm story={story as unknown as Story} creatures={(creatures || []) as unknown as Pick<Creature, 'id' | 'name'>[]} />
}
