# Implementation Gap Analysis: Innocence Ledger MVP

**Feature**: `innocence-ledger-mvp`
**Analysis Date**: 2026-01-04
**Language**: 日本語

---

## Executive Summary

Innocence Ledger MVPは、既存のSemaphore匿名証明システムとJPYC統合基盤を活用し、**MultiSig Wallet + 匿名寄付 + ホワイトリスト受取人管理**という新しい機能領域を追加するプロジェクトです。

### スコープ概要

- **既存資産の活用率**: 高（Semaphoreインフラ、JPYC SDK、フロントエンドコンポーネント、Biconomy AA統合が利用可能）
- **新規開発領域**: MultiSig Walletスマートコントラクト、受取人管理ロジック、ダッシュボードUI
- **統合の複雑性**: 中〜高（Semaphore + JPYC + MultiSig + EIP-712署名検証の組み合わせ）

### 主な発見

✅ **強みとなる既存資産**:

- Semaphore v4統合済み（`SemaphoreContext.tsx`, `useSemaphoreIdentity.ts`, `Feedback.sol`）
- JPYC SDK（external/jpyc-sdk）とBase Sepolia環境設定
- Biconomy Account Abstraction統合（`useBiconomy.ts`）
- MultiSig Walletリファレンス実装（`.claude/skills/multisigwallet/`）
- Privy認証 + Supabaseバックエンド

⚠️ **ギャップと課題**:

- MultiSig Walletスマートコントラクトの未実装（EIP-712署名検証、ホワイトリスト管理、JPYC受信機能が必要）
- Semaphore証明とJPYC送金の統合パターンが未確立
- ケースダッシュボードUIの新規作成
- 既存`Feedback.sol`の拡張 vs 新規コントラクト作成の判断

### 推奨アプローチ

**Option C: Hybrid Approach（ハイブリッド）** を推奨します。

- **Phase 1**: 新規MultiSig Walletコントラクト作成 + Semaphore統合
- **Phase 2**: フロントエンド統合（既存コンポーネント拡張 + 新規ダッシュボードUI）
- **Phase 3**: テスト・デプロイ・検証

---

## 1. Current State Investigation

### 1.1 Key Files and Directory Layout

#### スマートコントラクト（`pkgs/contracts/`）

**既存**:

- `contracts/Feedback.sol`: Semaphore v4統合済みコントラクト（グループ作成、メンバー追加、証明検証）
- `test/Feedback.test.ts`: Hardhat + ethers v6テスト環境
- `tasks/deploy.ts`: デプロイタスク（Semaphore自動デプロイ機能付き）
- `hardhat.config.ts`: Base Sepolia, Sepolia設定済み

**ギャップ**:

- ❌ MultiSig Wallet コントラクトが未実装
- ❌ JPYC ERC20統合（受信、残高確認、送金）が未実装
- ❌ EIP-712署名検証ロジックが未実装
- ❌ ホワイトリスト管理機能が未実装

#### フロントエンド（`pkgs/web-app/`）

**既存**:

- **Semaphore統合**: `SemaphoreContext.tsx`, `useSemaphoreIdentity.ts`（Identity生成、グループ参加、証明作成）
- **認証**: `AuthContext.tsx`, Privy統合（`privy-provider.tsx`）
- **Web3統合**: `useBiconomy.ts`（Account Abstraction、ガスレストランザクション）
- **UI Components**: Radix UI（Button, Card, Dialog, Input, Spinner等）
- **ページ構成**: Next.js 16 App Router（`app/page.tsx`, `app/group/page.tsx`, `app/proofs/page.tsx`）

**ギャップ**:

- ❌ MultiSig Walletインタラクション用hooks（`useMultiSigWallet.ts`）未実装
- ❌ JPYC残高表示・送金UIコンポーネント未実装
- ❌ 支援ケースダッシュボード未実装
- ❌ 受取人設定画面未実装
- ❌ 寄付金受け取り画面未実装

#### 外部リソース

