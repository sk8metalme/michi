/**
 * Markdown → Confluence Storage Format 変換
 */

import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
});

/**
 * Markdown を Confluence Storage Format (HTML) に変換
 */
export function convertMarkdownToConfluence(markdown: string): string {
  // MarkdownIt でHTMLに変換
  let html = md.render(markdown);
  
  // Confluence固有の変換
  html = convertCodeBlocks(html);
  html = convertTables(html);
  html = convertInfoBoxes(html);
  
  return html;
}

/**
 * コードブロックをConfluenceマクロに変換
 */
function convertCodeBlocks(html: string): string {
  // <pre><code class="language-xxx">...</code></pre>
  // → <ac:structured-macro ac:name="code"><ac:parameter ac:name="language">xxx</ac:parameter>...</ac:structured-macro>
  
  return html.replace(
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (match, lang, code) => {
      const decodedCode = decodeHtmlEntities(code);
      return `<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="language">${lang}</ac:parameter>
  <ac:plain-text-body><![CDATA[${decodedCode}]]></ac:plain-text-body>
</ac:structured-macro>`;
    }
  );
}

/**
 * テーブルをConfluence形式に変換（そのままHTMLでOK）
 */
function convertTables(html: string): string {
  // HTMLテーブルはConfluenceでもサポートされているのでそのまま
  return html;
}

/**
 * 特殊なブロック（> で始まる引用など）をConfluence infoマクロに変換
 */
function convertInfoBoxes(html: string): string {
  // <blockquote>...</blockquote> → <ac:structured-macro ac:name="info">
  let transformed = html.replace(
    /<blockquote>\s*<p><strong>(.*?)<\/strong>:\s*([\s\S]*?)<\/p>\s*<\/blockquote>/g,
    (match, title, content) => {
      return `<ac:structured-macro ac:name="info">
  <ac:parameter ac:name="title">${title}</ac:parameter>
  <ac:rich-text-body>
    <p>${content}</p>
  </ac:rich-text-body>
</ac:structured-macro>`;
    }
  );
  
  // 通常のblockquoteもinfoマクロに
  transformed = transformed.replace(
    /<blockquote>([\s\S]*?)<\/blockquote>/g,
    (match, content) => {
      return `<ac:structured-macro ac:name="info">
  <ac:rich-text-body>
    ${content}
  </ac:rich-text-body>
</ac:structured-macro>`;
    }
  );
  
  return transformed;
}

/**
 * HTMLエンティティをデコード
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': '\'',
    '&nbsp;': ' '
  };
  
  return text.replace(/&[a-z]+;|&#\d+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

/**
 * Confluenceページテンプレートを生成
 */
export interface ConfluencePageOptions {
  title: string;
  githubUrl: string;
  content: string;
  approvers?: string[];
  projectName?: string;
}

export function createConfluencePage(options: ConfluencePageOptions): string {
  const { title, githubUrl, content, approvers = ['企画', '部長'], projectName } = options;
  
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

// CLI実行用
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('fs');
  const { resolve } = await import('path');
  
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: tsx markdown-to-confluence.ts <markdown-file>');
    process.exit(1);
  }
  
  const markdownFile = resolve(args[0]);
  const markdown = readFileSync(markdownFile, 'utf-8');
  const confluenceHtml = convertMarkdownToConfluence(markdown);
  
  console.log(confluenceHtml);
}

