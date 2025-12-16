/**
 * 設定読み込み・マージ機能
 * デフォルト設定 + プロジェクト固有設定をマージ
 */

import { readFileSync, writeFileSync, existsSync, statSync, renameSync, unlinkSync } from 'fs';
import { resolve, relative, isAbsolute } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { config, parse as dotenvParse } from 'dotenv';
import {
  AppConfigSchema,
  MultiRepoProjectSchema,
  RepositorySchema,
  type AppConfig,
  type MultiRepoProject,
  type Repository,
} from '../config/config-schema.js';

// 環境変数読み込み
config();

/**
 * グローバル設定ファイルのパス定数
 */
const GLOBAL_CONFIG_DIR = '.michi';
const GLOBAL_CONFIG_FILE = 'config.json';

/**
 * グローバル設定ファイルのパスを取得
 */
export function getGlobalConfigPath(): string {
  const home = homedir();
  return resolve(home, GLOBAL_CONFIG_DIR, GLOBAL_CONFIG_FILE);
}

/**
 * グローバル.envファイルのパスを取得
 */
export function getGlobalEnvPath(): string {
  const home = process.env.HOME || homedir();
  return resolve(home, GLOBAL_CONFIG_DIR, '.env');
}

/**
 * 深いマージ（Deep Merge）
 * オブジェクトを再帰的にマージする
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (result[key] || {}) as Record<string, unknown>,
        source[key] as Record<string, unknown>
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
 * グローバル設定を読み込む
 */
