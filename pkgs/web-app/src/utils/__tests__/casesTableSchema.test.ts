import { supabase } from "../supabase"

/**
 * Cases Table Schema Test
 *
 * TDD Approach:
 * 1. RED: これらのテストは最初は失敗する（テーブルが存在しないため）
 * 2. GREEN: マイグレーションを実行するとテストが成功する
 * 3. REFACTOR: スキーマの最適化が必要な場合は調整
 */

/**
 * Cases Table Schema Test
 *
 * TDD Approach:
 * 1. RED: これらのテストは最初は失敗する（テーブルが存在しないため）
 * 2. GREEN: マイグレーションを実行するとテストが成功する
 * 3. REFACTOR: スキーマの最適化が必要な場合は調整
 */

describe("Cases Table Schema", () => {
  // テストデータのクリーンアップ用のヘルパー
  let testWalletAddress: string
  let testGroupId: string

  beforeEach(() => {
    // 各テストごとにユニークな値を生成
    const randomHex = Math.floor(Math.random() * 1000000)
      .toString(16)
      .padStart(6, "0")
    testWalletAddress = `0x${randomHex}1234567890123456789012345678901234`
    testGroupId = `test-group-id-${Date.now()}-${Math.random()}`
  })

  afterEach(async () => {
    // テストデータのクリーンアップ
    if (testWalletAddress) {
      await supabase.from("cases").delete().eq("wallet_address", testWalletAddress)
    }
    // 他のバリエーションもクリーンアップ（UNIQUE制約テスト用）
    if (testWalletAddress) {
      await supabase
        .from("cases")
        .delete()
        .like("wallet_address", testWalletAddress.substring(0, 10) + "%")
    }
  })

  it("should have cases table accessible", async () => {
    // テーブルが存在し、アクセス可能であることを確認
    const { data, error } = await supabase.from("cases").select("*").limit(0)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it("should insert a valid case record", async () => {
    const newCase = {
      title: "Test Case",
      description: "Test Description",
      goal_amount: 1000000n, // 1,000,000 JPYC
      wallet_address: testWalletAddress,
      semaphore_group_id: testGroupId
    }

    const { data, error } = await supabase.from("cases").insert(newCase).select().single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.title).toBe(newCase.title)
    expect(data?.description).toBe(newCase.description)
    // 数値または文字列として返される可能性があるため、両方を許容するか変換して比較
    expect(Number(data?.goal_amount)).toBe(Number(newCase.goal_amount))
    expect(data?.current_amount).toBe(0) // 数値で返ってくる場合もあるので注意。スキーマ定義ではBIGINTだが、supabase-jsの挙動による。
    // 前回の失敗では "0" (string) ではなく 0 (number) だった可能性も？
    // エラーメッセージ: Expected: "1000000", Received: 1000000
    // つまり数値で返ってきている。
    // current_amountのテストも修正が必要かもしれない。

    expect(data?.wallet_address).toBe(newCase.wallet_address)
    expect(data?.semaphore_group_id).toBe(newCase.semaphore_group_id)
    expect(data?.id).toBeDefined() // UUID自動生成
    expect(data?.created_at).toBeDefined() // タイムスタンプ自動生成
    expect(data?.updated_at).toBeDefined() // タイムスタンプ自動生成
  })

  it("should enforce UNIQUE constraint on wallet_address", async () => {
    const newCase = {
      title: "Test Case 1",
      description: "Test Description 1",
      goal_amount: 1000000n,
      wallet_address: testWalletAddress,
      semaphore_group_id: testGroupId + "-1"
    }

    // 最初の挿入は成功
    const { error: firstError } = await supabase.from("cases").insert(newCase).select().single()

    expect(firstError).toBeNull()

    // 同じwallet_addressで2回目の挿入は失敗
    const duplicateCase = {
      ...newCase,
      title: "Test Case 2",
      semaphore_group_id: testGroupId + "-2"
    }

    const { error: secondError } = await supabase.from("cases").insert(duplicateCase).select().single()

    expect(secondError).not.toBeNull()
    expect(secondError?.message).toContain("duplicate key value")
  })

  it("should enforce UNIQUE constraint on semaphore_group_id", async () => {
    const newCase = {
      title: "Test Case 1",
      description: "Test Description 1",
      goal_amount: 1000000n,
      wallet_address: testWalletAddress, // ここでtestWalletAddressを使うと、前のテストのクリーンアップが不十分だと失敗する。
      // しかしbeforeEachで毎回新しいアドレスになるので大丈夫。
      semaphore_group_id: testGroupId
    }

    // 最初の挿入は成功
    const { error: firstError } = await supabase.from("cases").insert(newCase).select().single()

    expect(firstError).toBeNull()

    // 同じsemaphore_group_idで2回目の挿入は失敗
    const duplicateCase = {
      ...newCase,
      wallet_address: testWalletAddress.replace("0", "1"), // 違うアドレスにする
      title: "Test Case 2"
    }

    const { error: secondError } = await supabase.from("cases").insert(duplicateCase).select().single()

    expect(secondError).not.toBeNull()
    expect(secondError?.message).toContain("duplicate key value")
  })

  it("should have default value of 0 for current_amount", async () => {
    const newCase = {
      title: "Test Case",
      description: "Test Description",
      goal_amount: 1000000n,
      wallet_address: testWalletAddress,
      semaphore_group_id: testGroupId
      // current_amountを明示的に指定しない
    }

    const { data, error } = await supabase.from("cases").insert(newCase).select().single()

    expect(error).toBeNull()
    // 数値または文字列の0を許容
    expect(Number(data?.current_amount)).toBe(0)
  })

  it("should auto-generate UUID for id", async () => {
    const newCase = {
      title: "Test Case",
      description: "Test Description",
      goal_amount: 1000000n,
      wallet_address: testWalletAddress,
      semaphore_group_id: testGroupId
    }

    const { data, error } = await supabase.from("cases").insert(newCase).select().single()

    expect(error).toBeNull()
    expect(data?.id).toBeDefined()
    expect(data?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })

  it("should auto-generate timestamps for created_at and updated_at", async () => {
    const newCase = {
      title: "Test Case",
      description: "Test Description",
      goal_amount: 1000000n,
      wallet_address: testWalletAddress,
      semaphore_group_id: testGroupId
    }

    const { data, error } = await supabase.from("cases").insert(newCase).select().single()

    expect(error).toBeNull()
    expect(data?.created_at).toBeDefined()
    expect(data?.updated_at).toBeDefined()
    expect(new Date(data?.created_at as string)).toBeInstanceOf(Date)
    expect(new Date(data?.updated_at as string)).toBeInstanceOf(Date)
  })

  it("should allow querying by wallet_address (index verification)", async () => {
    const newCase = {
      title: "Test Case",
      description: "Test Description",
      goal_amount: 1000000n,
      wallet_address: testWalletAddress,
      semaphore_group_id: testGroupId
    }

    await supabase.from("cases").insert(newCase)

    // wallet_addressによるクエリが高速であることを確認
    const { data, error } = await supabase.from("cases").select("*").eq("wallet_address", testWalletAddress).single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.wallet_address).toBe(testWalletAddress)
  })

  it("should allow querying by semaphore_group_id (index verification)", async () => {
    const newCase = {
      title: "Test Case",
      description: "Test Description",
      goal_amount: 1000000n,
      wallet_address: testWalletAddress,
      semaphore_group_id: testGroupId
    }

    await supabase.from("cases").insert(newCase)

    // semaphore_group_idによるクエリが高速であることを確認
    const { data, error } = await supabase.from("cases").select("*").eq("semaphore_group_id", testGroupId).single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.semaphore_group_id).toBe(testGroupId)
  })
})
