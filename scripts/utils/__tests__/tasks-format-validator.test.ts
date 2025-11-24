/**
 * tasks-format-validator.ts のユニットテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { 
  validateTasksFormat, 
  isValidTasksFormat, 
  countPhases, 
  countStories 
} from '../tasks-format-validator.js';

describe('tasks-format-validator', () => {
  let testDir: string;
  let testFilePath: string;

  beforeEach(() => {
    // テスト用一時ディレクトリ作成
    testDir = join(tmpdir(), `test-tasks-validator-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    testFilePath = join(testDir, 'tasks.md');
  });

  afterEach(() => {
    // クリーンアップ
    try {
      if (testFilePath) unlinkSync(testFilePath);
      if (testDir) rmdirSync(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('validateTasksFormat', () => {
    it('正しい新ワークフローフォーマットが成功する', () => {
      const validContent = `# tasks.md

## Phase 0.1: 要件定義

### Story 0.1.1: 要件定義書作成

## Phase 0.2: 設計

### Story 0.2.1: 基本設計

## Phase 1: 環境構築

### Story 1.1: テスト環境セットアップ

## Phase 2: TDD実装

### Story 2.1: プロジェクトセットアップ

## Phase A: PR前自動テスト

### Story A.1: 単体テスト実行

## Phase 3: 追加QA

### Story 3.1: 統合テスト

## Phase B: リリース準備テスト

### Story B.1: E2Eテスト実行

## Phase 4: リリース準備

### Story 4.1: 本番環境構築

## Phase 5: リリース

### Story 5.1: ステージング環境デプロイ

Day 1（月）: 営業日ベース
`;
      writeFileSync(testFilePath, validContent, 'utf-8');
      expect(() => validateTasksFormat(testFilePath)).not.toThrow();
    });

    it('正しい新ワークフローフォーマット（任意フェーズ省略）が成功する', () => {
      const validContent = `# tasks.md

## Phase 0.1: 要件定義

### Story 0.1.1: 要件定義書作成

## Phase 0.2: 設計

### Story 0.2.1: 基本設計

## Phase 2: TDD実装

### Story 2.1: プロジェクトセットアップ

## Phase 4: リリース準備

### Story 4.1: 本番環境構築

## Phase 5: リリース

### Story 5.1: ステージング環境デプロイ

Day 1（月）: 営業日ベース
`;
      writeFileSync(testFilePath, validContent, 'utf-8');
      expect(() => validateTasksFormat(testFilePath)).not.toThrow();
    });

    it('正しい6フェーズフォーマット（レガシー）が成功する', () => {
      const validContent = `# tasks.md

## Phase 0: 要件定義（Requirements）

### Story 0.1: 要件定義書作成

## Phase 1: 設計（Design）

### Story 1.1: 基本設計

## Phase 2: 実装（Implementation）

### Story 2.1: プロジェクトセットアップ

## Phase 3: 試験（Testing）

### Story 3.1: 結合テスト

## Phase 4: リリース準備（Release Preparation）

### Story 4.1: 本番環境構築

## Phase 5: リリース（Release）

### Story 5.1: ステージング環境デプロイ

Day 1（月）: 営業日ベース
`;
      writeFileSync(testFilePath, validContent, 'utf-8');
      expect(() => validateTasksFormat(testFilePath)).not.toThrow();
    });

    it('Phase 0が不足している場合エラー', () => {
      const invalidContent = `# tasks.md

## Phase 1: 設計（Design）

### Story 1.1: 基本設計

## Phase 2: 実装（Implementation）

### Story 2.1: プロジェクトセットアップ

## Phase 3: 試験（Testing）

### Story 3.1: 結合テスト

## Phase 4: リリース準備（Release Preparation）

### Story 4.1: 本番環境構築

## Phase 5: リリース（Release）

### Story 5.1: ステージング環境デプロイ
`;
      writeFileSync(testFilePath, invalidContent, 'utf-8');
      expect(() => validateTasksFormat(testFilePath)).toThrow(/Phase 0: 要件定義（Requirements）/);
    });

    it('複数のフェーズが不足している場合エラー', () => {
      const invalidContent = `# tasks.md

## Phase 0: 要件定義（Requirements）

### Story 0.1: 要件定義書作成

## Phase 2: 実装（Implementation）

### Story 2.1: プロジェクトセットアップ
`;
      writeFileSync(testFilePath, invalidContent, 'utf-8');
      expect(() => validateTasksFormat(testFilePath)).toThrow(/Phase 1: 設計（Design）/);
      expect(() => validateTasksFormat(testFilePath)).toThrow(/Phase 3: 試験（Testing）/);
    });

    it('新ワークフローで必須フェーズが不足している場合エラー', () => {
      const invalidContent = `# tasks.md

## Phase 0.1: 要件定義

### Story 0.1.1: 要件定義書作成

## Phase 2: TDD実装

### Story 2.1: プロジェクトセットアップ
`;
      writeFileSync(testFilePath, invalidContent, 'utf-8');
      expect(() => validateTasksFormat(testFilePath)).toThrow(/Phase 0.2:/);
      expect(() => validateTasksFormat(testFilePath)).toThrow(/does not match either workflow structure/);
    });

    it('Storyヘッダーがない場合エラー', () => {
      const invalidContent = `# tasks.md

## Phase 0: 要件定義（Requirements）
## Phase 1: 設計（Design）
## Phase 2: 実装（Implementation）
## Phase 3: 試験（Testing）
## Phase 4: リリース準備（Release Preparation）
## Phase 5: リリース（Release）
`;
      writeFileSync(testFilePath, invalidContent, 'utf-8');
      expect(() => validateTasksFormat(testFilePath)).toThrow(/Story headers/);
    });

    it('AI-DLCフォーマットを検出してエラー', () => {
      const invalidContent = `# Implementation Plan

## Task Breakdown

- [ ] 1. プロジェクトセットアップ
- [ ] 2. HealthControllerを実装
- [ ] 3. HealthServiceを実装
`;
      writeFileSync(testFilePath, invalidContent, 'utf-8');
      expect(() => validateTasksFormat(testFilePath)).toThrow(/AI-DLC format/);
    });

    it('ファイルが存在しない場合エラー', () => {
      const nonExistentPath = join(testDir, 'non-existent.md');
      expect(() => validateTasksFormat(nonExistentPath)).toThrow(/Failed to read/);
    });
  });

  describe('isValidTasksFormat', () => {
    it('正しいフォーマットの場合trueを返す', () => {
      const validContent = `# tasks.md

## Phase 0: 要件定義（Requirements）
### Story 0.1: タイトル

## Phase 1: 設計（Design）
### Story 1.1: タイトル

## Phase 2: 実装（Implementation）
### Story 2.1: タイトル

## Phase 3: 試験（Testing）
### Story 3.1: タイトル

## Phase 4: リリース準備（Release Preparation）
### Story 4.1: タイトル

## Phase 5: リリース（Release）
### Story 5.1: タイトル

Day 1（月）: 営業日ベース
`;
      writeFileSync(testFilePath, validContent, 'utf-8');
      expect(isValidTasksFormat(testFilePath)).toBe(true);
    });

    it('不正なフォーマットの場合falseを返す', () => {
      const invalidContent = `# tasks.md

## Phase 0: 要件定義（Requirements）
`;
      writeFileSync(testFilePath, invalidContent, 'utf-8');
      expect(isValidTasksFormat(testFilePath)).toBe(false);
    });
  });

  describe('countPhases', () => {
    it('正しくフェーズ数をカウントする', () => {
      const content = `# tasks.md

## Phase 0: 要件定義（Requirements）
## Phase 1: 設計（Design）
## Phase 2: 実装（Implementation）
## Phase 3: 試験（Testing）
## Phase 4: リリース準備（Release Preparation）
## Phase 5: リリース（Release）
`;
      writeFileSync(testFilePath, content, 'utf-8');
      expect(countPhases(testFilePath)).toBe(6);
    });

    it('フェーズが少ない場合正しくカウントする', () => {
      const content = `# tasks.md

## Phase 0: 要件定義（Requirements）
## Phase 1: 設計（Design）
`;
      writeFileSync(testFilePath, content, 'utf-8');
      expect(countPhases(testFilePath)).toBe(2);
    });

    it('ファイルが存在しない場合0を返す', () => {
      const nonExistentPath = join(testDir, 'non-existent.md');
      expect(countPhases(nonExistentPath)).toBe(0);
    });
  });

  describe('countStories', () => {
    it('正しくStory数をカウントする', () => {
      const content = `# tasks.md

## Phase 0: 要件定義（Requirements）
### Story 0.1: 要件定義書作成
### Story 0.2: PM承認

## Phase 1: 設計（Design）
### Story 1.1: 基本設計
### Story 1.2: 詳細設計
`;
      writeFileSync(testFilePath, content, 'utf-8');
      expect(countStories(testFilePath)).toBe(4);
    });

    it('Storyがない場合0を返す', () => {
      const content = `# tasks.md

## Phase 0: 要件定義（Requirements）
`;
      writeFileSync(testFilePath, content, 'utf-8');
      expect(countStories(testFilePath)).toBe(0);
    });

    it('ファイルが存在しない場合0を返す', () => {
      const nonExistentPath = join(testDir, 'non-existent.md');
      expect(countStories(nonExistentPath)).toBe(0);
    });
  });
});


