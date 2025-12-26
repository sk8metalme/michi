/**
 * Markdown解析ユーティリティ
 * requirements.mdとdesign.mdから構造化データを抽出
 */

export interface Component {
  name: string;
  domain: string;
  intent: string;
  requirements: string[];
  methods: Method[];
}

export interface Method {
  name: string;
  signature: string;
  parameters: Parameter[];
  returnType: string;
  description?: string;
}

export interface Parameter {
  name: string;
  type: string;
}

export interface Flow {
  name: string;
  type: 'sequence' | 'process' | 'data';
  mermaidCode: string;
  description?: string;
}

export interface Requirement {
  id: string;
  title: string;
  objective: string;
  acceptanceCriteria: string[];
}

/**
 * Markdownから特定の見出しセクションを抽出
 */
export function extractSection(content: string, heading: string): string {
  const lines = content.split('\n');
  const headingRegex = new RegExp(`^#+\\s+${heading}`, 'i');
  
  let startIndex = -1;
  let endIndex = lines.length;
  let headingLevel = 0;
  
  // 開始位置を検索
  for (let i = 0; i < lines.length; i++) {
    if (headingRegex.test(lines[i])) {
      startIndex = i;
      const match = lines[i].match(/^(#+)/);
      headingLevel = match ? match[1].length : 0;
      break;
    }
  }
  
  if (startIndex === -1) {
    return '';
  }
  
  // 同じレベルまたは上位レベルの見出しまで抽出
  for (let i = startIndex + 1; i < lines.length; i++) {
    const match = lines[i].match(/^(#+)\s/);
    if (match && match[1].length <= headingLevel) {
      endIndex = i;
      break;
    }
  }
  
  return lines.slice(startIndex, endIndex).join('\n');
}

/**
 * design.mdからコンポーネント情報を抽出
 */
export function extractComponents(designMd: string): Component[] {
  const components: Component[] = [];
  const componentsSection = extractSection(designMd, 'Components and Interfaces');
  
  if (!componentsSection) {
    return components;
  }
  
  // コンポーネントサマリーテーブルを解析
  const summaryTableMatch = componentsSection.match(/\|\s*Component\s*\|.*?\n\|[-\s|]+\n((?:\|.*?\n)+)/i);
  if (summaryTableMatch) {
    const rows = summaryTableMatch[1].trim().split('\n');
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 3) {
        components.push({
          name: cells[0],
          domain: cells[1] || '',
          intent: cells[2] || '',
          requirements: [],
          methods: []
        });
      }
    }
  }
  
  // 各コンポーネントの詳細セクションからインターフェースを抽出
  const lines = componentsSection.split('\n');
  let currentComponent: Component | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // コンポーネント見出しを検索（#### Component Name）
    const componentMatch = line.match(/^####\s+(.+)/);
    if (componentMatch) {
      const componentName = componentMatch[1].trim();
      currentComponent = components.find(c => c.name === componentName) || null;
      continue;
    }
    
    // Service Interfaceセクションを検索
    if (line.includes('##### Service Interface') && currentComponent) {
      // TypeScriptコードブロックを抽出
      let inCodeBlock = false;
      let codeContent = '';
      
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith('```typescript') || lines[j].startsWith('```ts')) {
          inCodeBlock = true;
          continue;
        }
        if (lines[j].startsWith('```') && inCodeBlock) {
          break;
        }
        if (inCodeBlock) {
          codeContent += lines[j] + '\n';
        }
      }
      
      // インターフェースからメソッドを抽出
      const methods = extractMethodsFromInterface(codeContent);
      currentComponent.methods = methods;
    }
  }
  
  return components;
}

/**
 * TypeScriptインターフェースからメソッドを抽出
 */
