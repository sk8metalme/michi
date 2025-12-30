/**
 * CLI configuration utilities
 * Environment variable and approval gate handling
 */

/**
 * 環境変数から承認ゲートのロールリストを取得
 * @param envVar 環境変数名
 * @param defaultValue デフォルト値（環境変数が存在しない場合）
 * @returns ロール名の配列
 */
export function getApprovalGates(
  envVar: string,
  defaultValue: string[],
): string[] {
  const envValue = process.env[envVar];
  if (!envValue) {
    return defaultValue;
  }
  // カンマ区切りを配列に変換し、空白をトリム
  return envValue
    .split(',')
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
}
