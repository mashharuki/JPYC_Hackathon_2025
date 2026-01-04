# Requirements Document

## Project Description (Input)

透明性のある冤罪支援プラットフォームを開発したいです。 今の既存のソースコードをベースに以下の要件を満たすためのアプリ開発を行いたいです。 ## 1. プロジェクト概要

### プロジェクト名（仮）

**Innocence Ledger（イノセンス・レジャー）**

### システム構成図

./docs/overview.drawio

### コンセプト

ブロックチェーンとステーブルコインの**透明性・追跡可能性**を活用し、

冤罪被害者および「無罪を主張する被収容者」に対する

**信頼できる資金支援インフラ**を構築する。

---

## 2. 背景・課題認識（Why）

### 現状の冤罪支援の課題

- 寄付金が**誰に・いつ・何に使われたか分からない**
- 支援団体や運営者への**信頼に依存**
- 冤罪当事者は
  - 社会復帰（社会的地位や職も失うことが多い）
  - 再審請求
  - 弁護士費用・鑑定費用

    などで慢性的な資金不足に陥りやすい

### なぜ Web3 / ステーブルコインなのか

| 観点                               | Web2（従来） | Web3                       |
| ---------------------------------- | ------------ | -------------------------- |
| 透明性                             | 限定的       | **オンチェーンで可視化**   |
| 信頼                               | 組織依存     | **コードと履歴に依存**     |
| 国境                               | 国内中心     | \*\*グローバルに送金可能   |
| (グローバルで寄付を受けられる)\*\* |
| 匿名性                             | 難しい       | **匿名／実名の選択が可能** |

---

## 3. 対象ユーザー定義（Who）

### ① 支援を受ける側

- **冤罪被害者（無罪確定後）**
- **有罪判決を受けたが無罪を主張する被収容者**
  - 再審請求中
  - 国家賠償請求中
  - 弁護士・鑑定費用を捻出できない人
  - さらに再審および国家賠償請求のために必要な活動資金がない人

### ② 支援する側

- 個人支援者（国内・海外）
- 親族
- 冤罪支援に関心のある市民
- NGO / NPO / 財団
- 企業（CSR・寄付枠）

### ③ 協力主体（将来）

- 冤罪支援団体
  - 例：イノセンス・プロジェクト・ジャパン
- 弁護士・研究者
- 鑑定機関

---

## 4. 冤罪における時間軸 × プロダクト対応

### 冤罪のフェーズ整理

```
事件発生
 ↓
捜査・取調べ
 ↓
起訴
 ↓
裁判
 ↓
有罪確定
 ↓
再審請求
 ↓
無罪確定
 ↓
社会復帰
 ↓
国家賠償請求

```

---

## 5. 提供する機能（What）

### 機能①：冤罪確定者向け 生活・再起支援（Phase：無罪確定後）

### 対応フェーズ

- **無罪確定後〜社会復帰**

### 課題

- 社会的信用が回復しない
- 生活資金が枯渇
- 仕事がない
- 住居がない

### 機能要件

- 冤罪確定者ごとの**支援ウォレット作成**
- ステーブルコイン（円建て）での直接送金
- 資金用途の可視化
  - 生活費
  - 医療費
  - 学習・職業訓練
- **支援金の流れをオンチェーンで公開**

### 提供価値

- 支援者：「本当に本人に届いた」ことが分かる
- 当事者：継続的な支援を受けられる

---

### 機能②：無罪主張者向け 再審支援プロジェクト（Phase：有罪確定後〜再審）

### 対応フェーズ

- **有罪確定後〜再審請求中**

### 課題

- 弁護士費用が払えない
- DNA鑑定・再鑑定ができない
- 証拠収集のための資金がない

### 機能要件

- **ケース単位の支援ページ（プロジェクト型）**
- 支援目的の明確化
  - 弁護士費用
  - 科学鑑定費用
  - 証拠再調査
- 第三者がステーブルコインで送金
- 支援金の使途・進捗をオンチェーンで記録

---

## 6. 匿名性・プライバシー設計（How）

### 技術的方針（案）

- **ZKP（ゼロ知識証明）** を活用
  - 支援したことは確実に証明にしたいが、自分が支援したことは秘匿したい
  - Semaphore()を使う
- 以下を両立：
  - 支援金の流れ：**完全透明**
  - 個人情報：**非公開も可能**

### 選択可能な支援形態

| 支援者   | 実名 / 匿名            |
| -------- | ---------------------- |
| 被支援者 | 実名 / 匿名（仮名）    |
| 送金履歴 | 公開（ウォレット単位） |

---

## 7. なぜ既存団体と競合しないか

### ポジショニング

- 既存団体：**支援の実行主体**
- 本プロジェクト：**冤罪支援のインフラ**

### 将来像

