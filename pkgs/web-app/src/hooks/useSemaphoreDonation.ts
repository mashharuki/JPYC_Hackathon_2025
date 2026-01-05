import { useSemaphoreContext } from "@/context/SemaphoreContext"
import useSemaphoreIdentity from "@/hooks/useSemaphoreIdentity"
import { JPYC_ABI, SEMAPHORE_DONATION_ABI } from "@/utils/web3/abi"
import { CONTRACT_ADDRESSES } from "@/utils/web3/addresses"
import { generateProof, Group } from "@semaphore-protocol/core"
import { useCallback, useMemo, useState } from "react"
import { type Address, type Hex, createPublicClient, createWalletClient, custom, encodeFunctionData, http } from "viem"
import { baseSepolia } from "viem/chains"

// Base Sepolia の JPYC Token Address
const JPYC_TOKEN_ADDRESS = CONTRACT_ADDRESSES[84532].JPYCToken as `0x${string}`

/**
 * Hook の返り値の型定義
 */
export interface UseSemaphoreDonationResult {
  donateWithProof: (
    donationContractAddress: `0x${string}`,
    walletAddress: `0x${string}`,
    amount: bigint,
    options?: {
      sendTransaction?: (to: Address, data: Hex, nexusClient?: any) => Promise<string | null>
      nexusClient?: any
    }
  ) => Promise<`0x${string}`>
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
  const { _identity: identity } = useSemaphoreIdentity()
  const { _users } = useSemaphoreContext()

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
      amount: bigint,
      options?: {
        sendTransaction?: (to: Address, data: Hex, nexusClient?: any) => Promise<string | null>
        nexusClient?: any
      }
    ): Promise<`0x${string}`> => {
      if (!identity) {
        throw new Error("Semaphore identity is not available. Please create or restore your identity first.")
      }

      if (!walletClient && !options?.sendTransaction) {
        throw new Error("ウォレットが接続されていません。MetaMaskなどのウォレットを接続してください。")
      }

      try {
        setIsLoading(true)
        setError(null)

        // 1. Group を作成
        const group = new Group(_users)

        // 2. Semaphore Proof を生成
        const { merkleTreeRoot, nullifier, points: proof } = await generateProof(identity, group, amount, walletAddress)

        if (options?.sendTransaction) {
          const approveData = encodeFunctionData({
            abi: JPYC_ABI,
            functionName: "approve",
            args: [donationContractAddress, amount]
          })

          const donationData = encodeFunctionData({
            abi: SEMAPHORE_DONATION_ABI,
            functionName: "donateWithProof",
            args: [
              BigInt(merkleTreeRoot),
              BigInt(nullifier),
              proof.map((p) => BigInt(p)) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
              walletAddress,
              amount
            ]
          })

          const approvalHash = await options.sendTransaction(JPYC_TOKEN_ADDRESS, approveData, options.nexusClient)
          if (!approvalHash) {
            throw new Error("JPYC approval transaction hash not returned")
          }

          const gaslessHash = await options.sendTransaction(donationContractAddress, donationData, options.nexusClient)
          if (!gaslessHash) {
            throw new Error("Donation transaction hash not returned")
          }

          setIsLoading(false)
          return gaslessHash as `0x${string}`
        }

        if (!walletClient) {
          throw new Error("ウォレットが接続されていません。MetaMaskなどのウォレットを接続してください。")
        }

        // アカウントを取得
        const accounts = await walletClient.getAddresses()
        const account = accounts[0]

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
            BigInt(merkleTreeRoot),
            BigInt(nullifier),
            proof.map((p) => BigInt(p)) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
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
    [identity, walletClient, _users]
  )

  return {
    donateWithProof,
    isLoading,
    error
  }
}
