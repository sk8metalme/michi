/**
 * init command - Interactive prompts
 * 対話型プロンプト処理
 */

import * as readline from 'readline';
import { basename } from 'path';
import {
  type Environment,
} from '../../../../scripts/constants/environments.js';
import {
  type SupportedLanguage,
  isSupportedLanguage,
} from '../../../../scripts/constants/languages.js';
import {
  validateProjectId,
  validateProjectName,
  validateJiraKey,
} from './validation.js';

export interface InitOptions {
  name?: string; // projectId
  projectName?: string;
  jiraKey?: string;
  michiPath?: string;
  skipConfig?: boolean;
  yes?: boolean;
  existing?: boolean; // 既存プロジェクトモード
  claude?: boolean;
  claudeAgent?: boolean;
  lang?: string;
}

export interface InitConfig {
  projectId: string;
  projectName: string;
  jiraKey: string;
  michiPath?: string;
  environment: Environment;
  langCode: SupportedLanguage;
  skipWorkflowConfig: boolean;
  interactive: boolean;
}

/**
 * 対話的にユーザー入力を取得
 */
export async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await new Promise<string>((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  } finally {
    rl.close();
  }
}

/**
 * 環境を決定（オプションまたは対話的）
 */
export async function determineEnvironment(options: InitOptions): Promise<Environment> {
  if (options.claude) return 'claude';
  if (options.claudeAgent) return 'claude-agent';

  console.log('');
  console.log('環境を選択してください:');
  console.log('  1) Claude Code (推奨)');
  console.log('  2) Claude Code Subagents');
  console.log('');

  const choice = await prompt('選択 [1-2] (デフォルト: 1): ');

  switch (choice || '1') {
  case '1':
    return 'claude';
  case '2':
    return 'claude-agent';
  default:
    console.log('無効な選択です。Claude Codeを使用します。');
    return 'claude';
  }
}

/**
 * オプションから設定を構築（対話的プロンプトを含む）
 */
export async function buildConfig(options: InitOptions, currentDir: string, isExistingMode: boolean): Promise<InitConfig> {
  // 環境を決定
  const environment = await determineEnvironment(options);

  // 言語コード
  const langCode = (options.lang || 'ja') as SupportedLanguage;
  if (!isSupportedLanguage(langCode)) {
    throw new Error(`Unsupported language: ${langCode}`);
  }

  // 既存プロジェクトモードの場合、ディレクトリ名をデフォルトとして使用
  const projectIdDefault = isExistingMode ? basename(currentDir) : (options.name || basename(currentDir));

  // プロジェクトID
  let projectId = options.name;
  if (!projectId && !options.yes) {
    console.log('');
    projectId = await prompt(`プロジェクトID [${projectIdDefault}]: `);
  }
  projectId = projectId || projectIdDefault;

  if (!validateProjectId(projectId)) {
    throw new Error('無効なプロジェクトIDです。英数字、ハイフン、アンダースコアのみ使用できます。');
  }

  // プロジェクト名
  let projectName = options.projectName;
  if (!projectName && !options.yes) {
    projectName = await prompt('プロジェクト名（例: プロジェクトA）: ');
  }

  if (!projectName) {
    throw new Error('プロジェクト名は必須です');
  }

  projectName = validateProjectName(projectName);

  // JIRAキー
  let jiraKey = options.jiraKey;
  if (!jiraKey && !options.yes) {
    jiraKey = await prompt('JIRAプロジェクトキー（例: PRJA）: ');
  }

  if (!jiraKey) {
    throw new Error('JIRAプロジェクトキーは必須です');
  }

  jiraKey = validateJiraKey(jiraKey);

  // 確認
  if (!options.yes) {
    console.log('');
    console.log('✅ 設定:');
    console.log(`   プロジェクトID: ${projectId}`);
    console.log(`   プロジェクト名: ${projectName}`);
    console.log(`   JIRA: ${jiraKey}`);
    console.log(`   環境: ${environment}`);
    console.log(`   言語: ${langCode}`);
    console.log('');

    const confirm = await prompt('この設定で続行しますか？ [Y/n]: ');
    if (confirm.toLowerCase() === 'n') {
      throw new Error('ユーザーによりキャンセルされました');
    }
  }

  return {
    projectId,
    projectName,
    jiraKey,
    michiPath: options.michiPath,
    environment,
    langCode,
    skipWorkflowConfig: options.skipConfig || false,
    interactive: !options.yes,
  };
}
