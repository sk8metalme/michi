/**
 * プロジェクト一覧ツール
 * 全リポジトリのプロジェクト情報を表示
 */

import { Octokit } from '@octokit/rest';
import { config } from 'dotenv';

config();

interface ProjectInfo {
  name: string;
  projectId: string;
  status: string;
  jiraKey: string;
  team: string[];
}

async function listProjects(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const org = process.env.GITHUB_ORG;

  if (!token || !org) {
    throw new Error('Missing GitHub credentials');
  }

  const octokit = new Octokit({ auth: token });

  console.log(`Fetching projects for organization: ${org}`);

  // ページネーション対応：全リポジトリを取得
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org,
    per_page: 100
  });

  console.log(`Found ${repos.length} repositories`);

  const projects: ProjectInfo[] = [];

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
                path: `projects/${(projectEntry as any).name}/.kiro/project.json`
              });

              if ('content' in data) {
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                const projectMeta = JSON.parse(content);

                projects.push({
                  name: projectMeta.projectName,
                  projectId: projectMeta.projectId,
                  status: projectMeta.status,
                  jiraKey: projectMeta.jiraProjectKey,
                  team: projectMeta.team
                });
              }
            } catch (error) {
              // プロジェクトディレクトリに.kiro/project.jsonがない場合はスキップ
              console.warn(`⚠️  Skipping project ${(projectEntry as any).name} in ${repo.name}:`, error instanceof Error ? error.message : 'Unknown error');
              continue;
            }
          }
        }
      }
    } catch (error) {
      // projects/ディレクトリが存在しない、または API エラーの場合はスキップ
      console.warn(`⚠️  Skipping ${repo.name}:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }
  
  console.log('\n📋 プロジェクト一覧:\n');
  console.log('| プロジェクト | ID | ステータス | JIRA | チーム |');
  console.log('|------------|-------|----------|------|--------|');
  
  for (const project of projects) {
    console.log(`| ${project.name} | ${project.projectId} | ${project.status} | ${project.jiraKey} | ${project.team.join(', ')} |`);
  }
  
  console.log(`\n合計: ${projects.length} プロジェクト`);
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  listProjects()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

export { listProjects };

