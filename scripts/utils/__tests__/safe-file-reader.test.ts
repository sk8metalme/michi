/**
 * safeReadFile ユーティリティのテスト
 * ファイル読み込み処理を統合し、一貫したエラーハンドリングを提供
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { safeReadFile, safeReadJsonFile } from '../safe-file-reader.js';

describe('safeReadFile', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(process.cwd(), 'tmp-test-safe-file-reader');
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('safeReadFile - テキストファイル読み込み', () => {
    it('should successfully read existing file', () => {
      // Setup
      const filePath = join(testDir, 'test.txt');
      writeFileSync(filePath, 'Hello World', 'utf-8');

      // Execute
      const result = safeReadFile(filePath);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('Hello World');
      }
    });

    it('should return FileNotFound error when file does not exist', () => {
      // Setup
      const filePath = join(testDir, 'non-existent.txt');

      // Execute
      const result = safeReadFile(filePath);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].type).toBe('FileNotFound');
        expect(result.errors[0].path).toBe(filePath);
      }
    });

    it('should return PermissionDenied error when file is not readable', () => {
      // Setup
      const filePath = join(testDir, 'no-permission.txt');
      writeFileSync(filePath, 'Secret', 'utf-8');
      chmodSync(filePath, 0o000); // 読み取り不可に設定

      // Execute
      const result = safeReadFile(filePath);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].type).toBe('PermissionDenied');
        expect(result.errors[0].path).toBe(filePath);
      }

      // Cleanup: パーミッションを戻す
      chmodSync(filePath, 0o644);
    });

    it('should handle UTF-8 encoding correctly', () => {
      // Setup
      const filePath = join(testDir, 'utf8.txt');
      writeFileSync(filePath, '日本語テスト🎉', 'utf-8');

      // Execute
      const result = safeReadFile(filePath);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('日本語テスト🎉');
      }
    });

    it('should support custom encoding', () => {
      // Setup
      const filePath = join(testDir, 'latin1.txt');
      const content = 'Café';
      writeFileSync(filePath, content, 'latin1');

      // Execute
      const result = safeReadFile(filePath, 'latin1');

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(content);
      }
    });
  });

  describe('safeReadJsonFile - JSONファイル読み込み', () => {
    it('should successfully read and parse valid JSON file', () => {
      // Setup
      const filePath = join(testDir, 'test.json');
      const data = { name: 'test', value: 42 };
      writeFileSync(filePath, JSON.stringify(data), 'utf-8');

      // Execute
      const result = safeReadJsonFile(filePath);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(data);
      }
    });

    it('should return InvalidJSON error when JSON is malformed', () => {
      // Setup
      const filePath = join(testDir, 'invalid.json');
      writeFileSync(filePath, '{ invalid json }', 'utf-8');

      // Execute
      const result = safeReadJsonFile(filePath);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].type).toBe('InvalidJSON');
        expect(result.errors[0].path).toBe(filePath);
        expect(result.errors[0].cause).toBeDefined();
      }
    });

    it('should return FileNotFound error when JSON file does not exist', () => {
      // Setup
      const filePath = join(testDir, 'non-existent.json');

      // Execute
      const result = safeReadJsonFile(filePath);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].type).toBe('FileNotFound');
      }
    });

    it('should handle nested JSON structures', () => {
      // Setup
      const filePath = join(testDir, 'nested.json');
      const data = {
        project: {
          name: 'michi',
          config: {
            language: 'ja',
            features: ['spec', 'jira', 'confluence']
          }
        }
      };
      writeFileSync(filePath, JSON.stringify(data), 'utf-8');

      // Execute
      const result = safeReadJsonFile(filePath);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(data);
      }
    });

    it('should handle empty JSON object', () => {
      // Setup
      const filePath = join(testDir, 'empty.json');
      writeFileSync(filePath, '{}', 'utf-8');

      // Execute
      const result = safeReadJsonFile(filePath);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({});
      }
    });

    it('should handle empty JSON array', () => {
      // Setup
      const filePath = join(testDir, 'empty-array.json');
      writeFileSync(filePath, '[]', 'utf-8');

      // Execute
      const result = safeReadJsonFile(filePath);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([]);
      }
    });
  });
});
