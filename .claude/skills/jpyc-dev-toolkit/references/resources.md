# JPYC開発リソース

## 公式リソース

### JPYC公式サイト

- **企業サイト**: https://corporate.jpyc.co.jp/
  - JPYCの概要、ビジョン、企業情報

- **ユーザー向けサイト**: https://jpyc.co.jp/
  - JPYCの使い方、購入方法、対応サービス

- **情報サイト**: https://jpyc-info.com/
  - 技術仕様、統合ガイド、FAQ

### GitHubリポジトリ

#### JPYCv2（コントラクト本体）

- **リポジトリ**: https://github.com/jcam1/JPYCv2
- **内容**: JPYCトークンのSolidityコントラクト
- **機能**:
  - ERC20標準実装
  - EIP-2612（Permit）サポート
  - EIP-3009（Transfer/Receive with Authorization）サポート
  - アクセス制御（Minter, Burner, Pauser役割）

#### JPYC SDK Examples

- **リポジトリ**: https://github.com/jcam1/sdk-examples
- **内容**: JPYC SDK v1の使用例とドキュメント
- **機能一覧**: https://github.com/jcam1/sdk-examples/tree/main/packages/v1
- **提供機能**:
  - Mint
  - Total Supply
  - Transfer
  - Approve
  - Transfer From
  - Permit Allowance
  - Transfer with Authorization
  - Receive with Authorization
  - Cancel Authorization

#### JPYC SDKs（本体）

- **リポジトリ**: https://github.com/jcam1/sdks
- **ブランチ**: develop（推奨）
- **使用方法**: Git Submoduleとして追加
  ```bash
  git submodule add -b develop https://github.com/jcam1/sdks.git external/jpyc-sdk
  ```

### コントラクトソースコード

- **Sepolia Etherscan**: https://sepolia.etherscan.io/address/0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB#code
  - 検証済みソースコード
  - Read/Write Contract機能
  - イベントログ

## サンプルプロジェクト

### JPYC AI Agent（完全版）

- **リポジトリ**: https://github.com/mashharuki/jpyc-ai-agent/tree/complete
- **作者**: mashharuki
- **内容**: JPYCを使ったAIエージェント実装の完全版
- **参考ポイント**:
  - JPYC統合の実装例
  - AI Agentとの連携パターン
  - フロントエンド実装

## 技術記事

### Zenn記事

#### JPYC決済実装パターン（Part 1）

- **URL**: https://zenn.dev/mameta29/articles/4dcb803377b4ae
- **著者**: mameta29
- **内容**:
  - JPYC決済の基本的な実装パターン
  - `transfer`, `approve + transferFrom`, `permit + transferFrom`の比較
  - セキュリティ注意点（approve変更時のリプレイ攻撃など）
  - EIP-712署名の安全性

**主要な学び**:
- P2P送金には`transfer`で十分
- EC決済には`approve + transferFrom`で注文IDを紐付け
- UX改善には`permit + transferFrom`でガスレス化

#### JPYC決済実装パターン（Part 2）

- **URL**: https://zenn.dev/mameta29/articles/4f880f8a7199b7
- **著者**: mameta29
- **内容**:
  - オフチェーン決済IDとオンチェーントランザクションの紐付け課題
  - EIP-3009（`transferWithAuthorization`）の詳細
  - 推奨パターン: nonceに決済IDをハッシュ化して紐付け
  - イベント監視システムの実装

**主要な学び**:
- **推奨**: EIP-3009でカスタムコントラクト不要
- `AuthorizationUsed`イベントでnonceを追跡
- DB管理で`paymentId ↔ nonce`対応を保存

## 開発ツール

### Hardhat

- **公式サイト**: https://hardhat.org/
- **用途**: Solidityスマートコントラクト開発
- **インストール**:
  ```bash
  npm install --save-dev hardhat
  ```

### ethers.js

- **公式サイト**: https://docs.ethers.org/v6/
- **用途**: Ethereumとの連携（フロントエンド/バックエンド）
- **インストール**:
  ```bash
  npm install ethers
  ```

### viem

- **公式サイト**: https://viem.sh/
- **用途**: 軽量で型安全なEthereum連携ライブラリ
- **インストール**:
  ```bash
  npm install viem
  ```

