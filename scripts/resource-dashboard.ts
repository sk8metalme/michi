/**
 * リソースダッシュボード生成
 * プロジェクト横断のリソース管理ダッシュボードをConfluenceに作成
 */

import { Octokit } from '@octokit/rest';
import { config } from 'dotenv';
import { ConfluenceClient, getConfluenceConfig } from './confluence-sync.js';
import { getConfig } from './utils/config-loader.js';

config();

interface ProjectResource {
  projectName: string;
  projectId: string;
  status: string;
  team: string[];
  progress: number;
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function createResourceDashboard(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const org = process.env.GITHUB_ORG;

  if (!token || !org) {
    throw new Error('Missing GitHub credentials');
  }

  const octokit = new Octokit({ auth: token });
  const projects: ProjectResource[] = [];

  console.log('Gathering project resources...');

  // ページネーション対応：全リポジトリを取得
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org,
    per_page: 100
  });

  console.log(`Found ${repos.length} repositories`);

  for (const repo of repos) {
    try {
      // ページネーション対応：projects/ディレクトリの全コンテンツを取得
      const projectsDir = await octokit.paginate('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: org,
        repo: repo.name,
        path: 'projects',
        per_page: 100
      });

      if (Array.isArray(projectsDir)) {
        // projects/配下の各プロジェクトディレクトリを処理
        for (const projectEntry of projectsDir) {
          if (typeof projectEntry === 'object' && projectEntry !== null && 'type' in projectEntry && projectEntry.type === 'dir' && 'name' in projectEntry) {
            try {
              // projects/{project-id}/.kiro/project.json を取得
              const { data } = await octokit.repos.getContent({
                owner: org,
                repo: repo.name,
                path: `projects/${(projectEntry as { name: string }).name}/.kiro/project.json`
              });

              if ('content' in data) {
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                const meta = JSON.parse(content);

                projects.push({
                  projectName: meta.projectName,
                  projectId: meta.projectId,
                  status: meta.status,
                  team: meta.team,
                  progress: 0 // TODO: JIRAから進捗を取得
                });
              }
            } catch {
              // プロジェクトディレクトリに.kiro/project.jsonがない場合はスキップ
              continue;
            }
          }
        }
      }
    } catch (error) {
      // projects/ディレクトリが存在しない場合はスキップ
      console.warn(`⚠️  Skipping ${repo.name}:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }
  
  // Confluenceページコンテンツ生成
  const dashboardContent = `
<h2>プロジェクトリソースダッシュボード</h2>

<p>更新日時: ${new Date().toLocaleString('ja-JP')}</p>

<table>
  <tr>
    <th>プロジェクト</th>
    <th>ID</th>
    <th>ステータス</th>
    <th>チーム</th>
    <th>進捗</th>
  </tr>
  ${projects.map(p => `
  <tr>
    <td>${escapeHtml(p.projectName)}</td>
    <td>${escapeHtml(p.projectId)}</td>
    <td>${escapeHtml(p.status)}</td>
    <td>${escapeHtml(p.team.join(', '))}</td>
    <td>${p.progress}%</td>
  </tr>
  `).join('')}
</table>

<p><strong>合計</strong>: ${projects.length} プロジェクト</p>
`.trim();
  
  console.log('Dashboard content generated');
  console.log(dashboardContent);

  // Confluenceに保存
  try {
    console.log('\n📝 Creating Confluence page...');
    const confluenceConfig = getConfluenceConfig();
    const client = new ConfluenceClient(confluenceConfig);

    // 設定からスペースキーを取得（デフォルト: PRD）
    const appConfig = getConfig();
    const spaceKey = appConfig.confluence?.spaces?.requirements || confluenceConfig.space || 'PRD';

    console.log(`Using Confluence space: ${spaceKey}`);

    const pageTitle = 'プロジェクトリソースダッシュボード';

    // 既存ページを検索
    const existingPage = await client.searchPage(spaceKey, pageTitle);

    let pageUrl: string;
    if (existingPage) {
      // 既存ページを更新
      const updated = await client.updatePage(
        existingPage.id,
        pageTitle,
        dashboardContent,
        existingPage.version.number
      );
      const baseUrl = process.env.ATLASSIAN_URL || '';
      pageUrl = `${baseUrl}/wiki${updated._links.webui}`;
      console.log(`✅ Dashboard page updated: ${pageUrl}`);
    } else {
      // 新規ページを作成
      const created = await client.createPage(spaceKey, pageTitle, dashboardContent, ['dashboard', 'resource-management']);
      const baseUrl = process.env.ATLASSIAN_URL || '';
      pageUrl = `${baseUrl}/wiki${created._links.webui}`;
      console.log(`✅ Dashboard page created: ${pageUrl}`);
    }
  } catch (error) {
    console.error('⚠️  Failed to create Confluence page:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Dashboard content has been generated above. You can manually create the page in Confluence.');
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createResourceDashboard()
    .then(() => {
      console.log('✅ Dashboard created');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

export { createResourceDashboard };

