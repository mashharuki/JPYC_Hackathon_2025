# Project Structure

## Organization Philosophy

**フェーズ別・機能別の構成** - 現在はプロジェクト初期段階のため、ドキュメント・設定ファイルが中心。

今後のコード実装では、フロントエンド・スマートコントラクト・バックエンドを明確に分離し、保守性・拡張性を確保する。

## Directory Patterns

### ドキュメント・設計

**Location**: `/docs/`
**Purpose**: プロジェクトのアイデア・要件定義・設計書を管理
**Example**: `docs/idea.md`（要件定義Draft）

### Kiro 仕様駆動開発

**Location**: `.kiro/`
**Purpose**: AI-DLC（AI Development Life Cycle）に基づく仕様管理
**Subdirectories**:

- `.kiro/steering/`: プロジェクト全体のルール・コンテキスト（product.md, tech.md, structure.md）
- `.kiro/specs/`: 個別機能の仕様（requirements.md, design.md, tasks.md）
- `.kiro/settings/`: テンプレート・ルール定義（変更不要）

### AI エージェント設定

**Location**: `CLAUDE.md`, `AGENTS.md`
**Purpose**: AI エージェントへの指示・ガイドライン
**Example**:

- `CLAUDE.md`: Kiroワークフローの説明
- `AGENTS.md`: Spec駆動開発 × TDD の共通ガイドライン

### 今後追加予定のディレクトリ

#### スマートコントラクト

**Location**: `/contracts/`
**Purpose**: Solidityで記述されたスマートコントラクト
**Example**: `contracts/SupportWallet.sol`, `contracts/SemaphoreIntegration.sol`

#### フロントエンド

**Location**: `/frontend/` または `/app/`
**Purpose**: React/Next.js によるUI実装
**Example**: `frontend/components/`, `frontend/pages/`

#### テスト

**Location**: `/test/`
**Purpose**: スマートコントラクト・フロントエンド・統合テスト
**Example**: `test/SupportWallet.test.ts`

#### デプロイスクリプト

**Location**: `/scripts/`
**Purpose**: スマートコントラクトのデプロイ・セットアップスクリプト
**Example**: `scripts/deploy.ts`

## Naming Conventions

- **Markdown Files**: kebab-case（`idea.md`, `design.md`）
- **TypeScript Files**: PascalCase（コンポーネント・クラス）/ camelCase（関数・変数）
- **Solidity Contracts**: PascalCase（`SupportWallet.sol`）
- **Directories**: kebab-case または camelCase（`frontend/`, `smart-contracts/`）

## Import Organization

```typescript
// 外部ライブラリ
import { ethers } from "ethers"
import React from "react"

// プロジェクト内モジュール（絶対パス）
import { SupportWallet } from "@/contracts/SupportWallet"

// 相対パス（同階層・近接ファイル）
import { formatAddress } from "./utils"
```

**Path Aliases**:

- `@/`: プロジェクトルートにマッピング（予定）

## Code Organization Principles

### DRY原則

- 重複を避け、単一の信頼できる情報源を維持
- 共通ロジックはユーティリティ関数・モジュールに抽出

### ボーイスカウトルール

- コードを見つけた時よりも良い状態で残す
- 小さな問題も放置せず、発見次第修正

### レイヤー分離

- **Contract Layer**: スマートコントラクト（ビジネスロジック）
- **Frontend Layer**: UI・UX（ユーザーインタラクション）
- **Integration Layer**: Web3プロバイダー・SDK（コントラクトとUIの橋渡し）

### テストの配置

- スマートコントラクト: `/test/contracts/`
- フロントエンド: `/test/frontend/`
- 統合テスト: `/test/integration/`

---

_Document patterns, not file trees. New files following patterns shouldn't require updates_
