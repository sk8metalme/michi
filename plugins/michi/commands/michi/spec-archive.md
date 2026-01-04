---
name: /michi:spec-archive
description: Archive a completed specification (Michi version with Confluence sync option)
allowed-tools: Bash, Read, Glob, Write, Edit
argument-hint: <feature-name> [--reason <reason>]
---

# Michi: Spec Archive with Confluence Sync

## Base Command Reference
@.claude/commands/kiro/spec-archive.md

## Development Guidelines
{{DEV_GUIDELINES}}

## Michi Extension: Post-Archive Actions

アーカイブ完了後、以下のオプションを提案:

### Confluence同期オプション

アーカイブ後、Confluence上のドキュメントステータスも更新できます:

**推奨アクション**:
```bash
# Confluenceドキュメントにアーカイブステータスを反映
/michi:confluence-sync <feature-name> --status archived
```

**確認項目**:
- Atlassian連携が設定されているか（ATLASSIAN_URL, ATLASSIAN_API_TOKEN）
- Confluenceスペースが指定されているか（CONFLUENCE_PRD_SPACE等）

**出力例**:
```
✅ Archived specification: <feature>
📁 Archive path: .michi/specs/archive/<feature>/
📝 Reason: <reason>

📚 Optional: Sync archive status to Confluence
   /michi:confluence-sync <feature> --status archived
```

### 次のステップ

アーカイブ完了後の推奨アクション:

1. **リリースノート確認**: `docs/release-notes/` ディレクトリにリリースノートが保存されているか確認
2. **次の機能開発**: `/michi:spec-init "<description>"` で新しいspec作成
3. **全体進捗確認**: `/michi:spec-status` で全spec進捗確認（`--all`オプションでアーカイブ含む）

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-archive` を拡張し、Confluence同期オプションとアーカイブ後の推奨アクションを追加します。
