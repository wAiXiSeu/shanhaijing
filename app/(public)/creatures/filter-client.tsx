'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FilterPills } from '@/components/public/FilterPills'
import type { FilterOption } from '@/components/public/FilterPills'

export function FilterPillsClient({ options, initialValue }: { options: FilterOption[]; initialValue: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <FilterPills
      options={options}
      value={initialValue}
      onChange={(value) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
          params.delete('category')
        } else {
          params.set('category', value)
        }
        router.push(`/creatures?${params.toString()}`)
      }}
    />
  )
}
