/**
 * Task 14.3: config.json読み込みパフォーマンステスト
 * 1000プロジェクトを含むconfig.jsonの読み込み性能を測定
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { AppConfig } from '../../scripts/config/config-schema.js';
import { getConfig, clearConfigCache } from '../../scripts/utils/config-loader.js';

describe('Task 14.3: config.json読み込みパフォーマンステスト', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;

  beforeEach(() => {
    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-config-perf-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });

    // .michiディレクトリとconfig.jsonを作成
    const michiDir = join(testRoot, '.michi');
    mkdirSync(michiDir, { recursive: true });
    configPath = join(michiDir, 'config.json');

    // カレントディレクトリを変更
    process.chdir(testRoot);

    // キャッシュをクリア
    clearConfigCache();
  });

  afterEach(() => {
    // カレントディレクトリを元に戻す
    process.chdir(originalCwd);

    // キャッシュをクリア
    clearConfigCache();

    // テスト用ディレクトリを削除（リトライ付き）
    if (existsSync(testRoot)) {
      rmSync(testRoot, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  });

  describe('1000プロジェクトの読み込み性能', () => {
    it('1000プロジェクトを含むconfig.jsonをメモリ100MB以内で読み込み（目標: < 100MB）', () => {
      // 1000プロジェクトのconfig.jsonを生成
      const createdAt = new Date().toISOString();
      const largeConfig: AppConfig = {
        multiRepoProjects: Array.from({ length: 1000 }, (_, i) => ({
          name: `test-project-${i + 1}`,
          jiraKey: 'TESTPROJ',
          confluenceSpace: `SPACE${i + 1}`,
          createdAt,
          repositories: [
            {
              name: `repo-${i + 1}-1`,
              url: `https://github.com/org/repo-${i + 1}-1`,
              branch: 'main',
            },
            {
              name: `repo-${i + 1}-2`,
              url: `https://github.com/org/repo-${i + 1}-2`,
              branch: 'develop',
            },
          ],
        })),
      };

      writeFileSync(configPath, JSON.stringify(largeConfig, null, 2), 'utf-8');

      // 初期メモリ使用量を記録
      const initialMemory = process.memoryUsage();

      // 1回目の読み込み（キャッシュなし）
      const startTime1 = Date.now();
      const config1 = getConfig(testRoot);
      const loadTime1 = Date.now() - startTime1;

      // メモリ使用量を測定
      const memoryAfterFirstLoad = process.memoryUsage();
      const memoryIncreaseMB =
        (memoryAfterFirstLoad.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      // 結果の表示
      console.log('');
      console.log('=== config.json読み込みパフォーマンステスト結果 ===');
      console.log(`プロジェクト数: ${config1.multiRepoProjects.length}`);
      console.log(`1回目読み込み時間: ${loadTime1}ms`);
      console.log(`メモリ使用量増分: ${memoryIncreaseMB.toFixed(2)}MB`);
      console.log('=========================================');
      console.log('');

      // 検証1: 1000プロジェクトが正しく読み込まれていることを確認
      expect(config1.multiRepoProjects).toHaveLength(1000);
      expect(config1.multiRepoProjects[0].name).toBe('test-project-1');
      expect(config1.multiRepoProjects[999].name).toBe('test-project-1000');

      // 検証2: メモリ使用量が100MB以内であることを確認
      expect(memoryIncreaseMB).toBeLessThan(100);
    });

    it('キャッシング効果の検証：2回目の読み込みは1回目の10%以下の時間（目標: < 10%）', () => {
      // 100プロジェクトのconfig.jsonを生成（測定精度向上のため）
      const createdAt = new Date().toISOString();
      const testConfig: AppConfig = {
        multiRepoProjects: Array.from({ length: 100 }, (_, i) => ({
          name: `test-project-${i + 1}`,
          jiraKey: 'TESTPROJ',
          confluenceSpace: `SPACE${i + 1}`,
          createdAt,
          repositories: [
            {
              name: `repo-${i + 1}`,
              url: `https://github.com/org/repo-${i + 1}`,
              branch: 'main',
            },
          ],
        })),
      };

      writeFileSync(configPath, JSON.stringify(testConfig, null, 2), 'utf-8');

      // キャッシュをクリア
      clearConfigCache();

      // 1回目の読み込み（キャッシュなし）
      const startTime1 = Date.now();
      const config1 = getConfig(testRoot);
      const loadTime1 = Date.now() - startTime1;

      // 2回目の読み込み（キャッシュあり）
      const startTime2 = Date.now();
      const config2 = getConfig(testRoot);
      const loadTime2 = Date.now() - startTime2;

      // キャッシング効果の計算
      const cacheEffectPercent = (loadTime2 / loadTime1) * 100;

      console.log('');
      console.log('=== キャッシング効果の検証 ===');
      console.log(`1回目読み込み時間: ${loadTime1}ms`);
      console.log(`2回目読み込み時間: ${loadTime2}ms`);
      console.log(`キャッシング効果: ${cacheEffectPercent.toFixed(2)}%`);
      console.log('==========================');
      console.log('');

      // 検証1: 設定が正しく読み込まれていることを確認
      expect(config1.multiRepoProjects).toHaveLength(100);
      expect(config2.multiRepoProjects).toHaveLength(100);

      // 検証2: 2回目の読み込みが1回目の10%以下の時間で完了
      expect(loadTime2).toBeLessThan(loadTime1 * 0.1);
    });

    it('メモリリークなし：複数回の読み込みでメモリ使用量が増加しない', () => {
      // 100プロジェクトのconfig.jsonを生成
      const createdAt = new Date().toISOString();
      const testConfig: AppConfig = {
        multiRepoProjects: Array.from({ length: 100 }, (_, i) => ({
          name: `test-project-${i + 1}`,
          jiraKey: 'TESTPROJ',
          confluenceSpace: `SPACE${i + 1}`,
          createdAt,
          repositories: [
            {
              name: `repo-${i + 1}`,
              url: `https://github.com/org/repo-${i + 1}`,
              branch: 'main',
            },
          ],
        })),
      };

      writeFileSync(configPath, JSON.stringify(testConfig, null, 2), 'utf-8');

      // キャッシュをクリア
      clearConfigCache();

      // 初期メモリ使用量
      const initialMemory = process.memoryUsage().heapUsed;

      // 1回目の読み込み
      getConfig(testRoot);
      const memoryAfter1 = process.memoryUsage().heapUsed;
      const memoryIncrease1 = (memoryAfter1 - initialMemory) / 1024 / 1024;

      // 2回目の読み込み（キャッシュあり）
      getConfig(testRoot);
      const memoryAfter2 = process.memoryUsage().heapUsed;
      const memoryIncrease2 = (memoryAfter2 - initialMemory) / 1024 / 1024;

      // 3回目の読み込み（キャッシュあり）
      getConfig(testRoot);
      const memoryAfter3 = process.memoryUsage().heapUsed;
      const memoryIncrease3 = (memoryAfter3 - initialMemory) / 1024 / 1024;

      // 4回目の読み込み（キャッシュあり）
      getConfig(testRoot);
      const memoryAfter4 = process.memoryUsage().heapUsed;
      const memoryIncrease4 = (memoryAfter4 - initialMemory) / 1024 / 1024;

      // 5回目の読み込み（キャッシュあり）
      getConfig(testRoot);
      const memoryAfter5 = process.memoryUsage().heapUsed;
      const memoryIncrease5 = (memoryAfter5 - initialMemory) / 1024 / 1024;

      console.log('');
      console.log('=== メモリリーク検証 ===');
      console.log(`1回目後のメモリ増分: ${memoryIncrease1.toFixed(2)}MB`);
      console.log(`2回目後のメモリ増分: ${memoryIncrease2.toFixed(2)}MB`);
      console.log(`3回目後のメモリ増分: ${memoryIncrease3.toFixed(2)}MB`);
      console.log(`4回目後のメモリ増分: ${memoryIncrease4.toFixed(2)}MB`);
      console.log(`5回目後のメモリ増分: ${memoryIncrease5.toFixed(2)}MB`);
      console.log('====================');
      console.log('');

      // 検証: 2回目以降のメモリ増分が1回目から大きく増加していないことを確認
      // 許容範囲: 1回目の1.5倍以内（GCの影響を考慮）
      expect(memoryIncrease2).toBeLessThan(memoryIncrease1 * 1.5);
      expect(memoryIncrease3).toBeLessThan(memoryIncrease1 * 1.5);
      expect(memoryIncrease4).toBeLessThan(memoryIncrease1 * 1.5);
      expect(memoryIncrease5).toBeLessThan(memoryIncrease1 * 1.5);
    });
  });
});
