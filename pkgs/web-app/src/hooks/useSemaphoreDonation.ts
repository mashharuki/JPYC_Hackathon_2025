import { useCallback, useMemo, useState } from "react"
import { createPublicClient, createWalletClient, custom, http } from "viem"
import { baseSepolia } from "viem/chains"
import { generateProof } from "@semaphore-protocol/proof"
import { useSemaphore } from "@/context/SemaphoreContext"
import { supabase } from "@/utils/supabase"

// JPYC ERC20 ABI - approve method
const JPYC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

// SemaphoreDonation ABI
const SEMAPHORE_DONATION_ABI = [
  {
    inputs: [
      { name: "merkleTreeRoot", type: "uint256" },
      { name: "nullifier", type: "uint256" },
      { name: "proof", type: "uint256[8]" },
      { name: "walletAddress", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "donateWithProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

// Base Sepolia の JPYC Token Address
const JPYC_TOKEN_ADDRESS = "0xda683fe053b4344F3Aa5Db6Cbaf3046F7755e5E1" as `0x${string}`

/**
 * Hook の返り値の型定義
 */
export interface UseSemaphoreDonationResult {
  donateWithProof: (
    donationContractAddress: `0x${string}`,
    walletAddress: `0x${string}`,
    amount: bigint
  ) => Promise<`0x${string}`>
  joinGroup: (groupId: string) => Promise<void>
  isLoading: boolean
  error: Error | null
}

/**
 * useSemaphoreDonation:
 * Semaphore ZK Proof を利用した匿名寄付機能を提供するカスタムフック
 *
 * @returns {UseSemaphoreDonationResult} Semaphore寄付操作関数とステート
 */
export default function useSemaphoreDonation(): UseSemaphoreDonationResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Semaphore Context から Identity を取得
  const { identity } = useSemaphore()

  // Public Client の作成（useMemoで最適化）
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http()
      }),
    []
  )

  // Wallet Client の作成（useMemoで最適化）
  const walletClient = useMemo(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      return createWalletClient({
        chain: baseSepolia,
        transport: custom(window.ethereum)
      })
    }
    return null
  }, [])

  /**
   * Supabase から最新の Merkle Root を取得
   *
   * @remarks
   * Semaphore グループの Merkle Tree Root は、グループメンバーシップの証明に使用されます。
   * この値は Semaphore Proof 生成時の externalNullifier として使用されます。
   *
   * @param groupId - Semaphore Group ID
   * @returns Merkle Root (bigint形式)
   * @throws {Error} データベースエラーまたはMerkle Rootが見つからない場合
   */
  const getMerkleRoot = useCallback(async (groupId: string): Promise<bigint> => {
    const { data, error } = await supabase.from("semaphore_groups").select("merkle_root").eq("id", groupId).single()

    if (error) {
      throw new Error(`Failed to fetch Merkle root: ${error.message}`)
    }

    if (!data || !data.merkle_root) {
      throw new Error(`Merkle root not found for group: ${groupId}`)
    }

    return BigInt(data.merkle_root)
  }, [])

  /**
   * Semaphore Proof を生成し、匿名寄付を実行
   *
   * @remarks
   * 以下の順序で処理を実行します:
   * 1. Supabase から Merkle Root を取得
   * 2. Semaphore Proof を生成
   * 3. JPYC の approve を実行（SemaphoreDonation が transferFrom できるようにする）
   * 4. SemaphoreDonation の donateWithProof を呼び出し
   *
   * @param donationContractAddress - SemaphoreDonation コントラクトアドレス
   * @param walletAddress - 寄付先の MultiSig Wallet アドレス
   * @param amount - 寄付額（wei単位）
   * @returns トランザクションハッシュ
   * @throws {Error} Identity未取得、ウォレット未接続、Proof生成失敗、トランザクション失敗時
   */
  const donateWithProof = useCallback(
    async (
      donationContractAddress: `0x${string}`,
      walletAddress: `0x${string}`,
      amount: bigint
    ): Promise<`0x${string}`> => {
      if (!identity) {
        throw new Error("Semaphore identity is not available. Please create or restore your identity first.")
      }

      if (!walletClient) {
        throw new Error("ウォレットが接続されていません。MetaMaskなどのウォレットを接続してください。")
      }

      try {
        setIsLoading(true)
        setError(null)

        // アカウントを取得
        const accounts = await walletClient.getAddresses()
        const account = accounts[0]

        // 1. Supabase から Merkle Root を取得（仮のgroupIdを使用）
        // TODO: 実際のgroupIdはケースごとに管理する必要がある
        const merkleRoot = await getMerkleRoot("default-group")

        // 2. Semaphore Proof を生成
        const { merkleTreeRoot, nullifier, proof } = await generateProof(identity, {
          externalNullifier: merkleRoot,
          signal: walletAddress
        })

        // 3. JPYC の approve を実行
        await walletClient.writeContract({
          address: JPYC_TOKEN_ADDRESS,
          abi: JPYC_ABI,
          functionName: "approve",
          args: [donationContractAddress, amount],
          account
        })

        // 4. SemaphoreDonation の donateWithProof を呼び出し
        const txHash = await walletClient.writeContract({
          address: donationContractAddress,
          abi: SEMAPHORE_DONATION_ABI,
          functionName: "donateWithProof",
          args: [
            merkleTreeRoot,
            nullifier,
            proof as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
            walletAddress,
            amount
          ],
          account
        })

        setIsLoading(false)
        return txHash
      } catch (err) {
        const error = err as Error
        setError(error)
        setIsLoading(false)
        throw error
      }
    },
    [identity, walletClient, getMerkleRoot]
  )

  /**
   * Semaphore Group にユーザーを追加
   *
   * @remarks
   * グループに参加することで、ユーザーは匿名で寄付を行うことができるようになります。
   * Identity の commitment がグループの Merkle Tree に追加されます。
   *
   * @param groupId - 参加する Semaphore Group の ID
   * @throws {Error} Identity未取得、データベースエラー時
   *
   * @example
   * ```typescript
   * const { joinGroup } = useSemaphoreDonation()
   * await joinGroup("case-12345-supporters")
   * ```
   */
  const joinGroup = useCallback(
    async (groupId: string): Promise<void> => {
      if (!identity) {
        throw new Error("Semaphore identity is not available. Please create or restore your identity first.")
      }

      try {
        setIsLoading(true)
        setError(null)

        // Supabase に group member を追加
        const { data, error } = await supabase.from("group_members").insert({
          group_id: groupId,
          commitment: identity.commitment.toString()
        })

        if (error) {
          throw new Error(`Failed to join group ${groupId}: ${error.message}`)
        }

        setIsLoading(false)
      } catch (err) {
        const error = err as Error
        setError(error)
        setIsLoading(false)
        throw error
      }
    },
    [identity]
  )

  return {
    donateWithProof,
    joinGroup,
    isLoading,
    error
  }
}
