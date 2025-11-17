/**
 * Environment configuration mapping for cc-sdd environments
 * 
 * Issue #37: 環境別コピー実装
 */

export interface EnvironmentConfig {
  rulesDir: string;
  commandsDir: string;
  templateSource: string;
}

export type Environment = 'claude' | 'claude-agent' | 'cursor';

export const ENV_CONFIG: Record<Environment, EnvironmentConfig> = {
  'claude': {
    rulesDir: '.claude/rules',
    commandsDir: '.claude/commands/kiro',
    templateSource: 'claude'
  },
  'claude-agent': {
    rulesDir: '.claude/subagents',
    commandsDir: '.claude/commands/kiro',
    templateSource: 'claude-agent'
  },
  'cursor': {
    rulesDir: '.cursor/rules',
    commandsDir: '.cursor/commands/kiro',
    templateSource: 'cursor'
  }
};

/**
 * Get environment configuration
 * 
 * @param env - Environment name
 * @returns Environment configuration
 */
export const getEnvironmentConfig = (env: Environment): EnvironmentConfig => {
  return ENV_CONFIG[env];
};

/**
 * Validate if an environment is supported
 * 
 * @param env - Environment name to validate
 * @returns True if supported, false otherwise
 */
export const isSupportedEnvironment = (env: string): env is Environment => {
  return env in ENV_CONFIG;
};

/**
 * Get all supported environments
 * 
 * @returns Array of supported environment names
 */
export const getSupportedEnvironments = (): Environment[] => {
  return Object.keys(ENV_CONFIG) as Environment[];
};

