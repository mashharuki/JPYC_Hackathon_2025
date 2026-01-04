# Implementation Plan

## Overview

本実装計画は、Innocence Ledger MVPの開発に必要なすべてのタスクを定義します。既存のSemaphoreフィードバック機能とBiconomy AAインフラを活用し、MultiSig Wallet + 匿名寄付機能を追加します。

**実装の優先順位**:

1. スマートコントラクト（InnocentSupportWallet, SemaphoreDonation）
2. デプロイスクリプトと環境設定
3. フロントエンドカスタムフック（useMultiSigWallet, useSemaphoreDonation, useJPYCBalance）
4. Next.js API Routes（ケース管理API）
5. UIコンポーネント（CaseDashboard, DonationForm, WithdrawalForm, BalanceDisplay）
6. 統合テストとE2Eテスト

**全要件カバレッジ**: 要件1〜10のすべてをタスクにマッピング済み

---

## Tasks

### 1. プロジェクト環境セットアップ

- [x] 1.1 (P) 環境変数とネットワーク設定の構成
  - Base Sepolia RPC URL、プライベートキー、JPYC トークンアドレスを `.env` に設定
  - MultiSig Owner の2つのアドレス（弁護士・親族）を環境変数として定義
  - Hardhat の `hardhat.config.ts` に Base Sepolia ネットワーク設定を追加
  - _Requirements: 10_

- [x] 1.2 (P) Supabase データベーススキーマの作成
  - `cases` テーブルのマイグレーションファイルを作成（`supabase/migrations/YYYYMMDDHHMMSS_create_cases_table.sql`）
  - カラム: id (UUID), title (TEXT), description (TEXT), goal_amount (BIGINT), current_amount (BIGINT), wallet_address (TEXT), semaphore_group_id (TEXT), created_at, updated_at
  - UNIQUE 制約: wallet_address, semaphore_group_id
  - インデックス: wallet_address, semaphore_group_id
  - ローカル環境でマイグレーションを実行してテスト
  - _Requirements: 1, 6_
  - _Completed: マイグレーションファイル作成済み (`pkgs/web-app/supabase/migrations/20260104000000_create_cases_table.sql`)、スキーマ検証テスト作成済み (`pkgs/web-app/src/utils/__tests__/casesTableSchema.test.ts`)_

---

### 2. InnocentSupportWallet スマートコントラクトの実装

- [x] 2.1 MultiSig Wallet のコア機能実装
  - OpenZeppelin の EIP712 と ECDSA ライブラリをインポート
  - コンストラクタで2人の Owner アドレスと JPYC トークンアドレスを受け取り、状態変数に保存
  - 受取人ホワイトリスト（mapping(address => bool)）と nonce 管理（mapping(uint256 => bool)）を実装
  - _Requirements: 1, 3, 7_
  - _Completed: InnocentSupportWallet.sol および InnocentSupportWallet.test.ts 作成完了、全テスト成功（9 passing）_

- [x] 2.2 受取人ホワイトリスト追加機能の実装
  - `addRecipient(address recipient, bytes[] signatures, uint256 nonce)` 関数を実装
  - EIP-712 型付き署名のハッシュを生成（`_hashTypedDataV4`）
  - ECDSA.recover で2つの署名から署名者アドレスを復元
  - 復元したアドレスが Owner リストに含まれることを検証
  - 署名の順序検証（`signer1 < signer2`）で重複署名を排除
  - nonce が未使用であることを確認し、使用済みとしてマーク
  - ホワイトリストに受取人を追加し、`RecipientAdded` イベントを発行
  - _Requirements: 3, 7_
  - _Completed: signer order 検証とテスト追加_

- [x] 2.3 引き出し機能の実装
  - `withdraw(address recipient, uint256 amount)` 関数を実装
  - 呼び出し者がホワイトリストに登録されていることを検証（`require(isWhitelisted[msg.sender])`）
  - JPYC トークンの残高が引き出し額以上であることを検証
  - JPYC の `transfer` メソッドで受取人に送金
  - `WithdrawalExecuted` イベントを発行
  - Checks-Effects-Interactions パターンを適用してリエントランシー攻撃を防止
  - _Requirements: 4, 7, 8_
  - _Completed: InnocentSupportWallet.sol に withdraw を追加、MockJPYC と引き出しテストを追加_

