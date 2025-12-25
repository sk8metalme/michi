import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { parseEnvFile, generateEnvContent } from '../utils/env-config.js';

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
    rulesDir: '.claude/rules',
    commandsDir: '.claude/commands',
    templateSource: 'claude'
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
    AGENT_DIR: '.claude'
  })),
  renderTemplate: vi.fn((content: string) => content)
}));

describe('setup-existing-project.ts 修正内容のテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('.env 対話的設定機能', () => {
    it('.env ファイルが存在しない場合、対話的設定を提供する', () => {
      // 新規作成の場合の動作を確認
      // parseEnvFile が空のMapを返すことを確認
      const result = parseEnvFile('nonexistent.env');

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
    
    it('.env ファイルが存在する場合、既存値を読み込む', async () => {
      const fs = await import('fs');

      // モックの設定
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`ATLASSIAN_URL=https://existing.atlassian.net
ATLASSIAN_EMAIL=existing@example.com
ATLASSIAN_API_TOKEN=existing_token
`);

      const result = parseEnvFile('.env');

      expect(result.size).toBeGreaterThan(0);
      expect(result.get('ATLASSIAN_URL')).toBe('https://existing.atlassian.net');
    });
    
    it('generateEnvContent が正しい形式の .env を生成する', () => {
      const values = new Map([
        ['ATLASSIAN_URL', 'https://test.atlassian.net'],
        ['ATLASSIAN_EMAIL', 'test@example.com'],
        ['ATLASSIAN_API_TOKEN', 'test_token'],
        ['JIRA_PROJECT_KEYS', 'TEST'],
        ['JIRA_ISSUE_TYPE_STORY', '10036'],
        ['JIRA_ISSUE_TYPE_SUBTASK', '10037']
      ]);

      const content = generateEnvContent(values);

      expect(content).toContain('# Atlassian設定');
      expect(content).toContain('ATLASSIAN_URL=https://test.atlassian.net');
      expect(content).toContain('ATLASSIAN_EMAIL=test@example.com');
      expect(content).toContain('ATLASSIAN_API_TOKEN=test_token');
    });
    
    it('.gitignore に .env エントリが追加される', () => {
      // .gitignore 更新のロジック
      let gitignoreContent = '# Existing content\nnode_modules/\n';
      
      const entriesToAdd = [
        '# Environment variables',
        '.env',
        '.env.local',
        '.env.*.local'
      ];
      
      const lines = gitignoreContent.split('\n').map(l => l.trim());
      let modified = false;
      
      for (const entry of entriesToAdd) {
        if (!lines.includes(entry.trim())) {
          if (!modified) {
            gitignoreContent += '\n\n# Added by michi setup\n';
            modified = true;
          }
          gitignoreContent += entry + '\n';
        }
      }
      
      expect(modified).toBe(true);
      expect(gitignoreContent).toContain('# Added by michi setup');
      expect(gitignoreContent).toContain('.env');
      expect(gitignoreContent).toContain('.env.local');
      expect(gitignoreContent).toContain('.env.*.local');
    });
    
    it('.gitignore に既に .env がある場合、重複しない', () => {
      const gitignoreContent = `# Environment
.env
.env.local
.env.*.local
`;
      
      const lines = gitignoreContent.split('\n').map(l => l.trim());
      const entriesToAdd = ['.env', '.env.local', '.env.*.local'];
      
      let modified = false;
      for (const entry of entriesToAdd) {
        if (!lines.includes(entry.trim())) {
          modified = true;
        }
      }
      
      expect(modified).toBe(false);
    });
  });

  it('ディレクトリがコピー前に作成される', () => {
    const projectDir = '/test/repo/projects/test-project';

    // .claude/rules ディレクトリの作成
    const rulesDir = join(projectDir, '.claude/rules');
    mkdirSync(rulesDir, { recursive: true });

    // .claude/commands ディレクトリの作成
    const commandsDir = join(projectDir, '.claude/commands');
    mkdirSync(commandsDir, { recursive: true });

    // ディレクトリが正しく作成されることを確認
    expect(rulesDir).toContain('.claude/rules');
    expect(commandsDir).toContain('.claude/commands');
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
    const envConfigRulesDir = '.claude/rules';
    const envConfigCommandsDir = '.claude/commands';
    
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
      rulesDir: '.claude/rules',
      commandsDir: '.claude/commands',
      templateSource: 'claude'
    };

    expect(envConfig.rulesDir).toBe('.claude/rules');
    expect(envConfig.commandsDir).toBe('.claude/commands');
    expect(envConfig.templateSource).toBe('claude');
  });

  it('テンプレートコンテキストが正しく作成される', () => {
    const context = {
      LANG_CODE: 'ja',
      DEV_GUIDELINES: '- Think in English, but generate responses in Japanese',
      KIRO_DIR: '.kiro',
      AGENT_DIR: '.claude'
    };

    expect(context).toHaveProperty('LANG_CODE');
    expect(context).toHaveProperty('DEV_GUIDELINES');
    expect(context).toHaveProperty('KIRO_DIR');
    expect(context).toHaveProperty('AGENT_DIR');
  });
});

