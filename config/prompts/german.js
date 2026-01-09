/**
 * German-specific prompts for LingoMem
 */

function germanCardPrompt(word) {
  return `请为德语单词"${word}"生成一张学习卡片。

请严格按照以下JSON格式返回（必须是有效的JSON）：

{
  "word": "${word}",
  "phonetic": "[音标]",
  "level": "[A1/A2/B1/B2/C1/C2]",
  "definitions": [
    {
      "pos": "[词性，名词要标注性别]",
      "meaning": "[中文释义]",
      "example": {
        "sentence": "[德语例句]",
        "translation": "[中文翻译]"
      }
    }
  ],
  "conjugation": "[如果是动词，提供HTML表格：动词变位]",
  "inflection": "[如果是形容词，提供HTML表格：词尾变化（阳性/阴性/中性，单复数）]",
  "declension": "[如果是名词，提供HTML表格：四格单复数]",
  "etymology": "[词源说明]",
  "tips": "[学习提示]"
}

要求：
1. 动词必须提供conjugation
2. 形容词必须提供inflection
3. 名词必须提供declension
4. definitions至少2个
5. 只返回JSON`;
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