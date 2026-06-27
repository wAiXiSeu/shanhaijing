'use client'

import dynamic from 'next/dynamic'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
)

type Props = {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function MarkdownEditor({ value, onChange, label }: Props) {
  return (
    <div>
      {label && (
        <label className="block text-body-sm font-medium mb-xs">{label}</label>
      )}
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={300}
        preview="live"
      />
    </div>
  )
}
