# Domain Layer (ドメイン層)

## 責務

ビジネスロジックの中核を担う層。外部依存を持たず、純粋なビジネスルールのみを実装します。

## 配置するもの

- **Entities (エンティティ)**: ビジネス上の重要な概念を表すオブジェクト
  - 例: `Spec`, `Task`, `Project`
- **Value Objects (値オブジェクト)**: 不変で等価性で比較される値
  - 例: `FeatureName`, `Phase`, `ApprovalStatus`
- **Domain Services (ドメインサービス)**: エンティティに属さないビジネスロジック
  - 例: `SpecValidator`, `PhaseTransitionService`
- **Repository Interfaces (リポジトリインターフェース)**: データ永続化の抽象
  - 例: `SpecRepository`, `TaskRepository`
- **Constants (定数)**: ドメイン固有の定数
  - 例: `phases.ts`, `validation-rules.ts`

## 依存関係ルール

- ✅ **依存可能**: なし（外部依存ゼロ）
- ❌ **依存禁止**: Application層、Infrastructure層、Presentation層、外部ライブラリ

## ディレクトリ構造

```
domain/
├── entities/          # エンティティ
├── value-objects/     # 値オブジェクト
├── services/          # ドメインサービス
├── interfaces/        # リポジトリインターフェース
└── constants/         # ドメイン定数
```

## 実装ガイドライン

1. **Pure TypeScript**: Node.js APIや外部ライブラリに依存しない
2. **不変性**: エンティティの変更は新しいインスタンスを返す
3. **ビジネスルール**: すべてのビジネスロジックをドメイン層に集約
4. **テスタビリティ**: 外部依存なしで単体テスト可能
