import { cn } from '@/lib/utils'
import Link from 'next/link'

type ColorBlock = 'block-lime' | 'block-coral' | 'block-mint' | 'block-navy' | 'block-cream' | 'block-lilac' | 'block-pink'

const blockStyles: Record<ColorBlock, { bg: string; text: string }> = {
  'block-lime':   { bg: 'bg-block-lime',   text: 'text-ink' },
  'block-coral':  { bg: 'bg-block-coral',  text: 'text-ink' },
  'block-mint':   { bg: 'bg-block-mint',   text: 'text-ink' },
  'block-navy':   { bg: 'bg-block-navy',   text: 'text-inverse-ink' },
  'block-cream':  { bg: 'bg-block-cream',  text: 'text-ink' },
  'block-lilac':  { bg: 'bg-block-lilac',  text: 'text-ink' },
  'block-pink':   { bg: 'bg-block-pink',   text: 'text-ink' },
}

type Props = {
  block: ColorBlock
  eyebrow?: string
  title: string
  children?: React.ReactNode
  linkHref?: string
  linkText?: string
}

export function ColorBlockSection({ block, eyebrow, title, children, linkHref, linkText }: Props) {
  const style = blockStyles[block]
  return (
    <section className={cn('rounded-lg px-xxl py-xxl md:py-section my-section', style.bg, style.text)}>
      <div className="max-w-[65%]">
        {eyebrow && (
          <p className="font-mono uppercase tracking-wider text-eyebrow mb-md opacity-70">
            {eyebrow}
          </p>
        )}
        <h2 className="text-display-lg font-normal mb-lg">{title}</h2>
        {children && <div className="text-body-lg">{children}</div>}
        {linkHref && linkText && (
          <Link href={linkHref} className="inline-block mt-lg text-link font-medium underline underline-offset-4">
            {linkText} →
          </Link>
        )}
      </div>
    </section>
  )
}
