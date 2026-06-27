'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageUploader } from './ImageUploader'
import { MarkdownEditor } from './MarkdownEditor'
import { slugify } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Story, Creature } from '@/lib/supabase/types'

type Props = {
  story?: Story
  creatures: Pick<Creature, 'id' | 'name'>[]
}

export function StoryForm({ story, creatures }: Props) {
  const isEditing = !!story
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(story?.title || '')
  const [slug, setSlug] = useState(story?.slug || '')
  const [content, setContent] = useState(story?.content || '')
  const [creatureId, setCreatureId] = useState(story?.creature_id || '')
  const [imagePath, setImagePath] = useState<string | null>(story?.image_path || null)
  const [isPublished, setIsPublished] = useState(story?.is_published || false)
  const [sortOrder, setSortOrder] = useState(story?.sort_order || 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(publish: boolean) {
    setSaving(true)
    setError(null)

    const data = {
      title,
      slug: slug || slugify(title),
      content,
      creature_id: creatureId || null,
      image_path: imagePath,
      is_published: publish,
      sort_order: sortOrder,
    }

    let response
    if (isEditing) {
      response = await supabase.from('stories').update(data).eq('id', story!.id)
    } else {
      response = await supabase.from('stories').insert(data)
    }

    if (response.error) {
      setError(response.error.message)
      setSaving(false)
      return
    }

    await fetch(`/api/revalidate?secret=${process.env.NEXT_PUBLIC_REVALIDATE_SECRET || ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/stories', `/stories/${data.slug}`, '/'] }),
    })

    router.push('/admin/stories')
    router.refresh()
  }

  async function handleDelete() {
    if (!isEditing) return
    if (!confirm('确认删除此故事？')) return

    const { error } = await supabase.from('stories').delete().eq('id', story!.id)
    if (error) { setError(error.message); return }

    await fetch(`/api/revalidate?secret=${process.env.NEXT_PUBLIC_REVALIDATE_SECRET || ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/stories', '/'] }),
    })

    router.push('/admin/stories')
    router.refresh()
  }

  return (
    <div className="space-y-xl max-w-2xl">
      <h1 className="text-display-md font-medium">{isEditing ? '编辑故事' : '新增故事'}</h1>
      {error && <p className="text-body-sm text-accent-magenta">{error}</p>}

      <div>
        <label className="block text-body-sm font-medium mb-xs">标题</label>
        <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">关联异兽</label>
        <select value={creatureId} onChange={(e) => setCreatureId(e.target.value)}
          className="w-full rounded-md border border-hairline px-md py-sm text-body">
          <option value="">无</option>
          {creatures.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">配图</label>
        <ImageUploader bucket="shanhaijing-assets" path={`stories/${slug || slugify(title)}`} value={imagePath} onChange={setImagePath} />
      </div>

      <MarkdownEditor label="故事正文" value={content} onChange={setContent} />

      <div>
        <label className="block text-body-sm font-medium mb-xs">排序</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-24 rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div className="flex gap-sm">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="rounded-pill border border-hairline px-lg py-xs text-button font-medium disabled:opacity-50">保存草稿</button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="rounded-pill bg-primary text-canvas px-lg py-xs text-button font-medium disabled:opacity-50">发布</button>
        {isEditing && (
          <button onClick={handleDelete} disabled={saving}
            className="rounded-pill text-accent-magenta px-lg py-xs text-button font-medium ml-auto">删除</button>
        )}
      </div>
    </div>
  )
}
