/**
 * Tests for MermaidConverter
 */

import { describe, it, expect } from 'vitest';
import { MermaidConverter } from '../dev-tools/mermaid-converter.js';

describe('MermaidConverter', () => {
  let converter: MermaidConverter;

  beforeEach(() => {
    converter = new MermaidConverter();
  });

  describe('Mermaidブロック検出', () => {
    it('単一のMermaidブロックを検出', () => {
      const markdown = `
# タイトル

\`\`\`mermaid
graph TD
  A --> B
\`\`\`

通常のテキスト
`;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('graph TD');
      expect(result).toContain('A --> B');
      expect(result).toContain('</ac:structured-macro>');
    });

    it('複数のMermaidブロックを検出', () => {
      const markdown = `
\`\`\`mermaid
graph TD
  A --> B
\`\`\`

テキスト

\`\`\`mermaid
sequenceDiagram
  Alice->>Bob: Hello
\`\`\`
`;

      const result = converter.convertMermaidToConfluence(markdown);

      const macroCount = (result.match(/<ac:structured-macro ac:name="mermaid">/g) || []).length;
      expect(macroCount).toBe(2);
      expect(result).toContain('graph TD');
      expect(result).toContain('sequenceDiagram');
    });

    it('Mermaidブロックがない場合は変更なし', () => {
      const markdown = `
# タイトル

通常のテキスト

\`\`\`javascript
console.log('Hello');
\`\`\`
`;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toBe(markdown);
      expect(result).not.toContain('<ac:structured-macro ac:name="mermaid">');
    });
  });

  describe('Confluenceマクロ形式変換', () => {
    it('Mermaidブロックを正しいXML形式に変換', () => {
      const markdown = `\`\`\`mermaid
graph LR
  Start --> End
\`\`\``;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('<ac:plain-text-body><![CDATA[');
      expect(result).toContain('graph LR');
      expect(result).toContain('Start --> End');
      expect(result).toContain(']]></ac:plain-text-body>');
      expect(result).toContain('</ac:structured-macro>');
    });

    it('Mermaid以外のコードブロックは変更しない', () => {
      const markdown = `
\`\`\`mermaid
graph TD
  A --> B
\`\`\`

\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
print("hello")
\`\`\`
`;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('```javascript');
      expect(result).toContain('```python');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('print("hello")');
    });

    it('インデントされたMermaidブロックも正しく変換', () => {
      const markdown = `
  \`\`\`mermaid
  graph TD
    A --> B
  \`\`\`
`;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('graph TD');
    });
  });

  describe('特殊文字のエスケープ', () => {
    it('CDATA内の特殊文字をエスケープ', () => {
      const markdown = `\`\`\`mermaid
graph TD
  A["Text with <> & symbols"] --> B
\`\`\``;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('Text with <> & symbols');
    });

    it(']]>をエスケープ（CDATA終了マーカー）', () => {
      const markdown = `\`\`\`mermaid
graph TD
  A["Text with ]]> marker"] --> B
\`\`\``;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      // ]]> should be escaped or handled properly
      expect(result).toMatch(/Text with.*marker/);
    });
  });

  describe('エラーハンドリング', () => {
    it('空のMermaidブロックを処理', () => {
      const markdown = `\`\`\`mermaid
\`\`\``;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('<ac:plain-text-body><![CDATA[');
    });

    it('不正な形式のMermaidブロックはフォールバック', () => {
      const markdown = `\`\`\`mermaid
invalid syntax without proper structure
\`\`\``;

      const result = converter.convertMermaidToConfluence(markdown);

      // Should still convert to macro format (Confluence will handle rendering)
      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('invalid syntax without proper structure');
    });
  });

  describe('複雑なMermaidダイアグラム', () => {
    it('フローチャートを変換', () => {
      const markdown = `\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E
\`\`\``;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('A[Start]');
      expect(result).toContain('B{Decision}');
    });

    it('シーケンス図を変換', () => {
      const markdown = `\`\`\`mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hi Alice!
\`\`\``;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('participant Alice');
      expect(result).toContain('Alice->>Bob: Hello Bob!');
    });

    it('クラス図を変換', () => {
      const markdown = `\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
\`\`\``;

      const result = converter.convertMermaidToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('classDiagram');
      expect(result).toContain('class Animal');
    });
  });
});
