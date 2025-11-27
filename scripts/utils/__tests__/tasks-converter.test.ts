/**
 * tasks-converter.ts のユニットテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  writeFileSync,
  unlinkSync,
  mkdirSync,
  rmdirSync,
  readFileSync,
  existsSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseAIDLCFormat } from '../aidlc-parser.js';
import { convertToMichiFormat, convertTasksFile } from '../tasks-converter.js';

describe('tasks-converter', () => {
  let testDir: string;
  let testFilePath: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `test-tasks-converter-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    testFilePath = join(testDir, 'tasks.md');
  });

  afterEach(() => {
    try {
      // Clean up all files in testDir
      const files = ['tasks.md', 'tasks.md.aidlc-backup', 'output.md'];
      files.forEach((file) => {
        const path = join(testDir, file);
        if (existsSync(path)) unlinkSync(path);
      });
      if (testDir) rmdirSync(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('convertToMichiFormat', () => {
    it('基本的な変換が成功する', () => {
      const content = `# Implementation Tasks: Test Feature

## 1. セットアップ

- [ ] 1.1 プロジェクト初期化
  - package.json作成
  - TypeScript設定

## 2. 実装

- [ ] 2.1 APIエンドポイント作成
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { projectName: 'test-feature' });

      expect(result.success).toBe(true);
      expect(result.convertedContent).toContain('# タスク分割: test-feature');
      expect(result.convertedContent).toContain('## Phase 0.1:');
      expect(result.convertedContent).toContain('## Phase 0.2:');
      expect(result.stats.originalCategories).toBe(2);
      expect(result.stats.originalTasks).toBe(2);
    });

    it('セットアップカテゴリがPhase 1にマッピングされる', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { language: 'en' });

      expect(result.convertedContent).toContain('## Phase 1:');
      expect(result.convertedContent).toContain('Environment Setup');
    });

    it('実装カテゴリがPhase 2にマッピングされる', () => {
      const content = `# Tasks

## 1. Implementation Layer

- [ ] 1.1 Create API endpoint
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { language: 'en' });

      expect(result.convertedContent).toContain('## Phase 2:');
      expect(result.convertedContent).toContain('TDD Implementation');
    });

    it('テストカテゴリがPhase 3にマッピングされる', () => {
      const content = `# Tasks

## 1. Testing

- [ ] 1.1 Write unit tests
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { language: 'en' });

      expect(result.convertedContent).toContain('## Phase 3:');
      expect(result.convertedContent).toContain('Additional QA');
    });

    it('リリースカテゴリがPhase 5にマッピングされる', () => {
      const content = `# Tasks

## 1. Release

- [ ] 1.1 Deploy to production
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { language: 'en' });

      expect(result.convertedContent).toContain('## Phase 5:');
      expect(result.convertedContent).toContain('Release');
    });

    it('Storyヘッダーが正しく生成される', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
- [ ] 1.2 Configure settings
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc);

      expect(result.convertedContent).toContain('### Story 1.1:');
      expect(result.convertedContent).toContain('### Story 1.2:');
    });

    it('タスクの詳細がStoryに含まれる', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
  - Create package.json
  - Set up TypeScript
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc);

      expect(result.convertedContent).toContain('Create package.json');
      expect(result.convertedContent).toContain('Set up TypeScript');
    });

    it('要件が受け入れ基準に含まれる', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
  _Requirements: REQ-001, REQ-002_
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc);

      expect(result.convertedContent).toContain('REQ-001');
      expect(result.convertedContent).toContain('REQ-002');
    });

    it('並列実行マーカーが保持される', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 (P) Task can run in parallel
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc);

      expect(result.convertedContent).toContain('並列実行');
    });

    it('英語出力オプションが機能する', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { language: 'en' });

      expect(result.convertedContent).toContain('# Task Breakdown:');
      expect(result.convertedContent).toContain('## Project Information');
      expect(result.convertedContent).toContain('**Assignee**');
      expect(result.convertedContent).toContain('**Effort**');
      expect(result.convertedContent).toContain('person-days');
    });

    it('日本語出力オプションが機能する', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { language: 'ja' });

      expect(result.convertedContent).toContain('# タスク分割:');
      expect(result.convertedContent).toContain('## プロジェクト情報');
      expect(result.convertedContent).toContain('**担当**');
      expect(result.convertedContent).toContain('**工数**');
      expect(result.convertedContent).toContain('人日');
    });

    it('開始日オプションが機能する', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { startDate: '2025-01-15' });

      expect(result.convertedContent).toContain('2025-01-15');
    });

    it('Phase 4と5のプレースホルダーが追加される', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc);

      expect(result.convertedContent).toContain('## Phase 4:');
      expect(result.convertedContent).toContain('## Phase 5:');
    });

    it('見積もりサマリーが生成される', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Task 1
- [ ] 1.2 Task 2

## 2. Implementation

- [ ] 2.1 Task 3
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc);

      expect(result.convertedContent).toContain('見積もりサマリー');
      expect(result.convertedContent).toContain('| フェーズ |');
    });

    it('変換元情報が含まれる', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Task 1
- [ ] 1.2 Task 2
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc);

      expect(result.convertedContent).toContain('AI-DLC形式から自動変換');
      expect(result.convertedContent).toContain('元のカテゴリ数: 1');
      expect(result.convertedContent).toContain('元のタスク数: 2');
    });

    it('変換結果に曜日表記が含まれる', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, {
        startDate: '2025-11-26', // 水曜日
      });

      // 曜日表記が含まれる
      expect(result.convertedContent).toMatch(/（[月火水木金]）/);
      // 土日表記が含まれる
      expect(result.convertedContent).toContain('土日');
    });

    it('開始日の曜日が正しく反映される（水曜開始）', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, {
        startDate: '2025-11-26', // 水曜日
      });

      // Day 1 が水曜日
      expect(result.convertedContent).toContain('2025-11-26（水）');
    });

    it('開始日の曜日が正しく反映される（月曜開始）', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, {
        startDate: '2025-11-24', // 月曜日
      });

      // Day 1 が月曜日
      expect(result.convertedContent).toContain('2025-11-24（月）');
    });

    it('土日・祝日除外の注記が含まれる', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc);

      expect(result.convertedContent).toContain(
        '土日・祝日を除外した営業日ベース',
      );
    });

    it('英語モードでも土日除外の注記が含まれる', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, { language: 'en' });

      expect(result.convertedContent).toContain(
        'Business days only (excluding weekends and holidays)',
      );
    });

    it('Phase期間表記に曜日が含まれる', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Task 1
- [ ] 1.2 Task 2
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, {
        startDate: '2025-11-24', // 月曜日
      });

      // Phase 0.1 Day 1（月）
      expect(result.convertedContent).toContain('Day 1（月）');
      // Phase 0.2 Day 1-2（月火）
      expect(result.convertedContent).toMatch(/Day 1-2（[月火]+）/);
    });

    it('土曜日開始の場合は月曜日に調整される', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, {
        startDate: '2025-11-29', // 土曜日
      });

      // 土曜日は営業日ではないため、月曜日に調整
      expect(result.convertedContent).toContain('2025-12-01（月）');
    });

    it('日曜日開始の場合は月曜日に調整される', () => {
      const content = `# Tasks

## 1. Setup

- [ ] 1.1 Initialize
`;
      const doc = parseAIDLCFormat(content);
      const result = convertToMichiFormat(doc, {
        startDate: '2025-11-30', // 日曜日
      });

      // 日曜日は営業日ではないため、月曜日に調整
      expect(result.convertedContent).toContain('2025-12-01（月）');
    });
  });

  describe('convertTasksFile', () => {
    it('ファイル変換が成功する', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath);

      expect(result.success).toBe(true);

      const converted = readFileSync(testFilePath, 'utf-8');
      expect(converted).toContain('## Phase 0.1:');
      expect(converted).toContain('### Story');
    });

    it('dry-runオプションでファイルが変更されない', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath, undefined, {
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Dry run: No files were modified');

      const unchanged = readFileSync(testFilePath, 'utf-8');
      expect(unchanged).toBe(content);
    });

    it('backupオプションでバックアップが作成される', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath, undefined, {
        backup: true,
      });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBe(testFilePath + '.aidlc-backup');
      expect(existsSync(result.backupPath!)).toBe(true);

      const backup = readFileSync(result.backupPath!, 'utf-8');
      expect(backup).toBe(content);
    });

    it('カスタムバックアップサフィックスが機能する', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath, undefined, {
        backup: true,
        backupSuffix: '.backup',
      });

      expect(result.backupPath).toBe(testFilePath + '.backup');
    });

    it('出力先パスを指定できる', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      const outputPath = join(testDir, 'output.md');
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath, outputPath);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      // 元ファイルは変更されない
      const original = readFileSync(testFilePath, 'utf-8');
      expect(original).toBe(content);

      // 出力ファイルは変換後の内容
      const output = readFileSync(outputPath, 'utf-8');
      expect(output).toContain('## Phase 0.1:');
    });

    it('AI-DLC形式でないファイルはエラーを返す', () => {
      const content = `# tasks.md

## Phase 0: 要件定義

### Story 0.1: タスク
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath);

      expect(result.success).toBe(false);
      expect(result.warnings[0]).toContain('not in AI-DLC format');
    });

    it('languageオプションが変換に反映される', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath, undefined, {
        language: 'en',
      });

      expect(result.success).toBe(true);

      const converted = readFileSync(testFilePath, 'utf-8');
      expect(converted).toContain('# Task Breakdown:');
      expect(converted).toContain('person-days');
    });

    it('projectNameオプションがヘッダーに反映される', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Initialize project
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath, undefined, {
        projectName: 'my-awesome-feature',
      });

      expect(result.success).toBe(true);

      const converted = readFileSync(testFilePath, 'utf-8');
      expect(converted).toContain('my-awesome-feature');
    });

    it('統計情報が正しく返される', () => {
      const content = `# Implementation Tasks

## 1. Setup

- [ ] 1.1 Task 1
- [ ] 1.2 Task 2

## 2. Implementation

- [ ] 2.1 Task 3
- [ ] 2.2 Task 4
- [ ] 2.3 Task 5
`;
      writeFileSync(testFilePath, content, 'utf-8');
      const result = convertTasksFile(testFilePath);

      expect(result.success).toBe(true);
      expect(result.stats.originalCategories).toBe(2);
      expect(result.stats.originalTasks).toBe(5);
      expect(result.stats.convertedPhases).toBeGreaterThan(0);
      expect(result.stats.convertedStories).toBeGreaterThan(0);
    });
  });
});
