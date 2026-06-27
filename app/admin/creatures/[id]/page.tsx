import { createServerClient } from '@/lib/supabase/server'
import { CreatureForm } from '@/components/admin/CreatureForm'
import type { Category, Creature } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function EditCreaturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: creature }, { data: categories }] = await Promise.all([
    supabase.from('creatures').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  return (
    <CreatureForm
      creature={creature as unknown as Creature}
      categories={(categories || []) as unknown as Category[]}
    />
  )
}
