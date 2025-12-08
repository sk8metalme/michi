/**
 * 設定読み込み・マージ機能
 * デフォルト設定 + プロジェクト固有設定をマージ
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, relative, isAbsolute } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { AppConfigSchema, type AppConfig } from '../config/config-schema.js';

// 環境変数読み込み
config();

/**
 * 深いマージ（Deep Merge）
 * オブジェクトを再帰的にマージする
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (result[key] || {}) as any,
        source[key] as any
      ) as T[Extract<keyof T, string>];
    } else if (source[key] !== undefined) {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * 許可された環境変数のリスト
 * セキュリティのため、設定ファイルで展開可能な環境変数を制限
 */
const ALLOWED_ENV_VARS = [
  'CONFLUENCE_PRD_SPACE',
  'CONFLUENCE_QA_SPACE',
  'CONFLUENCE_RELEASE_SPACE'
];

/**
 * 環境変数を文字列に展開
 * ${VAR_NAME} 形式のプレースホルダーを環境変数の値に置換
 * セキュリティのため、許可リストに含まれる環境変数のみ展開
 */
function expandEnvVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    if (ALLOWED_ENV_VARS.includes(varName)) {
      return process.env[varName] || match;
    }
    // 許可されていない環境変数は警告を出して展開しない
    console.warn(`⚠️  Environment variable "${varName}" is not allowed in config. Skipping expansion.`);
    return match;
  });
}

/**
 * 設定オブジェクト内の文字列値を環境変数で展開
 * 循環参照を防ぐため、処理済みオブジェクトを追跡
 */
function expandEnvVarsInConfig(config: unknown, visited: WeakSet<object> = new WeakSet()): unknown {
  if (typeof config === 'string') {
    return expandEnvVars(config);
  }
  
  if (Array.isArray(config)) {
    return config.map(item => expandEnvVarsInConfig(item, visited));
  }
  
  if (config && typeof config === 'object') {
    // 循環参照のチェック
    if (visited.has(config)) {
      console.warn('⚠️  Circular reference detected in config. Skipping expansion.');
      return config;
    }
    
    visited.add(config);
    const result: Record<string, unknown> = {};
    for (const key in config as Record<string, unknown>) {
      result[key] = expandEnvVarsInConfig((config as Record<string, unknown>)[key], visited);
    }
    visited.delete(config);
    return result;
  }
  
  return config;
}

/**
 * デフォルト設定を読み込む
 */