- 冤罪支援団体が
  - 自団体の支援口座を
  - **ブロックチェーン化**
- 寄付者が
  - 「信頼」ではなく
  - 「可視化された履歴」で判断できる世界

---

## 8. ハッカソンにおけるスコープ（MVP）

### MVPでやること

- ケース1件の支援画面(優先度 高)
  - 支援者はJPYCにて寄付金を送金
  - 送金先はMultiSig Wallet
  - ケースごとにMultiSig Walletを作成する
    - MultiSig WalletのOwnerは弁護士と親族の2人を想定
    - 受け取り可能なアドレスはOwnerが事前に設定したアドレスのみ！
- ステーブルコイン送金画面(優先度 高)
  - JPYC(ERC20準拠、テストネット)
  - ETHとJPYCの残高を表示してもらいたい
- 受け取り画面(優先度 高)
  - 冤罪被害者がMultiSig Walletに溜まっているJPYCを受け取るための画面
  - ETHとJPYCの残高を表示してもらいたい
- 資金用途ステータス表示(優先度 低)

### MVPで開発する機能

- 冤罪支援者ごとのMultiSigWallet作成機能
  - MultiSigWallet作成と合わせてSemaphoreのグループも作成すること
- JPYCの寄付機能
  - ただJPYCを寄付するだけでなくSemaphoreの仕組みを組み合わせて匿名性も担保すること
- 受取人設定機能
  - 受取人の設定メソッドを実行するにはMultiSigWalletのOwnerの署名検証が成功する必要あり
  - 署名データのrecoveryメソッドを作りアドレスを取得し、MultiSigWalletのOwnerのアドレスと一致するかをチェックする
  - 2人以上の署名データが必要
- 寄付金受け取り機能
- 接続中のウォレットのETHとJPYCの残高表示機能

### MVPでやらないこと

- 法的判断
- 冤罪の事実認定
- 実運用での資金管理

---

## Introduction

本要件定義は、Innocence Ledger MVPの実装に必要な機能要件を定義します。ブロックチェーン技術（JPYC + MultiSig Wallet + Semaphore v4）を活用し、冤罪被害者への透明性のある支援インフラを構築します。

MVPでは以下のコア機能を実装します：

- **支援ケース管理**: MultiSig Walletによる安全な資金プール
- **匿名寄付システム**: Semaphoreを用いたプライバシー保護付きJPYC送金
- **受取人認証**: 署名検証ベースのホワイトリスト管理
- **資金引き出し**: 被支援者による安全な資金受け取り
- **透明性の可視化**: ETH/JPYC残高のリアルタイム表示

---

## Requirements

### Requirement 1: MultiSig Wallet作成とSemaphoreグループ統合

**Objective**: ケース管理者として、支援ケースごとに独立したMultiSig Walletを作成し、同時にSemaphoreグループを初期化することで、安全な資金管理と匿名寄付の基盤を構築したい

#### Acceptance Criteria

1. When ケース管理者がウォレット作成を要求した場合, the Innocence Ledger Platform shall 新しいMultiSig Walletコントラクトをデプロイする
2. When MultiSig Walletが作成される場合, the Innocence Ledger Platform shall 2人のOwnerアドレス（弁護士・親族）を初期設定として登録する
3. When MultiSig Walletのデプロイが成功した場合, the Innocence Ledger Platform shall 対応するSemaphoreグループを同時に作成する
4. The Innocence Ledger Platform shall MultiSig WalletアドレスとSemaphoreグループIDを関連付けて永続化する
5. If MultiSig WalletまたはSemaphoreグループの作成に失敗した場合, then the Innocence Ledger Platform shall トランザクション全体をロールバックし、エラーメッセージを返す

---

### Requirement 2: 匿名寄付機能（JPYC + Semaphore統合）

**Objective**: 支援者として、自身のプライバシーを保護しながらJPYCで寄付を行い、支援の証明を残したい

#### Acceptance Criteria

1. When 支援者が寄付を実行する場合, the Innocence Ledger Platform shall Semaphore Identity（匿名ID）を生成またはインポートする
2. When 支援者がSemaphoreグループに参加する場合, the Innocence Ledger Platform shall グループメンバーシップ証明を生成する
3. When 支援者が寄付額とMultiSig Walletアドレスを指定した場合, the Innocence Ledger Platform shall Semaphore ProofとJPYC transferを同一トランザクション内で実行する
4. The Innocence Ledger Platform shall JPYCトークンの送金先をMultiSig Walletに限定する
5. When 寄付トランザクションが成功した場合, the Innocence Ledger Platform shall 寄付額、タイムスタンプ、匿名証明をオンチェーンに記録する
6. If Semaphore Proofの検証に失敗した場合, then the Innocence Ledger Platform shall トランザクションをリバートし、不正な寄付を防止する
7. The Innocence Ledger Platform shall 支援者の実アドレスを公開せず、匿名性を保証する

