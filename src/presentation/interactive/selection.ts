/**
 * Selection - 選択機能
 */

import * as readline from 'readline';
import { question } from './prompts.js';

/**
 * 選択肢の型定義
 */
export interface Choice {
  value: string;
  label: string;
  description?: string;
}

/**
 * 選択肢から選択
 */
export async function select(
  rl: readline.Interface,
  prompt: string,
  choices: Choice[],
  defaultValue?: string,
  maxRetries: number = 3
): Promise<string> {
  if (choices.length === 0) {
    throw new Error('select: choices must contain at least one option');
  }

  console.log(`\n${prompt}`);
  choices.forEach((choice, index) => {
    const defaultMark = defaultValue === choice.value ? ' (デフォルト)' : '';
    const desc = choice.description ? ` - ${choice.description}` : '';
    console.log(`  ${index + 1}. ${choice.label}${desc}${defaultMark}`);
  });

  const answer = await question(
    rl,
    `\n選択してください [1-${choices.length}]: `
  );

  if (!answer && defaultValue) {
    return defaultValue;
  }

  const index = parseInt(answer, 10) - 1;
  if (index >= 0 && index < choices.length) {
    return choices[index].value;
  }

  if (defaultValue) {
    return defaultValue;
  }

  // 無効な入力の場合は再試行（最大試行回数まで）
  if (maxRetries > 0) {
    console.log(
      `⚠️  無効な選択です。もう一度入力してください（残り試行回数: ${maxRetries}）。`
    );
    return select(rl, prompt, choices, defaultValue, maxRetries - 1);
  }

  // 最大試行回数に達した場合はデフォルト値または最初の選択肢を返す
  // 注: choices.length > 0 は関数冒頭で保証されている
  const fallbackValue = defaultValue || choices[0].value;
  console.log(
    `⚠️  最大試行回数に達しました。デフォルト値を使用します: ${fallbackValue}`
  );
  return fallbackValue;
}

/**
 * 複数選択
 */
export async function multiSelect(
  rl: readline.Interface,
  prompt: string,
  choices: Choice[],
  defaults: string[] = []
): Promise<string[]> {
  console.log(`\n${prompt}`);
  choices.forEach((choice, index) => {
    const checked = defaults.includes(choice.value) ? '[x]' : '[ ]';
    console.log(`  ${checked} ${index + 1}. ${choice.label}`);
  });

  const answer = await question(
    rl,
    '\n選択してください（カンマ区切り、例: 1,2,3）: '
  );

  if (!answer && defaults.length > 0) {
    return defaults;
  }

  if (!answer) {
    return [];
  }

  const indices = answer
    .split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < choices.length);
  return indices.map((i) => choices[i].value);
}

/**
 * 検索可能な選択
 * 選択肢が多い場合に、フィルタリングしながら選択できる
 */
export async function searchableSelect(
  rl: readline.Interface,
  prompt: string,
  choices: Choice[],
  defaultValue?: string
): Promise<string> {
  if (choices.length === 0) {
    throw new Error('searchableSelect: choices must contain at least one option');
  }

  // 選択肢が少ない場合は通常のselectを使用
  if (choices.length <= 10) {
    return select(rl, prompt, choices, defaultValue);
  }

  console.log(`\n${prompt}`);
  console.log(`(${choices.length}個の選択肢があります。検索キーワードを入力してください)`);

  const searchQuery = await question(rl, '検索: ');

  if (!searchQuery) {
    // 検索キーワードなしの場合は全て表示
    return select(rl, prompt, choices, defaultValue);
  }

  const filteredChoices = choices.filter(
    (choice) =>
      choice.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      choice.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (choice.description &&
        choice.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filteredChoices.length === 0) {
    console.log('⚠️  該当する選択肢が見つかりませんでした。');
    return searchableSelect(rl, prompt, choices, defaultValue);
  }

  console.log(`\n${filteredChoices.length}件の選択肢が見つかりました:`);
  return select(rl, '', filteredChoices, defaultValue);
}

/**
 * ページネーション付き選択
 * 選択肢が多い場合にページごとに表示
 */
export async function paginatedSelect(
  rl: readline.Interface,
  prompt: string,
  choices: Choice[],
  pageSize: number = 10,
  defaultValue?: string
): Promise<string> {
  if (choices.length === 0) {
    throw new Error('paginatedSelect: choices must contain at least one option');
  }

  // 選択肢が少ない場合は通常のselectを使用
  if (choices.length <= pageSize) {
    return select(rl, prompt, choices, defaultValue);
  }

  let currentPage = 0;
  const totalPages = Math.ceil(choices.length / pageSize);

  while (true) {
    const startIndex = currentPage * pageSize;
    const endIndex = Math.min(startIndex + pageSize, choices.length);
    const pageChoices = choices.slice(startIndex, endIndex);

    console.log(`\n${prompt}`);
    console.log(`(ページ ${currentPage + 1}/${totalPages})`);

    pageChoices.forEach((choice, index) => {
      const actualIndex = startIndex + index;
      const defaultMark = defaultValue === choice.value ? ' (デフォルト)' : '';
      const desc = choice.description ? ` - ${choice.description}` : '';
      console.log(`  ${actualIndex + 1}. ${choice.label}${desc}${defaultMark}`);
    });

    console.log('\nコマンド: n=次ページ, p=前ページ, 数字=選択');
    const answer = await question(rl, '選択: ');

    if (answer.toLowerCase() === 'n' && currentPage < totalPages - 1) {
      currentPage++;
      continue;
    }

    if (answer.toLowerCase() === 'p' && currentPage > 0) {
      currentPage--;
      continue;
    }

    const index = parseInt(answer, 10) - 1;
    if (index >= 0 && index < choices.length) {
      return choices[index].value;
    }

    if (!answer && defaultValue) {
      return defaultValue;
    }

    console.log('⚠️  無効な選択です。もう一度入力してください。');
  }
}
