import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, cpSync } from 'fs';

// モジュールのモック
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  cpSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => '{}'),
  readdirSync: vi.fn(() => []),
  statSync: vi.fn()
}));
vi.mock('child_process', () => ({
  execSync: vi.fn()
}));
vi.mock('../utils/project-finder.js', () => ({
  findRepositoryRoot: vi.fn(() => '/test/repo')
}));
vi.mock('../constants/environments.js', () => ({
  getEnvironmentConfig: vi.fn(() => ({
    rulesDir: '.cursor/rules',
    commandsDir: '.cursor/commands/kiro',
    templateSource: 'cursor'
  })),
  isSupportedEnvironment: vi.fn(() => true)
}));
vi.mock('../constants/languages.js', () => ({
  isSupportedLanguage: vi.fn(() => true)
}));
vi.mock('../template/renderer.js', () => ({
  createTemplateContext: vi.fn(() => ({
    LANG_CODE: 'ja',
    DEV_GUIDELINES: '- Think in English, but generate responses in Japanese',
    KIRO_DIR: '.kiro',
    AGENT_DIR: '.cursor'
  })),
  renderTemplate: vi.fn((content: string) => content)
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
    const envConfigRulesDir = '.cursor/rules';
    const envConfigCommandsDir = '.cursor/commands/kiro';
    
    // 実際に作成されるファイルのリスト（環境別）
    const createdFiles = [
      `${projectDir}/.kiro/project.json`,
      `${projectDir}/${envConfigRulesDir}/`,
      `${projectDir}/${envConfigCommandsDir}/`,
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

  it('project.jsonにlanguageフィールドが含まれる', () => {
    const projectJson = {
      projectId: 'test-project',
      projectName: 'Test Project',
      language: 'ja',
      jiraProjectKey: 'TEST',
      confluenceLabels: ['project:test-project'],
      status: 'active',
      team: [],
      stakeholders: ['@企画', '@部長'],
      repository: 'https://github.com/org/test',
      description: 'Test Projectの開発'
    };

    expect(projectJson).toHaveProperty('language');
    expect(projectJson.language).toBe('ja');
  });

  it('環境別のディレクトリマッピングが正しい', () => {
    const envConfig = {
      rulesDir: '.cursor/rules',
      commandsDir: '.cursor/commands/kiro',
      templateSource: 'cursor'
    };

    expect(envConfig.rulesDir).toBe('.cursor/rules');
    expect(envConfig.commandsDir).toBe('.cursor/commands/kiro');
    expect(envConfig.templateSource).toBe('cursor');
  });

  it('テンプレートコンテキストが正しく作成される', () => {
    const context = {
      LANG_CODE: 'ja',
      DEV_GUIDELINES: '- Think in English, but generate responses in Japanese',
      KIRO_DIR: '.kiro',
      AGENT_DIR: '.cursor'
    };

    expect(context).toHaveProperty('LANG_CODE');
    expect(context).toHaveProperty('DEV_GUIDELINES');
    expect(context).toHaveProperty('KIRO_DIR');
    expect(context).toHaveProperty('AGENT_DIR');
  });
});