function loadDefaultConfig(): AppConfig {
  // import.meta.urlからディレクトリパスを取得
  const currentFileUrl = import.meta.url;
  const currentFilePath = fileURLToPath(currentFileUrl);
  const currentDir = resolve(currentFilePath, '..');
  const defaultConfigPath = resolve(currentDir, '../config/default-config.json');
  
  if (!existsSync(defaultConfigPath)) {
    throw new Error(`Default config file not found: ${defaultConfigPath}\nPlease ensure the file exists in the scripts/config directory.`);
  }
  
  try {
    const content = readFileSync(defaultConfigPath, 'utf-8');
    const parsed = JSON.parse(content);
    
    // 環境変数を展開
    const expanded = expandEnvVarsInConfig(parsed);
    
    // スキーマでバリデーション
    return AppConfigSchema.parse(expanded);
  } catch (error) {
    if (error instanceof SyntaxError) {
      // SyntaxErrorには標準的なlineやcolumnプロパティはないため、messageのみ使用
      throw new Error(`Invalid JSON in default config file ${defaultConfigPath}: ${error.message}`);
    }
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error(`Default config validation failed: ${error.message}\nFile: ${defaultConfigPath}`);
    }
    throw new Error(`Failed to load default config from ${defaultConfigPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * パストラバーサル攻撃を防ぐため、パスを検証
 */
function validateConfigPath(configPath: string, projectRoot: string): boolean {
  const resolvedPath = resolve(configPath);
  const resolvedRoot = resolve(projectRoot);
  const relativePath = relative(resolvedRoot, resolvedPath);

  // プロジェクトルート自体の場合は許可
  if (!relativePath) {
    return true;
  }

  // 相対パスが '..' で始まる、または絶対パスの場合は拒否
  // これにより、プロジェクトルート外のパスを防ぐ
  return !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

/**
 * 設定ファイルのパスを解決
 * 新規パス: .michi/config.json
 * legacyパス（.kiro/config.json）が存在する場合は警告のみ表示
 */
function resolveConfigPath(projectRoot: string): string {
  const michiConfigPath = resolve(projectRoot, '.michi/config.json');
  const legacyConfigPath = resolve(projectRoot, '.kiro/config.json');
  
  // legacyパスが存在する場合は警告（移行推奨）
  if (existsSync(legacyConfigPath) && !existsSync(michiConfigPath)) {
    console.warn(
      '⚠️  Deprecated: .kiro/config.json is deprecated.\n' +
      '   Please migrate to .michi/config.json\n' +
      '   The legacy path will not be supported in future versions.\n'
    );
  }
  
  return michiConfigPath;
}

/**
 * プロジェクト固有設定を読み込む
 */
function loadProjectConfig(projectRoot: string = process.cwd()): Partial<AppConfig> | null {
  const projectConfigPath = resolveConfigPath(projectRoot);
  
  // パストラバーサル対策: パスを検証
  if (!validateConfigPath(projectConfigPath, projectRoot)) {
    throw new Error(`Invalid config path: ${projectConfigPath} is outside project root`);
  }
  
  if (!existsSync(projectConfigPath)) {
    return null;
  }
  
  try {
    const content = readFileSync(projectConfigPath, 'utf-8');
    const parsed = JSON.parse(content);
    
    // 環境変数を展開
    const expanded = expandEnvVarsInConfig(parsed);
    
    // 部分的な設定なので、スキーマで厳密にバリデーションしない
    // ただし、存在するキーについては型チェック
    return expanded as Partial<AppConfig>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${projectConfigPath}: ${error.message}`);
    }
    if (error instanceof Error && error.message.includes('Invalid config path')) {
      throw error;
    }
    throw new Error(`Failed to load project config from ${projectConfigPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 設定を読み込んでマージ
 * 
 * マージ順序:
 * 1. デフォルト設定
 * 2. プロジェクト固有設定（上書き）
 * 3. 環境変数（最終上書き、既存の動作を維持）
 */
export function loadConfig(projectRoot: string = process.cwd()): AppConfig {
  // デフォルト設定を読み込み
  const defaultConfig = loadDefaultConfig();
  
  // プロジェクト固有設定を読み込み
  const projectConfig = loadProjectConfig(projectRoot);
  
  // マージ（プロジェクト設定がデフォルトを上書き）
  const mergedConfig: AppConfig = projectConfig
    ? deepMerge(defaultConfig, projectConfig)
    : defaultConfig;
  
  // 環境変数で最終上書き（条件付き）
  // 注意: config.jsonにspaces設定がある場合は環境変数を無視（config.jsonを優先）
  if (process.env.CONFLUENCE_PRD_SPACE) {
    if (!mergedConfig.confluence) {
      mergedConfig.confluence = {
        pageCreationGranularity: 'single',
        pageTitleFormat: '[{projectName}] {featureName} {docTypeLabel}',
        autoLabels: ['{projectLabel}', '{docType}', '{featureName}', 'github-sync']
      };
    }
    // spacesオブジェクトを確実に作成
    if (!mergedConfig.confluence.spaces) {
      mergedConfig.confluence.spaces = {};
    }
    // 各フィールドを個別にチェックし、未定義のフィールドのみ環境変数で設定
    // 既に定義されている値は変更しない
    if (!mergedConfig.confluence.spaces.requirements) {
      mergedConfig.confluence.spaces.requirements = process.env.CONFLUENCE_PRD_SPACE;
    }
    if (!mergedConfig.confluence.spaces.design) {
      mergedConfig.confluence.spaces.design = process.env.CONFLUENCE_PRD_SPACE;
    }
    if (!mergedConfig.confluence.spaces.tasks) {
      mergedConfig.confluence.spaces.tasks = process.env.CONFLUENCE_PRD_SPACE;
    }
  }
  
  // JIRA issue type IDを環境変数から取得（インスタンス固有の値のため）
  if (mergedConfig.jira && mergedConfig.jira.issueTypes) {
    if (process.env.JIRA_ISSUE_TYPE_STORY) {
      mergedConfig.jira.issueTypes.story = process.env.JIRA_ISSUE_TYPE_STORY;
    }
    if (process.env.JIRA_ISSUE_TYPE_SUBTASK) {
      mergedConfig.jira.issueTypes.subtask = process.env.JIRA_ISSUE_TYPE_SUBTASK;
    }
  }
  
  // スキーマで最終バリデーション
  return AppConfigSchema.parse(mergedConfig);
}

/**
 * 設定を取得（キャッシュ付き）
 * 設定ファイルの変更を検知してキャッシュを無効化
 */
let cachedConfig: AppConfig | null = null;
let cachedProjectRoot: string | null = null;
let cachedConfigMtime: number | null = null;
let cachedDefaultConfigMtime: number | null = null;

export function getConfig(projectRoot: string = process.cwd()): AppConfig {
  const projectConfigPath = resolveConfigPath(projectRoot);
  const currentFileUrl = import.meta.url;
  const currentFilePath = fileURLToPath(currentFileUrl);
  const currentDir = resolve(currentFilePath, '..');
  const defaultConfigPath = resolve(currentDir, '../config/default-config.json');
  
  // デフォルト設定ファイルの更新時刻をチェック
  let defaultConfigChanged = false;
  try {
    if (existsSync(defaultConfigPath)) {
      const defaultStats = statSync(defaultConfigPath);
      if (cachedDefaultConfigMtime !== defaultStats.mtimeMs) {
        defaultConfigChanged = true;
        cachedDefaultConfigMtime = defaultStats.mtimeMs;
      }
    } else {
      // ファイルが存在しない場合はキャッシュを無効化
      if (cachedDefaultConfigMtime !== null) {
        defaultConfigChanged = true;
        cachedDefaultConfigMtime = null;
      }
    }
  } catch {
    // ファイルアクセスエラー（削除された場合など）は変更として扱う
    defaultConfigChanged = true;
    cachedDefaultConfigMtime = null;
  }
  
  // プロジェクト設定ファイルの更新時刻をチェック
  let projectConfigChanged = false;
  try {
    if (existsSync(projectConfigPath)) {
      const projectStats = statSync(projectConfigPath);
      if (cachedConfigMtime !== projectStats.mtimeMs) {
        projectConfigChanged = true;
        cachedConfigMtime = projectStats.mtimeMs;
      }
    } else {
      // ファイルが存在しない場合はキャッシュを無効化
      if (cachedConfigMtime !== null) {
        projectConfigChanged = true;
        cachedConfigMtime = null;
      }
    }
  } catch {
    // ファイルアクセスエラー（削除された場合など）は変更として扱う
    projectConfigChanged = true;
    cachedConfigMtime = null;
  }
  
  // キャッシュが有効で、設定ファイルが変更されていない場合はキャッシュを返す
  if (
    cachedConfig &&
    cachedProjectRoot === projectRoot &&
    !defaultConfigChanged &&
    !projectConfigChanged
  ) {
    return cachedConfig;
  }
  
  // 設定を再読み込み
  cachedConfig = loadConfig(projectRoot);
  cachedProjectRoot = projectRoot;
  
  return cachedConfig;
}

/**
 * 設定キャッシュをクリア（テスト用）
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  cachedProjectRoot = null;
  cachedConfigMtime = null;
  cachedDefaultConfigMtime = null;
}

/**
 * 設定ファイルのパスを解決（外部から使用可能）
 */
export function getConfigPath(projectRoot: string = process.cwd()): string {
  return resolveConfigPath(projectRoot);
}