- [x] 2.4 残高取得と受取人削除機能の実装
  - `getJPYCBalance()` view 関数を実装（JPYC の `balanceOf` を呼び出し）
  - `isWhitelisted(address recipient)` view 関数を実装
  - `removeRecipient(address recipient, bytes[] signatures, uint256 nonce)` 関数を実装（`addRecipient` と同様の2署名検証）
  - `RecipientRemoved` イベントを発行
  - _Requirements: 3, 5_
  - _Completed: 残高取得と削除機能の実装、テスト追加_

---

### 3. SemaphoreDonation スマートコントラクトの実装

- [x] 3.1 Semaphore 証明検証と寄付機能の実装
  - Semaphore Verifier、JPYC、InnocentSupportWallet のアドレスをコンストラクタで受け取る
  - `donateWithProof(uint256 merkleTreeRoot, uint256 nullifier, uint256[8] proof, address walletAddress, uint256 amount)` 関数を実装
  - Semaphore Verifier の `verifyProof` を呼び出して証明を検証
  - nullifier が未使用であることを確認（`require(!usedNullifiers[nullifier])`）
  - JPYC の `transferFrom` で支援者から MultiSig Wallet へ送金
  - nullifier を使用済みとしてマーク
  - 寄付記録を `donations` マッピングに保存
  - `DonationRecorded` イベントを発行
  - _Requirements: 2, 7, 8_
  - _Completed: SemaphoreDonation.sol 追加、Verifier 検証 + JPYC 送金 + 寄付記録_

- [x] 3.2 寄付履歴取得機能の実装
  - `getDonationByNullifier(uint256 nullifier)` view 関数を実装
  - nullifier に対応する寄付記録（金額、タイムスタンプ、ウォレットアドレス）を返す
  - _Requirements: 2, 6_
  - _Completed: `getDonationByNullifier` view関数を実装、テスト作成完了（`test/SemaphoreDonation.test.ts`）、全テスト成功（40 passing）_

---

### 4. スマートコントラクトのテスト実装

- [x] 4.1 InnocentSupportWallet のユニットテスト
  - Hardhat テスト環境で ethers.js v6 を使用
  - コンストラクタの初期化テスト（Owner とJPYC アドレスの設定確認）
  - 受取人ホワイトリスト追加の成功ケース（2署名検証が成功）
  - 受取人ホワイトリスト追加の失敗ケース（署名検証失敗、nonce 再利用、Owner でない署名）
  - 引き出しの成功ケース（ホワイトリスト検証成功、JPYC 送金実行）
  - 引き出しの失敗ケース（ホワイトリスト未登録、残高不足）
  - イベント発行の検証（RecipientAdded, WithdrawalExecuted）
  - _Requirements: 3, 4, 7, 10_
  - _Completed: InnocentSupportWallet.test.ts で全テスト追加済み_

- [x] 4.2 SemaphoreDonation のユニットテスト
  - Semaphore Proof のモック生成（テスト用の有効な証明データ）
  - 寄付の成功ケース（Proof 検証成功、JPYC 送金実行、nullifier 記録）
  - 寄付の失敗ケース（Proof 検証失敗、nullifier 二重使用）
  - イベント発行の検証（DonationRecorded）
  - _Requirements: 2, 7, 8, 10_
  - _Completed: MockSemaphoreVerifier + SemaphoreDonation.test.ts 追加_

- [x] 4.3 (P) テストカバレッジの確認と補完
  - Hardhat の coverage プラグインを使用してカバレッジレポートを生成
  - 80%以上のカバレッジ達成を確認
  - 未カバーのエッジケースに対するテストを追加
  - _Requirements: 10_
  - _Completed: `yarn contracts test:coverage` 実行、全体 98% 超を確認_

---

### 5. Hardhat デプロイスクリプトの実装

- [x] 5.1 Base Sepolia デプロイスクリプトの作成
  - `tasks/deploy.ts` を作成
  - 環境変数から JPYC アドレス、MultiSig Owners、Semaphore Verifier アドレスを読み込み
  - Semaphore Verifier が未定義の場合、新規デプロイ（既存の場合は参照）
  - InnocentSupportWallet をデプロイ（Owners と JPYC アドレスを引数として渡す）
  - SemaphoreDonation をデプロイ（Verifier、JPYC、Wallet アドレスを引数として渡す）
  - デプロイ後、すべてのアドレスを `deployments.json` に保存
  - コンソールに各コントラクトのアドレスを出力
  - _Requirements: 1, 10_
  - _Completed: deploy タスクを Innocence Ledger 用に更新_

