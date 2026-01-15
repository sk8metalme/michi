# プロジェクト構造

<!--
このファイルは、プロジェクトのディレクトリ構成、命名規則、インポートパターンを文書化します。
すべてのファイルをリスト化するのではなく、構成パターンと規約を記述します。
-->

## ディレクトリ構成パターン

<!-- プロジェクトのディレクトリ構成の原則を記述 -->

### 全体構成

```
{{PROJECT_ROOT}}/
├── {{DIR_1}}/                # {{DIR_1_DESCRIPTION}}
│   ├── {{SUBDIR_1_1}}/       # {{SUBDIR_1_1_DESCRIPTION}}
│   ├── {{SUBDIR_1_2}}/       # {{SUBDIR_1_2_DESCRIPTION}}
│   └── {{SUBDIR_1_3}}/       # {{SUBDIR_1_3_DESCRIPTION}}
├── {{DIR_2}}/                # {{DIR_2_DESCRIPTION}}
│   ├── {{SUBDIR_2_1}}/       # {{SUBDIR_2_1_DESCRIPTION}}
│   └── {{SUBDIR_2_2}}/       # {{SUBDIR_2_2_DESCRIPTION}}
├── {{DIR_3}}/                # {{DIR_3_DESCRIPTION}}
│   ├── {{SUBDIR_3_1}}/       # {{SUBDIR_3_1_DESCRIPTION}}
│   └── {{SUBDIR_3_2}}/       # {{SUBDIR_3_2_DESCRIPTION}}
└── {{CONFIG_FILE}}           # {{CONFIG_FILE_DESCRIPTION}}
```

### 構成の原則

1. **{{PRINCIPLE_1}}**: {{PRINCIPLE_1_DESCRIPTION}}
2. **{{PRINCIPLE_2}}**: {{PRINCIPLE_2_DESCRIPTION}}
3. **{{PRINCIPLE_3}}**: {{PRINCIPLE_3_DESCRIPTION}}

## 主要ディレクトリの役割

### {{MAIN_DIR_1}}/

**目的**: {{MAIN_DIR_1_PURPOSE}}

**構成パターン**:
```
{{MAIN_DIR_1}}/
├── {{MAIN_DIR_1_PATTERN_1}}/     # {{MAIN_DIR_1_PATTERN_1_DESC}}
├── {{MAIN_DIR_1_PATTERN_2}}/     # {{MAIN_DIR_1_PATTERN_2_DESC}}
└── {{MAIN_DIR_1_PATTERN_3}}/     # {{MAIN_DIR_1_PATTERN_3_DESC}}
```

**命名規則**: {{MAIN_DIR_1_NAMING}}

**例**:
```
{{MAIN_DIR_1_EXAMPLE}}
```

### {{MAIN_DIR_2}}/

**目的**: {{MAIN_DIR_2_PURPOSE}}

**構成パターン**:
```
{{MAIN_DIR_2}}/
├── {{MAIN_DIR_2_PATTERN_1}}/     # {{MAIN_DIR_2_PATTERN_1_DESC}}
├── {{MAIN_DIR_2_PATTERN_2}}/     # {{MAIN_DIR_2_PATTERN_2_DESC}}
└── {{MAIN_DIR_2_PATTERN_3}}/     # {{MAIN_DIR_2_PATTERN_3_DESC}}
```

**命名規則**: {{MAIN_DIR_2_NAMING}}

**例**:
```
{{MAIN_DIR_2_EXAMPLE}}
```

### {{MAIN_DIR_3}}/

**目的**: {{MAIN_DIR_3_PURPOSE}}

**構成パターン**:
```
{{MAIN_DIR_3}}/
├── {{MAIN_DIR_3_PATTERN_1}}/     # {{MAIN_DIR_3_PATTERN_1_DESC}}
├── {{MAIN_DIR_3_PATTERN_2}}/     # {{MAIN_DIR_3_PATTERN_2_DESC}}
└── {{MAIN_DIR_3_PATTERN_3}}/     # {{MAIN_DIR_3_PATTERN_3_DESC}}
```

**命名規則**: {{MAIN_DIR_3_NAMING}}

**例**:
```
{{MAIN_DIR_3_EXAMPLE}}
```

## 命名規則

### ファイル命名規則

| カテゴリ | 規則 | 例 |
|---------|------|-----|
| {{FILE_CATEGORY_1}} | {{FILE_NAMING_RULE_1}} | {{FILE_NAMING_EXAMPLE_1}} |
| {{FILE_CATEGORY_2}} | {{FILE_NAMING_RULE_2}} | {{FILE_NAMING_EXAMPLE_2}} |
| {{FILE_CATEGORY_3}} | {{FILE_NAMING_RULE_3}} | {{FILE_NAMING_EXAMPLE_3}} |
| {{FILE_CATEGORY_4}} | {{FILE_NAMING_RULE_4}} | {{FILE_NAMING_EXAMPLE_4}} |

### ディレクトリ命名規則

| カテゴリ | 規則 | 例 |
|---------|------|-----|
| {{DIR_CATEGORY_1}} | {{DIR_NAMING_RULE_1}} | {{DIR_NAMING_EXAMPLE_1}} |
| {{DIR_CATEGORY_2}} | {{DIR_NAMING_RULE_2}} | {{DIR_NAMING_EXAMPLE_2}} |
| {{DIR_CATEGORY_3}} | {{DIR_NAMING_RULE_3}} | {{DIR_NAMING_EXAMPLE_3}} |

### コード内の命名規則

