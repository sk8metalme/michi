/**
 * init command - Template processing
 * テンプレートコピーとレンダリング処理
 */

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  cpSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { safeReadFileOrThrow } from '../../../../scripts/utils/safe-file-reader.js';
import {
  createTemplateContext,
  renderTemplate,
} from '../../../../scripts/template/renderer.js';
import { getEnvironmentConfig } from '../../../../scripts/constants/environments.js';
import type { InitConfig } from './prompts.js';

// ES module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * テンプレートディレクトリのパスを解決
 */
export function resolveTemplatesDir(michiPath?: string): string {
  if (michiPath && existsSync(join(michiPath, 'templates'))) {
    return join(michiPath, 'templates');
  }

  const candidates = [
    {
      path: join(__dirname, '..', '..', '..', '..', 'templates'),
      description: 'Production (compiled)',
    },
    {
      path: join(__dirname, '..', '..', '..', 'templates'),
      description: 'Development (source)',
    },
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate.path)) {
      return candidate.path;
    }
  }

  const triedPaths = candidates
    .map((c) => `  - ${c.path} (${c.description})`)
    .join('\n');
  throw new Error(`Templates directory not found. Tried:\n${triedPaths}`);
}

/**
 * テンプレートをコピーしてレンダリング
 */
export function copyAndRenderTemplates(
  sourceDir: string,
  destDir: string,
  context: ReturnType<typeof createTemplateContext>,
): void {
  const entries = readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyAndRenderTemplates(sourcePath, destPath, context);
    } else if (entry.isFile()) {
      try {
        const content = safeReadFileOrThrow(sourcePath);
        const rendered = renderTemplate(content, context);
        writeFileSync(destPath, rendered, 'utf-8');
      } catch (error) {
        console.warn(`⚠️  Failed to read template file: ${sourcePath}`, error);
        continue;
      }
    }
  }
}

/**
 * プロジェクトテンプレートをコピー
 */
export function copyProjectTemplates(
  config: InitConfig,
  currentDir: string,
): void {
  console.log('\n📋 Step 4: Copying templates and rules...');

  try {
    const templatesDir = resolveTemplatesDir(config.michiPath);
    const envConfig = getEnvironmentConfig(config.environment);
    const templateContext = createTemplateContext(
      config.langCode,
      '.michi',
      envConfig.rulesDir.startsWith('.')
        ? envConfig.rulesDir.substring(1, envConfig.rulesDir.indexOf('/', 1))
        : envConfig.rulesDir.split('/')[0],
    );

    const templateSourceDir = join(templatesDir, envConfig.templateSource);

    if (existsSync(templateSourceDir)) {
      // rulesディレクトリ（claude-agent環境では agents と rules の両方をコピー）
      if (config.environment === 'claude-agent') {
        // 1. agents ディレクトリをコピー
        const agentsTemplateDir = join(templateSourceDir, 'agents');
        const agentsDestDir = join(currentDir, '.claude/agents');
        if (existsSync(agentsTemplateDir)) {
          mkdirSync(agentsDestDir, { recursive: true });
          copyAndRenderTemplates(
            agentsTemplateDir,
            agentsDestDir,
            templateContext,
          );
          console.log('   ✅ Agents copied to .claude/agents');
        }

        // 2. rules ディレクトリをコピー
        const rulesTemplateDir = join(templateSourceDir, 'rules');
        const rulesDestDir = join(currentDir, '.claude/rules');
        if (existsSync(rulesTemplateDir)) {
          mkdirSync(rulesDestDir, { recursive: true });
          copyAndRenderTemplates(
            rulesTemplateDir,
            rulesDestDir,
            templateContext,
          );
          console.log('   ✅ Rules copied to .claude/rules');
        }
      } else {
        // その他の環境では従来通り rules のみコピー
        const rulesTemplateDir = join(templateSourceDir, 'rules');
        const rulesDestDir = join(currentDir, envConfig.rulesDir);
        if (existsSync(rulesTemplateDir)) {
          mkdirSync(rulesDestDir, { recursive: true });
          copyAndRenderTemplates(
            rulesTemplateDir,
            rulesDestDir,
            templateContext,
          );
          console.log(`   ✅ Rules copied to ${envConfig.rulesDir}`);
        }
      }

      // commandsディレクトリ
      const commandsTemplateDir = join(templateSourceDir, 'commands');
      const commandsDestDir = join(currentDir, envConfig.commandsDir);

      if (existsSync(commandsTemplateDir)) {
        mkdirSync(commandsDestDir, { recursive: true });
        copyAndRenderTemplates(
          commandsTemplateDir,
          commandsDestDir,
          templateContext,
        );
        console.log(`   ✅ Commands copied to ${envConfig.commandsDir}`);
      }

      // Steeringテンプレート
      const michiSteeringDir = join(templatesDir, '..', '.michi', 'steering');
      if (existsSync(michiSteeringDir)) {
        cpSync(michiSteeringDir, join(currentDir, '.michi/steering'), {
          recursive: true,
        });
        console.log('   ✅ Steering templates copied');
      }

      // Specテンプレート
      const michiSpecTemplatesDir = join(
        templatesDir,
        '..',
        '.michi',
        'settings',
        'templates',
      );
      if (existsSync(michiSpecTemplatesDir)) {
        cpSync(
          michiSpecTemplatesDir,
          join(currentDir, '.michi/settings/templates'),
          { recursive: true },
        );
        console.log('   ✅ Spec templates copied');
      }
    } else {
      console.log(`   ⚠️  Template source not found: ${templateSourceDir}`);
    }
  } catch (error) {
    console.error(
      '   ⚠️  Template copying failed:',
      error instanceof Error ? error.message : error,
    );
    console.log('   Continuing with project initialization...');
  }
}
