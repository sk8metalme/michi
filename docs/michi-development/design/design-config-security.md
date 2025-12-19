# Michi 設定統合設計書 - セキュリティとパフォーマンス

**バージョン**: 1.0
**作成日**: 2025-01-11
**ステータス**: Draft
**親ドキュメント**: [config-unification.md](./config-unification.md)

---

## 9. セキュリティとパフォーマンス

設定統一に伴うセキュリティとパフォーマンスの考慮事項です。

### 9.1 セキュリティ対策

#### 9.1.1 認証情報の保護

**脅威モデル**

| 脅威 | 影響 | 対策 |
|------|------|------|
| **認証情報の漏洩** | 高 | ファイルパーミッション、.gitignore |
| **環境変数の漏洩** | 中 | .env.example の提供、警告メッセージ |
| **不正アクセス** | 高 | 最小権限の原則、トークンの有効期限 |
| **中間者攻撃** | 中 | HTTPS必須、証明書検証 |

**実装されるセキュリティ対策**

1. **ファイルパーミッションの強制**

   ```typescript
   // scripts/utils/security.ts
   import { chmodSync, statSync } from 'fs';

   /**
    * 機密ファイルのパーミッションを強制する
    */
   export function enforceSecurePermissions(filePath: string): void {
     const stats = statSync(filePath);
     const mode = stats.mode & 0o777;

     // 600 (rw-------) 以外の場合は警告
     if (mode !== 0o600) {
       console.warn(`⚠️  警告: ${filePath} のパーミッションが不適切です`);
       console.warn(`   現在: ${mode.toString(8)}, 推奨: 600`);
       console.warn(`   自動的に 600 に変更します...`);

       chmodSync(filePath, 0o600);
       console.log(`✅ パーミッションを 600 に変更しました`);
     }
   }

   /**
    * グローバル .env ファイルの作成時にパーミッションを設定
    */
   export function createSecureEnvFile(filePath: string, content: string): void {
     writeFileSync(filePath, content, { mode: 0o600 });
     console.log(`✅ セキュアなファイルを作成しました: ${filePath}`);
   }
   ```

2. **.gitignore の自動更新**

   ```typescript
   // scripts/utils/gitignore.ts
   import { readFileSync, writeFileSync, existsSync } from 'fs';

   /**
    * .gitignore に機密ファイルを追加する
    */
   export function ensureGitignore(projectDir: string): void {
     const gitignorePath = join(projectDir, '.gitignore');
     const requiredEntries = [
       '.env',
       '.env.local',
       '~/.michi/.env',
       '.michi-backup-*/',
       '.michi/migration.log'
     ];

     let content = existsSync(gitignorePath)
       ? readFileSync(gitignorePath, 'utf-8')
       : '';

     let added = false;
     for (const entry of requiredEntries) {
       if (!content.includes(entry)) {
         content += `\n${entry}`;
         added = true;
       }
     }

     if (added) {
       writeFileSync(gitignorePath, content.trim() + '\n');
       console.log('✅ .gitignore を更新しました');
     }
   }
   ```

3. **環境変数の検証**

   ```typescript
   // src/config/validation.ts
   import { z } from 'zod';

   /**
    * 認証情報の形式を検証する
    */
   export const CredentialsSchema = z.object({
     // Atlassian API Token (24文字の英数字)
     confluenceApiToken: z.string()
       .min(24, 'API token is too short')
       .regex(/^[A-Za-z0-9]+$/, 'Invalid API token format'),

     jiraApiToken: z.string()
       .min(24, 'API token is too short')
       .regex(/^[A-Za-z0-9]+$/, 'Invalid API token format'),

     // GitHub Personal Access Token (ghp_ または ghp_classic プレフィックス)
     githubToken: z.string()
       .regex(
         /^(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})$/,
         'Invalid GitHub token format'
       ),
   });

   /**
    * 機密情報が含まれていないかチェック
    */
   export function detectSecretsInLogs(message: string): string {
     // トークンのパターンにマッチする部分をマスクする
     return message
       .replace(/ghp_[A-Za-z0-9]{36}/g, 'ghp_****')
       .replace(/github_pat_[A-Za-z0-9_]{82}/g, 'github_pat_****')
       .replace(/[A-Za-z0-9]{24,}/g, (match) => {
         // 24文字以上の英数字はトークンの可能性があるのでマスク
         return match.substring(0, 4) + '****';
       });
   }
   ```

