/**
 * Japanese-specific prompts for LingoMem
 */

function japaneseCardPrompt(word) {
  return `请为日语单词/词汇"${word}"生成一张学习卡片。

重要提示：必须替换所有方括号占位符为实际内容，不要留下任何[占位符]文本。

请严格按照以下JSON格式返回（必须是有效的JSON，不要添加任何注释或额外文本）：

{
  "word": "${word}",
  "phonetic": "[假名读音和音调，格式：ひらがな [音调数字]，不要包含罗马音]",
  "level": "[N5/N4/N3/N2/N1]",
  "definitions": [
    {
      "pos": "[词性]",
      "meaning": "[中文释义1]",
      "example": {
        "sentence": "[日语例句]",
        "translation": "[中文翻译]"
      }
    },
    {
      "pos": "[词性]",
      "meaning": "[中文释义2]",
      "example": {
        "sentence": "[日语例句]",
        "translation": "[中文翻译]"
      }
    }
  ],
  "conjugation": "[如果是动词，提供HTML格式的动词变形表，包含：ます形、て形、た形、ない形、辞书形、意志形、命令形、条件形等]",
  "inflection": "[如果是形容词，提供HTML格式的形容词变形表，包含：基本形、过去形、否定形、过去否定形等]",
  "etymology": "[词源解释]",
  "tips": "[学习提示]"
}

关键要求：
1. phonetic格式：只包含假名和音调数字，例如"たいせつ [0]"，不要包含罗马音和括号
2. 如果是动词，必须提供conjugation字段，使用HTML表格格式
3. 如果是形容词，必须提供inflection字段，使用HTML表格格式
4. 名词、副词等不需要conjugation或inflection字段
5. definitions至少2个
6. 所有解释用中文
7. 只返回JSON，不要markdown标记`;
}

function japaneseRecommendationPrompt(knownWords, stats, count) {
  return `我正在学习日语，当前水平是 ${stats.level === 'beginner' ? 'N5-N4（初学者）' : stats.level === 'intermediate' ? 'N3-N2（中级）' : 'N2-N1（高级）'}，已经学习了 ${stats.totalWords} 个单词。

已学单词列表（请避免推荐这些单词）：
${knownWords.length > 0 ? knownWords.slice(-50).join('、') : '暂无'}

请根据我的学习进度，推荐 ${count} 个适合我当前水平的日语单词。

要求：
1. 单词难度要适合我的当前水平
2. 绝对不要推荐我已经学过的单词
3. 优先推荐常用、实用的单词
4. 单词之间要有一定的主题关联性
5. 包含不同词性的单词（名词、动词、形容词等）
6. 可以包含汉字词、假名词和外来语

输出格式要求：
- 只返回单词列表，每行一个单词
- 不要添加序号、标点或其他说明
- 不要添加任何解释或注释
- 确保每个单词都是有效的日语单词

示例输出格式：
こんにちは
勉強
食べる`;
}

function japaneseCustomPrompt(customPrompt, knownWords, count) {
  return `用户需求：${customPrompt}

已学单词列表（请避免推荐这些单词）：
${knownWords.length > 0 ? knownWords.slice(-50).join('、') : '暂无'}

请根据用户的需求，推荐 ${count} 个合适的日语单词。

要求：
1. 严格符合用户的描述和需求
2. 绝对不要推荐已学过的单词
3. 单词要实用、常用
4. 如果用户指定了难度等级（N5-N1），请严格遵守
5. 如果用户指定了主题，请围绕该主题推荐
6. 可以包含汉字词、假名词和外来语

输出格式要求：
- 只返回单词列表，每行一个单词
- 不要添加序号、标点或其他说明
- 不要添加任何解释或注释
- 确保每个单词都是有效的日语单词

示例输出格式：
こんにちは
勉強
食べる`;
}

module.exports = {
  japaneseCardPrompt,
  japaneseRecommendationPrompt,
  japaneseCustomPrompt
};