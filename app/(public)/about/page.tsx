import { ColorBlockSection } from '@/components/public/ColorBlockSection'

export const revalidate = 3600

export default function AboutPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl py-section">
      <h1 className="text-display-lg font-normal mb-xl">关于山海图鉴</h1>

      <div className="max-w-[720px] mx-auto">
        <p className="text-body-lg text-gray-700 mb-lg">
          《山海经》是中国上古古籍，全书十八卷，涵盖约448座山川及四海八荒，记载约171种不重复异兽。
          本图鉴一期收录其中15种最具代表性的奇珍异兽及其神话故事。
        </p>
        <p className="text-body text-gray-700 mb-lg">
          从掌控昼夜的烛龙，到百鸟之王凤凰；从贪婪之兽饕餮，到衔木填海的精卫——每一种异兽都承载着先民对自然、宇宙和人性的想象。
        </p>
      </div>

      <ColorBlockSection block="block-cream" eyebrow="数据来源" title="内容依据">
        <p className="mb-md">
          本图鉴内容基于《山海经》全十八卷系统整理，涵盖山经五卷、海外经四卷、海内经四卷、大荒经四卷、海内经一卷。
        </p>
        <p>
          异兽分类遵循原文的物种类别（鸟类、兽类、鱼类/水生类、蛇/爬虫类、神灵/半神、异族/国度）和吉凶属性（祥瑞、凶兆、食人、药用、中性）两个维度。
        </p>
      </ColorBlockSection>
    </div>
  )
}
