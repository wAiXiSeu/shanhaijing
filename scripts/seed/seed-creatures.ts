import { readFileSync } from 'fs'
import { join } from 'path'
import { createServiceClient } from '@/lib/supabase/server'

// Hardcoded mapping: creature name → { category slug, attribute, summary }
const creatureMeta: Record<string, { categorySlug: string; attribute: string; summary: string }> = {
  '烛龙':   { categorySlug: 'shen-ling', attribute: '凶兆', summary: '掌控昼夜的混沌之神' },
  '凤凰':   { categorySlug: 'niao-lei',  attribute: '祥瑞', summary: '百鸟之王，太平之兆' },
  '九尾狐': { categorySlug: 'shou-lei',  attribute: '凶兆', summary: '从瑞兽到妖狐的千年演变' },
  '饕餮':   { categorySlug: 'shou-lei',  attribute: '食人', summary: '贪婪之兽，青铜纹饰之源' },
  '穷奇':   { categorySlug: 'shou-lei',  attribute: '食人', summary: '助纣为虐的凶兽' },
  '帝江':   { categorySlug: 'shen-ling', attribute: '凶兆', summary: '无面目的混沌之神' },
  '精卫':   { categorySlug: 'niao-lei',  attribute: '中性', summary: '衔木填海，不屈之魂' },
  '夸父':   { categorySlug: 'yi-zu',     attribute: '中性', summary: '逐日英雄，悲壮之歌' },
  '刑天':   { categorySlug: 'shen-ling', attribute: '中性', summary: '断首不屈，猛志常在' },
  '西王母': { categorySlug: 'shen-ling', attribute: '凶兆', summary: '从豹尾虎齿到仙界至尊' },
  '应龙':   { categorySlug: 'shen-ling', attribute: '中性', summary: '助黄帝斩蚩尤的王权神兽' },
  '夔':     { categorySlug: 'shou-lei',  attribute: '凶兆', summary: '雷神之源，声震五百里' },
  '比翼鸟': { categorySlug: 'niao-lei',  attribute: '凶兆', summary: '生死相依，爱情的象征' },
  '巴蛇':   { categorySlug: 'she-lei',  attribute: '中性', summary: '蛇吞象，贪欲的化身' },
  '毕方':   { categorySlug: 'niao-lei',  attribute: '凶兆', summary: '火神一足鹤' },
}

/**
 * Parse `山海经奇珍异兽汇总.md` and extract the 15 detailed creature entries
 * from the "第三部分：著名异兽详细介绍" section.
 *
 * Exported so the test suite can exercise the real parser (single source of truth)
 * instead of duplicating the logic.
 */
export function parseSummaryFile(): { name: string; origin: string; description: string }[] {
  const filePath = join(process.cwd(), '山海经奇珍异兽汇总.md')
  const content = readFileSync(filePath, 'utf-8')

  // Find "第三部分：著名异兽详细介绍"
  const partStart = content.indexOf('## 第三部分：著名异兽详细介绍')
  const partEnd = content.indexOf('## 第四部分')
  if (partStart === -1 || partEnd === -1) throw new Error('Cannot find creature section in summary file')

  const section = content.slice(partStart, partEnd)

  // Strip the "## 第三部分…" part heading so the first creature block begins
  // with "### ". Without this, the first block (heading + 烛龙) is filtered out
  // by the `startsWith('### ')` guard below and 烛龙 would be lost.
  const bodyStart = section.indexOf('### ')
  const body = bodyStart !== -1 ? section.slice(bodyStart) : section

  // Split by the "---" horizontal-rule delimiter between creatures.
  const blocks = body.split('\n---\n').filter((b) => b.trim().startsWith('### '))

  return blocks.map((block) => {
    const lines = block.split('\n')
    // Parse name from heading: "### 一、烛龙（烛九阴）——混沌之神，掌控昼夜"
    const heading = lines.find((l) => l.startsWith('### ')) || ''
    const headingText = heading.replace(/^### \S+、/, '') // Remove "### 一、"
    // Extract name: text before "——" or "（"
    const name = headingText.split(/[——（]/)[0].trim()

    // Parse origin from blockquote: "> **出处**：..."
    const originLine = lines.find((l) => l.includes('**出处**')) || ''
    const origin = originLine.replace(/^>.*\*\*出处\*\*：/, '').trim()

    // Everything after "详细解读" is the description
    const descStart = lines.findIndex((l) => l.includes('**详细解读**'))
    let description = ''
    if (descStart !== -1) {
      // Skip the "**详细解读**：" line itself, take rest
      description = lines.slice(descStart + 1).join('\n').trim()
    }

    return { name, origin, description }
  })
}

export async function seedCreatures() {
  const supabase = createServiceClient()

  // Get category IDs
  const { data: categories } = await supabase.from('categories').select('id, slug')
  const categoryMap = new Map(
    (categories ?? []).map((c: { id: string; slug: string }) => [c.slug, c.id] as [string, string]),
  )

  const parsed = parseSummaryFile()
  console.log(`Parsed ${parsed.length} creatures from summary file`)

  const creatures = parsed.map((c, i) => {
    const meta = creatureMeta[c.name]
    if (!meta) {
      console.warn(`⚠ No metadata for creature: ${c.name}`)
      return null
    }
    return {
      name: c.name,
      slug: c.name, // Use Chinese name as slug (works in Next.js URLs)
      origin: c.origin,
      description: c.description,
      category_id: categoryMap.get(meta.categorySlug) || null,
      attribute: meta.attribute,
      summary: meta.summary,
      image_path: null,
      is_published: true,
      sort_order: i,
    }
  }).filter(Boolean)

  const { error } = await supabase.from('creatures').upsert(creatures, { onConflict: 'slug' })
  if (error) throw new Error(`Failed to seed creatures: ${error.message}`)
  console.log(`✓ Seeded ${creatures.length} creatures`)
  return creatures
}
