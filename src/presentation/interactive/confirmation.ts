/**
 * Confirmation - 確認機能
 */

import * as readline from 'readline';
import { question } from './prompts.js';

/**
 * Yes/No質問
 */
export async function confirm(
  rl: readline.Interface,
  prompt: string,
  defaultValue: boolean = true
): Promise<boolean> {
  const defaultText = defaultValue ? '[Y/n]' : '[y/N]';
  const answer = await question(rl, `${prompt} ${defaultText}: `);

  if (!answer) {
    return defaultValue;
  }

  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * 危険な操作の確認（二重確認）
 */
export async function confirmDangerous(
  rl: readline.Interface,
  prompt: string,
  confirmationText: string = 'yes'
): Promise<boolean> {
  console.log(`\n⚠️  警告: ${prompt}`);
  console.log(`この操作を実行するには "${confirmationText}" と入力してください。`);

  const answer = await question(rl, '確認: ');

  return answer === confirmationText;
}

/**
 * 複数の確認項目をチェック
 */
export async function confirmMultiple(
  rl: readline.Interface,
  items: Array<{ question: string; defaultValue?: boolean }>
): Promise<boolean[]> {
  const results: boolean[] = [];

  for (const item of items) {
    const result = await confirm(rl, item.question, item.defaultValue ?? true);
    results.push(result);
  }

  return results;
}

/**
 * すべての項目に同意するまで繰り返す
 */
export async function confirmAll(
  rl: readline.Interface,
  items: string[],
  maxRetries: number = 3
): Promise<boolean> {
  console.log('\n以下の項目を確認してください:');
  items.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item}`);
  });

  const answer = await question(rl, '\nすべての項目に同意しますか？ [Y/n]: ');

  if (!answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    return true;
  }

  if (maxRetries > 0) {
    console.log(`⚠️  同意が必要です（残り試行回数: ${maxRetries}）`);
    return confirmAll(rl, items, maxRetries - 1);
  }

  return false;
}
