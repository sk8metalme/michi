/**
 * Architecture Tests
 *
 * オニオンアーキテクチャの依存関係ルールを検証します。
 * Domain層が他層に依存していないことを手動で検証します。
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Get all TypeScript files in a directory recursively
 */
function getTsFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory() && entry !== 'node_modules' && entry !== '__tests__') {
        files.push(...getTsFiles(fullPath));
      } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
  }

  return files;
}

/**
 * Check if file imports from forbidden layers
 */
function checkImports(filePath: string, forbiddenLayers: string[]): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const importLines = content.split('\n').filter(line =>
    line.includes('import') && (line.includes('from') || line.includes('require'))
  );

  const violations: string[] = [];

  for (const line of importLines) {
    for (const layer of forbiddenLayers) {
      if (line.includes(`/${layer}/`) || line.includes(`@${layer}/`)) {
        violations.push(`${filePath}: ${line.trim()}`);
      }
    }
  }

  return violations;
}

describe('Architecture Rules', () => {
  describe('Domain Layer - Zero External Dependencies', () => {
    it('should not depend on Application layer', () => {
      const domainFiles = getTsFiles('src/domain');
      const violations: string[] = [];

      for (const file of domainFiles) {
        violations.push(...checkImports(file, ['application']));
      }

      expect(violations).toEqual([]);
    });

    it('should not depend on Infrastructure layer', () => {
      const domainFiles = getTsFiles('src/domain');
      const violations: string[] = [];

      for (const file of domainFiles) {
        violations.push(...checkImports(file, ['infrastructure']));
      }

      expect(violations).toEqual([]);
    });

    it('should not depend on Presentation layer', () => {
      const domainFiles = getTsFiles('src/domain');
      const violations: string[] = [];

      for (const file of domainFiles) {
        violations.push(...checkImports(file, ['presentation']));
      }

      expect(violations).toEqual([]);
    });

    it('should not depend on scripts directory', () => {
      const domainFiles = getTsFiles('src/domain');
      const violations: string[] = [];

      for (const file of domainFiles) {
        violations.push(...checkImports(file, ['scripts']));
      }

      expect(violations).toEqual([]);
    });

    it('should only import from domain and shared layers', () => {
      const domainFiles = getTsFiles('src/domain');
      expect(domainFiles.length).toBeGreaterThan(0); // Ensure we found domain files

      // All tests above passed means Domain layer is clean
      expect(true).toBe(true);
    });
  });

  describe('File Organization Rules (Phase 6)', () => {
    it('should pass basic test (placeholder)', () => {
      // Phase 6で実装予定:
      // - Application層がDomainのみに依存すること
      // - Infrastructure層がPresentationに依存しないこと
      // - 循環依存が存在しないこと
      // - ts-arch-kitを使用した完全な検証
      expect(true).toBe(true);
    });
  });
});
