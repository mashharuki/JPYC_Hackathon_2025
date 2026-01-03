# Technology Stack

## Architecture

**Web3 分散型アーキテクチャ** - ブロックチェーンベースの透明性・追跡可能性を活用したフルスタック構成

ハッカソンMVPフェーズのため、プロトタイプとして動作する最小構成を優先しつつ、品質・保守性を意識した実装を目指す。

## Core Technologies

- **Language**: TypeScript（厳格な型安全性）
- **Blockchain**: Ethereum互換チェーン（Base Sepolia, Sepolia）
- **Smart Contracts**: Solidity 0.8.23
- **Frontend**: Next.js 16 (App Router)
- **Wallet Integration**: Biconomy (Account Abstraction), Privy (Auth)
- **Stablecoin**: JPYC（日本円建てステーブルコイン）
- **Backend/State**: Supabase

## Key Libraries

- **Zero-Knowledge Proof**: Semaphore v4 (匿名性保証)
- **Web3 SDK**: ethers.js v6 / viem
- **Smart Contract Dev**: Hardhat
- **UI Framework**: Tailwind CSS, Radix UI
- **Testing**: Jest, React Testing Library, Hardhat Toolbox

## Development Standards

### Type Safety

- TypeScript strict mode有効
- `any`型の使用を禁止（`unknown`で型安全に）
- すべての外部データに型ガードを適用

### Code Quality

- ESLint + Prettier（プロジェクト全体で一貫したスタイル）
- DRY原則：重複コードを避け、単一の信頼できる情報源を維持
- 意味のある変数名・関数名で意図を明確に

### Testing

- **テスト駆動開発（TDD）**: t-wadaさんの原則に沿った実装
- 振る舞いをテスト（実装詳細ではなく）
- カバレッジは指標、質の高いテストを重視
- **スマートコントラクト**: 必ず単体テストを実装 (`pkgs/contracts/test`)
- **フロントエンド**: Jestによるコンポーネント/ロジックテスト (`pkgs/web-app`)
- エラーケースも必ずカバー

## Development Environment

### Required Tools

- Node.js 20+
- Yarn (Package Manager)
- Hardhat (Smart Contracts)
- MetaMask (Wallet)

### Common Commands

```bash
# Web App
# Dev: cd pkgs/web-app && yarn dev
# Build: cd pkgs/web-app && yarn build
# Test: cd pkgs/web-app && yarn test

# Contracts
# Compile: cd pkgs/contracts && yarn compile
# Test: cd pkgs/contracts && yarn test
# Deploy: cd pkgs/contracts && yarn deploy --network baseSepolia
```

## Key Technical Decisions

### ゼロ知識証明の活用

- **Semaphore**: 支援の匿名性を担保
- 支援者が「自分が支援した」ことを証明しつつ、個人情報は秘匿

### ブロックチェーン選定

- **Base Sepolia**: 高速・低コストなL2テストネットとして採用
- **Sepolia**: バックアップ/代替テストネット

### ウォレット・認証

- **Biconomy**: Account Abstractionによるガス代代行・UX向上
- **Privy**: シームレスなソーシャルログイン・ウォレット作成

### セキュリティ

- APIキー・秘密鍵は環境変数で管理（`.env`にハードコード禁止）
- すべての外部入力を検証
- スマートコントラクトは監査を想定した設計

### エラーハンドリング

- エラーの抑制（`@ts-ignore`、`try-catch`で握りつぶし）ではなく、根本原因を修正
- 外部API・ネットワーク通信は必ず失敗する可能性を考慮

### パフォーマンス

- 推測ではなく計測に基づいて最適化
- N+1問題・オーバーフェッチを避ける

---

_Document standards and patterns, not every dependency_
