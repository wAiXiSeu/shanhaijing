'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Props = {
  bucket: string
  path: string
  value: string | null
  onChange: (url: string | null) => void
}

export function ImageUploader({ bucket, path, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('图片不超过 5MB')
      return
    }

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp'
    const filePath = `${path}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed border-hairline rounded-md p-xl text-center cursor-pointer hover:border-ink transition-colors',
          value && 'bg-surface-soft'
        )}
      >
        {value ? (
          <div className="space-y-sm">
            <img src={value} alt="预览" className="max-h-48 mx-auto rounded-md" />
            <p className="text-body-sm text-gray-500">点击替换</p>
          </div>
        ) : (
          <div className="space-y-sm">
            <p className="text-body-sm text-gray-500">拖拽或点击上传图片</p>
            <p className="text-caption text-gray-400">支持 webp/jpg/png, 最大 5MB</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png"
        onChange={handleUpload}
        className="hidden"
      />
      {uploading && <p className="text-body-sm text-gray-500 mt-xs">上传中...</p>}
      {error && <p className="text-body-sm text-accent-magenta mt-xs">{error}</p>}
      {value && (
        <button
          onClick={() => onChange(null)}
          className="text-body-sm text-gray-500 hover:text-ink mt-xs"
        >
          移除图片
        </button>
      )}
    </div>
  )
}
