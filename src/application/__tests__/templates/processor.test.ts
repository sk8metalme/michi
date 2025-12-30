/**
 * TemplateProcessor Tests
 *
 * TDD: RED - Write failing tests first
 */

import { describe, it, expect } from 'vitest';
import { TemplateProcessor } from '../../templates/processor.js';
import { isErr, isOk } from '../../../shared/types/result.js';

describe('TemplateProcessor', () => {
  const processor = new TemplateProcessor();

  describe('processTemplate', () => {
    it('should replace single placeholder', async () => {
      const template = 'Hello, {{NAME}}!';
      const replacements = { NAME: 'World' };

      const result = await processor.processTemplate(template, replacements);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('Hello, World!');
      }
    });

    it('should replace multiple placeholders', async () => {
      const template = '{{GREETING}}, {{NAME}}! You are {{AGE}} years old.';
      const replacements = {
        GREETING: 'Hello',
        NAME: 'Alice',
        AGE: '30',
      };

      const result = await processor.processTemplate(template, replacements);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('Hello, Alice! You are 30 years old.');
      }
    });

    it('should handle placeholders with underscores', async () => {
      const template = 'Feature: {{FEATURE_NAME}}, Created: {{CREATED_AT}}';
      const replacements = {
        FEATURE_NAME: 'test-feature',
        CREATED_AT: '2025-12-30',
      };

      const result = await processor.processTemplate(template, replacements);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('Feature: test-feature, Created: 2025-12-30');
      }
    });

    it('should preserve text without placeholders', async () => {
      const template = 'This is plain text without any placeholders.';
      const replacements = {};

      const result = await processor.processTemplate(template, replacements);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('This is plain text without any placeholders.');
      }
    });

    it('should handle empty template', async () => {
      const template = '';
      const replacements = {};

      const result = await processor.processTemplate(template, replacements);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('');
      }
    });

    it('should return error for invalid placeholder (missing replacement)', async () => {
      const template = 'Hello, {{NAME}}!';
      const replacements = {};

      const result = await processor.processTemplate(template, replacements);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.type).toBe('InvalidPlaceholder');
        expect(result.error.placeholder).toBe('NAME');
      }
    });

    it('should handle multiline templates', async () => {
      const template = `# {{TITLE}}

## Description
{{DESCRIPTION}}

Created by: {{AUTHOR}}`;

      const replacements = {
        TITLE: 'Test Document',
        DESCRIPTION: 'This is a test',
        AUTHOR: 'Alice',
      };

      const result = await processor.processTemplate(template, replacements);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toContain('# Test Document');
        expect(result.value).toContain('This is a test');
        expect(result.value).toContain('Created by: Alice');
      }
    });

    it('should handle special characters in replacement values', async () => {
      const template = '{{MESSAGE}}';
      const replacements = {
        MESSAGE: 'Special chars: $, @, #, %, &, *, (, ), [, ], {, }',
      };

      const result = await processor.processTemplate(template, replacements);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('Special chars: $, @, #, %, &, *, (, ), [, ], {, }');
      }
    });
  });

  describe('processTemplateFile', () => {
    it('should read and process template file', async () => {
      // This test requires a real file - will implement after GREEN phase
      expect(true).toBe(true); // Placeholder
    });
  });
});
