import { describe, it, expect } from 'vitest';
import {
  ENV_CONFIG,
  getEnvironmentConfig,
  isSupportedEnvironment,
  getSupportedEnvironments,
  type Environment,
  type EnvironmentConfig,
} from '../environments.js';

describe('environments', () => {
  describe('ENV_CONFIG', () => {
    it('should have entries for all environments', () => {
      expect(ENV_CONFIG.claude).toBeDefined();
      expect(ENV_CONFIG['claude-agent']).toBeDefined();
    });

    it('should have correct structure for claude', () => {
      const config = ENV_CONFIG.claude;
      expect(config.rulesDir).toBe('.claude/rules');
      expect(config.commandsDir).toBe('.claude/commands');
      expect(config.templateSource).toBe('claude');
    });

    it('should have correct structure for claude-agent', () => {
      const config = ENV_CONFIG['claude-agent'];
      expect(config.rulesDir).toBe('.claude/agents');
      expect(config.commandsDir).toBe('.claude/commands');
      expect(config.templateSource).toBe('claude-agent');
    });

    it('should have all required properties for each environment', () => {
      for (const env of Object.keys(ENV_CONFIG) as Environment[]) {
        const config = ENV_CONFIG[env];
        expect(config).toHaveProperty('rulesDir');
        expect(config).toHaveProperty('commandsDir');
        expect(config).toHaveProperty('templateSource');
        expect(typeof config.rulesDir).toBe('string');
        expect(typeof config.commandsDir).toBe('string');
        expect(typeof config.templateSource).toBe('string');
      }
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return config for valid environment', () => {
      const config = getEnvironmentConfig('claude');
      expect(config).toBe(ENV_CONFIG.claude);
    });

    it('should return config for all supported environments', () => {
      const environments: Environment[] = ['claude', 'claude-agent'];
      for (const env of environments) {
        const config = getEnvironmentConfig(env);
        expect(config).toBeDefined();
        expect(config).toBe(ENV_CONFIG[env]);
      }
    });
  });

  describe('isSupportedEnvironment', () => {
    it('should return true for supported environments', () => {
      expect(isSupportedEnvironment('claude')).toBe(true);
      expect(isSupportedEnvironment('claude-agent')).toBe(true);
    });

    it('should return false for unsupported environments', () => {
      expect(isSupportedEnvironment('invalid')).toBe(false);
      expect(isSupportedEnvironment('vscode')).toBe(false);
      expect(isSupportedEnvironment('')).toBe(false);
      expect(isSupportedEnvironment('cursor')).toBe(false);
      expect(isSupportedEnvironment('gemini')).toBe(false);
      expect(isSupportedEnvironment('codex')).toBe(false);
      expect(isSupportedEnvironment('cline')).toBe(false);
    });

    it('should work as type guard', () => {
      const env: string = 'claude';
      if (isSupportedEnvironment(env)) {
        // TypeScript should recognize env as Environment here
        const config: EnvironmentConfig = ENV_CONFIG[env];
        expect(config).toBeDefined();
      }
    });
  });

  describe('getSupportedEnvironments', () => {
    it('should return all supported environments', () => {
      const environments = getSupportedEnvironments();
      expect(environments).toHaveLength(2);
      expect(environments).toContain('claude');
      expect(environments).toContain('claude-agent');
    });

    it('should return array with correct type', () => {
      const environments = getSupportedEnvironments();
      expect(Array.isArray(environments)).toBe(true);
      environments.forEach((env) => {
        expect(isSupportedEnvironment(env)).toBe(true);
      });
    });
  });
});
