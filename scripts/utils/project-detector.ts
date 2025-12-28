/**
 * プロジェクト検出ユーティリティ
 * 既存ファイルからプロジェクト情報を自動検出
 */

import { existsSync } from 'fs';
import { safeReadFileOrThrow } from './safe-file-reader.js';

export interface ProjectInfo {
  language: 'nodejs' | 'java' | 'php' | 'python' | 'go' | 'rust' | 'other';
  buildTool: string;
  testFramework?: string;
  hasCI: boolean;
  hasDependencies: boolean;
  packageManager?: string;
}

/**
 * プロジェクト情報を自動検出
 */
export function detectProject(projectRoot: string = process.cwd()): ProjectInfo {
  // Node.js/TypeScript
  if (existsSync(`${projectRoot}/package.json`)) {
    return detectNodeJsProject(projectRoot);
  }
  
  // Java
  if (existsSync(`${projectRoot}/build.gradle`) || existsSync(`${projectRoot}/build.gradle.kts`)) {
    return detectJavaProject(projectRoot, 'gradle');
  }
  
  if (existsSync(`${projectRoot}/pom.xml`)) {
    return detectJavaProject(projectRoot, 'maven');
  }
  
  // PHP
  if (existsSync(`${projectRoot}/composer.json`)) {
    return detectPHPProject(projectRoot);
  }
  
  // Python
  if (existsSync(`${projectRoot}/requirements.txt`) || 
      existsSync(`${projectRoot}/pyproject.toml`) ||
      existsSync(`${projectRoot}/setup.py`)) {
    return detectPythonProject(projectRoot);
  }
  
  // Go
  if (existsSync(`${projectRoot}/go.mod`)) {
    return detectGoProject(projectRoot);
  }
  
  // Rust
  if (existsSync(`${projectRoot}/Cargo.toml`)) {
    return detectRustProject(projectRoot);
  }
  
  // 検出できない場合
  return {
    language: 'other',
    buildTool: 'unknown',
    hasCI: existsSync(`${projectRoot}/.github/workflows`),
    hasDependencies: false
  };
}

/**
 * Node.jsプロジェクトを検出
 */
function detectNodeJsProject(projectRoot: string): ProjectInfo {
  const packageJson = JSON.parse(safeReadFileOrThrow(`${projectRoot}/package.json`, 'utf-8'));
  
  // パッケージマネージャーを検出
  let packageManager = 'npm';
  if (existsSync(`${projectRoot}/pnpm-lock.yaml`)) {
    packageManager = 'pnpm';
  } else if (existsSync(`${projectRoot}/yarn.lock`)) {
    packageManager = 'yarn';
  }
  
  // テストフレームワークを検出
  let testFramework: string | undefined;
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  if (deps['vitest']) {
    testFramework = 'vitest';
  } else if (deps['jest']) {
    testFramework = 'jest';
  } else if (deps['mocha']) {
    testFramework = 'mocha';
  }
  
  return {
    language: 'nodejs',
    buildTool: packageManager,
    testFramework,
    hasCI: existsSync(`${projectRoot}/.github/workflows`),
    hasDependencies: true,
    packageManager
  };
}

/**
 * Javaプロジェクトを検出
 */
function detectJavaProject(projectRoot: string, buildTool: 'gradle' | 'maven'): ProjectInfo {
  return {
    language: 'java',
    buildTool,
    testFramework: 'junit',
    hasCI: existsSync(`${projectRoot}/.github/workflows`),
    hasDependencies: true
  };
}

/**
 * PHPプロジェクトを検出
 */
function detectPHPProject(projectRoot: string): ProjectInfo {
  const composerJson = JSON.parse(safeReadFileOrThrow(`${projectRoot}/composer.json`, 'utf-8'));
  
  // テストフレームワークを検出
  let testFramework: string | undefined;
  const deps = { ...composerJson.require, ...composerJson['require-dev'] };
  if (deps['phpunit/phpunit']) {
    testFramework = 'phpunit';
  }
  
  return {
    language: 'php',
    buildTool: 'composer',
    testFramework,
    hasCI: existsSync(`${projectRoot}/.github/workflows`),
    hasDependencies: true
  };
}

/**
 * Pythonプロジェクトを検出
 */
function detectPythonProject(projectRoot: string): ProjectInfo {
  let buildTool = 'pip';
  let testFramework: string | undefined;
  
  if (existsSync(`${projectRoot}/pyproject.toml`)) {
    buildTool = 'poetry or uv';
    const pyproject = safeReadFileOrThrow(`${projectRoot}/pyproject.toml`, 'utf-8');
    if (pyproject.includes('pytest')) {
      testFramework = 'pytest';
    } else if (pyproject.includes('unittest')) {
      testFramework = 'unittest';
    }
  } else if (existsSync(`${projectRoot}/requirements.txt`)) {
    const requirements = safeReadFileOrThrow(`${projectRoot}/requirements.txt`, 'utf-8');
    if (requirements.includes('pytest')) {
      testFramework = 'pytest';
    }
  }
  
  return {
    language: 'python',
    buildTool,
    testFramework,
    hasCI: existsSync(`${projectRoot}/.github/workflows`),
    hasDependencies: true
  };
}

/**
 * Goプロジェクトを検出
 */
function detectGoProject(projectRoot: string): ProjectInfo {
  return {
    language: 'go',
    buildTool: 'go',
    testFramework: 'testing',
    hasCI: existsSync(`${projectRoot}/.github/workflows`),
    hasDependencies: true
  };
}

/**
 * Rustプロジェクトを検出
 */
function detectRustProject(projectRoot: string): ProjectInfo {
  return {
    language: 'rust',
    buildTool: 'cargo',
    testFramework: 'cargo-test',
    hasCI: existsSync(`${projectRoot}/.github/workflows`),
    hasDependencies: true
  };
}