- [x] 5.2 (P) デプロイスクリプトの動作確認
  - Base Sepolia テストネットにデプロイを実行
  - デプロイされたコントラクトアドレスを確認
  - Etherscan（Base Sepolia）でコントラクトのデプロイを検証
  - `deployments.json` が正しく生成されることを確認
  - _Requirements: 10_

---

### 6. フロントエンドカスタムフックの実装

- [x] 6.1 (P) useJPYCBalance フックの実装
  - viem の `getBalance` で ETH 残高を取得
  - viem の `readContract` で JPYC の `balanceOf` を呼び出し、JPYC 残高を取得
  - `watchBlockNumber` でブロック更新を監視し、新ブロック生成時に残高を自動更新
  - アドレスの妥当性を検証（`isAddress` ヘルパー使用）
  - エラーハンドリング（ネットワーク接続エラー時にエラーステートを設定）
  - `ethBalance`, `jpycBalance`, `refetch`, `isLoading`, `error` を返す
  - _Requirements: 5, 8, 9_

- [x] 6.2 useMultiSigWallet フックの実装
  - viem の `writeContract` で InnocentSupportWallet の `addRecipient` を呼び出し
  - EIP-712 署名を `signTypedData` で生成（2人の Owner が順次署名）
  - 2署名収集フロー（Owner 1 が署名を作成、Owner 2 が署名を追加して最終実行）
  - `withdraw` 関数の実装（ホワイトリスト検証後、引き出しトランザクションを送信）
  - `isWhitelisted` 関数の実装（viem の `readContract` でホワイトリスト検証）
  - トランザクションステータスの管理（Pending, Success, Failed）
  - `addRecipient`, `withdraw`, `isWhitelisted`, `isLoading`, `error` を返す
  - _Requirements: 3, 4, 9_

- [x] 6.3 useSemaphoreDonation フックの実装
  - SemaphoreContext から Identity を取得
  - `@semaphore-protocol/proof` ライブラリで Semaphore Proof を生成
  - Supabase から最新の Merkle Root を取得
  - viem の `writeContract` で SemaphoreDonation の `donateWithProof` を呼び出し
  - JPYC の `approve` を事前に実行し、SemaphoreDonation コントラクトが `transferFrom` を実行できるようにする
  - Proof 生成中のローディング状態を管理
  - `donateWithProof`, `joinGroup`, `isLoading`, `error` を返す
  - _Requirements: 2, 8, 9_
  - _Completed: useSemaphoreDonation.ts および useSemaphoreDonation.test.ts 作成完了、全11テスト成功、全66テスト成功_

---

### 7. Next.js API Routes の実装

- [ ] 7.1 (P) ケース作成 API の実装
  - `app/api/cases/route.ts` に POST エンドポイントを実装
  - リクエストボディから title, description, goalAmount, walletAddress, semaphoreGroupId を受け取る
  - Zod スキーマでリクエストデータを検証
  - Supabase Client を使用して `cases` テーブルに新規レコードを挿入
  - 成功時、ケース ID と作成日時を返す
  - エラーハンドリング（Supabase エラー、バリデーションエラー）
  - _Requirements: 1, 6, 9_

- [ ] 7.2 (P) ケース取得 API の実装
  - `app/api/cases/route.ts` に GET エンドポイントを実装
  - Supabase Client ですべてのケース情報を取得
  - レスポンスを Zod スキーマで検証
  - ケース配列を JSON 形式で返す
  - _Requirements: 6, 9_

- [ ] 7.3 (P) ケース詳細取得 API の実装
  - `app/api/cases/[id]/route.ts` に GET エンドポイントを実装
  - パスパラメータからケース ID を取得
  - Supabase Client で特定ケースの詳細情報を取得
  - ケースが見つからない場合、404 エラーを返す
  - _Requirements: 6, 9_

- [ ] 7.4 (P) ケース更新 API の実装
  - `app/api/cases/[id]/route.ts` に PATCH エンドポイントを実装
  - リクエストボディから currentAmount を受け取る
  - Supabase Client でケースの現在調達額を更新
  - updated_at タイムスタンプを更新
  - 更新成功時、更新後のケース情報を返す
  - _Requirements: 6, 9_

