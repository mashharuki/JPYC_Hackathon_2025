import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof, verifyProof } from "@semaphore-protocol/proof"

/**
 * Semaphore Proof生成と検証の完全な例
 */

// ============================================
// 1. 基本的な証明の生成と検証
// ============================================

async function basicProofExample() {
  console.log("=== 1. 基本的な証明の生成と検証 ===\n")

  // アイデンティティを作成
  const identity = new Identity("alice-secret")
  console.log("Aliceのアイデンティティ:")
  console.log("  Commitment:", identity.commitment)

  // グループを作成してメンバーを追加
  const group = new Group()
  group.addMember(identity.commitment)
  console.log("\nグループ情報:")
  console.log("  Root:", group.root)
  console.log("  Size:", group.size)

  // スコープを定義（通常はグループルート）
  const scope = group.root

  // メッセージ（投票内容など）
  const message = BigInt(1) // 1 = 賛成

  console.log("\n証明パラメータ:")
  console.log("  Message:", message)
  console.log("  Scope:", scope)

  // 証明を生成
  console.log("\n証明を生成中...")
  const proof = await generateProof(identity, group, message, scope)

  console.log("✓ 証明が生成されました:")
  console.log("  Nullifier:", proof.nullifier)
  console.log("  Merkle Tree Root:", proof.merkleTreeRoot)
  console.log("  Merkle Tree Depth:", proof.merkleTreeDepth)

  // 証明を検証
  console.log("\n証明を検証中...")
  const isValid = await verifyProof(proof)
  console.log("検証結果:", isValid ? "✓ 有効" : "✗ 無効")
  console.log()
}

// ============================================
// 2. カスタムスコープの使用
// ============================================

async function customScopeExample() {
  console.log("=== 2. カスタムスコープの使用 ===\n")

  const alice = new Identity("alice-secret")
  const group = new Group([alice.commitment])

  // 異なるスコープで複数の証明を生成
  const proposal1Scope = BigInt(12345) // 提案1
  const proposal2Scope = BigInt(67890) // 提案2

  console.log("提案1への投票:")
  const vote1 = BigInt(1) // 賛成
  const proof1 = await generateProof(alice, group, vote1, proposal1Scope)
  console.log("  Nullifier:", proof1.nullifier)
  console.log("  Scope:", proof1.scope)

  console.log("\n提案2への投票:")
  const vote2 = BigInt(0) // 反対
  const proof2 = await generateProof(alice, group, vote2, proposal2Scope)
  console.log("  Nullifier:", proof2.nullifier)
  console.log("  Scope:", proof2.scope)

  console.log("\n注意: 異なるスコープでは異なるNullifierが生成されます")
  console.log("  同じNullifier?", proof1.nullifier === proof2.nullifier ? "はい" : "いいえ")
  console.log()
}

// ============================================
// 3. 二重シグナリング防止のデモ
// ============================================

async function doubleSignalingExample() {
  console.log("=== 3. 二重シグナリング防止 ===\n")

  const alice = new Identity("alice-secret")
  const group = new Group([alice.commitment])
  const scope = group.root

  // 最初の投票
  console.log("最初の投票:")
  const vote1 = BigInt(1)
  const proof1 = await generateProof(alice, group, vote1, scope)
  console.log("  Nullifier:", proof1.nullifier)
  console.log("  Message:", vote1)

  // 同じスコープで再度投票を試みる
  console.log("\n同じスコープで再度投票:")
  const vote2 = BigInt(0)
  const proof2 = await generateProof(alice, group, vote2, scope)
  console.log("  Nullifier:", proof2.nullifier)
  console.log("  Message:", vote2)

  // Nullifierが同じことを確認
  console.log("\n✓ 重要: 同じアイデンティティと同じスコープでは常に同じNullifierが生成されます")
  console.log("  同じNullifier?", proof1.nullifier === proof2.nullifier ? "はい" : "いいえ")
  console.log("  これにより二重投票を検出できます")
  console.log()
}

// ============================================
// 4. 実用的な投票システム
// ============================================

class AnonymousVotingSystem {
  private group: Group
  private usedNullifiers: Set<string>
  private votes: Map<string, bigint>

