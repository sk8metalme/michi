/**
 * Confluence Integration Types
 */

/**
 * Confluence APIページレスポンス
 */
export interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  version?: {
    number: number;
  };
  _links?: {
    webui: string;
  };
  ancestors?: Array<{ id: string }>;
  results?: ConfluencePage[];
}

/**
 * Confluenceエラーオブジェクト
 */
export interface ConfluenceError extends Error {
  response?: {
    status: number;
    data: unknown;
  };
  config?: {
    url?: string;
    params?: unknown;
  };
}

/**
 * Confluenceページ作成ペイロード
 */
export interface ConfluenceCreatePagePayload {
  type: 'page';
  title: string;
  space: { key: string };
  body: {
    storage: {
      value: string;
      representation: 'storage';
    };
  };
  metadata: {
    labels: Array<{ name: string }>;
  };
  ancestors?: Array<{ id: string }>;
}

/**
 * Confluence認証設定
 */
export interface ConfluenceConfig {
  url: string;
  email: string;
  apiToken: string;
  space: string;
  pageCreationGranularity?: 'single' | 'by-section' | 'by-hierarchy' | 'manual';
  pageTitleFormat?: string;
  autoLabels?: string[];
  spaces?: {
    requirements?: string;
    design?: string;
    tasks?: string;
  };
  hierarchy?: {
    mode?: 'simple' | 'nested';
    parentPageTitle?: string;
    structure?: {
      requirements?: { pages?: Array<{ title: string; sections?: string[]; labels?: string[] }> };
      design?: { pages?: Array<{ title: string; sections?: string[]; labels?: string[] }> };
      tasks?: { pages?: Array<{ title: string; sections?: string[]; labels?: string[] }> };
    };
  };
}

/**
 * Confluenceページオプション
 */
export interface ConfluencePageOptions {
  title: string;
  githubUrl: string;
  content: string;
  approvers?: string[];
  projectName?: string;
}
