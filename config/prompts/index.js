/**
 * Unified prompt management for all languages
 */

const { englishCardPrompt, englishRecommendationPrompt, englishCustomPrompt } = require('./english');
const { germanCardPrompt, germanRecommendationPrompt, germanCustomPrompt } = require('./german');
const { frenchCardPrompt, frenchRecommendationPrompt, frenchCustomPrompt } = require('./french');
const { japaneseCardPrompt, japaneseRecommendationPrompt, japaneseCustomPrompt } = require('./japanese');

/**
 * Get card generation prompt for specific language
 */
function getCardPrompt(language, word) {
  const prompts = {
    english: englishCardPrompt,
    german: germanCardPrompt,
    french: frenchCardPrompt,
    japanese: japaneseCardPrompt
  };

  const promptFn = prompts[language] || prompts.english;
  return promptFn(word);
}

/**
 * Get recommendation prompt for specific language
 */
function getRecommendationPrompt(language, knownWords, stats, count) {
  const prompts = {
    english: englishRecommendationPrompt,
    german: germanRecommendationPrompt,
    french: frenchRecommendationPrompt,
    japanese: japaneseRecommendationPrompt
  };

  const promptFn = prompts[language] || prompts.english;
  return promptFn(knownWords, stats, count);
}

/**
 * Get custom recommendation prompt for specific language
 */
function getCustomPrompt(language, customPrompt, knownWords, count) {
  const prompts = {
    english: englishCustomPrompt,
    german: germanCustomPrompt,
    french: frenchCustomPrompt,
    japanese: japaneseCustomPrompt
  };

  const promptFn = prompts[language] || prompts.english;
  return promptFn(customPrompt, knownWords, count);
}

/**
 * Get system message for card generation
 */
function getCardSystemMessage(language) {
  const messages = {
    english: "You are a professional English language teaching assistant. Provide detailed analysis of English words following the exact JSON structure. IMPORTANT: You must REPLACE ALL bracketed placeholders with actual content - never leave placeholders like [Part of Speech] or [Chinese Meaning] in your final output.",
    german: "You are a professional German language teaching assistant. Provide detailed analysis of German words following the exact JSON structure. CRITICAL: You must ALWAYS return the complete JSON structure with ALL fields filled out, never return incomplete data or error messages. Replace ALL bracketed placeholders with actual content. Consider German language features such as grammatical gender, cases, and compound words.",
    french: "You are a professional French language teaching assistant. Provide detailed analysis of French words following the exact JSON structure. IMPORTANT: Always replace ALL bracketed placeholders with actual content and keep the structure intact. Consider French grammar including gender, verb conjugations, and pronunciation.",
    japanese: "You are a professional Japanese language teaching assistant. Provide detailed analysis of Japanese words following the exact JSON structure. IMPORTANT: Replace ALL placeholders with real content and keep structure unchanged. Consider kana, kanji, romaji and word types (verb groups, adjective types)."
  };

  return messages[language] || messages.english;
}

/**
 * Get system message for word recommendation
 */
function getRecommendationSystemMessage(language) {
  const languageNames = {
    english: 'English',
    german: 'German',
    french: 'French',
    japanese: 'Japanese'
  };

  const langName = languageNames[language] || 'English';

  return `You are a professional ${langName} language learning consultant. Your ONLY task is to return a list of words.

CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:
1. Return ONLY words, one per line
2. Return EXACTLY the number of words requested - no more, no less
3. NO numbers, NO punctuation, NO explanations, NO formatting, NO extra text
4. NO introductions like "Here are the words:" or conclusions
5. Just the words themselves, nothing else
6. Each word on a separate line
7. Do not recommend words the user already knows

Example of CORRECT output (if 3 words requested):
apple
banana
orange

Example of INCORRECT output:
1. apple
2. banana
Here are some words: apple, banana

Your response must contain ONLY the word list and nothing else.`;
}

module.exports = {
  getCardPrompt,
  getRecommendationPrompt,
  getCustomPrompt,
  getCardSystemMessage,
  getRecommendationSystemMessage
};