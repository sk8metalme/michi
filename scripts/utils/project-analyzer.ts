/**
 * ProjectAnalyzer クラス
 * project-finder, project-detector, language-detector の統合
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import type { Result } from './types/validation.js';
import { success, failure } from './types/validation.js';

/**
 * Project detection error types
 */
export type ProjectError =
  | { type: 'FileNotFound'; path: string }
  | { type: 'InvalidJSON'; path: string; cause: string }
  | { type: 'MissingField'; field: string }
  | { type: 'Unknown'; message: string };

/**
 * Programming language types
 */
export type Language = 'nodejs' | 'java' | 'php' | 'python' | 'go' | 'rust' | 'unknown';

/**
 * Project information (from project-detector)
 */
export interface ProjectInfo {
  language: Language;
  buildTool: string;
  testFramework?: string;
  hasCI: boolean;
  hasDependencies: boolean;
  packageManager?: string;
}

/**
 * Project metadata (from project-meta)
 */
export interface ProjectMetadata {
  projectId: string;
  projectName: string;
  jiraProjectKey: string;
  confluenceLabels: string[];
  status: 'active' | 'inactive' | 'completed';
  team: string[];
  stakeholders: string[];
  repository: string;
  description?: string;
}

/**
 * ProjectAnalyzer class
 * Unified interface for project detection utilities
 */
