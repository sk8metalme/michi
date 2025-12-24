/**
 * Multi-Repo バリデーション関数のテスト
 * Task 1.2: バリデーション関数の実装
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateProjectName,
  validateJiraKey,
  validateRepositoryUrl,
  hasMichiSetup,
  getMichiSetupCommand,
  validateLocalPath,
} from '../multi-repo-validator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Repository } from '../../config/config-schema';

describe('validateProjectName', () => {
  describe('正常ケース', () => {
    it('有効なプロジェクト名を受け入れる', () => {
      const validNames = [
        'my-project',
        'プロジェクト名',
        'project_v2',
        'My Project 123',
        'a',
        'a'.repeat(100),
      ];

      validNames.forEach((name) => {
        const result = validateProjectName(name);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('パストラバーサル対策', () => {
    it('スラッシュ（/）を含む場合はエラー', () => {
      const result = validateProjectName('project/name');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain path traversal characters (/, \\)',
      );
    });

    it('バックスラッシュ（\\）を含む場合はエラー', () => {
      const result = validateProjectName('project\\name');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain path traversal characters (/, \\)',
      );
    });

    it('../を含む場合はエラー', () => {
      const result = validateProjectName('../etc/passwd');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain path traversal characters (/, \\)',
      );
    });

    it('/を含む場合はエラー', () => {
      const result = validateProjectName('/etc/passwd');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain path traversal characters (/, \\)',
      );
    });
  });

  describe('相対パス対策', () => {
    it('ドット（.）単独の場合はエラー', () => {
      const result = validateProjectName('.');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not be relative path components (., ..)',
      );
    });

    it('ダブルドット（..）単独の場合はエラー', () => {
      const result = validateProjectName('..');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not be relative path components (., ..)',
      );
    });
  });

  describe('制御文字対策', () => {
    it('ヌル文字（\\x00）を含む場合はエラー', () => {
      const result = validateProjectName('project\x00name');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain control characters',
      );
    });

    it('タブ文字（\\t）を含む場合はエラー', () => {
      const result = validateProjectName('project\tname');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain control characters',
      );
    });

    it('改行文字（\\n）を含む場合はエラー', () => {
      const result = validateProjectName('project\nname');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain control characters',
      );
    });

    it('改行文字（\\r）を含む場合はエラー', () => {
      const result = validateProjectName('project\rname');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain control characters',
      );
    });

    it('エスケープ文字（\\x1B）を含む場合はエラー', () => {
      const result = validateProjectName('project\x1Bname');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain control characters',
      );
    });

    it('削除文字（\\x7F）を含む場合はエラー', () => {
      const result = validateProjectName('project\x7Fname');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must not contain control characters',
      );
    });
  });

  describe('長さチェック', () => {
    it('101文字以上の場合はエラー', () => {
      const longName = 'a'.repeat(101);
      const result = validateProjectName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must be between 1 and 100 characters',
      );
    });

    it('空文字列の場合はエラー', () => {
      const result = validateProjectName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project name must be between 1 and 100 characters',
      );
    });

    it('100文字の場合は正常', () => {
      const name = 'a'.repeat(100);
      const result = validateProjectName(name);
      expect(result.isValid).toBe(true);
    });

    it('1文字の場合は正常', () => {
      const result = validateProjectName('a');
      expect(result.isValid).toBe(true);
    });
  });
});

describe('validateJiraKey', () => {
  describe('正常ケース', () => {
    it('2-10文字の大文字英字を受け入れる', () => {
      const validKeys = ['AB', 'PROJ', 'TICKET', 'ABCDEFGHIJ'];

      validKeys.forEach((key) => {
        const result = validateJiraKey(key);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('異常ケース', () => {
    it('小文字を含む場合はエラー', () => {
      const result = validateJiraKey('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'JIRA key must be 2-10 uppercase letters',
      );
    });

    it('1文字の場合はエラー', () => {
      const result = validateJiraKey('A');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'JIRA key must be 2-10 uppercase letters',
      );
    });

    it('11文字以上の場合はエラー', () => {
      const result = validateJiraKey('ABCDEFGHIJK');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'JIRA key must be 2-10 uppercase letters',
      );
    });

    it('数字を含む場合はエラー', () => {
      const result = validateJiraKey('ABC123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'JIRA key must be 2-10 uppercase letters',
      );
    });

    it('空文字列の場合はエラー', () => {
      const result = validateJiraKey('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'JIRA key must be 2-10 uppercase letters',
      );
    });

    it('ハイフンを含む場合はエラー', () => {
      const result = validateJiraKey('ABC-DEF');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'JIRA key must be 2-10 uppercase letters',
      );
    });

    it('スペースを含む場合はエラー', () => {
      const result = validateJiraKey('ABC DEF');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'JIRA key must be 2-10 uppercase letters',
      );
    });
  });
});

describe('validateRepositoryUrl', () => {
  describe('正常ケース', () => {
    it('有効なGitHub HTTPS URLを受け入れる', () => {
      const validUrls = [
        'https://github.com/owner/repo',
        'https://github.com/my-org/my-repo',
        'https://github.com/user123/project-name',
      ];

      validUrls.forEach((url) => {
        const result = validateRepositoryUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('異常ケース', () => {
    it('GitLab URLの場合はエラー', () => {
      const result = validateRepositoryUrl(
        'https://gitlab.com/owner/repo',
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Repository URL must be in GitHub format: https://github.com/{owner}/{repo}',
      );
    });

    it('HTTP URLの場合はエラー', () => {
      const result = validateRepositoryUrl('http://github.com/owner/repo');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Repository URL must use HTTPS protocol',
      );
    });

    it('SSH URLの場合はエラー', () => {
      const result = validateRepositoryUrl('git@github.com:owner/repo.git');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Repository URL must be in GitHub format: https://github.com/{owner}/{repo}',
      );
    });

    it('不完全なURLの場合はエラー', () => {
      const result = validateRepositoryUrl('https://github.com/owner');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Repository URL must be in GitHub format: https://github.com/{owner}/{repo}',
      );
    });

    it('空文字列の場合はエラー', () => {
      const result = validateRepositoryUrl('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Repository URL is empty');
    });

    it('無効なURL形式の場合はエラー', () => {
      const result = validateRepositoryUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Repository URL format is invalid');
    });

    it('.git拡張子を含む場合はエラー', () => {
      const result = validateRepositoryUrl(
        'https://github.com/owner/repo.git',
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Repository URL must not include .git extension',
      );
    });
  });

  describe('プレースホルダー検出', () => {
    it('プレースホルダーURLの場合はエラー', () => {
      const placeholders = [
        'https://github.com/your-org/your-repo',
        'https://github.com/owner/repo-name',
      ];

      placeholders.forEach((url) => {
        const result = validateRepositoryUrl(url);
        if (
          url.includes('your-org') ||
          url.includes('your-repo') ||
          url.includes('repo-name')
        ) {
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain(
            'Repository URL contains placeholder values',
          );
        }
      });
    });
  });
});

describe('hasMichiSetup', () => {
  let tempDir: string;

  beforeEach(() => {
    // 一時ディレクトリを作成
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'michi-test-'));
  });

  afterEach(() => {
    // 一時ディレクトリを削除
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Michi導入済みの場合', () => {
    it('.kiro/project.json が存在する場合はtrueを返す', () => {
      // .kiro ディレクトリを作成
      const kiroDir = path.join(tempDir, '.kiro');
      fs.mkdirSync(kiroDir);

      // project.json を作成
      const projectJson = path.join(kiroDir, 'project.json');
      fs.writeFileSync(projectJson, '{}');

      const result = hasMichiSetup(tempDir);
      expect(result).toBe(true);
    });
  });

  describe('Michi未導入の場合', () => {
    it('.kiro/project.json が存在しない場合はfalseを返す', () => {
      // .kiro ディレクトリのみ作成（project.jsonなし）
      const kiroDir = path.join(tempDir, '.kiro');
      fs.mkdirSync(kiroDir);

      const result = hasMichiSetup(tempDir);
      expect(result).toBe(false);
    });

    it('.kiro ディレクトリ自体が存在しない場合はfalseを返す', () => {
      // .kiro ディレクトリを作成しない
      const result = hasMichiSetup(tempDir);
      expect(result).toBe(false);
    });
  });
});

describe('getMichiSetupCommand', () => {
  it('正しいセットアップコマンドを生成する（シングルクォートでラップ）', () => {
    const localPath = '/path/to/repo';
    const command = getMichiSetupCommand(localPath);
    expect(command).toBe(
      "cd '/path/to/repo' && npx @sk8metal/michi-cli@latest init",
    );
  });

  it('スペースを含むパスを正しくエスケープする', () => {
    const localPath = '/path/to/my repo';
    const command = getMichiSetupCommand(localPath);
    expect(command).toBe(
      "cd '/path/to/my repo' && npx @sk8metal/michi-cli@latest init",
    );
  });

  it('シングルクォートを含むパスを正しくエスケープする', () => {
    const localPath = "/path/to/user's repo";
    const command = getMichiSetupCommand(localPath);
    expect(command).toBe(
      "cd '/path/to/user'\\''s repo' && npx @sk8metal/michi-cli@latest init",
    );
  });

  it('複数のシングルクォートを含むパスを正しくエスケープする', () => {
    const localPath = "/path/to/'test'/repo's/dir";
    const command = getMichiSetupCommand(localPath);
    expect(command).toBe(
      "cd '/path/to/'\\''test'\\''/repo'\\''s/dir' && npx @sk8metal/michi-cli@latest init",
    );
  });

  it('スペースとシングルクォート両方を含むパスを正しくエスケープする', () => {
    const localPath = "/path/to/user's test repo";
    const command = getMichiSetupCommand(localPath);
    expect(command).toBe(
      "cd '/path/to/user'\\''s test repo' && npx @sk8metal/michi-cli@latest init",
    );
  });
});

describe('validateLocalPath - Michi導入チェック', () => {
  let tempDir: string;
  let repository: Repository;

  beforeEach(() => {
    // 一時ディレクトリを作成
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'michi-test-'));

    // リポジトリオブジェクトを作成
    repository = {
      name: 'test-repo',
      url: 'https://github.com/test/repo',
      branch: 'main',
      localPath: tempDir,
    };
  });

  afterEach(() => {
    // 一時ディレクトリを削除
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('Michi導入済みリポジトリの場合、hasMichiSetupがtrueになる', () => {
    // .git ディレクトリを作成（Gitリポジトリとして認識させる）
    fs.mkdirSync(path.join(tempDir, '.git'));

    // .kiro/project.json を作成（Michi導入済み）
    const kiroDir = path.join(tempDir, '.kiro');
    fs.mkdirSync(kiroDir);
    fs.writeFileSync(path.join(kiroDir, 'project.json'), '{}');

    const result = validateLocalPath(repository);
    expect(result.hasMichiSetup).toBe(true);
    expect(result.michiSetupCommand).toBeNull();
  });

  it('Michi未導入リポジトリの場合、hasMichiSetupがfalseになり警告が追加される', () => {
    // .git ディレクトリを作成（Gitリポジトリとして認識させる）
    fs.mkdirSync(path.join(tempDir, '.git'));

    // .kiro/project.json は作成しない（Michi未導入）

    const result = validateLocalPath(repository);
    expect(result.hasMichiSetup).toBe(false);
    expect(result.michiSetupCommand).not.toBeNull();
    expect(result.warnings).toContain(
      `Repository 'test-repo' does not have Michi setup (.kiro/project.json not found)`,
    );
  });

  it('Gitリポジトリでない場合、hasMichiSetupはfalseでmichiSetupCommandはnull', () => {
    // .git ディレクトリを作成しない（Gitリポジトリでない）

    const result = validateLocalPath(repository);
    expect(result.isValid).toBe(false);
    expect(result.hasMichiSetup).toBe(false);
    expect(result.michiSetupCommand).toBeNull();
    expect(result.errors).toContain(
      `localPath '${tempDir}' is not a Git repository (no .git directory)`,
    );
  });
});