#### 9.1.2 ファイルパーミッションの管理

**パーミッション設定基準**

| ファイル | パーミッション | 理由 |
|---------|--------------|------|
| `~/.michi/.env` | 600 (rw-------) | 組織の認証情報を含む |
| `.env` | 600 (rw-------) | プロジェクトの認証情報を含む |
| `.michi/config.json` | 644 (rw-r--r--) | 認証情報を含まない |
| `.michi/project.json` | 644 (rw-r--r--) | 認証情報を含まない |
| `.michi-backup-*/*` | 700 (rwx------) | バックアップディレクトリ |

**自動チェック機構**

```typescript
// src/config/config-loader.ts (updated)
export class ConfigLoader {
  private validateFilePermissions(): void {
    const sensitiveFiles = [
      this.globalEnvPath,
      join(this.projectDir, '.env')
    ];

    for (const filePath of sensitiveFiles) {
      if (!existsSync(filePath)) continue;

      const stats = statSync(filePath);
      const mode = stats.mode & 0o777;

      if (mode > 0o600) {
        throw new SecurityError(
          'INSECURE_PERMISSIONS',
          `File ${filePath} has insecure permissions: ${mode.toString(8)}`,
          { filePath, mode, expected: 0o600 }
        );
      }
    }
  }

  public load(): AppConfig {
    // パーミッションチェック
    this.validateFilePermissions();

    // 設定読み込み
    // ...
  }
}
```

#### 9.1.3 入力検証

**URL検証**

```typescript
// src/config/validators.ts
import { z } from 'zod';

/**
 * Atlassian URL（Confluence/JIRA）の検証
 */
export const AtlassianUrlSchema = z.string()
  .url('Invalid URL format')
  .regex(
    /^https:\/\/[a-zA-Z0-9-]+\.atlassian\.net$/,
    'Must be a valid Atlassian Cloud URL (https://xxx.atlassian.net)'
  );

/**
 * GitHub リポジトリURLの検証
 */
export const GitHubRepoUrlSchema = z.string()
  .refine(
    (url) => {
      const httpsPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+(\.git)?$/;
      const sshPattern = /^git@github\.com:[^/]+\/[^/]+(\.git)?$/;
      return httpsPattern.test(url) || sshPattern.test(url);
    },
    'Must be a valid GitHub repository URL'
  );

/**
 * メールアドレスの検証
 */
export const EmailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long');
```

**コマンドインジェクション対策**

```typescript
// scripts/utils/exec-safe.ts
import { execSync } from 'child_process';

/**
 * 安全なコマンド実行（シェルインジェクション対策）
 */
export function execSafe(
  command: string,
  args: string[],
  options?: any
): string {
  // コマンドと引数を分離して実行
  // execSync の shell: false オプションを使用
  const fullCommand = `${command} ${args.map(escapeArg).join(' ')}`;

  return execSync(fullCommand, {
    ...options,
    shell: false, // シェルを経由しない
    encoding: 'utf-8'
  });
}

/**
 * シェル引数のエスケープ
 */
function escapeArg(arg: string): string {
  // シングルクォートで囲み、内部のシングルクォートをエスケープ
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
```

#### 9.1.4 セキュアなデフォルト設定

**デフォルト値の設計**

```typescript
// src/config/defaults.ts

export const SECURE_DEFAULTS = {
  // HTTPS 強制
  confluence: {
    useHttps: true,
    verifySsl: true,
  },

  jira: {
    useHttps: true,
    verifySsl: true,
  },

  github: {
    useHttps: true,
  },

  // API呼び出しのタイムアウト（DoS対策）
  api: {
    timeout: 30000, // 30秒
    maxRetries: 3,
    retryDelay: 1000, // 1秒
  },

  // ロギング
  logging: {
    maskSecrets: true, // 機密情報を自動マスク
    level: 'info',
  },
} as const;
```

**設定値のサニタイズ**

```typescript
// src/config/sanitize.ts

/**
 * ログ出力前に機密情報をマスクする
 */
export function sanitizeForLog(config: AppConfig): AppConfig {
  return {
    ...config,
    confluence: config.confluence ? {
      ...config.confluence,
      apiToken: '****',
      password: '****',
    } : undefined,
    jira: config.jira ? {
      ...config.jira,
      apiToken: '****',
      password: '****',
    } : undefined,
    github: config.github ? {
      ...config.github,
      token: config.github.token?.substring(0, 7) + '****',
    } : undefined,
  };
}
```

