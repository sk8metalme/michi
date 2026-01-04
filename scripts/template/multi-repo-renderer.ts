/**
 * Multi-Repo template renderer
 *
 * Provides template rendering functionality for Multi-Repo projects
 */

import { safeReadFileOrThrow } from '../utils/safe-file-reader.js';
import { resolve, relative, isAbsolute, dirname } from 'path';
import { fileURLToPath } from 'url';
import { renderTemplate, type TemplateContext } from './renderer.js';

// Resolve Michi package root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MICHI_PACKAGE_ROOT = resolve(__dirname, '..', '..');

export interface MultiRepoTemplateContext {
  PROJECT_NAME: string;
  JIRA_KEY: string;
  CONFLUENCE_SPACE: string;
  CREATED_AT: string;
}

/**
 * Create Multi-Repo template context
 *
 * @param projectName - Project name
 * @param jiraKey - JIRA project key
 * @param confluenceSpace - Confluence space key
 * @param createdAt - Created timestamp (ISO 8601 format)
 * @returns Multi-Repo template context
 */
export const createMultiRepoTemplateContext = (
  projectName: string,
  jiraKey: string,
  confluenceSpace: string,
  createdAt?: string
): MultiRepoTemplateContext => ({
  PROJECT_NAME: projectName,
  JIRA_KEY: jiraKey,
  CONFLUENCE_SPACE: confluenceSpace,
  CREATED_AT: createdAt || new Date().toISOString(),
});

/**
 * Load Multi-Repo template file
 *
 * Security: Path traversal prevention with three-layer validation:
 * 1. Validate template name (no path separators)
 * 2. Resolve absolute paths
 * 3. Verify path containment
 *
 * @param templateName - Template name (e.g., "overview/requirements", "steering/multi-repo")
 * @param projectRoot - Project root directory
 * @returns Template content
 * @throws {Error} If template file not found or path traversal detected
 */
export const loadMultiRepoTemplate = (
  templateName: string,
  _projectRoot: string = process.cwd()
): string => {
  // Security Layer 1: Validate template name
  // Reject path traversal characters (../, ..\, absolute paths)
  if (templateName.includes('..') || templateName.includes('\\')) {
    throw new Error(
      `Invalid template name: ${templateName}\n` +
      'Template name must not contain path traversal characters (\\, ..)'
    );
  }

  // Security Layer 2: Resolve absolute paths
  const templateDir = resolve(MICHI_PACKAGE_ROOT, 'templates', 'multi-repo');
  const templatePath = resolve(templateDir, `${templateName}.md`);

  // Security Layer 3: Verify path containment
  const relativePath = relative(templateDir, templatePath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(
      `Invalid template path: ${templateName}\n` +
      `Template path is outside template directory: ${templateDir}`
    );
  }

  try {
    return safeReadFileOrThrow(templatePath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Multi-Repo template not found: ${templateName}.md\n` +
      `Path: ${templatePath}\n` +
      `Error: ${errorMessage}`
    );
  }
};

/**
 * Render Multi-Repo template with placeholder replacement
 *
 * @param template - Template string
 * @param context - Multi-Repo template context
 * @returns Rendered template string
 */
export const renderMultiRepoTemplate = (
  template: string,
  context: MultiRepoTemplateContext
): string => {
  // Convert MultiRepoTemplateContext to TemplateContext
  const templateContext: TemplateContext = {
    LANG_CODE: 'ja', // Default language
    DEV_GUIDELINES: '', // Not used for Multi-Repo templates
    SPEC_DIR: '.michi',
    AGENT_DIR: '.claude',
    PROJECT_NAME: context.PROJECT_NAME,
    JIRA_KEY: context.JIRA_KEY,
    CONFLUENCE_SPACE: context.CONFLUENCE_SPACE,
    CREATED_AT: context.CREATED_AT,
  };

  return renderTemplate(template, templateContext);
};

/**
 * Load and render Multi-Repo template
 *
 * @param templateName - Template name
 * @param context - Multi-Repo template context
 * @param projectRoot - Project root directory
 * @returns Rendered template string
 */
export const loadAndRenderMultiRepoTemplate = (
  templateName: string,
  context: MultiRepoTemplateContext,
  projectRoot: string = process.cwd()
): string => {
  const template = loadMultiRepoTemplate(templateName, projectRoot);
  return renderMultiRepoTemplate(template, context);
};

/**
 * Batch render multiple Multi-Repo templates
 *
 * @param templateNames - Array of template names
 * @param context - Multi-Repo template context
 * @param projectRoot - Project root directory
 * @returns Map of template names to rendered strings
 */
export const renderMultiRepoTemplates = (
  templateNames: string[],
  context: MultiRepoTemplateContext,
  projectRoot: string = process.cwd()
): Record<string, string> => {
  const rendered: Record<string, string> = {};

  for (const templateName of templateNames) {
    rendered[templateName] = loadAndRenderMultiRepoTemplate(
      templateName,
      context,
      projectRoot
    );
  }

  return rendered;
};

/**
 * List of all Multi-Repo template names
 */
export const MULTI_REPO_TEMPLATES = [
  'overview/requirements',
  'overview/architecture',
  'overview/sequence',
  'steering/multi-repo',
  'tests/strategy',
  'docs/ci-status',
  'docs/release-notes',
] as const;

export type MultiRepoTemplateName = typeof MULTI_REPO_TEMPLATES[number];
