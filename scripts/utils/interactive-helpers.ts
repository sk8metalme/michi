/**
 * 対話的設定の共通ヘルパー関数
 */

import * as readline from 'readline';

/**
 * readlineインターフェースを作成
 */
export function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * 質問を表示して回答を取得
 */
export function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * 選択肢から選択
 */
export async function select(
  rl: readline.Interface,
  prompt: string,
  choices: Array<{ value: string; label: string; description?: string }>,
  defaultValue?: string,
  maxRetries: number = 3,
): Promise<string> {
  console.log(`\n${prompt}`);
  choices.forEach((choice, index) => {
    const defaultMark = defaultValue === choice.value ? ' (デフォルト)' : '';
    const desc = choice.description ? ` - ${choice.description}` : '';
    console.log(`  ${index + 1}. ${choice.label}${desc}${defaultMark}`);
  });

  const answer = await question(
    rl,
    `\n選択してください [1-${choices.length}]: `,
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
      `⚠️  無効な選択です。もう一度入力してください（残り試行回数: ${maxRetries}）。`,
    );
    return select(rl, prompt, choices, defaultValue, maxRetries - 1);
  }

  // 最大試行回数に達した場合はデフォルト値または最初の選択肢を返す
  console.log(
    `⚠️  最大試行回数に達しました。デフォルト値を使用します: ${defaultValue || choices[0].value}`,
  );
  return defaultValue || choices[0].value;
}

/**
 * Yes/No質問
 */
export async function confirm(
  rl: readline.Interface,
  prompt: string,
  defaultValue: boolean = true,
): Promise<boolean> {
  const defaultText = defaultValue ? '[Y/n]' : '[y/N]';
  const answer = await question(rl, `${prompt} ${defaultText}: `);

  if (!answer) {
    return defaultValue;
  }

  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * 複数選択
 */
export async function multiSelect(
  rl: readline.Interface,
  prompt: string,
  choices: Array<{ value: string; label: string }>,
  defaults: string[] = [],
): Promise<string[]> {
  console.log(`\n${prompt}`);
  choices.forEach((choice, index) => {
    const checked = defaults.includes(choice.value) ? '[x]' : '[ ]';
    console.log(`  ${checked} ${index + 1}. ${choice.label}`);
  });

  const answer = await question(
    rl,
    '\n選択してください（カンマ区切り、例: 1,2,3）: ',
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