### 9.2 パフォーマンス最適化

#### 9.2.1 設定読み込みの最適化

**問題点**

- 毎回ファイルを読み込むとI/Oコストが高い
- 複数のコマンド実行時に同じファイルを何度も読む
- Zodバリデーションが重い

**解決策: キャッシュ機構**

```typescript
// src/config/config-loader.ts (updated)

export class ConfigLoader {
  private static cache: Map<string, {
    config: AppConfig;
    timestamp: number;
    hash: string;
  }> = new Map();

  private static CACHE_TTL = 60000; // 1分

  /**
   * ファイルのハッシュ値を計算
   */
  private getFileHash(filePath: string): string {
    if (!existsSync(filePath)) return '';

    const content = readFileSync(filePath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * キャッシュキーを生成
   */
  private getCacheKey(): string {
    const globalHash = this.getFileHash(this.globalEnvPath);
    const projectConfigHash = this.getFileHash(this.projectConfigPath);
    const projectEnvHash = this.getFileHash(this.projectEnvPath);

    return `${globalHash}:${projectConfigHash}:${projectEnvHash}`;
  }

  /**
   * キャッシュから設定を取得
   */
  public load(options: { noCache?: boolean } = {}): AppConfig {
    const cacheKey = this.getCacheKey();
    const now = Date.now();

    // キャッシュチェック
    if (!options.noCache) {
      const cached = ConfigLoader.cache.get(cacheKey);
      if (cached && now - cached.timestamp < ConfigLoader.CACHE_TTL) {
        return cached.config;
      }
    }

    // 設定を読み込み
    const config = this.loadInternal();

    // キャッシュに保存
    ConfigLoader.cache.set(cacheKey, {
      config,
      timestamp: now,
      hash: cacheKey
    });

    return config;
  }

  /**
   * キャッシュをクリア
   */
  public static clearCache(): void {
    ConfigLoader.cache.clear();
  }
}
```

**ベンチマーク目標**

| 操作 | 目標時間 | 現在値 |
|------|---------|--------|
| 初回読み込み | < 100ms | TBD |
| キャッシュヒット | < 10ms | TBD |
| バリデーション | < 50ms | TBD |
| マージ処理 | < 20ms | TBD |

#### 9.2.2 メモリ使用量

**メモリプロファイリング**

```typescript
// scripts/benchmark/memory-profile.ts
import { ConfigLoader } from '../src/config/config-loader.js';

function measureMemoryUsage() {
  const before = process.memoryUsage();

  // 100回設定を読み込む
  for (let i = 0; i < 100; i++) {
    const loader = new ConfigLoader(process.cwd());
    loader.load();
  }

  const after = process.memoryUsage();

  console.log('Memory Usage:');
  console.log(`  Heap Used: ${(after.heapUsed - before.heapUsed) / 1024 / 1024}MB`);
  console.log(`  External: ${(after.external - before.external) / 1024 / 1024}MB`);
}

measureMemoryUsage();
```

**最適化目標**

- 1回の設定読み込み: < 5MB
- キャッシュ保持: < 10MB (100エントリ)
- ピークメモリ: < 50MB

#### 9.2.3 キャッシュ戦略

**多層キャッシュ**

```typescript
// src/config/cache-strategy.ts

interface CacheStrategy {
  get(key: string): AppConfig | null;
  set(key: string, value: AppConfig): void;
  invalidate(key: string): void;
  clear(): void;
}

/**
 * LRU（Least Recently Used）キャッシュ
 */
class LRUCache implements CacheStrategy {
  private cache: Map<string, { value: AppConfig; timestamp: number }>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): AppConfig | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // アクセスされたエントリを最後に移動（LRU）
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: AppConfig): void {
    // サイズ制限チェック
    if (this.cache.size >= this.maxSize) {
      // 最も古いエントリを削除
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * TTL（Time To Live）付きキャッシュ
 */
class TTLCache implements CacheStrategy {
  private cache: Map<string, { value: AppConfig; expiry: number }>;
  private ttl: number;

  constructor(ttl: number = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key: string): AppConfig | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 有効期限チェック
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: AppConfig): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 9.3 監査とロギング

#### 9.3.1 設定変更の監査ログ

```typescript
// src/config/audit-log.ts
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  target: string;
  changes: Record<string, { old: any; new: any }>;
  success: boolean;
  error?: string;
}

