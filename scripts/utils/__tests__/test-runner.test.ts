/**
 * テストランナーのユニットテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTestReport, type TestResult } from '../test-runner.js';

// child_processのモック
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn)
}));

describe('test-runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // executeTestsは実際のコマンド実行に依存するため、統合テストとして別途実施
  // ここでは generateTestReport の単体テストのみ実施

  describe('executeTests', () => {
    it.skip('Node.js/TypeScriptプロジェクトでnpm testを実行する', async () => {
      // 統合テストとして別途実施
    });

    it.skip('Javaプロジェクトでgradle testを実行する', async () => {
      // 統合テストとして別途実施
    });

    it.skip('テスト失敗時にエラー情報を返す', async () => {
      // 統合テストとして別途実施
    });
  });

  describe('generateTestReport', () => {
    it('テスト結果からMarkdownレポートを生成する', () => {
      const testResult: TestResult = {
        success: true,
        language: 'Node.js/TypeScript',
        command: 'npm test',
        output: 'Test Suites: 5 passed, 5 total\nTests: 50 passed, 50 total',
        duration: 15.5,
        timestamp: '2025-12-03T10:00:00Z'
      };

      const report = generateTestReport(testResult, 'user-auth');

      expect(report).toContain('# テスト実行レポート: user-auth');
      expect(report).toContain('✅ 成功');
      expect(report).toContain('Node.js/TypeScript');
      expect(report).toContain('npm test');
      expect(report).toContain('15.5');
    });

    it('テスト失敗時のレポートを生成する', () => {
      const testResult: TestResult = {
        success: false,
        language: 'Java',
        command: 'gradle test',
        output: '',
        error: 'Test failed',
        duration: 5.0,
        timestamp: '2025-12-03T10:00:00Z'
      };

      const report = generateTestReport(testResult, 'payment');

      expect(report).toContain('# テスト実行レポート: payment');
      expect(report).toContain('❌ 失敗');
      expect(report).toContain('Test failed');
    });
  });
});
