/**
 * Error Formatter
 * エラーメッセージの標準フォーマットを提供
 */

import { OutputFormatter, OutputOptions } from './output-formatter.js';

/**
 * エラー詳細情報
 */
export interface ErrorDetails {
  /**
   * エラーメッセージ
   */
  message: string;

  /**
   * エラーコード（オプション）
   */
  code?: string;

  /**
   * エラーの原因（オプション）
   */
  cause?: string;

  /**
   * 修正提案（オプション）
   */
  suggestion?: string;

  /**
   * スタックトレース（オプション）
   */
  stack?: string;

  /**
   * 追加のコンテキスト情報（オプション）
   */
  context?: Record<string, unknown>;
}

/**
 * ErrorFormatter クラス
 */
export class ErrorFormatter {
  private formatter: OutputFormatter;

  constructor(options?: OutputOptions) {
    this.formatter = new OutputFormatter(options);
  }

  /**
   * エラーメッセージをフォーマット
   */
  format(details: ErrorDetails, options?: OutputOptions): string {
    const parts: string[] = [];

    // エラーメッセージ
    parts.push(this.formatter.error(details.message, options));

    // エラーコード
    if (details.code) {
      parts.push(
        this.formatter.keyValue('Error Code', details.code, {
          ...options,
          indent: 1,
        })
      );
    }

    // エラーの原因
    if (details.cause) {
      parts.push(
        this.formatter.keyValue('Cause', details.cause, {
          ...options,
          indent: 1,
        })
      );
    }

    // 修正提案
    if (details.suggestion) {
      parts.push(this.formatter.blank());
      parts.push(
        this.formatter.info(`Suggestion: ${details.suggestion}`, {
          ...options,
          indent: 1,
        })
      );
    }

    // コンテキスト情報
    if (details.context && Object.keys(details.context).length > 0) {
      parts.push(this.formatter.blank());
      parts.push(this.formatter.section('Context', { ...options, indent: 1 }));

      for (const [key, value] of Object.entries(details.context)) {
        parts.push(
          this.formatter.keyValue(key, String(value), {
            ...options,
            indent: 2,
          })
        );
      }
    }

    // スタックトレース（開発環境のみ）
    if (details.stack && process.env.NODE_ENV === 'development') {
      parts.push(this.formatter.blank());
      parts.push(this.formatter.section('Stack Trace', { ...options, indent: 1 }));
      parts.push(
        this.formatter.code(details.stack, undefined, {
          ...options,
          indent: 1,
        })
      );
    }

    return parts.join('\n');
  }

  /**
   * Error オブジェクトからエラー詳細を抽出してフォーマット
   */
  formatError(
    error: Error,
    suggestion?: string,
    context?: Record<string, unknown>,
    options?: OutputOptions
  ): string {
    const details: ErrorDetails = {
      message: error.message,
      suggestion,
      stack: error.stack,
      context,
    };

    return this.format(details, options);
  }

  /**
   * 検証エラーをフォーマット
   */
  formatValidationError(
    field: string,
    message: string,
    value?: unknown,
    options?: OutputOptions
  ): string {
    const details: ErrorDetails = {
      message: `Validation failed: ${field}`,
      cause: message,
      suggestion: 'Please check the input and try again',
      context: value !== undefined ? { [field]: value } : undefined,
    };

    return this.format(details, options);
  }

  /**
   * ファイルシステムエラーをフォーマット
   */
  formatFileSystemError(
    operation: string,
    path: string,
    error: Error,
    options?: OutputOptions
  ): string {
    const details: ErrorDetails = {
      message: `File system error during ${operation}`,
      cause: error.message,
      suggestion: 'Check file permissions and path existence',
      context: {
        operation,
        path,
      },
      stack: error.stack,
    };

    return this.format(details, options);
  }

  /**
   * ネットワークエラーをフォーマット
   */
  formatNetworkError(
    endpoint: string,
    error: Error,
    options?: OutputOptions
  ): string {
    const details: ErrorDetails = {
      message: 'Network request failed',
      cause: error.message,
      suggestion: 'Check network connection and endpoint availability',
      context: {
        endpoint,
      },
      stack: error.stack,
    };

    return this.format(details, options);
  }

  /**
   * コマンド実行エラーをフォーマット
   */
  formatCommandError(
    command: string,
    exitCode: number,
    stderr?: string,
    options?: OutputOptions
  ): string {
    const details: ErrorDetails = {
      message: `Command execution failed: ${command}`,
      code: `EXIT_${exitCode}`,
      cause: stderr || 'Unknown error',
      suggestion: 'Check command syntax and system requirements',
      context: {
        command,
        exitCode,
      },
    };

    return this.format(details, options);
  }
}

/**
 * デフォルトエラーフォーマッタインスタンス
 */
export const defaultErrorFormatter = new ErrorFormatter();

/**
 * 便利な関数（デフォルトエラーフォーマッタを使用）
 */
export const formatErrorDetails = (
  details: ErrorDetails,
  options?: OutputOptions
): string => defaultErrorFormatter.format(details, options);

export const formatErrorObject = (
  error: Error,
  suggestion?: string,
  context?: Record<string, unknown>,
  options?: OutputOptions
): string => defaultErrorFormatter.formatError(error, suggestion, context, options);

export const formatValidationError = (
  field: string,
  message: string,
  value?: unknown,
  options?: OutputOptions
): string => defaultErrorFormatter.formatValidationError(field, message, value, options);

export const formatFileSystemError = (
  operation: string,
  path: string,
  error: Error,
  options?: OutputOptions
): string => defaultErrorFormatter.formatFileSystemError(operation, path, error, options);

export const formatNetworkError = (
  endpoint: string,
  error: Error,
  options?: OutputOptions
): string => defaultErrorFormatter.formatNetworkError(endpoint, error, options);

export const formatCommandError = (
  command: string,
  exitCode: number,
  stderr?: string,
  options?: OutputOptions
): string =>
  defaultErrorFormatter.formatCommandError(command, exitCode, stderr, options);
