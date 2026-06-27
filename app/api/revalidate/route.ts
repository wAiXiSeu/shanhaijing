import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const paths: string[] = body.paths || ['/']

    for (const path of paths) {
      revalidatePath(path)
    }

    return NextResponse.json({ revalidated: true, paths })
  } catch {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