**利用可能**:

- `external/jpyc-sdk/`: JPYC React hooks（`useBalanceOf`, `useTransfer`, `useApprove`等）
- `external/jpycv2/`: JPYCコントラクトリファレンス（ERC20準拠、Solidity実装）
- `.claude/skills/multisigwallet/`: MultiSig Wallet参考実装（Solidity + TypeScript EIP-712生成）
- `.claude/skills/semaphore-protocol/`: Semaphore統合ガイド

### 1.2 Architectural Patterns and Conventions

#### スマートコントラクト

- **言語**: Solidity 0.8.23
- **フレームワーク**: Hardhat + @nomicfoundation/hardhat-toolbox
- **テスト**: Hardhat Chai Matchers + ethers v6
- **デプロイ**: Hardhat tasks（`tasks/deploy.ts`）
- **パターン**:
  - Semaphore ISemaphore インターフェース経由での統合
  - イベント駆動（`MemberAdded`, `ProofValidated`）
  - コンストラクタでのSemaphoreグループ作成

#### フロントエンド

- **フレームワーク**: Next.js 16 (App Router)
- **Web3ライブラリ**: viem v2.43.4 + Biconomy AbstractJS
- **状態管理**: React Context API（`SemaphoreContext`, `AuthContext`）
- **UI**: Tailwind CSS + Radix UI
- **認証**: Privy（ソーシャルログイン、エンベデッドウォレット）
- **バックエンド**: Supabase（Identity秘密鍵ストレージ）
- **パターン**:
  - カスタムフック（`useSemaphoreIdentity`, `useBiconomy`）
  - コンテキストプロバイダー（`SemaphoreContextProvider`）
  - viem `getPublicClient` + `getLogs` によるイベント取得

### 1.3 Integration Surfaces

#### データモデル/スキーマ

**Supabase `identities` テーブル**:

- `user_id`: PrivyユーザーID
- `private_key`: Semaphore Identity秘密鍵
- `commitment`: Identity Commitment
- `updated_at`: 更新タイムスタンプ

**必要な拡張**（Research Needed）:

- 支援ケース情報（ケースID、タイトル、説明、目標金額、MultiSigアドレス、Semaphoreグループ ID）
- ケースとMultiSig Walletのマッピング
- 受取人ホワイトリスト（オンチェーンで管理するためSupabaseは不要の可能性）

#### API Clients

- **Semaphore Contract**: ISemaphore インターフェース（`@semaphore-protocol/contracts`）
- **JPYC SDK**: React hooks（`@jpyc-sdk/react` - 現在未インストール、`external/jpyc-sdk`に存在）
- **Biconomy**: NexusClient（`useBiconomy.ts`）

#### Auth Mechanisms

- **Privy**: ソーシャルログイン + エンベデッドウォレット
- **Biconomy AA**: ガス代代行（Paymaster）+ スマートアカウント
- **Signature Verification**: EIP-712（MultiSig Wallet用、未実装）

---

## 2. Requirements Feasibility Analysis

### 2.1 Technical Needs（要件から抽出）

#### データモデル

**Requirement 1: MultiSig Wallet作成とSemaphoreグループ統合**

- MultiSigWallet struct: `owners[]`, `threshold`, `nonce`
- Semaphore Group ID ↔ MultiSigWallet Address マッピング
- ケース情報（オフチェーン: Supabase、オンチェーン: イベントログ）

**Requirement 3: 受取人ホワイトリスト設定**

- `mapping(address => bool) public whitelist`（コントラクト内）
- 署名検証用: EIP-712 domain, types, message

**Requirement 6: 支援ケースダッシュボード表示**

- ケース一覧データ（Supabase or オンチェーンイベント集約）
- MultiSig Walletアドレスごとの残高情報

#### APIs / Services

**Requirement 2: 匿名寄付機能**

- Semaphore Proof生成API（フロントエンド: `@semaphore-protocol/core`）
- JPYC `transfer` or `approve + transferFrom`（viem `encodeFunctionData`）
- MultiSig Wallet `receiveDonation` メソッド（新規実装必要）

