/**
 * Confluence階層構造作成ロジック
 * 各パターン（single, by-section, by-hierarchy, manual）に対応
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { ConfluenceClient } from '../confluence-sync.js';
import { convertMarkdownToConfluence, createConfluencePage } from '../markdown-to-confluence.js';
import type { ProjectMetadata } from './project-meta.js';
import type { ConfluenceConfig, ConfluencePageCreationGranularity } from '../config/config-schema.js';

/**
 * ページ作成結果
 */
export interface PageCreationResult {
  url: string;
  pageId: string;
  title: string;
}

/**
 * 階層構造作成結果
 */
export interface HierarchyCreationResult {
  pages: PageCreationResult[];
  parentPageId?: string;
}

/**
 * タイトルに変数を展開
 */
function expandTitleTemplate(
  template: string,
  projectMeta: ProjectMetadata,
  featureName: string,
  docType: string,
  sectionTitle?: string
): string {
  const docTypeLabels: Record<string, string> = {
    requirements: '要件定義',
    design: '設計',
    tasks: 'タスク分割'
  };
  
  return template
    .replace(/{projectName}/g, projectMeta.projectName)
    .replace(/{featureName}/g, featureName)
    .replace(/{docTypeLabel}/g, docTypeLabels[docType] || docType)
    .replace(/{sectionTitle}/g, sectionTitle || '')
    .trim();
}

/**
 * ラベルに変数を展開
 */
function expandLabels(
  labels: string[],
  projectMeta: ProjectMetadata,
  featureName: string,
  docType: string
): string[] {
  return labels.map(label =>
    label
      .replace(/{projectLabel}/g, projectMeta.confluenceLabels[0] || '')
      .replace(/{docType}/g, docType)
      .replace(/{featureName}/g, featureName)
  ).filter(label => label.length > 0);
}

/**
 * 指定されたセクションパターンに一致するセクションを抽出
 */
