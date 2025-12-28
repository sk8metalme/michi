/**
 * spec-archiver.ts のテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, renameSync, mkdirSync, readdirSync, readFileSync, writeFileSync, type Dirent } from 'fs';

// fs モジュールをモック
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  renameSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// safe-file-reader のモック（実際のreadFileSyncモックを使用するため）
vi.mock('../utils/safe-file-reader.js', async (importOriginal) => {
  const mockFs = await import('fs');
  return {
    safeReadFileOrThrow: vi.fn((filePath: string, encoding: BufferEncoding = 'utf-8') => {
      return (mockFs.readFileSync as ReturnType<typeof vi.fn>)(filePath, encoding);
    }),
    safeReadFile: vi.fn(),
    safeReadJsonFile: vi.fn(),
  };
});

import {
  canArchiveSpec,
  archiveSpec,
  listSpecs,
  type SpecInfo,
} from '../utils/spec-archiver.js';

const mockExistsSync = vi.mocked(existsSync);
const mockRenameSync = vi.mocked(renameSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

describe('spec-archiver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('canArchiveSpec - セキュリティ検証', () => {
    it('パストラバーサル攻撃を防ぐ: ".." を含む場合', () => {
      const result = canArchiveSpec('../../../etc/passwd');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('path traversal detected');
    });

    it('パストラバーサル攻撃を防ぐ: "/" を含む場合', () => {
      const result = canArchiveSpec('foo/bar');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('path traversal detected');
    });

    it('パストラバーサル攻撃を防ぐ: "\\" を含む場合', () => {
      const result = canArchiveSpec('foo\\bar');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('path traversal detected');
    });

    it('パストラバーサル攻撃を防ぐ: "." で始まる場合', () => {
      const result = canArchiveSpec('.hidden');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('path traversal detected');
    });

    it('不正な文字を含む場合', () => {
      const result = canArchiveSpec('feature@123');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('feature名が無効な形式です');
    });

    it('空文字の場合', () => {
      const result = canArchiveSpec('');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('cannot be empty');
    });

    it('スペースのみの場合', () => {
      const result = canArchiveSpec('   ');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('cannot be empty');
    });

    it('正常な feature name: 英数字とハイフン', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          phase: 'implementation-complete',
        }),
      );
      mockReaddirSync.mockReturnValue(['release-notes-v1.md'] as unknown as Dirent[]);

      const result = canArchiveSpec('user-auth-123');

      expect(result.canArchive).toBe(true);
      expect(mockExistsSync).toHaveBeenCalled();
    });

    it('kebab-caseのみ許可: アンダースコアは不可', () => {
      const result = canArchiveSpec('user_auth');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('アンダースコア(_)が含まれています');
    });
  });

  describe('canArchiveSpec - 通常機能', () => {
    it('spec が存在しない場合', () => {
      mockExistsSync.mockReturnValue(false);

      const result = canArchiveSpec('non-existent');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toBe('Spec not found');
    });

    it('spec.json が存在しない場合', () => {
      mockExistsSync
        .mockReturnValueOnce(true) // specDir exists
        .mockReturnValueOnce(false); // specJsonPath does not exist

      const result = canArchiveSpec('feature-a');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toBe('spec.json not found');
    });

    it('既にアーカイブ済みの場合', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          phase: 'implementation-complete',
          archived: { at: '2024-01-01T00:00:00Z' },
        }),
      );

      const result = canArchiveSpec('feature-b');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toBe('Already archived');
    });

    it('phase が implementation-complete でない場合', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          phase: 'requirements',
        }),
      );

      const result = canArchiveSpec('feature-c');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('Phase is requirements');
    });

    it('release-notes がない場合', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          phase: 'implementation-complete',
        }),
      );
      mockReaddirSync.mockReturnValue(['design.md', 'tasks.md'] as unknown as Dirent[]);

      const result = canArchiveSpec('feature-d');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toBe('No release notes found');
    });

    it('アーカイブ可能な場合', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          phase: 'implementation-complete',
        }),
      );
      mockReaddirSync.mockReturnValue([
        'design.md',
        'release-notes-v1.0.0.md',
      ] as unknown as Dirent[]);

      const result = canArchiveSpec('feature-e');

      expect(result.canArchive).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('spec.json の読み取りエラー', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = canArchiveSpec('feature-f');

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain('Error reading spec.json');
    });
  });

  describe('archiveSpec', () => {
    it('不正な feature name の場合はエラー', () => {
      const result = archiveSpec('../../../etc/passwd');

      expect(result.success).toBe(false);
      expect(result.feature).toBe('../../../etc/passwd');
      expect(result.error).toContain('path traversal detected');
      expect(mockRenameSync).not.toHaveBeenCalled();
    });

    it('アーカイブ不可能な場合', () => {
      mockExistsSync.mockReturnValue(false);

      const result = archiveSpec('non-existent');

      expect(result.success).toBe(false);
      expect(result.feature).toBe('non-existent');
      expect(result.error).toBe('Spec not found');
    });

    it('正常にアーカイブできる場合', () => {
      mockExistsSync
        .mockReturnValueOnce(true) // specDir exists
        .mockReturnValueOnce(true) // specJsonPath exists
        .mockReturnValueOnce(false); // archiveDir does not exist
      mockReadFileSync
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'implementation-complete',
          }),
        )
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'implementation-complete',
          }),
        );
      mockReaddirSync.mockReturnValue(['release-notes-v1.md'] as unknown as Dirent[]);

      const result = archiveSpec('feature-g');

      expect(result.success).toBe(true);
      expect(result.feature).toBe('feature-g');
      expect(result.archivePath).toBeDefined();
      expect(mockMkdirSync).toHaveBeenCalled();
      expect(mockRenameSync).toHaveBeenCalled();
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('アーカイブ理由を指定できる', () => {
      mockExistsSync
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      mockReadFileSync
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'implementation-complete',
          }),
        )
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'implementation-complete',
          }),
        );
      mockReaddirSync.mockReturnValue(['release-notes-v1.md'] as unknown as Dirent[]);

      const result = archiveSpec('feature-h', { reason: 'Released to production' });

      expect(result.success).toBe(true);
      // writeFileSyncの呼び出しを検証
      const writeCall = mockWriteFileSync.mock.calls[0];
      const writtenContent = JSON.parse(writeCall[1] as string);
      expect(writtenContent.archived.reason).toBe('Released to production');
    });

    it('ファイル移動エラーの場合', () => {
      mockExistsSync
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      mockReadFileSync.mockReturnValueOnce(
        JSON.stringify({
          phase: 'implementation-complete',
        }),
      );
      mockReaddirSync.mockReturnValue(['release-notes-v1.md'] as unknown as Dirent[]);
      mockRenameSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = archiveSpec('feature-i');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to archive');
    });

    it('カスタム projectRoot を使用できる', () => {
      mockExistsSync
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      mockReadFileSync
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'implementation-complete',
          }),
        )
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'implementation-complete',
          }),
        );
      mockReaddirSync.mockReturnValue(['release-notes-v1.md'] as unknown as Dirent[]);

      archiveSpec('feature-j', undefined, '/custom/path');

      expect(mockExistsSync).toHaveBeenCalled();
      const firstCall = mockExistsSync.mock.calls[0][0] as string;
      expect(firstCall).toContain('/custom/path');
    });
  });

  describe('listSpecs', () => {
    it('specs ディレクトリが存在しない場合は空配列', () => {
      mockExistsSync.mockReturnValue(false);

      const result = listSpecs();

      expect(result).toEqual([]);
    });

    it('非アーカイブの仕様書を一覧取得', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'feature-a', isDirectory: () => true },
          { name: 'feature-b', isDirectory: () => true },
          { name: 'some-file.txt', isDirectory: () => false },
        ] as unknown as Dirent[])
        .mockReturnValueOnce(['design.md'] as unknown as Dirent[])
        .mockReturnValueOnce(['release-notes-v1.md'] as unknown as Dirent[]);
      mockReadFileSync
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'requirements',
          }),
        )
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'implementation-complete',
          }),
        );

      const result = listSpecs();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<SpecInfo>({
        feature: 'feature-a',
        phase: 'requirements',
        archived: false,
        hasReleaseNotes: false,
      });
      expect(result[1]).toEqual<SpecInfo>({
        feature: 'feature-b',
        phase: 'implementation-complete',
        archived: false,
        hasReleaseNotes: true,
      });
    });

    it('不正なディレクトリ名をスキップ', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'valid-feature', isDirectory: () => true },
          { name: '../../../etc', isDirectory: () => true },
          { name: 'foo/bar', isDirectory: () => true },
        ] as unknown as Dirent[])
        .mockReturnValueOnce(['design.md'] as unknown as Dirent[]);
      mockReadFileSync.mockReturnValueOnce(
        JSON.stringify({
          phase: 'requirements',
        }),
      );

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = listSpecs();

      expect(result).toHaveLength(1);
      expect(result[0].feature).toBe('valid-feature');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping invalid spec directory name'),
      );

      consoleWarnSpy.mockRestore();
    });

    it('アーカイブ済み仕様書も含めて取得', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'feature-a', isDirectory: () => true },
          { name: 'archive', isDirectory: () => true },
        ] as unknown as Dirent[])
        .mockReturnValueOnce(['design.md'] as unknown as Dirent[])
        .mockReturnValueOnce([
          { name: 'archived-feature', isDirectory: () => true },
        ] as unknown as Dirent[])
        .mockReturnValueOnce(['release-notes-v1.md'] as unknown as Dirent[]);

      mockReadFileSync
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'requirements',
          }),
        )
        .mockReturnValueOnce(
          JSON.stringify({
            phase: 'implementation-complete',
            archived: { at: '2024-01-01T00:00:00Z' },
          }),
        );

      const result = listSpecs({ includeArchived: true });

      expect(result).toHaveLength(2);
      expect(result[0].archived).toBe(false);
      expect(result[1]).toMatchObject({
        feature: 'archived-feature',
        phase: 'implementation-complete',
        archived: true,
        archivedAt: '2024-01-01T00:00:00Z',
        hasReleaseNotes: true,
      });
    });

    it('アーカイブディレクトリ内の不正な名前をスキップ', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'archive', isDirectory: () => true },
        ] as unknown as Dirent[])
        .mockReturnValueOnce([
          { name: 'valid-archived', isDirectory: () => true },
          { name: '../../../etc', isDirectory: () => true },
        ] as unknown as Dirent[]);

      mockReadFileSync.mockReturnValueOnce(
        JSON.stringify({
          phase: 'implementation-complete',
          archived: { at: '2024-01-01T00:00:00Z' },
        }),
      );
      mockReaddirSync.mockReturnValueOnce(['release-notes-v1.md'] as unknown as Dirent[]);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = listSpecs({ includeArchived: true });

      expect(result).toHaveLength(1);
      expect(result[0].feature).toBe('valid-archived');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping invalid archived directory name'),
      );

      consoleWarnSpy.mockRestore();
    });

    it('spec.json 読み取りエラーを無視', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        { name: 'feature-error', isDirectory: () => true },
      ] as unknown as Dirent[]);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = listSpecs();

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read spec'),
      );

      consoleWarnSpy.mockRestore();
    });

    it('カスタム projectRoot を使用', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([] as unknown as Dirent[]);

      listSpecs(undefined, '/custom/path');

      expect(mockExistsSync).toHaveBeenCalled();
      const firstCall = mockExistsSync.mock.calls[0][0] as string;
      expect(firstCall).toContain('/custom/path');
    });
  });
});
