/**
 * Template renderer with placeholder replacement
 * 
 * Issue #37: 環境別コピー実装
 */

import { SupportedLanguage, getDevGuidelines } from '../constants/languages.js';

export interface TemplateContext {
  LANG_CODE: SupportedLanguage;
  DEV_GUIDELINES: string;
  SPEC_DIR: string;
  AGENT_DIR: string;
  PROJECT_ID?: string;
  FEATURE_NAME?: string;
  TIMESTAMP?: string;
  // Multi-Repo specific placeholders
  PROJECT_NAME?: string;
  JIRA_KEY?: string;
  CONFLUENCE_SPACE?: string;
  CREATED_AT?: string;
}

/**
 * Create template context for rendering
 *
 * @param lang - Language code
 * @param specDir - .michi directory name (spec directory)
 * @param agentDir - Agent directory name (e.g., .cursor, .claude)
 * @returns Template context object
 */
export const createTemplateContext = (
  lang: SupportedLanguage,
  specDir: string,
  agentDir: string
): TemplateContext => ({
  LANG_CODE: lang,
  DEV_GUIDELINES: getDevGuidelines(lang),
  SPEC_DIR: specDir,
  AGENT_DIR: agentDir,
});

/**
 * Render template with placeholder replacement
 * 
 * Replaces {{KEY}} patterns with values from context
 * 
 * @param template - Template string with {{PLACEHOLDER}} patterns
 * @param context - Template context with replacement values
 * @returns Rendered template string
 * 
 * @example
 * ```typescript
 * const template = "Hello {{NAME}}, welcome to {{PLACE}}!";
 * const context = { NAME: "Alice", PLACE: "Wonderland" };
 * const result = renderTemplate(template, context);
 * // Result: "Hello Alice, welcome to Wonderland!"
 * ```
 */
export const renderTemplate = (
  template: string,
  context: TemplateContext
): string => {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
    const value = context[key as keyof TemplateContext];
    return value !== undefined ? String(value) : match;
  });
};

/**
 * Render JSON template with placeholder replacement
 * 
 * Parses the template as JSON after placeholder replacement
 * 
 * @param template - JSON template string with {{PLACEHOLDER}} patterns
 * @param context - Template context with replacement values
 * @returns Parsed JSON object
 * @throws {Error} If the rendered template is not valid JSON
 * 
 * @example
 * ```typescript
 * const template = '{"lang": "{{LANG_CODE}}", "dir": "{{SPEC_DIR}}"}';
 * const context = { LANG_CODE: "ja", SPEC_DIR: ".michi" };
 * const result = renderJsonTemplate(template, context);
 * // Result: { lang: "ja", dir: ".michi" }
 * ```
 */
export const renderJsonTemplate = <T = unknown>(
  template: string,
  context: TemplateContext
): T => {
  const rendered = renderTemplate(template, context);
  
  try {
    return JSON.parse(rendered);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Create descriptive error with context for debugging
    const debugInfo = [
      'Failed to parse rendered JSON template',
      `Original error: ${errorMessage}`,
      `Rendered output (first 500 chars): ${rendered.substring(0, 500)}${rendered.length > 500 ? '...' : ''}`,
      `Template context: LANG_CODE=${context.LANG_CODE}, SPEC_DIR=${context.SPEC_DIR}, AGENT_DIR=${context.AGENT_DIR}`
    ].join('\n');
    
    const detailedError = new Error(debugInfo);
    
    // Preserve original error stack for diagnostics
    if (errorStack) {
      detailedError.stack = `${detailedError.stack}\n\nOriginal error stack:\n${errorStack}`;
    }
    
    throw detailedError;
  }
};

/**
 * Batch render multiple templates
 * 
 * @param templates - Map of template names to template strings
 * @param context - Template context with replacement values
 * @returns Map of template names to rendered strings
 */
export const renderTemplates = (
  templates: Record<string, string>,
  context: TemplateContext
): Record<string, string> => {
  const rendered: Record<string, string> = {};
  
  for (const [name, template] of Object.entries(templates)) {
    rendered[name] = renderTemplate(template, context);
  }
  
  return rendered;
};

