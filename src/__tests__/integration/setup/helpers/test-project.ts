/**
 * Test helper for creating temporary test projects
 */

import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

export interface TestProjectOptions {
  /** Project name (used for directory name) */
  name?: string;
  /** Initialize as Git repository */
  initGit?: boolean;
  /** Create .git/config file */
  createGitConfig?: boolean;
}

export class TestProject {
  public readonly path: string;
  private readonly cleanup: boolean;

  constructor(options: TestProjectOptions = {}) {
    const name = options.name || `test-project-${Date.now()}`;
    this.path = join(tmpdir(), name);
    this.cleanup = true;

    // Create project directory
    if (existsSync(this.path)) {
      rmSync(this.path, { recursive: true, force: true });
    }
    mkdirSync(this.path, { recursive: true });

    // Initialize Git repository if requested
    if (options.initGit !== false) {
      try {
        execSync('git init', { cwd: this.path, stdio: 'ignore' });
        
        if (options.createGitConfig !== false) {
          // Create minimal git config
          execSync('git config user.name "Test User"', { cwd: this.path, stdio: 'ignore' });
          execSync('git config user.email "test@example.com"', { cwd: this.path, stdio: 'ignore' });
          
          // Create a dummy remote URL
          const remoteUrl = 'https://github.com/test-org/test-repo.git';
          execSync(`git remote add origin ${remoteUrl}`, { cwd: this.path, stdio: 'ignore' });
        }
      } catch (error) {
        console.warn('Failed to initialize git repository:', error);
      }
    }
  }

  /**
   * Create a file in the test project
   */
  writeFile(relativePath: string, content: string): void {
    const filePath = join(this.path, relativePath);
    const dir = join(filePath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Check if a file exists in the test project
   */
  hasFile(relativePath: string): boolean {
    return existsSync(join(this.path, relativePath));
  }

  /**
   * Check if a directory exists in the test project
   */
  hasDirectory(relativePath: string): boolean {
    const fullPath = join(this.path, relativePath);
    return existsSync(fullPath);
  }

  /**
   * Clean up the test project
   */
  destroy(): void {
    if (this.cleanup && existsSync(this.path)) {
      try {
        rmSync(this.path, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to clean up test project at ${this.path}:`, error);
      }
    }
  }
}

/**
 * Create a test project for use in tests
 * Automatically cleaned up after test
 */
export function createTestProject(options: TestProjectOptions = {}): TestProject {
  return new TestProject(options);
}

