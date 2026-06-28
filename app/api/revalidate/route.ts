import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

const ALLOWED_PATH_PREFIXES = ['/', '/creatures', '/stories']

function isAllowedPath(path: string): boolean {
  return ALLOWED_PATH_PREFIXES.some(
    prefix => path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?')
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const paths: string[] = (body.paths || ['/']).filter(isAllowedPath)

    if (paths.length === 0) {
      return NextResponse.json({ error: 'No valid paths' }, { status: 400 })
    }

    for (const path of paths) {
      revalidatePath(path)
    }

    return NextResponse.json({ revalidated: true, paths })
  } catch {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
