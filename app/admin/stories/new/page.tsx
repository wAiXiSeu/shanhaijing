import { createServerClient } from '@/lib/supabase/server'
import { StoryForm } from '@/components/admin/StoryForm'
import type { Creature } from '@/lib/supabase/types'

export default async function NewStoryPage() {
  const supabase = await createServerClient()
  const { data: creatures } = await supabase.from('creatures').select('id, name').order('name')
  return <StoryForm creatures={(creatures || []) as unknown as Pick<Creature, 'id' | 'name'>[]} />
}
