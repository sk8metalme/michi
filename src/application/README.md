# Application Layer (アプリケーション層)

## 責務

ユースケースを実装し、ドメイン層とインフラ層を協調させる層。

## 配置するもの

- **Use Cases (ユースケース)**: アプリケーション固有の業務フロー
  - 例: `InitSpecUseCase`, `GenerateRequirementsUseCase`
- **Services (アプリケーションサービス)**: 複数ドメインをまたぐ処理
  - 例: `WorkflowOrchestrator`, `PhaseRunner`, `SpecLoader`
- **DTOs (Data Transfer Objects)**: 層間のデータ転送用オブジェクト
- **Interfaces**: 外部依存の抽象化
  - 例: `ExternalAPIClient`, `ConfigProvider`
- **Templates**: テンプレート処理ロジック
  - 例: `TemplateProcessor`, `RequirementsTemplate`

## 依存関係ルール

- ✅ **依存可能**: Domain層のみ
- ❌ **依存禁止**: Infrastructure層、Presentation層
- ⚠️ **インターフェース経由**: Infrastructure層の実装はインターフェース経由で利用

## ディレクトリ構造

```
application/
├── use-cases/         # ユースケース
│   ├── spec/          # Spec関連ユースケース
│   ├── jira/          # JIRA関連ユースケース
│   └── confluence/    # Confluence関連ユースケース
├── services/          # アプリケーションサービス
├── interfaces/        # 外部依存の抽象化
├── templates/         # テンプレート処理
└── dtos/             # データ転送オブジェクト
```

## 実装ガイドライン

1. **ユースケース駆動**: 1ユースケース = 1ファイル
2. **依存性注入**: コンストラクタでインターフェースを受け取る
3. **トランザクション境界**: ユースケースがトランザクションの境界
4. **ドメインロジック委譲**: ビジネスロジックはDomain層に委譲
