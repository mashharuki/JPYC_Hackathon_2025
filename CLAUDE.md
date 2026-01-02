@AGENTS.md

# AI-DLC と仕様駆動開発 (Spec-Driven Development)

AI-DLC (AI Development Life Cycle) 上での Kiro スタイル仕様駆動開発の実装

## プロジェクトコンテキスト

### パス構成

- ステアリング (Steering): `.kiro/steering/`
- 仕様書 (Specs): `.kiro/specs/`

### ステアリングと仕様書の違い

**ステアリング** (`.kiro/steering/`) - プロジェクト全体のルールやコンテキストで AI をガイドします
**仕様書** (`.kiro/specs/`) - 個別の機能開発プロセスを形式化します

### アクティブな仕様

- `.kiro/specs/` を確認してアクティブな仕様を把握してください
- `/kiro:spec-status [feature-name]` を使用して進捗状況を確認できます

## 開発ガイドライン

- 思考は英語で行い、回答は日本語で生成してください。プロジェクトファイル（例：requirements.md, design.md, tasks.md, research.md, validation reports）に書き込まれるすべての Markdown コンテンツは、この仕様書で設定されたターゲット言語（spec.json.language を参照）で記述する必要があります。

## 最小ワークフロー

- フェーズ 0 (任意): `/kiro:steering`, `/kiro:steering-custom`
- フェーズ 1 (仕様策定):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (任意: 既存コードベースがある場合)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (任意: 設計レビュー)
  - `/kiro:spec-tasks {feature} [-y]`
- フェーズ 2 (実装): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (任意: 実装後)
- 進捗確認: `/kiro:spec-status {feature}` (いつでも使用可能)

## 開発ルール

- 3段階の承認ワークフロー: 要件定義 → 設計 → タスク分解 → 実装
- 各フェーズで人間のレビューが必要です。意図的なファストトラック（承認スキップ）の場合のみ `-y` を使用してください
- ステアリングを最新の状態に保ち、`/kiro:spec-status` で整合性を確認してください
- ユーザーの指示に正確に従い、その範囲内で自律的に行動してください：必要なコンテキストを収集し、要求された作業をこの実行内でエンドツーエンドで完了させます。重要な情報が欠けている場合や指示が決定的に曖昧な場合のみ質問してください。

## ステアリング設定

- `.kiro/steering/` 全体をプロジェクトメモリとして読み込みます
- デフォルトファイル: `product.md`, `tech.md`, `structure.md`
- カスタムファイルもサポートされています (`/kiro:steering-custom` で管理)
