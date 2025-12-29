/**
 * Markdownパーサー
 *
 * このファイルは後方互換性のための再エクスポートです。
 * 実装は src/infrastructure/parsers/markdown-parser.ts に移行されました。
 */

export type {
  Requirement,
  Component,
  Method,
  Parameter,
  Flow,
} from '../../src/infrastructure/parsers/markdown-parser.js';

export {
  extractSection,
  extractRequirements,
  extractComponents,
  extractFlows,
} from '../../src/infrastructure/parsers/markdown-parser.js';