**Requirement 4: 寄付金受け取り機能**

- JPYC `transfer` from MultiSig Wallet to 受取人
- ホワイトリスト検証ロジック

**Requirement 5: ウォレット残高表示機能**

- viem `getBalance` (ETH)
- JPYC `balanceOf` (ERC20 call)

**Requirement 8: JPYC統合**

- JPYC Base Sepolia コントラクトアドレス取得（external/jpyc-sdk/packages/core/src/utils/addresses.ts）
- ERC20 ABI（`@jpyc-sdk/core` or viem `parseAbi`）

#### UI / Components

**新規作成が必要**:

- ケースダッシュボード（`app/cases/page.tsx`）
- MultiSig Wallet作成フォーム（`app/cases/create/page.tsx`）
- 寄付画面（`app/cases/[id]/donate/page.tsx`）
- 受取人設定画面（`app/cases/[id]/recipients/page.tsx`）
- 受け取り画面（`app/cases/[id]/withdraw/page.tsx`）

**拡張が必要**:

- Balance表示コンポーネント（既存UIパターンを踏襲）
- トランザクションステータス表示（`useBiconomy.ts` の拡張）

#### Business Rules / Validation

**Requirement 7: セキュリティとアクセス制御**

- オンチェーン: `onlyOwner`, `onlyWhitelisted` モディファイア
- フロントエンド: 署名データのサニタイゼーション、アドレス検証
- リエントランシー対策: Checks-Effects-Interactions パターン
- Nonce管理: 署名再利用攻撃防止

**Requirement 9: エラーハンドリング**

- フロントエンド: viem error parsing、revert reason解析
- ユーザーフレンドリーなエラーメッセージ（日本語）
- トランザクションハッシュ表示 + Block Explorer リンク

#### Non-Functionals

**Security**:

- EIP-712署名検証（ECDSA recovery）
- Semaphore proof validation（グループメンバーシップ証明）
- ホワイトリスト管理の署名要件（2-of-N）

**Performance**:

- Biconomy AAによるガス最適化
- イベントログの効率的な取得（`fromBlock`, `toBlock` 最適化）

**Scalability**:

- 複数ケースの同時管理（ケースIDによる分離）
- Semaphoreグループのスケーラビリティ（Merkle Tree深さ: デフォルト20）

**Reliability**:

- トランザクション失敗時のリトライ（フロントエンド）
- ネットワーク切断時のエラーハンドリング

### 2.2 Gaps and Constraints

#### Missing Capabilities（欠落している機能）

**スマートコントラクト層**:

1. ❌ **MultiSig Walletコントラクト全体**:
   - EIP-712署名検証付き`executeTransaction`
   - 受取人ホワイトリスト管理（`addRecipient`, `removeRecipient`）
   - JPYC受信機能（`receiveDonation` with Semaphore proof）
   - 引き出し機能（`withdraw` with whitelist check）
   - Owner管理（2-of-N署名検証）

2. ❌ **JPYC統合**:
   - JPYC ERC20インターフェースの import
   - `transferFrom` 権限管理（MultiSig WalletがJPYCを保持する仕組み）

3. ❌ **Semaphore + JPYC統合パターン**:
   - 単一トランザクション内での証明検証 + JPYC送金
   - または2段階（approve → transferFrom with proof）

**フロントエンド層**:

1. ❌ **MultiSig Wallet統合hooks**:
   - `useMultiSigWallet.ts`（作成、署名生成、トランザクション送信）
   - `useRecipientManagement.ts`（受取人追加・削除）
   - `useWithdraw.ts`（引き出し処理）

2. ❌ **JPYC統合hooks**:
   - JPYC SDK（`external/jpyc-sdk`）のインストールと設定
   - または viem ベースの独自実装（`useJPYCBalance.ts`, `useJPYCTransfer.ts`）

