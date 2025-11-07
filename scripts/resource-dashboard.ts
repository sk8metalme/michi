/**
 * リソースダッシュボード生成
 * プロジェクト横断のリソース管理ダッシュボードをConfluenceに作成
 */

import { Octokit } from '@octokit/rest';
import { config } from 'dotenv';
import { ConfluenceClient } from './confluence-sync.js';

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
  
  const { data: repos } = await octokit.repos.listForOrg({ org });
  
  for (const repo of repos) {
    try {
      const { data } = await octokit.repos.getContent({
        owner: org,
        repo: repo.name,
        path: '.kiro/project.json'
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
    } catch (error) {
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
  
  // TODO: Confluenceに保存
  // const confluenceConfig = getConfluenceConfig();
  // const client = new ConfluenceClient(confluenceConfig);
  // await client.createPage('PRD', 'プロジェクトリソースダッシュボード', dashboardContent);
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

