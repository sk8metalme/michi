/**
 * env-config.ts のユニットテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { parseEnvFile, generateEnvContent } from '../env-config.js';

describe('env-config', () => {
  const testDir = join(process.cwd(), 'test-temp');
  const testEnvPath = join(testDir, '.env.test');

  beforeEach(() => {
    // テスト用ディレクトリ作成
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // クリーンアップ
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
    if (existsSync(testDir)) {
      try {
        rmdirSync(testDir);
      } catch {
        // ディレクトリが空でない場合は無視
      }
    }
  });

  describe('parseEnvFile', () => {
    it('should parse a valid .env file', () => {
      const content = `# Comment
ATLASSIAN_URL=https://example.atlassian.net
ATLASSIAN_EMAIL=user@example.com
ATLASSIAN_API_TOKEN=token123

# Another comment
GITHUB_TOKEN=ghp_xxx
`;
      writeFileSync(testEnvPath, content, 'utf-8');

      const result = parseEnvFile(testEnvPath);

      expect(result.size).toBe(4);
      expect(result.get('ATLASSIAN_URL')).toBe('https://example.atlassian.net');
      expect(result.get('ATLASSIAN_EMAIL')).toBe('user@example.com');
      expect(result.get('ATLASSIAN_API_TOKEN')).toBe('token123');
      expect(result.get('GITHUB_TOKEN')).toBe('ghp_xxx');
    });

    it('should handle quoted values', () => {
      const content = `DOUBLE_QUOTED="value with spaces"
SINGLE_QUOTED='another value'
UNQUOTED=simple
`;
      writeFileSync(testEnvPath, content, 'utf-8');

      const result = parseEnvFile(testEnvPath);

      expect(result.get('DOUBLE_QUOTED')).toBe('value with spaces');
      expect(result.get('SINGLE_QUOTED')).toBe('another value');
      expect(result.get('UNQUOTED')).toBe('simple');
    });

    it('should skip empty lines and comments', () => {
      const content = `# This is a comment

KEY1=value1

# Another comment
  
KEY2=value2
`;
      writeFileSync(testEnvPath, content, 'utf-8');

      const result = parseEnvFile(testEnvPath);

      expect(result.size).toBe(2);
      expect(result.get('KEY1')).toBe('value1');
      expect(result.get('KEY2')).toBe('value2');
    });

    it('should return empty map for non-existent file', () => {
      const result = parseEnvFile(join(testDir, 'nonexistent.env'));

      expect(result.size).toBe(0);
    });

    it('should handle malformed lines gracefully', () => {
      const content = `VALID_KEY=value
invalid line without equals
ANOTHER_VALID=value2
=value_without_key
KEY_WITHOUT_VALUE=
`;
      writeFileSync(testEnvPath, content, 'utf-8');

      const result = parseEnvFile(testEnvPath);

      // 正しい形式の行のみパースされる
      expect(result.get('VALID_KEY')).toBe('value');
      expect(result.get('ANOTHER_VALID')).toBe('value2');
      expect(result.get('KEY_WITHOUT_VALUE')).toBe('');
    });

    it('should handle values with equals signs', () => {
      const content = `BASE64_VALUE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0=
URL_WITH_PARAMS=https://example.com?param1=value1&param2=value2
`;
      writeFileSync(testEnvPath, content, 'utf-8');

      const result = parseEnvFile(testEnvPath);

      expect(result.get('BASE64_VALUE')).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0=');
      expect(result.get('URL_WITH_PARAMS')).toBe('https://example.com?param1=value1&param2=value2');
    });
  });

  describe('generateEnvContent', () => {
    it('should generate valid .env content', () => {
      const values = new Map<string, string>([
        ['ATLASSIAN_URL', 'https://example.atlassian.net'],
        ['ATLASSIAN_EMAIL', 'user@example.com'],
        ['ATLASSIAN_API_TOKEN', 'token123'],
        ['GITHUB_TOKEN', 'ghp_xxx'],
        ['CONFLUENCE_PRD_SPACE', 'PRD'],
        ['JIRA_PROJECT_KEYS', 'PROJ'],
        ['JIRA_ISSUE_TYPE_STORY', '10036'],
        ['JIRA_ISSUE_TYPE_SUBTASK', '10037']
      ]);

      const content = generateEnvContent(values);

      // 各セクションが存在することを確認
      expect(content).toContain('# Atlassian設定');
      expect(content).toContain('# GitHub設定');
      expect(content).toContain('# Confluence共有スペース');
      expect(content).toContain('# JIRAプロジェクトキー');
      expect(content).toContain('# JIRA Issue Type IDs');

      // 値が正しく含まれることを確認
      expect(content).toContain('ATLASSIAN_URL=https://example.atlassian.net');
      expect(content).toContain('ATLASSIAN_EMAIL=user@example.com');
      expect(content).toContain('ATLASSIAN_API_TOKEN=token123');
      expect(content).toContain('GITHUB_TOKEN=ghp_xxx');
      expect(content).toContain('CONFLUENCE_PRD_SPACE=PRD');
      expect(content).toContain('JIRA_PROJECT_KEYS=PROJ');
      expect(content).toContain('JIRA_ISSUE_TYPE_STORY=10036');
      expect(content).toContain('JIRA_ISSUE_TYPE_SUBTASK=10037');
    });

    it('should handle empty values', () => {
      const values = new Map<string, string>([
        ['ATLASSIAN_URL', ''],
        ['ATLASSIAN_EMAIL', ''],
        ['ATLASSIAN_API_TOKEN', '']
      ]);

      const content = generateEnvContent(values);

      expect(content).toContain('ATLASSIAN_URL=');
      expect(content).toContain('ATLASSIAN_EMAIL=');
      expect(content).toContain('ATLASSIAN_API_TOKEN=');
    });

    it('should use default values when keys are missing', () => {
      const values = new Map<string, string>();

      const content = generateEnvContent(values);

      // デフォルト値が使用されることを確認
      expect(content).toContain('JIRA_ISSUE_TYPE_STORY=10036');
      expect(content).toContain('JIRA_ISSUE_TYPE_SUBTASK=10037');
    });

    it('should be parseable by parseEnvFile', () => {
      const originalValues = new Map<string, string>([
        ['ATLASSIAN_URL', 'https://example.atlassian.net'],
        ['ATLASSIAN_EMAIL', 'user@example.com'],
        ['ATLASSIAN_API_TOKEN', 'token123'],
        ['GITHUB_ORG', 'myorg'],
        ['GITHUB_TOKEN', 'ghp_xxx'],
        ['CONFLUENCE_PRD_SPACE', 'PRD'],
        ['CONFLUENCE_QA_SPACE', 'QA'],
        ['CONFLUENCE_RELEASE_SPACE', 'RELEASE'],
        ['JIRA_PROJECT_KEYS', 'PROJ'],
        ['JIRA_ISSUE_TYPE_STORY', '10036'],
        ['JIRA_ISSUE_TYPE_SUBTASK', '10037']
      ]);

      const content = generateEnvContent(originalValues);
      writeFileSync(testEnvPath, content, 'utf-8');

      const parsedValues = parseEnvFile(testEnvPath);

      // すべての値が正しくパースされることを確認
      expect(parsedValues.size).toBe(originalValues.size);
      for (const [key, value] of originalValues) {
        expect(parsedValues.get(key)).toBe(value);
      }
    });
  });

  describe('round-trip test', () => {
    it('should maintain data integrity through parse -> generate -> parse cycle', () => {
      const initialContent = `# Atlassian設定（MCP + REST API共通）
ATLASSIAN_URL=https://test.atlassian.net
ATLASSIAN_EMAIL=test@example.com
ATLASSIAN_API_TOKEN=test_token_123

# GitHub設定
GITHUB_ORG=testorg
GITHUB_TOKEN=ghp_test123

# Confluence共有スペース
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRAプロジェクトキー
JIRA_PROJECT_KEYS=TEST

# JIRA Issue Type IDs（JIRAインスタンス固有 - 必須）
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037
`;
      writeFileSync(testEnvPath, initialContent, 'utf-8');

      // 1回目のパース
      const parsed1 = parseEnvFile(testEnvPath);

      // 生成
      const generated = generateEnvContent(parsed1);
      const generatedPath = join(testDir, '.env.generated');
      writeFileSync(generatedPath, generated, 'utf-8');

      // 2回目のパース
      const parsed2 = parseEnvFile(generatedPath);

      // データが一致することを確認
      expect(parsed1.size).toBe(parsed2.size);
      for (const [key, value] of parsed1) {
        expect(parsed2.get(key)).toBe(value);
      }

      // クリーンアップ
      unlinkSync(generatedPath);
    });
  });
});


