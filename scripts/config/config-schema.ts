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
 * 全体設定スキーマ
 */
export const AppConfigSchema = z.object({
  confluence: ConfluenceConfigSchema.optional(),
  jira: JiraConfigSchema.optional(),
  workflow: WorkflowConfigSchema.optional(),
  validation: ValidationConfigSchema.optional(),
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
export type AppConfig = z.infer<typeof AppConfigSchema>;
