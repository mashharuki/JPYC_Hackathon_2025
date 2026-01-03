# JPYC Development Toolkit Skill

日本円建てステーブルコインJPYCを使ったアプリ開発を支援するための包括的なスキルです。

## 📦 パッケージ情報

- **スキル名**: jpyc-dev-toolkit
- **バージョン**: 1.0.0
- **パッケージファイル**: `jpyc-dev-toolkit.skill`
- **対象ネットワーク**: Base Sepolia（推奨）

## 🚀 インストール方法

### 1. スキルファイルをClaude Codeにインストール

```bash
# プロジェクトルートにあるスキルファイルを使用
claude-code skill install jpyc-dev-toolkit.skill
```

または、Claude Code CLIで：

```
/skill install jpyc-dev-toolkit.skill
```

### 2. スキルの確認

インストール後、以下のコマンドでスキルが正しくインストールされたか確認できます：

```
/skill list
```

## 💡 使い方

スキルがインストールされると、以下のようなリクエストで自動的にトリガーされます：

- "JPYCの送金機能を実装して"
- "JPYC SDKをセットアップして"
- "Base SepoliaにJPYCをデプロイして"
- "JPYC残高表示コンポーネントを作成して"
- "transferWithAuthorizationの使い方を教えて"

## 📚 提供機能

### 1. JPYC SDK v1サポート

- Git Submoduleとしての自動セットアップ
- 9つの主要操作（Mint, Transfer, Approve, Permit等）
- 完全なドキュメントとコード例

### 2. スマートコントラクト開発

- JPYCIntegration.sol テンプレート
- Base Sepolia対応のHardhat設定
- 自動デプロイスクリプト
- コントラクト検証サポート

### 3. フロントエンド統合

- Reactコンポーネントテンプレート（Balance表示、Transfer フォーム）
- Wagmi + Viem設定例
- エラーハンドリングとローディング状態管理

### 4. 統合パターンガイド

- P2P送金
- EC決済
- ガスレス決済（EIP-2612, EIP-3009）
- B2B請求書払い

## 🗂️ スキル構成

```
jpyc-dev-toolkit/
├── SKILL.md                          # メインドキュメント
├── scripts/
│   ├── setup_jpyc_sdk.sh            # SDK自動セットアップ
│   └── deploy_jpyc_base.ts          # Base Sepoliaデプロイ
├── references/
│   ├── sdk-features.md              # SDK機能リファレンス
│   ├── integration-patterns.md      # 統合パターン集
│   ├── network-config.md            # ネットワーク設定
│   └── resources.md                 # 外部リソースリンク
└── assets/
    ├── contract-templates/
    │   └── JPYCIntegration.sol      # コントラクトテンプレート
    ├── frontend-examples/
    │   ├── JPYCBalance.tsx          # 残高表示コンポーネント
    │   └── JPYCTransfer.tsx         # 送金フォームコンポーネント
    └── hardhat-config/
        └── hardhat.config.example.ts # Hardhat設定例
```

## 🔧 開発フロー例

### シナリオ1: SDK使用

```bash
# 1. SDKセットアップ
bash scripts/setup_jpyc_sdk.sh

# 2. 環境変数設定
# external/jpyc-sdk/packages/v1/.env を編集

# 3. SDK機能の実行
cd external/jpyc-sdk/packages/v1
yarn run transfer
```

### シナリオ2: カスタムコントラクト開発

```bash
# 1. テンプレートをコピー
cp assets/contract-templates/JPYCIntegration.sol contracts/

# 2. Hardhat設定
cp assets/hardhat-config/hardhat.config.example.ts hardhat.config.ts

# 3. デプロイ
npx hardhat run scripts/deploy_jpyc_base.ts --network baseSepolia
```

### シナリオ3: フロントエンド実装

```typescript
// 1. コンポーネントをコピー
// assets/frontend-examples/JPYCBalance.tsx → src/components/

// 2. 使用例
import { JPYCBalance } from './components/JPYCBalance';

function App() {
  return (
    <JPYCBalance jpycAddress="0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB" />
  );
}
```

## 🎯 推奨パターン

| ユースケース | 推奨パターン | 理由 |
|-------------|-------------|------|
| P2P送金 | `transfer` | シンプルで低コスト |
| EC決済 | `transferWithAuthorization` (EIP-3009) | 決済ID紐付け、カスタムコントラクト不要 |
| サブスク | `permit + transferFrom` (EIP-2612) | ガスレス、柔軟な実装 |
| B2B請求 | `receiveWithAuthorization` (EIP-3009) | 受取側がコントロール |

## 📖 詳細ドキュメント

- **SDK機能**: `references/sdk-features.md`
- **統合パターン**: `references/integration-patterns.md`
- **ネットワーク設定**: `references/network-config.md`
- **外部リソース**: `references/resources.md`

## 🔗 リンク

- [JPYC公式サイト](https://jpyc.co.jp/)
- [JPYC企業サイト](https://corporate.jpyc.co.jp/)
- [JPYCv2 GitHub](https://github.com/jcam1/JPYCv2)
- [JPYC SDK Examples](https://github.com/jcam1/sdk-examples)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)

## 🤝 サポート

スキルに関する質問や改善提案は、プロジェクトのIssueで報告してください。

## 📄 ライセンス

MIT License
