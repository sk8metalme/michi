/**
 * プロジェクト一覧ツール
 * 全リポジトリのプロジェクト情報を表示
 */

import { Octokit } from '@octokit/rest';
import { config } from 'dotenv';
import axios from 'axios';

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
  
  const { data: repos } = await octokit.repos.listForOrg({ org });
  
  const projects: ProjectInfo[] = [];
  
  for (const repo of repos) {
    try {
      // .kiro/project.json を取得
      const { data } = await octokit.repos.getContent({
        owner: org,
        repo: repo.name,
        path: '.kiro/project.json'
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
      // .kiro/project.json が存在しない場合はスキップ
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

