/**
 * German-specific prompts for LingoMem
 */

function germanCardPrompt(word) {
  return `请为德语单词"${word}"生成一张学习卡片。

重要提示：必须替换所有方括号占位符为实际内容，不要留下任何[占位符]文本。

请严格按照以下JSON格式返回（必须是有效的JSON，不要添加任何注释或额外文本）：

{
  "word": "${word}",
  "phonetic": "[替换为实际音标，如：[vɔʁt]，注意德语特殊发音]",
  "level": "[替换为实际难度等级：A1/A2/B1/B2/C1/C2]",
  "definitions": [
    {
      "pos": "[替换为实际词性：das/der/die + 名词/动词/形容词/副词/介词等，名词要标注性别]",
      "meaning": "[替换为实际中文释义1]",
      "example": {
        "sentence": "[替换为该释义对应的实际德语例句]",
        "translation": "[替换为该例句的实际中文翻译]"
      }
    },
    {
      "pos": "[替换为实际词性]",
      "meaning": "[替换为实际中文释义2]",
      "example": {
        "sentence": "[替换为该释义对应的实际德语例句]",
        "translation": "[替换为该例句的实际中文翻译]"
      }
    }
  ],
  "etymology": "[替换为实际词源说明，包括词根、前缀、后缀、复合词构成等]",
  "tips": "[替换为实际学习提示和记忆技巧，可以包含性别记忆、格变化规则、动词变位提示等]"
}

关键要求：
1. 必须替换所有方括号占位符为真实内容
2. 不要在最终输出中留下任何[占位符]文本
3. 确保JSON格式正确且可解析
4. definitions 必须至少包含2个不同词性或含义
5. 每个 definition 必须包含一个对应的 example（例句要体现该释义的用法）
6. 所有解释和翻译必须使用中文
7. 只返回JSON对象，不要添加任何其他文本或markdown标记
8. 不要使用代码块标记（\`\`\`json）
9. 名词必须标注性别（der/die/das）和复数形式
10. 动词要说明是否可分离、是否需要sein作助动词
11. 形容词要说明比较级和最高级形式（如果不规则）`;
}

function germanRecommendationPrompt(knownWords, stats, count) {
  const levelDescriptions = {
    beginner: 'A1-A2（初学者）',
    elementary: 'A2-B1（基础）',
    intermediate: 'B1-B2（中级）',
    'upper-intermediate': 'B2-C1（中高级）',
    advanced: 'C1-C2（高级）',
    proficient: 'C2（精通）'
  };

  return `我正在学习德语，当前水平是 ${levelDescriptions[stats.level] || 'B1（中级）'}，已经学习了 ${stats.totalWords} 个单词。

已学单词列表（请避免推荐这些单词）：
${knownWords.length > 0 ? knownWords.slice(-50).join(', ') : '暂无'}

请根据我的学习进度，推荐 ${count} 个适合我当前水平的德语单词。

要求：
1. 单词难度要适合我的当前水平
2. 绝对不要推荐我已经学过的单词
3. 优先推荐常用、实用的单词
4. 单词之间要有一定的主题关联性
5. 包含不同词性的单词（名词、动词、形容词等）
6. 名词要注意三性（阳性、阴性、中性）的平衡

输出格式要求：
- 只返回单词列表，每行一个单词
- 不要添加序号、标点或其他说明
- 不要添加任何解释或注释
- 确保每个单词都是有效的德语单词
- 名词不需要加冠词

示例输出格式：
Haus
lernen
schön`;
}

function germanCustomPrompt(customPrompt, knownWords, count) {
  return `用户需求：${customPrompt}

已学单词列表（请避免推荐这些单词）：
${knownWords.length > 0 ? knownWords.slice(-50).join(', ') : '暂无'}

请根据用户的需求，推荐 ${count} 个合适的德语单词。

要求：
1. 严格符合用户的描述和需求
2. 绝对不要推荐已学过的单词
3. 单词要实用、常用
4. 如果用户指定了难度等级，请严格遵守
5. 如果用户指定了主题，请围绕该主题推荐

输出格式要求：
- 只返回单词列表，每行一个单词
- 不要添加序号、标点或其他说明
- 不要添加任何解释或注释
- 确保每个单词都是有效的德语单词
- 名词不需要加冠词

示例输出格式：
Haus
lernen
schön`;
}

module.exports = {
  germanCardPrompt,
  germanRecommendationPrompt,
  germanCustomPrompt
};