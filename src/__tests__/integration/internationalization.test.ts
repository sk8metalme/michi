/**
 * Integration tests for Internationalization (i18n) support
 * 
 * Tests AI-driven multilingual approach with DEV_GUIDELINES placeholders
 * Issue #40 (v0.0.9): 多言語サポートシステムの実装
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { readFileSync } from 'fs';
import { setupExisting } from '../../commands/setup-existing.js';
import { createTestProject, TestProject } from './setup/helpers/test-project.js';
import {
  assertFileExists,
  assertFileContains
} from './setup/helpers/fs-assertions.js';
import { createTemplateContext, renderTemplate } from '../../../scripts/template/renderer.js';
import { DEV_GUIDELINES_MAP } from '../../../scripts/constants/languages.js';

// Mock readline to auto-confirm prompts
vi.mock('readline', () => ({
  createInterface: () => ({
    question: (question: string, callback: (answer: string) => void) => {
      callback('y'); // Auto-confirm
    },
    close: () => {},
  }),
}));

describe('Internationalization (i18n) E2E', () => {
  let testProject: TestProject;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testProject = createTestProject({ name: 'i18n-test' });
    process.chdir(testProject.path);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    testProject.destroy();
  });

  describe('Japanese Language Support', () => {
    it('should setup project with Japanese language (default)', async () => {
      await setupExisting({
        claude: true,
        projectName: 'テストプロジェクト',
        jiraKey: 'TEST'
      });

      // Verify project.json has Japanese language
      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      assertFileExists(projectJsonPath);
      assertFileContains(projectJsonPath, '"language": "ja"');
    });

    // DEPRECATED: Template distribution is deprecated in favor of plugin installation (v0.14.0)
    it.skip('should render templates with Japanese DEV_GUIDELINES', async () => {
      await setupExisting({
        claude: true,
        lang: 'ja',
        projectName: 'テストプロジェクト',
        jiraKey: 'TEST'
      });

      // Check if templates contain Japanese guidelines
      const rulesDir = join(testProject.path, '.claude/rules');
      const ruleFiles = ['atlassian-integration.md', 'michi-core.md'];

      for (const ruleFile of ruleFiles) {
        const rulePath = join(rulesDir, ruleFile);
        assertFileExists(rulePath);

        const content = readFileSync(rulePath, 'utf-8');
        
        // Should NOT contain placeholder
        expect(content).not.toContain('{{DEV_GUIDELINES}}');
        
        // Should contain Japanese guidelines
        expect(content).toContain('Think in English');
        expect(content).toContain('Japanese');
        expect(content).toContain('日本語');
      }
    });

    it('should have correct Japanese DEV_GUIDELINES format', () => {
      const guidelines = DEV_GUIDELINES_MAP.ja;
      
      expect(guidelines).toContain('Think in English');
      expect(guidelines).toContain('generate responses in Japanese');
      expect(guidelines).toContain('思考は英語');
      expect(guidelines).toContain('回答の生成は日本語');
    });
  });

  describe('English Language Support', () => {
    it('should setup project with English language', async () => {
      await setupExisting({
        claude: true,
        lang: 'en',
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      // Verify project.json has English language
      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      assertFileExists(projectJsonPath);
      assertFileContains(projectJsonPath, '"language": "en"');
    });

    // DEPRECATED: Template distribution is deprecated in favor of plugin installation (v0.14.0)
    it.skip('should render templates with English DEV_GUIDELINES', async () => {
      await setupExisting({
        claude: true,
        lang: 'en',
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      // Check if templates contain English guidelines
      const rulesDir = join(testProject.path, '.claude/rules');
      const ruleFiles = ['atlassian-integration.md', 'michi-core.md'];

      for (const ruleFile of ruleFiles) {
        const rulePath = join(rulesDir, ruleFile);
        assertFileExists(rulePath);

        const content = readFileSync(rulePath, 'utf-8');
        
        // Should NOT contain placeholder
        expect(content).not.toContain('{{DEV_GUIDELINES}}');
        
        // Should contain English guidelines
        expect(content).toContain('Think in English');
        expect(content).toContain('generate responses in English');
        
        // Should NOT contain Japanese
        expect(content).not.toContain('日本語');
      }
    });

    it('should have correct English DEV_GUIDELINES format', () => {
      const guidelines = DEV_GUIDELINES_MAP.en;
      
      expect(guidelines).toBe('- Think in English, generate responses in English');
    });
  });

  describe('Template Rendering', () => {
    it('should render template with Japanese context', () => {
      const template = `---
title: Test Rule
description: {{DEV_GUIDELINES}} for testing
---

# Test Rule

{{DEV_GUIDELINES}}

## Other content
`;

      const context = createTemplateContext('ja', '.kiro', '.claude');
      const rendered = renderTemplate(template, context);

      // Should replace all placeholders
      expect(rendered).not.toContain('{{DEV_GUIDELINES}}');
      
      // Should contain Japanese guidelines
      expect(rendered).toContain('Think in English');
      expect(rendered).toContain('Japanese');
      expect(rendered).toContain('日本語');
    });

    it('should render template with English context', () => {
      const template = `---
title: Test Rule
description: {{DEV_GUIDELINES}} for testing
---

# Test Rule

{{DEV_GUIDELINES}}

## Other content
`;

      const context = createTemplateContext('en', '.kiro', '.claude');
      const rendered = renderTemplate(template, context);

      // Should replace all placeholders
      expect(rendered).not.toContain('{{DEV_GUIDELINES}}');
      
      // Should contain English guidelines
      expect(rendered).toContain('Think in English, generate responses in English');
      
      // Should NOT contain Japanese
      expect(rendered).not.toContain('日本語');
    });

    it('should handle multiple placeholders in template', () => {
      const template = `Language: {{LANG_CODE}}
Guidelines: {{DEV_GUIDELINES}}
Kiro Dir: {{KIRO_DIR}}
Agent Dir: {{AGENT_DIR}}
`;

      const context = createTemplateContext('ja', '.kiro', '.claude');
      const rendered = renderTemplate(template, context);

      expect(rendered).toContain('Language: ja');
      expect(rendered).toContain('Guidelines: - Think in English');
      expect(rendered).toContain('Kiro Dir: .kiro');
      expect(rendered).toContain('Agent Dir: .claude');
    });

    it('should preserve unrecognized placeholders', () => {
      const template = `Known: {{LANG_CODE}}
Unknown: {{UNKNOWN_PLACEHOLDER}}
`;

      const context = createTemplateContext('ja', '.kiro', '.claude');
      const rendered = renderTemplate(template, context);

      // Known placeholder should be replaced
      expect(rendered).toContain('Known: ja');
      
      // Unknown placeholder should be preserved
      expect(rendered).toContain('Unknown: {{UNKNOWN_PLACEHOLDER}}');
    });
  });

  describe('All Supported Languages', () => {
    const languages = [
      { code: 'ja', name: 'Japanese' },
      { code: 'en', name: 'English' },
      { code: 'zh-TW', name: 'Traditional Chinese' },
      { code: 'zh', name: 'Simplified Chinese' },
      { code: 'es', name: 'Spanish' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'de', name: 'German' },
      { code: 'fr', name: 'French' },
      { code: 'ru', name: 'Russian' },
      { code: 'it', name: 'Italian' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' }
    ];

    languages.forEach(({ code, name }) => {
      it(`should have DEV_GUIDELINES for ${name} (${code})`, () => {
        const guidelines = DEV_GUIDELINES_MAP[code as keyof typeof DEV_GUIDELINES_MAP];
        
        expect(guidelines).toBeDefined();
        expect(guidelines).not.toBe('');
        expect(guidelines.length).toBeGreaterThan(0);
        
        // All guidelines should mention "Think in English" or equivalent
        const hasEnglishThinking = 
          guidelines.includes('Think in English') ||
          guidelines.includes('以英文思考') ||
          guidelines.includes('Думай по-английски') ||
          guidelines.includes('فكر بالإنجليزية');
        
        expect(hasEnglishThinking).toBe(true);
      });

      it(`should setup project with ${name} (${code})`, async () => {
        await setupExisting({
          claude: true,
          lang: code,
          projectName: 'Test Project',
          jiraKey: 'TEST'
        });

        const projectJsonPath = join(testProject.path, '.kiro/project.json');
        assertFileContains(projectJsonPath, `"language": "${code}"`);
      });
    });
  });

  describe('Template Context Creation', () => {
    it('should create context with all required fields', () => {
      const context = createTemplateContext('ja', '.kiro', '.claude');
      
      expect(context).toHaveProperty('LANG_CODE', 'ja');
      expect(context).toHaveProperty('DEV_GUIDELINES');
      expect(context).toHaveProperty('KIRO_DIR', '.kiro');
      expect(context).toHaveProperty('AGENT_DIR', '.claude');
      
      expect(context.DEV_GUIDELINES).toContain('Think in English');
      expect(context.DEV_GUIDELINES).toContain('日本語');
    });

    it('should create context for different environments', () => {
      const claudeContext1 = createTemplateContext('ja', '.kiro', '.claude');
      const claudeContext2 = createTemplateContext('en', '.kiro', '.claude');

      expect(claudeContext1.AGENT_DIR).toBe('.claude');
      expect(claudeContext2.AGENT_DIR).toBe('.claude');

      // DEV_GUIDELINES should be different for different languages
      expect(claudeContext1.DEV_GUIDELINES).not.toBe(claudeContext2.DEV_GUIDELINES);
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported language code', async () => {
      await expect(async () => {
        await setupExisting({
          claude: true,
          lang: 'invalid-lang',
          projectName: 'Test Project',
          jiraKey: 'TEST'
        });
      }).rejects.toThrow(/Unsupported language/);
    });

    it('should handle empty template gracefully', () => {
      const template = '';
      const context = createTemplateContext('ja', '.kiro', '.claude');
      const rendered = renderTemplate(template, context);
      
      expect(rendered).toBe('');
    });

    it('should handle template without placeholders', () => {
      const template = 'This is a plain template without any placeholders.';
      const context = createTemplateContext('ja', '.kiro', '.claude');
      const rendered = renderTemplate(template, context);
      
      expect(rendered).toBe(template);
    });
  });

  describe('Real-world Scenarios', () => {
    // DEPRECATED: Template distribution is deprecated in favor of plugin installation (v0.14.0)
    it.skip('should correctly render Michi Core template in Japanese', async () => {
      await setupExisting({
        claude: true,
        lang: 'ja',
        projectName: 'リアルプロジェクト',
        jiraKey: 'REAL'
      });

      const michiCorePath = join(testProject.path, '.claude/rules/michi-core.md');
      assertFileExists(michiCorePath);

      const content = readFileSync(michiCorePath, 'utf-8');

      // Should have rendered guidelines
      expect(content).toContain('Think in English');
      expect(content).toContain('日本語');

      // Should not have placeholder
      expect(content).not.toContain('{{DEV_GUIDELINES}}');
    });

    // DEPRECATED: Template distribution is deprecated in favor of plugin installation (v0.14.0)
    it.skip('should correctly render Michi Core template in English', async () => {
      await setupExisting({
        claude: true,
        lang: 'en',
        projectName: 'Real Project',
        jiraKey: 'REAL'
      });

      const michiCorePath = join(testProject.path, '.claude/rules/michi-core.md');
      assertFileExists(michiCorePath);

      const content = readFileSync(michiCorePath, 'utf-8');

      // Should have rendered guidelines
      expect(content).toContain('Think in English');
      expect(content).toContain('generate responses in English');
      
      // Should not have placeholder
      expect(content).not.toContain('{{DEV_GUIDELINES}}');
      
      // Should not have Japanese
      expect(content).not.toContain('日本語');
    });

    it('should support multiple projects with different languages', async () => {
      // Setup Japanese project
      const jaProject = createTestProject({ name: 'ja-project' });
      process.chdir(jaProject.path);
      
      await setupExisting({
        claude: true,
        lang: 'ja',
        projectName: '日本語プロジェクト',
        jiraKey: 'JAPROJ'
      });
      
      const jaProjectJson = join(jaProject.path, '.kiro/project.json');
      assertFileContains(jaProjectJson, '"language": "ja"');

      // Setup English project
      const enProject = createTestProject({ name: 'en-project' });
      process.chdir(enProject.path);
      
      await setupExisting({
        claude: true,
        lang: 'en',
        projectName: 'English Project',
        jiraKey: 'ENPROJ'
      });
      
      const enProjectJson = join(enProject.path, '.kiro/project.json');
      assertFileContains(enProjectJson, '"language": "en"');

      // Cleanup
      process.chdir(originalCwd);
      jaProject.destroy();
      enProject.destroy();
    });
  });
});





