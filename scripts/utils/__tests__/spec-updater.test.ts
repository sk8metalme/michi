/**
 * spec-updater のテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadSpecJson,
  saveSpecJson,
  updateSpecJsonAfterConfluenceSync,
  updateSpecJsonAfterJiraSync,
  type SpecJson
} from '../spec-updater.js';

const testDir = resolve(__dirname, '../../../.test-tmp');
const testFeatureName = 'test-feature';

describe('spec-updater', () => {
  beforeEach(() => {
    // テスト用ディレクトリを作成
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(resolve(testDir, '.kiro/specs', testFeatureName), { recursive: true });
  });

  afterEach(() => {
    // テスト用ディレクトリを削除
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  describe('loadSpecJson', () => {
    it('spec.jsonが存在しない場合、最小限の構造を返す', () => {
      const spec = loadSpecJson(testFeatureName, testDir);

      expect(spec).toEqual({
        featureName: testFeatureName,
        confluence: {},
        jira: {},
        milestones: {}
      });
    });

    it('spec.jsonが存在する場合、その内容を返す', () => {
      const specPath = resolve(testDir, '.kiro/specs', testFeatureName, 'spec.json');
      const testSpec: SpecJson = {
        featureName: testFeatureName,
        projectName: 'Test Project',
        confluence: {
          spaceKey: 'TEST'
        },
        jira: {},
        milestones: {}
      };

      writeFileSync(specPath, JSON.stringify(testSpec, null, 2));

      const spec = loadSpecJson(testFeatureName, testDir);
      expect(spec).toEqual(testSpec);
    });
  });

  describe('saveSpecJson', () => {
    it('spec.jsonを保存し、lastUpdatedを追加する', () => {
      const spec: SpecJson = {
        featureName: testFeatureName,
        confluence: {},
        jira: {},
        milestones: {}
      };

      saveSpecJson(testFeatureName, spec, testDir);

      const specPath = resolve(testDir, '.kiro/specs', testFeatureName, 'spec.json');
      expect(existsSync(specPath)).toBe(true);

      const saved = JSON.parse(readFileSync(specPath, 'utf-8'));
      expect(saved.featureName).toBe(testFeatureName);
      expect(saved.lastUpdated).toBeDefined();
    });
  });

  describe('updateSpecJsonAfterConfluenceSync', () => {
    it('Confluence同期後にspec.jsonを正しく更新する（requirements）', () => {
      updateSpecJsonAfterConfluenceSync(
        testFeatureName,
        'requirements',
        {
          pageId: 'page123',
          url: 'https://example.atlassian.net/wiki/spaces/TEST/pages/page123',
          title: 'Test Requirements',
          spaceKey: 'TEST'
        },
        testDir
      );

      const spec = loadSpecJson(testFeatureName, testDir);

      expect(spec.confluence?.spaceKey).toBe('TEST');
      expect(spec.confluence?.requirements).toEqual({
        pageId: 'page123',
        url: 'https://example.atlassian.net/wiki/spaces/TEST/pages/page123',
        title: 'Test Requirements'
      });
      expect(spec.milestones?.requirementsCompleted).toBe(true);
    });

    it('Confluence同期後にspec.jsonを正しく更新する（design）', () => {
      updateSpecJsonAfterConfluenceSync(
        testFeatureName,
        'design',
        {
          pageId: 'page456',
          url: 'https://example.atlassian.net/wiki/spaces/TEST/pages/page456',
          title: 'Test Design',
          spaceKey: 'TEST'
        },
        testDir
      );

      const spec = loadSpecJson(testFeatureName, testDir);

      expect(spec.confluence?.design).toEqual({
        pageId: 'page456',
        url: 'https://example.atlassian.net/wiki/spaces/TEST/pages/page456',
        title: 'Test Design'
      });
      expect(spec.milestones?.designCompleted).toBe(true);
    });

    it('Confluence同期後にspec.jsonを正しく更新する（tasks）', () => {
      updateSpecJsonAfterConfluenceSync(
        testFeatureName,
        'tasks',
        {
          pageId: 'page789',
          url: 'https://example.atlassian.net/wiki/spaces/TEST/pages/page789',
          title: 'Test Tasks',
          spaceKey: 'TEST'
        },
        testDir
      );

      const spec = loadSpecJson(testFeatureName, testDir);

      expect(spec.confluence?.tasks).toEqual({
        pageId: 'page789',
        url: 'https://example.atlassian.net/wiki/spaces/TEST/pages/page789',
        title: 'Test Tasks'
      });
      expect(spec.milestones?.tasksCompleted).toBe(true);
    });
  });

  describe('updateSpecJsonAfterJiraSync', () => {
    it('JIRA同期後にspec.jsonを正しく更新する', () => {
      updateSpecJsonAfterJiraSync(
        testFeatureName,
        {
          projectKey: 'TEST',
          epicKey: 'TEST-123',
          epicUrl: 'https://example.atlassian.net/browse/TEST-123',
          storyKeys: ['TEST-124', 'TEST-125', 'TEST-126']
        },
        testDir
      );

      const spec = loadSpecJson(testFeatureName, testDir);

      expect(spec.jira).toEqual({
        projectKey: 'TEST',
        epicKey: 'TEST-123',
        epicUrl: 'https://example.atlassian.net/browse/TEST-123',
        storyKeys: ['TEST-124', 'TEST-125', 'TEST-126']
      });
      expect(spec.milestones?.jiraSyncCompleted).toBe(true);
    });
  });

  describe('統合シナリオ', () => {
    it('Confluence → JIRA の順に同期した場合、両方の情報が保持される', () => {
      // 1. Confluence 同期（requirements）
      updateSpecJsonAfterConfluenceSync(
        testFeatureName,
        'requirements',
        {
          pageId: 'page123',
          url: 'https://example.atlassian.net/wiki/spaces/TEST/pages/page123',
          title: 'Test Requirements',
          spaceKey: 'TEST'
        },
        testDir
      );

      // 2. JIRA 同期
      updateSpecJsonAfterJiraSync(
        testFeatureName,
        {
          projectKey: 'TEST',
          epicKey: 'TEST-123',
          epicUrl: 'https://example.atlassian.net/browse/TEST-123',
          storyKeys: ['TEST-124']
        },
        testDir
      );

      // 両方の情報が保持されているか確認
      const spec = loadSpecJson(testFeatureName, testDir);

      expect(spec.confluence?.spaceKey).toBe('TEST');
      expect(spec.confluence?.requirements).toBeDefined();
      expect(spec.jira?.epicKey).toBe('TEST-123');
      expect(spec.milestones?.requirementsCompleted).toBe(true);
      expect(spec.milestones?.jiraSyncCompleted).toBe(true);
    });
  });
});
