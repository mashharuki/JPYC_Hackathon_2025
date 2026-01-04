# Research & Design Decisions

---

**Purpose**: Innocence Ledger MVP の技術設計を支える調査結果、アーキテクチャ決定、およびその根拠を記録する。

**Usage**:

- 発見フェーズでの調査活動と成果を記録
- design.md では詳細すぎる設計判断のトレードオフを文書化
- 将来の監査や再利用のための参照資料と証拠を提供

---

## Summary

- **Feature**: `innocence-ledger-mvp`
- **Discovery Scope**: Complex Integration
- **Key Findings**:
  - Semaphore v4 は Groth16/Plonk zkSNARK を使用し、メンバーシップ証明の生成とオンチェーン検証を実現
  - OpenZeppelin の EIP712 + ECDSA ライブラリにより、MultiSig 署名検証を Solidity 0.8 で安全に実装可能
  - zkDompet が MultiSig + ZKP 統合の実装参考例として存在し、匿名マルチシグウォレットのパターンを提供
  - JPYC SDK は Base Sepolia テストネットに対応し、プロダクション環境のコントラクトアドレスが確定済み
  - 既存の Semaphore フィードバック機能と Biconomy AA インフラを再利用することで、開発コストを大幅に削減可能

## Research Log

### Semaphore v4: Gas Costs and zkSNARK Verification