function loadGlobalConfig(): Partial<AppConfig> | null {
  const globalConfigPath = getGlobalConfigPath();

  if (!existsSync(globalConfigPath)) {
    return null;
  }

  try {
    const content = readFileSync(globalConfigPath, 'utf-8');
    const parsed = JSON.parse(content);

    // 環境変数を展開
    const expanded = expandEnvVarsInConfig(parsed);

    return expanded as Partial<AppConfig>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn(`⚠️  Invalid JSON in global config ${globalConfigPath}: ${error.message}`);
    } else {
      console.warn(`⚠️  Failed to load global config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return null;
  }
}

/**
 * グローバル.envを読み込み
 * ~/.michi/.env から組織共通の環境変数を読み込む
 */
function loadGlobalEnv(): Record<string, string> {
  const globalEnvPath = getGlobalEnvPath();

  if (!existsSync(globalEnvPath)) {
    return {};
  }

  try {
    const content = readFileSync(globalEnvPath, 'utf-8');
    return dotenvParse(content);
  } catch (error) {
    console.warn(`⚠️  Failed to load global env from ${globalEnvPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {};
  }
}

/**
 * プロジェクト.envを読み込み
 * .env からプロジェクト固有の環境変数を読み込む
 */
function loadProjectEnv(projectRoot: string): Record<string, string> {
  const projectEnvPath = resolve(projectRoot, '.env');

  if (!existsSync(projectEnvPath)) {
    return {};
  }

  try {
    const content = readFileSync(projectEnvPath, 'utf-8');
    return dotenvParse(content);
  } catch (error) {
    console.warn(`⚠️  Failed to load project env from ${projectEnvPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {};
  }
}

/**
 * プロジェクトメタデータを読み込み
 * .kiro/project.json からプロジェクト情報を読み込む
 */
function loadProjectMetadata(projectRoot: string): Partial<AppConfig> | null {
  const projectJsonPath = resolve(projectRoot, '.kiro/project.json');

  if (!existsSync(projectJsonPath)) {
    return null;
  }

  try {
    const content = readFileSync(projectJsonPath, 'utf-8');
    const meta = JSON.parse(content);

    // project フィールドとして返す
    return { project: meta } as Partial<AppConfig>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn(`⚠️  Invalid JSON in ${projectJsonPath}: ${error.message}`);
    } else {
      console.warn(`⚠️  Failed to load project metadata from ${projectJsonPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return null;
  }
}

/**
 * 環境変数から設定へのマッピング
 */
const ENV_TO_CONFIG_MAPPING: Record<string, string> = {
  'ATLASSIAN_URL': 'atlassian.url',
  'ATLASSIAN_EMAIL': 'atlassian.email',
  'ATLASSIAN_API_TOKEN': 'atlassian.apiToken',
  'GITHUB_ORG': 'github.org',
  'GITHUB_TOKEN': 'github.token',
  'CONFLUENCE_PRD_SPACE': 'confluence.spaces.requirements',
  'CONFLUENCE_QA_SPACE': 'confluence.spaces.qa',
  'CONFLUENCE_RELEASE_SPACE': 'confluence.spaces.release',
  'JIRA_ISSUE_TYPE_STORY': 'jira.issueTypes.story',
  'JIRA_ISSUE_TYPE_SUBTASK': 'jira.issueTypes.subtask',
  'JIRA_PROJECT_KEYS': 'jira.projectKeys',
};

/**
 * ドットパスでオブジェクトの値を設定
 * 例: setValueByPath(obj, 'a.b.c', value) => obj.a.b.c = value
 */
function setValueByPath(obj: Record<string, unknown>, path: string, value: string): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * 環境変数を設定オブジェクトに適用
 */
function applyEnvVarsToConfig(
  config: AppConfig,
  envVars: Record<string, string>
): AppConfig {
  const result = { ...config } as Record<string, unknown>;

  for (const [envKey, configPath] of Object.entries(ENV_TO_CONFIG_MAPPING)) {
    if (envVars[envKey]) {
      setValueByPath(result, configPath, envVars[envKey]);
    }
  }

  return result as AppConfig;
}

/**
 * 設定を読み込んでマージ
 *
 * マージ順序（優先度: 低 → 高）:
 * 1. デフォルト設定
 * 2. グローバル.env（~/.michi/.env）
 * 3. グローバル設定（~/.michi/config.json）
 * 4. プロジェクトメタデータ（.kiro/project.json）
 * 5. プロジェクト設定（.michi/config.json）
 * 6. プロジェクト.env（.env）- 最高優先度
 */
export function loadConfig(projectRoot: string = process.cwd()): AppConfig {
  // 1. デフォルト設定を読み込み（最低優先度）
  let mergedConfig: AppConfig = loadDefaultConfig();

  // 2. グローバル.envを読み込み
  const globalEnvVars = loadGlobalEnv();
  if (Object.keys(globalEnvVars).length > 0) {
    mergedConfig = applyEnvVarsToConfig(mergedConfig, globalEnvVars);
  }

  // 3. グローバル設定を読み込み
  const globalConfig = loadGlobalConfig();
  if (globalConfig) {
    mergedConfig = deepMerge(mergedConfig, globalConfig);
  }

  // 4. プロジェクトメタデータを読み込み
  const projectMeta = loadProjectMetadata(projectRoot);
  if (projectMeta) {
    mergedConfig = deepMerge(mergedConfig, projectMeta);
  }

  // 5. プロジェクト固有設定を読み込み
  const projectConfig = loadProjectConfig(projectRoot);
  if (projectConfig) {
    mergedConfig = deepMerge(mergedConfig, projectConfig);
  }

  // 6. プロジェクト.envを読み込み（最高優先度）
  const projectEnvVars = loadProjectEnv(projectRoot);
  if (Object.keys(projectEnvVars).length > 0) {
    mergedConfig = applyEnvVarsToConfig(mergedConfig, projectEnvVars);
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
let cachedGlobalConfigMtime: number | null = null;
let cachedGlobalEnvMtime: number | null = null;
let cachedProjectMetaMtime: number | null = null;
let cachedProjectEnvMtime: number | null = null;

export function getConfig(projectRoot: string = process.cwd()): AppConfig {
  const projectConfigPath = resolveConfigPath(projectRoot);
  const globalConfigPath = getGlobalConfigPath();
  const globalEnvPath = getGlobalEnvPath();
  const projectMetaPath = resolve(projectRoot, '.kiro/project.json');
  const projectEnvPath = resolve(projectRoot, '.env');
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

  // グローバル設定ファイルの更新時刻をチェック
  let globalConfigChanged = false;
  try {
    if (existsSync(globalConfigPath)) {
      const globalStats = statSync(globalConfigPath);
      if (cachedGlobalConfigMtime !== globalStats.mtimeMs) {
        globalConfigChanged = true;
        cachedGlobalConfigMtime = globalStats.mtimeMs;
      }
    } else {
      if (cachedGlobalConfigMtime !== null) {
        globalConfigChanged = true;
        cachedGlobalConfigMtime = null;
      }
    }
  } catch {
    globalConfigChanged = true;
    cachedGlobalConfigMtime = null;
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

  // グローバル.envファイルの更新時刻をチェック
  let globalEnvChanged = false;
  try {
    if (existsSync(globalEnvPath)) {
      const globalEnvStats = statSync(globalEnvPath);
      if (cachedGlobalEnvMtime !== globalEnvStats.mtimeMs) {
        globalEnvChanged = true;
        cachedGlobalEnvMtime = globalEnvStats.mtimeMs;
      }
    } else {
      if (cachedGlobalEnvMtime !== null) {
        globalEnvChanged = true;
        cachedGlobalEnvMtime = null;
      }
    }
  } catch {
    globalEnvChanged = true;
    cachedGlobalEnvMtime = null;
  }

  // プロジェクトメタデータファイルの更新時刻をチェック
  let projectMetaChanged = false;
  try {
    if (existsSync(projectMetaPath)) {
      const projectMetaStats = statSync(projectMetaPath);
      if (cachedProjectMetaMtime !== projectMetaStats.mtimeMs) {
        projectMetaChanged = true;
        cachedProjectMetaMtime = projectMetaStats.mtimeMs;
      }
    } else {
      if (cachedProjectMetaMtime !== null) {
        projectMetaChanged = true;
        cachedProjectMetaMtime = null;
      }
    }
  } catch {
    projectMetaChanged = true;
    cachedProjectMetaMtime = null;
  }

  // プロジェクト.envファイルの更新時刻をチェック
  let projectEnvChanged = false;
  try {
    if (existsSync(projectEnvPath)) {
      const projectEnvStats = statSync(projectEnvPath);
      if (cachedProjectEnvMtime !== projectEnvStats.mtimeMs) {
        projectEnvChanged = true;
        cachedProjectEnvMtime = projectEnvStats.mtimeMs;
      }
    } else {
      if (cachedProjectEnvMtime !== null) {
        projectEnvChanged = true;
        cachedProjectEnvMtime = null;
      }
    }
  } catch {
    projectEnvChanged = true;
    cachedProjectEnvMtime = null;
  }

  // キャッシュが有効で、設定ファイルが変更されていない場合はキャッシュを返す
  if (
    cachedConfig &&
    cachedProjectRoot === projectRoot &&
    !defaultConfigChanged &&
    !globalConfigChanged &&
    !globalEnvChanged &&
    !projectConfigChanged &&
    !projectMetaChanged &&
    !projectEnvChanged
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
  cachedGlobalConfigMtime = null;
  cachedGlobalEnvMtime = null;
  cachedProjectMetaMtime = null;
  cachedProjectEnvMtime = null;
}

/**
 * 設定ファイルのパスを解決（外部から使用可能）
 */
export function getConfigPath(projectRoot: string = process.cwd()): string {
  return resolveConfigPath(projectRoot);
}

/**
 * Multi-Repo管理関数
 */

/**
 * 設定ファイルをアトミックに保存
 * 一時ファイルに書き込んでからrenameすることでアトミック性を保証
 */
function saveConfig(
  config: Partial<AppConfig>,
  projectRoot: string = process.cwd(),
): void {
  const configPath = resolveConfigPath(projectRoot);
  const tempPath = `${configPath}.tmp`;

  try {
    // 一時ファイルに書き込み
    writeFileSync(tempPath, JSON.stringify(config, null, 2), 'utf-8');

    // アトミックにリネーム
    renameSync(tempPath, configPath);

    // キャッシュをクリア
    clearConfigCache();
  } catch (error) {
    // エラー時は一時ファイルを削除
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch {
        // 削除失敗は無視
      }
    }
    throw error;
  }
}

/**
 * プロジェクト名でMulti-Repoプロジェクトを検索
 */
export function findProject(
  projectName: string,
  projectRoot: string = process.cwd(),
): MultiRepoProject | null {
  const configPath = resolveConfigPath(projectRoot);

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const config = loadProjectConfig(projectRoot);
    if (!config?.multiRepoProjects) {
      return null;
    }

    const project = config.multiRepoProjects.find(
      (p) => p.name === projectName,
    );
    return project || null;
  } catch {
    return null;
  }
}

/**
 * Multi-Repoプロジェクトを追加
 */
export function addMultiRepoProject(
  project: MultiRepoProject,
  projectRoot: string = process.cwd(),
): { success: boolean; project?: MultiRepoProject; error?: string } {
  try {
    // Zodスキーマでバリデーション
    const validatedProject = MultiRepoProjectSchema.parse(project);

    // 既存の設定を読み込み
    const existingConfig = loadProjectConfig(projectRoot) || {};
    const multiRepoProjects = existingConfig.multiRepoProjects || [];

    // 重複チェック
    const existingProject = multiRepoProjects.find(
      (p) => p.name === validatedProject.name,
    );
    if (existingProject) {
      return {
        success: false,
        error: `Project "${validatedProject.name}" already exists`,
      };
    }

    // プロジェクトを追加
    const updatedConfig = {
      ...existingConfig,
      multiRepoProjects: [...multiRepoProjects, validatedProject],
    };

    // 設定を保存
    saveConfig(updatedConfig, projectRoot);

    return {
      success: true,
      project: validatedProject,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Multi-Repoプロジェクトにリポジトリを追加
 */
export function addRepositoryToProject(
  projectName: string,
  repository: Repository,
  projectRoot: string = process.cwd(),
): { success: boolean; repository?: Repository; error?: string } {
  try {
    // Zodスキーマでバリデーション
    const validatedRepo = RepositorySchema.parse(repository);

    // 既存の設定を読み込み
    const existingConfig = loadProjectConfig(projectRoot) || {};
    const multiRepoProjects = existingConfig.multiRepoProjects || [];

    // プロジェクトを検索
    const projectIndex = multiRepoProjects.findIndex(
      (p) => p.name === projectName,
    );
    if (projectIndex === -1) {
      return {
        success: false,
        error: `Project "${projectName}" not found`,
      };
    }

    const project = multiRepoProjects[projectIndex];

    // 重複チェック
    const existingRepo = project.repositories.find(
      (r) => r.name === validatedRepo.name,
    );
    if (existingRepo) {
      return {
        success: false,
        error: `Repository "${validatedRepo.name}" already exists in project "${projectName}"`,
      };
    }

    // リポジトリを追加
    const updatedProject = {
      ...project,
      repositories: [...project.repositories, validatedRepo],
    };

    // プロジェクト配列を更新
    const updatedProjects = [...multiRepoProjects];
    updatedProjects[projectIndex] = updatedProject;

    // 設定を保存
    const updatedConfig = {
      ...existingConfig,
      multiRepoProjects: updatedProjects,
    };
    saveConfig(updatedConfig, projectRoot);

    return {
      success: true,
      repository: validatedRepo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

