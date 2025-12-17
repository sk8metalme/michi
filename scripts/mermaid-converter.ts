/**
 * MermaidダイアグラムをConfluenceマクロ形式に変換
 */

/**
 * MermaidConverter
 * MarkdownテキストからMermaidブロックを検出し、Confluenceマクロ形式に変換
 */
export class MermaidConverter {
  /**
   * MarkdownテキストからMermaidブロックをConfluenceマクロ形式に変換
   *
   * @param markdown Markdownテキスト
   * @returns 変換後のテキスト
   */
  convertMermaidToConfluence(markdown: string): string {
    // Mermaidブロックを検出する正規表現
    // ```mermaid\n([\s\S]*?)\n```
    const mermaidBlockRegex = /```mermaid\n([\s\S]*?)```/g;

    // Mermaidブロックを検出
    const matches = markdown.matchAll(mermaidBlockRegex);
    let hasMatches = false;

    for (const _match of matches) {
      hasMatches = true;
      break;
    }

    // Mermaidブロックがない場合は変更なし
    if (!hasMatches) {
      return markdown;
    }

    // Mermaidブロックを Confluence マクロ形式に変換
    const converted = markdown.replace(mermaidBlockRegex, (match, diagram) => {
      // 前後の空白を削除
      const trimmedDiagram = diagram.trim();

      // CDATA終了マーカー ]]> をエスケープ
      const escapedDiagram = this.escapeCDATA(trimmedDiagram);

      // Confluenceマクロ形式に変換
      return `<ac:structured-macro ac:name="mermaid">
  <ac:plain-text-body><![CDATA[${escapedDiagram}]]></ac:plain-text-body>
</ac:structured-macro>`;
    });

    return converted;
  }

  /**
   * CDATA内の ]]> をエスケープ
   *
   * @param text テキスト
   * @returns エスケープ後のテキスト
   */
  private escapeCDATA(text: string): string {
    // ]]> を ]]]]><![CDATA[> に置換してエスケープ
    return text.replace(/]]>/g, ']]]]><![CDATA[>');
  }
}