3. ❌ **ケース管理システム**:
   - ケース作成フロー（MultiSig + Semaphore Group同時生成）
   - ケース一覧・詳細表示
   - 寄付履歴の可視化

4. ❌ **EIP-712 Typed Data生成**:
   - viem `signTypedData` 対応の型定義
   - 署名収集・検証フロー

#### Unknowns（不明点 - Research Needed）

1. **MultiSig WalletとSemaphoreグループの紐付け方法**:
   - オプションA: コントラクト内にmapping（`mapping(uint256 groupId => address multiSig)`）
   - オプションB: オフチェーンDB（Supabase）で管理
   - オプションC: イベントログから再構築
   - **推奨**: オプションC（イベント駆動、オンチェーン完結）

2. **JPYC寄付の実装パターン**:
   - オプションA: ユーザー → MultiSig Wallet直接送金（`transfer`）+ 別途Semaphore proof送信
   - オプションB: MultiSig Wallet内で`transferFrom` + Semaphore proof検証を同時実行
   - **推奨**: オプションB（アトミック性、セキュリティ向上）

3. **ケース情報の永続化戦略**:
   - オプションA: 完全オンチェーン（コスト高）
   - オプションB: Supabase + イベントログのハイブリッド
   - **推奨**: オプションB（コスト効率、クエリ性能）

4. **署名収集フロー**:
   - オプションA: オフチェーン署名収集（フロントエンド or バックエンド）
   - オプションB: オンチェーン署名収集（ガスコスト増）
   - **推奨**: オプションA（ガス効率、UX向上）

5. **JPYC Base Sepoliaコントラクトアドレス**:
   - `external/jpyc-sdk/packages/core/src/utils/addresses.ts` に定義されているか確認必要
   - 未定義の場合はJPYC公式ドキュメントまたはデプロイが必要

#### Constraints（制約）

1. **既存アーキテクチャ**:
   - Semaphore v4の仕様（グループ管理、証明生成）
   - Biconomy AAのガス制限（`callGasLimit`, `verificationGasLimit`）
   - Privy認証フロー（エンベデッドウォレット前提）

2. **技術スタック**:
   - Solidity 0.8.23（アップグレード不要）
   - viem v2.43.4（ethers非使用）
   - Next.js 16 App Router（Pages Router非使用）

3. **テストネット環境**:
   - Base Sepolia（JPYC、Semaphore、MultiSigすべてデプロイ必要）
   - Infura RPC制限（レート制限、ブロック履歴制限）

### 2.3 Complexity Signals

**Overall Complexity: Medium to High（中〜高）**

**Algorithmic Logic**:

- EIP-712署名検証: Medium（標準パターン、ECDSA recovery）
- Semaphore Proof検証: Low（ISemaphore インターフェース利用）
- JPYC ERC20操作: Low（標準ERC20）

**Workflows**:

- MultiSig Wallet作成 + Semaphoreグループ生成: Medium（2つのコントラクト操作を調整）
- 匿名寄付フロー（Semaphore proof + JPYC送金）: High（複雑な統合、アトミック性確保）
- 受取人設定（2-of-N署名検証）: Medium（署名収集フロー、UI/UX設計）

**External Integrations**:

- JPYC統合: Medium（SDK利用 or viem直接実装）
- Semaphore統合: Low（既存実装を拡張）
- Biconomy AA: Low（既存`useBiconomy.ts`を活用）

---

## 3. Implementation Approach Options

### Option A: Extend Existing Components（既存コンポーネント拡張）

#### Which Files/Modules to Extend

**スマートコントラクト**:

- `contracts/Feedback.sol` → MultiSig機能、ホワイトリスト、JPYC統合を追加
  - 影響: 既存のフィードバック機能との責任範囲が不明確に
  - 互換性: `sendFeedback`メソッドは維持、新規メソッド追加

**フロントエンド**:

- `SemaphoreContext.tsx` → MultiSig関連の状態・メソッド追加
  - 影響: コンテキストが肥大化、単一責任原則違反の懸念