function extractSectionsFromMarkdown(
  markdown: string,
  sectionPatterns: string[]
): string {
  const lines = markdown.split('\n');
  const extractedSections: string[] = [];
  let inSection = false;
  let currentSection = '';
  let matchedPattern: string | null = null;
  
  for (const line of lines) {
    // セクション開始をチェック
    if (!inSection) {
      for (const pattern of sectionPatterns) {
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^##+\\s+${escapedPattern}`);
        if (regex.test(line)) {
          inSection = true;
          matchedPattern = pattern;
          currentSection = line + '\n';
          break;
        }
      }
    } else {
      // セクション内の処理
      currentSection += line + '\n';
      
      // 次のセクション（同じレベル以上）が見つかったら終了
      const nextSectionMatch = line.match(/^(##+)\s+/);
      if (nextSectionMatch && matchedPattern) {
        const currentLevel = nextSectionMatch[1].length;
        // 現在のセクションのレベルを確認
        const firstLineMatch = currentSection.match(/^(##+)\s+/);
        if (firstLineMatch) {
          const firstLevel = firstLineMatch[1].length;
          // 同じレベル以上のセクションが見つかったら終了
          if (currentLevel <= firstLevel) {
            // 現在のセクションを保存（次のセクションの行を除く）
            // currentSectionから最後に追加した行（line）を除く
            const lines = currentSection.split('\n');
            lines.pop(); // 最後の空行を削除
            if (lines.length > 0 && lines[lines.length - 1] === line) {
              lines.pop(); // 次のセクションの行を削除
            }
            const sectionContent = lines.join('\n');
            if (sectionContent.trim()) {
              extractedSections.push(sectionContent.trim());
            }
            inSection = false;
            matchedPattern = null;
            currentSection = '';
            
            // 新しいセクションがパターンに一致するかチェック
            for (const pattern of sectionPatterns) {
              const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`^##+\\s+${escapedPattern}`);
              if (regex.test(line)) {
                inSection = true;
                matchedPattern = pattern;
                currentSection = line + '\n';
                break;
              }
            }
          }
        }
      }
    }
  }
  
  // 最後のセクションを追加
  if (inSection && currentSection.trim()) {
    extractedSections.push(currentSection.trim());
  }
  
  return extractedSections.join('\n\n');
}

/**
 * Markdownをセクションごとに分割
 * 空のセクション（タイトルのみで内容がない）は除外
 */
function splitMarkdownBySections(markdown: string): Array<{ title: string; content: string }> {
  const lines = markdown.split('\n');
  const sections: Array<{ title: string; content: string }> = [];
  let currentSection: { title: string; content: string } | null = null;
  
  for (const line of lines) {
    // ## で始まる行をセクションタイトルとして認識
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      // 前のセクションを保存（空でない場合のみ）
      if (currentSection) {
        // タイトル行を除いた内容をチェック
        const contentWithoutTitle = currentSection.content.replace(/^##+\s+.*\n/, '').trim();
        if (contentWithoutTitle.length > 0) {
          sections.push(currentSection);
        }
      }
      // 新しいセクションを開始
      currentSection = {
        title: sectionMatch[1].trim(),
        content: line + '\n'
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }
  
  // 最後のセクションを保存（空でない場合のみ）
  if (currentSection) {
    const contentWithoutTitle = currentSection.content.replace(/^##+\s+.*\n/, '').trim();
    if (contentWithoutTitle.length > 0) {
      sections.push(currentSection);
    }
  }
  
  return sections;
}

/**
 * 親ページを作成または取得
 */
async function getOrCreateParentPage(
  client: ConfluenceClient,
  spaceKey: string,
  parentTitle: string,
  projectMeta: ProjectMetadata,
  featureName: string,
  githubUrl: string
): Promise<string> {
  // 既存の親ページを検索
  const existingParent = await client.searchPage(spaceKey, parentTitle);
  if (existingParent) {
    return existingParent.id;
  }
  
  // 親ページを作成
  const parentContent = createConfluencePage({
    title: parentTitle,
    githubUrl: `${projectMeta.repository}/tree/main/.kiro/specs/${featureName}`,
    content: `<p>機能: <strong>${featureName}</strong></p><p>このページの下に、要件定義・設計・タスク分割のページが配置されます。</p>`,
    approvers: projectMeta.stakeholders,
    projectName: projectMeta.projectName
  });
  
  const parentLabels = expandLabels(
    ['{projectLabel}', '{featureName}', 'github-sync'],
    projectMeta,
    featureName,
    ''
  );
  
  const created = await client.createPage(spaceKey, parentTitle, parentContent, parentLabels);
  console.log(`✅ Parent page created: ${parentTitle}`);
  
  return created.id;
}

/**
 * パターン1: single（1ドキュメント = 1ページ）
 */
export async function createSinglePage(
  client: ConfluenceClient,
  spaceKey: string,
  markdown: string,
  config: ConfluenceConfig,
  projectMeta: ProjectMetadata,
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks',
  githubUrl: string
): Promise<HierarchyCreationResult> {
  const pageTitleFormat = config.pageTitleFormat || '[{projectName}] {featureName} {docTypeLabel}';
  const pageTitle = expandTitleTemplate(
    pageTitleFormat,
    projectMeta,
    featureName,
    docType
  );
  
  const confluenceContent = convertMarkdownToConfluence(markdown);
  const fullContent = createConfluencePage({
    title: pageTitle,
    githubUrl,
    content: confluenceContent,
    approvers: projectMeta.stakeholders,
    projectName: projectMeta.projectName
  });
  
  const labels = expandLabels(config.autoLabels, projectMeta, featureName, docType);
  
  // 既存ページを検索
  const existingPage = await client.searchPage(spaceKey, pageTitle);
  
  let page: any;
  if (existingPage) {
    page = await client.updatePage(
      existingPage.id,
      pageTitle,
      fullContent,
      existingPage.version.number
    );
    console.log(`✅ Page updated: ${pageTitle}`);
  } else {
    page = await client.createPage(spaceKey, pageTitle, fullContent, labels);
    console.log(`✅ Page created: ${pageTitle}`);
  }
  
  const baseUrl = process.env.ATLASSIAN_URL || '';
  return {
    pages: [{
      url: `${baseUrl}/wiki${page._links.webui}`,
      pageId: page.id,
      title: pageTitle
    }]
  };
}

/**
 * パターン2: by-section（セクションごとにページ分割）
 */
export async function createBySectionPages(
  client: ConfluenceClient,
  spaceKey: string,
  markdown: string,
  config: ConfluenceConfig,
  projectMeta: ProjectMetadata,
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks',
  githubUrl: string
): Promise<HierarchyCreationResult> {
  const sections = splitMarkdownBySections(markdown);
  const pages: PageCreationResult[] = [];
  
  const pageTitleFormat = config.pageTitleFormat || '[{projectName}] {featureName} {docTypeLabel}';
  
  for (const section of sections) {
    // sectionTitleを含む一意のタイトルを生成
    // pageTitleFormatに{sectionTitle}が含まれていない場合は追加
    const titleTemplate = pageTitleFormat.includes('{sectionTitle}')
      ? pageTitleFormat
      : `${pageTitleFormat} - {sectionTitle}`;
    
    const pageTitle = expandTitleTemplate(
      titleTemplate,
      projectMeta,
      featureName,
      docType,
      section.title
    );
    
    const confluenceContent = convertMarkdownToConfluence(section.content);
    const fullContent = createConfluencePage({
      title: pageTitle,
      githubUrl,
      content: confluenceContent,
      approvers: projectMeta.stakeholders,
      projectName: projectMeta.projectName
    });
    
    const labels = expandLabels(config.autoLabels, projectMeta, featureName, docType);
    
    // 既存ページを検索
    const existingPage = await client.searchPage(spaceKey, pageTitle);
    
    let page: any;
    if (existingPage) {
      page = await client.updatePage(
        existingPage.id,
        pageTitle,
        fullContent,
        existingPage.version.number
      );
      console.log(`✅ Page updated: ${pageTitle}`);
    } else {
      page = await client.createPage(spaceKey, pageTitle, fullContent, labels);
      console.log(`✅ Page created: ${pageTitle}`);
    }
    
    const baseUrl = process.env.ATLASSIAN_URL || '';
    pages.push({
      url: `${baseUrl}/wiki${page._links.webui}`,
      pageId: page.id,
      title: pageTitle
    });
  }
  
  return { pages };
}

/**
 * パターン3: by-hierarchy simple（親ページ + ドキュメントタイプ子ページ）
 */
export async function createByHierarchySimplePages(
  client: ConfluenceClient,
  spaceKey: string,
  markdown: string,
  config: ConfluenceConfig,
  projectMeta: ProjectMetadata,
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks',
  githubUrl: string
): Promise<HierarchyCreationResult> {
  // 親ページを作成または取得
  const parentTitle = expandTitleTemplate(
    config.hierarchy?.parentPageTitle || '[{projectName}] {featureName}',
    projectMeta,
    featureName,
    ''
  );
  
  const parentPageId = await getOrCreateParentPage(
    client,
    spaceKey,
    parentTitle,
    projectMeta,
    featureName,
    githubUrl
  );
  
  // ドキュメントタイプの子ページを作成（featureNameを含む一意のタイトル）
  const pageTitleFormat = config.pageTitleFormat || '[{projectName}] {featureName} {docTypeLabel}';
  let childPageTitle = expandTitleTemplate(
    pageTitleFormat,
    projectMeta,
    featureName,
    docType
  );
  
  // タイトルに機能名が含まれていない場合、自動的に追加（重複を避けるため）
  if (!childPageTitle.includes(featureName)) {
    console.warn(`⚠️  Warning: pageTitleFormat does not include {featureName}. Adding feature name to ensure uniqueness.`);
    childPageTitle = `[${featureName}] ${childPageTitle}`;
  }
  
  const confluenceContent = convertMarkdownToConfluence(markdown);
  const fullContent = createConfluencePage({
    title: childPageTitle,
    githubUrl,
    content: confluenceContent,
    approvers: projectMeta.stakeholders,
    projectName: projectMeta.projectName
  });
  
  const labels = expandLabels(config.autoLabels, projectMeta, featureName, docType);
  
  // 既存の子ページを検索（親ページIDで絞り込んで検索）
  // これにより、同じタイトルでも別機能のページがヒットすることを防ぐ
  console.log(`🔍 Searching for existing child page: "${childPageTitle}" under parent ${parentPageId}`);
  let existingChild = await client.searchPage(spaceKey, childPageTitle, parentPageId);
  
  // CQLクエリで見つからない場合、親ページIDなしで検索（既存ページが別の親の下にある可能性）
  if (!existingChild) {
    console.log(`  CQL search found nothing, trying search without parent filter`);
    existingChild = await client.searchPage(spaceKey, childPageTitle);
    if (existingChild) {
      console.log(`  ⚠️  Found page with same title: ${existingChild.id}, verifying parent page ID`);
      
      // 見つかったページの実際の親ページIDを取得して検証
      const actualParentId = await client.getPageParentId(existingChild.id);
      
      if (actualParentId === parentPageId) {
        // 親ページIDが一致する場合、更新を続行
        console.log(`  ✅ Parent page ID matches (${parentPageId}), proceeding with update`);
      } else {
        // 親ページIDが一致しない場合、エラーをスロー
        console.error(`  ❌ Parent page ID mismatch!`);
        console.error(`     Expected parent: ${parentPageId}`);
        console.error(`     Actual parent: ${actualParentId || 'root (no parent)'}`);
        console.error(`     Page ID: ${existingChild.id}`);
        throw new Error(
          `Page conflict: Found page "${childPageTitle}" (ID: ${existingChild.id}) ` +
          `under different parent (expected: ${parentPageId}, actual: ${actualParentId || 'root'}). ` +
          `Cannot update foreign page. Please rename or delete the conflicting page.`
        );
      }
    }
  }
  
  let childPage: any;
  if (existingChild) {
    console.log(`📄 Found existing child page: ${existingChild.id} (version ${existingChild.version.number})`);
    childPage = await client.updatePage(
      existingChild.id,
      childPageTitle,
      fullContent,
      existingChild.version.number
    );
    console.log(`✅ Child page updated: ${childPageTitle}`);
  } else {
    // 親ページのIDを指定して子ページを作成
    childPage = await client.createPageUnderParent(
      spaceKey,
      childPageTitle,
      fullContent,
      labels,
      parentPageId
    );
    console.log(`✅ Child page created: ${childPageTitle} (under ${parentTitle})`);
  }
  
  const baseUrl = process.env.ATLASSIAN_URL || '';
  return {
    pages: [{
      url: `${baseUrl}/wiki${childPage._links.webui}`,
      pageId: childPage.id,
      title: childPageTitle
    }],
    parentPageId
  };
}

/**
 * パターン4: by-hierarchy nested（3階層構造）
 */
export async function createByHierarchyNestedPages(
  client: ConfluenceClient,
  spaceKey: string,
  markdown: string,
  config: ConfluenceConfig,
  projectMeta: ProjectMetadata,
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks',
  githubUrl: string
): Promise<HierarchyCreationResult> {
  // 親ページを作成または取得
  const parentTitle = expandTitleTemplate(
    config.hierarchy?.parentPageTitle || '[{projectName}] {featureName}',
    projectMeta,
    featureName,
    ''
  );
  
  const parentPageId = await getOrCreateParentPage(
    client,
    spaceKey,
    parentTitle,
    projectMeta,
    featureName,
    githubUrl
  );
  
  // ドキュメントタイプの親ページを作成または取得（featureNameを含む一意のタイトル）
  const pageTitleFormat = config.pageTitleFormat || '[{projectName}] {featureName} {docTypeLabel}';
  let docTypeParentTitle = expandTitleTemplate(
    pageTitleFormat,
    projectMeta,
    featureName,
    docType
  );
  
  // タイトルに機能名が含まれていない場合、自動的に追加（重複を避けるため）
  if (!docTypeParentTitle.includes(featureName)) {
    console.warn(`⚠️  Warning: pageTitleFormat does not include {featureName}. Adding feature name to ensure uniqueness.`);
    docTypeParentTitle = `[${featureName}] ${docTypeParentTitle}`;
  }
  
  // 親ページIDで絞り込んで検索（同じタイトルでも別機能のページがヒットすることを防ぐ）
  const existingDocTypeParent = await client.searchPage(spaceKey, docTypeParentTitle, parentPageId);
  
  let docTypeParentId: string;
  if (existingDocTypeParent) {
    docTypeParentId = existingDocTypeParent.id;
  } else {
    const docTypeParentContent = createConfluencePage({
      title: docTypeParentTitle,
      githubUrl,
      content: `<p>${docTypeParentTitle}の詳細ページがこの下に配置されます。</p>`,
      approvers: projectMeta.stakeholders,
      projectName: projectMeta.projectName
    });
    
    const docTypeParent = await client.createPageUnderParent(
      spaceKey,
      docTypeParentTitle,
      docTypeParentContent,
      expandLabels(config.autoLabels, projectMeta, featureName, docType),
      parentPageId
    );
    docTypeParentId = docTypeParent.id;
    console.log(`✅ DocType parent page created: ${docTypeParentTitle}`);
  }
  
  // セクションごとに子ページを作成（featureNameとsectionTitleを含む一意のタイトル）
  const sections = splitMarkdownBySections(markdown);
  const pages: PageCreationResult[] = [];
  
  for (const section of sections) {
    // セクションページのタイトルにfeatureNameとsectionTitleを含める
    let sectionPageTitle = expandTitleTemplate(
      pageTitleFormat,
      projectMeta,
      featureName,
      docType,
      section.title
    );
    
    // タイトルに機能名が含まれていない場合、自動的に追加（重複を避けるため）
    if (!sectionPageTitle.includes(featureName)) {
      console.warn(`⚠️  Warning: pageTitleFormat does not include {featureName}. Adding feature name to ensure uniqueness.`);
      sectionPageTitle = `[${featureName}] ${sectionPageTitle}`;
    }
    const confluenceContent = convertMarkdownToConfluence(section.content);
    const fullContent = createConfluencePage({
      title: sectionPageTitle,
      githubUrl,
      content: confluenceContent,
      approvers: projectMeta.stakeholders,
      projectName: projectMeta.projectName
    });
    
    const labels = expandLabels(config.autoLabels, projectMeta, featureName, docType);
    
    // 既存のセクションページを検索（docTypeParentIdで絞り込んで検索）
    // これにより、同じタイトルでも別機能のページがヒットすることを防ぐ
    const existingSectionPage = await client.searchPage(spaceKey, sectionPageTitle, docTypeParentId);
    
    let sectionPage: any;
    if (existingSectionPage) {
      sectionPage = await client.updatePage(
        existingSectionPage.id,
        sectionPageTitle,
        fullContent,
        existingSectionPage.version.number
      );
      console.log(`✅ Section page updated: ${sectionPageTitle}`);
    } else {
      sectionPage = await client.createPageUnderParent(
        spaceKey,
        sectionPageTitle,
        fullContent,
        labels,
        docTypeParentId
      );
      console.log(`✅ Section page created: ${sectionPageTitle} (under ${docTypeParentTitle})`);
    }
    
    const baseUrl = process.env.ATLASSIAN_URL || '';
    pages.push({
      url: `${baseUrl}/wiki${sectionPage._links.webui}`,
      pageId: sectionPage.id,
      title: sectionPageTitle
    });
  }
  
  return {
    pages,
    parentPageId
  };
}

/**
 * パターン5: manual（設定ファイルベースの手動指定）
 */
export async function createManualPages(
  client: ConfluenceClient,
  spaceKey: string,
  markdown: string,
  config: ConfluenceConfig,
  projectMeta: ProjectMetadata,
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks',
  githubUrl: string
): Promise<HierarchyCreationResult> {
  if (!config.hierarchy?.structure || !config.hierarchy.structure[docType]) {
    throw new Error(`Manual structure not defined for docType: ${docType}`);
  }
  
  const structure = config.hierarchy.structure[docType];
  
  // 親ページを作成または取得
  let parentPageId: string | undefined;
  if (config.hierarchy.parentPageTitle) {
    const parentTitle = expandTitleTemplate(
      config.hierarchy.parentPageTitle,
      projectMeta,
      featureName,
      ''
    );
    parentPageId = await getOrCreateParentPage(
      client,
      spaceKey,
      parentTitle,
      projectMeta,
      featureName,
      githubUrl
    );
  }
  
  const pages: PageCreationResult[] = [];
  
  // 設定ファイルで指定されたページを作成
  if (structure.pages) {
    for (const pageConfig of structure.pages) {
      // セクションが指定されている場合、最初のセクション名を取得
      let sectionTitleForTitle: string | undefined;
      if (pageConfig.sections && pageConfig.sections.length > 0) {
        // マークダウンからセクション名を抽出
        const lines = markdown.split('\n');
        for (const line of lines) {
          for (const sectionPattern of pageConfig.sections) {
            const escapedPattern = sectionPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`^##+\\s+${escapedPattern}`);
            if (regex.test(line)) {
              // セクションタイトルを抽出（## を除く）
              const match = line.match(/^##+\s+(.+)$/);
              if (match) {
                sectionTitleForTitle = match[1].trim();
                break;
              }
            }
          }
          if (sectionTitleForTitle) break;
        }
      }
      
      // featureNameとsectionTitleを含む一意のタイトルを生成
      let pageTitle = expandTitleTemplate(
        pageConfig.title,
        projectMeta,
        featureName,
        docType,
        sectionTitleForTitle
      );
      
      // タイトルに機能名が含まれていない場合、自動的に追加（重複を避けるため）
      if (!pageTitle.includes(featureName)) {
        console.warn(`⚠️  Warning: Manual page title does not include {featureName}. Adding feature name to ensure uniqueness.`);
        pageTitle = `[${featureName}] ${pageTitle}`;
      }
      
      // 指定されたセクションを抽出
      let pageContent = '';
      if (pageConfig.sections && pageConfig.sections.length > 0) {
        pageContent = extractSectionsFromMarkdown(markdown, pageConfig.sections);
        // セクションが見つからない場合は全体を使用
        if (!pageContent.trim()) {
          pageContent = markdown;
        }
      } else {
        pageContent = markdown;
      }
      
      const confluenceContent = convertMarkdownToConfluence(pageContent);
      const fullContent = createConfluencePage({
        title: pageTitle,
        githubUrl,
        content: confluenceContent,
        approvers: projectMeta.stakeholders,
        projectName: projectMeta.projectName
      });
      
      const labels = pageConfig.labels
        ? expandLabels(pageConfig.labels, projectMeta, featureName, docType)
        : expandLabels(config.autoLabels, projectMeta, featureName, docType);
      
      // 既存ページを検索（親ページIDが指定されている場合は絞り込んで検索）
      const existingPage = await client.searchPage(spaceKey, pageTitle, parentPageId);
      
      let page: any;
      if (existingPage) {
        page = await client.updatePage(
          existingPage.id,
          pageTitle,
          fullContent,
          existingPage.version.number
        );
        console.log(`✅ Page updated: ${pageTitle}`);
      } else {
        if (parentPageId) {
          page = await client.createPageUnderParent(
            spaceKey,
            pageTitle,
            fullContent,
            labels,
            parentPageId
          );
          console.log(`✅ Page created: ${pageTitle} (under parent)`);
        } else {
          page = await client.createPage(spaceKey, pageTitle, fullContent, labels);
          console.log(`✅ Page created: ${pageTitle}`);
        }
      }
      
      const baseUrl = process.env.ATLASSIAN_URL || '';
      pages.push({
        url: `${baseUrl}/wiki${page._links.webui}`,
        pageId: page.id,
        title: pageTitle
      });
    }
  }
  
  return {
    pages,
    parentPageId
  };
}

/**
 * 階層構造に応じてページを作成
 */
export async function createPagesByGranularity(
  client: ConfluenceClient,
  spaceKey: string,
  markdown: string,
  config: ConfluenceConfig,
  projectMeta: ProjectMetadata,
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks',
  githubUrl: string
): Promise<HierarchyCreationResult> {
  const granularity = config.pageCreationGranularity || 'single';
  
  switch (granularity) {
    case 'single':
      return await createSinglePage(
        client,
        spaceKey,
        markdown,
        config,
        projectMeta,
        featureName,
        docType,
        githubUrl
      );
    
    case 'by-section':
      return await createBySectionPages(
        client,
        spaceKey,
        markdown,
        config,
        projectMeta,
        featureName,
        docType,
        githubUrl
      );
    
    case 'by-hierarchy':
      const hierarchyMode = config.hierarchy?.mode || 'simple';
      if (hierarchyMode === 'nested') {
        return await createByHierarchyNestedPages(
          client,
          spaceKey,
          markdown,
          config,
          projectMeta,
          featureName,
          docType,
          githubUrl
        );
      } else {
        return await createByHierarchySimplePages(
          client,
          spaceKey,
          markdown,
          config,
          projectMeta,
          featureName,
          docType,
          githubUrl
        );
      }
    
    case 'manual':
      return await createManualPages(
        client,
        spaceKey,
        markdown,
        config,
        projectMeta,
        featureName,
        docType,
        githubUrl
      );
    
    default:
      throw new Error(`Unknown page creation granularity: ${granularity}`);
  }
}

