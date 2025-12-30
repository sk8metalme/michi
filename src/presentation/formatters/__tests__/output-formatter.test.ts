/**
 * Output Formatter Tests
 */

import { describe, it, expect } from 'vitest';
import {
  OutputFormatter,
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatStep,
  formatSection,
  formatListItem,
  formatKeyValue,
  formatCode,
  formatBlank,
} from '../output-formatter.js';

describe('OutputFormatter', () => {
  describe('success', () => {
    it('should format success message with emoji', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.success('Task completed');
      expect(result).toBe('✅ Task completed');
    });

    it('should format success message with markdown', () => {
      const formatter = new OutputFormatter({ markdown: true });
      const result = formatter.success('Task completed');
      expect(result).toBe('✅ Task completed');
    });

    it('should format success message with indent', () => {
      const formatter = new OutputFormatter({ color: false, indent: 2 });
      const result = formatter.success('Task completed');
      expect(result).toBe('    ✅ Task completed');
    });
  });

  describe('error', () => {
    it('should format error message with emoji', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.error('Task failed');
      expect(result).toBe('❌ Task failed');
    });
  });

  describe('warning', () => {
    it('should format warning message with emoji', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.warning('Deprecated feature');
      expect(result).toBe('⚠️ Deprecated feature');
    });
  });

  describe('info', () => {
    it('should format info message with emoji', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.info('Additional information');
      expect(result).toBe('ℹ️ Additional information');
    });
  });

  describe('step', () => {
    it('should format step message with number', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.step(1, 'Initialize project');
      expect(result).toBe('📋 Step 1: Initialize project');
    });
  });

  describe('section', () => {
    it('should format section with separator', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.section('Configuration');
      expect(result).toContain('Configuration');
      expect(result).toContain('=');
    });

    it('should format section as markdown heading', () => {
      const formatter = new OutputFormatter({ markdown: true });
      const result = formatter.section('Configuration');
      expect(result).toBe('## Configuration');
    });
  });

  describe('listItem', () => {
    it('should format list item with bullet', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.listItem('First item');
      expect(result).toBe('  • First item');
    });

    it('should format list item as markdown', () => {
      const formatter = new OutputFormatter({ markdown: true });
      const result = formatter.listItem('First item');
      expect(result).toBe('- First item');
    });
  });

  describe('keyValue', () => {
    it('should format key-value pair', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.keyValue('Name', 'Project A');
      expect(result).toBe('Name: Project A');
    });

    it('should format key-value pair as markdown', () => {
      const formatter = new OutputFormatter({ markdown: true });
      const result = formatter.keyValue('Name', 'Project A');
      expect(result).toBe('**Name**: Project A');
    });
  });

  describe('code', () => {
    it('should format code block', () => {
      const formatter = new OutputFormatter({ color: false });
      const result = formatter.code('const x = 1;');
      expect(result).toContain('const x = 1;');
    });

    it('should format code block as markdown', () => {
      const formatter = new OutputFormatter({ markdown: true });
      const result = formatter.code('const x = 1;', 'javascript');
      expect(result).toBe('```javascript\nconst x = 1;\n```');
    });
  });

  describe('blank', () => {
    it('should format blank line', () => {
      const formatter = new OutputFormatter();
      const result = formatter.blank();
      expect(result).toBe('\n');
    });

    it('should format multiple blank lines', () => {
      const formatter = new OutputFormatter();
      const result = formatter.blank(3);
      expect(result).toBe('\n\n\n');
    });
  });
});

describe('Formatter functions', () => {
  it('formatSuccess should work', () => {
    const result = formatSuccess('Done', { color: false });
    expect(result).toBe('✅ Done');
  });

  it('formatError should work', () => {
    const result = formatError('Failed', { color: false });
    expect(result).toBe('❌ Failed');
  });

  it('formatWarning should work', () => {
    const result = formatWarning('Warning', { color: false });
    expect(result).toBe('⚠️ Warning');
  });

  it('formatInfo should work', () => {
    const result = formatInfo('Info', { color: false });
    expect(result).toBe('ℹ️ Info');
  });

  it('formatStep should work', () => {
    const result = formatStep(1, 'Step 1', { color: false });
    expect(result).toBe('📋 Step 1: Step 1');
  });

  it('formatSection should work', () => {
    const result = formatSection('Section', { color: false });
    expect(result).toContain('Section');
  });

  it('formatListItem should work', () => {
    const result = formatListItem('Item', { color: false });
    expect(result).toBe('  • Item');
  });

  it('formatKeyValue should work', () => {
    const result = formatKeyValue('Key', 'Value', { color: false });
    expect(result).toBe('Key: Value');
  });

  it('formatCode should work', () => {
    const result = formatCode('code', 'js', { markdown: true });
    expect(result).toBe('```js\ncode\n```');
  });

  it('formatBlank should work', () => {
    const result = formatBlank(2);
    expect(result).toBe('\n\n');
  });
});
