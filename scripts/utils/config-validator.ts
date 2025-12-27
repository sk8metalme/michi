/**
 * 設定ファイルのバリデーション
 */

import { existsSync, readFileSync } from 'fs';
import { AppConfigSchema } from '../config/config-schema.js';
import type { ZodIssue } from 'zod';
import { getConfig, getConfigPath, getGlobalConfigPath } from './config-loader.js';
import { loadProjectMeta } from './project-meta.js';
import {
  getProjectIssueTypes,
  hasJiraCredentials,
  hasIssueTypeId,
  filterStoryTypes,
  filterSubtaskTypes,
} from './jira-issue-type-fetcher.js';
import type { Result } from './types/validation.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { success, failure } from './types/validation.js';

/**
 * バリデーション結果（情報メッセージ付き）
 * info フィールドが必要な場合に使用
 * @deprecated 新規コードでは Result<boolean, string> の使用を推奨。infoは warnings に統合してください
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * Result型を拡張した情報メッセージ付きバリデーション結果
 * config-validator固有の拡張型
 */
export interface ResultWithInfo extends Result<boolean, string> {
  info: string[];
}

/**
 * ResultWithInfo を作成するヘルパー関数（成功）
 */
function successWithInfo(value: boolean, warnings: string[] = [], info: string[] = []): ResultWithInfo {
  return {
    success: true,
    value,
    errors: [],
    warnings,
    info,
  };
}

/**
 * ResultWithInfo を作成するヘルパー関数（失敗）
 */
function failureWithInfo(errors: string[], warnings: string[] = [], info: string[] = []): ResultWithInfo {
  return {
    success: false,
    value: undefined,
    errors,
    warnings,
    info,
  };
}

/**
 * プロジェクト設定ファイルをバリデーション
 */