---

### Requirement 3: 受取人ホワイトリスト設定（署名検証ベース）

**Objective**: MultiSig WalletのOwnerとして、複数署名による承認プロセスを経て、資金を受け取れる受取人アドレスを安全に設定したい

#### Acceptance Criteria

1. When Ownerが受取人アドレスの追加を要求した場合, the Innocence Ledger Platform shall 署名データの提出を要求する
2. When 署名データが提出された場合, the Innocence Ledger Platform shall ECDSAリカバリメソッドを用いて署名者のアドレスを復元する
3. The Innocence Ledger Platform shall 復元されたアドレスがMultiSig WalletのOwnerリストに含まれることを検証する
4. When 有効な署名が2つ以上集まった場合, the Innocence Ledger Platform shall 受取人アドレスをホワイトリストに追加する
5. If 署名の検証に失敗した場合またはOwnerでない署名が含まれる場合, then the Innocence Ledger Platform shall トランザクションをリバートし、不正な受取人登録を防止する
6. The Innocence Ledger Platform shall ホワイトリストの更新履歴をイベントログとしてオンチェーンに記録する
7. When 受取人の削除が要求された場合, the Innocence Ledger Platform shall 同様の2署名検証プロセスを経て削除を実行する

---

### Requirement 4: 寄付金受け取り機能

**Objective**: ホワイトリスト登録された受取人として、MultiSig Walletに蓄積されたJPYCを安全に引き出したい

#### Acceptance Criteria

1. When 受取人が引き出しを要求した場合, the Innocence Ledger Platform shall 要求者のアドレスがホワイトリストに含まれることを検証する
2. When ホワイトリスト検証が成功した場合, the Innocence Ledger Platform shall MultiSig Wallet内のJPYC残高を確認する
3. When 引き出し額が指定された場合, the Innocence Ledger Platform shall 残高が引き出し額以上であることを検証する
4. The Innocence Ledger Platform shall JPYCトークンを受取人アドレスにtransferする
5. When 引き出しが成功した場合, the Innocence Ledger Platform shall 引き出し額、受取人アドレス、タイムスタンプをイベントログに記録する
6. If ホワイトリスト検証に失敗した場合, then the Innocence Ledger Platform shall トランザクションをリバートし、「Recipient not authorized」エラーを返す
7. If 残高不足の場合, then the Innocence Ledger Platform shall トランザクションをリバートし、「Insufficient balance」エラーを返す

---

### Requirement 5: ウォレット残高表示機能

**Objective**: ユーザーとして、接続中のウォレットのETHおよびJPYC残高をリアルタイムで確認したい

#### Acceptance Criteria

1. When ユーザーがウォレットを接続した場合, the Innocence Ledger Platform shall ウォレットアドレスのETH残高を取得する
2. The Innocence Ledger Platform shall JPYC ERC20コントラクトの`balanceOf`メソッドを呼び出し、JPYC残高を取得する
3. When 残高データが取得された場合, the Innocence Ledger Platform shall ETH残高を18桁精度、JPYC残高を18桁精度でフォーマットして表示する
4. The Innocence Ledger Platform shall 残高表示を自動更新し、ブロック生成またはトランザクション成功時に最新値を反映する
5. If ネットワーク接続エラーが発生した場合, then the Innocence Ledger Platform shall エラーメッセージを表示し、再試行ボタンを提供する
6. When MultiSig Walletの残高を確認する場合, the Innocence Ledger Platform shall MultiSig WalletアドレスのETH/JPYC残高を同様の方法で取得・表示する

---

### Requirement 6: 支援ケースダッシュボード表示

**Objective**: 支援者として、支援ケースの概要、資金調達状況、寄付履歴をリアルタイムで確認したい

#### Acceptance Criteria

1. When ユーザーがダッシュボードにアクセスした場合, the Innocence Ledger Platform shall すべてのアクティブな支援ケース情報を取得する
2. The Innocence Ledger Platform shall 各ケースの以下の情報を表示する：ケースID、タイトル、説明、目標金額、現在の調達額、MultiSig Walletアドレス
3. When ケース詳細ページにアクセスした場合, the Innocence Ledger Platform shall そのケースへの寄付履歴（タイムスタンプ、寄付額）を時系列で表示する
4. The Innocence Ledger Platform shall 寄付履歴において支援者の実アドレスを公開せず、匿名性を維持する
5. When 新しい寄付が実行された場合, the Innocence Ledger Platform shall ダッシュボードの調達額をリアルタイムで更新する
6. The Innocence Ledger Platform shall 調達進捗率（現在額/目標額）をプログレスバーで視覚化する

---

