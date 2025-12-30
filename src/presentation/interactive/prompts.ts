/**
 * Prompts - 基本的な質問機能
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
 * パスワードなど、非表示で入力を受け取る
 * 注: Node.jsの標準機能ではパスワード入力を隠すことは難しいため、
 *      実際のプロダクションでは inquirer や prompts などのライブラリを使用することを推奨
 */
export async function password(
  rl: readline.Interface,
  query: string
): Promise<string> {
  // 基本的な実装として、通常の質問と同じ処理を行う
  // TODO: より高度なパスワード入力機能が必要な場合は、外部ライブラリを検討
  return question(rl, query);
}

/**
 * 数値入力を受け取る
 */
export async function numberInput(
  rl: readline.Interface,
  query: string,
  min?: number,
  max?: number,
  defaultValue?: number
): Promise<number> {
  const answer = await question(rl, query);

  if (!answer && defaultValue !== undefined) {
    return defaultValue;
  }

  const num = parseInt(answer, 10);

  if (isNaN(num)) {
    console.log('⚠️  無効な数値です。もう一度入力してください。');
    return numberInput(rl, query, min, max, defaultValue);
  }

  if (min !== undefined && num < min) {
    console.log(`⚠️  ${min}以上の数値を入力してください。`);
    return numberInput(rl, query, min, max, defaultValue);
  }

  if (max !== undefined && num > max) {
    console.log(`⚠️  ${max}以下の数値を入力してください。`);
    return numberInput(rl, query, min, max, defaultValue);
  }

  return num;
}

/**
 * テキスト入力を受け取る（バリデーション付き）
 */
export async function textInput(
  rl: readline.Interface,
  query: string,
  options?: {
    defaultValue?: string;
    validator?: (input: string) => boolean;
    errorMessage?: string;
  }
): Promise<string> {
  const answer = await question(rl, query);

  if (!answer && options?.defaultValue) {
    return options.defaultValue;
  }

  if (options?.validator && !options.validator(answer)) {
    console.log(`⚠️  ${options.errorMessage || '無効な入力です。もう一度入力してください。'}`);
    return textInput(rl, query, options);
  }

  return answer;
}