- `useBiconomy.ts` → JPYC送金専用メソッド追加
  - 影響: 比較的小さい（汎用`sendTransaction`を活用可能）

#### Compatibility Assessment

- **Backend Compatibility**: Supabase `identities`テーブルは既存のまま、新規テーブル（`cases`）追加で互換性維持
- **Frontend Compatibility**: 既存ページ（`app/page.tsx`, `app/group/page.tsx`, `app/proofs/page.tsx`）は影響なし
- **Breaking Changes**: なし（新規機能追加のみ）

#### Complexity and Maintainability

- **Cognitive Load**: Medium to High（`Feedback.sol`が多機能になりすぎる懸念）
- **Single Responsibility**: 違反の可能性（Feedbackとケース支援は異なるドメイン）
- **File Size**: `Feedback.sol`が200行超えの可能性

#### Trade-offs

✅ **Pros**:

- 既存Semaphoreインフラを直接活用
- デプロイ済みSemaphoreコントラクトを再利用
- フロントエンドのコンテキスト統合が容易

❌ **Cons**:

- `Feedback.sol`の責任範囲が不明確（フィードバック vs ケース支援）
- 将来的な拡張性低下（ケース管理機能が増えた場合）
- テストの複雑化（既存Feedbackテストへの影響）

### Option B: Create New Components（新規コンポーネント作成）

#### Rationale for New Creation

- **Clear Separation of Concerns**: Feedbackコントラクト（匿名フィードバック）とMultiSig Wallet（ケース支援）は異なるドメイン
- **Existing Components Already Complex**: `Feedback.sol`は既に完結した機能を持つ
- **Distinct Lifecycle**: ケース支援は長期間の資金管理、Feedbackは一時的なメッセージ送信

#### Integration Points

**新規スマートコントラクト**:

- `contracts/InnocentSupportWallet.sol`（MultiSig + Semaphore + JPYC統合）
  - Semaphore: ISemaphore インターフェース経由
  - JPYC: IERC20 インターフェース経由
  - 新規グループ作成 or 既存グループ共有（要設計判断）

**新規フロントエンドモジュール**:

- `context/CaseContext.tsx`: ケース管理状態
- `hooks/useMultiSigWallet.ts`: MultiSig操作
- `hooks/useJPYCBalance.ts`: JPYC残高取得
- `hooks/useDonation.ts`: 匿名寄付フロー

#### Responsibility Boundaries

**InnocentSupportWallet.sol**:

- Owner管理（2-of-N）
- Semaphoreグループ作成・管理
- 受取人ホワイトリスト管理
- JPYC受信（Semaphore proof付き）
- JPYC引き出し（ホワイトリスト検証）

**Feedback.sol（既存）**:

- 匿名フィードバック送信（変更なし）
- Semaphoreグループ管理（変更なし）

**Data Flow**:

- フロントエンド → `InnocentSupportWallet` → Semaphore（proof検証）
- フロントエンド → `InnocentSupportWallet` → JPYC（ERC20操作）
- `CaseContext` → Supabase（ケース情報）+ viem（オンチェーンデータ）

#### Trade-offs

✅ **Pros**:

- 責任範囲が明確（Feedback vs ケース支援）
- テストが容易（独立したコントラクト）
- 拡張性が高い（ケース支援機能の追加が容易）
- 既存Feedbackへの影響ゼロ

❌ **Cons**:

- ファイル数増加（ナビゲーションの複雑化）
- Semaphoreグループの管理方法要検討（共有 vs 独立）
- 初期開発コストやや高

### Option C: Hybrid Approach（ハイブリッド）

#### Combination Strategy

**Phase 1: New MultiSig Wallet Contract（新規コントラクト）**

- `contracts/InnocentSupportWallet.sol`を新規作成
- Semaphore統合は`Feedback.sol`と同様のパターンを踏襲
- JPYC統合を追加

**Phase 2: Extend Frontend Context（フロントエンド拡張）**

