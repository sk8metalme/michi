/**
 * Supported languages and development guidelines map
 * 
 * Issue #37: 環境別コピー実装
 */

export const supportedLanguages = [
  'ja', 'en', 'zh-TW', 'zh', 'es', 'pt', 
  'de', 'fr', 'ru', 'it', 'ko', 'ar'
] as const;

export type SupportedLanguage = typeof supportedLanguages[number];

export const DEV_GUIDELINES_MAP: Record<SupportedLanguage, string> = {
  en: '- Think in English, generate responses in English',
    
  ja: '- Think in English, but generate responses in Japanese ' +
        '(思考は英語、回答の生成は日本語で行うように)',
    
  'zh-TW': '- 以英文思考,但以繁體中文生成回應' +
             '(Think in English, generate in Traditional Chinese)',
    
  zh: '- 以英文思考,但以简体中文生成回复' +
        '(Think in English, generate in Simplified Chinese)',
    
  es: '- Think in English, generate responses in Spanish ' +
        '(Piensa en inglés, genera respuestas en español)',
    
  pt: '- Think in English, generate responses in Portuguese ' +
        '(Pense em inglês, gere respostas em português)',
    
  de: '- Think in English, generate responses in German ' +
        '(Denke auf Englisch, formuliere Antworten auf Deutsch)',
    
  fr: '- Think in English, generate responses in French ' +
        '(Pensez en anglais, générez des réponses en français)',
    
  ru: '- Think in English, generate responses in Russian ' +
        '(Думай по-английски, отвечай по-русски)',
    
  it: '- Think in English, generate responses in Italian ' +
        '(Pensa in inglese, genera risposte in italiano)',
    
  ko: '- Think in English, generate responses in Korean ' +
        '(영어로 사고하고, 한국어로 응답을 생성하세요)',
    
  ar: '- Think in English, generate responses in Arabic ' +
        '(فكر بالإنجليزية وأجب بالعربية)',
};

/**
 * Get development guidelines for a specific language
 * 
 * @param lang - Language code
 * @returns Development guidelines string
 */
export const getDevGuidelines = (lang: SupportedLanguage): string => {
  return DEV_GUIDELINES_MAP[lang];
};

/**
 * Validate if a language code is supported
 * 
 * @param lang - Language code to validate
 * @returns True if supported, false otherwise
 */
export const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
  return (supportedLanguages as readonly string[]).includes(lang);
};

