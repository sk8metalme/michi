/**
 * Output Formatter
 * 標準出力フォーマットを提供（色付き、Markdown対応）
 */

export interface OutputOptions {
  /**
   * カラー出力を有効にするか
   * @default true
   */
  color?: boolean;

  /**
   * Markdown形式で出力するか
   * @default false
   */
  markdown?: boolean;

  /**
   * インデントレベル
   * @default 0
   */
  indent?: number;
}

/**
 * メッセージタイプ
 */
export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'step';

/**
 * ANSI カラーコード
 */
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
} as const;

/**
 * メッセージタイプに対応する絵文字とカラー
 */
const MESSAGE_FORMATS = {
  success: { emoji: '✅', color: COLORS.green },
  error: { emoji: '❌', color: COLORS.red },
  warning: { emoji: '⚠️', color: COLORS.yellow },
  info: { emoji: 'ℹ️', color: COLORS.blue },
  step: { emoji: '📋', color: COLORS.blue },
} as const;

/**
 * OutputFormatter クラス
 */
export class OutputFormatter {
  private options: Required<OutputOptions>;

  constructor(options: OutputOptions = {}) {
    this.options = {
      color: options.color ?? true,
      markdown: options.markdown ?? false,
      indent: options.indent ?? 0,
    };
  }

  /**
   * 成功メッセージを出力
   */
  success(message: string, options?: OutputOptions): string {
    return this.format('success', message, options);
  }

  /**
   * エラーメッセージを出力
   */
  error(message: string, options?: OutputOptions): string {
    return this.format('error', message, options);
  }

  /**
   * 警告メッセージを出力
   */
  warning(message: string, options?: OutputOptions): string {
    return this.format('warning', message, options);
  }

  /**
   * 情報メッセージを出力
   */
  info(message: string, options?: OutputOptions): string {
    return this.format('info', message, options);
  }

  /**
   * ステップメッセージを出力
   */
  step(stepNumber: number, message: string, options?: OutputOptions): string {
    const stepMessage = `Step ${stepNumber}: ${message}`;
    return this.format('step', stepMessage, options);
  }

  /**
   * セクションヘッダーを出力
   */
  section(title: string, options?: OutputOptions): string {
    const opts = { ...this.options, ...options };
    const indent = this.getIndent(opts.indent);

    if (opts.markdown) {
      return `${indent}## ${title}`;
    }

    const separator = '='.repeat(Math.min(title.length + 4, 60));
    return `${indent}${separator}\n${indent} ${title}\n${indent}${separator}`;
  }

  /**
   * リストアイテムを出力
   */
  listItem(content: string, options?: OutputOptions): string {
    const opts = { ...this.options, ...options };
    const indent = this.getIndent(opts.indent);

    if (opts.markdown) {
      return `${indent}- ${content}`;
    }

    return `${indent}  • ${content}`;
  }

  /**
   * キーバリューペアを出力
   */
  keyValue(key: string, value: string, options?: OutputOptions): string {
    const opts = { ...this.options, ...options };
    const indent = this.getIndent(opts.indent);

    if (opts.markdown) {
      return `${indent}**${key}**: ${value}`;
    }

    if (opts.color) {
      return `${indent}${COLORS.gray}${key}:${COLORS.reset} ${value}`;
    }

    return `${indent}${key}: ${value}`;
  }

  /**
   * コードブロックを出力
   */
  code(content: string, language?: string, options?: OutputOptions): string {
    const opts = { ...this.options, ...options };
    const indent = this.getIndent(opts.indent);

    if (opts.markdown) {
      const lang = language || '';
      return `${indent}\`\`\`${lang}\n${content}\n${indent}\`\`\``;
    }

    const lines = content.split('\n');
    const formattedLines = lines.map((line) => `${indent}  ${line}`);
    return formattedLines.join('\n');
  }

  /**
   * 空行を出力
   */
  blank(count: number = 1): string {
    return '\n'.repeat(count);
  }

  /**
   * メッセージをフォーマット
   */
  private format(
    type: MessageType,
    message: string,
    options?: OutputOptions
  ): string {
    const opts = { ...this.options, ...options };
    const indent = this.getIndent(opts.indent);
    const format = MESSAGE_FORMATS[type];

    if (opts.markdown) {
      return `${indent}${format.emoji} ${message}`;
    }

    if (opts.color) {
      return `${indent}${format.color}${format.emoji} ${message}${COLORS.reset}`;
    }

    return `${indent}${format.emoji} ${message}`;
  }

  /**
   * インデント文字列を生成
   */
  private getIndent(level: number): string {
    return '  '.repeat(level);
  }
}

/**
 * デフォルトフォーマッタインスタンス
 */
export const defaultFormatter = new OutputFormatter();

/**
 * 便利な関数（デフォルトフォーマッタを使用）
 */
export const formatSuccess = (message: string, options?: OutputOptions): string =>
  defaultFormatter.success(message, options);

export const formatError = (message: string, options?: OutputOptions): string =>
  defaultFormatter.error(message, options);

export const formatWarning = (message: string, options?: OutputOptions): string =>
  defaultFormatter.warning(message, options);

export const formatInfo = (message: string, options?: OutputOptions): string =>
  defaultFormatter.info(message, options);

export const formatStep = (
  stepNumber: number,
  message: string,
  options?: OutputOptions
): string => defaultFormatter.step(stepNumber, message, options);

export const formatSection = (title: string, options?: OutputOptions): string =>
  defaultFormatter.section(title, options);

export const formatListItem = (content: string, options?: OutputOptions): string =>
  defaultFormatter.listItem(content, options);

export const formatKeyValue = (
  key: string,
  value: string,
  options?: OutputOptions
): string => defaultFormatter.keyValue(key, value, options);

export const formatCode = (
  content: string,
  language?: string,
  options?: OutputOptions
): string => defaultFormatter.code(content, language, options);

export const formatBlank = (count?: number): string =>
  defaultFormatter.blank(count);
