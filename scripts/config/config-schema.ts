/**
 * 設定スキーマ定義
 *
 * このファイルは後方互換性のための再エクスポートです。
 * 実装は src/infrastructure/config/schema.ts に移行されました。
 */

export {
  // Schemas
  ConfluenceHierarchyModeSchema,
  ConfluencePageCreationGranularitySchema,
  ConfluenceHierarchyStructureSchema,
  ConfluenceConfigSchema,
  JiraStoryCreationGranularitySchema,
  JiraStoryPointsSchema,
  JiraStatusMappingSchema,
  JiraConfigSchema,
  WorkflowConfigSchema,
  ValidationConfigSchema,
  AtlassianConfigSchema,
  ProjectMetaSchema,
  RepositorySchema,
  MultiRepoProjectSchema,
  AppConfigSchema,
} from '../../src/infrastructure/config/schema.js';

export type {
  // Types
  ConfluenceHierarchyMode,
  ConfluencePageCreationGranularity,
  ConfluenceHierarchyStructure,
  ConfluenceConfig,
  JiraStoryCreationGranularity,
  JiraStoryPoints,
  JiraStatusMapping,
  JiraConfig,
  WorkflowConfig,
  ValidationConfig,
  AtlassianConfig,
  ProjectMeta,
  Repository,
  MultiRepoProject,
  AppConfig,
  ConfigSource,
} from '../../src/infrastructure/config/schema.js';
