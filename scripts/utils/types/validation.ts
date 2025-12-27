/**
 * 共通 ValidationResult 型定義
 *
 * すべてのバリデーション結果を統一的に扱うための Result 型。
 * Result<T, E> パターンを採用し、型安全性を向上。
 */

/**
 * Result<T, E> 型
 *
 * @template T - 成功時の値の型
 * @template E - エラーの型（デフォルトは string）
 */
export interface Result<T, E = string> {
  /**
   * バリデーションが成功したかどうか
   */
  success: boolean;

  /**
   * 成功時の値（失敗時は undefined）
   */
  value: T | undefined;

  /**
   * エラーメッセージの配列
   */
  errors: E[];

  /**
   * 警告メッセージの配列
   */
  warnings: E[];
}

/**
 * 成功結果を作成するヘルパー関数
 */
export function success<T, E = string>(value: T, warnings: E[] = []): Result<T, E> {
  return {
    success: true,
    value,
    errors: [],
    warnings
  };
}

/**
 * 失敗結果を作成するヘルパー関数
 */
export function failure<T, E = string>(errors: E[], warnings: E[] = []): Result<T, E> {
  return {
    success: false,
    value: undefined,
    errors,
    warnings
  };
}

/**
 * 旧 ValidationResult 互換型（移行期間用）
 *
 * @deprecated Use Result<boolean, string> instead
 */
export interface LegacyValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * 旧 ValidationResult を Result に変換
 */
export function fromLegacy(legacy: LegacyValidationResult): Result<boolean, string> {
  return {
    success: legacy.valid,
    value: legacy.valid,
    errors: legacy.errors,
    warnings: legacy.warnings || []
  };
}

/**
 * Result を 旧 ValidationResult に変換
 */
export function toLegacy(result: Result<boolean, string>): LegacyValidationResult {
  return {
    valid: result.success,
    errors: result.errors,
    warnings: result.warnings
  };
}
