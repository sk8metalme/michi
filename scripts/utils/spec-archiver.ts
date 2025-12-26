/**
 * 仕様書アーカイブユーティリティ
 * 完了した仕様書を .kiro/specs/archive/ に移動する
 */

import { existsSync, renameSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { validateFeatureName as validateFeatureNameStrict } from './feature-name-validator.js';

export interface ArchiveResult {
  success: boolean;
  feature: string;
  archivePath?: string;
  error?: string;
}

export interface SpecInfo {
  feature: string;
  phase: string;
  archived: boolean;
  archivedAt?: string;
  hasReleaseNotes: boolean;
  archivePath?: string;
}

/**
 * featureName のバリデーション
 * - kebab-case形式の検証（既存のバリデータを使用）
 * - パストラバーサル攻撃を防止（追加のセキュリティチェック）
 * @throws Error 不正な文字が含まれる場合
 */
function validateFeatureName(featureName: string): void {
  // 空文字チェック（最初にチェック）
  if (!featureName || featureName.trim().length === 0) {
    throw new Error('Feature name cannot be empty');
  }

  // パストラバーサル攻撃を防ぐ（セキュリティチェック）
  if (featureName.includes('..') ||
      featureName.includes('/') ||
      featureName.includes('\\') ||
      featureName.startsWith('.')) {
    throw new Error(`Invalid feature name: path traversal detected in "${featureName}"`);
  }

  // kebab-case形式の厳密な検証（既存のバリデータを使用）
  const result = validateFeatureNameStrict(featureName);
  if (!result.success) {
    throw new Error(result.errors.join('\n'));
  }
}

/**
 * 仕様書がアーカイブ可能かチェック
 */
export function canArchiveSpec(
  featureName: string,
  projectRoot: string = process.cwd()
): { canArchive: boolean; reason?: string } {
  try {
    validateFeatureName(featureName);
  } catch (error) {
    return {
      canArchive: false,
      reason: error instanceof Error ? error.message : 'Invalid feature name',
    };
  }

  const specDir = resolve(projectRoot, `.kiro/specs/${featureName}`);

  if (!existsSync(specDir)) {
    return { canArchive: false, reason: 'Spec not found' };
  }

  // spec.json を読み込み
  const specJsonPath = resolve(specDir, 'spec.json');
  if (!existsSync(specJsonPath)) {
    return { canArchive: false, reason: 'spec.json not found' };
  }

  try {
    const specContent = JSON.parse(readFileSync(specJsonPath, 'utf-8'));

    // 既にアーカイブ済みかチェック
    if (specContent.archived) {
      return { canArchive: false, reason: 'Already archived' };
    }

    // phase チェック
    if (specContent.phase !== 'implementation-complete') {
      return {
        canArchive: false,
        reason: `Phase is ${specContent.phase || 'unknown'}, not implementation-complete`,
      };
    }

    // release-notes チェック
    const files = readdirSync(specDir);
    const hasReleaseNotes = files.some(f => f.startsWith('release-notes-'));

    if (!hasReleaseNotes) {
      return { canArchive: false, reason: 'No release notes found' };
    }

    return { canArchive: true };
  } catch (error) {
    return {
      canArchive: false,
      reason: `Error reading spec.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * 仕様書をアーカイブ
 */
export function archiveSpec(
  featureName: string,
  options?: { reason?: string },
  projectRoot: string = process.cwd()
): ArchiveResult {
  // Defense in depth: 明示的に検証
  try {
    validateFeatureName(featureName);
  } catch (error) {
    return {
      success: false,
      feature: featureName,
      error: error instanceof Error ? error.message : 'Invalid feature name',
    };
  }

  const check = canArchiveSpec(featureName, projectRoot);

  if (!check.canArchive) {
    return { success: false, feature: featureName, error: check.reason };
  }

  const sourceDir = resolve(projectRoot, `.kiro/specs/${featureName}`);
  const archiveDir = resolve(projectRoot, '.kiro/specs/archive');
  const targetDir = resolve(archiveDir, featureName);

  // archive ディレクトリ作成
  if (!existsSync(archiveDir)) {
    mkdirSync(archiveDir, { recursive: true });
  }

  try {
    // ディレクトリ移動
    renameSync(sourceDir, targetDir);

    // spec.json に archived 情報を追加
    const specJsonPath = resolve(targetDir, 'spec.json');
    const spec = JSON.parse(readFileSync(specJsonPath, 'utf-8'));
    spec.archived = {
      at: new Date().toISOString(),
      reason: options?.reason,
    };
    spec.lastUpdated = new Date().toISOString();
    writeFileSync(specJsonPath, JSON.stringify(spec, null, 2), 'utf-8');

    return { success: true, feature: featureName, archivePath: targetDir };
  } catch (error) {
    return {
      success: false,
      feature: featureName,
      error: `Failed to archive: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * すべての仕様書を一覧取得
 */
export function listSpecs(
  options?: { includeArchived?: boolean },
  projectRoot: string = process.cwd()
): SpecInfo[] {
  const specs: SpecInfo[] = [];
  const specsDir = resolve(projectRoot, '.kiro/specs');

  if (!existsSync(specsDir)) {
    return specs;
  }

  const entries = readdirSync(specsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    if (entry.name === 'archive') {
      if (options?.includeArchived) {
        // アーカイブ済み仕様書を取得
        const archiveDir = resolve(specsDir, 'archive');
        const archivedEntries = readdirSync(archiveDir, { withFileTypes: true });

        for (const archivedEntry of archivedEntries) {
          if (!archivedEntry.isDirectory()) continue;

          // アーカイブディレクトリ名を検証
          try {
            validateFeatureName(archivedEntry.name);
          } catch (_error) {
            console.warn(`⚠️  Skipping invalid archived directory name: ${archivedEntry.name}`);
            continue;
          }

          const specPath = resolve(archiveDir, archivedEntry.name, 'spec.json');
          if (existsSync(specPath)) {
            try {
              const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
              const files = readdirSync(resolve(archiveDir, archivedEntry.name));

              specs.push({
                feature: archivedEntry.name,
                phase: spec.phase || 'unknown',
                archived: true,
                archivedAt: spec.archived?.at,
                hasReleaseNotes: files.some((f: string) => f.startsWith('release-notes-')),
                archivePath: resolve(archiveDir, archivedEntry.name),
              });
            } catch (_error) {
              // spec.json の読み取りエラーは無視
              console.warn(`⚠️  Failed to read archived spec: ${archivedEntry.name}`);
            }
          }
        }
      }
      continue;
    }

    // 仕様書ディレクトリ名を検証
    try {
      validateFeatureName(entry.name);
    } catch (_error) {
      console.warn(`⚠️  Skipping invalid spec directory name: ${entry.name}`);
      continue;
    }

    const specPath = resolve(specsDir, entry.name, 'spec.json');
    if (existsSync(specPath)) {
      try {
        const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
        const files = readdirSync(resolve(specsDir, entry.name));

        specs.push({
          feature: entry.name,
          phase: spec.phase || 'unknown',
          archived: false,
          hasReleaseNotes: files.some((f: string) => f.startsWith('release-notes-')),
        });
      } catch (_error) {
        // spec.json の読み取りエラーは無視
        console.warn(`⚠️  Failed to read spec: ${entry.name}`);
      }
    }
  }

  return specs;
}
