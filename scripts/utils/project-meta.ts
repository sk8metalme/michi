/**
 * プロジェクトメタデータ読み込みユーティリティ
 *
 * このファイルは後方互換性のための再エクスポートです。
 * 実装は src/infrastructure/filesystem/project-meta.ts に移行されました。
 */

export type { ProjectMetadata } from '../../src/infrastructure/filesystem/project-meta.js';
export {
  loadProjectMeta,
  formatProjectInfo,
  getRepositoryInfo,
} from '../../src/infrastructure/filesystem/project-meta.js';
