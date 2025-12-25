/**
 * テンプレートファイル検索ユーティリティ
 *
 * Issue #35: cc-sdd準拠のテンプレート検索
 * Claude環境のテンプレートを検索
 */

import { existsSync } from 'fs';
import { join } from 'path';

/**
 * templates/ディレクトリからファイルを検索
 * 
 * @param michiPath - Michiリポジトリのルートパス
 * @param relativePath - templates/配下の相対パス（例: 'rules/github-ssot.mdc'）
 * @returns 見つかったファイルの絶対パス、見つからない場合はnull
 * 
 * @example
 * ```typescript
 * const path = findTemplateFile('/path/to/michi', 'rules/github-ssot.mdc');
 * // returns: '/path/to/michi/templates/claude/rules/github-ssot.mdc'
 * ```
 */
export function findTemplateFile(michiPath: string, relativePath: string): string | null {
  // templates/claude/
  const claudePath = join(michiPath, 'templates/claude', relativePath);
  if (existsSync(claudePath)) {
    return claudePath;
  }

  return null;
}

/**
 * 必須テンプレートファイルのバリデーション
 * 
 * @param michiPath - Michiリポジトリのルートパス
 * @param requiredFiles - 必須ファイルのリスト
 * @throws Error - 必須ファイルが見つからない場合
 * 
 * @example
 * ```typescript
 * validateRequiredTemplates('/path/to/michi', [
 *   'rules/github-ssot.mdc',
 *   'commands/michi/confluence-sync.md'
 * ]);
 * ```
 */
export function validateRequiredTemplates(
  michiPath: string,
  requiredFiles: string[]
): void {
  const missingFiles: string[] = [];
  
  for (const file of requiredFiles) {
    const path = findTemplateFile(michiPath, file);
    if (!path) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    throw new Error(
      `Missing required template files:\n  - ${missingFiles.join('\n  - ')}\n\n` +
      `Please check that Michi templates are properly installed at: ${michiPath}/templates/`
    );
  }
}

