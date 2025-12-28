/**
 * Multi-Repo Confluence同期コマンド
 * docs/michi/{project-name}/ 配下のドキュメントをConfluenceに同期
 */

import { existsSync } from 'fs';
import { safeReadFileOrThrow } from '../../scripts/utils/safe-file-reader.js';
import { resolve } from 'path';
import { getConfig } from '../../scripts/utils/config-loader.js';
import { ConfluenceClient, getConfluenceConfig } from '../../scripts/confluence-sync.js';
import { convertMarkdownToConfluence } from '../../scripts/markdown-to-confluence.js';

/**
 * 同期可能なドキュメントタイプ
 */
export type DocumentType =
  | 'requirements'
  | 'architecture'
  | 'sequence'
  | 'strategy'
  | 'ci-status'
  | 'release-notes';

/**
 * 同期オプション
 */
export interface SyncOptions {
  docType?: DocumentType;
  projectRoot?: string;
}

/**
 * 同期されたドキュメント情報
 */
export interface SyncedDocument {
  docType: DocumentType;
  success: boolean;
  pageId?: string;
  pageTitle?: string;
  pageUrl?: string;
  confluenceContent?: string;
  error?: string;
}

/**
 * 同期結果
 */
export interface SyncResult {
  projectName: string;
  syncedDocs: SyncedDocument[];
  totalSuccess: number;
  totalFailed: number;
}

/**
 * ドキュメントタイプとファイルパスのマッピング
 */
const DOC_TYPE_PATHS: Record<DocumentType, string> = {
  requirements: 'overview/requirements.md',
  architecture: 'overview/architecture.md',
  sequence: 'overview/sequence.md',
  strategy: 'tests/strategy.md',
  'ci-status': 'docs/ci-status.md',
  'release-notes': 'docs/release-notes.md',
};

/**
 * ドキュメントタイプのラベル（Confluenceページタイトル用）
 */
const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  requirements: 'Requirements',
  architecture: 'Architecture',
  sequence: 'Sequence Diagrams',
  strategy: 'Test Strategy',
  'ci-status': 'CI Status',
  'release-notes': 'Release Notes',
};

/**
 * Multi-RepoプロジェクトのドキュメントをConfluenceに同期
 *
 * @param projectName プロジェクト名
 * @param options 同期オプション
 * @returns 同期結果
 */
export async function multiRepoConfluenceSync(
  projectName: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const { docType, projectRoot = process.cwd() } = options;

  // 1. プロジェクト存在確認
  const config = getConfig(projectRoot);
  const project = config.multiRepoProjects?.find(p => p.name === projectName);

  if (!project) {
    throw new Error(`Project not found: ${projectName}`);
  }

  // 2. Confluence認証情報確認
  if (!process.env.ATLASSIAN_URL || !process.env.ATLASSIAN_EMAIL || !process.env.ATLASSIAN_API_TOKEN) {
    throw new Error('Confluence credentials not configured. Please set ATLASSIAN_URL, ATLASSIAN_EMAIL, and ATLASSIAN_API_TOKEN environment variables.');
  }

  // 3. ドキュメントタイプのバリデーション
  const docTypes: DocumentType[] = docType
    ? [docType]
    : ['requirements', 'architecture', 'sequence', 'strategy', 'ci-status', 'release-notes'];

  // 無効なドキュメントタイプチェック
  if (docType && !DOC_TYPE_PATHS[docType]) {
    throw new Error(`Invalid document type: ${docType}. Valid types: ${Object.keys(DOC_TYPE_PATHS).join(', ')}`);
  }

  // 4. Confluenceクライアント初期化
  const confluenceConfig = getConfluenceConfig();
  const client = new ConfluenceClient(confluenceConfig);
  const spaceKey = project.confluenceSpace || confluenceConfig.space;

  // 5. 各ドキュメントを同期
  const syncedDocs: SyncedDocument[] = [];

  for (const type of docTypes) {
    const docPath = resolve(projectRoot, 'docs', 'michi', projectName, DOC_TYPE_PATHS[type]);

    // ドキュメントファイル存在確認
    if (!existsSync(docPath)) {
      syncedDocs.push({
        docType: type,
        success: false,
        error: `Document not found: ${docPath}`,
      });
      console.log(`⏭️  Skipping ${type}: file not found`);
      continue;
    }

    try {
      // Markdownファイル読み込み
      const markdown = safeReadFileOrThrow(docPath, 'utf-8');

      // Confluence Storage Format に変換（Mermaid変換を含む）
      const confluenceContent = convertMarkdownToConfluence(markdown);

      // ページタイトル生成
      const pageTitle = `${projectName} - ${DOC_TYPE_LABELS[type]}`;

      // 親ページを検索または作成（プロジェクト名のページ）
      let parentPage = await client.searchPage(spaceKey, projectName);

      if (!parentPage) {
        // 親ページが存在しない場合は作成
        parentPage = await client.createPage(
          spaceKey,
          projectName,
          `<p>Multi-Repo project: ${projectName}</p>`,
          ['multi-repo', projectName]
        );
        console.log(`✅ Created parent page: ${projectName}`);
      }

      // ドキュメントページを検索または作成
      let page = await client.searchPage(spaceKey, pageTitle, parentPage.id);

      if (page) {
        // 既存ページを更新
        const version = page.version?.number || 1;
        page = await client.updatePage(page.id, pageTitle, confluenceContent, version);
        console.log(`✅ Updated: ${pageTitle}`);
      } else {
        // 新規ページ作成
        page = await client.createPageUnderParent(
          spaceKey,
          pageTitle,
          confluenceContent,
          ['multi-repo', projectName, type],
          parentPage.id
        );
        console.log(`✅ Created: ${pageTitle}`);
      }

      // ページURL生成
      const pageUrl = `${confluenceConfig.url}/wiki/spaces/${spaceKey}/pages/${page.id}/${encodeURIComponent(pageTitle)}`;

      syncedDocs.push({
        docType: type,
        success: true,
        pageId: page.id,
        pageTitle,
        pageUrl,
        confluenceContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      syncedDocs.push({
        docType: type,
        success: false,
        error: errorMessage,
      });
      console.error(`❌ Failed to sync ${type}: ${errorMessage}`);
    }
  }

  // 6. 結果集計
  const totalSuccess = syncedDocs.filter(d => d.success).length;
  const totalFailed = syncedDocs.filter(d => !d.success).length;

  return {
    projectName,
    syncedDocs,
    totalSuccess,
    totalFailed,
  };
}
