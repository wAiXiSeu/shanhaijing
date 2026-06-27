'use client'

import { cn } from '@/lib/utils'

export type FilterOption = {
  label: string
  value: string
}

type Props = {
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

export function FilterPills({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-sm">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-pill px-lg py-xs text-button font-medium transition-colors',
            value === option.value
              ? 'bg-primary text-canvas'
              : 'bg-canvas text-ink border border-hairline hover:border-ink'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
