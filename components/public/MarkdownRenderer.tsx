'use client'

import { useMemo } from 'react'

type Props = {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: Props) {
  const { body, knowledgeCard } = useMemo(() => {
    const parts = content.split(/\n---\n/)
    const body = parts[0]
    const knowledgeCard = parts.length > 1 ? parts.slice(1).join('\n---\n') : null
    return { body, knowledgeCard }
  }, [content])

  return (
    <div className={className}>
      <div className="prose prose-lg max-w-[720px] mx-auto">
        <SimpleMarkdown text={body} />
      </div>
      {knowledgeCard && (
        <div className="bg-block-cream rounded-lg p-xxl mt-xl max-w-[720px] mx-auto">
          <SimpleMarkdown text={knowledgeCard} />
        </div>
      )}
    </div>
  )
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-headline font-medium mt-xl mb-md">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-display-md font-medium mt-xl mb-md">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-display-lg font-normal mt-0 mb-lg">{line.slice(2)}</h1>)
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].replace(/^> ?/, ''))
        i++
      }
      elements.push(
        <blockquote key={i} className="border-l-2 border-ink pl-lg my-lg text-body-lg italic opacity-80">
          {quoteLines.join('\n')}
        </blockquote>
      )
      continue
    }
    // Horizontal rule (skip, handled by parent)
    else if (line === '---') {
      // skip
    }
    // Empty line
    else if (line.trim() === '') {
      // skip
    }
    // Paragraph
    else {
      elements.push(<p key={i} className="text-body leading-relaxed my-md">{renderInline(line)}</p>)
    }
    i++
  }

  return <>{elements}</>
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}
