/**
 * Language configuration for LingoMem
 */

const languages = {
  english: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    code: 'en',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    defaultWords: ['hello', 'world', 'learn', 'study', 'book', 'read', 'write', 'speak', 'listen', 'practice']
  },
  german: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    code: 'de',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    defaultWords: ['hallo', 'welt', 'lernen', 'studieren', 'buch', 'lesen', 'schreiben', 'sprechen', 'hören', 'üben']
  },
  french: {
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    code: 'fr',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    defaultWords: ['bonjour', 'monde', 'apprendre', 'étudier', 'livre', 'lire', 'écrire', 'parler', 'écouter', 'pratiquer']
  },
  japanese: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    code: 'ja',
    levels: ['N5', 'N4', 'N3', 'N2', 'N1'],
    defaultWords: ['こんにちは', '世界', '学ぶ', '勉強', '本', '読む', '書く', '話す', '聞く', '練習']
  }
};

/**
 * Get language configuration
 */
function getLanguageConfig(language) {
  return languages[language] || languages.english;
}

/**
 * Get all supported languages
 */
function getSupportedLanguages() {
  return Object.keys(languages);
}

/**
 * Validate language code
 */
function isValidLanguage(language) {
  return language in languages;
}

module.exports = {
  languages,
  getLanguageConfig,
  getSupportedLanguages,
  isValidLanguage
};