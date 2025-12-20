/**
 * GitHub PR自動化スクリプト
 */

import { Octokit } from '@octokit/rest';
import { loadEnv } from './utils/env-loader.js';

loadEnv();

interface PROptions {
  branch: string;
  title: string;
  body: string;
  base?: string;
}

async function createPR(options: PROptions): Promise<void> {
  const { getRepositoryInfo } = await import('./utils/project-meta.js');
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('Missing GitHub credentials. Required: GITHUB_TOKEN');
  }

  // .kiro/project.json から repository 情報を取得
  let repo: string;
  try {
    repo = getRepositoryInfo();
  } catch (error) {
    throw new Error(
      `Failed to get repository info from .kiro/project.json: ${error instanceof Error ? error.message : error}`,
    );
  }

  const [owner, repoName] = repo.split('/');
  const octokit = new Octokit({ auth: token });
  
  const { branch, title, body, base = 'main' } = options;
  
  console.log(`Creating PR: ${title}`);
  
  const pr = await octokit.pulls.create({
    owner,
    repo: repoName,
    title,
    body,
    head: branch,
    base
  });
  
  console.log(`✅ PR created: ${pr.data.html_url}`);
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run github:create-pr <branch> [title]');
    process.exit(1);
  }
  
  const branch = args[0];
  const title = args[1] || `feat: ${branch}`;
  const body = 'Auto-generated PR';
  
  createPR({ branch, title, body })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ PR creation failed:', error.message);
      process.exit(1);
    });
}

export { createPR };