- 既存`SemaphoreContext.tsx`を**拡張せず**、新規`CaseContext.tsx`作成
- 既存`useBiconomy.ts`は**拡張**（JPYC送金メソッド追加）
- 既存UIコンポーネント（Button, Card, Spinner等）は**再利用**

**Phase 3: Dashboard as New Pages（新規ページ作成）**

- `app/cases/` ディレクトリ配下に新規ページ群作成
- 既存ページ（`app/page.tsx`, `app/group/page.tsx`）は**変更なし**

#### Phased Implementation

**Phase 1: Core Infrastructure（1週間）**

- `InnocentSupportWallet.sol`実装
- Hardhatテスト作成
- デプロイスクリプト作成

**Phase 2: Frontend Integration（1週間）**

- `CaseContext.tsx`, `useMultiSigWallet.ts`, `useJPYCBalance.ts`実装
- ケース作成フロー実装
- 寄付フロー実装

**Phase 3: Dashboard & Recipient Management（3〜5日）**

- ダッシュボードUI実装
- 受取人設定・管理画面実装
- 引き出し画面実装

**Phase 4: Testing & Deployment（3〜5日）**

- E2Eテスト
- Base Sepoliaデプロイ
- 統合テスト

#### Risk Mitigation

- **Incremental Rollout**: フェーズごとにテストネットデプロイ、動作確認
- **Feature Flags**: 環境変数による機能ON/OFF（`NEXT_PUBLIC_ENABLE_CASES`）
- **Rollback Strategy**: 各フェーズでgit tag作成、問題発生時に巻き戻し可能

#### Trade-offs

✅ **Pros**:

- 既存機能への影響を最小化
- 段階的なリスク管理
- チームの学習曲線を考慮した開発ペース
- 各フェーズで成果物を確認可能

❌ **Cons**:

- プランニングの複雑さ増加
- フェーズ間の調整コスト
- 完成までの期間が長い（合計2.5〜3週間）

---

## 4. Requirement-to-Asset Mapping

| 要件                            | 必要な資産                                       | 状態          | ギャップ                                        |
| ------------------------------- | ------------------------------------------------ | ------------- | ----------------------------------------------- |
| **Req 1: MultiSig Wallet作成**  | `InnocentSupportWallet.sol`, デプロイタスク      | ❌ Missing    | 新規コントラクト実装、Semaphoreグループ作成統合 |
| **Req 2: 匿名寄付機能**         | Semaphore proof生成、JPYC transfer、MultiSig受信 | ⚠️ Partial    | Semaphore統合済み、JPYC統合は未実装             |
| **Req 3: 受取人ホワイトリスト** | EIP-712署名検証、ホワイトリスト管理              | ❌ Missing    | 署名検証ロジック、UI実装                        |
| **Req 4: 寄付金受け取り**       | ホワイトリスト検証、JPYC transfer                | ❌ Missing    | コントラクトメソッド、フロントエンド実装        |
| **Req 5: 残高表示**             | viem `getBalance`, JPYC `balanceOf`              | ⚠️ Partial    | viemインフラ済み、JPYC SDK統合が未              |
| **Req 6: ダッシュボード**       | ケース一覧UI、イベントログ取得                   | ❌ Missing    | 新規ページ作成、Supabaseスキーマ設計            |
| **Req 7: セキュリティ**         | アクセス修飾子、入力検証、CEIパターン            | ⚠️ Constraint | Solidityベストプラクティス適用が必要            |
| **Req 8: JPYC統合**             | JPYC ABI, Base Sepoliaアドレス                   | ⚠️ Partial    | `external/jpyc-sdk`利用可能、統合未実装         |
| **Req 9: エラーハンドリング**   | viem error parsing, UI feedback                  | ⚠️ Partial    | viemインフラ済み、エラーメッセージ日本語化が未  |
| **Req 10: テストネット環境**    | Hardhat設定、デプロイスクリプト                  | ✅ Exists     | Base Sepolia設定済み、デプロイ手順確立          |

