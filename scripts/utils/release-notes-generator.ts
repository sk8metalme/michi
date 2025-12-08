/**
 * リリースノート生成ユーティリティ
 * git logからコミット履歴を取得してリリースノートを生成
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * コミット情報
 */
export interface Commit {
  hash: string;
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking: boolean;
}

/**
 * リリースノート
 */
export interface ReleaseNotes {
  version: string;
  date: string;
  features: Commit[];
  fixes: Commit[];
  breaking: Commit[];
  others: Commit[];
}

/**
 * git logからコミット履歴を取得
 * @param fromTag 開始タグ (省略時は最新タグから)
 * @param toTag 終了タグ (デフォルト: HEAD)
 * @param projectRoot プロジェクトルート
 * @returns コミット一覧
 */
export async function getCommits(
  fromTag?: string,
  toTag: string = 'HEAD',
  projectRoot: string = process.cwd()
): Promise<Commit[]> {
  // 開始タグが指定されていない場合、最新タグを取得
  if (!fromTag) {
    try {
      const { stdout } = await execAsync('git describe --tags --abbrev=0', {
        cwd: projectRoot
      });
      fromTag = stdout.trim();
    } catch {
      // タグが存在しない場合は全コミットを取得
      fromTag = '';
    }
  }

  // git logコマンドを構築
  const range = fromTag ? `${fromTag}..${toTag}` : toTag;
  const command = `git log ${range} --pretty=format:"%H%n%s%n%b%n---END---"`;

  try {
    const { stdout } = await execAsync(command, { cwd: projectRoot });

    const commits: Commit[] = [];
    const commitBlocks = stdout.split('---END---').filter(block => block.trim());

    for (const block of commitBlocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;

      const hash = lines[0];
      const subject = lines[1];
      const body = lines.slice(2).join('\n').trim();

      // Conventional Commitsパターンを解析
      const conventionalPattern = /^(\w+)(\(([^)]+)\))?(!)?:\s*(.+)$/;
      const match = subject.match(conventionalPattern);

      if (match) {
        commits.push({
          hash,
          type: match[1],
          scope: match[3],
          subject: match[5],
          body: body || undefined,
          breaking: !!match[4] || body.includes('BREAKING CHANGE')
        });
      } else {
        // Conventional Commitsに従っていない場合はothersに分類
        commits.push({
          hash,
          type: 'other',
          subject,
          body: body || undefined,
          breaking: body.includes('BREAKING CHANGE')
        });
      }
    }

    return commits;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to get commits:', message);
    return [];
  }
}

/**
 * コミット一覧からリリースノートを生成
 * @param commits コミット一覧
 * @param version リリースバージョン
 * @returns リリースノート
 */
export function generateReleaseNotes(
  commits: Commit[],
  version: string
): ReleaseNotes {
  const notes: ReleaseNotes = {
    version,
    date: new Date().toISOString().split('T')[0],
    features: [],
    fixes: [],
    breaking: [],
    others: []
  };

  for (const commit of commits) {
    if (commit.breaking) {
      notes.breaking.push(commit);
    } else if (commit.type === 'feat') {
      notes.features.push(commit);
    } else if (commit.type === 'fix') {
      notes.fixes.push(commit);
    } else {
      notes.others.push(commit);
    }
  }

  return notes;
}

/**
 * リリースノートをMarkdown形式で出力
 * @param notes リリースノート
 * @returns Markdown文字列
 */
export function formatReleaseNotes(notes: ReleaseNotes): string {
  let markdown = `# Release ${notes.version}\n\n`;
  markdown += `**Release Date**: ${notes.date}\n\n`;

  if (notes.breaking.length > 0) {
    markdown += '## ⚠️ Breaking Changes\n\n';
    for (const commit of notes.breaking) {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      markdown += `- ${scope}${commit.subject} (${commit.hash.substring(0, 7)})\n`;
      if (commit.body) {
        markdown += `  ${commit.body.split('\n').join('\n  ')}\n`;
      }
    }
    markdown += '\n';
  }

  if (notes.features.length > 0) {
    markdown += '## ✨ Features\n\n';
    for (const commit of notes.features) {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      markdown += `- ${scope}${commit.subject} (${commit.hash.substring(0, 7)})\n`;
    }
    markdown += '\n';
  }

  if (notes.fixes.length > 0) {
    markdown += '## 🐛 Bug Fixes\n\n';
    for (const commit of notes.fixes) {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      markdown += `- ${scope}${commit.subject} (${commit.hash.substring(0, 7)})\n`;
    }
    markdown += '\n';
  }

  if (notes.others.length > 0) {
    markdown += '## 📝 Other Changes\n\n';
    for (const commit of notes.others) {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      markdown += `- ${scope}${commit.subject} (${commit.hash.substring(0, 7)})\n`;
    }
    markdown += '\n';
  }

  return markdown;
}

/**
 * リリースノートを生成してMarkdown文字列を返す
 * @param version リリースバージョン
 * @param fromTag 開始タグ
 * @param projectRoot プロジェクトルート
 * @returns Markdown形式のリリースノート
 */
export async function createReleaseNotes(
  version: string,
  fromTag?: string,
  projectRoot: string = process.cwd()
): Promise<string> {
  const commits = await getCommits(fromTag, 'HEAD', projectRoot);
  const notes = generateReleaseNotes(commits, version);
  return formatReleaseNotes(notes);
}