  constructor() {
    this.group = new Group()
    this.usedNullifiers = new Set()
    this.votes = new Map()
  }

  /**
   * 投票者を登録
   */
  registerVoter(identity: Identity): void {
    this.group.addMember(identity.commitment)
    console.log("✓ 投票者を登録しました")
  }

  /**
   * 投票を提出
   */
  async submitVote(identity: Identity, vote: bigint, proposalId: bigint): Promise<boolean> {
    try {
      // 証明を生成
      const proof = await generateProof(identity, this.group, vote, proposalId)

      // 証明を検証
      const isValid = await verifyProof(proof)
      if (!isValid) {
        console.log("✗ 証明の検証に失敗しました")
        return false
      }

      // 二重投票チェック
      const nullifierStr = proof.nullifier.toString()
      if (this.usedNullifiers.has(nullifierStr)) {
        console.log("✗ 二重投票が検出されました")
        return false
      }

      // 投票を記録
      this.usedNullifiers.add(nullifierStr)
      this.votes.set(nullifierStr, vote)

      console.log("✓ 投票が受理されました")
      console.log("  Nullifier:", proof.nullifier)
      console.log("  Vote:", vote)
      return true
    } catch (error) {
      console.error("✗ エラー:", error)
      return false
    }
  }

  /**
   * 投票結果を集計
   */
  tallyVotes(): { yes: number; no: number } {
    let yes = 0
    let no = 0

    this.votes.forEach((vote) => {
      if (vote === BigInt(1)) {
        yes++
      } else if (vote === BigInt(0)) {
        no++
      }
    })

    return { yes, no }
  }

  /**
   * グループを取得
   */
  getGroup(): Group {
    return this.group
  }
}

async function votingSystemExample() {
  console.log("=== 4. 匿名投票システム ===\n")

  const votingSystem = new AnonymousVotingSystem()

  // 投票者を登録
  const alice = new Identity("alice-secret")
  const bob = new Identity("bob-secret")
  const charlie = new Identity("charlie-secret")

  votingSystem.registerVoter(alice)
  votingSystem.registerVoter(bob)
  votingSystem.registerVoter(charlie)

  console.log("\n提案ID: 12345 への投票:")
  const proposalId = BigInt(12345)

  // 各投票者が投票
  console.log("\nAliceが賛成票を投じる:")
  await votingSystem.submitVote(alice, BigInt(1), proposalId)

  console.log("\nBobが反対票を投じる:")
  await votingSystem.submitVote(bob, BigInt(0), proposalId)

  console.log("\nCharlieが賛成票を投じる:")
  await votingSystem.submitVote(charlie, BigInt(1), proposalId)

  // Aliceが再度投票を試みる
  console.log("\nAliceが再度投票を試みる:")
  await votingSystem.submitVote(alice, BigInt(0), proposalId)

  // 結果を集計
  const results = votingSystem.tallyVotes()
  console.log("\n最終結果:")
  console.log("  賛成:", results.yes)
  console.log("  反対:", results.no)
  console.log()
}

// ============================================
// 5. エラーハンドリング
// ============================================

async function errorHandlingExample() {
  console.log("=== 5. エラーハンドリング ===\n")

  const alice = new Identity("alice-secret")
  const bob = new Identity("bob-secret")

  // グループにAliceのみ追加
  const group = new Group([alice.commitment])

  // Bobで証明を生成しようとする（失敗する）
  try {
    console.log("グループに含まれていないアイデンティティで証明を生成:")
    const proof = await generateProof(bob, group, BigInt(1), group.root)
    console.log("✓ 証明が生成されました（これは起きないはず）")
  } catch (error) {
    console.log("✗ エラーが発生:", error instanceof Error ? error.message : error)
    console.log("  理由: Bobはグループに含まれていません")
  }
  console.log()
}

// ============================================
// すべての例を実行
// ============================================

async function main() {
  console.log("Semaphore Proof Examples\n")
  console.log("=".repeat(50) + "\n")

  await basicProofExample()
  await customScopeExample()
  await doubleSignalingExample()
  await votingSystemExample()
  await errorHandlingExample()

  console.log("すべての例が完了しました！")
}

// 実行
main().catch(console.error)
