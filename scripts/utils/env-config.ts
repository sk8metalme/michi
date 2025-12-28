/**
 * .env ファイルの対話的設定ユーティリティ
 *
 * 機能:
 * - .envファイルのパース
 * - 対話的な環境変数入力（既存値の表示、上書き確認）
 * - sensitiveな値のマスク表示
 * - .envファイルの生成
 */

import { existsSync } from 'fs';
import * as readline from 'readline';
import {
  getProjectIssueTypes,
  hasJiraCredentials,
  findIssueTypeIdByName,
  filterStoryTypes,
  filterSubtaskTypes,
} from './jira-issue-type-fetcher.js';
import { safeReadFileOrThrow } from './safe-file-reader.js';

/**
 * 環境変数の設定項目定義
 */
export interface EnvValue {
  key: string;
  description: string;
  defaultValue?: string;
  required: boolean;
  sensitive?: boolean; // API token等のマスク表示対象
}

/**
 * 環境変数の設定項目リスト
 */
const ENV_CONFIG: EnvValue[] = [
  {
    key: 'ATLASSIAN_URL',
    description: 'Atlassian URL (例: https://your-domain.atlassian.net)',
    required: true,
  },
  {
    key: 'ATLASSIAN_EMAIL',
    description: 'Atlassianアカウントのメールアドレス',
    required: true,
  },
  {
    key: 'ATLASSIAN_API_TOKEN',
    description:
      'Atlassian API Token (https://id.atlassian.com/manage-profile/security/api-tokens で生成)',
    required: true,
    sensitive: true,
  },
  {
    key: 'GITHUB_ORG',
    description: 'GitHub Organization (オプション)',
    required: false,
  },
  {
    key: 'GITHUB_TOKEN',
    description: 'GitHub Personal Access Token (オプション)',
    required: false,
    sensitive: true,
  },
  {
    key: 'CONFLUENCE_PRD_SPACE',
    description: 'Confluence PRDスペースキー',
    required: false,
    defaultValue: 'PRD',
  },
  {
    key: 'CONFLUENCE_QA_SPACE',
    description: 'Confluence QAスペースキー',
    required: false,
    defaultValue: 'QA',
  },
  {
    key: 'CONFLUENCE_RELEASE_SPACE',
    description: 'Confluence Releaseスペースキー',
    required: false,
    defaultValue: 'RELEASE',
  },
  {
    key: 'JIRA_PROJECT_KEYS',
    description: 'JIRAプロジェクトキー（カンマ区切り）',
    required: false,
  },
  {
    key: 'JIRA_ISSUE_TYPE_STORY',
    description: 'JIRA Story Issue Type ID (JIRAインスタンス固有)',
    required: true,
    defaultValue: '10036',
  },
  {
    key: 'JIRA_ISSUE_TYPE_SUBTASK',
    description: 'JIRA Subtask Issue Type ID (JIRAインスタンス固有)',
    required: true,
    defaultValue: '10037',
  },
];

/**
 * .envファイルをパースしてMapで返す
 *
 * @param filePath .envファイルのパス
 * @returns 環境変数のMap (key -> value)
 */
export function parseEnvFile(filePath: string): Map<string, string> {
  const envMap = new Map<string, string>();

  if (!existsSync(filePath)) {
    return envMap;
  }

  try {
    const content = safeReadFileOrThrow(filePath);
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // コメント行または空行をスキップ
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // KEY=VALUE 形式をパース
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2];

        // クォートを除去
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith('\'') && value.endsWith('\''))
        ) {
          value = value.slice(1, -1);
        }

        envMap.set(key, value);
      }
    }
  } catch (error) {
    console.warn(
      `⚠️  Warning: Failed to parse ${filePath}:`,
      error instanceof Error ? error.message : error,
    );
  }

  return envMap;
}

/**
 * 値をマスク表示（sensitiveな値用）
 *
 * @param value 元の値
 * @returns マスクされた値 (例: "***hidden***")
 */
