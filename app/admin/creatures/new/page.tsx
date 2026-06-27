import { createServerClient } from '@/lib/supabase/server'
import { CreatureForm } from '@/components/admin/CreatureForm'
import type { Category } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function NewCreaturePage() {
  const supabase = await createServerClient()
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order')
  const typedCategories = (categories || []) as unknown as Category[]

  return <CreatureForm categories={typedCategories} />
}
