import { Identity } from "@semaphore-protocol/identity"

/**
 * Semaphore Identity管理の完全な例
 */

// ============================================
// 1. アイデンティティの生成
// ============================================

console.log("=== 1. アイデンティティの生成 ===\n")

// ランダムなアイデンティティを生成
const randomIdentity = new Identity()
console.log("ランダムアイデンティティ:")
console.log("  Private Key:", randomIdentity.privateKey)
console.log("  Public Key:", randomIdentity.publicKey)
console.log("  Commitment:", randomIdentity.commitment)
console.log()

// 決定論的アイデンティティを生成（シークレットから）
const secret = "my-secret-passphrase-12345"
const deterministicIdentity = new Identity(secret)
console.log("決定論的アイデンティティ:")
console.log("  Commitment:", deterministicIdentity.commitment)

// 同じシークレットから再生成
const regenerated = new Identity(secret)
console.log("  再生成されたCommitment:", regenerated.commitment)
console.log("  一致:", deterministicIdentity.commitment === regenerated.commitment)
console.log()

// ============================================
// 2. メッセージの署名と検証
// ============================================

console.log("=== 2. メッセージの署名と検証 ===\n")

const message = "Hello, Semaphore!"
const signature = randomIdentity.signMessage(message)

console.log("メッセージ:", message)
console.log("署名:", signature)

// 署名を検証
const isValid = Identity.verifySignature(message, signature, randomIdentity.publicKey)
console.log("署名の検証結果:", isValid ? "✓ 有効" : "✗ 無効")

// 異なるメッセージで検証（失敗する例）
const tamperedMessage = "Tampered message"
const isInvalid = Identity.verifySignature(tamperedMessage, signature, randomIdentity.publicKey)
console.log("改ざんされたメッセージの検証:", isInvalid ? "✓ 有効" : "✗ 無効")
console.log()

// ============================================
// 3. アイデンティティのエクスポート/インポート
// ============================================

console.log("=== 3. アイデンティティのエクスポート/インポート ===\n")

// エクスポート（Base64形式の秘密鍵）
const exported = randomIdentity.export()
console.log("エクスポートされたアイデンティティ:", exported)

// インポート
const imported = Identity.import(exported)
console.log("インポートされたCommitment:", imported.commitment)
console.log("元のCommitment:", randomIdentity.commitment)
console.log("一致:", imported.commitment === randomIdentity.commitment)
console.log()

// ============================================
// 4. ユースケース：複数のアイデンティティ管理
// ============================================

console.log("=== 4. 複数のアイデンティティ管理 ===\n")

// ユーザーごとに異なるグループ用のアイデンティティを作成
interface UserIdentities {
  voting: Identity
  dao: Identity
  anonymous: Identity
}

function createUserIdentities(userId: string): UserIdentities {
  return {
    voting: new Identity(`${userId}-voting`),
    dao: new Identity(`${userId}-dao`),
    anonymous: new Identity(`${userId}-anonymous`)
  }
}

const user123 = createUserIdentities("user123")

console.log("User 123 のアイデンティティ:")
console.log("  投票用:", user123.voting.commitment)
console.log("  DAO用:", user123.dao.commitment)
console.log("  匿名認証用:", user123.anonymous.commitment)
console.log()

// ============================================
// 5. ストレージとの統合例
// ============================================

console.log("=== 5. ストレージへの保存（例） ===\n")

interface StoredIdentity {
  id: string
  exportedKey: string
  commitment: string
  createdAt: number
}

class IdentityManager {
  private storage: Map<string, StoredIdentity> = new Map()

  /**
   * アイデンティティを保存
   */
  saveIdentity(id: string, identity: Identity): void {
    const stored: StoredIdentity = {
      id,
      exportedKey: identity.export(),
      commitment: identity.commitment.toString(),
      createdAt: Date.now()
    }
    this.storage.set(id, stored)
    console.log(`✓ アイデンティティ "${id}" を保存しました`)
  }

  /**
   * アイデンティティを読み込み
   */
  loadIdentity(id: string): Identity | null {
    const stored = this.storage.get(id)
    if (!stored) {
      console.log(`✗ アイデンティティ "${id}" が見つかりません`)
      return null
    }

    const identity = Identity.import(stored.exportedKey)
    console.log(`✓ アイデンティティ "${id}" を読み込みました`)
    return identity
  }

  /**
   * すべてのアイデンティティを一覧表示
   */
  listIdentities(): void {
    console.log("\n保存されているアイデンティティ:")
    this.storage.forEach((stored, id) => {
      console.log(`  ${id}:`)
      console.log(`    Commitment: ${stored.commitment}`)
      console.log(`    作成日時: ${new Date(stored.createdAt).toISOString()}`)
    })
  }
}

// 使用例
const manager = new IdentityManager()

// 保存
manager.saveIdentity("alice-voting", user123.voting)
manager.saveIdentity("alice-dao", user123.dao)

// 読み込み
const loaded = manager.loadIdentity("alice-voting")
if (loaded) {
  console.log("  読み込まれたCommitment:", loaded.commitment)
}

// 一覧表示
manager.listIdentities()
console.log()

// ============================================
// 6. セキュリティのベストプラクティス
// ============================================

console.log("=== 6. セキュリティのベストプラクティス ===\n")

console.log("⚠️ 重要な注意事項:")
console.log("1. 秘密鍵は安全に保存してください")
console.log("2. 同じアイデンティティを複数のグループで使用しない")
console.log("3. エクスポートされたキーは暗号化して保存")
console.log("4. 本番環境ではシークレットをハードコードしない")
console.log("5. 定期的にアイデンティティをローテーション")
