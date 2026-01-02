# Technology Stack

## Architecture

**Web3 分散型アーキテクチャ** - ブロックチェーンベースの透明性・追跡可能性を活用したフルスタック構成

ハッカソンMVPフェーズのため、プロトタイプとして動作する最小構成を優先しつつ、品質・保守性を意識した実装を目指す。

## Core Technologies

- **Language**: TypeScript（厳格な型安全性）
- **Blockchain**: Ethereum互換チェーン（テストネット）
- **Smart Contracts**: Solidity
- **Frontend**: React / Next.js（予定）
- **Wallet Integration**: Web3プロバイダー（MetaMask等）
- **Stablecoin**: JPYC（日本円建てステーブルコイン）

## Key Libraries

- **Zero-Knowledge Proof**: Semaphore（匿名性保証）
- **Web3 SDK**: ethers.js / viem
- **スマートコントラクト開発**: Hardhat / Foundry
- **UI Framework**: TBD（React系を想定）

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
- **スマートコントラクト**: 必ず単体テストを実装
- エラーケースも必ずカバー

## Development Environment

### Required Tools

- Node.js 20+
- pnpm / npm / yarn（依存関係管理）
- Hardhat / Foundry（スマートコントラクト開発）
- MetaMask（ウォレット）

### Common Commands

```bash
# Dev: npm run dev / pnpm dev
# Build: npm run build / pnpm build
# Test: npm test / pnpm test
# Contract Deploy: npx hardhat run scripts/deploy.ts
```

## Key Technical Decisions

### ゼロ知識証明の活用

- **Semaphore**: 支援の匿名性を担保
- 支援者が「自分が支援した」ことを証明しつつ、個人情報は秘匿

### ブロックチェーン選定

- Ethereum互換チェーン（テストネット）でMVP構築
- ガス代・速度を考慮し、本番環境では Layer 2 も検討

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
