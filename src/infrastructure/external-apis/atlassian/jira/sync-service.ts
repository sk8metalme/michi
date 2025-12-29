/**
 * JIRA Sync Service
 *
 * tasks.mdからJIRA Epic/Story/Subtaskを自動作成するメインサービス
 *
 * 【重要】Epic Link について:
 * JIRA Cloud では Story を Epic に紐付けるには、Epic Link カスタムフィールド
 * （通常 customfield_10014）を使用する必要があります。
 *
 * 現在の実装では parent フィールドを使用していますが、これは Subtask 専用です。
 * Story 作成時に 400 エラーが発生する可能性があります。
 *
 * 対処方法:
 * 1. JIRA 管理画面で Epic Link のカスタムフィールドIDを確認
 * 2. 環境変数 JIRA_EPIC_LINK_FIELD に設定（例: customfield_10014）
 * 3. または、Story 作成後に手動で Epic Link を設定
 *
 * 参考: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
 */

import { resolve } from 'path';
import { loadProjectMeta } from '../../../../../scripts/utils/project-meta.js';
import { validateFeatureNameOrThrow } from '../../../../../scripts/utils/feature-name-validator.js';
import { getConfig, getConfigPath } from '../../../../../scripts/utils/config-loader.js';
import { validateForJiraSyncAsync } from '../../../../../scripts/utils/config-validator.js';
import {
  updateSpecJsonAfterJiraSync,
  type SpecJson,
} from '../../../../../scripts/utils/spec-updater.js';
import { safeReadFileOrThrow } from '../../../../../scripts/utils/safe-file-reader.js';
import { JIRAClient } from './client.js';
import type { JIRAConfig, JiraIssue, JIRAIssuePayload } from './types.js';
import { createRichADF } from './adf-converter.js';
import {
  extractRepoName,
  createTitlePrefix,
  extractStoryDetails,
  getStoryIssueTypeId,
  getOrCreateEpic,
} from './issue-builder.js';
import { detectPhaseLabel } from './status-mapper.js';

/**
 * JIRA認証設定を取得
 */
export function getJIRAConfig(): JIRAConfig {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;

  if (!url || !email || !apiToken) {
    throw new Error('Missing JIRA credentials in .env');
  }

  return { url, email, apiToken };
}

/**
 * リクエスト間の待機時間（ミリ秒）
 * 環境変数 ATLASSIAN_REQUEST_DELAY で調整可能（デフォルト: 500ms）
 */
function getRequestDelay(): number {
  return parseInt(process.env.ATLASSIAN_REQUEST_DELAY || '500', 10);
}

/**
 * JIRA同期メイン処理
 * tasks.mdを解析してEpicとStoryをJIRAに作成
 *
 * @param featureName 機能名（例: "onion-architecture"）
 */
