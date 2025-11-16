import { describe, it, expect } from 'vitest';
import {
  supportedLanguages,
  DEV_GUIDELINES_MAP,
  getDevGuidelines,
  isSupportedLanguage,
  type SupportedLanguage
} from '../languages.js';

describe('languages', () => {
  describe('supportedLanguages', () => {
    it('should contain 12 languages', () => {
      expect(supportedLanguages).toHaveLength(12);
    });

    it('should include expected languages', () => {
      expect(supportedLanguages).toContain('ja');
      expect(supportedLanguages).toContain('en');
      expect(supportedLanguages).toContain('zh-TW');
      expect(supportedLanguages).toContain('zh');
      expect(supportedLanguages).toContain('es');
      expect(supportedLanguages).toContain('pt');
      expect(supportedLanguages).toContain('de');
      expect(supportedLanguages).toContain('fr');
      expect(supportedLanguages).toContain('ru');
      expect(supportedLanguages).toContain('it');
      expect(supportedLanguages).toContain('ko');
      expect(supportedLanguages).toContain('ar');
    });
  });

  describe('DEV_GUIDELINES_MAP', () => {
    it('should have entries for all supported languages', () => {
      for (const lang of supportedLanguages) {
        expect(DEV_GUIDELINES_MAP[lang]).toBeDefined();
        expect(DEV_GUIDELINES_MAP[lang]).not.toBe('');
      }
    });

    it('should have English guideline', () => {
      expect(DEV_GUIDELINES_MAP.en).toBe('- Think in English, generate responses in English');
    });

    it('should have Japanese guideline with bilingual instruction', () => {
      expect(DEV_GUIDELINES_MAP.ja).toContain('Think in English');
      expect(DEV_GUIDELINES_MAP.ja).toContain('日本語');
    });

    it('should contain bilingual instructions', () => {
      // Most languages should mention "Think in English" in some form
      const languagesWithEnglishInstruction = ['ja', 'en', 'es', 'pt', 'de', 'fr', 'ru', 'it', 'ko', 'ar'];
      for (const lang of languagesWithEnglishInstruction) {
        expect(DEV_GUIDELINES_MAP[lang as SupportedLanguage]).toContain('Think in English');
      }
      
      // Chinese languages have their own format
      expect(DEV_GUIDELINES_MAP['zh-TW']).toContain('以英文思考');
      expect(DEV_GUIDELINES_MAP.zh).toContain('以英文思考');
    });
  });

  describe('getDevGuidelines', () => {
    it('should return guidelines for valid language', () => {
      const guidelines = getDevGuidelines('ja');
      expect(guidelines).toBe(DEV_GUIDELINES_MAP.ja);
    });

    it('should return guidelines for all supported languages', () => {
      for (const lang of supportedLanguages) {
        const guidelines = getDevGuidelines(lang);
        expect(guidelines).toBeDefined();
        expect(guidelines).toBe(DEV_GUIDELINES_MAP[lang]);
      }
    });
  });

  describe('isSupportedLanguage', () => {
    it('should return true for supported languages', () => {
      expect(isSupportedLanguage('ja')).toBe(true);
      expect(isSupportedLanguage('en')).toBe(true);
      expect(isSupportedLanguage('zh-TW')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isSupportedLanguage('xx')).toBe(false);
      expect(isSupportedLanguage('invalid')).toBe(false);
      expect(isSupportedLanguage('')).toBe(false);
    });

    it('should work as type guard', () => {
      const lang: string = 'ja';
      if (isSupportedLanguage(lang)) {
        // TypeScript should recognize lang as SupportedLanguage here
        const guidelines: string = DEV_GUIDELINES_MAP[lang];
        expect(guidelines).toBeDefined();
      }
    });
  });
});

