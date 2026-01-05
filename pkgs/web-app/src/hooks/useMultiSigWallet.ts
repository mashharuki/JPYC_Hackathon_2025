import { INNOCENT_SUPPORT_WALLET_ABI } from "@/utils/web3/abi"
import { useCallback, useMemo, useState } from "react"
import { type Address, type Hex, createPublicClient, encodeFunctionData, http } from "viem"
import { readContract } from "viem/actions"
import { baseSepolia } from "viem/chains"

// EIP-712 ドメイン定義
const EIP712_DOMAIN = {
  name: "InnocentSupportWallet",
  version: "1",
  chainId: baseSepolia.id
} as const

/**
 * Hook の返り値の型定義
 */
export interface UseMultiSigWalletResult {
  isWhitelisted: (walletAddress: `0x${string}`, recipientAddress: `0x${string}`) => Promise<boolean>
  addRecipient: (
    walletAddress: `0x${string}`,
    recipientAddress: `0x${string}`,
    nonce: bigint,
    sendTransaction: (to: Address, data: Hex, nexusClient?: any) => Promise<string | null>,
    nexusClient?: any
  ) => Promise<`0x${string}`>
  withdraw: (
    walletAddress: `0x${string}`,
    recipientAddress: `0x${string}`,
    amount: bigint,
    sendTransaction: (to: Address, data: Hex, nexusClient?: any) => Promise<string | null>,
    nexusClient?: any
  ) => Promise<`0x${string}`>
  getConnectedAddress: (connectedAddress: `0x${string}`) => `0x${string}`
  isLoading: boolean
  error: Error | null
}

/**
 * useMultiSigWallet:
 * MultiSig Wallet とのインタラクション（ホワイトリスト管理、引き出し）を提供するカスタムフック
 *
 * @returns {UseMultiSigWalletResult} MultiSig Wallet 操作関数とステート
 */
export default function useMultiSigWallet(): UseMultiSigWalletResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Public Client の作成（useMemoで最適化）
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http()
      }),
    []
  )

  /**
   * 受取人がホワイトリストに登録されているかを確認
   *
   * @param walletAddress - MultiSig Wallet のコントラクトアドレス
   * @param recipientAddress - 確認する受取人アドレス
   * @returns ホワイトリストに登録されている場合 true
   * @throws {Error} ネットワークエラー時
   */
  const isWhitelisted = useCallback(
    async (walletAddress: `0x${string}`, recipientAddress: `0x${string}`): Promise<boolean> => {
      try {
        setError(null)

        const result = await readContract(publicClient, {
          address: walletAddress,
          abi: INNOCENT_SUPPORT_WALLET_ABI,
          functionName: "isWhitelisted",
          args: [recipientAddress]
        })

        return result as boolean
      } catch (err) {
        const error = err as Error
        setError(error)
        throw error
      }
    },
    [publicClient]
  )

  /**
   * 受取人をホワイトリストに追加（2署名収集）
   *
   * @remarks
   * 本番環境では、2人のOwnerが順次署名を行う必要があります。
   * Biconomy経由での実装は、EIP-712署名が必要なため、
   * 現時点では未実装です。将来的な実装が必要です。
   *
   * @param walletAddress - MultiSig Wallet のコントラクトアドレス
   * @param recipientAddress - ホワイトリストに追加する受取人アドレス
   * @param nonce - リプレイ攻撃防止用の nonce
   * @param sendTransaction - Biconomyのトランザクション送信関数
   * @param nexusClient - BiconomyのNexusクライアント
   * @returns トランザクションハッシュ
   * @throws {Error} 未実装エラー
   */
  const addRecipient = useCallback(
    async (
      walletAddress: `0x${string}`,
      recipientAddress: `0x${string}`,
      nonce: bigint,
      sendTransaction: (to: Address, data: Hex, nexusClient?: any) => Promise<string | null>,
      nexusClient?: any
    ): Promise<`0x${string}`> => {
      // TODO: EIP-712署名をBiconomy対応で実装する必要がある
      throw new Error(
        "addRecipient is not yet implemented for Biconomy. " +
          "This function requires EIP-712 signatures which need special handling with Account Abstraction."
      )
    },
    []
  )

  /**
   * Biconomy経由で引き出しトランザクションを実行
   *
   * @remarks
   * 引き出しはホワイトリストに登録された受取人のみが実行できます。
   * コントラクト側で呼び出し者のホワイトリスト検証が行われます。
   *
   * @param walletAddress - MultiSig Wallet のコントラクトアドレス
   * @param recipientAddress - JPYC の送金先アドレス
   * @param amount - 引き出し額（wei単位）
   * @param sendTransaction - Biconomyのトランザクション送信関数
   * @param nexusClient - BiconomyのNexusクライアント
   * @returns トランザクションハッシュ
   * @throws {Error} ホワイトリスト未登録、残高不足時
   */
  const withdraw = useCallback(
    async (
      walletAddress: `0x${string}`,
      recipientAddress: `0x${string}`,
      amount: bigint,
      sendTransaction: (to: Address, data: Hex, nexusClient?: any) => Promise<string | null>,
      nexusClient?: any
    ): Promise<`0x${string}`> => {
      try {
        setIsLoading(true)
        setError(null)

        // withdraw トランザクションデータを生成
        const withdrawData = encodeFunctionData({
          abi: INNOCENT_SUPPORT_WALLET_ABI,
          functionName: "withdraw",
          args: [recipientAddress, amount]
        })

        // Biconomy経由でトランザクションを送信
        const txHash = await sendTransaction(walletAddress, withdrawData, nexusClient)
        if (!txHash) {
          throw new Error("Withdrawal transaction hash not returned")
        }

        console.log("Withdrawal transaction sent:", txHash)

        setIsLoading(false)
        return txHash as `0x${string}`
      } catch (err) {
        const error = err as Error
        setError(error)
        setIsLoading(false)
        throw error
      }
    },
    []
  )

  /**
   * 接続中のウォレットアドレスを返す（単純なパススルー関数）
   *
   * @param connectedAddress - Privyから取得した接続中のアドレス
   * @returns 接続中のアドレス
   */
  const getConnectedAddress = useCallback((connectedAddress: `0x${string}`): `0x${string}` => {
    return connectedAddress
  }, [])

  return {
    isWhitelisted,
    addRecipient,
    withdraw,
    getConnectedAddress,
    isLoading,
    error
  }
}