---

### 8. CaseContext の実装

- [ ] 8.1 CaseContext プロバイダーの実装
  - `createContext` と `useContext` で Context を作成
  - State モデル: cases (Case[]), selectedCase (Case | null), isLoading (boolean), transactionStatus (TransactionStatus), error (ErrorState | null)
  - `useEffect` で Next.js API Routes からケースデータを取得し、状態を初期化
  - トランザクションステータスの管理（idle, pending, success, failed）
  - _Requirements: 1, 6_

- [ ] 8.2 CaseContext の寄付・引き出しアクションの実装
  - `submitDonation(caseId, amount)` 関数を実装
  - useSemaphoreDonation フックを呼び出し、Semaphore Proof 生成と寄付トランザクションを実行
  - useBiconomy フックを使用してガスレス実行
  - トランザクション成功後、Supabase のケース調達額を更新（API Route 呼び出し）
  - `requestWithdrawal(caseId, amount)` 関数を実装
  - useMultiSigWallet フックを呼び出し、引き出しトランザクションを実行
  - エラー時、エラーステートを設定し、ユーザーにエラーメッセージを表示
  - _Requirements: 2, 4, 9_

---

### 9. UIコンポーネントの実装

- [ ] 9.1 (P) CaseDashboard コンポーネントの実装
  - Server Component として実装し、初期データを Supabase から取得
  - すべてのアクティブなケース情報を一覧表示
  - 各ケースの調達進捗率をプログレスバーで視覚化
  - ケース詳細ページへのナビゲーションリンクを実装
  - Client Component でフィルタ・ソート機能を実装
  - _Requirements: 6_

- [ ] 9.2 (P) DonationForm コンポーネントの実装
  - React Hook Form で寄付額入力フォームを実装
  - Zod スキーマで寄付額をバリデーション（最小額、JPYC 残高チェック）
  - CaseContext から `submitDonation` を呼び出し
  - Semaphore Proof 生成中のローディングスピナーを表示
  - トランザクションステータス（Pending, Success, Failed）を表示
  - エラーメッセージの表示（残高不足、Proof 検証失敗等）
  - _Requirements: 2, 9_

- [ ] 9.3 (P) WithdrawalForm コンポーネントの実装
  - React Hook Form で引き出し額入力フォームを実装
  - Zod スキーマで引き出し額をバリデーション（最小額、MultiSig Wallet 残高チェック）
  - CaseContext から `requestWithdrawal` を呼び出し
  - ホワイトリスト検証失敗時、「受取人が未登録です」とメッセージを表示
  - トランザクションステータスを表示
  - エラーメッセージの表示（残高不足、ホワイトリスト未登録等）
  - _Requirements: 4, 9_

- [ ] 9.4 (P) BalanceDisplay コンポーネントの実装
  - useJPYCBalance フックから ETH および JPYC 残高を取得
  - `formatUnits` で18桁精度をフォーマット（例: "100.50 JPYC"）
  - 残高が undefined の場合、ローディング状態を表示
  - ネットワーク接続エラー時、エラーメッセージと再試行ボタンを表示
  - MultiSig Wallet の残高を表示する場合、Wallet アドレスを引数として受け取る
  - _Requirements: 5_

- [ ] 9.5 (P) 全体的なUIコンポーネントのアップグレード
  - 良いUI/UX の原則に従い、全体的なUIコンポーネントのアップグレードを行いフロントエンドデザインを最適化すること
  - モダンでかっこよく最高にスタイリッシュなUIにすること
  - 誰もがあっと驚くUIにすること
  - AIが作ったようなUIデザインにならないように一捻り加えてください。

---

### 10. 統合テストとE2Eテストの実装

- [ ] 10.1 寄付フローの統合テスト
  - DonationForm → useSemaphoreDonation → SemaphoreDonation Contract → JPYC Transfer の一連の流れを確認
  - Semaphore Proof 生成が正常に動作することを検証
  - Biconomy Paymaster によるガスレス実行を確認
  - 寄付成功後、CaseDashboard の調達額がリアルタイムで更新されることを確認
  - _Requirements: 2, 6, 8, 10_

- [ ] 10.2 引き出しフローの統合テスト
  - WithdrawalForm → useMultiSigWallet → InnocentSupportWallet → JPYC Transfer の一連の流れを確認
  - ホワイトリスト検証が正常に動作することを検証
  - 引き出し成功後、MultiSig Wallet の残高が減少することを確認
  - _Requirements: 4, 5, 8, 10_