export class ProjectAnalyzer {
  /**
   * Find project root directory
   * Searches for .git or projects/ directory
   *
   * @param startPath - Starting directory (default: process.cwd())
   * @returns Result<string, ProjectError> - Project root path or error
   */
  findProjectRoot(startPath: string = process.cwd()): Result<string, ProjectError> {
    try {
      let currentDir = resolve(startPath);
      const root = resolve('/');

      while (currentDir !== root && currentDir !== dirname(currentDir)) {
        // Check for .git directory or projects/ directory
        if (existsSync(join(currentDir, '.git')) || existsSync(join(currentDir, 'projects'))) {
          return success(currentDir);
        }

        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
          break;
        }
        currentDir = parentDir;
      }

      // If no repository root found, return starting directory
      return success(resolve(startPath));
    } catch (error) {
      return failure([{
        type: 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      }]);
    }
  }

  /**
   * Detect programming language from project files
   *
   * @param projectRoot - Project root directory (default: process.cwd())
   * @returns Result<Language, ProjectError> - Detected language or error
   */
  detectLanguage(projectRoot: string = process.cwd()): Result<Language, ProjectError> {
    try {
      // Node.js/TypeScript
      if (existsSync(join(projectRoot, 'package.json'))) {
        return success('nodejs' as Language);
      }

      // Java
      if (existsSync(join(projectRoot, 'build.gradle')) ||
          existsSync(join(projectRoot, 'build.gradle.kts')) ||
          existsSync(join(projectRoot, 'pom.xml'))) {
        return success('java' as Language);
      }

      // PHP
      if (existsSync(join(projectRoot, 'composer.json'))) {
        return success('php' as Language);
      }

      // Python
      if (existsSync(join(projectRoot, 'requirements.txt')) ||
          existsSync(join(projectRoot, 'pyproject.toml')) ||
          existsSync(join(projectRoot, 'setup.py'))) {
        return success('python' as Language);
      }

      // Go
      if (existsSync(join(projectRoot, 'go.mod'))) {
        return success('go' as Language);
      }

      // Rust
      if (existsSync(join(projectRoot, 'Cargo.toml'))) {
        return success('rust' as Language);
      }

      // Unknown
      return success('unknown' as Language);
    } catch (error) {
      return failure([{
        type: 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      }]);
    }
  }

  /**
   * Get project metadata from .kiro/project.json
   *
   * @param projectRoot - Project root directory (default: process.cwd())
   * @returns Result<ProjectMetadata, ProjectError> - Project metadata or error
   */
  getProjectMetadata(projectRoot: string = process.cwd()): Result<ProjectMetadata, ProjectError> {
    const projectJsonPath = resolve(projectRoot, '.kiro/project.json');

    if (!existsSync(projectJsonPath)) {
      return failure([{
        type: 'FileNotFound',
        path: projectJsonPath
      }]);
    }

    try {
      const content = readFileSync(projectJsonPath, 'utf-8');
      const meta = JSON.parse(content) as ProjectMetadata;

      // Validate required fields
      const requiredFields: (keyof ProjectMetadata)[] = [
        'projectId',
        'projectName',
        'jiraProjectKey',
        'confluenceLabels'
      ];

      for (const field of requiredFields) {
        if (!meta[field]) {
          return failure([{
            type: 'MissingField',
            field: String(field)
          }]);
        }
      }

      // Validate projectId against path traversal attacks
      if (!this.validateProjectId(meta.projectId)) {
        return failure([{
          type: 'Unknown',
          message: 'Invalid projectId: must contain only alphanumeric characters, hyphens, and underscores'
        }]);
      }

      return success(meta);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return failure([{
          type: 'InvalidJSON',
          path: projectJsonPath,
          cause: error.message
        }]);
      }
      return failure([{
        type: 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      }]);
    }
  }

  /**
   * Validate project ID against path traversal attacks
   * Security: Prevents malicious project IDs like "../tmp/evil"
   *
   * @param projectId - Project ID to validate
   * @returns true if valid, false otherwise
   */
  private validateProjectId(projectId: string): boolean {
    // Reject empty or whitespace-only IDs
    if (!projectId.trim() || /^\s+$/.test(projectId)) {
      return false;
    }
    // Reject path traversal attempts (.. / \)
    if (projectId.includes('..') || projectId.includes('/') || projectId.includes('\\')) {
      return false;
    }
    // Only allow alphanumeric, hyphens, and underscores
    return /^[A-Za-z0-9_-]+$/.test(projectId);
  }

  /**
   * Get comprehensive project information
   * Combines language detection with detailed project info
   *
   * @param projectRoot - Project root directory (default: process.cwd())
   * @returns Result<ProjectInfo, ProjectError> - Detailed project information or error
   */
  getProjectInfo(projectRoot: string = process.cwd()): Result<ProjectInfo, ProjectError> {
    try {
      // Node.js/TypeScript
      if (existsSync(join(projectRoot, 'package.json'))) {
        return this.detectNodeJsProject(projectRoot);
      }

      // Java
      if (existsSync(join(projectRoot, 'build.gradle')) ||
          existsSync(join(projectRoot, 'build.gradle.kts'))) {
        return this.detectJavaProject(projectRoot, 'gradle');
      }

      if (existsSync(join(projectRoot, 'pom.xml'))) {
        return this.detectJavaProject(projectRoot, 'maven');
      }

      // PHP
      if (existsSync(join(projectRoot, 'composer.json'))) {
        return this.detectPHPProject(projectRoot);
      }

      // Python
      if (existsSync(join(projectRoot, 'requirements.txt')) ||
          existsSync(join(projectRoot, 'pyproject.toml')) ||
          existsSync(join(projectRoot, 'setup.py'))) {
        return this.detectPythonProject(projectRoot);
      }

      // Go
      if (existsSync(join(projectRoot, 'go.mod'))) {
        return this.detectGoProject(projectRoot);
      }

      // Rust
      if (existsSync(join(projectRoot, 'Cargo.toml'))) {
        return this.detectRustProject(projectRoot);
      }

      // Unknown
      return success({
        language: 'unknown',
        buildTool: 'unknown',
        hasCI: existsSync(join(projectRoot, '.github/workflows')),
        hasDependencies: false
      });
    } catch (error) {
      return failure([{
        type: 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      }]);
    }
  }

  /**
   * Detect Node.js project
   */
  private detectNodeJsProject(projectRoot: string): Result<ProjectInfo, ProjectError> {
    try {
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));

      // Detect package manager
      let packageManager = 'npm';
      if (existsSync(join(projectRoot, 'pnpm-lock.yaml'))) {
        packageManager = 'pnpm';
      } else if (existsSync(join(projectRoot, 'yarn.lock'))) {
        packageManager = 'yarn';
      }

      // Detect test framework
      let testFramework: string | undefined;
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (deps['vitest']) {
        testFramework = 'vitest';
      } else if (deps['jest']) {
        testFramework = 'jest';
      } else if (deps['mocha']) {
        testFramework = 'mocha';
      }

      return success({
        language: 'nodejs',
        buildTool: packageManager,
        testFramework,
        hasCI: existsSync(join(projectRoot, '.github/workflows')),
        hasDependencies: true,
        packageManager
      });
    } catch (error) {
      return failure([{
        type: 'InvalidJSON',
        path: join(projectRoot, 'package.json'),
        cause: error instanceof Error ? error.message : String(error)
      }]);
    }
  }

  /**
   * Detect Java project
   */
  private detectJavaProject(projectRoot: string, buildTool: 'gradle' | 'maven'): Result<ProjectInfo, ProjectError> {
    return success({
      language: 'java',
      buildTool,
      testFramework: 'junit',
      hasCI: existsSync(join(projectRoot, '.github/workflows')),
      hasDependencies: true
    });
  }

  /**
   * Detect PHP project
   */
  private detectPHPProject(projectRoot: string): Result<ProjectInfo, ProjectError> {
    try {
      const composerJson = JSON.parse(readFileSync(join(projectRoot, 'composer.json'), 'utf-8'));

      // Detect test framework
      let testFramework: string | undefined;
      const deps = { ...composerJson.require, ...composerJson['require-dev'] };
      if (deps['phpunit/phpunit']) {
        testFramework = 'phpunit';
      }

      return success({
        language: 'php',
        buildTool: 'composer',
        testFramework,
        hasCI: existsSync(join(projectRoot, '.github/workflows')),
        hasDependencies: true
      });
    } catch (error) {
      return failure([{
        type: 'InvalidJSON',
        path: join(projectRoot, 'composer.json'),
        cause: error instanceof Error ? error.message : String(error)
      }]);
    }
  }

  /**
   * Detect Python project
   */
  private detectPythonProject(projectRoot: string): Result<ProjectInfo, ProjectError> {
    let buildTool = 'pip';
    let testFramework: string | undefined;

    if (existsSync(join(projectRoot, 'pyproject.toml'))) {
      buildTool = 'poetry or uv';
      const pyproject = readFileSync(join(projectRoot, 'pyproject.toml'), 'utf-8');
      if (pyproject.includes('pytest')) {
        testFramework = 'pytest';
      } else if (pyproject.includes('unittest')) {
        testFramework = 'unittest';
      }
    } else if (existsSync(join(projectRoot, 'requirements.txt'))) {
      const requirements = readFileSync(join(projectRoot, 'requirements.txt'), 'utf-8');
      if (requirements.includes('pytest')) {
        testFramework = 'pytest';
      }
    }

    return success({
      language: 'python',
      buildTool,
      testFramework,
      hasCI: existsSync(join(projectRoot, '.github/workflows')),
      hasDependencies: true
    });
  }

  /**
   * Detect Go project
   */
  private detectGoProject(projectRoot: string): Result<ProjectInfo, ProjectError> {
    return success({
      language: 'go',
      buildTool: 'go',
      testFramework: 'testing',
      hasCI: existsSync(join(projectRoot, '.github/workflows')),
      hasDependencies: true
    });
  }

  /**
   * Detect Rust project
   */
  private detectRustProject(projectRoot: string): Result<ProjectInfo, ProjectError> {
    return success({
      language: 'rust',
      buildTool: 'cargo',
      testFramework: 'cargo-test',
      hasCI: existsSync(join(projectRoot, '.github/workflows')),
      hasDependencies: true
    });
  }
}
