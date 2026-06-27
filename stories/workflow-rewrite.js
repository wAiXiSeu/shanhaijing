export const meta = {
  name: 'shanhaijing-stories-rewrite',
  description: '重写15个山海经儿童故事，扩展到800字，参考西游记风格',
  phases: [
    { title: '重写故事', detail: '并行重写15个儿童故事' },
    { title: '完成', detail: '验证所有故事已更新' }
  ]
}

const beasts = [
  { name: '烛龙', file: '01_烛龙_掌控昼夜的神龙.md', abilities: '掌控昼夜、呼风唤雨、身长千里、人面蛇身' },
  { name: '凤凰', file: '02_凤凰_百鸟之王.md', abilities: '五采文、见则天下安宁、百鸟之王、自歌自舞' },
  { name: '九尾狐', file: '03_九尾狐_从瑞兽到妖狐.md', abilities: '九条尾巴、能食人、叫声如婴儿、后世演变为妖狐' },
  { name: '饕餮', file: '04_饕餮_贪婪之兽.md', abilities: '羊身人面、目在腋下、虎齿人爪、极其贪婪' },
  { name: '穷奇', file: '05_穷奇_助纣为虐的凶兽.md', abilities: '状如牛或虎、有翼、食人、助恶惩善' },
  { name: '帝江', file: '06_帝江_混沌之神.md', abilities: '状如黄囊、六足四翼、无面目、识歌舞' },
  { name: '精卫', file: '07_精卫_衔木填海.md', abilities: '衔木石填海、不屈不挠、炎帝之女化身' },
  { name: '夸父', file: '08_夸父_逐日英雄.md', abilities: '巨人族、逐日、喝干河渭、杖化邓林' },
  { name: '刑天', file: '09_刑天_断首不屈.md', abilities: '断首不屈、以乳为目、以脐为口、操干戚舞' },
  { name: '西王母', file: '10_西王母_昆仑女神.md', abilities: '豹尾虎齿、司天之厉、掌管不死药、三青鸟取食' },
  { name: '应龙', file: '11_应龙_助黄帝斩蚩尤.md', abilities: '双翼飞龙、斩杀蚩尤夸父、王权天命' },
  { name: '夔', file: '12_夔_雷神之源.md', abilities: '一足、召唤风雨、声如雷、皮为鼓声闻五百里' },
  { name: '比翼鸟', file: '13_比翼鸟_生死相依.md', abilities: '一翼一目、相得乃飞、见则大水、忠贞爱情' },
  { name: '巴蛇', file: '14_巴蛇_蛇吞象的故事.md', abilities: '吞象三年出骨、青黄赤黑四色、贪欲化身' },
  { name: '毕方', file: '15_毕方_火神一足鹤.md', abilities: '一足、赤文青质、见则有火、火神' }
]

log(`准备重写 ${beasts.length} 个山海经儿童故事，每个800字左右，参考西游记风格`)

// 并行处理所有异兽
const results = await parallel(beasts.map((beast) => async () => {
  log(`开始重写：${beast.name}`)

  const result = await agent(
    `你是一位专业的儿童文学作家，擅长写冒险故事。现在要为6岁小朋友重写《山海经》中"${beast.name}"的神话故事。

## 背景资料
${beast.name}的核心能力和特征：${beast.abilities}

请先用 WebSearch 搜索"${beast.name} 山海经 神话传说 故事"，了解这个异兽的详细神话背景。

## 写作要求

### 1. 故事风格：参考西游记
- **要有主角**：以${beast.name}为主角，或有人类/动物主角与${beast.name}互动
- **要有冒险**：主角要面对挑战、解决困难
- **要有冲突**：设置合理的障碍或对手
- **要有成长**：主角从故事中学到东西或变得更好
- **要有结局**：完整的故事结尾

### 2. 字数要求
- **目标800字左右**（600-1000字之间）
- 比之前更长，情节更丰富

### 3. 内容要求
- **突出异兽特征**：故事要展现${beast.name}的特殊能力和外形特点
- **引起兴趣**：有趣的情节、生动的描写、吸引人的冲突
- **适合6岁**：语言简单，避免恐怖暴力，添加温暖积极元素
- **教育意义**：自然融入正面价值观

### 4. 故事结构建议
可以参考这样的结构（不是必须）：
- **开头**：介绍主角和背景（100-150字）
- **发展**：遇到困难或挑战（200-300字）
- **高潮**：运用能力解决问题（200-300字）
- **结尾**：圆满结局+感悟（150-200字）

## 输出步骤
1. 用 WebSearch 搜索研究${beast.name}的神话传说
2. 构思一个有冒险、冲突、成长的800字故事
3. 用 Write 工具保存到：/root/k12/books/stories/${beast.file}

## 格式
\`\`\`
# ${beast.name}——[副标题]

[故事正文，600-1000字，建议800字左右]

---
**小朋友，你知道吗？**
[2-3句话，介绍${beast.name}在《山海经》中的真实记载]
\`\`\`

记住：故事要有趣、有冒险、有冲突、有成长，让小朋友读得津津有味！`,
    {
      label: `重写${beast.name}故事`,
      phase: '重写故事'
    }
  )

  return { beast: beast.name, file: beast.file }
}))

log(`所有故事重写完成，共 ${results.length} 个`)

return {
  total: beasts.length,
  rewritten: results.length,
  beasts: results.map(r => r.beast)
}