function maskValue(value: string): string {
  if (!value) {
    return '';
  }
  return '***hidden***';
}

/**
 * readlineインターフェースで質問して回答を取得
 *
 * @param rl readlineインターフェース
 * @param question 質問文
 * @returns ユーザーの入力
 */
async function question(
  rl: readline.Interface,
  question: string,
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * JIRA Issue Type IDの対話的選択
 *
 * @param rl readlineインターフェース
 * @param config 環境変数の設定項目
 * @param projectKey JIRAプロジェクトキー
 * @param existingValue 既存の値（あれば）
 * @returns 選択されたIssue Type ID
 */
async function promptJiraIssueTypeId(
  rl: readline.Interface,
  config: EnvValue,
  projectKey: string | undefined,
  existingValue?: string,
): Promise<string> {
  const requiredMark = config.required ? ' (必須)' : ' (オプション)';

  console.log(`\n📌 ${config.key}${requiredMark}`);
  console.log(`   ${config.description}`);

  if (existingValue) {
    console.log(`   現在の値: ${existingValue}`);
  } else if (config.defaultValue) {
    console.log(`   デフォルト値: ${config.defaultValue}`);
  }

  // JIRA認証情報が設定済みで、プロジェクトキーがある場合、APIから取得を試みる
  if (hasJiraCredentials() && projectKey) {
    console.log(
      `\n   🔍 JIRAプロジェクト "${projectKey}" からIssue Typesを取得中...`,
    );

    const issueTypes = await getProjectIssueTypes(projectKey);

    if (issueTypes && issueTypes.length > 0) {
      // StoryまたはSubtaskタイプをフィルタリング
      const filteredTypes =
        config.key === 'JIRA_ISSUE_TYPE_STORY'
          ? filterStoryTypes(issueTypes)
          : filterSubtaskTypes(issueTypes);

      if (filteredTypes.length > 0) {
        console.log('\n   📋 利用可能なIssue Types:');
        filteredTypes.forEach((it, index) => {
          const marker = existingValue === it.id ? ' ← 現在の値' : '';
          console.log(`      ${index + 1}. ${it.name} (ID: ${it.id})${marker}`);
        });

        console.log('\n   選択方法:');
        console.log(`     - 番号を入力 (1-${filteredTypes.length})`);
        console.log(`     - Issue Type名を入力 (例: ${filteredTypes[0].name})`);
        console.log(`     - IDを直接入力 (例: ${filteredTypes[0].id})`);
        console.log('     - Enterキーで既存値またはデフォルト値を使用');

        const promptText = '   選択: ';
        const input = await question(rl, promptText);

        if (!input) {
          // 入力が空の場合、既存値またはデフォルト値を使用
          return existingValue || config.defaultValue || '';
        }

        // 番号で選択
        const index = parseInt(input, 10);
        if (!isNaN(index) && index >= 1 && index <= filteredTypes.length) {
          const selected = filteredTypes[index - 1];
          console.log(
            `   ✅ ${selected.name} (ID: ${selected.id}) を選択しました`,
          );
          return selected.id;
        }

        // 名前で検索
        const foundById = findIssueTypeIdByName(filteredTypes, input);
        if (foundById) {
          const selected = filteredTypes.find((it) => it.id === foundById);
          console.log(
            `   ✅ ${selected?.name} (ID: ${foundById}) を選択しました`,
          );
          return foundById;
        }

        // IDとして直接入力された場合
        const foundDirect = filteredTypes.find((it) => it.id === input);
        if (foundDirect) {
          console.log(
            `   ✅ ${foundDirect.name} (ID: ${foundDirect.id}) を選択しました`,
          );
          return foundDirect.id;
        }

        // 見つからない場合、入力値をそのまま使用（ユーザーが手動でIDを入力した可能性）
        console.log(
          `   ⚠️  選択肢に一致しませんでしたが、入力値 "${input}" を使用します`,
        );
        return input;
      } else {
        console.log(
          `   ⚠️  ${config.key === 'JIRA_ISSUE_TYPE_STORY' ? 'Story' : 'Subtask'}タイプが見つかりませんでした`,
        );
      }
    } else {
      console.log(
        '   ⚠️  JIRA APIへのアクセスに失敗しました（認証情報が未設定、またはネットワークエラー）',
      );
      console.log('   手動でIDを入力してください。');
      console.log('   ');
      console.log('   JIRA管理画面で確認:');
      console.log('   Settings > Issues > Issue types');
      console.log('   ');
      console.log('   または、REST APIで確認:');
      console.log(
        `   GET https://your-domain.atlassian.net/rest/api/3/project/${projectKey}`,
      );
    }
  } else {
    if (!hasJiraCredentials()) {
      console.log(
        '   ℹ️  Atlassian認証情報が未設定のため、手動でIDを入力してください',
      );
    }
    if (!projectKey) {
      console.log(
        '   ℹ️  JIRAプロジェクトキーが未設定のため、手動でIDを入力してください',
      );
    }
  }

  // フォールバック: 通常の入力プロンプト
  const promptText = existingValue
    ? '   新しい値を入力（Enter=変更なし）: '
    : config.defaultValue
      ? '   値を入力（Enter=デフォルト）: '
      : '   値を入力: ';

  const MAX_RETRIES = 5;
  let retryCount = 0;

  while (true) {
    const input = await question(rl, promptText);

    // 入力が空の場合
    if (!input) {
      // 既存値があればそれを使用
      if (existingValue) {
        return existingValue;
      }
      // デフォルト値があればそれを使用
      if (config.defaultValue) {
        return config.defaultValue;
      }
      // 必須項目で値がない場合はエラー
      if (config.required) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`必須項目 ${config.key} の入力が ${MAX_RETRIES} 回失敗しました`);
        }
        console.log(`   ⚠️  必須項目です。値を入力してください。(残り ${MAX_RETRIES - retryCount} 回)`);
        continue;
      }
      // オプション項目は空文字を返す
      return '';
    }

    return input;
  }
}

