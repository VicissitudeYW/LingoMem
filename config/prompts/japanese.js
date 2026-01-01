/**
 * Japanese-specific prompts for LingoMem
 */

function japaneseCardPrompt(word) {
  return `请为日语单词/词汇"${word}"生成一张学习卡片。

重要提示：必须替换所有方括号占位符为实际内容，不要留下任何[占位符]文本。

请严格按照以下JSON格式返回（必须是有效的JSON，不要添加任何注释或额外文本）：

{
  "word": "${word}",
  "phonetic": "[替换为假名读音（如果都是假名则不用）和音调（比如 [0]），如果是汉字还要包含罗马音]",
  "level": "[替换为实际难度等级：N5/N4/N3/N2/N1]",
  "definitions": [
    {
      "pos": "[替换为实际词性：名词/动词/形容词/形容动词/副词/助词/接续词]",
      "meaning": "[替换为实际中文释义1]",
      "example": {
        "sentence": "[替换为该释义对应的实际日语例句]",
        "translation": "[替换为该例句的实际中文翻译]"
      }
    },
    {
      "pos": "[替换为实际词性]",
      "meaning": "[替换为实际中文释义2]",
      "example": {
        "sentence": "[替换为该释义对应的实际日语例句]",
        "translation": "[替换为该例句的实际中文翻译]"
      }
    }
  ],
  "etymology": "[替换为词源或构词解释（汉字构成、音读/训读、外来语来源等）]",
  "tips": "[替换为学习提示和记忆技巧，可以包含假名记忆、汉字联想、语法注意事项等]"
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
9. phonetic 必须包含假名读音，汉字词要标注音读/训读
10. 如果是动词，说明动词类型（五段/一段/カ变/サ变）
11. 如果是形容词，说明类型（い形容词/な形容词）`;
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