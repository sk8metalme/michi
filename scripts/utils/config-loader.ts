/**
 * 設定読み込み・マージ機能
 * デフォルト設定 + プロジェクト固有設定をマージ
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { AppConfigSchema, type AppConfig } from '../config/config-schema.js';

// 環境変数読み込み
config();

/**
 * 深いマージ（Deep Merge）
 * オブジェクトを再帰的にマージする
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {} as T[Extract<keyof T, string>], source[key] as Partial<T[Extract<keyof T, string>]>);
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
function expandEnvVarsInConfig(config: any, visited: WeakSet<object> = new WeakSet()): any {
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
    const result: any = {};
    for (const key in config) {
      result[key] = expandEnvVarsInConfig(config[key], visited);
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
      throw new Error(`Invalid JSON in default config file ${defaultConfigPath}: ${error.message}\nLine: ${(error as any).line}, Column: ${(error as any).column}`);
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
  
  // 設定ファイルはプロジェクトルート内に存在する必要がある
  return resolvedPath.startsWith(resolvedRoot);
}

/**
 * プロジェクト固有設定を読み込む
 */
function loadProjectConfig(projectRoot: string = process.cwd()): Partial<AppConfig> | null {
  const projectConfigPath = resolve(projectRoot, '.kiro/config.json');
  
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
  let mergedConfig: AppConfig = projectConfig
    ? deepMerge(defaultConfig, projectConfig)
    : defaultConfig;
  
  // 環境変数で最終上書き（既存の動作を維持）
  // 注意: 環境変数は既存のスクリプトで使用されているため、優先度を維持
  if (process.env.CONFLUENCE_PRD_SPACE) {
    if (!mergedConfig.confluence) {
      mergedConfig.confluence = {
        pageCreationGranularity: 'single',
        pageTitleFormat: '[{projectName}] {featureName} {docTypeLabel}',
        autoLabels: ['{projectLabel}', '{docType}', '{featureName}', 'github-sync']
      };
    }
    if (!mergedConfig.confluence.spaces) {
      mergedConfig.confluence.spaces = {};
    }
    mergedConfig.confluence.spaces.requirements = process.env.CONFLUENCE_PRD_SPACE;
    mergedConfig.confluence.spaces.design = process.env.CONFLUENCE_PRD_SPACE;
    mergedConfig.confluence.spaces.tasks = process.env.CONFLUENCE_PRD_SPACE;
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
  const projectConfigPath = resolve(projectRoot, '.kiro/config.json');
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
  } catch (error) {
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
  } catch (error) {
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

