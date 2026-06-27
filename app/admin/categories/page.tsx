'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import type { Category } from '@/lib/supabase/types'

const colorBlocks = [
  { label: 'Lime', value: 'block-lime' },
  { label: 'Coral', value: 'block-coral' },
  { label: 'Mint', value: 'block-mint' },
  { label: 'Navy', value: 'block-navy' },
  { label: 'Cream', value: 'block-cream' },
  { label: 'Lilac', value: 'block-lilac' },
  { label: 'Pink', value: 'block-pink' },
]

export default function CategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [colorBlock, setColorBlock] = useState('block-lime')
  const [sortOrder, setSortOrder] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories((data || []) as unknown as Category[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = { name, slug: slug || slugify(name), color_block: colorBlock, sort_order: sortOrder }
    if (editingId) {
      await supabase.from('categories').update(data).eq('id', editingId)
    } else {
      await supabase.from('categories').insert(data)
    }
    setName(''); setSlug(''); setSortOrder(0); setEditingId(null)
    fetchCategories()
  }

  async function handleEdit(cat: Category) {
    setEditingId(cat.id); setName(cat.name); setSlug(cat.slug); setColorBlock(cat.color_block); setSortOrder(cat.sort_order)
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除此分类？')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  return (
    <div>
      <h1 className="text-display-md font-medium mb-xl">分类管理</h1>
      <form onSubmit={handleSubmit} className="space-y-sm mb-xl max-w-md">
        <div className="grid grid-cols-2 gap-sm">
          <input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }} placeholder="分类名称" className="rounded-md border border-hairline px-md py-sm text-body" />
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="rounded-md border border-hairline px-md py-sm text-body" />
        </div>
        <select value={colorBlock} onChange={(e) => setColorBlock(e.target.value)} className="rounded-md border border-hairline px-md py-sm text-body">
          {colorBlocks.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} placeholder="排序" className="w-24 rounded-md border border-hairline px-md py-sm text-body" />
        <button type="submit" className="rounded-pill bg-primary text-canvas px-lg py-xs text-button font-medium">{editingId ? '更新' : '新增'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setSlug('') }} className="ml-sm text-body-sm text-gray-500">取消</button>}
      </form>
      <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-hairline">
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">名称</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">色块</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">排序</th>
            <th className="text-left px-lg py-sm text-body-sm font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-hairline-soft">
                <td className="px-lg py-sm text-body-sm">{c.name}</td>
                <td className="px-lg py-sm"><div className={`inline-block w-6 h-6 rounded-sm ${c.color_block === 'block-navy' ? 'bg-block-navy' : `bg-${c.color_block}`}`} /></td>
                <td className="px-lg py-sm text-body-sm text-gray-500">{c.sort_order}</td>
                <td className="px-lg py-sm">
                  <button onClick={() => handleEdit(c)} className="text-body-sm text-gray-700 hover:text-ink">编辑</button>
                  <button onClick={() => handleDelete(c.id)} className="text-body-sm text-accent-magenta hover:text-ink ml-sm">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
