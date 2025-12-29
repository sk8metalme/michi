/**
 * ADF (Atlassian Document Format) Converter
 *
 * Markdown形式のテキストをJIRAのADF形式に変換する機能を提供
 */

import type { ADFDocument, ADFNode, StoryDetails } from './types.js';

/**
 * プレーンテキストをADF形式に変換
 */
export function textToADF(text: string): ADFDocument {
  // 改行で分割して段落を作成
  const paragraphs = text.split('\n').filter((line) => line.trim().length > 0);

  return {
    type: 'doc',
    version: 1,
    content: paragraphs.map((para) => ({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: para.trim(),
        },
      ],
    })),
  };
}

/**
 * リッチなADF形式を生成
 */
export function createRichADF(
  details: StoryDetails,
  phaseLabel: string,
  githubUrl: string,
): ADFDocument {
  const content: ADFNode[] = [];

  // 説明セクション
  if (details.description) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '説明' }],
    });
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: details.description }],
    });
  }

  // メタデータセクション
  const metadata: string[] = [];
  if (details.priority) metadata.push(`優先度: ${details.priority}`);
  if (details.estimate) metadata.push(`見積もり: ${details.estimate}`);
  if (details.assignee) metadata.push(`担当: ${details.assignee}`);
  if (details.dependencies) metadata.push(`依存関係: ${details.dependencies}`);

  if (metadata.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'メタデータ' }],
    });
    metadata.forEach((item) => {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: item }],
      });
    });
  }

  // 完了条件セクション
  if (details.acceptanceCriteria && details.acceptanceCriteria.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '完了条件' }],
    });

    const listItems = details.acceptanceCriteria.map((criterion) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: criterion }],
        },
      ],
    }));

    content.push({
      type: 'bulletList',
      content: listItems,
    });
  }

  // サブタスクセクション
  if (details.subtasks && details.subtasks.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'サブタスク' }],
    });

    const listItems = details.subtasks.map((subtask) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: subtask }],
        },
      ],
    }));

    content.push({
      type: 'bulletList',
      content: listItems,
    });
  }

  // フッター（Phase、GitHubリンク）
  content.push({
    type: 'rule',
  });
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Phase: ', marks: [{ type: 'strong' }] },
      { type: 'text', text: phaseLabel },
    ],
  });
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: 'GitHub: ', marks: [{ type: 'strong' }] },
      {
        type: 'text',
        text: githubUrl,
        marks: [
          {
            type: 'link',
            attrs: { href: githubUrl },
          },
        ],
      },
    ],
  });

  return {
    type: 'doc',
    version: 1,
    content: content,
  };
}
