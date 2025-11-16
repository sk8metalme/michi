/**
 * File system assertion helpers for tests
 */

import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'vitest';

/**
 * Assert that a file exists
 */
export function assertFileExists(filePath: string, message?: string): void {
  expect(
    existsSync(filePath),
    message || `Expected file to exist: ${filePath}`
  ).toBe(true);
}

/**
 * Assert that a file does not exist
 */
export function assertFileNotExists(filePath: string, message?: string): void {
  expect(
    existsSync(filePath),
    message || `Expected file to not exist: ${filePath}`
  ).toBe(false);
}

/**
 * Assert that a directory exists
 */
export function assertDirectoryExists(dirPath: string, message?: string): void {
  const exists = existsSync(dirPath);
  expect(exists, message || `Expected directory to exist: ${dirPath}`).toBe(true);
  
  if (exists) {
    const stats = statSync(dirPath);
    expect(
      stats.isDirectory(),
      `Expected ${dirPath} to be a directory`
    ).toBe(true);
  }
}

/**
 * Assert that a directory does not exist
 */
export function assertDirectoryNotExists(dirPath: string, message?: string): void {
  expect(
    existsSync(dirPath),
    message || `Expected directory to not exist: ${dirPath}`
  ).toBe(false);
}

/**
 * Assert that a directory contains specific files
 */
export function assertDirectoryContains(
  dirPath: string,
  expectedFiles: string[],
  message?: string
): void {
  assertDirectoryExists(dirPath);
  
  const files = readdirSync(dirPath);
  const missingFiles = expectedFiles.filter(f => !files.includes(f));
  
  expect(
    missingFiles,
    message || `Expected directory ${dirPath} to contain files: ${expectedFiles.join(', ')}`
  ).toEqual([]);
}

/**
 * Assert that a file contains specific content
 */
export function assertFileContains(
  filePath: string,
  expectedContent: string | RegExp,
  message?: string
): void {
  assertFileExists(filePath);
  
  const content = readFileSync(filePath, 'utf-8');
  
  if (typeof expectedContent === 'string') {
    expect(
      content.includes(expectedContent),
      message || `Expected file ${filePath} to contain: ${expectedContent}`
    ).toBe(true);
  } else {
    expect(
      expectedContent.test(content),
      message || `Expected file ${filePath} to match pattern: ${expectedContent}`
    ).toBe(true);
  }
}

/**
 * Assert directory structure matches expected structure
 */
export function assertDirectoryStructure(
  basePath: string,
  expectedStructure: Record<string, 'file' | 'dir'>
): void {
  for (const [path, type] of Object.entries(expectedStructure)) {
    const fullPath = join(basePath, path);
    
    if (type === 'file') {
      assertFileExists(fullPath, `Expected file at ${path}`);
    } else if (type === 'dir') {
      assertDirectoryExists(fullPath, `Expected directory at ${path}`);
    }
  }
}

