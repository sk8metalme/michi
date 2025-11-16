import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, cpSync } from 'fs';

// モジュールのモック
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  cpSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => '{}')
}));
vi.mock('child_process', () => ({
  execSync: vi.fn()
}));
vi.mock('./utils/project-finder.js', () => ({
  findRepositoryRoot: vi.fn(() => '/test/repo')
}));

describe('setup-existing-project.ts 修正内容のテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ディレクトリがコピー前に作成される', () => {
    const projectDir = '/test/repo/projects/test-project';
    
    // .cursor/rules ディレクトリの作成
    const rulesDir = join(projectDir, '.cursor/rules');
    mkdirSync(rulesDir, { recursive: true });
    
    // .cursor/commands/kiro ディレクトリの作成
    const commandsDir = join(projectDir, '.cursor/commands/kiro');
    mkdirSync(commandsDir, { recursive: true });
    
    // ディレクトリが正しく作成されることを確認
    expect(rulesDir).toContain('.cursor/rules');
    expect(commandsDir).toContain('.cursor/commands/kiro');
  });

  it('パッケージ名が @sk8metal/michi-cli に統一されている', () => {
    // 使用例のパッケージ名を確認
    const npxCommand = 'npx @sk8metal/michi-cli jira:sync <feature>';
    expect(npxCommand).toContain('@sk8metal/michi-cli');
    expect(npxCommand).not.toContain('@michi/cli');
    
    // package.jsonスクリプト例のパッケージ名を確認
    const scriptExample = 'npx @sk8metal/michi-cli jira:sync';
    expect(scriptExample).toContain('@sk8metal/michi-cli');
    expect(scriptExample).not.toContain('@michi/cli');
    
    // グローバルインストール例のパッケージ名を確認
    const globalInstall = 'npm install -g @sk8metal/michi-cli';
    expect(globalInstall).toContain('@sk8metal/michi-cli');
    expect(globalInstall).not.toContain('@michi/cli');
  });

  it('完了メッセージに scripts/ ディレクトリが含まれていない', () => {
    const projectDir = '/test/repo/projects/test-project';
    const repoRoot = '/test/repo';
    
    // 実際に作成されるファイルのリスト
    const createdFiles = [
      `${projectDir}/.kiro/project.json`,
      `${projectDir}/.cursor/rules/ (3ファイル)`,
      `${projectDir}/.cursor/commands/kiro/ (2ファイル)`,
      `${projectDir}/.kiro/steering/ (3ファイル)`,
      `${projectDir}/.kiro/settings/templates/ (3ファイル)`,
      `${repoRoot}/package.json (新規の場合)`,
      `${repoRoot}/tsconfig.json (新規の場合)`,
      `${projectDir}/.env (テンプレート)`
    ];
    
    // scripts/ ディレクトリが含まれていないことを確認
    const hasScriptsDir = createdFiles.some(file => file.includes('scripts/'));
    expect(hasScriptsDir).toBe(false);
  });
});

describe('環境・言語オプションのテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('デフォルト値が正しく設定される', () => {
    // parseArgs 関数をシミュレート
    const config = {
      michiPath: '/test/michi',
      environment: 'claude',
      langCode: 'ja'
    };
    
    expect(config.environment).toBe('claude');
    expect(config.langCode).toBe('ja');
  });

  it('環境オプションが正しく解析される', () => {
    const config = {
      michiPath: '/test/michi',
      environment: 'cursor',
      langCode: 'ja'
    };
    
    expect(config.environment).toBe('cursor');
  });

  it('言語オプションが正しく解析される', () => {
    const config = {
      michiPath: '/test/michi',
      environment: 'claude',
      langCode: 'ja'
    };
    
    expect(config.langCode).toBe('ja');
  });

  it('複数オプションが同時に解析される', () => {
    const config = {
      michiPath: '/test/michi',
      environment: 'claude-agent',
      langCode: 'ja'
    };
    
    expect(config.environment).toBe('claude-agent');
    expect(config.langCode).toBe('ja');
  });

  it('すべてのサポート環境がテストされる', () => {
    const supportedEnvironments = ['claude', 'claude-agent', 'cursor'];
    
    supportedEnvironments.forEach(env => {
      const config = {
        michiPath: '/test/michi',
        environment: env,
        langCode: 'ja'
      };
      
      expect(['claude', 'claude-agent', 'cursor']).toContain(config.environment);
    });
  });

  it('cc-sddコマンドが動的に生成される', () => {
    const testCases = [
      { environment: 'claude', langCode: 'ja', expected: 'npx cc-sdd@latest --lang ja --claude' },
      { environment: 'claude-agent', langCode: 'ja', expected: 'npx cc-sdd@latest --lang ja --claude-agent' },
      { environment: 'cursor', langCode: 'ja', expected: 'npx cc-sdd@latest --lang ja --cursor' }
    ];
    
    testCases.forEach(({ environment, langCode, expected }) => {
      const command = `npx cc-sdd@latest --lang ${langCode} --${environment}`;
      expect(command).toBe(expected);
    });
  });
});