- **Context**: Requirement 1 および Requirement 2 で、匿名支援者が Semaphore 証明を提出して寄付を実行する機能が必要。オンチェーン検証のガスコストとパフォーマンスを事前に調査。
- **Sources Consulted**:
  - [Semaphore Protocol Documentation](https://docs.semaphore.pse.dev/)
  - [zkDompet - Anonymous MultiSig Wallet with ZKP](https://github.com/getwax/zkdompet)
  - Web3 research on Groth16 and Plonk zkSNARK performance benchmarks
- **Findings**:
  - Semaphore v4 は **Groth16** または **Plonk** zkSNARK を使用してグループメンバーシップ証明を生成
  - オンチェーン検証には `verifyProof()` 関数を使用し、約 **200,000 ~ 300,000 gas** を消費（zkSNARK 検証の標準的なコスト）
  - Merkle Tree の計算はオフチェーンで実施され、証明生成時に Group Merkle Root を参照
  - zkDompet では、Semaphore 証明を MultiSig 実行時の条件として組み込み、署名者の匿名性を保証するパターンを実装
- **Implications**:
  - Semaphore 証明検証のガスコストは Biconomy Paymaster によるガスレス実行でカバー可能
  - Semaphore Group の Merkle Root 更新頻度を最小化するため、支援者登録時のバッチ追加を検討
  - MultiSig 実行フローに Semaphore 証明検証ステップを統合する必要があり、zkDompet の実装パターンを参考にする

### OpenZeppelin ECDSA and EIP-712 in Solidity 0.8

- **Context**: Requirement 3 で、MultiSig Wallet の署名検証に EIP-712 を使用する必要がある。Solidity 0.8 環境での OpenZeppelin ライブラリの適合性を確認。
- **Sources Consulted**:
  - [OpenZeppelin Contracts Documentation - ECDSA](https://docs.openzeppelin.com/contracts/5.x/api/utils#ECDSA)
  - [OpenZeppelin Contracts Documentation - EIP712](https://docs.openzeppelin.com/contracts/5.x/api/utils#EIP712)
  - [ERC-7739: Defensive Rehashing for Signature Replay Protection](https://eips.ethereum.org/EIPS/eip-7739)
- **Findings**:
  - OpenZeppelin 5.x は Solidity 0.8.20+ に対応し、`EIP712` と `ECDSA` ユーティリティを提供
  - `_hashTypedDataV4(bytes32 structHash)` により、EIP-712 準拠の型付きハッシュを生成
  - `ECDSA.recover(bytes32 hash, bytes memory signature)` により、署名から署名者アドレスを復元
  - ERC-7739 では、署名の再利用攻撃を防ぐために nonce とドメインハッシュの防御的再ハッシュを推奨
  - マルチシグ実装例（参考コード）:
    ```solidity
    bytes32 digest = _hashTypedDataV4(
        keccak256(abi.encode(TX_TYPEHASH, to, value, keccak256(data), nonce))
    );
    address signer = ECDSA.recover(digest, signatures[i]);
    require(isOwner[signer], "Not owner");
    ```
- **Implications**:
  - OpenZeppelin 5.x を依存関係に追加し、EIP712 + ECDSA による署名検証を実装
  - MultiSig トランザクションに nonce を組み込み、リプレイ攻撃を防止
  - 署名者の順序検証（`signer > lastSigner`）により、重複署名を排除
  - EIP-712 のドメインセパレーターには、チェーン ID とコントラクトアドレスを含める

### MultiSig + Semaphore ZKP Integration Patterns

- **Context**: Requirement 1 で、MultiSig Wallet と Semaphore ZKP を統合する必要がある。既存の実装パターンと統合アーキテクチャを調査。
- **Sources Consulted**:
  - [zkDompet GitHub Repository](https://github.com/getwax/zkdompet)
  - Semaphore v4 integration examples in smart contracts
  - MultiSig wallet security best practices
- **Findings**:
  - **zkDompet** は、匿名マルチシグウォレットの実装例として、Semaphore 証明を署名者の匿名性保証に使用
  - zkDompet では、`executeTransaction()` 時に Semaphore 証明を検証し、proof が有効な場合のみトランザクションを実行
  - MultiSig の署名検証と ZKP 検証を直列に実行することで、両者の安全性を組み合わせる
  - Semaphore Group は、支援者のコミットメント（アイデンティティハッシュ）をメンバーとして管理し、匿名性セットを形成
- **Implications**:
  - MultiSig Wallet コントラクトに Semaphore Verifier への参照を組み込む
  - `submitDonation()` 関数で、JPYC 送金前に Semaphore 証明を検証
  - 支援者の匿名性を保証するため、Semaphore Group への参加は管理者（弁護士）が承認制で実施
  - zkDompet の実装パターンを参考に、証明検証失敗時のエラーハンドリングを設計

## Architecture Pattern Evaluation

| Option                           | Description                                                                    | Strengths                                        | Risks / Limitations                                  | Notes                            |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------- | -------------------------------- |
| **Option A: Full Greenfield**    | MultiSig Wallet、Semaphore 統合、JPYC 統合、フロントエンドを完全新規開発       | クリーンな設計、技術的負債なし                   | 開発コスト大、既存アセットの未活用                   | 時間制約上、非現実的             |
| **Option B: Minimal Extension**  | 既存 Feedback.sol を拡張し、MultiSig 機能を追加                                | 開発コスト最小                                   | Feedback.sol の責任範囲が肥大化、テストが困難        | メンテナンス性に課題             |
| **Option C: Hybrid Approach** ⭐ | 新規 MultiSig コントラクトを作成し、既存 Semaphore + Biconomy インフラを再利用 | 適切な関心の分離、既存アセット活用、テスト容易性 | 新規コントラクトのデプロイとフロントエンド統合が必要 | gap-analysis.md の推奨アプローチ |

**Selected Pattern**: **Option C: Hybrid Approach**

**Rationale**:

- 既存の Semaphore フィードバック機能（`pkgs/contracts/contracts/Feedback.sol`）と Biconomy AA インフラ（`pkgs/web-app/hooks/useBiconomy.ts`）を再利用することで、開発コストを削減
- MultiSig Wallet を独立したコントラクトとして実装することで、責任範囲を明確化し、テストとメンテナンスを容易化
- フロントエンドでは、既存の `SemaphoreContext.tsx` を拡張し、MultiSig Wallet とのインタラクションを追加
- JPYC SDK の統合は、既存の `external/jpyc-sdk` パッケージを活用し、Base Sepolia テストネット対応を確保

## Design Decisions

### Decision: MultiSig Wallet のアーキテクチャパターン

- **Context**: Requirement 1 および Requirement 3 で、MultiSig Wallet を実装する必要がある。署名検証の方式として、(A) オンチェーン署名収集 vs (B) オフチェーン署名集約の2つのアプローチが存在。
- **Alternatives Considered**:
  1. **オンチェーン署名収集** — 各オーナーが `confirmTransaction()` を呼び出し、オンチェーンで署名を記録。閾値に達したら `executeTransaction()` を実行。
  2. **オフチェーン署名集約** — オーナーが EIP-712 署名をオフチェーンで作成し、実行者が署名を集約して `executeTransaction()` に一括送信。
- **Selected Approach**: **オンチェーン署名収集**
- **Rationale**:
  - MVP では実装の簡潔性を優先し、オンチェーン署名収集を採用
  - オンチェーン方式は、署名状態の可視性が高く、トランザクション進行状況をブロックチェーンから直接確認可能
  - オフチェーン集約方式は、ガス最適化には有利だが、署名収集のオフチェーンインフラ（リレーサーバーなど）が必要
  - 参考コード（`.claude/skills/multisigwallet/references/solidity/MultiSigWallet.sol`）がオンチェーン方式を採用しており、実装パターンが確立されている
- **Trade-offs**:
  - **Benefits**: 実装の簡潔性、状態の透明性、既存パターンの再利用
  - **Compromises**: 各オーナーがガスを支払う必要がある（Biconomy Paymaster でカバー可能）
- **Follow-up**: 本番環境でのスケーラビリティ要件が高まった場合、オフチェーン署名集約への移行を検討

### Decision: Semaphore Group の管理方式

- **Context**: Requirement 2 で、匿名支援者が Semaphore 証明を使用して寄付を実行する。支援者の Semaphore Group への参加方式を決定する必要がある。
- **Alternatives Considered**:
  1. **オープン参加** — 誰でも自由に Semaphore Group に参加可能（permissionless）
  2. **承認制参加** — 管理者（弁護士）が支援者のコミットメントを承認して Group に追加（permissioned）
- **Selected Approach**: **承認制参加**
- **Rationale**:
  - MVP では、冤罪被害者支援という文脈上、支援者の身元確認（KYC）を弁護士が実施することが想定される
  - 承認制により、不正な支援者や bot の参加を防止し、寄付の透明性と信頼性を確保
  - Semaphore Group への追加は、`addMember()` 関数を管理者のみが呼び出せるように制限
- **Trade-offs**:
  - **Benefits**: セキュリティ、信頼性、不正防止
  - **Compromises**: 完全な匿名性（誰でも参加可能）は犠牲にし、身元確認を前提とした匿名性を提供
- **Follow-up**: 将来的に、複数の弁護士が分散的に承認できるマルチシグ承認方式への拡張を検討

### Decision: JPYC 統合の方式

- **Context**: Requirement 8 で、JPYC を使用した寄付と引き出しを実装する必要がある。JPYC SDK の統合方式を決定。
- **Alternatives Considered**:
  1. **JPYC SDK を直接使用** — `external/jpyc-sdk` パッケージを使用し、TypeScript から JPYC コントラクトとインタラクション
  2. **viem で直接 ERC20 呼び出し** — JPYC を標準的な ERC20 として扱い、viem の契約インタラクション機能を使用
- **Selected Approach**: **viem で直接 ERC20 呼び出し**
- **Rationale**:
  - JPYC は標準的な ERC20 トークンであり、`transfer()` と `approve()` のみを使用
  - viem v2.43.4 は、フロントエンドのプライマリ Web3 ライブラリとして既に採用されている（steering/tech.md の要件）
  - JPYC SDK は ethers.js に依存しているが、フロントエンドでは viem のみを使用するポリシーがある
  - JPYC のコントラクトアドレスは `external/jpyc-sdk/packages/core/src/utils/addresses.ts` から取得可能
- **Trade-offs**:
  - **Benefits**: 依存関係の単純化、フロントエンドのライブラリ統一、バンドルサイズ削減
  - **Compromises**: JPYC SDK の高レベル機能（プリペイドカード対応など）は未使用
- **Follow-up**: JPYC SDK の機能が将来必要になった場合、バックエンドで JPYC SDK を使用し、フロントエンドは viem 経由でバックエンド API を呼び出す方式を検討

### Decision: フロントエンド状態管理パターン

- **Context**: Requirement 6 で、案件ダッシュボードと MultiSig Wallet のフロントエンドを実装する必要がある。既存の Semaphore フィードバック UI（`pkgs/web-app/app/(feedback)/_components/SemaphoreContext.tsx`）を拡張するか、新規に Context を作成するかを決定。
- **Alternatives Considered**:
  1. **SemaphoreContext を拡張** — 既存の Context に MultiSig 関連の状態とロジックを追加
  2. **新規 CaseContext を作成** — 案件管理専用の Context を作成し、SemaphoreContext とは分離
- **Selected Approach**: **新規 CaseContext を作成**
- **Rationale**:
  - 既存の SemaphoreContext は、フィードバック機能に特化しており、責任範囲を明確に保つべき
  - 案件管理（MultiSig Wallet、寄付、引き出し）は、独立したドメインとして Context を分離
  - React Context パターンにより、コンポーネント間の依存関係を最小化し、テスト容易性を確保
- **Trade-offs**:
  - **Benefits**: 関心の分離、テスト容易性、メンテナンス性
  - **Compromises**: Context の数が増加するが、ドメイン境界が明確化される
- **Follow-up**: CaseContext と SemaphoreContext 間でデータ共有が必要な場合、Composition パターンを使用して両者を統合

## Risks & Mitigations

- **Risk 1: Semaphore 証明検証のガスコストが想定より高い** — Mitigation: Biconomy Paymaster によるガスレス実行を活用し、ユーザーの負担を排除。Base Sepolia テストネットでガスコストを計測し、閾値を設定。
- **Risk 2: MultiSig 署名の順序検証が不十分で、重複署名が発生** — Mitigation: OpenZeppelin ECDSA の `signer > lastSigner` チェックにより、署名者の順序を強制。テストケースで重複署名のシナリオを網羅。
- **Risk 3: JPYC コントラクトアドレスの変更** — Mitigation: JPYC のプロダクションアドレス（`0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29`）を環境変数で管理し、将来の変更に対応。
- **Risk 4: Semaphore Group の Merkle Root 更新頻度が高く、ガスコストが増大** — Mitigation: 支援者登録をバッチ処理し、Merkle Root の更新頻度を最小化。オフチェーンで Merkle Tree を計算し、オンチェーンでは Root のみを保存。
- **Risk 5: フロントエンドの Privy 認証と Semaphore アイデンティティ管理の統合が複雑** — Mitigation: 既存の Privy 統合パターン（`pkgs/web-app/providers/index.tsx`）を再利用し、Semaphore アイデンティティは Supabase に暗号化して保存。

## References

- [Semaphore Protocol Documentation](https://docs.semaphore.pse.dev/) — Semaphore v4 の公式ドキュメント、グループ管理と証明生成の仕様
- [OpenZeppelin Contracts 5.x - ECDSA](https://docs.openzeppelin.com/contracts/5.x/api/utils#ECDSA) — ECDSA 署名復元の API リファレンス
- [OpenZeppelin Contracts 5.x - EIP712](https://docs.openzeppelin.com/contracts/5.x/api/utils#EIP712) — EIP-712 型付きデータハッシュの実装ガイド
- [ERC-7739: Defensive Rehashing](https://eips.ethereum.org/EIPS/eip-7739) — 署名リプレイ攻撃の防御的再ハッシュ機構
- [zkDompet - Anonymous MultiSig Wallet](https://github.com/getwax/zkdompet) — Semaphore ZKP を使用した匿名マルチシグウォレットの実装例
- [JPYC SDK - Addresses](https://github.com/jcam1/JPYCv2/blob/main/packages/core/src/utils/addresses.ts) — JPYC のプロダクションコントラクトアドレス
- `.kiro/specs/innocence-ledger-mvp/gap-analysis.md` — 既存コードベースとの実装ギャップ分析、Option C（Hybrid Approach）の詳細
