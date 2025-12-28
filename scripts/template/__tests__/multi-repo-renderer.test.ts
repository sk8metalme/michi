/**
 * Tests for Multi-Repo template renderer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMultiRepoTemplateContext,
  loadMultiRepoTemplate,
  renderMultiRepoTemplate,
  loadAndRenderMultiRepoTemplate,
  renderMultiRepoTemplates,
  MULTI_REPO_TEMPLATES,
  type MultiRepoTemplateContext,
} from '../multi-repo-renderer.js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Calculate MICHI_PACKAGE_ROOT for tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MICHI_PACKAGE_ROOT = resolve(__dirname, '..', '..', '..');

vi.mock('fs');

// safe-file-reader のモック（実際のreadFileSyncモックを使用するため）
vi.mock('../../utils/safe-file-reader.js', async () => {
  const mockFs = await import('fs');
  return {
    safeReadFileOrThrow: vi.fn((filePath: string, encoding: BufferEncoding = 'utf-8') => {
      return (mockFs.readFileSync as ReturnType<typeof vi.fn>)(filePath, encoding);
    }),
    safeReadFile: vi.fn(),
    safeReadJsonFile: vi.fn(),
  };
});

describe('createMultiRepoTemplateContext', () => {
  it('必須フィールドを含むコンテキストを作成する', () => {
    const context = createMultiRepoTemplateContext(
      'test-project',
      'TEST',
      'SPACE'
    );

    expect(context.PROJECT_NAME).toBe('test-project');
    expect(context.JIRA_KEY).toBe('TEST');
    expect(context.CONFLUENCE_SPACE).toBe('SPACE');
    expect(context.CREATED_AT).toBeDefined();
  });

  it('CREATED_ATにカスタム値を指定できる', () => {
    const customDate = '2025-12-14T10:00:00Z';
    const context = createMultiRepoTemplateContext(
      'test-project',
      'TEST',
      'SPACE',
      customDate
    );

    expect(context.CREATED_AT).toBe(customDate);
  });

  it('CREATED_ATが省略された場合は現在時刻を使用する', () => {
    const context = createMultiRepoTemplateContext(
      'test-project',
      'TEST',
      'SPACE'
    );

    // ISO 8601形式であることを確認
    expect(context.CREATED_AT).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('loadMultiRepoTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('テンプレートファイルを読み込む', () => {
    const mockContent = '# {{PROJECT_NAME}} - Requirements';
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);

    const content = loadMultiRepoTemplate('overview/requirements');

    const expectedPath = resolve(MICHI_PACKAGE_ROOT, 'templates', 'multi-repo', 'overview', 'requirements.md');
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expectedPath,
      'utf-8'
    );
    expect(content).toBe(mockContent);
  });

  it('テンプレートが存在しない場合はエラーをスロー', () => {
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    expect(() => loadMultiRepoTemplate('invalid/template')).toThrow(
      'Multi-Repo template not found: invalid/template.md'
    );
  });
});

describe('renderMultiRepoTemplate', () => {
  it('プレースホルダーを置換する', () => {
    const template = '# {{PROJECT_NAME}} - {{JIRA_KEY}}\n\nCreated: {{CREATED_AT}}';
    const context: MultiRepoTemplateContext = {
      PROJECT_NAME: 'test-project',
      JIRA_KEY: 'TEST',
      CONFLUENCE_SPACE: 'SPACE',
      CREATED_AT: '2025-12-14T10:00:00Z',
    };

    const rendered = renderMultiRepoTemplate(template, context);

    expect(rendered).toBe('# test-project - TEST\n\nCreated: 2025-12-14T10:00:00Z');
  });

  it('すべてのMulti-Repoプレースホルダーを置換する', () => {
    const template = [
      '{{PROJECT_NAME}}',
      '{{JIRA_KEY}}',
      '{{CONFLUENCE_SPACE}}',
      '{{CREATED_AT}}',
    ].join(' / ');

    const context: MultiRepoTemplateContext = {
      PROJECT_NAME: 'my-project',
      JIRA_KEY: 'PROJ',
      CONFLUENCE_SPACE: 'MYSPACE',
      CREATED_AT: '2025-12-14T10:00:00Z',
    };

    const rendered = renderMultiRepoTemplate(template, context);

    expect(rendered).toBe('my-project / PROJ / MYSPACE / 2025-12-14T10:00:00Z');
  });

  it('存在しないプレースホルダーはそのまま残す', () => {
    const template = '{{PROJECT_NAME}} - {{UNKNOWN_PLACEHOLDER}}';
    const context: MultiRepoTemplateContext = {
      PROJECT_NAME: 'test-project',
      JIRA_KEY: 'TEST',
      CONFLUENCE_SPACE: 'SPACE',
      CREATED_AT: '2025-12-14T10:00:00Z',
    };

    const rendered = renderMultiRepoTemplate(template, context);

    expect(rendered).toBe('test-project - {{UNKNOWN_PLACEHOLDER}}');
  });
});

describe('loadAndRenderMultiRepoTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('テンプレートを読み込んでレンダリングする', () => {
    const mockContent = '# {{PROJECT_NAME}} Requirements\n\n**JIRA**: {{JIRA_KEY}}';
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);

    const context: MultiRepoTemplateContext = {
      PROJECT_NAME: 'test-project',
      JIRA_KEY: 'TEST',
      CONFLUENCE_SPACE: 'SPACE',
      CREATED_AT: '2025-12-14T10:00:00Z',
    };

    const rendered = loadAndRenderMultiRepoTemplate(
      'overview/requirements',
      context
    );

    expect(rendered).toBe('# test-project Requirements\n\n**JIRA**: TEST');
  });
});

describe('renderMultiRepoTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('複数のテンプレートを一括レンダリングする', () => {
    vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
      if (path.toString().includes('requirements')) {
        return '# {{PROJECT_NAME}} Requirements';
      }
      if (path.toString().includes('architecture')) {
        return '# {{PROJECT_NAME}} Architecture';
      }
      return 'Template not found';
    });

    const context: MultiRepoTemplateContext = {
      PROJECT_NAME: 'test-project',
      JIRA_KEY: 'TEST',
      CONFLUENCE_SPACE: 'SPACE',
      CREATED_AT: '2025-12-14T10:00:00Z',
    };

    const rendered = renderMultiRepoTemplates(
      ['overview/requirements', 'overview/architecture'],
      context
    );

    expect(rendered['overview/requirements']).toBe('# test-project Requirements');
    expect(rendered['overview/architecture']).toBe('# test-project Architecture');
  });

  it('空の配列を渡した場合は空のオブジェクトを返す', () => {
    const context: MultiRepoTemplateContext = {
      PROJECT_NAME: 'test-project',
      JIRA_KEY: 'TEST',
      CONFLUENCE_SPACE: 'SPACE',
      CREATED_AT: '2025-12-14T10:00:00Z',
    };

    const rendered = renderMultiRepoTemplates([], context);

    expect(rendered).toEqual({});
  });
});

describe('MULTI_REPO_TEMPLATES', () => {
  it('すべてのMulti-Repoテンプレート名を含む', () => {
    expect(MULTI_REPO_TEMPLATES).toContain('overview/requirements');
    expect(MULTI_REPO_TEMPLATES).toContain('overview/architecture');
    expect(MULTI_REPO_TEMPLATES).toContain('overview/sequence');
    expect(MULTI_REPO_TEMPLATES).toContain('steering/multi-repo');
    expect(MULTI_REPO_TEMPLATES).toContain('tests/strategy');
    expect(MULTI_REPO_TEMPLATES).toContain('docs/ci-status');
    expect(MULTI_REPO_TEMPLATES).toContain('docs/release-notes');
  });

  it('テンプレート数は7つ', () => {
    expect(MULTI_REPO_TEMPLATES.length).toBe(7);
  });
});

describe('統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('実際のテンプレートファイルをレンダリングできる（モック使用）', () => {
    const mockRequirementsTemplate = `# {{PROJECT_NAME}} - 要件定義書

## プロジェクト情報

- **プロジェクト名**: {{PROJECT_NAME}}
- **JIRAキー**: {{JIRA_KEY}}
- **Confluenceスペース**: {{CONFLUENCE_SPACE}}
- **作成日時**: {{CREATED_AT}}`;

    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockRequirementsTemplate);

    const context: MultiRepoTemplateContext = {
      PROJECT_NAME: 'my-awesome-project',
      JIRA_KEY: 'AWESOME',
      CONFLUENCE_SPACE: 'PROJ',
      CREATED_AT: '2025-12-14T10:30:00Z',
    };

    const rendered = loadAndRenderMultiRepoTemplate(
      'overview/requirements',
      context
    );

    expect(rendered).toContain('# my-awesome-project - 要件定義書');
    expect(rendered).toContain('- **プロジェクト名**: my-awesome-project');
    expect(rendered).toContain('- **JIRAキー**: AWESOME');
    expect(rendered).toContain('- **Confluenceスペース**: PROJ');
    expect(rendered).toContain('- **作成日時**: 2025-12-14T10:30:00Z');
  });
});
