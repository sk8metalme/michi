/**
 * Tests for multi-repo:init command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { multiRepoInit } from '../multi-repo-init.js';
import * as configLoader from '../../../scripts/utils/config-loader.js';
import * as validator from '../../../scripts/utils/multi-repo-validator.js';
import * as multiRepoRenderer from '../../../scripts/template/multi-repo-renderer.js';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs');
vi.mock('../../../scripts/utils/config-loader.js');
vi.mock('../../../scripts/template/multi-repo-renderer.js');

describe('multiRepoInit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトで loadConfig は空のmultiRepoProjectsを返す
    vi.spyOn(configLoader, 'loadConfig').mockResolvedValue({
      multiRepoProjects: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('バリデーション', () => {
    it('無効なプロジェクト名の場合はエラー', async () => {
      await expect(
        multiRepoInit('../etc/passwd', 'TEST', 'SPACE')
      ).rejects.toThrow('プロジェクト名が無効です');
    });

    it('無効なJIRAキーの場合はエラー', async () => {
      await expect(
        multiRepoInit('valid-project', 'invalid', 'SPACE')
      ).rejects.toThrow('JIRAキーが無効です');
    });

    it('空のConfluenceスペースキーの場合はエラー', async () => {
      await expect(
        multiRepoInit('valid-project', 'TEST', '')
      ).rejects.toThrow('Confluenceスペースキーが空です');
    });

    it('プロジェクト名が101文字以上の場合はエラー', async () => {
      const longName = 'a'.repeat(101);
      await expect(
        multiRepoInit(longName, 'TEST', 'SPACE')
      ).rejects.toThrow('プロジェクト名が無効です');
    });

    it('制御文字を含むプロジェクト名の場合はエラー', async () => {
      await expect(
        multiRepoInit('project\x00name', 'TEST', 'SPACE')
      ).rejects.toThrow('プロジェクト名が無効です');
    });

    it('JIRAキーが小文字を含む場合はエラー', async () => {
      await expect(
        multiRepoInit('valid-project', 'test', 'SPACE')
      ).rejects.toThrow('JIRAキーが無効です');
    });

    it('JIRAキーが1文字の場合はエラー', async () => {
      await expect(
        multiRepoInit('valid-project', 'T', 'SPACE')
      ).rejects.toThrow('JIRAキーが無効です');
    });

    it('JIRAキーが11文字以上の場合はエラー', async () => {
      await expect(
        multiRepoInit('valid-project', 'ABCDEFGHIJK', 'SPACE')
      ).rejects.toThrow('JIRAキーが無効です');
    });
  });

  describe('重複チェック', () => {
    it('既存プロジェクトと同名の場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'existing-project',
        jiraKey: 'EXIST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });

      await expect(
        multiRepoInit('existing-project', 'TEST', 'SPACE')
      ).rejects.toThrow('プロジェクト「existing-project」は既に存在します');
    });

    it('既存プロジェクトが存在しない場合は続行', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);
      vi.spyOn(configLoader, 'addMultiRepoProject').mockReturnValue({
        success: true,
        project: {
          name: 'new-project',
          jiraKey: 'NEW',
          confluenceSpace: 'SPACE',
          createdAt: expect.any(String),
          repositories: [],
        },
      });
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      vi.spyOn(multiRepoRenderer, 'renderMultiRepoTemplates').mockReturnValue({
        'overview/requirements': '# Requirements',
        'overview/architecture': '# Architecture',
      });

      const result = await multiRepoInit('new-project', 'NEW', 'SPACE');

      expect(result.success).toBe(true);
    });
  });

  describe('正常ケース', () => {
    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);
      vi.spyOn(configLoader, 'addMultiRepoProject').mockReturnValue({
        success: true,
        project: {
          name: expect.any(String),
          jiraKey: expect.any(String),
          confluenceSpace: expect.any(String),
          createdAt: expect.any(String),
          repositories: [],
        },
      });
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      vi.spyOn(multiRepoRenderer, 'renderMultiRepoTemplates').mockReturnValue({
        'overview/requirements': '# {{PROJECT_NAME}} Requirements',
        'overview/architecture': '# {{PROJECT_NAME}} Architecture',
        'overview/sequence': '# {{PROJECT_NAME}} Sequence',
        'steering/multi-repo': '# {{PROJECT_NAME}} Steering',
        'tests/strategy': '# {{PROJECT_NAME}} Test Strategy',
        'docs/ci-status': '# {{PROJECT_NAME}} CI Status',
        'docs/release-notes': '# {{PROJECT_NAME}} Release Notes',
      });
    });

    it('有効なプロジェクト名とJIRAキーで初期化成功', async () => {
      const result = await multiRepoInit('my-project', 'MYPROJ', 'MYSPACE');

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('my-project');
      expect(result.createdDirectories).toBeDefined();
      expect(result.createdFiles).toBeDefined();
    });

    it('ディレクトリ構造を作成する', async () => {
      await multiRepoInit('my-project', 'MYPROJ', 'MYSPACE');

      // overview/, steering/, tests/, docs/ ディレクトリが作成される
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('docs/michi/my-project/overview'),
        expect.objectContaining({ recursive: true })
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('docs/michi/my-project/steering'),
        expect.objectContaining({ recursive: true })
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('docs/michi/my-project/tests'),
        expect.objectContaining({ recursive: true })
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('docs/michi/my-project/docs'),
        expect.objectContaining({ recursive: true })
      );
    });

    it('tests/配下のサブディレクトリを作成する', async () => {
      await multiRepoInit('my-project', 'MYPROJ', 'MYSPACE');

      // tests/scripts/, tests/results/, tests/unit/ 等のサブディレクトリが作成される
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('tests/scripts'),
        expect.objectContaining({ recursive: true })
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('tests/results'),
        expect.objectContaining({ recursive: true })
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('tests/unit'),
        expect.objectContaining({ recursive: true })
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('tests/integration'),
        expect.objectContaining({ recursive: true })
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('tests/e2e'),
        expect.objectContaining({ recursive: true })
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('tests/performance'),
        expect.objectContaining({ recursive: true })
      );
    });

    it('テンプレートファイルを展開する', async () => {
      await multiRepoInit('my-project', 'MYPROJ', 'MYSPACE');

      // 7つのテンプレートファイルが書き込まれる
      expect(fs.writeFileSync).toHaveBeenCalledTimes(7);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('overview/requirements.md'),
        expect.any(String),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('overview/architecture.md'),
        expect.any(String),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('overview/sequence.md'),
        expect.any(String),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('steering/multi-repo.md'),
        expect.any(String),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('tests/strategy.md'),
        expect.any(String),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('docs/ci-status.md'),
        expect.any(String),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('docs/release-notes.md'),
        expect.any(String),
        'utf-8'
      );
    });

    it('config.jsonにプロジェクト情報を登録する', async () => {
      await multiRepoInit('my-project', 'MYPROJ', 'MYSPACE');

      expect(configLoader.addMultiRepoProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'my-project',
          jiraKey: 'MYPROJ',
          confluenceSpace: 'MYSPACE',
          repositories: [],
        }),
        process.cwd()
      );
    });

    it('日本語のプロジェクト名を受け入れる', async () => {
      const result = await multiRepoInit('プロジェクト名', 'PROJ', 'SPACE');

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('プロジェクト名');
    });

    it('ハイフンとアンダースコアを含むプロジェクト名を受け入れる', async () => {
      const result = await multiRepoInit('my-project_v2', 'PROJ', 'SPACE');

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('my-project_v2');
    });
  });

  describe('エラーハンドリング', () => {
    it('ディレクトリ作成失敗時はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      await expect(
        multiRepoInit('my-project', 'MYPROJ', 'MYSPACE')
      ).rejects.toThrow('ディレクトリの作成に失敗しました');
    });

    it('ファイル書き込み失敗時はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('ENOSPC: no space left on device');
      });
      vi.spyOn(multiRepoRenderer, 'renderMultiRepoTemplates').mockReturnValue({
        'overview/requirements': '# Requirements',
      });

      await expect(
        multiRepoInit('my-project', 'MYPROJ', 'MYSPACE')
      ).rejects.toThrow('ファイルの作成に失敗しました');
    });

    it('config.json更新失敗時はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);
      vi.spyOn(configLoader, 'addMultiRepoProject').mockReturnValue({
        success: false,
        error: 'Config update failed',
      });
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      vi.spyOn(multiRepoRenderer, 'renderMultiRepoTemplates').mockReturnValue({
        'overview/requirements': '# Requirements',
      });

      await expect(
        multiRepoInit('my-project', 'MYPROJ', 'MYSPACE')
      ).rejects.toThrow('設定ファイルの更新に失敗しました');
    });
  });

  describe('成功メッセージ', () => {
    it('成功時は詳細な情報を返す', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);
      vi.spyOn(configLoader, 'addMultiRepoProject').mockReturnValue({
        success: true,
        project: {
          name: 'my-project',
          jiraKey: 'MYPROJ',
          confluenceSpace: 'MYSPACE',
          createdAt: expect.any(String),
          repositories: [],
        },
      });
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      vi.spyOn(multiRepoRenderer, 'renderMultiRepoTemplates').mockReturnValue({
        'overview/requirements': '# Requirements',
        'overview/architecture': '# Architecture',
        'overview/sequence': '# Sequence',
        'steering/multi-repo': '# Steering',
        'tests/strategy': '# Strategy',
        'docs/ci-status': '# CI Status',
        'docs/release-notes': '# Release Notes',
      });

      const result = await multiRepoInit('my-project', 'MYPROJ', 'MYSPACE');

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('my-project');
      expect(result.jiraKey).toBe('MYPROJ');
      expect(result.confluenceSpace).toBe('MYSPACE');
      expect(result.createdDirectories.length).toBeGreaterThan(0);
      expect(result.createdFiles.length).toBe(7);
    });
  });
});
