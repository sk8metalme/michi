/**
 * aidlc-parser.ts のユニットテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  isAIDLCFormat,
  parseAIDLCFormat,
  parseAIDLCFile,
  getAIDLCStats,
} from '../aidlc-parser.js';

describe('aidlc-parser', () => {
  let testDir: string;
  let testFilePath: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `test-aidlc-parser-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    testFilePath = join(testDir, 'tasks.md');
  });

  afterEach(() => {
    try {
      if (testFilePath) unlinkSync(testFilePath);
      if (testDir) rmdirSync(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('isAIDLCFormat', () => {
    it('AI-DLC形式を正しく検出する', () => {
      const content = `# Implementation Tasks

## 1. セットアップ

- [ ] 1.1 プロジェクト初期化
- [ ] 1.2 依存関係インストール

## 2. 実装

- [ ] 2.1 APIエンドポイント作成
- [ ] 2.2 データベース接続
`;
      expect(isAIDLCFormat(content)).toBe(true);
    });

    it('完了済みタスクを含むAI-DLC形式を検出する', () => {
      const content = `# Tasks

## 1. Setup

- [x] 1.1 Initialize project
- [ ] 1.2 Configure settings
`;
      expect(isAIDLCFormat(content)).toBe(true);
    });

    it('Michiワークフロー形式を正しく拒否する（Phase 0:）', () => {
      const content = `# tasks.md

## Phase 0: 要件定義

### Story 0.1: 要件定義書作成

- [ ] 1.1 Something
`;
      expect(isAIDLCFormat(content)).toBe(false);
    });

    it('Michiワークフロー形式を正しく拒否する（Phase 0.1:）', () => {
      const content = `# tasks.md

## Phase 0.1: 要件定義

### Story 0.1.1: 要件定義書作成

- [ ] 1.1 Something
`;
      expect(isAIDLCFormat(content)).toBe(false);
    });

    it('Michiワークフロー形式を正しく拒否する（Phase 2:）', () => {
      const content = `# tasks.md

## Phase 2: TDD実装

### Story 2.1: 実装

- [ ] 1.1 Something
`;
      expect(isAIDLCFormat(content)).toBe(false);
    });

    it('Story構造のみを含む場合を拒否する', () => {
      const content = `# tasks.md

### Story 1.1: 要件定義書作成

- [ ] 1.1 Something
`;
      expect(isAIDLCFormat(content)).toBe(false);
    });

    it('AI-DLCパターンがない場合を拒否する', () => {
      const content = `# Implementation Tasks

## 1. セットアップ

- プロジェクト初期化
- 依存関係インストール
`;
      expect(isAIDLCFormat(content)).toBe(false);
    });

    it('空のコンテンツを拒否する', () => {
      expect(isAIDLCFormat('')).toBe(false);
    });
  });

  describe('parseAIDLCFormat', () => {
    it('タイトルを正しく抽出する', () => {
      const content = `# Implementation Tasks: Feature X

## 1. Setup

- [ ] 1.1 Task one
`;
      const doc = parseAIDLCFormat(content);
      expect(doc.title).toBe('Implementation Tasks: Feature X');
    });

    it('カテゴリを正しくパースする', () => {
      const content = `# Tasks

## 1. セットアップ

- [ ] 1.1 タスク1

## 2. 実装

- [ ] 2.1 タスク2
`;
      const doc = parseAIDLCFormat(content);
      expect(doc.categories.length).toBe(2);
      expect(doc.categories[0].id).toBe('1');
      expect(doc.categories[0].title).toBe('セットアップ');
      expect(doc.categories[1].id).toBe('2');
      expect(doc.categories[1].title).toBe('実装');
    });

    it('タスクを正しくパースする', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
- [ ] 1.2 Configure settings
- [x] 1.3 Install dependencies
`;
      const doc = parseAIDLCFormat(content);
      expect(doc.categories[0].tasks.length).toBe(3);

      const task1 = doc.categories[0].tasks[0];
      expect(task1.id).toBe('1.1');
      expect(task1.title).toBe('Initialize project');
      expect(task1.completed).toBe(false);

      const task3 = doc.categories[0].tasks[2];
      expect(task3.id).toBe('1.3');
      expect(task3.completed).toBe(true);
    });

    it('タスクの詳細行を正しくパースする', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
  - Create package.json
  - Set up TypeScript
  - Configure ESLint
`;
      const doc = parseAIDLCFormat(content);
      const task = doc.categories[0].tasks[0];
      expect(task.description.length).toBe(3);
      expect(task.description[0]).toBe('Create package.json');
      expect(task.description[1]).toBe('Set up TypeScript');
      expect(task.description[2]).toBe('Configure ESLint');
    });

    it('Requirementsタグを正しく抽出する', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
  - Create project structure
  _Requirements: REQ-001, REQ-002_
`;
      const doc = parseAIDLCFormat(content);
      const task = doc.categories[0].tasks[0];
      expect(task.requirements.length).toBe(2);
      expect(task.requirements).toContain('REQ-001');
      expect(task.requirements).toContain('REQ-002');
    });

    it('日本語の要件タグを正しく抽出する', () => {
      const content = `# Tasks

## 1. セットアップ

- [ ] 1.1 プロジェクト初期化
  - 設定ファイル作成
  _要件: R-001, R-002_
`;
      const doc = parseAIDLCFormat(content);
      const task = doc.categories[0].tasks[0];
      expect(task.requirements.length).toBe(2);
      expect(task.requirements).toContain('R-001');
    });

    it('(P)並列実行マーカーを正しく検出する', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 (P) Task can run in parallel
- [ ] 1.2 Task must run sequentially
`;
      const doc = parseAIDLCFormat(content);
      expect(doc.categories[0].tasks[0].isParallel).toBe(true);
      expect(doc.categories[0].tasks[1].isParallel).toBe(false);
    });

    it('*並列実行マーカーを正しく検出する', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1* Task can run in parallel
- [ ] 1.2 Task must run sequentially
`;
      const doc = parseAIDLCFormat(content);
      expect(doc.categories[0].tasks[0].isParallel).toBe(true);
      expect(doc.categories[0].tasks[1].isParallel).toBe(false);
    });

    it('サマリーセクションをスキップする', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Task one

---

## 要件カバレッジ

- REQ-001: 1.1
`;
      const doc = parseAIDLCFormat(content);
      expect(doc.categories.length).toBe(1);
      expect(doc.categories[0].tasks.length).toBe(1);
    });

    it('rawContentを保持する', () => {
      const content = '# Tasks\n\n- [ ] 1.1 Task';
      const doc = parseAIDLCFormat(content);
      expect(doc.rawContent).toBe(content);
    });
  });

  describe('parseAIDLCFile', () => {
    it('ファイルを正しくパースする', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const doc = parseAIDLCFile(testFilePath);
      expect(doc.title).toBe('Implementation Tasks');
      expect(doc.categories.length).toBe(1);
    });

    it('AI-DLC形式でないファイルはエラーをスローする', () => {
      const content = `# tasks.md

## Phase 0: 要件定義

### Story 0.1: タスク
`;
      writeFileSync(testFilePath, content, 'utf-8');
      expect(() => parseAIDLCFile(testFilePath)).toThrow(
        /not in AI-DLC format/,
      );
    });

    it('存在しないファイルはエラーをスローする', () => {
      const nonExistentPath = join(testDir, 'non-existent.md');
      expect(() => parseAIDLCFile(nonExistentPath)).toThrow();
    });
  });

  describe('getAIDLCStats', () => {
    it('統計情報を正しく計算する', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 (P) Task 1
  _Requirements: REQ-001_
- [x] 1.2 Task 2
- [ ] 1.3 Task 3

## 2. Implementation

- [ ] 2.1 (P) Task 4
  _Requirements: REQ-002_
- [x] 2.2 Task 5
`;
      const doc = parseAIDLCFormat(content);
      const stats = getAIDLCStats(doc);

      expect(stats.totalCategories).toBe(2);
      expect(stats.totalTasks).toBe(5);
      expect(stats.completedTasks).toBe(2);
      expect(stats.parallelTasks).toBe(2);
      expect(stats.tasksWithRequirements).toBe(2);
    });

    it('空のドキュメントで0を返す', () => {
      const doc = parseAIDLCFormat('# Empty');
      const stats = getAIDLCStats(doc);

      expect(stats.totalCategories).toBe(0);
      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.parallelTasks).toBe(0);
      expect(stats.tasksWithRequirements).toBe(0);
    });
  });
});