export class AuditLogger {
  private logPath: string;

  constructor(projectDir: string) {
    this.logPath = join(projectDir, '.michi', 'audit.log');
  }

  /**
   * 設定変更を記録
   */
  public logConfigChange(
    action: string,
    target: string,
    changes: Record<string, { old: any; new: any }>,
    success: boolean,
    error?: string
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      user: process.env.USER || 'unknown',
      action,
      target,
      changes: this.sanitizeChanges(changes),
      success,
      error
    };

    const logLine = JSON.stringify(entry) + '\n';

    if (!existsSync(this.logPath)) {
      writeFileSync(this.logPath, logLine, { mode: 0o600 });
    } else {
      appendFileSync(this.logPath, logLine);
    }
  }

  /**
   * 機密情報をマスク
   */
  private sanitizeChanges(
    changes: Record<string, { old: any; new: any }>
  ): Record<string, { old: any; new: any }> {
    const sensitiveKeys = ['apiToken', 'token', 'password', 'secret'];

    const sanitized: Record<string, { old: any; new: any }> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = {
          old: '****',
          new: '****'
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 監査ログを取得
   */
  public getAuditLog(limit?: number): AuditLogEntry[] {
    if (!existsSync(this.logPath)) return [];

    const content = readFileSync(this.logPath, 'utf-8');
    const lines = content.trim().split('\n');

    const entries = lines
      .map(line => {
        try {
          return JSON.parse(line) as AuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is AuditLogEntry => entry !== null);

    if (limit) {
      return entries.slice(-limit);
    }

    return entries;
  }
}
```

**使用例**

```typescript
// michi migrate コマンド内
const auditLogger = new AuditLogger(projectDir);

try {
  // 移行前の設定を記録
  const oldConfig = readOldConfig();
  const newConfig = performMigration();

  // 変更内容を計算
  const changes = calculateChanges(oldConfig, newConfig);

  // 成功をログ
  auditLogger.logConfigChange(
    'migrate',
    '~/.michi/.env',
    changes,
    true
  );
} catch (error) {
  // 失敗をログ
  auditLogger.logConfigChange(
    'migrate',
    '~/.michi/.env',
    {},
    false,
    error.message
  );
  throw error;
}
```

#### 9.3.2 セキュリティイベントの記録

```typescript
// src/config/security-logger.ts

export class SecurityLogger {
  /**
   * 不正なアクセス試行を記録
   */
  public logUnauthorizedAccess(
    resource: string,
    reason: string
  ): void {
    const event = {
      timestamp: new Date().toISOString(),
      type: 'UNAUTHORIZED_ACCESS',
      resource,
      reason,
      user: process.env.USER,
      pid: process.pid
    };

    console.error('🚨 セキュリティイベント:', JSON.stringify(event));

    // セキュリティログに記録
    this.appendToSecurityLog(event);
  }

  /**
   * 機密ファイルへのアクセスを記録
   */
  public logSensitiveFileAccess(
    filePath: string,
    operation: 'read' | 'write'
  ): void {
    const event = {
      timestamp: new Date().toISOString(),
      type: 'SENSITIVE_FILE_ACCESS',
      filePath,
      operation,
      user: process.env.USER,
      pid: process.pid
    };

    this.appendToSecurityLog(event);
  }

  private appendToSecurityLog(event: any): void {
    const logPath = join(os.homedir(), '.michi', 'security.log');
    const logLine = JSON.stringify(event) + '\n';

    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, logLine, { mode: 0o600 });
  }
}
```

### 9.4 セキュリティチェックリスト

リリース前に確認すべき項目：

- [ ] すべての機密ファイルが .gitignore に追加されている
- [ ] ファイルパーミッションが適切（600 for .env files）
- [ ] Zodバリデーションがすべての入力に適用されている
- [ ] ログに機密情報が含まれていない
- [ ] HTTPS が強制されている
- [ ] エラーメッセージに内部情報が含まれていない
- [ ] セキュリティテストが全てパスしている
- [ ] 監査ログが正しく記録されている
- [ ] セキュリティドキュメントが最新である
- [ ] 脆弱性スキャンを実行している（npm audit）

---