export function validateProjectConfig(
  projectRoot: string = process.cwd(),
): ResultWithInfo {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  const configPath = getConfigPath(projectRoot);

  if (!existsSync(configPath)) {
    // 設定ファイルが存在しない場合は情報メッセージ（デフォルト設定を使用）
    info.push('Project config file not found. Using default configuration.');
    return successWithInfo(true, [], info);
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);

    // スキーマでバリデーション
    const result = AppConfigSchema.safeParse(parsed);

    if (!result.success) {
      result.error.issues.forEach((error: ZodIssue) => {
        const path = error.path.map(String).join('.');
        errors.push(`${path}: ${error.message}`);
      });

      return failureWithInfo(errors, [], []);
    }

    // 追加のバリデーション
    const config = result.data;

    // Confluence設定のバリデーション
    if (config.confluence) {
      const confluence = config.confluence;

      // hierarchy設定の整合性チェック
      if (
        confluence.pageCreationGranularity === 'by-hierarchy' ||
        confluence.pageCreationGranularity === 'manual'
      ) {
        if (!confluence.hierarchy) {
          errors.push(
            'confluence.hierarchy is required when pageCreationGranularity is "by-hierarchy" or "manual"',
          );
        } else {
          if (
            confluence.pageCreationGranularity === 'by-hierarchy' &&
            !confluence.hierarchy.parentPageTitle
          ) {
            warnings.push(
              'confluence.hierarchy.parentPageTitle is recommended for "by-hierarchy" mode',
            );
          }

          if (
            confluence.pageCreationGranularity === 'manual' &&
            !confluence.hierarchy.structure
          ) {
            errors.push(
              'confluence.hierarchy.structure is required when pageCreationGranularity is "manual"',
            );
          }
        }
      }
    }

    // JIRA設定のバリデーション
    if (config.jira) {
      const jira = config.jira;

      if (
        jira.storyCreationGranularity === 'selected-phases' &&
        !jira.selectedPhases
      ) {
        errors.push(
          'jira.selectedPhases is required when storyCreationGranularity is "selected-phases"',
        );
      }

      if (jira.selectedPhases && jira.selectedPhases.length === 0) {
        warnings.push(
          'jira.selectedPhases is empty. No stories will be created.',
        );
      }
    }

    // ワークフロー設定のバリデーション
    if (config.workflow) {
      const workflow = config.workflow;

      if (workflow.enabledPhases && workflow.enabledPhases.length === 0) {
        warnings.push(
          'workflow.enabledPhases is empty. No phases will be executed.',
        );
      }

      const validPhases = [
        // 新ワークフロー構造
        'spec-init',            // Phase 0.0: プロジェクト初期化
        'requirements',          // Phase 0.1: 要件定義
        'design',                // Phase 0.2: 設計
        'test-type-selection',   // Phase 0.3: テストタイプ選択
        'test-spec',             // Phase 0.4: テスト仕様書作成
        'tasks',                 // Phase 0.5: タスク分割
        'spec-tasks',            // Phase 0.5: タスク分割（別名）
        'jira-sync',             // Phase 0.6: JIRA同期
        'environment-setup',     // Phase 1: 環境構築
        'implementation',        // Phase 2: TDD実装
        'tdd-implementation',    // Phase 2: TDD実装（別名）
        'phase-a',               // Phase A: PR前自動テスト
        'pr-tests',              // Phase A: PR前自動テスト（別名）
        'additional-qa',         // Phase 3: 追加QA
        'testing',               // Phase 3: 追加QA（別名）
        'phase-b',               // Phase B: リリース準備テスト
        'release-tests',         // Phase B: リリース準備テスト（別名）
        'release-prep',          // Phase 4: リリース準備
        'release-preparation',   // Phase 4: リリース準備（別名）
        'release',               // Phase 5: リリース
      ];
      const invalidPhases = workflow.enabledPhases?.filter(
        (phase) => !validPhases.includes(phase),
      );
      if (invalidPhases && invalidPhases.length > 0) {
        warnings.push(
          `Unknown phases in workflow.enabledPhases: ${invalidPhases.join(', ')}\n` +
            'See: docs/user-guide/guides/workflow.md for valid phase names',
        );
      }
    }

    if (errors.length > 0) {
      return failureWithInfo(errors, warnings, []);
    }

    return successWithInfo(true, warnings, []);
  } catch (error) {
    if (error instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${error.message}`);
    } else {
      errors.push(
        `Error reading config file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return failureWithInfo(errors, [], []);
  }
}

/**
 * 設定ファイルのバリデーションを実行して結果を表示
 */
