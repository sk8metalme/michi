---
name: /michi:steering-custom
description: Create custom steering documents for specialized contexts (Michi version with template suggestions)
allowed-tools: Bash, Read, Write, Glob, Grep, Edit
argument-hint: <domain>
---

# Michi: Custom Steering with Template Suggestions

## Base Command Reference
@.claude/commands/kiro/steering-custom.md

## Development Guidelines
{{DEV_GUIDELINES}}

## Michi Extension: Smart Template Recommendations

Custom steering作成時、ドメインに応じたテンプレートを推奨:

### ドメイン別テンプレート提案

入力されたドメインから、最適なテンプレートを提案:

| ドメイン | 推奨テンプレート | 用途 |
|---------|----------------|------|
| `api`, `rest`, `graphql` | `api-standards.md` | API設計規約 |
| `auth`, `security`, `permission` | `authentication.md`, `security.md` | 認証・セキュリティ |
| `db`, `database`, `schema` | `database.md` | DB設計規約 |
| `deploy`, `ci`, `cd` | `deployment.md` | デプロイ戦略 |
| `error`, `logging`, `monitoring` | `error-handling.md` | エラー処理規約 |
| `test`, `qa`, `testing` | `testing.md` | テスト戦略 |

### インタラクティブ提案フロー

```
$ /michi:steering-custom api

📝 Creating custom steering: api

🎯 Suggested templates:
  1. api-standards.md (RESTful API design guidelines)
  2. security.md (API authentication & authorization)
  3. error-handling.md (API error responses)

Would you like to use a template? [y/N]:
```

### テンプレートカスタマイズ

テンプレート使用時、プロジェクト固有の情報を埋め込み:

- プロジェクト名
- 技術スタック（package.jsonから取得）
- 既存のAPI仕様（swagger.yaml等があれば）

### 出力例

```
✅ Custom steering created: .michi/steering/api-standards.md

📚 Related templates available:
   - .michi/settings/templates/steering-custom/api-standards.md
   - .michi/settings/templates/steering-custom/security.md

💡 To add more custom steering:
   /michi:steering-custom <another-domain>
```

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:steering-custom` を拡張し、ドメイン別のスマートなテンプレート推奨を追加します。