### Requirement 7: セキュリティとアクセス制御

**Objective**: システム全体として、不正アクセス、不正送金、権限外操作を防止し、資金の安全性を保証したい

#### Acceptance Criteria

1. The Innocence Ledger Platform shall すべてのスマートコントラクト関数に適切なアクセス修飾子（`onlyOwner`, `onlyWhitelisted`等）を適用する
2. The Innocence Ledger Platform shall 外部からの入力データ（署名、アドレス、金額）を検証し、サニタイズする
3. When MultiSig WalletへのJPYC送金が実行される場合, the Innocence Ledger Platform shall 送金元がSemaphoreグループメンバーであることを検証する
4. The Innocence Ledger Platform shall リエントランシー攻撃を防ぐため、Checks-Effects-Interactions パターンを適用する
5. When 署名検証が実行される場合, the Innocence Ledger Platform shall 署名の再利用攻撃を防ぐため、nonce または timestamp を検証する
6. The Innocence Ledger Platform shall すべての重要な状態変更（ホワイトリスト更新、引き出し、寄付）をイベントログとして記録する
7. If 不正なトランザクションが検出された場合, then the Innocence Ledger Platform shall トランザクションをリバートし、詳細なエラーメッセージを返す

---

### Requirement 8: JPYC統合とERC20準拠

**Objective**: システムとして、JPYC（ERC20準拠ステーブルコイン）をテストネット環境で正しく統合し、送金・残高確認を実行したい

#### Acceptance Criteria

1. The Innocence Ledger Platform shall Base Sepolia テストネット上のJPYCコントラクトアドレスを設定ファイルに定義する
2. The Innocence Ledger Platform shall JPYC ERC20インターフェース（`transfer`, `approve`, `balanceOf`, `allowance`）を正しく実装する
3. When 寄付が実行される場合, the Innocence Ledger Platform shall `approve` + `transferFrom` パターンまたは `transfer` メソッドを使用してJPYCを送金する
4. The Innocence Ledger Platform shall JPYCの18桁精度（decimals=18）を考慮して金額計算を実行する
5. When JPYCトークンの送金に失敗した場合, then the Innocence Ledger Platform shall エラーメッセージをユーザーに表示し、トランザクションをリバートする
6. The Innocence Ledger Platform shall JPYC送金時のガス代見積もりを事前に計算し、ユーザーに提示する

---

### Requirement 9: エラーハンドリングとユーザーフィードバック

**Objective**: ユーザーとして、トランザクション実行中のエラーやネットワーク障害に対して明確なフィードバックを受け取り、適切な対処方法を理解したい

#### Acceptance Criteria

1. When トランザクションが送信された場合, the Innocence Ledger Platform shall トランザクションステータス（Pending, Success, Failed）をリアルタイムで表示する
2. If トランザクションが失敗した場合, then the Innocence Ledger Platform shall エラーの原因（残高不足、署名エラー、ガス不足等）を日本語で明示する
3. When ネットワーク接続が切断された場合, the Innocence Ledger Platform shall 「ネットワーク接続を確認してください」とメッセージを表示し、再接続を促す
4. The Innocence Ledger Platform shall トランザクションハッシュをユーザーに提示し、ブロックエクスプローラーへのリンクを提供する
5. When MetaMask等のウォレットでユーザーがトランザクションを拒否した場合, the Innocence Ledger Platform shall 「トランザクションがキャンセルされました」と表示する
6. If スマートコントラクトからrevertエラーが返された場合, then the Innocence Ledger Platform shall revert reasonを解析し、ユーザーフレンドリーなメッセージに変換して表示する

---

### Requirement 10: テストネット環境とデプロイ

**Objective**: 開発チームとして、Base Sepolia テストネット環境でスマートコントラクトをデプロイし、フロントエンドと統合テストを実行したい

#### Acceptance Criteria

1. The Innocence Ledger Platform shall Hardhat deployment scriptsを使用してBase Sepoliaにコントラクトをデプロイする
2. When コントラクトがデプロイされた場合, the Innocence Ledger Platform shall デプロイされたアドレスを環境変数ファイル（`.env`）に保存する
3. The Innocence Ledger Platform shall フロントエンドの設定ファイルにBase Sepolia RPC URL、Chain IDを設定する
4. The Innocence Ledger Platform shall テストネット用のJPYCトークンアドレスをフロントエンドに設定する
5. When Hardhatテストが実行される場合, the Innocence Ledger Platform shall すべてのコントラクト関数に対する単体テストをパスする
6. The Innocence Ledger Platform shall テストカバレッジ80%以上を達成する
7. When フロントエンドとコントラクトの統合テストを実行する場合, the Innocence Ledger Platform shall E2Eテストシナリオ（ウォレット作成→寄付→引き出し）が正常に完了する
