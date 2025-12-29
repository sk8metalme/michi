/**
 * AIDLC (AI Development Life Cycle) パーサー
 *
 * このファイルは後方互換性のための再エクスポートです。
 * 実装は src/infrastructure/parsers/aidlc-parser.ts に移行されました。
 */

export type {
  AIDLCTask,
  AIDLCCategory,
  AIDLCSummary,
  AIDLCDocument,
} from '../../src/infrastructure/parsers/aidlc-parser.js';

export {
  parseAIDLCFormat,
  isAIDLCFormat,
  parseAIDLCFile,
  getAIDLCStats,
} from '../../src/infrastructure/parsers/aidlc-parser.js';
