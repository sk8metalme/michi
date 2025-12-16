/**
 * Tests for markdown-to-confluence integration with MermaidConverter
 */

import { describe, it, expect } from 'vitest';
import { convertMarkdownToConfluence } from '../markdown-to-confluence.js';

describe('convertMarkdownToConfluence', () => {
  describe('Mermaid統合', () => {
    it('Mermaidブロックを正しく変換', () => {
      const markdown = `
# Architecture

\`\`\`mermaid
graph TD
  A --> B
\`\`\`

Some text
`;

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('graph TD');
      expect(result).toContain('A --> B');
      expect(result).toContain('<h1>Architecture</h1>');
      expect(result).toContain('<p>Some text</p>');
    });

    it('Mermaidと通常のコードブロックを区別', () => {
      const markdown = `
\`\`\`mermaid
graph TD
  A --> B
\`\`\`

\`\`\`javascript
console.log('Hello');
\`\`\`
`;

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('graph TD');
      expect(result).toContain('<ac:structured-macro ac:name="code">');
      expect(result).toContain('<ac:parameter ac:name="language">javascript</ac:parameter>');
      expect(result).toContain('console.log(\'Hello\');');
    });

    it('複数のMermaidブロックを変換', () => {
      const markdown = `
\`\`\`mermaid
graph TD
  A --> B
\`\`\`

Text

\`\`\`mermaid
sequenceDiagram
  Alice->>Bob: Hello
\`\`\`
`;

      const result = convertMarkdownToConfluence(markdown);

      const macroCount = (result.match(/<ac:structured-macro ac:name="mermaid">/g) || []).length;
      expect(macroCount).toBe(2);
      expect(result).toContain('graph TD');
      expect(result).toContain('sequenceDiagram');
    });
  });

  describe('既存機能の互換性', () => {
    it('通常のMarkdownを変換', () => {
      const markdown = `
# Title

This is a paragraph.

## Subtitle

- Item 1
- Item 2
`;

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
      expect(result).toContain('<p>This is a paragraph.</p>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
    });

    it('コードブロックを変換', () => {
      const markdown = `
\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
print("hello")
\`\`\`
`;

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="code">');
      expect(result).toContain('<ac:parameter ac:name="language">javascript</ac:parameter>');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('<ac:parameter ac:name="language">python</ac:parameter>');
      expect(result).toContain('print("hello")');
    });

    it('引用をInfoマクロに変換', () => {
      const markdown = `
> This is a blockquote
`;

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="info">');
      expect(result).toContain('This is a blockquote');
    });

    it('テーブルを変換', () => {
      const markdown = `
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
`;

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<table>');
      expect(result).toContain('<th>Name</th>');
      expect(result).toContain('<td>Alice</td>');
    });

    it('リンクを変換', () => {
      const markdown = '[Link text](https://example.com)';

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<a href="https://example.com">Link text</a>');
    });

    it('強調とボールドを変換', () => {
      const markdown = '**bold** and *italic*';

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });
  });

  describe('複雑なドキュメント', () => {
    it('Mermaidと通常のMarkdownを含むドキュメント', () => {
      const markdown = `
# System Architecture

## Overview

This is the system architecture.

\`\`\`mermaid
graph TD
  A[Frontend] --> B[API Gateway]
  B --> C[Microservice 1]
  B --> D[Microservice 2]
\`\`\`

## Components

### Frontend

The frontend is built with React.

\`\`\`javascript
import React from 'react';
\`\`\`

### Backend

\`\`\`mermaid
sequenceDiagram
  Client->>API: Request
  API->>Service: Process
  Service-->>API: Response
  API-->>Client: Result
\`\`\`

> **Note**: This is a simplified diagram.

## Deployment

| Environment | URL |
|-------------|-----|
| Dev | dev.example.com |
| Prod | example.com |
`;

      const result = convertMarkdownToConfluence(markdown);

      // Mermaidブロックが変換されている
      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      const mermaidCount = (result.match(/<ac:structured-macro ac:name="mermaid">/g) || []).length;
      expect(mermaidCount).toBe(2);

      // 通常のコードブロックが変換されている
      expect(result).toContain('<ac:structured-macro ac:name="code">');
      expect(result).toContain('import React from \'react\';');

      // Markdownの基本要素が変換されている
      expect(result).toContain('<h1>System Architecture</h1>');
      expect(result).toContain('<h2>Overview</h2>');
      expect(result).toContain('<h3>Frontend</h3>');

      // 引用が変換されている
      expect(result).toContain('<ac:structured-macro ac:name="info">');

      // テーブルが変換されている
      expect(result).toContain('<table>');
      expect(result).toContain('dev.example.com');
    });
  });

  describe('エッジケース', () => {
    it('空文字列を処理', () => {
      const result = convertMarkdownToConfluence('');

      expect(result).toBe('');
    });

    it('Mermaidブロックのみ', () => {
      const markdown = `\`\`\`mermaid
graph TD
  A --> B
\`\`\``;

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<ac:structured-macro ac:name="mermaid">');
      expect(result).toContain('graph TD');
    });

    it('通常のMarkdownのみ（Mermaidなし）', () => {
      const markdown = '# Title\n\nParagraph';

      const result = convertMarkdownToConfluence(markdown);

      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<p>Paragraph</p>');
      expect(result).not.toContain('mermaid');
    });
  });
});