- [ ] 10.3 ホワイトリスト追加フローの統合テスト
  - Admin Panel → useMultiSigWallet → InnocentSupportWallet の2署名収集と検証を確認
  - EIP-712 署名生成が正常に動作することを検証
  - 2署名が揃った後、ホワイトリストに受取人が追加されることを確認
  - _Requirements: 3, 7, 10_

- [ ] 10.4\* E2Eテストの実装（オプション）
  - Playwright または Cypress で E2E テストを実装
  - 支援者の寄付フロー: ウォレット接続 → ケース選択 → 寄付額入力 → トランザクション送信 → 寄付成功確認
  - 受取人の引き出しフロー: ウォレット接続 → ケース選択 → 引き出し額入力 → トランザクション送信 → 引き出し成功確認
  - ダッシュボード閲覧: ケース一覧表示 → ケース詳細表示 → 寄付履歴確認
  - _Requirements: 10_
  - _Note: MVP 完了後の品質向上フェーズで実施可能_

---

## Requirements Coverage Verification

すべての要件が以下のタスクでカバーされていることを確認済み:

- **Requirement 1** (MultiSig Wallet作成とSemaphoreグループ統合): タスク 1.2, 2.1, 5.1, 7.1, 8.1
- **Requirement 2** (匿名寄付機能): タスク 3.1, 3.2, 4.2, 6.3, 8.2, 9.2, 10.1
- **Requirement 3** (受取人ホワイトリスト設定): タスク 2.1, 2.2, 2.4, 4.1, 6.2, 10.3
- **Requirement 4** (寄付金受け取り機能): タスク 2.3, 4.1, 6.2, 8.2, 9.3, 10.2
- **Requirement 5** (ウォレット残高表示機能): タスク 2.4, 6.1, 9.4, 10.2
- **Requirement 6** (支援ケースダッシュボード表示): タスク 1.2, 3.2, 7.1, 7.2, 7.3, 7.4, 8.1, 9.1, 10.1
- **Requirement 7** (セキュリティとアクセス制御): タスク 2.1, 2.2, 2.3, 3.1, 4.1, 4.2, 10.3
- **Requirement 8** (JPYC統合とERC20準拠): タスク 2.3, 3.1, 4.1, 4.2, 6.1, 6.3, 10.1, 10.2
- **Requirement 9** (エラーハンドリングとユーザーフィードバック): タスク 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 8.2, 9.2, 9.3
- **Requirement 10** (テストネット環境とデプロイ): タスク 1.1, 4.1, 4.2, 4.3, 5.1, 5.2, 10.1, 10.2, 10.3, 10.4

**カバレッジ確認**: ✅ 全10要件がタスクにマッピング済み

---

## Task Summary

- **メジャータスク**: 10個
- **サブタスク**: 34個（オプション1個含む）
- **並列実行可能タスク**: 15個（`(P)` マーク付き）
- **平均タスク時間**: 1〜3時間/サブタスク
- **総見積もり時間**: 約60〜100時間（ハッカソン48時間内で優先度高タスクに集中）

---

## Implementation Notes

1. **並列実行推奨タスク**:
   - セクション1（環境セットアップ）: 1.1 と 1.2 を並列実行可能
   - セクション6（カスタムフック）: 6.1, 6.2, 6.3 を並列実行可能（スマートコントラクトデプロイ後）
   - セクション7（API Routes）: 7.1, 7.2, 7.3, 7.4 を並列実行可能
   - セクション9（UIコンポーネント）: 9.1, 9.2, 9.3, 9.4 を並列実行可能（カスタムフック完成後）

2. **依存関係の重要性**:
   - セクション2, 3（スマートコントラクト）はセクション5（デプロイ）の前提条件
   - セクション6（カスタムフック）はセクション5（デプロイ）完了後に実施
   - セクション8, 9（Context, UIコンポーネント）はセクション6（カスタムフック）完了後に実施

3. **テストの実施タイミング**:
   - セクション4（コントラクトテスト）は各コントラクト実装と並行して実施
   - セクション10（統合テスト）はすべてのコンポーネント実装完了後に実施

4. **オプションタスク**:
   - タスク10.4（E2Eテスト）は MVP 完了後の品質向上フェーズで実施可能
