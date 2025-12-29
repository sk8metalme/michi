/**
 * Confluence Approval Flow
 * ページの承認フロー機能を提供
 */

import MarkdownIt from 'markdown-it';
import type { ConfluencePageOptions } from './types.js';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

/**
 * HTMLエンティティをデコード
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': '\'',
    '&amp;': '&'
  };
  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

/**
 * CDATA内の特殊文字をエスケープ
 */
function escapeCDATA(text: string): string {
  return text.replace(/]]>/g, ']]]]><![CDATA[>');
}

/**
 * Markdown形式のコードブロックをConfluence形式に変換
 */
function convertCodeBlocks(html: string): string {
  return html.replace(
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang, code) => {
      const decodedCode = decodeHtmlEntities(code);
      const escapedCode = escapeCDATA(decodedCode);
      return `<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="language">${lang}</ac:parameter>
  <ac:plain-text-body><![CDATA[${escapedCode}]]></ac:plain-text-body>
</ac:structured-macro>`;
    }
  );
}

/**
 * Markdownの情報ボックスをConfluence形式に変換
 */
function convertInfoBoxes(html: string): string {
  let transformed = html;

  transformed = transformed.replace(
    /<blockquote>\s*<p>\s*💡\s*(.*?)<\/p>\s*<\/blockquote>/gs,
    (_match, content) => {
      return `<ac:structured-macro ac:name="info">
  <ac:rich-text-body><p>${content.trim()}</p></ac:rich-text-body>
</ac:structured-macro>`;
    }
  );

  return transformed;
}

/**
 * Markdown形式のテーブルをConfluence形式に変換
 */
function convertTables(html: string): string {
  return html.replace(
    /<table>([\s\S]*?)<\/table>/g,
    (_match, tableContent) => {
      return `<table>${tableContent}</table>`;
    }
  );
}

/**
 * MarkdownをConfluence Storage形式に変換
 */
export function convertMarkdownToConfluence(markdown: string): string {
  let html = md.render(markdown);

  html = convertCodeBlocks(html);
  html = convertInfoBoxes(html);
  html = convertTables(html);
  html = html.replace(/<code>(.*?)<\/code>/g, '<code>$1</code>');

  return html;
}

/**
 * Confluenceページを作成（承認フロー付き）
 */
export function createConfluencePage(options: ConfluencePageOptions): string {
  const { githubUrl, content, approvers = ['企画', '部長'], projectName } = options;

  const approversList = approvers.map(a => a.startsWith('@') ? a : `@${a}`).join(',');

  return `
<ac:structured-macro ac:name="info">
  <ac:parameter ac:name="title">GitHub連携</ac:parameter>
  <ac:rich-text-body>
    <p>📄 最新版は <a href="${githubUrl}">GitHub</a> で管理</p>
    <p>編集はGitHubで行い、自動同期されます</p>
    ${projectName ? `<p><strong>プロジェクト</strong>: ${projectName}</p>` : ''}
  </ac:rich-text-body>
</ac:structured-macro>

<hr/>

${content}

<hr/>

<ac:structured-macro ac:name="page-properties">
  <ac:parameter ac:name="approval">${approversList}</ac:parameter>
  <ac:parameter ac:name="status">レビュー待ち</ac:parameter>
</ac:structured-macro>
`.trim();
}