### ギャップタグ凡例

- ✅ **Exists**: 既存資産で対応可能
- ⚠️ **Partial**: 一部実装済み、拡張が必要
- ❌ **Missing**: 新規実装が必要
- 🔍 **Unknown**: 調査・設計判断が必要
- 🚧 **Constraint**: アーキテクチャ制約による制限

---

## 5. Implementation Complexity & Risk

### Effort Estimation

**Total Effort: L (2〜3週間)**

| 領域                            | Effort     | 理由                                                     |
| ------------------------------- | ---------- | -------------------------------------------------------- |
| **MultiSig Walletコントラクト** | M (5〜7日) | EIP-712署名検証、ホワイトリスト、JPYC統合、Semaphore統合 |
| **フロントエンド統合**          | M (5〜7日) | 新規hooks、ケース管理、JPYC統合                          |
| **ダッシュボードUI**            | S (2〜3日) | 既存UIコンポーネント活用、イベントログ表示               |
| **テスト・デプロイ**            | S (3〜5日) | Hardhatテスト、E2Eテスト、Base Sepoliaデプロイ           |

### Risk Assessment

**Overall Risk: Medium**

| リスク要因                        | リスクレベル | 軽減策                                                                     |
| --------------------------------- | ------------ | -------------------------------------------------------------------------- |
| **Semaphore + JPYC統合の複雑性**  | High         | 参考実装調査（Semaphoreドキュメント、JPYC SDK examples）、プロトタイプ検証 |
| **EIP-712署名検証の実装ミス**     | Medium       | `.claude/skills/multisigwallet/`リファレンス活用、OpenZeppelin ECDSA利用   |
| **ガス制限（Biconomy AA）**       | Medium       | ガス見積もりテスト、`callGasLimit`調整                                     |
| **JPYC Base Sepoliaアドレス不明** | Low          | `external/jpyc-sdk`確認、JPYC公式ドキュメント参照                          |
| **Supabaseスキーマ設計の手戻り**  | Low          | 初期設計レビュー、マイグレーション戦略準備                                 |

### Risk Justification

- **High Risk: Semaphore + JPYC統合**
  - 理由: 2つの複雑なプロトコルをアトミックに統合する必要がある
  - 影響: 寄付フローの中核機能、失敗すると要件2全体に影響
  - 軽減: 参考実装の調査、プロトタイプでの早期検証

- **Medium Risk: EIP-712署名検証**
  - 理由: セキュリティクリティカルな機能、実装ミスで資金損失の可能性
  - 影響: 受取人設定の信頼性、MultiSig Walletの安全性
  - 軽減: OpenZeppelin ECDSAライブラリ活用、リファレンス実装参照

- **Low Risk: その他**
  - 理由: 既存パターン適用可能、標準的な実装手法
  - 影響: 限定的
  - 軽減: 既存コードベースのベストプラクティス踏襲

---

## 6. Recommendations for Design Phase

### Preferred Approach

**Option C: Hybrid Approach（ハイブリッド）** を強く推奨します。

**理由**:

1. **責任範囲の明確化**: 新規MultiSig Walletコントラクトにより、Feedbackとケース支援のドメイン分離
2. **既存機能への影響最小化**: `Feedback.sol`, Semaphore統合に変更なし
3. **段階的リスク管理**: フェーズ分割により、各段階で検証・調整可能
4. **拡張性**: 将来のケース管理機能追加に対応しやすい
5. **テスト容易性**: 独立したコントラクトにより、テストが明確

### Key Decisions for Design Phase

#### 1. MultiSig Walletコントラクト設計

**Decision Point**: Semaphoreグループの管理方法

- **Option A**: ケースごとに独立したグループ作成
- **Option B**: 全ケース共通グループ（ケースIDでスコープ分離）
- **Recommendation**: Option A（ケースごとの匿名性保証、セキュリティ向上）

**Decision Point**: JPYC受信方法

