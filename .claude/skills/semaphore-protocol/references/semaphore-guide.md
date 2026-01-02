# Semaphore V4 完全リファレンスガイド

## 目次

1. [コアコンセプト](#コアコンセプト)
2. [パッケージとインストール](#パッケージとインストール)
3. [Identity（アイデンティティ）管理](#identityアイデンティティ管理)
4. [Group（グループ）操作](#groupグループ操作)
5. [Proof（証明）の生成と検証](#proof証明の生成と検証)
6. [オンチェーン統合](#オンチェーン統合)
7. [設定とパラメータ](#設定とパラメータ)
8. [トラブルシューティング](#トラブルシューティング)
9. [アーキテクチャの詳細](#アーキテクチャの詳細)
10. [参考リソース](#参考リソース)

---

## コアコンセプト

Semaphoreは、ユーザーがグループメンバーとしてメッセージ（投票、承認など）を匿名で送信できるゼロ知識プロトコルです。二重シグナリング防止機能が組み込まれています。

### 主要コンポーネント

#### 1. Identity（アイデンティティ）

ユーザーの暗号学的なアイデンティティ（秘密鍵、公開鍵、コミットメント）

```javascript
{
  privateKey: "...",  // 秘密鍵
  publicKey: "...",   // 公開鍵
  commitment: "..."   // グループに追加される識別子
}
```

#### 2. Group（グループ）

アイデンティティコミットメントのマークル木構造

- メンバーシップの効率的な証明を可能にする
- グループサイズに対してログスケールの証明サイズ
- 動的なメンバー追加・削除をサポート

#### 3. Proof（証明）

グループメンバーシップとメッセージのゼロ知識証明

証明内容：

- ユーザーがグループのメンバーである
- メッセージが改ざんされていない
- 特定のスコープ内で一度だけ証明を作成している

#### 4. Nullifier（ヌリファイア）

二重シグナリングを防ぐ一意の識別子

- 同じアイデンティティとスコープから常に同じヌリファイアが生成される
- ユーザーのアイデンティティを明かさずに二重使用を検出可能

#### 5. Scope（スコープ）

証明が有効なトピック/コンテキスト

- ユーザーがスコープごとに1つの証明のみ提出できるように制限
- 通常はグループルート（`group.root`）または特定のトピックID

---

## パッケージとインストール

### 必須パッケージ

#### コア機能（オールインワン）

```bash
npm install @semaphore-protocol/core
```

すべての主要機能を含む：

- Identity管理
- Group操作
- Proof生成・検証

#### 個別パッケージ

```bash
# アイデンティティ管理のみ
npm install @semaphore-protocol/identity

# グループ操作のみ
npm install @semaphore-protocol/group

# 証明生成・検証のみ
npm install @semaphore-protocol/proof

# Solidityコントラクト
npm install @semaphore-protocol/contracts
```

### オプションパッケージ

```bash
# オンチェーンデータ取得
npm install @semaphore-protocol/data

# CLIツール
npm install -g @semaphore-protocol/cli
```

---

## Identity（アイデンティティ）管理

### 基本的な使用方法

#### ランダムなアイデンティティの生成

```javascript
import { Identity } from "@semaphore-protocol/identity"

// 新しいランダムなアイデンティティを作成
const identity = new Identity()

// アイデンティティ情報の取得
const { privateKey, publicKey, commitment } = identity

console.log("Private Key:", privateKey)
console.log("Public Key:", publicKey)
console.log("Commitment:", commitment) // グループに追加するID
```

#### 決定論的アイデンティティの生成

```javascript
// シークレット値から同じアイデンティティを再生成
const secret = "my-secret-passphrase"
const deterministicIdentity = new Identity(secret)

// 同じシークレットからは常に同じアイデンティティが生成される
const identity2 = new Identity(secret)
console.log(deterministicIdentity.commitment === identity2.commitment) // true
```

### メッセージの署名と検証

```javascript
// メッセージに署名
const message = "Hello World"
const signature = identity.signMessage(message)

// 署名を検証
const isValid = Identity.verifySignature(message, signature, identity.publicKey)
console.log("Signature valid:", isValid) // true
```

### エクスポートとインポート

```javascript
// アイデンティティをエクスポート（Base64形式の秘密鍵）
const exported = identity.export()
console.log("Exported:", exported)

// アイデンティティをインポート
const importedIdentity = Identity.import(exported)
console.log("Imported successfully:", identity.commitment === importedIdentity.commitment) // true
```

### セキュリティに関する重要な注意事項

⚠️ **アイデンティティの再利用に関する警告**

同じアイデンティティを複数のグループで使用すると、**すべてのグループのプライバシーが損なわれます**。

**理由：**

- Nullifierはアイデンティティとスコープから計算される
- 異なるグループで同じアイデンティティを使用すると、活動を関連付けられる可能性がある

**ベストプラクティス：**

- 各グループに対して一意のアイデンティティを使用
- または、アイデンティティの再利用によるリスクを十分に理解して使用

---

## Group（グループ）操作

### グループの作成

```javascript
import { Group } from "@semaphore-protocol/group"

// 空のグループを作成
const group = new Group()

// 既存のメンバーでグループを作成
const group = new Group([commitment1, commitment2, commitment3])
```

### メンバー管理

#### メンバーの追加

```javascript
// 単一メンバーの追加
group.addMember(identity.commitment)

// 複数メンバーの追加
group.addMembers([identity1.commitment, identity2.commitment, identity3.commitment])
```

#### メンバーの削除

```javascript
// インデックスでメンバーを削除（実際は0に設定）
group.removeMember(0)

// 注意: removeMemberはメンバーを0に設定するが、配列サイズは変更しない
// これによりマークル木の構造が保たれる
```

#### メンバーの更新

```javascript
// 既存メンバーを新しいコミットメントで更新
group.updateMember(0, newCommitment)
```

### グループ情報の取得

```javascript
// グループのルートハッシュ（グループの一意な識別子）
const root = group.root
console.log("Group Root:", root)

// グループの深さ（マークル木の深さ）
const depth = group.depth
console.log("Group Depth:", depth)

// メンバー数
const size = group.size
console.log("Group Size:", size)

// すべてのメンバー（コミットメント）を取得
const members = group.members
console.log("Members:", members)
```

### マークル証明の生成

```javascript
// 特定のメンバーのマークル証明を生成
const memberIndex = 0
const merkleProof = group.generateMerkleProof(memberIndex)

console.log("Merkle Proof:", merkleProof)
// {
//   root: "...",
//   leaf: "...",
//   siblings: [...],
//   pathIndices: [...]
// }
```

---

## Proof（証明）の生成と検証

### 証明の生成

```javascript
import { generateProof } from "@semaphore-protocol/proof"

// スコープの定義（通常はグループルートまたは特定のトピックID）
const scope = group.root

// メッセージ（証明したい内容）
const message = 1 // または任意のBigInt値

// 証明を生成
const proof = await generateProof(
  identity, // ユーザーのアイデンティティ
  group, // グループオブジェクト
  message, // 送信するメッセージ
  scope // スコープ（コンテキスト）
)

console.log("Generated Proof:", proof)
```

### 証明の検証

```javascript
import { verifyProof } from "@semaphore-protocol/proof"

// 証明を検証
const isValid = await verifyProof(proof)

console.log("Proof is valid:", isValid) // true または false
```

### 証明オブジェクトの構造

生成された証明オブジェクトには以下が含まれます：

```javascript
{
  merkleTreeDepth: 16,
  merkleTreeRoot: "...",
  nullifier: "...",
  message: "...",
  scope: "...",
  points: {
    // Groth16証明データ
  }
}
```

### カスタムスコープの使用

```javascript
// 投票など、特定のトピックごとにスコープを設定
const votingTopic = "proposal-123"
const scope = BigInt(ethers.utils.id(votingTopic))

const proof = await generateProof(identity, group, vote, scope)
```

この場合、ユーザーは`proposal-123`というスコープ内で1回のみ証明を提出できます。

---

## オンチェーン統合

### Solidityコントラクトの使用

#### 基本的なセットアップ

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract MyAnonymousVoting {
    ISemaphore public semaphore;
    uint256 public groupId;

    // 投票結果を記録
    mapping(uint256 => uint256) public votes; // nullifier => vote

    constructor(ISemaphore _semaphore) {
        semaphore = _semaphore;
        // 新しいグループを作成
        groupId = semaphore.createGroup();
    }

    // メンバーをグループに追加
    function addMember(uint256 identityCommitment) external {
        semaphore.addMember(groupId, identityCommitment);
    }

    // 匿名で投票
    function vote(
        uint256 vote,
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        // 証明を検証（自動的に二重投票もチェック）
        semaphore.validateProof(groupId, proof);

        // 投票を記録
        votes[proof.nullifier] = vote;
    }

    // 投票結果を取得
    function getVote(uint256 nullifier) external view returns (uint256) {
        return votes[nullifier];
    }
}
```

#### より高度な例：匿名認証

```solidity
contract AnonymousAuth {
    ISemaphore public semaphore;
    uint256 public memberGroupId;

    mapping(uint256 => bool) public hasAccessed;

    constructor(ISemaphore _semaphore) {
        semaphore = _semaphore;
        memberGroupId = semaphore.createGroup();
    }

    function addAuthorizedMember(uint256 commitment) external {
        semaphore.addMember(memberGroupId, commitment);
    }

    function accessResource(
        uint256 resourceId,
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        // リソースIDをスコープとして使用
        require(proof.scope == resourceId, "Invalid scope");

        // 証明を検証
        semaphore.validateProof(memberGroupId, proof);

        // アクセスを記録
        hasAccessed[proof.nullifier] = true;

        // リソースへのアクセスを許可...
    }
}
```

### デプロイ済みコントラクト

Semaphoreコントラクトは以下のネットワークにデプロイされています：

- Ethereum Mainnet
- Sepolia Testnet
- Arbitrum
- Optimism
- その他多数

最新のアドレスは[公式ドキュメント](https://docs.semaphore.pse.dev/deployed-contracts)を参照してください。

---

## 設定とパラメータ

### サーキットパラメータ

#### MAX_DEPTH（マークル木の最大深さ）

- **範囲**: 1～32
- **デフォルト**: 16
- **影響**: 最大グループサイズ = 2^MAX_DEPTH
- **例**:
  - MAX_DEPTH=16 → 最大65,536メンバー
  - MAX_DEPTH=20 → 最大1,048,576メンバー
  - MAX_DEPTH=32 → 最大4,294,967,296メンバー

**トレードオフ:**

- 深さが大きいほど、より多くのメンバーをサポート
- 証明生成時間と検証コストが増加

#### Merkleルートの有効期限

- **デフォルト**: 1時間（古いマークルルートの証明有効期限）
- グループが頻繁に更新される場合、古いルートでの証明が無効になる可能性がある

### メッセージの改ざん防止

Semaphoreサーキットは、メッセージの改ざんを防ぐために「ダミー平方」を計算します。

```javascript
// サーキット内部（概念的な説明）
dummySquare = (message - originalMessage) ^ 2

// message === originalMessageの場合のみ、dummySquare === 0
```

この仕組みにより、証明生成後にメッセージを変更することが計算上不可能になります。

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. "Proof verification failed"（証明の検証に失敗）

**原因:**

- グループにアイデンティティコミットメントが含まれていない
- 生成と検証でスコープが一致していない
- マークルルートが古い（有効期限切れ）

**解決方法:**

```javascript
// グループにメンバーが含まれているか確認
const members = group.members
console.log("Group contains identity:", members.includes(identity.commitment))

// スコープが一致しているか確認
console.log("Scope used:", scope)

// グループルートを確認
console.log("Current group root:", group.root)
```

#### 2. "Nullifier already exists"（ヌリファイアが既に存在）

**原因:**

- ユーザーが同じスコープで既に証明を提出している
- 二重シグナリングの防止が機能している（意図された動作）

**解決方法:**

```javascript
// 異なるスコープを使用
const newScope = BigInt(Date.now())

// または、ヌリファイアの追跡を実装
const usedNullifiers = new Set()

if (usedNullifiers.has(proof.nullifier)) {
  console.log("User already submitted proof for this scope")
} else {
  usedNullifiers.add(proof.nullifier)
}
```

#### 3. "Identity commitment not found"（アイデンティティコミットメントが見つからない）

**原因:**

- 証明を生成する前にアイデンティティをグループに追加していない
- 間違ったグループを使用している

**解決方法:**

```javascript
// 証明生成前にメンバーを追加
group.addMember(identity.commitment)

// グループIDを確認
console.log("Using group ID:", groupId)
```

#### 4. 証明生成が遅い

**原因:**

- 大きなMAX_DEPTHを使用している
- ブラウザ環境でのパフォーマンス制約

**解決方法:**

```javascript
// 必要最小限のMAX_DEPTHを使用
// 例：100メンバー以下なら MAX_DEPTH=7 (2^7=128)で十分

// Node.js環境での実行を検討
// ブラウザよりも高速に証明を生成可能
```

---

## アーキテクチャの詳細

### サーキット構造

Semaphoreサーキットは3つのことを証明します：

#### 1. メンバーシップ（Membership）

ユーザーがグループに属していることの証明

**仕組み:**

- マークル証明の検証
- リーフ（アイデンティティコミットメント）がルートに含まれることを確認

#### 2. 認可（Authorization）

同じユーザーがメッセージと証明を作成したことの証明

**仕組み:**

- ヌリファイアの計算と検証
- `nullifier = hash(identitySecret, scope)`
- 同じアイデンティティとスコープから常に同じヌリファイアが生成される

#### 3. メッセージの完全性（Message Integrity）

メッセージが改ざんされていないことの証明

**仕組み:**

- ダミー平方の計算
- メッセージが変更されると証明が無効になる

### コントラクトアーキテクチャ

#### SemaphoreVerifier.sol

- Groth16証明の検証を実行
- zkSNARK検証ロジック
- ガス最適化された実装

#### SemaphoreGroups.sol（抽象）

- グループ管理の基本機能
- メンバーの追加・削除・更新
- マークルルートの追跡

#### Semaphore.sol

- 完全な実装
- グループ管理 + 証明検証
- ヌリファイアの重複チェック
- `validateProof`関数が主要なエントリーポイント

---

## 参考リソース

### 📚 公式ドキュメントとガイド

- [Getting Started Tutorial](https://docs.semaphore.pse.dev/getting-started) - 初心者向けチュートリアル
- [Identities Deep Dive](https://docs.semaphore.pse.dev/guides/identities) - アイデンティティ管理の詳細
- [Groups Management](https://docs.semaphore.pse.dev/guides/groups) - グループ操作の包括的なガイド
- [Proof Generation](https://docs.semaphore.pse.dev/guides/proofs) - 証明生成のワークフロー

### 🔧 技術仕様とリファレンス

- [Semaphore V4 Specification](https://github.com/zkspecs/zkspecs/blob/main/specs/3/README.md) - プロトコル仕様書
- [Circuit Documentation](https://docs.semaphore.pse.dev/technical-reference/circuits) - サーキットの内部構造
- [Contract Reference](https://docs.semaphore.pse.dev/technical-reference/contracts) - Solidityコントラクトの詳細
- [Deployed Contracts](https://docs.semaphore.pse.dev/deployed-contracts) - デプロイ済みコントラクトアドレス

### 🛠️ 開発ツールとテンプレート

- [GitHub Repository](https://github.com/semaphore-protocol/semaphore) - ソースコードと実装例
- [CLI Templates](https://github.com/semaphore-protocol/semaphore/tree/main/packages/cli) - プロジェクトボイラープレート
- [Boilerplate App](https://github.com/semaphore-protocol/boilerplate) - 完全なサンプルアプリケーション

### 🔐 セキュリティと監査

- [Trusted Setup Ceremony](https://ceremony.pse.dev/projects/Semaphore%20V4%20Ceremony) - 400名以上が参加した信頼されたセットアップ（2024年7月）
- [Security Audits](https://docs.semaphore.pse.dev/#audits) - PSEとVeridiseによる監査レポート
- [Best Practices Guide](https://docs.semaphore.pse.dev/) - セキュリティに関する考慮事項

### 🌐 コミュニティとサポート

- [Documentation](https://docs.semaphore.pse.dev/) - 完全なドキュメント
- [GitHub Discussions](https://github.com/semaphore-protocol/semaphore/discussions) - コミュニティサポート
- [PSE Website](https://pse.dev/) - Privacy & Scaling Explorationsチーム

### 📊 データとインデックス作成

- [@semaphore-protocol/data](https://github.com/semaphore-protocol/semaphore/tree/main/packages/data) - オンチェーンデータの取得
- [Subgraph Templates](https://github.com/semaphore-protocol/semaphore/tree/main/packages/cli-template-monorepo-subgraph) - Graph Protocolとの統合

---

## ユースケース

### プライベート投票

- 匿名の投票システム
- 二重投票の防止
- グループメンバーシップの検証

### 内部告発

- 認証されたメンバーによる匿名報告
- アイデンティティの開示なしでメンバーシップを証明

### 匿名DAO

- アイデンティティを明かさずにガバナンスに参加
- プライバシーを保ちながら投票権を行使

### ミキサー

- プライバシーを保持した価値の転送
- 送信者と受信者の関連性を隠蔽

### 匿名認証

- アイデンティティを明かさずにメンバーシップを証明
- ゼロ知識認証システム
