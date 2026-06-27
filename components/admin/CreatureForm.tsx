'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageUploader } from './ImageUploader'
import { MarkdownEditor } from './MarkdownEditor'
import { slugify } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Category, Creature } from '@/lib/supabase/types'

type Props = {
  creature?: Creature
  categories: Category[]
}

export function CreatureForm({ creature, categories }: Props) {
  const isEditing = !!creature
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(creature?.name || '')
  const [slug, setSlug] = useState(creature?.slug || '')
  const [summary, setSummary] = useState(creature?.summary || '')
  const [origin, setOrigin] = useState(creature?.origin || '')
  const [appearance, setAppearance] = useState(creature?.appearance || '')
  const [abilities, setAbilities] = useState(creature?.abilities || '')
  const [description, setDescription] = useState(creature?.description || '')
  const [categoryId, setCategoryId] = useState(creature?.category_id || '')
  const [attribute, setAttribute] = useState(creature?.attribute || '')
  const [imagePath, setImagePath] = useState<string | null>(creature?.image_path || null)
  const [sortOrder, setSortOrder] = useState(creature?.sort_order || 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(publish: boolean) {
    setSaving(true)
    setError(null)

    const data = {
      name,
      slug: slug || slugify(name),
      summary: summary || null,
      origin: origin || null,
      appearance: appearance || null,
      abilities: abilities || null,
      description: description || null,
      category_id: categoryId || null,
      attribute: attribute || null,
      image_path: imagePath,
      is_published: publish,
      sort_order: sortOrder,
    }

    let response
    if (isEditing) {
      response = await supabase.from('creatures').update(data).eq('id', creature!.id)
    } else {
      response = await supabase.from('creatures').insert(data)
    }

    if (response.error) {
      setError(response.error.message)
      setSaving(false)
      return
    }

    // Trigger ISR revalidation
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/creatures', `/creatures/${data.slug}`, '/'] }),
    })

    router.push('/admin/creatures')
    router.refresh()
  }

  async function handleDelete() {
    if (!isEditing) return
    if (!confirm('确认删除此异兽？')) return

    const { error } = await supabase.from('creatures').delete().eq('id', creature!.id)
    if (error) {
      setError(error.message)
      return
    }

    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/creatures', '/'] }),
    })

    router.push('/admin/creatures')
    router.refresh()
  }

  return (
    <div className="space-y-xl max-w-2xl">
      <h1 className="text-display-md font-medium">{isEditing ? '编辑异兽' : '新增异兽'}</h1>

      {error && <p className="text-body-sm text-accent-magenta">{error}</p>}

      <div>
        <label className="block text-body-sm font-medium mb-xs">名称</label>
        <input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">Slug (URL)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div className="grid grid-cols-2 gap-lg">
        <div>
          <label className="block text-body-sm font-medium mb-xs">分类</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-hairline px-md py-sm text-body">
            <option value="">无</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-body-sm font-medium mb-xs">属性</label>
          <select value={attribute} onChange={(e) => setAttribute(e.target.value)}
            className="w-full rounded-md border border-hairline px-md py-sm text-body">
            <option value="">无</option>
            <option value="祥瑞">祥瑞</option>
            <option value="凶兆">凶兆</option>
            <option value="食人">食人</option>
            <option value="药用">药用</option>
            <option value="中性">中性</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">出处</label>
        <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="如：《大荒北经》《海外北经》"
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">配图</label>
        <ImageUploader bucket="shanhaijing-assets" path={`creatures/${slug || slugify(name)}`} value={imagePath} onChange={setImagePath} />
      </div>

      <div>
        <label className="block text-body-sm font-medium mb-xs">简介</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2}
          className="w-full rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <MarkdownEditor label="外形特征" value={appearance} onChange={setAppearance} />
      <MarkdownEditor label="特殊能力/寓意" value={abilities} onChange={setAbilities} />
      <MarkdownEditor label="详细解读" value={description} onChange={setDescription} />

      <div>
        <label className="block text-body-sm font-medium mb-xs">排序</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-24 rounded-md border border-hairline px-md py-sm text-body" />
      </div>

      <div className="flex gap-sm">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="rounded-pill border border-hairline px-lg py-xs text-button font-medium disabled:opacity-50">
          保存草稿
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="rounded-pill bg-primary text-canvas px-lg py-xs text-button font-medium disabled:opacity-50">
          发布
        </button>
        {isEditing && (
          <button onClick={handleDelete} disabled={saving}
            className="rounded-pill text-accent-magenta px-lg py-xs text-button font-medium ml-auto">
            删除
          </button>
        )}
      </div>
    </div>
  )
}