export function validateAndReport(
  projectRoot: string = process.cwd(),
): boolean {
  const result = validateProjectConfig(projectRoot);

  if (result.info.length > 0) {
    console.log('ℹ️  Info:');
    result.info.forEach((message) => {
      console.log(`   - ${message}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach((warning) => {
      console.log(`   - ${warning}`);
    });
  }

  if (result.errors.length > 0) {
    console.error('❌ Validation errors:');
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    return false;
  }

  if (result.success) {
    console.log('✅ Configuration is valid');
  }

  return result.success;
}

/**
 * Confluence同期実行前の必須設定値チェック
 * @param docType ドキュメントタイプ（requirements, design, tasks）
 * @param projectRoot プロジェクトルート（デフォルト: process.cwd()）
 * @returns バリデーション結果
 */
export function validateForConfluenceSync(
  docType: 'requirements' | 'design' | 'tasks',
  projectRoot: string = process.cwd(),
): ResultWithInfo {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  const config = getConfig(projectRoot);

  // Confluence設定のチェック
  if (!config.confluence) {
    warnings.push('confluence設定がありません。デフォルト設定を使用します。');
  } else {
    const confluence = config.confluence;

    // spaces設定のチェック
    if (!confluence.spaces || !confluence.spaces[docType]) {
      if (!process.env.CONFLUENCE_PRD_SPACE) {
        warnings.push(
          `confluence.spaces.${docType}が設定されていません。` +
            '環境変数CONFLUENCE_PRD_SPACEも設定されていないため、デフォルト値（PRD）を使用します。' +
            '\n  推奨: .michi/config.jsonに以下を追加してください:\n' +
            '  {\n' +
            '    "confluence": {\n' +
            '      "spaces": {\n' +
            `        "${docType}": "YOUR_SPACE_KEY"\n` +
            '      }\n' +
            '    }\n' +
            '  }',
        );
      } else {
        info.push(
          `confluence.spaces.${docType}が設定されていませんが、環境変数CONFLUENCE_PRD_SPACE（${process.env.CONFLUENCE_PRD_SPACE}）を使用します。`,
        );
      }
    }

    // hierarchy設定のチェック（by-hierarchyモードの場合）
    if (
      confluence.pageCreationGranularity === 'by-hierarchy' ||
      confluence.pageCreationGranularity === 'manual'
    ) {
      if (!confluence.hierarchy) {
        errors.push(
          'confluence.hierarchyが設定されていません。' +
            `pageCreationGranularityが"${confluence.pageCreationGranularity}"の場合、hierarchy設定が必須です。` +
            '\n  解決方法: .michi/config.jsonに以下を追加してください:\n' +
            '  {\n' +
            '    "confluence": {\n' +
            '      "hierarchy": {\n' +
            '        "mode": "simple",\n' +
            '        "parentPageTitle": "[{projectName}] {featureName}"\n' +
            '      }\n' +
            '    }\n' +
            '  }',
        );
      } else if (
        confluence.pageCreationGranularity === 'by-hierarchy' &&
        confluence.hierarchy &&
        !confluence.hierarchy.parentPageTitle
      ) {
        warnings.push(
          'confluence.hierarchy.parentPageTitleが設定されていません。' +
            'by-hierarchyモードでは推奨されます。',
        );
      }

      if (
        confluence.pageCreationGranularity === 'manual' &&
        confluence.hierarchy &&
        !confluence.hierarchy.structure
      ) {
        errors.push(
          'confluence.hierarchy.structureが設定されていません。' +
            'pageCreationGranularityが"manual"の場合、structure設定が必須です。',
        );
      }
    }
  }

  if (errors.length > 0) {
    return failureWithInfo(errors, warnings, info);
  }

  return successWithInfo(true, warnings, info);
}

/**
 * JIRA同期実行前の必須設定値チェック（同期版）
 * @param projectRoot プロジェクトルート（デフォルト: process.cwd()）
 * @returns バリデーション結果
 */
export function validateForJiraSync(
  projectRoot: string = process.cwd(),
): ResultWithInfo {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  const config = getConfig(projectRoot);

  // JIRA設定のチェック
  if (!config.jira) {
    warnings.push('jira設定がありません。デフォルト設定を使用します。');
  } else {
    const jira = config.jira;

    // issueTypes設定のチェック
    if (!jira.issueTypes) {
      if (!process.env.JIRA_ISSUE_TYPE_STORY) {
        errors.push(
          'jira.issueTypes.storyが設定されていません。' +
            '環境変数JIRA_ISSUE_TYPE_STORYも設定されていないため、JIRA同期を実行できません。' +
            '\n  解決方法1: 環境変数を設定:\n' +
            '  export JIRA_ISSUE_TYPE_STORY=10036  # JIRAインスタンス固有のID\n' +
            '\n  解決方法2: .michi/config.jsonに以下を追加:\n' +
            '  {\n' +
            '    "jira": {\n' +
            '      "issueTypes": {\n' +
            '        "story": "10036",\n' +
            '        "subtask": "10037"\n' +
            '      }\n' +
            '    }\n' +
            '  }' +
            '\n  確認方法: JIRA管理画面（Settings > Issues > Issue types）またはREST API: GET /rest/api/3/issuetype',
        );
      } else {
        info.push(
          `jira.issueTypes.storyが設定されていませんが、環境変数JIRA_ISSUE_TYPE_STORY（${process.env.JIRA_ISSUE_TYPE_STORY}）を使用します。`,
        );
      }
    } else {
      if (!jira.issueTypes.story) {
        if (!process.env.JIRA_ISSUE_TYPE_STORY) {
          errors.push(
            'jira.issueTypes.storyが設定されていません。' +
              '環境変数JIRA_ISSUE_TYPE_STORYも設定されていないため、JIRA同期を実行できません。' +
              '\n  解決方法: .michi/config.jsonのjira.issueTypes.storyに値を設定するか、' +
              '環境変数JIRA_ISSUE_TYPE_STORYを設定してください。',
          );
        } else {
          info.push(
            `jira.issueTypes.storyが設定されていませんが、環境変数JIRA_ISSUE_TYPE_STORY（${process.env.JIRA_ISSUE_TYPE_STORY}）を使用します。`,
          );
        }
      }

      if (!jira.issueTypes.subtask) {
        if (!process.env.JIRA_ISSUE_TYPE_SUBTASK) {
          warnings.push(
            'jira.issueTypes.subtaskが設定されていません。' +
              '環境変数JIRA_ISSUE_TYPE_SUBTASKも設定されていないため、サブタスクは作成されません。',
          );
        } else {
          info.push(
            `jira.issueTypes.subtaskが設定されていませんが、環境変数JIRA_ISSUE_TYPE_SUBTASK（${process.env.JIRA_ISSUE_TYPE_SUBTASK}）を使用します。`,
          );
        }
      }
    }

    // selectedPhases設定のチェック
    if (
      jira.storyCreationGranularity === 'selected-phases' &&
      !jira.selectedPhases
    ) {
      errors.push(
        'jira.selectedPhasesが設定されていません。' +
          'storyCreationGranularityが"selected-phases"の場合、selectedPhases設定が必須です。',
      );
    }

    if (jira.selectedPhases && jira.selectedPhases.length === 0) {
      warnings.push(
        'jira.selectedPhasesが空です。ストーリーは作成されません。',
      );
    }
  }

  if (errors.length > 0) {
    return failureWithInfo(errors, warnings, info);
  }

  return successWithInfo(true, warnings, info);
}

/**
 * JIRA同期実行前の必須設定値チェック（非同期版・Issue Type IDの存在チェック付き）
 * @param projectRoot プロジェクトルート（デフォルト: process.cwd()）
 * @returns バリデーション結果
 */
export async function validateForJiraSyncAsync(
  projectRoot: string = process.cwd(),
): Promise<ResultWithInfo> {
  // まず同期版のバリデーションを実行
  const result = validateForJiraSync(projectRoot);

  // 追加のエラーと警告を収集
  const additionalErrors: string[] = [];
  const additionalWarnings: string[] = [];

  // JIRA認証情報とプロジェクトキーが設定されている場合、Issue Type IDの存在チェックを実行
  if (hasJiraCredentials()) {
    try {
      const projectMeta = loadProjectMeta(projectRoot);
      const projectKey = projectMeta.jiraProjectKey;

      if (projectKey) {
        const config = getConfig(projectRoot);
        const storyId =
          config.jira?.issueTypes?.story || process.env.JIRA_ISSUE_TYPE_STORY;
        const subtaskId =
          config.jira?.issueTypes?.subtask ||
          process.env.JIRA_ISSUE_TYPE_SUBTASK;

        // Issue Typesを取得
        const issueTypes = await getProjectIssueTypes(projectKey);

        if (issueTypes && issueTypes.length > 0) {
          // Story Issue Type IDの存在チェック
          if (storyId) {
            if (!hasIssueTypeId(issueTypes, storyId)) {
              const storyTypes = filterStoryTypes(issueTypes);
              const suggestions =
                storyTypes.length > 0
                  ? storyTypes
                    .map((it) => `  - ${it.name} (ID: ${it.id})`)
                    .join('\n')
                  : '  （Storyタイプが見つかりませんでした）';

              additionalErrors.push(
                `設定されたStory Issue Type ID (${storyId}) がプロジェクト '${projectKey}' に存在しません。\n` +
                  '\n利用可能なStoryタイプ:\n' +
                  suggestions +
                  '\n\n修正方法:\n' +
                  '  1. .envファイルを編集:\n' +
                  '     JIRA_ISSUE_TYPE_STORY=<正しいID>\n' +
                  '\n' +
                  '  2. または、対話的設定を再実行:\n' +
                  '     npm run setup:interactive',
              );
            }
          }

          // Subtask Issue Type IDの存在チェック
          if (subtaskId) {
            if (!hasIssueTypeId(issueTypes, subtaskId)) {
              const subtaskTypes = filterSubtaskTypes(issueTypes);
              const suggestions =
                subtaskTypes.length > 0
                  ? subtaskTypes
                    .map((it) => `  - ${it.name} (ID: ${it.id})`)
                    .join('\n')
                  : '  （Subtaskタイプが見つかりませんでした）';

              additionalWarnings.push(
                `設定されたSubtask Issue Type ID (${subtaskId}) がプロジェクト '${projectKey}' に存在しません。\n` +
                  '\n利用可能なSubtaskタイプ:\n' +
                  suggestions +
                  '\n\n修正方法:\n' +
                  '  1. .envファイルを編集:\n' +
                  '     JIRA_ISSUE_TYPE_SUBTASK=<正しいID>\n' +
                  '\n' +
                  '  2. または、対話的設定を再実行:\n' +
                  '     npm run setup:interactive',
              );
            }
          }
        } else {
          // Issue Types取得に失敗した場合（認証エラー、ネットワークエラーなど）
          // エラーにはしないが、警告として記録
          additionalWarnings.push(
            `JIRAプロジェクト '${projectKey}' のIssue Typesを取得できませんでした。` +
              '設定されたIssue Type IDの存在確認をスキップします。',
          );
        }
      }
    } catch (error) {
      // プロジェクトメタデータの読み込みに失敗した場合など
      // エラーにはしないが、警告として記録
      additionalWarnings.push(
        `プロジェクトメタデータの読み込みに失敗しました: ${error instanceof Error ? error.message : error}` +
          '設定されたIssue Type IDの存在確認をスキップします。',
      );
    }
  }

  // 追加のエラーや警告があれば、新しいResultWithInfoを作成
  if (additionalErrors.length > 0 || additionalWarnings.length > 0) {
    const allErrors = [...result.errors, ...additionalErrors];
    const allWarnings = [...result.warnings, ...additionalWarnings];

    if (allErrors.length > 0) {
      return failureWithInfo(allErrors, allWarnings, result.info);
    }

    return successWithInfo(true, allWarnings, result.info);
  }

  return result;
}

/**
 * グローバル設定ファイルをバリデーション
 */
export function validateGlobalConfig(): ResultWithInfo {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  const globalConfigPath = getGlobalConfigPath();

  if (!existsSync(globalConfigPath)) {
    info.push('Global config file not found. This is optional.');
    return successWithInfo(true, [], info);
  }

  try {
    const content = readFileSync(globalConfigPath, 'utf-8');
    const parsed = JSON.parse(content);

    // スキーマでバリデーション
    const result = AppConfigSchema.safeParse(parsed);

    if (!result.success) {
      result.error.issues.forEach((error: ZodIssue) => {
        const path = error.path.map(String).join('.');
        errors.push(`${path}: ${error.message}`);
      });

      return failureWithInfo(errors, [], []);
    }

    if (errors.length > 0) {
      return failureWithInfo(errors, warnings, []);
    }

    return successWithInfo(true, warnings, []);
  } catch (error) {
    if (error instanceof SyntaxError) {
      errors.push(`Invalid JSON in global config: ${error.message}`);
    } else {
      errors.push(
        `Error reading global config file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return failureWithInfo(errors, [], []);
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const valid = validateAndReport();
  process.exit(valid ? 0 : 1);
}
