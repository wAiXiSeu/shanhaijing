export const meta = {
  name: 'shanhaijing-children-stories',
  description: '为15种山海经著名异兽创作适合6岁儿童的短篇神话故事',
  phases: [
    { title: '创作故事', detail: '并行创作15个儿童故事' },
    { title: '汇总检查', detail: '验证所有故事已保存' }
  ]
}

const beasts = [
  { name: '烛龙', file: '01_烛龙_掌控昼夜的神龙.md' },
  { name: '凤凰', file: '02_凤凰_百鸟之王.md' },
  { name: '九尾狐', file: '03_九尾狐_从瑞兽到妖狐.md' },
  { name: '饕餮', file: '04_饕餮_贪婪之兽.md' },
  { name: '穷奇', file: '05_穷奇_助纣为虐的凶兽.md' },
  { name: '帝江', file: '06_帝江_混沌之神.md' },
  { name: '精卫', file: '07_精卫_衔木填海.md' },
  { name: '夸父', file: '08_夸父_逐日英雄.md' },
  { name: '刑天', file: '09_刑天_断首不屈.md' },
  { name: '西王母', file: '10_西王母_昆仑女神.md' },
  { name: '应龙', file: '11_应龙_助黄帝斩蚩尤.md' },
  { name: '夔', file: '12_夔_雷神之源.md' },
  { name: '比翼鸟', file: '13_比翼鸟_生死相依.md' },
  { name: '巴蛇', file: '14_巴蛇_蛇吞象的故事.md' },
  { name: '毕方', file: '15_毕方_火神一足鹤.md' }
]

log(`准备为 ${beasts.length} 种山海经异兽创作儿童故事`)

// 并行处理所有异兽
const results = await parallel(beasts.map((beast) => async () => {
  log(`开始创作：${beast.name}`)

  const result = await agent(
    `你是一位专业的儿童文学作家，擅长为6岁小朋友写故事。

## 任务
为《山海经》中的著名异兽"${beast.name}"创作一个适合6岁小朋友阅读的神话故事。

## 要求
1. **字数**：不超过500字
2. **语言**：简单易懂，生动有趣，适合6岁儿童
3. **内容**：
   - 先搜索研究这个异兽的原始神话传说
   - 将复杂的情节简化为儿童能理解的故事
   - 保留核心特征和寓意
   - 避免恐怖、暴力等不适合儿童的内容
   - 可以添加温暖、积极的元素
   - 用词要简单，句子要短
4. **格式**：
   - 标题用 # 号
   - 故事正文直接写，不需要额外说明
   - 结尾可以加一个"小朋友，你知道吗？"的小知识点

## 输出步骤
1. 先用 WebSearch 搜索研究这个异兽的背景和神话传说
2. 创作故事
3. 用 Write 工具将故事保存到文件：/root/k12/books/stories/${beast.file}

## 故事示例结构
\`\`\`
# [异兽名称]

[故事正文，300-500字]

---
**小朋友，你知道吗？**
[简单的小知识点，1-2句话]
\`\`\`

请开始吧！记住要保存文件哦！`,
    {
      label: `创作${beast.name}故事`,
      phase: '创作故事'
    }
  )

  return { beast: beast.name, file: beast.file }
}))

log(`所有故事创作完成，共 ${results.length} 个`)

return {
  total: beasts.length,
  created: results.length,
  beasts: results.map(r => r.beast)
}
