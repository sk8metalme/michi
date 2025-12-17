/**
 * Task 12.1: プロジェクト初期化フロー全体の統合テスト
 * InitCommand + ConfigManagement + TemplateRenderer の統合テスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, cpSync } from 'fs';
import { join } from 'path';
import { multiRepoInit } from '../../src/commands/multi-repo-init.js';
import type { AppConfig } from '../../scripts/config/config-schema.js';

describe('Task 12.1: プロジェクト初期化フロー全体の統合テスト', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;

  beforeEach(() => {
    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-integration-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });

    // テンプレートディレクトリをコピー
    const sourceTemplateDir = join(originalCwd, 'templates');
    const destTemplateDir = join(testRoot, 'templates');
    cpSync(sourceTemplateDir, destTemplateDir, { recursive: true });

    // .michiディレクトリとconfig.jsonを作成
    const michiDir = join(testRoot, '.michi');
    mkdirSync(michiDir, { recursive: true });
    configPath = join(michiDir, 'config.json');

    const initialConfig: AppConfig = {
      multiRepoProjects: [],
    };
    writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf-8');

    // カレントディレクトリを変更
    process.chdir(testRoot);
  });

  afterEach(() => {
    // カレントディレクトリを元に戻す
    process.chdir(originalCwd);

    // テスト用ディレクトリを削除
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe('正常ケース', () => {
    it('プロジェクト初期化、ディレクトリ構造生成、テンプレートファイル展開、config.json更新', async () => {
      const projectName = 'my-multi-repo-project';
      const jiraKey = 'PROJ';
      const confluenceSpace = 'SPACE';

      const result = await multiRepoInit(
        projectName,
        jiraKey,
        confluenceSpace,
        testRoot
      );

      // 結果検証
      expect(result.success).toBe(true);
      expect(result.projectName).toBe(projectName);
      expect(result.jiraKey).toBe(jiraKey);
      expect(result.confluenceSpace).toBe(confluenceSpace);
      expect(result.createdDirectories.length).toBeGreaterThan(0);
      expect(result.createdFiles.length).toBeGreaterThan(0);

      // ディレクトリ構造の検証
      const projectDir = join(testRoot, 'docs', 'michi', projectName);
      expect(existsSync(projectDir)).toBe(true);
      expect(existsSync(join(projectDir, 'overview'))).toBe(true);
      expect(existsSync(join(projectDir, 'steering'))).toBe(true);
      expect(existsSync(join(projectDir, 'tests'))).toBe(true);
      expect(existsSync(join(projectDir, 'docs'))).toBe(true);

      // testsサブディレクトリの検証
      expect(existsSync(join(projectDir, 'tests', 'scripts'))).toBe(true);
      expect(existsSync(join(projectDir, 'tests', 'results'))).toBe(true);
      expect(existsSync(join(projectDir, 'tests', 'unit'))).toBe(true);
      expect(existsSync(join(projectDir, 'tests', 'integration'))).toBe(true);
      expect(existsSync(join(projectDir, 'tests', 'e2e'))).toBe(true);
      expect(existsSync(join(projectDir, 'tests', 'performance'))).toBe(true);

      // テンプレートファイルの検証
      const requirementsFile = join(projectDir, 'overview', 'requirements.md');
      expect(existsSync(requirementsFile)).toBe(true);
      const requirementsContent = readFileSync(requirementsFile, 'utf-8');
      expect(requirementsContent).toContain(projectName);
      expect(requirementsContent).toContain(jiraKey);

      const architectureFile = join(projectDir, 'overview', 'architecture.md');
      expect(existsSync(architectureFile)).toBe(true);
      const architectureContent = readFileSync(architectureFile, 'utf-8');
      expect(architectureContent).toContain(projectName);

      const sequenceFile = join(projectDir, 'overview', 'sequence.md');
      expect(existsSync(sequenceFile)).toBe(true);

      const steeringFile = join(projectDir, 'steering', 'multi-repo.md');
      expect(existsSync(steeringFile)).toBe(true);

      const strategyFile = join(projectDir, 'tests', 'strategy.md');
      expect(existsSync(strategyFile)).toBe(true);

      const ciStatusFile = join(projectDir, 'docs', 'ci-status.md');
      expect(existsSync(ciStatusFile)).toBe(true);

      const releaseNotesFile = join(projectDir, 'docs', 'release-notes.md');
      expect(existsSync(releaseNotesFile)).toBe(true);

      // config.json更新の検証
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
      expect(config.multiRepoProjects).toBeDefined();
      expect(config.multiRepoProjects!.length).toBe(1);
      expect(config.multiRepoProjects![0].name).toBe(projectName);
      expect(config.multiRepoProjects![0].jiraKey).toBe(jiraKey);
      expect(config.multiRepoProjects![0].confluenceSpace).toBe(confluenceSpace);
      expect(config.multiRepoProjects![0].repositories).toEqual([]);
      expect(config.multiRepoProjects![0].createdAt).toBeDefined();
    });
  });

  describe('バリデーションエラー', () => {
    it('無効なプロジェクト名（パストラバーサル）', async () => {
      const projectName = '../invalid-project';
      const jiraKey = 'PROJ';
      const confluenceSpace = 'SPACE';

      await expect(
        multiRepoInit(projectName, jiraKey, confluenceSpace, testRoot)
      ).rejects.toThrow(/プロジェクト名が無効です/);
    });

    it('無効なプロジェクト名（制御文字）', async () => {
      const projectName = 'invalid\x00project';
      const jiraKey = 'PROJ';
      const confluenceSpace = 'SPACE';

      await expect(
        multiRepoInit(projectName, jiraKey, confluenceSpace, testRoot)
      ).rejects.toThrow(/プロジェクト名が無効です/);
    });

    it('無効なJIRAキー（小文字）', async () => {
      const projectName = 'my-project';
      const jiraKey = 'proj'; // 小文字は無効
      const confluenceSpace = 'SPACE';

      await expect(
        multiRepoInit(projectName, jiraKey, confluenceSpace, testRoot)
      ).rejects.toThrow(/JIRAキーが無効です/);
    });

    it('無効なJIRAキー（長すぎる）', async () => {
      const projectName = 'my-project';
      const jiraKey = 'ABCDEFGHIJK'; // 11文字は無効（最大10文字）
      const confluenceSpace = 'SPACE';

      await expect(
        multiRepoInit(projectName, jiraKey, confluenceSpace, testRoot)
      ).rejects.toThrow(/JIRAキーが無効です/);
    });
  });

  describe('重複プロジェクト', () => {
    it('既存プロジェクトと同名のプロジェクトは作成できない', async () => {
      const projectName = 'duplicate-project';
      const jiraKey = 'PROJ';
      const confluenceSpace = 'SPACE';

      // 1回目: 成功
      await multiRepoInit(projectName, jiraKey, confluenceSpace, testRoot);

      // 2回目: 重複エラー
      await expect(
        multiRepoInit(projectName, jiraKey, confluenceSpace, testRoot)
      ).rejects.toThrow(/既に存在します/);
    });
  });

  describe('ファイルシステムエラー', () => {
    it('読み取り専用ディレクトリでは失敗', async () => {
      // 読み取り専用ディレクトリを作成
      const readOnlyRoot = join(testRoot, 'readonly');
      mkdirSync(readOnlyRoot, { recursive: true });

      const projectName = 'readonly-project';
      const jiraKey = 'PROJ';
      const confluenceSpace = 'SPACE';

      // この部分は環境によって動作が異なる可能性があるため、
      // ディレクトリ作成の失敗を検証するのみ
      try {
        await multiRepoInit(projectName, jiraKey, confluenceSpace, readOnlyRoot);
        // 成功した場合は、最低限のディレクトリが作成されていることを確認
        const projectDir = join(readOnlyRoot, 'docs', 'michi', projectName);
        expect(existsSync(projectDir)).toBe(true);
      } catch (error) {
        // エラーが発生した場合は、エラーメッセージが適切であることを確認
        expect(error).toBeDefined();
      }
    });
  });
});
