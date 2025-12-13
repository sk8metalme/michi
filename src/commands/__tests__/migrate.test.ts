/**
 * migrate command のテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, mkdirSync, rmSync, readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { migrate } from '../migrate.js';

describe('migrate command', () => {
  let testProjectRoot: string;
  let testHomeDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // テスト用の一時ディレクトリを作成（ランダム要素を追加して衝突を防ぐ）
    testProjectRoot = resolve(tmpdir(), `michi-test-project-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    testHomeDir = resolve(tmpdir(), `michi-test-home-${Date.now()}-${Math.random().toString(36).substring(7)}`);

    // 既存のディレクトリがあれば削除
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
    if (existsSync(testHomeDir)) {
      rmSync(testHomeDir, { recursive: true, force: true });
    }

    // テスト用ディレクトリ構造を作成
    mkdirSync(testProjectRoot, { recursive: true });
    mkdirSync(join(testProjectRoot, '.kiro'), { recursive: true });
    mkdirSync(join(testProjectRoot, '.michi'), { recursive: true });
    mkdirSync(testHomeDir, { recursive: true });
    mkdirSync(join(testHomeDir, '.michi'), { recursive: true });

    // 環境変数をバックアップ
    originalEnv = { ...process.env };

    // HOMEディレクトリをテスト用に変更
    process.env.HOME = testHomeDir;

    // プロジェクトルートに移動
    process.chdir(testProjectRoot);
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;

    // テスト用ディレクトリを削除
    if (existsSync(testProjectRoot)) {
      try {
        rmSync(testProjectRoot, { recursive: true, force: true });
      } catch {
        // 削除失敗は無視
      }
    }
    if (existsSync(testHomeDir)) {
      try {
        rmSync(testHomeDir, { recursive: true, force: true });
      } catch {
        // 削除失敗は無視
      }
    }
  });

  describe('正常移行', () => {
    it('.env から ~/.michi/.env に組織設定を移行し、プロジェクト設定を残す', async () => {
      // .env ファイルを作成
      const envContent = `
ATLASSIAN_URL=https://test.atlassian.net
ATLASSIAN_EMAIL=test@example.com
ATLASSIAN_API_TOKEN=test-token
GITHUB_ORG=test-org
GITHUB_TOKEN=ghp_test
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=REL
JIRA_ISSUE_TYPE_STORY=Story
JIRA_ISSUE_TYPE_SUBTASK=Subtask
JIRA_PROJECT_KEYS=TEST,DEMO
GITHUB_REPO=test-org/test-repo
`.trim();
      writeFileSync(join(testProjectRoot, '.env'), envContent);

      // project.json を作成
      writeFileSync(join(testProjectRoot, '.kiro', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        projectName: 'Test Project'
      }, null, 2));

      // migrate 実行（--force で確認スキップ）
      await migrate({ force: true });

      // ~/.michi/.env が作成されたことを確認
      const globalEnvPath = join(testHomeDir, '.michi', '.env');
      expect(existsSync(globalEnvPath)).toBe(true);

      // 組織設定が ~/.michi/.env に移行されたことを確認
      const globalEnvContent = readFileSync(globalEnvPath, 'utf-8');
      expect(globalEnvContent).toContain('ATLASSIAN_URL=https://test.atlassian.net');
      expect(globalEnvContent).toContain('ATLASSIAN_EMAIL=test@example.com');
      expect(globalEnvContent).toContain('ATLASSIAN_API_TOKEN=test-token');
      expect(globalEnvContent).toContain('GITHUB_ORG=test-org');
      expect(globalEnvContent).toContain('GITHUB_TOKEN=ghp_test');
      expect(globalEnvContent).toContain('CONFLUENCE_PRD_SPACE=PRD');
      expect(globalEnvContent).toContain('CONFLUENCE_QA_SPACE=QA');
      expect(globalEnvContent).toContain('CONFLUENCE_RELEASE_SPACE=REL');
      expect(globalEnvContent).toContain('JIRA_ISSUE_TYPE_STORY=Story');
      expect(globalEnvContent).toContain('JIRA_ISSUE_TYPE_SUBTASK=Subtask');

      // プロジェクト .env にプロジェクト設定が残っていることを確認
      const projectEnvContent = readFileSync(join(testProjectRoot, '.env'), 'utf-8');
      expect(projectEnvContent).toContain('JIRA_PROJECT_KEYS=TEST,DEMO');

      // 組織設定が削除されていることを確認
      expect(projectEnvContent).not.toContain('ATLASSIAN_URL');
      expect(projectEnvContent).not.toContain('GITHUB_TOKEN');

      // project.json に repository が追加されたことを確認
      const projectJson = JSON.parse(readFileSync(join(testProjectRoot, '.kiro', 'project.json'), 'utf-8'));
      expect(projectJson.repository).toBe('https://github.com/test-org/test-repo.git');

      // GITHUB_REPO が削除されたことを確認
      expect(projectEnvContent).not.toContain('GITHUB_REPO');
    });
  });

  describe('--dry-run モード', () => {
    it('変更内容をプレビューするが実際には変更しない', async () => {
      // .env ファイルを作成
      const envContent = 'ATLASSIAN_URL=https://test.atlassian.net\nJIRA_PROJECT_KEYS=TEST';
      writeFileSync(join(testProjectRoot, '.env'), envContent);

      // migrate 実行（--dry-run）
      await migrate({ dryRun: true });

      // ~/.michi/.env が作成されていないことを確認
      const globalEnvPath = join(testHomeDir, '.michi', '.env');
      expect(existsSync(globalEnvPath)).toBe(false);

      // プロジェクト .env が変更されていないことを確認
      const projectEnvContent = readFileSync(join(testProjectRoot, '.env'), 'utf-8');
      expect(projectEnvContent).toBe(envContent);
    });
  });

  describe('--force モード', () => {
    it('確認プロンプトをスキップして移行を実行する', async () => {
      // .env ファイルを作成
      const envContent = 'ATLASSIAN_URL=https://test.atlassian.net';
      writeFileSync(join(testProjectRoot, '.env'), envContent);

      // migrate 実行（--force）
      await migrate({ force: true });

      // ~/.michi/.env が作成されたことを確認
      const globalEnvPath = join(testHomeDir, '.michi', '.env');
      expect(existsSync(globalEnvPath)).toBe(true);
    });
  });

  describe('--rollback モード', () => {
    it('バックアップから設定を復元する', async () => {
      // バックアップディレクトリを作成
      const backupDir = join(testProjectRoot, '.michi-backup-test');
      mkdirSync(backupDir, { recursive: true });

      // バックアップファイルを作成
      const originalEnvContent = 'ATLASSIAN_URL=https://original.atlassian.net';
      writeFileSync(join(backupDir, '.env'), originalEnvContent);

      // 現在の .env を作成（異なる内容）
      writeFileSync(join(testProjectRoot, '.env'), 'ATLASSIAN_URL=https://modified.atlassian.net');

      // ロールバック実行
      await migrate({ rollback: backupDir });

      // .env が元の内容に戻っていることを確認
      const restoredContent = readFileSync(join(testProjectRoot, '.env'), 'utf-8');
      expect(restoredContent).toBe(originalEnvContent);
    });
  });

  describe('~/.michi/.env 既存時の処理', () => {
    it('既存の ~/.michi/.env がある場合はエラーを表示する（--force なし）', async () => {
      // .env ファイルを作成
      writeFileSync(join(testProjectRoot, '.env'), 'ATLASSIAN_URL=https://test.atlassian.net');

      // 既存の ~/.michi/.env を作成
      writeFileSync(join(testHomeDir, '.michi', '.env'), 'EXISTING=value');

      // migrate 実行（エラーを期待）
      await expect(migrate({})).rejects.toThrow();
    });

    it('--force を使用すると既存の ~/.michi/.env を上書きする', async () => {
      // .env ファイルを作成
      writeFileSync(join(testProjectRoot, '.env'), 'ATLASSIAN_URL=https://test.atlassian.net');

      // 既存の ~/.michi/.env を作成
      writeFileSync(join(testHomeDir, '.michi', '.env'), 'EXISTING=value');

      // migrate 実行（--force）
      await migrate({ force: true });

      // ~/.michi/.env が更新されたことを確認
      const globalEnvContent = readFileSync(join(testHomeDir, '.michi', '.env'), 'utf-8');
      expect(globalEnvContent).toContain('ATLASSIAN_URL=https://test.atlassian.net');
      expect(globalEnvContent).not.toContain('EXISTING=value');
    });
  });

  describe('.env 不存在時のエラー', () => {
    it('.env が存在しない場合はエラーを表示する', async () => {
      // .env を作成しない

      // migrate 実行（エラーを期待）
      await expect(migrate({ force: true })).rejects.toThrow(/\.env.*not found/i);
    });
  });

  describe('GITHUB_REPO 移行', () => {
    it('GITHUB_REPO を project.json の repository に移行する', async () => {
      // .env ファイルを作成（GITHUB_REPO 含む）
      writeFileSync(join(testProjectRoot, '.env'), 'GITHUB_REPO=myorg/myrepo\nJIRA_PROJECT_KEYS=TEST');

      // project.json を作成
      writeFileSync(join(testProjectRoot, '.kiro', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        projectName: 'Test Project'
      }, null, 2));

      // migrate 実行
      await migrate({ force: true });

      // project.json に repository が追加されたことを確認
      const projectJson = JSON.parse(readFileSync(join(testProjectRoot, '.kiro', 'project.json'), 'utf-8'));
      expect(projectJson.repository).toBe('https://github.com/myorg/myrepo.git');

      // .env から GITHUB_REPO が削除されたことを確認
      const projectEnvContent = readFileSync(join(testProjectRoot, '.env'), 'utf-8');
      expect(projectEnvContent).not.toContain('GITHUB_REPO');
    });
  });

  describe('バックアップ作成', () => {
    it('移行前にバックアップを作成する', async () => {
      // .env ファイルを作成
      writeFileSync(join(testProjectRoot, '.env'), 'ATLASSIAN_URL=https://test.atlassian.net');

      // migrate 実行
      await migrate({ force: true });

      // バックアップディレクトリが作成されたことを確認
      const files = readdirSync(testProjectRoot);
      const backupDirs = files.filter(f => f.startsWith('.michi-backup-'));
      expect(backupDirs.length).toBeGreaterThan(0);
    });
  });
});