export async function syncTasksToJIRA(featureName: string): Promise<void> {
  console.log(`Syncing tasks for feature: ${featureName}`);

  // feature名のバリデーション（必須）
  validateFeatureNameOrThrow(featureName);

  // 実行前の必須設定値チェック（非同期版：Issue Type IDの存在チェック付き）
  const validation = await validateForJiraSyncAsync();

  if (validation.info.length > 0) {
    validation.info.forEach((msg) => console.log(`ℹ️  ${msg}`));
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach((warning) => console.warn(`   ${warning}`));
  }

  if (validation.errors.length > 0) {
    console.error('❌ Configuration errors:');
    validation.errors.forEach((error) => console.error(`   ${error}`));
    const configPath = getConfigPath();
    console.error(`\n設定ファイル: ${configPath}`);
    throw new Error(
      'JIRA同期に必要な設定値が不足しています。上記のエラーを確認して設定を修正してください。',
    );
  }

  console.log(
    `⏳ Request delay: ${getRequestDelay()}ms (set ATLASSIAN_REQUEST_DELAY to adjust)`,
  );

  // 設定からissue type IDを取得（検索と作成の両方で使用）
  const appConfig = getConfig();
  const projectMeta = loadProjectMeta();
  const config = getJIRAConfig();
  const client = new JIRAClient(config);

  // リポジトリ名を取得（タイトルプレフィックス用）
  const repoName = extractRepoName(projectMeta.repository);
  const titlePrefix = createTitlePrefix(repoName, featureName);

  // StoryタイプのIDを取得
  const storyIssueTypeId = await getStoryIssueTypeId(
    appConfig,
    projectMeta,
    client,
  );

  const tasksPath = resolve(`.kiro/specs/${featureName}/tasks.md`);
  const tasksContent = safeReadFileOrThrow(tasksPath);

  // spec.jsonを読み込んで既存のEpicキーを確認
  const specPath = resolve(`.kiro/specs/${featureName}/spec.json`);
  let spec: SpecJson = {};
  try {
    spec = JSON.parse(safeReadFileOrThrow(specPath)) as SpecJson;
  } catch {
    console.error('spec.json not found or invalid');
  }

  // Epic を取得または作成
  const epic = await getOrCreateEpic(featureName, spec, projectMeta, client);

  // 既存のStoryを検索（重複防止）
  // ラベルで検索（summary検索では "Story: タイトル" 形式に一致しないため）
  // issuetype検索にはIDを使用（名前は言語依存のため）
  const storyJql = `project = ${projectMeta.jiraProjectKey} AND issuetype = ${storyIssueTypeId} AND labels = "${featureName}"`;
  let existingStories: JiraIssue[] = [];
  try {
    existingStories = await client.searchIssues(storyJql);
  } catch (error) {
    console.error(
      '❌ Failed to search existing Stories:',
      error instanceof Error ? error.message : error,
    );
    console.error(
      '⚠️  Cannot verify idempotency - Story creation may result in duplicates',
    );
    console.error(
      '⚠️  Continuing with story creation (duplicates may be created)...',
    );
    // 検索失敗時も処理を継続（既存ストーリーなしとして扱う）
    existingStories = [];
  }

  const existingStorySummaries = new Set(
    existingStories
      .filter((s: JiraIssue) => s?.fields?.summary)
      .map((s: JiraIssue) => s.fields!.summary),
  );
  const existingStoryKeys = new Set(
    existingStories
      .filter((s: JiraIssue) => s?.key)
      .map((s: JiraIssue) => s.key),
  );

  console.log(
    `Found ${existingStories.length} existing stories for this feature`,
  );

  // フェーズラベル検出用の正規表現
  // Phase X: フェーズ名（ラベル）の形式を検出
  // Phase番号: 数字（0, 1, 2...）、ドット付き数字（0.1, 0.2...）、英字（A, B）に対応
  const phasePattern = /## Phase [\d.A-Z]+:\s*(.+?)(?:（(.+?)）)?/;

  // Story作成（フェーズ検出付きパーサー）
  const lines = tasksContent.split('\n');
  let currentPhaseLabel = 'implementation'; // デフォルトは実装フェーズ
  const createdStories: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // フェーズ検出
    const detectedPhase = detectPhaseLabel(line);
    if (detectedPhase) {
      currentPhaseLabel = detectedPhase;

      // ログ出力用にphaseTitle と phaseNumber を抽出
      const phaseMatch = line.match(phasePattern);
      const phaseTitle = phaseMatch ? phaseMatch[1] : '';
      const phaseNumberMatch = line.match(/## Phase ([\d.A-Z]+):/);
      const phaseNumber = phaseNumberMatch ? phaseNumberMatch[1] : '';

      console.log(
        `📌 Phase detected: ${phaseTitle} (number: ${phaseNumber}, label: ${currentPhaseLabel})`,
      );
      continue;
    }

    // Story検出
    const storyMatch = line.match(/### Story [\d.]+: (.+)/);
    if (!storyMatch) continue;

    const storyTitle = storyMatch[1];
    const storySummary = `${titlePrefix} Story: ${storyTitle}`;

    // 既に同じタイトルのStoryが存在するかチェック
    if (existingStorySummaries.has(storySummary)) {
      console.log(`Skipping Story (already exists): ${storyTitle}`);
      const existing = existingStories.find(
        (s: JiraIssue) => s?.fields?.summary === storySummary,
      );
      if (existing) {
        createdStories.push(existing.key);
        existingStoryKeys.add(existing.key);
      } else {
        console.warn(
          `⚠️  Warning: Story "${storyTitle}" is in summary set but not found in existingStories array`,
        );
      }
      continue;
    }

    console.log(`Creating Story: ${storyTitle} [${currentPhaseLabel}]`);

    try {
      // Storyの詳細情報を抽出（新しい実装を使用）
      const storyDetails = extractStoryDetails(tasksContent, storyTitle);

      // GitHubリンク
      const githubUrl = `${projectMeta.repository}/tree/main/.kiro/specs/${featureName}/tasks.md`;

      // リッチなADF形式で説明文を生成
      const richDescription = createRichADF(
        storyDetails,
        currentPhaseLabel,
        githubUrl,
      );

      // 優先度のマッピング（デフォルト: Medium）
      const priorityMap: { [key: string]: string } = {
        High: 'High',
        Medium: 'Medium',
        Low: 'Low',
      };
      const priority =
        storyDetails.priority && priorityMap[storyDetails.priority]
          ? priorityMap[storyDetails.priority]
          : 'Medium';

      // 見積もり（Story Points）を取得
      let storyPoints: number | undefined;
      if (storyDetails.estimate) {
        const spMatch = storyDetails.estimate.match(/(\d+)\s*SP/);
        if (spMatch) {
          storyPoints = parseInt(spMatch[1], 10);
        }
      }

      // JIRAペイロードを作成（issue type IDは既に取得済み）
      const storyPayload: JIRAIssuePayload = {
        fields: {
          project: { key: projectMeta.jiraProjectKey },
          summary: storySummary,
          description: richDescription, // リッチなADF形式
          issuetype: { id: storyIssueTypeId },
          labels: [
            ...projectMeta.confluenceLabels,
            featureName,
            currentPhaseLabel,
          ],
          priority: { name: priority },
        },
      };

      // 期限（Due Date）を設定
      if (storyDetails.dueDate) {
        storyPayload.fields.duedate = storyDetails.dueDate; // YYYY-MM-DD形式
      }

      // Story Pointsを設定（カスタムフィールド）
      // 注意: JIRAプロジェクトによってカスタムフィールドIDが異なる場合があります
      // 環境変数 JIRA_STORY_POINTS_FIELD で設定可能（例: customfield_10016）
      if (storyPoints !== undefined) {
        const storyPointsField =
          process.env.JIRA_STORY_POINTS_FIELD || 'customfield_10016';
        storyPayload.fields[storyPointsField] = storyPoints;
      }

      // 担当者を設定（アカウントIDが必要な場合があるため、オプション）
      // 注意: JIRAのアカウントIDが必要な場合があります
      // if (storyInfo?.assignee) {
      //   storyPayload.fields.assignee = { name: storyInfo.assignee };
      // }

      const story = await client.createIssue(storyPayload);
      console.log(`  ✅ Story created: ${story.key} [${currentPhaseLabel}]`);

      // 期限とStory Pointsの情報を表示
      if (storyDetails.dueDate) {
        console.log(`     期限: ${storyDetails.dueDate}`);
      }
      if (storyDetails.estimate) {
        console.log(`     見積もり: ${storyDetails.estimate}`);
      }
      if (storyPoints !== undefined) {
        console.log(`     Story Points: ${storyPoints} SP`);
      }

      createdStories.push(story.key);

      // 進捗表示（大量作成時の見通し向上）
      if (createdStories.length % 5 === 0) {
        console.log(
          `  📊 Progress: ${createdStories.length} stories created so far...`,
        );
      }

      // Epic Linkは手動設定が必要（JIRA Cloudの制約）
      console.log(`  ℹ️  Epic: ${epic.key} に手動でリンクしてください`);
    } catch (error: unknown) {
      console.error(
        `  ❌ Failed to create Story "${storyTitle}":`,
        error instanceof Error ? error.message : error,
      );

      // JIRA APIエラーの詳細を表示
      const errorObj = error as { response?: { data?: { errors?: Record<string, unknown> } } };
      if (errorObj.response?.data) {
        console.error(
          '  📋 JIRA API Error Details:',
          JSON.stringify(errorObj.response.data, null, 2),
        );

        // Story Pointsフィールドのエラーの場合、警告を表示
        if (
          errorObj.response.data.errors &&
          Object.keys(errorObj.response.data.errors).some((key) =>
            key.includes('customfield'),
          )
        ) {
          console.error('  ⚠️  Story Pointsフィールドの設定に失敗しました。');
          console.error(
            '  💡 環境変数 JIRA_STORY_POINTS_FIELD を正しいカスタムフィールドIDに設定してください。',
          );
          console.error(
            '  💡 JIRA管理画面でStory PointsのカスタムフィールドIDを確認してください。',
          );
        }
      }

      // エラーがあっても他のStoryの作成は継続
    }
  }

  // 新規作成数と再利用数を正確に計算
  const newStoryCount = createdStories.filter(
    (key) => !existingStoryKeys.has(key),
  ).length;
  const reusedStoryCount = createdStories.filter((key) =>
    existingStoryKeys.has(key),
  ).length;

  console.log('\n✅ JIRA sync completed');
  console.log(`   Epic: ${epic.key}`);
  console.log(
    `   Stories: ${createdStories.length} processed (${newStoryCount} new, ${reusedStoryCount} reused)`,
  );

  // spec.json を更新（配列クリア前に実行）
  const jiraBaseUrl = process.env.ATLASSIAN_URL || '';
  try {
    updateSpecJsonAfterJiraSync(featureName, {
      projectKey: projectMeta.jiraProjectKey,
      epicKey: epic.key,
      epicUrl: `${jiraBaseUrl}/browse/${epic.key}`,
      storyKeys: createdStories,
    });
  } catch (error) {
    console.warn(
      `⚠️  Failed to update spec.json after JIRA sync: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    // spec.json更新の失敗はスクリプト全体の失敗とはしない（JIRA同期は成功しているため）
  }

  // メモリリーク対策: 配列をクリア
  existingStories.length = 0;
  createdStories.length = 0;
  existingStorySummaries.clear();
  existingStoryKeys.clear();

  // JIRAClientのリソースをクリーンアップ
  client.dispose();
}
