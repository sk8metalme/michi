import { describe, it, expect } from 'vitest';
import {
  createTemplateContext,
  renderTemplate,
  renderJsonTemplate,
  renderTemplates
} from '../renderer.js';

describe('renderer', () => {
  describe('createTemplateContext', () => {
    it('should create context with all required fields', () => {
      const context = createTemplateContext('ja', '.michi', '.claude');
      
      expect(context).toHaveProperty('LANG_CODE');
      expect(context).toHaveProperty('DEV_GUIDELINES');
      expect(context).toHaveProperty('SPEC_DIR');
      expect(context).toHaveProperty('AGENT_DIR');
      expect(context.LANG_CODE).toBe('ja');
      expect(context.SPEC_DIR).toBe('.michi');
      expect(context.AGENT_DIR).toBe('.claude');
    });

    it('should include language-specific guidelines', () => {
      const contextJa = createTemplateContext('ja', '.michi', '.claude');
      expect(contextJa.DEV_GUIDELINES).toContain('日本語');
      
      const contextEn = createTemplateContext('en', '.michi', '.claude');
      expect(contextEn.DEV_GUIDELINES).toContain('English');
    });
  });

  describe('renderTemplate', () => {
    it('should replace single placeholder', () => {
      const template = 'Language: {{LANG_CODE}}';
      const context = createTemplateContext('ja', '.michi', '.claude');
      const result = renderTemplate(template, context);
      
      expect(result).toBe('Language: ja');
    });

    it('should replace multiple placeholders', () => {
      const template = 'Lang: {{LANG_CODE}}, Kiro: {{SPEC_DIR}}, Agent: {{AGENT_DIR}}';
      const context = createTemplateContext('en', '.michi', '.claude');
      const result = renderTemplate(template, context);
      
      expect(result).toBe('Lang: en, Kiro: .michi, Agent: .claude');
    });

    it('should replace same placeholder multiple times', () => {
      const template = '{{LANG_CODE}} is {{LANG_CODE}}';
      const context = createTemplateContext('ja', '.michi', '.claude');
      const result = renderTemplate(template, context);
      
      expect(result).toBe('ja is ja');
    });

    it('should leave unknown placeholders unchanged', () => {
      const template = 'Known: {{LANG_CODE}}, Unknown: {{UNKNOWN}}';
      const context = createTemplateContext('ja', '.michi', '.claude');
      const result = renderTemplate(template, context);
      
      expect(result).toBe('Known: ja, Unknown: {{UNKNOWN}}');
    });

    it('should handle DEV_GUIDELINES placeholder', () => {
      const template = '{{DEV_GUIDELINES}}';
      const context = createTemplateContext('ja', '.michi', '.claude');
      const result = renderTemplate(template, context);
      
      expect(result).toContain('Think in English');
      expect(result).toContain('日本語');
    });

    it('should handle empty template', () => {
      const template = '';
      const context = createTemplateContext('ja', '.michi', '.claude');
      const result = renderTemplate(template, context);
      
      expect(result).toBe('');
    });

    it('should handle template with no placeholders', () => {
      const template = 'No placeholders here';
      const context = createTemplateContext('ja', '.michi', '.claude');
      const result = renderTemplate(template, context);
      
      expect(result).toBe('No placeholders here');
    });

    it('should handle multiline template', () => {
      const template = `Line 1: {{LANG_CODE}}
Line 2: {{SPEC_DIR}}
Line 3: {{AGENT_DIR}}`;
      const context = createTemplateContext('en', '.michi', '.claude');
      const result = renderTemplate(template, context);
      
      expect(result).toBe(`Line 1: en
Line 2: .michi
Line 3: .claude`);
    });
  });

  describe('renderJsonTemplate', () => {
    it('should render and parse JSON template', () => {
      const template = '{"lang": "{{LANG_CODE}}", "dir": "{{SPEC_DIR}}"}';
      const context = createTemplateContext('ja', '.michi', '.claude');
      const result = renderJsonTemplate(template, context);
      
      expect(result).toEqual({ lang: 'ja', dir: '.michi' });
    });

    it('should handle nested JSON', () => {
      const template = '{"config": {"lang": "{{LANG_CODE}}", "paths": {"kiro": "{{SPEC_DIR}}"}}}';
      const context = createTemplateContext('en', '.michi', '.claude');
      const result = renderJsonTemplate(template, context);
      
      expect(result).toEqual({
        config: {
          lang: 'en',
          paths: {
            kiro: '.michi'
          }
        }
      });
    });

    it('should handle JSON arrays', () => {
      const template = '["{{LANG_CODE}}", "{{SPEC_DIR}}", "{{AGENT_DIR}}"]';
      const context = createTemplateContext('ja', '.michi', '.claude');
      const result = renderJsonTemplate(template, context);
      
      expect(result).toEqual(['ja', '.michi', '.claude']);
    });

    it('should throw on invalid JSON', () => {
      const template = 'invalid json {{LANG_CODE}}';
      const context = createTemplateContext('ja', '.michi', '.claude');
      
      expect(() => renderJsonTemplate(template, context)).toThrow();
    });

    it('should throw with descriptive error for invalid JSON', () => {
      const template = '{"incomplete": {{LANG_CODE}}';
      const context = createTemplateContext('ja', '.michi', '.claude');
      
      try {
        renderJsonTemplate(template, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        
        // Should contain descriptive information
        expect(errorMessage).toContain('Failed to parse rendered JSON template');
        expect(errorMessage).toContain('Original error:');
        expect(errorMessage).toContain('Rendered output');
        expect(errorMessage).toContain('Template context');
        expect(errorMessage).toContain('LANG_CODE=ja');
        expect(errorMessage).toContain('SPEC_DIR=.michi');
      }
    });

    it('should preserve original error stack', () => {
      const template = '{invalid json}';
      const context = createTemplateContext('en', '.michi', '.claude');
      
      try {
        renderJsonTemplate(template, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorStack = (error as Error).stack;
        
        // Should contain original error stack
        expect(errorStack).toContain('Original error stack:');
      }
    });
  });

  describe('renderTemplates', () => {
    it('should render multiple templates', () => {
      const templates = {
        template1: 'Lang: {{LANG_CODE}}',
        template2: 'Dir: {{SPEC_DIR}}',
        template3: 'Agent: {{AGENT_DIR}}'
      };
      const context = createTemplateContext('ja', '.michi', '.claude');
      const results = renderTemplates(templates, context);
      
      expect(results).toEqual({
        template1: 'Lang: ja',
        template2: 'Dir: .michi',
        template3: 'Agent: .claude'
      });
    });

    it('should handle empty templates object', () => {
      const templates = {};
      const context = createTemplateContext('ja', '.michi', '.claude');
      const results = renderTemplates(templates, context);
      
      expect(results).toEqual({});
    });
  });
});

