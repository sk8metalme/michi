/**
 * safeReadFile - ファイル読み込み処理の統合ユーティリティ
 * 一貫したエラーハンドリングとResult型を提供
 */

import { readFileSync, existsSync } from 'fs';
import type { Result } from './types/validation.js';
import { success, failure } from './types/validation.js';

/**
 * File read error types
 */
export type FileReadError =
  | { type: 'FileNotFound'; path: string }
  | { type: 'PermissionDenied'; path: string }
  | { type: 'InvalidJSON'; path: string; cause: string }
  | { type: 'ReadError'; path: string; cause: string };

/**
 * Safe file reader with Result type
 *
 * @param filePath - Path to the file to read
 * @param encoding - File encoding (default: 'utf-8')
 * @returns Result<string, FileReadError> - File content or error
 *
 * @example
 * ```typescript
 * const result = safeReadFile('/path/to/file.txt');
 * if (result.success) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.errors[0].type);
 * }
 * ```
 */
export function safeReadFile(
  filePath: string,
  encoding: BufferEncoding = 'utf-8'
): Result<string, FileReadError> {
  // Check file existence
  if (!existsSync(filePath)) {
    return failure([{
      type: 'FileNotFound',
      path: filePath
    }]);
  }

  try {
    const content = readFileSync(filePath, encoding);
    return success(content);
  } catch (error) {
    // Check for permission errors
    if (error instanceof Error && error.message.includes('EACCES')) {
      return failure([{
        type: 'PermissionDenied',
        path: filePath
      }]);
    }

    // Generic read error
    return failure([{
      type: 'ReadError',
      path: filePath,
      cause: error instanceof Error ? error.message : String(error)
    }]);
  }
}

/**
 * Safe JSON file reader with Result type
 *
 * @param filePath - Path to the JSON file to read
 * @returns Result<any, FileReadError> - Parsed JSON object or error
 *
 * @example
 * ```typescript
 * const result = safeReadJsonFile('/path/to/config.json');
 * if (result.success) {
 *   const config = result.value;
 * } else {
 *   console.error(result.errors[0].type);
 * }
 * ```
 */
export function safeReadJsonFile(
  filePath: string
): Result<any, FileReadError> {
  // First, read the file
  const readResult = safeReadFile(filePath);

  if (!readResult.success) {
    return readResult;
  }

  // Then, parse JSON
  try {
    const parsed = JSON.parse(readResult.value as string);
    return success(parsed);
  } catch (error) {
    return failure([{
      type: 'InvalidJSON',
      path: filePath,
      cause: error instanceof Error ? error.message : String(error)
    }]);
  }
}
