/**
 * validate-phase.ts の単体テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { validatePhase } from '../validate-phase.js';
import { loadConfig } from '../utils/config-loader.js';
import type { AppConfig } from '../config/config-schema.js';

// fsモジュールのモック
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// project-metaのモック
vi.mock('../utils/project-meta.js', () => ({
  loadProjectMeta: vi.fn(() => ({
    projectId: 'test-project',
    projectName: 'テストプロジェクト',
    jiraProjectKey: 'TEST',
  })),
}));

// config-loaderのモック
vi.mock('../utils/config-loader.js', () => ({
  loadConfig: vi.fn(() => ({
    validation: {
      weekdayNotation: true,
      businessDayCount: true,
      weekendExclusion: true,
    },
  })),
}));

describe('validatePhase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本動作', () => {
    it('すべての必須項目が揃っている場合、validationが成功する', () => {
      // Arrange: requirementsフェーズを代表例としてテスト
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          confluence: {
            spaceKey: 'TEST',
            requirementsPageId: '12345',
          },
          milestones: {
            requirements: {
              completed: true,
            },
          },
        }),
      );

      // Act
      const result = validatePhase('test-feature', 'requirements');

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.phase).toBe('requirements');
    });

    it('Confluenceページが作成されていない場合、エラーを返す', () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          confluence: {
            spaceKey: 'TEST',
            // requirementsPageId が存在しない
          },
        }),
      );

      // Act
      const result = validatePhase('test-feature', 'requirements');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        '❌ Confluenceページ（要件定義）が作成されていません',
      );
    });
  });

  describe('フェーズ固有の検証', () => {
    it('designフェーズ: 前提条件（requirements完了）をチェックする', () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          confluence: {
            designPageId: '67890',
          },
          milestones: {
            requirements: {
              completed: false, // 前提条件が満たされていない
            },
          },
        }),
      );

      // Act
      const result = validatePhase('test-feature', 'design');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        '❌ 要件定義が完了していません（前提条件）',
      );
    });

    it('tasksフェーズ: JIRA Epic/Story作成をチェックする', () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes('tasks.md')) {
          return '11/06（木）Day 1';
        }
        return JSON.stringify({
          milestones: {
            design: {
              completed: true,
            },
          },
          jira: {
            // epicKey が存在しない（重要なチェック）
          },
        });
      });

      // Act
      const result = validatePhase('test-feature', 'tasks');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('❌ JIRA Epicが作成されていません');
    });

    it('tasksフェーズ: 営業日表記をチェックする（重要な独自機能）', () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes('tasks.md')) {
          return 'タスク一覧（曜日表記なし）'; // 営業日表記がない
        }
        return JSON.stringify({
          milestones: {
            design: {
              completed: true,
            },
          },
          jira: {
            epicKey: 'TEST-1',
            stories: {
              created: 5,
              total: 5,
            },
          },
        });
      });

      // Act
      const result = validatePhase('test-feature', 'tasks');

      // Assert
      expect(result.valid).toBe(true); // 警告だけなのでvalid
      expect(result.warnings).toContain(
        '⚠️  tasks.mdに曜日表記（月、火、水...）が含まれていません',
      );
    });

    it('tasksフェーズ: 日本語曜日表記を受け入れる', () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes('tasks.md')) {
          return 'Day 1（月）:\n  - タスク1\nDay 2（火）:\n  - タスク2\n土日休み';
        }
        return JSON.stringify({
          milestones: { design: { completed: true } },
          jira: { epicKey: 'TEST-1', storyKeys: ['TEST-2'] },
        });
      });
      vi.mocked(loadConfig).mockReturnValue({
        validation: {
          weekdayNotation: true,
          businessDayCount: true,
          weekendExclusion: true,
        },
      } as Partial<AppConfig> as AppConfig);

      // Act
      const result = validatePhase('test-feature', 'tasks');

      // Assert
      expect(result.warnings).not.toContain(
        '⚠️  tasks.mdに曜日表記（月、火、水...）が含まれていません',
      );
    });

    it('tasksフェーズ: 英語曜日表記を受け入れる', () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes('tasks.md')) {
          return 'Day 1 (Mon):\n  - Task 1\nDay 2 (Tue):\n  - Task 2\nWeekends excluded';
        }
        return JSON.stringify({
          milestones: { design: { completed: true } },
          jira: { epicKey: 'TEST-1', storyKeys: ['TEST-2'] },
        });
      });
      vi.mocked(loadConfig).mockReturnValue({
        validation: {
          weekdayNotation: true,
          businessDayCount: true,
          weekendExclusion: true,
        },
      } as Partial<AppConfig> as AppConfig);

      // Act
      const result = validatePhase('test-feature', 'tasks');

      // Assert
      expect(result.warnings).not.toContain(
        '⚠️  tasks.mdに曜日表記（月、火、水...）が含まれていません',
      );
    });

    it('tasksフェーズ: バリデーション無効化設定を尊重する', () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes('tasks.md')) {
          return 'タスク一覧（曜日表記なし）'; // 営業日表記がない
        }
        return JSON.stringify({
          milestones: { design: { completed: true } },
          jira: { epicKey: 'TEST-1', storyKeys: ['TEST-2'] },
        });
      });
      vi.mocked(loadConfig).mockReturnValue({
        validation: {
          weekdayNotation: false, // バリデーション無効化
          businessDayCount: true,
          weekendExclusion: true,
        },
      } as Partial<AppConfig> as AppConfig);

      // Act
      const result = validatePhase('test-feature', 'tasks');

      // Assert
      expect(result.warnings).not.toContain(
        '⚠️  tasks.mdに曜日表記（月、火、水...）が含まれていません',
      );
    });
  });

  describe('エッジケース', () => {
    it('spec.jsonが存在しない場合、エラーを返す', () => {
      // Arrange
      // requirements.mdは存在するが、spec.jsonは存在しない
      vi.mocked(existsSync).mockImplementation(
        (path: string | Buffer | URL) => {
          const pathStr =
            typeof path === 'string'
              ? path
              : path instanceof URL
                ? path.pathname
                : path.toString();
          if (pathStr.includes('requirements.md')) {
            return true;
          }
          if (pathStr.includes('spec.json')) {
            return false;
          }
          return false;
        },
      );

      // Act
      const result = validatePhase('test-feature', 'requirements');

      // Assert: エラーをスローせず、errors配列にエラーを含めて返す
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('spec.json読み込みエラー'),
      );
      expect(result.errors).toContainEqual(
        expect.stringContaining('spec.json not found'),
      );
    });

    it('不正なフェーズ名の場合、エラーをスローする', () => {
      // Act & Assert
      expect(() =>
        validatePhase('test-feature', 'invalid' as 'requirements'),
      ).toThrow('Unknown phase: invalid');
    });
  });
});
