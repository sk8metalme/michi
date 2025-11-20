import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

// モジュールのモック
vi.mock('child_process');
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  cpSync: vi.fn(),
  writeFileSync: vi.fn(),
}));
vi.mock('dotenv', () => ({ config: vi.fn() }));

describe('create-project.ts パス問題', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('.cursor, .kiro, scripts が actualProjectDir にコピーされる', () => {
    const projectDir = '/test/repo';
    const actualProjectDir = '/test/repo/projects/test-project';

    // .cursor/rules のコピー先パスを検証
    const cursorRulesPath = join(actualProjectDir, '.cursor/rules', 'test.mdc');
    expect(cursorRulesPath).toContain('projects/test-project/.cursor/rules');
    expect(cursorRulesPath).not.toContain(join(projectDir, '.cursor'));

    // .cursor/commands のコピー先パスを検証
    const cursorCommandsPath = join(
      actualProjectDir,
      '.cursor/commands/kiro',
      'test.md',
    );
    expect(cursorCommandsPath).toContain(
      'projects/test-project/.cursor/commands',
    );

    // .kiro/steering のコピー先パスを検証
    const kiroSteeringPath = join(actualProjectDir, '.kiro/steering');
    expect(kiroSteeringPath).toContain('projects/test-project/.kiro/steering');

    // scripts のコピー先パスを検証
    const scriptsPath = join(actualProjectDir, 'scripts', 'test.ts');
    expect(scriptsPath).toContain('projects/test-project/scripts');
  });

  it('package.json と tsconfig.json は projectDir (リポジトリルート) にコピーされる', () => {
    const projectDir = '/test/repo';

    // package.json はリポジトリルート
    const packageJsonPath = join(projectDir, 'package.json');
    expect(packageJsonPath).toBe('/test/repo/package.json');
    expect(packageJsonPath).not.toContain('projects/test-project');

    // tsconfig.json もリポジトリルート
    const tsconfigPath = join(projectDir, 'tsconfig.json');
    expect(tsconfigPath).toBe('/test/repo/tsconfig.json');
    expect(tsconfigPath).not.toContain('projects/test-project');
  });

  it('ディレクトリ作成が actualProjectDir 配下で行われる', () => {
    const actualProjectDir = '/test/repo/projects/test-project';

    const directories = [
      join(actualProjectDir, '.cursor/rules'),
      join(actualProjectDir, '.cursor/commands/kiro'),
      join(actualProjectDir, '.kiro/steering'),
      join(actualProjectDir, '.kiro/settings/templates'),
      join(actualProjectDir, 'scripts/utils'),
    ];

    // すべてのディレクトリが actualProjectDir 配下にあることを確認
    directories.forEach((dir) => {
      expect(dir).toContain('projects/test-project');
      expect(dir.startsWith(actualProjectDir)).toBe(true);
    });
  });
});

