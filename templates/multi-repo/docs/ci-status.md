# {{PROJECT_NAME}} - CI Status

## プロジェクト情報

- **プロジェクト名**: {{PROJECT_NAME}}
- **JIRAキー**: {{JIRA_KEY}}
- **Confluenceスペース**: {{CONFLUENCE_SPACE}}
- **最終更新**: {{CREATED_AT}}

## CI結果サマリー

| リポジトリ名 | ビルドステータス | テストステータス | カバレッジ | 最終実行日時 | 失敗詳細 |
|------------|---------------|---------------|----------|------------|----------|
| <!-- リポジトリ名 --> | <!-- ✅/❌/⏳/❓ --> | <!-- ✅/❌/⏳/❓ --> | <!-- XX% --> | <!-- YYYY-MM-DD HH:mm:ss --> | <!-- GitHub URL --> |

<!-- 
ステータスアイコン:
- ✅ success: ビルド・テスト成功
- ❌ failure: ビルド・テスト失敗
- ⏳ running: 実行中
- ❓ unknown: 不明・未実行

このファイルは `multi-repo:ci-status <project-name>` コマンドで自動更新されます。
-->

## 統計情報

- **総リポジトリ数**: 0
- **成功**: 0
- **失敗**: 0
- **実行中**: 0
- **不明**: 0

## 注意事項

このドキュメントは自動生成されます。手動で編集しないでください。
最新のCI結果を取得するには、以下のコマンドを実行してください:

```bash
npm run michi multi-repo:ci-status {{PROJECT_NAME}}
```

差分表示オプション:

```bash
npm run michi multi-repo:ci-status {{PROJECT_NAME}} --diff
```

## 変更履歴

自動生成のため、変更履歴は記録されません。
