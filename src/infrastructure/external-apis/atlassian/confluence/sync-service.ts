/**
 * Confluence Sync Service
 */

import { resolve } from 'path';
import { loadProjectMeta } from '../../../../../scripts/utils/project-meta.js';
import { validateFeatureNameOrThrow } from '../../../../../scripts/utils/feature-name-validator.js';
import { getConfig, getConfigPath } from '../../../../../scripts/utils/config-loader.js';
import { validateForConfluenceSync } from '../../../../../scripts/utils/config-validator.js';
import {
  updateSpecJsonAfterConfluenceSync,
  loadSpecJson,
} from '../../../../../scripts/utils/spec-updater.js';
import { safeReadFileOrThrow } from '../../../../../scripts/utils/safe-file-reader.js';
import { ConfluenceClient } from './client.js';
import type { ConfluenceConfig } from './types.js';
import { createPagesByGranularity } from './hierarchy.js';

/**
 * リクエスト間の待機時間
 */
function getRequestDelay(): number {
  return parseInt(process.env.ATLASSIAN_REQUEST_DELAY || '500', 10);
}

/**
 * Confluence設定を取得
 */
export function getConfluenceConfig(): ConfluenceConfig {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  const space = process.env.CONFLUENCE_PRD_SPACE || 'PRD';

  if (!url || !email || !apiToken) {
    throw new Error('Missing Confluence credentials in .env');
  }

  return { url, email, apiToken, space };
}

/**
 * Confluence同期メイン処理
 */
export async function syncToConfluence(
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks' = 'requirements'
): Promise<string> {
  console.log(`Syncing ${docType} for feature: ${featureName}`);

  validateFeatureNameOrThrow(featureName);

  const validation = validateForConfluenceSync(docType);

  if (validation.info.length > 0) {
    validation.info.forEach(msg => console.log(`ℹ️  ${msg}`));
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach(warning => console.warn(`   ${warning}`));
  }

  if (validation.errors.length > 0) {
    console.error('❌ Configuration errors:');
    validation.errors.forEach(error => console.error(`   ${error}`));
    const configPath = getConfigPath();
    console.error(`\n設定ファイル: ${configPath}`);
    throw new Error('Confluence同期に必要な設定値が不足しています。上記のエラーを確認して設定を修正してください。');
  }

  console.log(`⏳ Request delay: ${getRequestDelay()}ms (set ATLASSIAN_REQUEST_DELAY to adjust)`);

  const projectMeta = loadProjectMeta();
  console.log(`Project: ${projectMeta.projectName} (${projectMeta.projectId})`);

  const appConfig = getConfig();
  const confluenceConfigOptions = appConfig.confluence || {
    pageCreationGranularity: 'single',
    pageTitleFormat: '[{projectName}] {featureName} {docTypeLabel}',
    autoLabels: ['{projectLabel}', '{docType}', '{featureName}', 'github-sync']
  };

  const confluenceApiConfig = getConfluenceConfig();

  // Merge API config with options
  const confluenceConfig = {
    ...confluenceApiConfig,
    ...confluenceConfigOptions
  };

  console.log(`📋 Page creation granularity: ${confluenceConfig.pageCreationGranularity}`);

  if (confluenceConfig.spaces?.[docType]) {
    console.log(`📝 Config source: config.json (spaces.${docType} = ${confluenceConfig.spaces[docType]})`);
  } else if (process.env.CONFLUENCE_PRD_SPACE) {
    console.log(`📝 Config source: environment variable (CONFLUENCE_PRD_SPACE = ${process.env.CONFLUENCE_PRD_SPACE})`);
  } else {
    console.log('📝 Config source: default config');
  }

  const markdownPath = resolve(`.michi/specs/${featureName}/${docType}.md`);
  const markdown = safeReadFileOrThrow(markdownPath);

  const githubUrl = `${projectMeta.repository}/blob/main/.michi/specs/${featureName}/${docType}.md`;

  const specJson = loadSpecJson(featureName);

  let spaceKey: string;
  let spaceKeySource: string;

  if (specJson.confluence?.spaceKey) {
    spaceKey = specJson.confluence.spaceKey;
    spaceKeySource = 'spec.json';
  } else if (confluenceConfig.spaces?.[docType]) {
    spaceKey = confluenceConfig.spaces[docType];
    spaceKeySource = 'config.json';
  } else {
    spaceKey = confluenceApiConfig.space;
    spaceKeySource = process.env.CONFLUENCE_PRD_SPACE ? 'environment variable' : 'default from config';
  }

  console.log(`📌 Using Confluence space: ${spaceKey} (source: ${spaceKeySource})`);

  const client = new ConfluenceClient({
    url: confluenceConfig.url,
    email: confluenceConfig.email,
    apiToken: confluenceConfig.apiToken,
    space: spaceKey
  });

  try {
    const result = await createPagesByGranularity(
      client,
      spaceKey,
      markdown,
      confluenceConfig,
      projectMeta,
      featureName,
      docType,
      githubUrl
    );

    if (result.pages.length === 0) {
      throw new Error('No pages were created');
    }

    const firstPageUrl = result.pages[0].url;
    console.log(`✅ Sync completed: ${result.pages.length} page(s) created/updated`);

    if (result.pages.length > 1) {
      console.log('📄 Created pages:');
      result.pages.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.title} - ${page.url}`);
      });
    }

    const firstPage = result.pages[0];
    updateSpecJsonAfterConfluenceSync(featureName, docType, {
      pageId: firstPage.id,
      url: firstPage.url,
      title: firstPage.title,
      spaceKey: spaceKey
    });

    return firstPageUrl;
  } finally {
    client.dispose();
  }
}