- **Option A**: `receiveDonation(proof, amount)` メソッド（approve + transferFrom）
- **Option B**: `fallback() payable` でJPYC受信、別途proof検証
- **Recommendation**: Option A（アトミック性、proof検証の強制）

#### 2. フロントエンド設計

**Decision Point**: JPYC SDK統合 vs viem直接実装

- **Option A**: `external/jpyc-sdk` を `package.json` に追加、React hooks活用
- **Option B**: viemで独自実装（`encodeFunctionData`, `readContract`）
- **Recommendation**: Option A（開発速度、保守性）、ただしSDKのバージョン互換性確認必要

**Decision Point**: ケース情報の管理

- **Option A**: Supabaseテーブル（`cases`, `case_donations`）
- **Option B**: オンチェーンイベントログのみ
- **Recommendation**: Option A（クエリ性能、オフチェーンメタデータ管理）

#### 3. セキュリティ設計

**Decision Point**: 署名検証のnonce管理

- **Option A**: コントラクト内でnonce管理（`mapping(address => uint256) public nonces`）
- **Option B**: タイムスタンプベース（deadline付き署名）
- **Recommendation**: Option A（再利用攻撃防止の標準手法）

### Research Items to Carry Forward

以下の項目は設計フェーズで詳細調査が必要です：

1. **JPYC Base Sepoliaコントラクトアドレス確認**
   - `external/jpyc-sdk/packages/core/src/utils/addresses.ts` 確認
   - 未定義の場合、JPYC公式ドキュメント or デプロイ戦略検討

2. **Semaphore v4のMerkle Tree深さ最適化**
   - ケースあたりの想定支援者数を考慮
   - デフォルト20 → 調整の必要性検討

3. **Biconomy Paymasterのガス制限**
   - Semaphore proof検証のガスコスト実測
   - `callGasLimit`, `verificationGasLimit` の適切な値決定

4. **EIP-712 Domain設計**
   - `name`, `version`, `chainId`, `verifyingContract` の定義
   - MultiSig Walletごとに異なるdomainか、共通か

5. **ケースダッシュボードのリアルタイム更新戦略**
   - Polling（定期的なイベントログ取得）
   - WebSocket（Infura WebSocket or Alchemy Notify）
   - 推奨: Polling（シンプル、コスト低）

---

## 7. Appendix: Reference Assets

### Existing Code References

**MultiSig Wallet**:

- `.claude/skills/multisigwallet/references/solidity/MultiSigWallet.sol`
- `.claude/skills/multisigwallet/references/typescript/eip712.ts`

**Semaphore Integration**:

- `pkgs/contracts/contracts/Feedback.sol`
- `pkgs/web-app/src/context/SemaphoreContext.tsx`
- `pkgs/web-app/src/hooks/useSemaphoreIdentity.ts`

**JPYC Integration**:

- `external/jpyc-sdk/packages/react/src/hooks/readContracts/useBalanceOf.ts`
- `external/jpyc-sdk/packages/react/src/hooks/writeContracts/useTransfer.ts`

**Biconomy AA**:

- `pkgs/web-app/src/hooks/useBiconomy.ts`

### External Documentation

- Semaphore v4: https://docs.semaphore.pse.dev/
- JPYC SDK: `external/jpyc-sdk/packages/react/README.md`
- Biconomy AbstractJS: https://docs.biconomy.io/
- EIP-712: https://eips.ethereum.org/EIPS/eip-712
- viem: https://viem.sh/

---

## 8. Conclusion

Innocence Ledger MVPは、既存のSemaphore + JPYC + Biconomy AAインフラを基盤として、新規のMultiSig Wallet機能を統合するプロジェクトです。**Hybrid Approach（Option C）** により、既存機能への影響を最小化しつつ、拡張性と保守性を確保した実装が可能です。

設計フェーズでは、上記の**Key Decisions**と**Research Items**に焦点を当て、技術的な詳細を確定させることで、実装フェーズへのスムーズな移行が実現できます。
