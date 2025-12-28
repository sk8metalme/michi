/**
 * spec.json 更新ユーティリティ
 * Confluence/JIRA 同期後に spec.json を更新する
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { safeReadJsonFile } from './safe-file-reader.js';
import { resolve } from 'path';

/**
 * spec.json の型定義
 */
export interface SpecJson {
  featureName?: string;
  projectName?: string;
  confluence?: {
    spaceKey?: string;
    requirements?: {
      pageId?: string;
      url?: string;
      title?: string;
    };
    design?: {
      pageId?: string;
      url?: string;
      title?: string;
    };
    tasks?: {
      pageId?: string;
      url?: string;
      title?: string;
    };
    // 旧形式フィールド（後方互換性のため）
    requirementsPageId?: string;
    requirementsUrl?: string;
    designPageId?: string;
    designUrl?: string;
    tasksPageId?: string;
    tasksUrl?: string;
  };
  jira?: {
    projectKey?: string;
    epicKey?: string;
    epicUrl?: string;
    storyKeys?: string[];
    // 旧形式フィールド（後方互換性のため）
    stories?: {
      created?: number;
      total?: number;
    };
  };
  environmentSetup?: {
    completed?: boolean;
    language?: string;
    ciTool?: string;
    dockerCompose?: boolean;
    completedAt?: string;
  };
  milestones?: {
    requirementsCompleted?: boolean;
    designCompleted?: boolean;
    tasksCompleted?: boolean;
    jiraSyncCompleted?: boolean;
    // 旧形式フィールド（後方互換性のため）
    requirements?: {
      completed?: boolean;
    };
    design?: {
      completed?: boolean;
    };
    tasks?: {
      completed?: boolean;
    };
  };
  archived?: {
    at: string;
    reason?: string;
  };
  lastUpdated?: string;
}

/**
 * spec.json を読み込む
 */
export function loadSpecJson(featureName: string, projectRoot: string = process.cwd()): SpecJson {
  const specPath = resolve(projectRoot, `.kiro/specs/${featureName}/spec.json`);

  if (!existsSync(specPath)) {
    // 新規作成する場合は最低限の構造を返す
    return {
      featureName,
      confluence: {},
      jira: {},
      milestones: {},
    };
  }

  const result = safeReadJsonFile(specPath);

  if (!result.success) {
    const errorType = result.errors[0].type;
    const errorMsg = errorType === 'InvalidJSON'
      ? `Invalid JSON: ${result.errors[0].cause}`
      : errorType;
    console.warn(`⚠️  Failed to load spec.json from ${specPath}: ${errorMsg}`);
    return {
      featureName,
      confluence: {},
      jira: {},
      milestones: {},
    };
  }

  return result.value;
}

/**
 * spec.json を保存する
 * @param featureName 機能名
 * @param spec 保存する spec オブジェクト（lastUpdated フィールドが更新されます）
 * @param projectRoot プロジェクトルート（デフォルト: process.cwd()）
 */
export function saveSpecJson(featureName: string, spec: SpecJson, projectRoot: string = process.cwd()): void {
  const specDir = resolve(projectRoot, `.kiro/specs/${featureName}`);
  const specPath = resolve(specDir, 'spec.json');

  // ディレクトリが存在しない場合は作成
  if (!existsSync(specDir)) {
    mkdirSync(specDir, { recursive: true });
  }

  // lastUpdated を更新
  spec.lastUpdated = new Date().toISOString();

  try {
    writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');
    console.log(`✅ Updated spec.json: ${specPath}`);
  } catch (error) {
    console.error(`❌ Failed to save spec.json to ${specPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Confluence 同期後に spec.json を更新
 */
export function updateSpecJsonAfterConfluenceSync(
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks',
  pageInfo: {
    pageId: string;
    url: string;
    title: string;
    spaceKey: string;
  },
  projectRoot: string = process.cwd()
): void {
  const spec = loadSpecJson(featureName, projectRoot);

  // Confluence 情報を更新
  if (!spec.confluence) {
    spec.confluence = {};
  }

  // スペースキーを設定
  if (pageInfo.spaceKey) {
    spec.confluence.spaceKey = pageInfo.spaceKey;
  }

  // 新形式：ドキュメントタイプごとのページ情報を更新
  spec.confluence[docType] = {
    pageId: pageInfo.pageId,
    url: pageInfo.url,
    title: pageInfo.title,
  };

  // 旧形式（後方互換性のため併記）
  if (docType === 'requirements') {
    spec.confluence.requirementsPageId = pageInfo.pageId;
    spec.confluence.requirementsUrl = pageInfo.url;
  } else if (docType === 'design') {
    spec.confluence.designPageId = pageInfo.pageId;
    spec.confluence.designUrl = pageInfo.url;
  } else if (docType === 'tasks') {
    spec.confluence.tasksPageId = pageInfo.pageId;
    spec.confluence.tasksUrl = pageInfo.url;
  }

  // マイルストーンを更新
  if (!spec.milestones) {
    spec.milestones = {};
  }

  // 新形式：フラットなフィールド
  if (docType === 'requirements') {
    spec.milestones.requirementsCompleted = true;
    // 旧形式（後方互換性のため併記）
    if (!spec.milestones.requirements) {
      spec.milestones.requirements = {};
    }
    spec.milestones.requirements.completed = true;
  } else if (docType === 'design') {
    spec.milestones.designCompleted = true;
    // 旧形式（後方互換性のため併記）
    if (!spec.milestones.design) {
      spec.milestones.design = {};
    }
    spec.milestones.design.completed = true;
  } else if (docType === 'tasks') {
    spec.milestones.tasksCompleted = true;
    // 旧形式（後方互換性のため併記）
    if (!spec.milestones.tasks) {
      spec.milestones.tasks = {};
    }
    spec.milestones.tasks.completed = true;
  }

  saveSpecJson(featureName, spec, projectRoot);
}

/**
 * JIRA 同期後に spec.json を更新
 */
export function updateSpecJsonAfterJiraSync(
  featureName: string,
  jiraInfo: {
    projectKey: string;
    epicKey: string;
    epicUrl: string;
    storyKeys: string[];
  },
  projectRoot: string = process.cwd()
): void {
  const spec = loadSpecJson(featureName, projectRoot);

  // JIRA 情報を更新
  spec.jira = {
    projectKey: jiraInfo.projectKey,
    epicKey: jiraInfo.epicKey,
    epicUrl: jiraInfo.epicUrl,
    storyKeys: jiraInfo.storyKeys,
  };

  // マイルストーンを更新
  if (!spec.milestones) {
    spec.milestones = {};
  }
  spec.milestones.jiraSyncCompleted = true;

  saveSpecJson(featureName, spec, projectRoot);
}