| 要素 | 規則 | 例 |
|------|------|-----|
| {{CODE_ELEMENT_1}} | {{CODE_NAMING_RULE_1}} | {{CODE_NAMING_EXAMPLE_1}} |
| {{CODE_ELEMENT_2}} | {{CODE_NAMING_RULE_2}} | {{CODE_NAMING_EXAMPLE_2}} |
| {{CODE_ELEMENT_3}} | {{CODE_NAMING_RULE_3}} | {{CODE_NAMING_EXAMPLE_3}} |
| {{CODE_ELEMENT_4}} | {{CODE_NAMING_RULE_4}} | {{CODE_NAMING_EXAMPLE_4}} |

## インポート/モジュールパターン

### インポート規約

**順序**: {{IMPORT_ORDER}}

**例**:
```{{CODE_LANGUAGE}}
{{IMPORT_EXAMPLE}}
```

### パス解決

**絶対パス**: {{ABSOLUTE_PATH_PATTERN}}

**相対パス**: {{RELATIVE_PATH_PATTERN}}

**例**:
```{{CODE_LANGUAGE}}
{{PATH_RESOLUTION_EXAMPLE}}
```

## ファイル構成パターン

### {{FILE_PATTERN_1}}

**目的**: {{FILE_PATTERN_1_PURPOSE}}

**テンプレート**:
```{{CODE_LANGUAGE}}
{{FILE_PATTERN_1_TEMPLATE}}
```

**説明**:
- {{FILE_PATTERN_1_SECTION_1}}: {{FILE_PATTERN_1_SECTION_1_DESC}}
- {{FILE_PATTERN_1_SECTION_2}}: {{FILE_PATTERN_1_SECTION_2_DESC}}
- {{FILE_PATTERN_1_SECTION_3}}: {{FILE_PATTERN_1_SECTION_3_DESC}}

### {{FILE_PATTERN_2}}

**目的**: {{FILE_PATTERN_2_PURPOSE}}

**テンプレート**:
```{{CODE_LANGUAGE}}
{{FILE_PATTERN_2_TEMPLATE}}
```

**説明**:
- {{FILE_PATTERN_2_SECTION_1}}: {{FILE_PATTERN_2_SECTION_1_DESC}}
- {{FILE_PATTERN_2_SECTION_2}}: {{FILE_PATTERN_2_SECTION_2_DESC}}
- {{FILE_PATTERN_2_SECTION_3}}: {{FILE_PATTERN_2_SECTION_3_DESC}}

## 設定ファイル

### 主要設定ファイル

| ファイル | 目的 | 主要設定項目 |
|---------|------|------------|
| {{CONFIG_FILE_1}} | {{CONFIG_FILE_1_PURPOSE}} | {{CONFIG_FILE_1_KEYS}} |
| {{CONFIG_FILE_2}} | {{CONFIG_FILE_2_PURPOSE}} | {{CONFIG_FILE_2_KEYS}} |
| {{CONFIG_FILE_3}} | {{CONFIG_FILE_3_PURPOSE}} | {{CONFIG_FILE_3_KEYS}} |

### 環境別設定

{{ENVIRONMENT_CONFIG_PATTERN}}

## テスト構成

### テストファイルの配置

**パターン**: {{TEST_FILE_PATTERN}}

**例**:
```
{{TEST_FILE_EXAMPLE}}
```

### テストディレクトリ構成

```
{{TEST_DIR}}/
├── {{TEST_SUBDIR_1}}/        # {{TEST_SUBDIR_1_DESC}}
├── {{TEST_SUBDIR_2}}/        # {{TEST_SUBDIR_2_DESC}}
└── {{TEST_SUBDIR_3}}/        # {{TEST_SUBDIR_3_DESC}}
```

## ドキュメント構成

### ドキュメントディレクトリ

```
{{DOCS_DIR}}/
├── {{DOCS_SUBDIR_1}}/        # {{DOCS_SUBDIR_1_DESC}}
├── {{DOCS_SUBDIR_2}}/        # {{DOCS_SUBDIR_2_DESC}}
└── {{DOCS_SUBDIR_3}}/        # {{DOCS_SUBDIR_3_DESC}}
```

### ドキュメント種別

| 種別 | 配置場所 | 目的 |
|------|---------|------|
| {{DOC_TYPE_1}} | {{DOC_LOCATION_1}} | {{DOC_PURPOSE_1}} |
| {{DOC_TYPE_2}} | {{DOC_LOCATION_2}} | {{DOC_PURPOSE_2}} |
| {{DOC_TYPE_3}} | {{DOC_LOCATION_3}} | {{DOC_PURPOSE_3}} |

## 構成に関する判断

<!-- 構成に関する重要な判断とその理由を記述 -->

### {{STRUCTURE_DECISION_1}}

**判断内容**: {{STRUCTURE_DECISION_1_CONTENT}}

**理由**: {{STRUCTURE_DECISION_1_RATIONALE}}

**影響**: {{STRUCTURE_DECISION_1_IMPACT}}

### {{STRUCTURE_DECISION_2}}

**判断内容**: {{STRUCTURE_DECISION_2_CONTENT}}

**理由**: {{STRUCTURE_DECISION_2_RATIONALE}}

**影響**: {{STRUCTURE_DECISION_2_IMPACT}}

## 参照

- アーキテクチャ概要: [architecture.md](./architecture.md)
- 技術スタック: [tech-stack.md](./tech-stack.md)
- API設計: [../development/api-design.md](../development/api-design.md)
