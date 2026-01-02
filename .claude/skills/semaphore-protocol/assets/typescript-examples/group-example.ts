import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"

/**
 * Semaphore Group操作の完全な例
 */

// ============================================
// 1. グループの作成
// ============================================

console.log("=== 1. グループの作成 ===\n")

// 空のグループを作成
const emptyGroup = new Group()
console.log("空のグループを作成:")
console.log("  Root:", emptyGroup.root)
console.log("  Depth:", emptyGroup.depth)
console.log("  Size:", emptyGroup.size)
console.log()

// アイデンティティを作成
const alice = new Identity("alice-secret")
const bob = new Identity("bob-secret")
const charlie = new Identity("charlie-secret")

console.log("メンバーのコミットメント:")
console.log("  Alice:", alice.commitment)
console.log("  Bob:", bob.commitment)
console.log("  Charlie:", charlie.commitment)
console.log()

// 既存のメンバーでグループを作成
const initialGroup = new Group([alice.commitment, bob.commitment, charlie.commitment])

console.log("初期メンバーありのグループ:")
console.log("  Root:", initialGroup.root)
console.log("  Size:", initialGroup.size)
console.log("  Members:", initialGroup.members)
console.log()

// ============================================
// 2. メンバーの追加
// ============================================

console.log("=== 2. メンバーの追加 ===\n")

const group = new Group()
console.log("グループ作成時のRoot:", group.root)

// 単一メンバーの追加
group.addMember(alice.commitment)
console.log("Alice追加後のRoot:", group.root)
console.log("  Size:", group.size)

// 複数メンバーの追加
group.addMembers([bob.commitment, charlie.commitment])
console.log("Bob, Charlie追加後のRoot:", group.root)
console.log("  Size:", group.size)
console.log()

// ============================================
// 3. マークル証明の生成
// ============================================

console.log("=== 3. マークル証明の生成 ===\n")

// Aliceのマークル証明を生成（インデックス0）
const aliceProof = group.generateMerkleProof(0)

console.log("Aliceのマークル証明:")
console.log("  Root:", aliceProof.root)
console.log("  Leaf:", aliceProof.leaf)
console.log("  Siblings:", aliceProof.siblings)
console.log("  Path Indices:", aliceProof.pathIndices)
console.log()

// ============================================
// 4. メンバーの削除と更新
// ============================================

console.log("=== 4. メンバーの削除と更新 ===\n")

const testGroup = new Group([alice.commitment, bob.commitment, charlie.commitment])

console.log("削除前:")
console.log("  Members:", testGroup.members)
console.log("  Root:", testGroup.root)

// メンバーを削除（実際は0に設定）
testGroup.removeMember(1) // Bobを削除

console.log("\nBob削除後:")
console.log("  Members:", testGroup.members)
console.log("  Root:", testGroup.root)
console.log("  注意: Bobの位置は0になっているが、配列サイズは変わらない")

// メンバーを更新
const david = new Identity("david-secret")
testGroup.updateMember(1, david.commitment) // Bobの位置にDavidを追加

console.log("\nDavidで更新後:")
console.log("  Members:", testGroup.members)
console.log("  Root:", testGroup.root)
console.log()

// ============================================
// 5. グループ情報の取得
// ============================================

console.log("=== 5. グループ情報の取得 ===\n")

const infoGroup = new Group([alice.commitment, bob.commitment, charlie.commitment])

console.log("グループ情報:")
console.log("  Root (グループID):", infoGroup.root)
console.log("  Depth (木の深さ):", infoGroup.depth)
console.log("  Size (メンバー数):", infoGroup.size)
console.log("  Members (全メンバー):", infoGroup.members)
console.log()

// ============================================
// 6. ユースケース：投票グループの管理
// ============================================

console.log("=== 6. 投票グループの管理 ===\n")

class VotingGroup {
  private group: Group
  private memberNames: Map<string, string>

  constructor() {
    this.group = new Group()
    this.memberNames = new Map()
  }

  /**
   * 投票者を追加
   */
  addVoter(name: string, identity: Identity): void {
    this.group.addMember(identity.commitment)
    this.memberNames.set(identity.commitment.toString(), name)
    console.log(`✓ ${name}を投票グループに追加しました`)
  }

  /**
   * 複数の投票者を追加
   */
  addVoters(voters: Array<{ name: string; identity: Identity }>): void {
    const commitments = voters.map((v) => {
      this.memberNames.set(v.identity.commitment.toString(), v.name)
      return v.identity.commitment
    })
    this.group.addMembers(commitments)
    console.log(`✓ ${voters.length}名の投票者を追加しました`)
  }

  /**
   * グループ情報を表示
   */
  getInfo(): void {
    console.log("\n投票グループ情報:")
    console.log("  グループID (Root):", this.group.root)
    console.log("  投票者数:", this.group.size)
    console.log("  木の深さ:", this.group.depth)
  }

  /**
   * 投票者のマークル証明を生成
   */
  generateProof(identity: Identity): any {
    const members = this.group.members
    const index = members.findIndex((m) => m.toString() === identity.commitment.toString())

    if (index === -1) {
      throw new Error("投票者が見つかりません")
    }

    return this.group.generateMerkleProof(index)
  }

  /**
   * グループルートを取得
   */
  getRoot(): bigint {
    return this.group.root
  }

  /**
   * グループオブジェクトを取得
   */
  getGroup(): Group {
    return this.group
  }
}

// 使用例
const votingGroup = new VotingGroup()

// 投票者を追加
votingGroup.addVoter("Alice", alice)
votingGroup.addVoter("Bob", bob)
votingGroup.addVoters([
  { name: "Charlie", identity: charlie },
  { name: "David", identity: david }
])

// 情報表示
votingGroup.getInfo()

// Aliceの証明を生成
try {
  const proof = votingGroup.generateProof(alice)
  console.log("\nAliceのマークル証明を生成しました")
  console.log("  Root:", proof.root)
} catch (error) {
  console.error("エラー:", error)
}
console.log()

// ============================================
// 7. グループのシリアライズ/デシリアライズ
// ============================================

console.log("=== 7. グループの保存と復元 ===\n")

// グループをJSON形式で保存
const savedGroup = {
  members: group.members.map((m) => m.toString()),
  root: group.root.toString(),
  depth: group.depth,
  size: group.size
}

console.log("保存されたグループ:")
console.log(JSON.stringify(savedGroup, null, 2))

// グループを復元
const restoredMembers = savedGroup.members.map((m) => BigInt(m))
const restoredGroup = new Group(restoredMembers)

console.log("\n復元されたグループ:")
console.log("  Root:", restoredGroup.root)
console.log("  Size:", restoredGroup.size)
console.log("  元のRootと一致:", restoredGroup.root === group.root)
console.log()

// ============================================
// 8. パフォーマンスとスケーラビリティ
// ============================================

console.log("=== 8. パフォーマンステスト ===\n")

console.log("大規模グループのパフォーマンス:")

// 100メンバーのグループを作成
const largeGroup = new Group()
const startTime = Date.now()

for (let i = 0; i < 100; i++) {
  const identity = new Identity(`member-${i}`)
  largeGroup.addMember(identity.commitment)
}

const endTime = Date.now()

console.log(`  100メンバー追加: ${endTime - startTime}ms`)
console.log(`  グループRoot: ${largeGroup.root}`)
console.log(`  木の深さ: ${largeGroup.depth}`)
console.log(`  最大メンバー数 (2^${largeGroup.depth}): ${Math.pow(2, largeGroup.depth)}`)