/**
 * 環境変数の対話的入力（既存値がある場合は表示）
 *
 * @param rl readlineインターフェース
 * @param config 環境変数の設定項目
 * @param existingValue 既存の値（あれば）
 * @param projectKey JIRAプロジェクトキー（Issue Type ID設定時のみ使用）
 * @returns 入力された値
 */
export async function promptEnvValue(
  rl: readline.Interface,
  config: EnvValue,
  existingValue?: string,
  projectKey?: string,
): Promise<string> {
  // JIRA Issue Type ID設定の場合は特別な処理
  if (
    config.key === 'JIRA_ISSUE_TYPE_STORY' ||
    config.key === 'JIRA_ISSUE_TYPE_SUBTASK'
  ) {
    return promptJiraIssueTypeId(rl, config, projectKey, existingValue);
  }

  // 通常の入力処理
  const requiredMark = config.required ? ' (必須)' : ' (オプション)';

  console.log(`\n📌 ${config.key}${requiredMark}`);
  console.log(`   ${config.description}`);

  if (existingValue) {
    const displayValue = config.sensitive
      ? maskValue(existingValue)
      : existingValue;
    console.log(`   現在の値: ${displayValue}`);
  } else if (config.defaultValue) {
    console.log(`   デフォルト値: ${config.defaultValue}`);
  }

  const promptText = existingValue
    ? '   新しい値を入力（Enter=変更なし）: '
    : config.defaultValue
      ? '   値を入力（Enter=デフォルト）: '
      : '   値を入力: ';

  const MAX_RETRIES = 5;
  let retryCount = 0;

  while (true) {
    const input = await question(rl, promptText);

    // 入力が空の場合
    if (!input) {
      // 既存値があればそれを使用
      if (existingValue) {
        return existingValue;
      }
      // デフォルト値があればそれを使用
      if (config.defaultValue) {
        return config.defaultValue;
      }
      // 必須項目で値がない場合はエラー
      if (config.required) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`必須項目 ${config.key} の入力が ${MAX_RETRIES} 回失敗しました`);
        }
        console.log(`   ⚠️  必須項目です。値を入力してください。(残り ${MAX_RETRIES - retryCount} 回)`);
        continue;
      }
      // オプション項目は空文字を返す
      return '';
    }

    return input;
  }
}