function extractMethodsFromInterface(interfaceCode: string): Method[] {
  const methods: Method[] = [];
  const lines = interfaceCode.split('\n');
  
  for (const line of lines) {
    // メソッドシグネチャを検索（例: methodName(param: Type): ReturnType）
    const methodMatch = line.match(/^\s*(\w+)\s*\(([^)]*)\)\s*:\s*(.+?)\s*;?\s*$/);
    if (methodMatch) {
      const methodName = methodMatch[1];
      const paramsStr = methodMatch[2];
      const returnType = methodMatch[3];
      
      // パラメータを解析
      const parameters: Parameter[] = [];
      if (paramsStr.trim()) {
        const paramParts = paramsStr.split(',');
        for (const part of paramParts) {
          const paramMatch = part.trim().match(/(\w+)\??:\s*(.+)/);
          if (paramMatch) {
            parameters.push({
              name: paramMatch[1],
              type: paramMatch[2].trim()
            });
          }
        }
      }
      
      methods.push({
        name: methodName,
        signature: line.trim(),
        parameters,
        returnType: returnType.trim()
      });
    }
  }
  
  return methods;
}

/**
 * design.mdからシステムフローを抽出
 */
export function extractFlows(designMd: string): Flow[] {
  const flows: Flow[] = [];
  const flowsSection = extractSection(designMd, 'System Flows');
  
  if (!flowsSection) {
    return flows;
  }
  
  const lines = flowsSection.split('\n');
  let currentFlowName = '';
  let currentFlowType: 'sequence' | 'process' | 'data' = 'sequence';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // フロー見出しを検索（### Flow Name）
    const flowMatch = line.match(/^###\s+(.+)/);
    if (flowMatch) {
      currentFlowName = flowMatch[1].trim();
      continue;
    }
    
    // Mermaidコードブロックを検索
    if (line.startsWith('```mermaid') && currentFlowName) {
      let mermaidCode = '';
      
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith('```')) {
          break;
        }
        mermaidCode += lines[j] + '\n';
      }
      
      // フロータイプを判定
      if (mermaidCode.includes('sequenceDiagram')) {
        currentFlowType = 'sequence';
      } else if (mermaidCode.includes('graph') || mermaidCode.includes('flowchart')) {
        currentFlowType = 'process';
      }
      
      flows.push({
        name: currentFlowName,
        type: currentFlowType,
        mermaidCode: mermaidCode.trim()
      });
      
      currentFlowName = '';
    }
  }
  
  return flows;
}

/**
 * requirements.mdから要件を抽出
 */
export function extractRequirements(requirementsMd: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines = requirementsMd.split('\n');
  
  let currentRequirement: Requirement | null = null;
  let inAcceptanceCriteria = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 要件見出しを検索（### Requirement N: Title）
    const reqMatch = line.match(/^###\s+Requirement\s+(\d+):\s+(.+)/i);
    if (reqMatch) {
      // 前の要件を保存
      if (currentRequirement) {
        requirements.push(currentRequirement);
      }
      
      currentRequirement = {
        id: reqMatch[1],
        title: reqMatch[2].trim(),
        objective: '',
        acceptanceCriteria: []
      };
      inAcceptanceCriteria = false;
      continue;
    }
    
    // NFR（非機能要件）も同様に抽出
    const nfrMatch = line.match(/^###\s+(NFR-\d+):\s+(.+)/i);
    if (nfrMatch) {
      if (currentRequirement) {
        requirements.push(currentRequirement);
      }
      
      currentRequirement = {
        id: nfrMatch[1],
        title: nfrMatch[2].trim(),
        objective: '',
        acceptanceCriteria: []
      };
      inAcceptanceCriteria = false;
      continue;
    }
    
    // Objectiveを抽出
    if (currentRequirement && line.includes('**Objective:**')) {
      const objectiveMatch = line.match(/\*\*Objective:\*\*\s*(.+)/);
      if (objectiveMatch) {
        currentRequirement.objective = objectiveMatch[1].trim();
      }
      continue;
    }
    
    // Acceptance Criteriaセクションの開始
    if (currentRequirement && line.includes('#### Acceptance Criteria')) {
      inAcceptanceCriteria = true;
      continue;
    }
    
    // Acceptance Criteriaを抽出
    if (currentRequirement && inAcceptanceCriteria) {
      const criteriaMatch = line.match(/^\d+\.\s+(.+)/);
      if (criteriaMatch) {
        currentRequirement.acceptanceCriteria.push(criteriaMatch[1].trim());
      }
      
      // 次のセクションに到達したら終了
      if (line.match(/^##[#]?\s+/)) {
        inAcceptanceCriteria = false;
      }
    }
  }
  
  // 最後の要件を保存
  if (currentRequirement) {
    requirements.push(currentRequirement);
  }
  
  return requirements;
}

