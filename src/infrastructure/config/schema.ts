/**
 * 設定スキーマ定義
 * Zodを使用して設定ファイルの型安全性を保証
 */

import { z } from 'zod';

/**
 * Confluence階層構造のモード
 */
export const ConfluenceHierarchyModeSchema = z.enum(['simple', 'nested']);

/**
 * Confluenceページ作成粒度
 */
export const ConfluencePageCreationGranularitySchema = z.enum([
  'single',
  'by-section',
  'by-hierarchy',
  'manual',
]);

/**
 * Confluence階層構造設定（by-hierarchyまたはmanualの場合）
 */
export const ConfluenceHierarchyStructureSchema = z.object({
  mode: ConfluenceHierarchyModeSchema.optional(),
  parentPageTitle: z.string().optional(),
  createDocTypeParents: z.boolean().optional(),
  structure: z
    .record(
      z.string(),
      z.object({
        parent: z.string().optional(),
        title: z.string().optional(),
        children: z
          .array(
            z.object({
              section: z.string(),
              title: z.string(),
            }),
          )
          .optional(),
        pages: z
          .array(
            z.object({
              title: z.string(),
              sections: z.array(z.string()),
              labels: z.array(z.string()).optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

/**
 * Confluence設定スキーマ
 */
export const ConfluenceConfigSchema = z.object({
  pageCreationGranularity:
    ConfluencePageCreationGranularitySchema.default('single'),
  pageTitleFormat: z
    .string()
    .default('[{projectName}] {featureName} {docTypeLabel}'),
  autoLabels: z
    .array(z.string())
    .default(['{projectLabel}', '{docType}', '{featureName}', 'github-sync']),
  spaces: z
    .object({
      requirements: z.string().optional(),
      design: z.string().optional(),
      tasks: z.string().optional(),
    })
    .optional(),
  hierarchy: ConfluenceHierarchyStructureSchema.optional(),
});

/**
 * JIRA Story作成粒度
 */
export const JiraStoryCreationGranularitySchema = z.enum([
  'all',
  'by-phase',
  'selected-phases',
]);

/**
 * JIRA Story Points設定
 */
export const JiraStoryPointsSchema = z.enum(['auto', 'manual', 'disabled']);

/**
 * JIRA ステータスマッピングスキーマ
 * spec-impl ワークフローで使用するステータス名
 */
export const JiraStatusMappingSchema = z.object({
  inProgress: z.string().default('In Progress'),
  readyForReview: z.string().default('Ready for Review'),
});

/**
 * JIRA設定スキーマ
 */
export const JiraConfigSchema = z.object({
  storyCreationGranularity: JiraStoryCreationGranularitySchema.default('all'),
  createEpic: z.boolean().default(true),
  storyPoints: JiraStoryPointsSchema.default('auto'),
  autoLabels: z
    .array(z.string())
    .default(['{projectLabel}', '{featureName}', '{phaseLabel}']),
  issueTypes: z
    .object({
      epic: z.string().default('Epic'),
      story: z.string().nullish().default(null), // null | undefined | string
      subtask: z.string().nullish().default(null), // null | undefined | string
    })
    .optional(),
  selectedPhases: z.array(z.string()).optional(),
  statusMapping: JiraStatusMappingSchema.optional(),
});

/**
 * ワークフロー設定スキーマ
 */
export const WorkflowConfigSchema = z.object({
  enabledPhases: z
    .array(z.string())
    .default(['requirements', 'design', 'tasks']),
  approvalGates: z
    .object({
      requirements: z.array(z.string()).optional(),
      design: z.array(z.string()).optional(),
      release: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * バリデーション設定スキーマ
 */
export const ValidationConfigSchema = z.object({
  weekdayNotation: z.boolean().default(true),
  businessDayCount: z.boolean().default(true),
  weekendExclusion: z.boolean().default(true),
});

/**
 * Atlassian設定スキーマ
 */
export const AtlassianConfigSchema = z.object({
  url: z.string().optional(),
  email: z.string().optional(),
  apiToken: z.string().optional(),
});

/**
 * プロジェクトメタデータスキーマ
 */
export const ProjectMetaSchema = z.object({
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  language: z.enum(['ja', 'en']).optional(),
  jiraProjectKey: z.string().optional(),
  confluenceLabels: z.array(z.string()).optional(),
  status: z.string().optional(),
  team: z.array(z.string()).optional(),
  stakeholders: z.array(z.string()).optional(),
  repository: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Multi-Repo リポジトリスキーマ
 */
export const RepositorySchema = z.object({
  name: z.string().min(1),
  url: z
    .string()
    .url()
    .regex(/^https:\/\/github\.com\/[^/]+\/[^/]+$/, {
      message: 'GitHub URL must be in format: https://github.com/{owner}/{repo}',
    }),
  branch: z.string().default('main'),
  localPath: z
    .string()
    .optional()
    .refine(
      (path) => {
        // localPath が指定されていない場合は検証スキップ
        if (path === undefined) return true;
        // 空文字列はエラー
        if (path === '') return false;
        // 絶対パスであることを検証（セキュリティ考慮）
        // Unix系: '/' で始まる、Windows系: 'C:\' 等で始まる
        const isUnixAbsolutePath = path.startsWith('/');
        const isWindowsAbsolutePath = /^[A-Za-z]:\\/.test(path);
        return isUnixAbsolutePath || isWindowsAbsolutePath;
      },
      {
        message:
          'localPath must be an absolute path (Unix: /path/to/repo, Windows: C:\\path\\to\\repo)',
      },
    ),
});

/**
 * Multi-Repo プロジェクトスキーマ
 */
export const MultiRepoProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Project name must be at least 1 character' })
    .max(100, { message: 'Project name must be at most 100 characters' })
    .refine(
      (name) => {
        // パストラバーサル対策: '/', '\' 禁止
        if (name.includes('/') || name.includes('\\')) {
          return false;
        }
        // 相対パス対策: '.', '..' 禁止
        if (name === '.' || name === '..') {
          return false;
        }
        // 制御文字対策: \x00-\x1F, \x7F 禁止
        // eslint-disable-next-line no-control-regex
        const controlCharRegex = /[\x00-\x1F\x7F]/;
        if (controlCharRegex.test(name)) {
          return false;
        }
        return true;
      },
      {
        message:
          'Project name must not contain path traversal characters (/, \\), relative path components (., ..), or control characters',
      },
    ),
  jiraKey: z
    .string()
    .min(1)
    .regex(/^[A-Z]{2,10}$/, {
      message: 'JIRA key must be 2-10 uppercase letters',
    }),
  confluenceSpace: z.string().min(1, {
    message: 'Confluence space must be a non-empty string',
  }),
  createdAt: z.string().datetime({
    offset: true,
    message: 'createdAt must be in ISO 8601 format',
  }),
  repositories: z.array(RepositorySchema).default([]),
});

/**
 * 全体設定スキーマ
 */
export const AppConfigSchema = z.object({
  confluence: ConfluenceConfigSchema.optional(),
  jira: JiraConfigSchema.optional(),
  workflow: WorkflowConfigSchema.optional(),
  validation: ValidationConfigSchema.optional(),
  atlassian: AtlassianConfigSchema.optional(),
  project: ProjectMetaSchema.optional(),
  multiRepoProjects: z.array(MultiRepoProjectSchema).default([]),
});

/**
 * 設定の型定義
 */
export type ConfluenceHierarchyMode = z.infer<
  typeof ConfluenceHierarchyModeSchema
>;
export type ConfluencePageCreationGranularity = z.infer<
  typeof ConfluencePageCreationGranularitySchema
>;
export type ConfluenceHierarchyStructure = z.infer<
  typeof ConfluenceHierarchyStructureSchema
>;
export type ConfluenceConfig = z.infer<typeof ConfluenceConfigSchema>;
export type JiraStoryCreationGranularity = z.infer<
  typeof JiraStoryCreationGranularitySchema
>;
export type JiraStoryPoints = z.infer<typeof JiraStoryPointsSchema>;
export type JiraStatusMapping = z.infer<typeof JiraStatusMappingSchema>;
export type JiraConfig = z.infer<typeof JiraConfigSchema>;
export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
export type ValidationConfig = z.infer<typeof ValidationConfigSchema>;
export type AtlassianConfig = z.infer<typeof AtlassianConfigSchema>;
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;
export type Repository = z.infer<typeof RepositorySchema>;
export type MultiRepoProject = z.infer<typeof MultiRepoProjectSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * 設定の読み込み元
 */
export type ConfigSource =
  | 'default'        // default-config.json
  | 'global-env'     // ~/.michi/.env
  | 'global-config'  // ~/.michi/config.json
  | 'project-meta'   // .michi/project.json
  | 'project-config' // .michi/config.json
  | 'project-env';   // .env
