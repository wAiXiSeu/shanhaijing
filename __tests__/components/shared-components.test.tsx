import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ColorBlockSection } from '@/components/public/ColorBlockSection'
import { FilterPills } from '@/components/public/FilterPills'

describe('ColorBlockSection', () => {
  it('renders title and eyebrow', () => {
    render(
      <ColorBlockSection block="block-lime" eyebrow="鸟类" title="天空之翼">
        <p>45种异兽</p>
      </ColorBlockSection>
    )
    expect(screen.getByText('天空之翼')).toBeInTheDocument()
    expect(screen.getByText('鸟类')).toBeInTheDocument()
    expect(screen.getByText('45种异兽')).toBeInTheDocument()
  })
})

describe('FilterPills', () => {
  it('renders all options', () => {
    const options = [
      { label: '全部', value: 'all' },
      { label: '鸟类', value: 'birds' },
    ]
    render(<FilterPills options={options} value="all" onChange={() => {}} />)
    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('鸟类')).toBeInTheDocument()
  })
})