/**
 * .envファイルの内容を生成
 *
 * @param values 環境変数のMap
 * @returns .envファイルの内容
 */
export function generateEnvContent(values: Map<string, string>): string {
  let content = '# Atlassian設定（MCP + REST API共通）\n';

  // Atlassian設定
  const atlassianKeys = [
    'ATLASSIAN_URL',
    'ATLASSIAN_EMAIL',
    'ATLASSIAN_API_TOKEN',
  ];
  for (const key of atlassianKeys) {
    const value = values.get(key) || '';
    content += `${key}=${value}\n`;
  }

  // GitHub設定
  content += '\n# GitHub設定\n';
  const githubKeys = ['GITHUB_ORG', 'GITHUB_TOKEN'];
  for (const key of githubKeys) {
    const value = values.get(key) || '';
    content += `${key}=${value}\n`;
  }

  // Confluence設定
  content += '\n# Confluence共有スペース\n';
  const confluenceKeys = [
    'CONFLUENCE_PRD_SPACE',
    'CONFLUENCE_QA_SPACE',
    'CONFLUENCE_RELEASE_SPACE',
  ];
  for (const key of confluenceKeys) {
    const value = values.get(key) || '';
    content += `${key}=${value}\n`;
  }

  // JIRA設定
  content += '\n# JIRAプロジェクトキー\n';
  content += `JIRA_PROJECT_KEYS=${values.get('JIRA_PROJECT_KEYS') || ''}\n`;

  content += '\n# JIRA Issue Type IDs（JIRAインスタンス固有 - 必須）\n';
  const storyConfig = ENV_CONFIG.find(c => c.key === 'JIRA_ISSUE_TYPE_STORY');
  const subtaskConfig = ENV_CONFIG.find(c => c.key === 'JIRA_ISSUE_TYPE_SUBTASK');
  content += `JIRA_ISSUE_TYPE_STORY=${values.get('JIRA_ISSUE_TYPE_STORY') || storyConfig?.defaultValue || ''}\n`;
  content += `JIRA_ISSUE_TYPE_SUBTASK=${values.get('JIRA_ISSUE_TYPE_SUBTASK') || subtaskConfig?.defaultValue || ''}\n`;

  return content;
}

/**
 * 対話的にすべての環境変数を設定
 *
 * @param existingValues 既存の環境変数Map（あれば）
 * @param jiraKey JIRAプロジェクトキー（自動設定用）
 * @param repoUrl リポジトリURL（自動設定用）
 * @returns 設定された環境変数のMap
 */
export async function configureEnvInteractive(
  existingValues?: Map<string, string>,
  jiraKey?: string,
  _repoUrl?: string,
): Promise<Map<string, string>> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const newValues = new Map<string, string>();

  try {
    console.log('\n🔐 環境変数の設定');
    console.log('='.repeat(60));
    console.log(
      '各項目を設定してください。Enterキーのみで既存値またはデフォルト値を使用します。',
    );

    for (const config of ENV_CONFIG) {
      let existingValue = existingValues?.get(config.key);

      // 自動設定項目
      if (config.key === 'JIRA_PROJECT_KEYS' && jiraKey && !existingValue) {
        existingValue = jiraKey;
      }

      // JIRA Issue Type ID設定時は、プロジェクトキーを渡す
      const projectKey = jiraKey || existingValues?.get('JIRA_PROJECT_KEYS');
      const value = await promptEnvValue(rl, config, existingValue, projectKey);

      if (value) {
        newValues.set(config.key, value);
      }
    }

    console.log('\n✅ 環境変数の設定が完了しました');
  } finally {
    rl.close();
  }

  return newValues;
}