### Wagmi

- **公式サイト**: https://wagmi.sh/
- **用途**: React Hooks for Ethereum（viemベース）
- **インストール**:
  ```bash
  npm install wagmi viem@2.x
  ```

## ブロックエクスプローラー

### Ethereum

- **Mainnet**: https://etherscan.io/
- **Sepolia**: https://sepolia.etherscan.io/

### Polygon

- **Mainnet**: https://polygonscan.com/
- **Amoy**: https://amoy.polygonscan.com/

### Base

- **Mainnet**: https://basescan.org/
- **Sepolia**: https://sepolia.basescan.org/

## EIP仕様

### EIP-2612（Permit）

- **仕様**: https://eips.ethereum.org/EIPS/eip-2612
- **概要**: 署名ベースのERC20承認
- **メリット**: ガスレスでapprove可能

### EIP-3009（Transfer/Receive with Authorization）

- **仕様**: https://eips.ethereum.org/EIPS/eip-3009
- **概要**: 署名ベースのトークン転送
- **メリット**: カスタムコントラクト不要で決済ID紐付け可能

### EIP-712（Typed Structured Data Hashing）

- **仕様**: https://eips.ethereum.org/EIPS/eip-712
- **概要**: 型付き構造化データの署名
- **メリット**: ドメインセパレータで署名の再利用を防止

## テストネットFaucet

### Ethereum Sepolia

- **Alchemy Faucet**: https://www.alchemy.com/faucets/ethereum-sepolia
- **Infura Faucet**: https://www.infura.io/faucet/sepolia

### Base Sepolia

- **Coinbase Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Alchemy Faucet**: https://www.alchemy.com/faucets/base-sepolia
- **QuickNode Faucet**: https://faucet.quicknode.com/base/sepolia

## RPC Providers

### Alchemy

- **サイト**: https://www.alchemy.com/
- **無料プラン**: あり
- **対応ネットワーク**: Ethereum, Polygon, Base等

### Infura

- **サイト**: https://www.infura.io/
- **無料プラン**: あり
- **対応ネットワーク**: Ethereum, Polygon等

### QuickNode

- **サイト**: https://www.quicknode.com/
- **無料トライアル**: あり
- **対応ネットワーク**: 30以上のブロックチェーン

## コミュニティ

### Discord

- JPYC公式Discordがある場合はここに追加

### Twitter/X

- **JPYC公式**: JPYCの公式アカウントを確認

## 学習リソース

### Solidity

- **公式ドキュメント**: https://docs.soliditylang.org/
- **Solidity by Example**: https://solidity-by-example.org/

### OpenZeppelin

- **公式サイト**: https://www.openzeppelin.com/
- **Contracts**: https://docs.openzeppelin.com/contracts/
- **用途**: 安全なスマートコントラクトライブラリ

### Web3開発全般

- **Ethereum.org**: https://ethereum.org/en/developers/
- **useWeb3**: https://www.useweb3.xyz/

## セキュリティ

### 監査サービス

- **OpenZeppelin**: https://www.openzeppelin.com/security-audits
- **Trail of Bits**: https://www.trailofbits.com/
- **Consensys Diligence**: https://consensys.io/diligence/

### セキュリティツール

- **Slither**: Solidityの静的解析ツール
  - https://github.com/crytic/slither
- **Mythril**: スマートコントラクトセキュリティツール
  - https://github.com/ConsenSys/mythril

## トラブルシューティング

### よくある質問

1. **Base SepoliaでJPYCが使えない**
   - 公式デプロイがないため、自分でデプロイする必要あり
   - `network-config.md`を参照

2. **署名エラーが発生する**
   - ドメインセパレータ（chainId, verifyingContract）を確認
   - nonceが使用済みでないか確認

3. **ガス代が高すぎる**
   - Base Sepoliaなど、L2ネットワークの使用を検討
   - `permit`や`transferWithAuthorization`でユーザーのガス負担を軽減

4. **イベントが検出されない**
   - RPC Providerの遅延を考慮（confirmations待機）
   - WebSocketでリアルタイム監視を検討
