import { readFileSync } from 'fs'
import { join } from 'path'
import { createServiceClient } from '@/lib/supabase/server'

// Image filename → { creature slug (DB), storage path (pinyin) }
const imageMap: Record<string, { slug: string; storageName: string }> = {
  '巴蛇.png':     { slug: '巴蛇',   storageName: 'bashan' },
  '比翼鸟.png':   { slug: '比翼鸟', storageName: 'biyiniao' },
  '毕方.png':     { slug: '毕方',   storageName: 'bifang' },
  '帝江.png':     { slug: '帝江',   storageName: 'dijiang' },
  '凤凰图鉴.png': { slug: '凤凰',   storageName: 'fenghuang' },
  '精卫.png':     { slug: '精卫',   storageName: 'jingwei' },
  '九尾狐图鉴.png': { slug: '九尾狐', storageName: 'jiuweihu' },
  '夸父.png':     { slug: '夸父',   storageName: 'kuafu' },
  '夔牛.png':     { slug: '夔',     storageName: 'kui' },
  '穷奇.png':     { slug: '穷奇',   storageName: 'qiongqi' },
  '饕餮.png':     { slug: '饕餮',   storageName: 'taotie' },
  '西王母.png':   { slug: '西王母', storageName: 'xiwangmu' },
  '刑天.png':     { slug: '刑天',   storageName: 'xingtian' },
  '应龙.png':     { slug: '应龙',   storageName: 'yinglong' },
  '烛龙图鉴.png': { slug: '烛龙',   storageName: 'zhulong' },
}

const BUCKET = 'shanhaijing-assets'

async function uploadImages() {
  const supabase = createServiceClient()
  const imagesDir = join(process.cwd(), 'images')

  for (const [filename, { slug, storageName }] of Object.entries(imageMap)) {
    const filePath = join(imagesDir, filename)
    const storagePath = `creatures/${storageName}.png`

    // Upload to Supabase Storage
    const fileBuffer = readFileSync(filePath)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error(`✗ Failed to upload ${filename}: ${uploadError.message}`)
      continue
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    // Update creature image_path in database
    const { error: updateError } = await supabase
      .from('creatures')
      .update({ image_path: publicUrl })
      .eq('slug', slug)

    if (updateError) {
      console.error(`✗ Failed to update ${slug}: ${updateError.message}`)
      continue
    }

    console.log(`✓ ${filename} → ${slug} → ${publicUrl}`)
  }

  console.log('\nDone!')
}

uploadImages().catch(console.error)