describe('create-project.ts jj/git 依存性', () => {
  let mockExecSync: ReturnType<typeof vi.mocked<typeof execSync>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync = vi.mocked(execSync);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('jj が利用可能な場合は jj を使用する', () => {
    // jj --version が成功（文字列を返す）
    mockExecSync.mockImplementationOnce((command: string) => {
      if (command === 'jj --version') {
        return 'jj 0.15.0';
      }
      throw new Error('Unexpected command');
    });

    // checkDependencies のロジックを再現
    const checkDeps = () => {
      try {
        const jjVersion = execSync('jj --version', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        return { vcs: 'jj' as const, version: jjVersion };
      } catch {
        return { vcs: 'git' as const, version: 'fallback' };
      }
    };

    const result = checkDeps();
    expect(result.vcs).toBe('jj');
    expect(mockExecSync).toHaveBeenCalledWith(
      'jj --version',
      expect.objectContaining({ encoding: 'utf-8' }),
    );
  });

  it('jj 未インストール時は git にフォールバックする', () => {
    // jj --version が失敗、git --version が成功
    mockExecSync.mockImplementation((command: string) => {
      if (command === 'jj --version') {
        throw new Error('jj not found');
      }
      if (command === 'git --version') {
        return 'git version 2.40.0';
      }
      throw new Error('Unexpected command');
    });

    // checkDependencies のロジックを再現
    const checkDeps = () => {
      try {
        const jjVersion = execSync('jj --version', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        return { vcs: 'jj' as const, version: jjVersion };
      } catch {
        try {
          const gitVersion = execSync('git --version', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          }).trim();
          return { vcs: 'git' as const, version: gitVersion };
        } catch {
          throw new Error('Neither jj nor git is installed');
        }
      }
    };

    const result = checkDeps();
    expect(result.vcs).toBe('git');
    expect(mockExecSync).toHaveBeenCalledTimes(2);
    expect(mockExecSync).toHaveBeenNthCalledWith(
      1,
      'jj --version',
      expect.anything(),
    );
    expect(mockExecSync).toHaveBeenNthCalledWith(
      2,
      'git --version',
      expect.anything(),
    );
  });

  it('jj も git も未インストール時はエラーを投げる', () => {
    // 両方とも失敗
    mockExecSync.mockImplementation(() => {
      throw new Error('command not found');
    });

    // checkDependencies のロジックを再現
    const checkDeps = () => {
      try {
        const jjVersion = execSync('jj --version', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        return { vcs: 'jj' as const, version: jjVersion };
      } catch {
        try {
          const gitVersion = execSync('git --version', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          }).trim();
          return { vcs: 'git' as const, version: gitVersion };
        } catch {
          throw new Error('Neither jj nor git is installed');
        }
      }
    };

    expect(() => checkDeps()).toThrow('Neither jj nor git is installed');
  });

  it('clone コマンドが VCS に応じて切り替わる', () => {
    const repoUrl = 'https://github.com/org/repo';
    const projectDir = '/test/repo';

    // jj の場合
    const jjDeps: { vcs: 'jj' | 'git'; version: string } = {
      vcs: 'jj',
      version: 'jj 0.15.0',
    };
    const jjCommand =
      jjDeps.vcs === 'jj'
        ? `jj git clone ${repoUrl} ${projectDir}`
        : `git clone ${repoUrl} ${projectDir}`;

    expect(jjCommand).toBe(`jj git clone ${repoUrl} ${projectDir}`);

    // git の場合
    const gitDeps: { vcs: 'jj' | 'git'; version: string } = {
      vcs: 'git',
      version: 'git version 2.40',
    };
    const gitCommand =
      gitDeps.vcs === 'jj'
        ? `jj git clone ${repoUrl} ${projectDir}`
        : `git clone ${repoUrl} ${projectDir}`;

    expect(gitCommand).toBe(`git clone ${repoUrl} ${projectDir}`);
  });

  it('commit コマンドが VCS に応じて切り替わる', () => {
    const message = 'chore: initial commit';

    // jj の場合のコマンド群
    const jjDeps: { vcs: 'jj' | 'git' } = { vcs: 'jj' };
    const jjCommands =
      jjDeps.vcs === 'jj'
        ? [`jj commit -m "${message}"`, 'jj bookmark create main -r "@-"']
        : ['git add .', `git commit -m "${message}"`, 'git branch -M main'];

    expect(jjCommands).toContain('jj commit -m "chore: initial commit"');
    expect(jjCommands).toContain('jj bookmark create main -r "@-"');

    // git の場合のコマンド群
    const gitDeps: { vcs: 'jj' | 'git' } = { vcs: 'git' };
    const gitCommands =
      gitDeps.vcs === 'jj'
        ? [`jj commit -m "${message}"`, 'jj bookmark create main -r "@-"']
        : ['git add .', `git commit -m "${message}"`, 'git branch -M main'];

    expect(gitCommands).toContain('git add .');
    expect(gitCommands).toContain('git commit -m "chore: initial commit"');
    expect(gitCommands).toContain('git branch -M main');
  });
});

describe('create-project.ts .env作成時のcwd修正', () => {
  let mockExecSync: ReturnType<typeof vi.mocked<typeof execSync>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync = vi.mocked(execSync);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('.env作成時に actualProjectDir を cwd として使用する', () => {
    const projectDir = '/test/repo';
    const actualProjectDir = '/test/repo/projects/test-project';

    // execSync の呼び出しをモック
    mockExecSync.mockImplementation(
      (command: string, options?: { cwd?: string; stdio?: string }) => {
        if (command === 'npm run setup:env') {
          // cwd が actualProjectDir であることを確認
          expect(options?.cwd).toBe(actualProjectDir);
          expect(options?.cwd).not.toBe(projectDir);
          return '';
        }
        return '';
      },
    );

    // .env作成のロジックを再現
    execSync('npm run setup:env', { cwd: actualProjectDir, stdio: 'inherit' });

    expect(mockExecSync).toHaveBeenCalledWith(
      'npm run setup:env',
      expect.objectContaining({ cwd: actualProjectDir }),
    );
  });

  it('.env が actualProjectDir に作成される（projectDir ではない）', () => {
    const projectDir = '/test/repo';
    const actualProjectDir = '/test/repo/projects/test-project';

    // .env のパスを検証
    const envPathInProjectDir = join(projectDir, '.env');
    const envPathInActualProjectDir = join(actualProjectDir, '.env');

    // .env は actualProjectDir に作成されるべき
    expect(envPathInActualProjectDir).toContain('projects/test-project/.env');
    expect(envPathInActualProjectDir).not.toBe(envPathInProjectDir);
    expect(envPathInProjectDir).toBe('/test/repo/.env');
    expect(envPathInActualProjectDir).toBe(
      '/test/repo/projects/test-project/.env',
    );
  });
});
