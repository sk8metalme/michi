/**
 * テストコマンド定数定義
 *
 * 各言語のテストコマンドをCI/CDテンプレートから取得
 * Reference: templates/ci/github-actions/*.yml
 */

/**
 * プロジェクト言語の型定義
 */
export type ProjectLanguage =
  | 'Node.js/TypeScript'
  | 'Java'
  | 'PHP'
  | 'Python'
  | 'Go'
  | 'Rust';

/**
 * テストコマンドの型定義
 */
export interface TestCommands {
  test: string;
  lint: string;
  build: string;
}

/**
 * 言語別テストコマンドマッピング
 * CI/CDテンプレート（templates/ci/github-actions/*.yml）から取得
 */
export const TEST_COMMANDS_MAP: Record<ProjectLanguage, TestCommands> = {
  'Node.js/TypeScript': {
    test: 'npm test',
    lint: 'npm run lint',
    build: 'npm run build'
  },
  'Java': {
    test: './gradlew test',
    lint: './gradlew checkstyleMain checkstyleTest',
    build: './gradlew build'
  },
  'PHP': {
    test: 'composer test',
    lint: 'composer phpstan',
    build: 'composer install --no-dev --optimize-autoloader'
  },
  'Python': {
    test: 'pytest',
    lint: 'flake8 src tests',
    build: 'python -m build'
  },
  'Go': {
    test: 'go test ./...',
    lint: 'golangci-lint run',
    build: 'go build ./...'
  },
  'Rust': {
    test: 'cargo test',
    lint: 'cargo clippy -- -D warnings',
    build: 'cargo build --release'
  }
};

/**
 * 言語に対応するテストコマンドを取得
 *
 * @param language - プロジェクト言語
 * @returns テストコマンド一式
 *
 * @example
 * getTestCommands('Java') // => { test: './gradlew test', ... }
 * getTestCommands('Node.js') // => { test: 'npm test', ... } (部分一致)
 * getTestCommands('Unknown') // => Node.js/TypeScript のコマンド (デフォルト)
 */
export function getTestCommands(language: string): TestCommands {
  // 完全一致
  if (language in TEST_COMMANDS_MAP) {
    return TEST_COMMANDS_MAP[language as ProjectLanguage];
  }

  // 部分一致フォールバック（"Node.js" → "Node.js/TypeScript"）
  const partialMatch = Object.keys(TEST_COMMANDS_MAP).find(key =>
    key.toLowerCase().includes(language.toLowerCase()) ||
    language.toLowerCase().includes(key.toLowerCase())
  );

  if (partialMatch) {
    console.warn(`⚠️  言語 "${language}" は部分一致で "${partialMatch}" として扱います`);
    return TEST_COMMANDS_MAP[partialMatch as ProjectLanguage];
  }

  // デフォルト: Node.js/TypeScript
  console.warn(`⚠️  未知の言語 "${language}"。デフォルト（Node.js/TypeScript）を使用します`);
  return TEST_COMMANDS_MAP['Node.js/TypeScript'];
}
