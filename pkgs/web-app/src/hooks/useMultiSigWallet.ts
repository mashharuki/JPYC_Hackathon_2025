import { INNOCENT_SUPPORT_WALLET_ABI } from "@/utils/web3/abi"
import { useCallback, useMemo, useState } from "react"
import { createPublicClient, createWalletClient, custom, http } from "viem"
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
  addRecipient: (walletAddress: `0x${string}`, recipientAddress: `0x${string}`, nonce: bigint) => Promise<`0x${string}`>
  withdraw: (walletAddress: `0x${string}`, recipientAddress: `0x${string}`, amount: bigint) => Promise<`0x${string}`>
  getConnectedAddress: () => Promise<`0x${string}`>
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
   * MVPでは、テスト目的で同一ウォレットから2つの署名を生成しています。
   *
   * @param walletAddress - MultiSig Wallet のコントラクトアドレス
   * @param recipientAddress - ホワイトリストに追加する受取人アドレス
   * @param nonce - リプレイ攻撃防止用の nonce
   * @returns トランザクションハッシュ
   * @throws {Error} ウォレット接続エラー、署名拒否、トランザクション失敗時
   */
  const addRecipient = useCallback(
    async (walletAddress: `0x${string}`, recipientAddress: `0x${string}`, nonce: bigint): Promise<`0x${string}`> => {
      if (!walletClient) {
        throw new Error("ウォレットが接続されていません。MetaMaskなどのウォレットを接続してください。")
      }

      try {
        setIsLoading(true)
        setError(null)

        // EIP-712 型付きデータの定義
        const types = {
          AddRecipient: [
            { name: "recipient", type: "address" },
            { name: "nonce", type: "uint256" }
          ]
        }

        const message = {
          recipient: recipientAddress,
          nonce
        }

        const domain = {
          ...EIP712_DOMAIN,
          verifyingContract: walletAddress
        }

        // アカウントを取得
        const accounts = await walletClient.getAddresses()
        const account = accounts[0]

        // Owner 1 の署名を取得
        const signature1 = await walletClient.signTypedData({
          account,
          domain,
          types,
          primaryType: "AddRecipient",
          message
        })

        // Owner 2 の署名を取得
        // NOTE: 本番環境では別のウォレットから署名を取得
        const signature2 = await walletClient.signTypedData({
          account,
          domain,
          types,
          primaryType: "AddRecipient",
          message
        })

        // addRecipient トランザクションを送信
        const txHash = await walletClient.writeContract({
          address: walletAddress,
          abi: INNOCENT_SUPPORT_WALLET_ABI,
          functionName: "addRecipient",
          args: [recipientAddress, [signature1, signature2], nonce],
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
    [walletClient]
  )

  /**
   * 引き出しトランザクションを実行
   *
   * @remarks
   * 引き出しはホワイトリストに登録された受取人のみが実行できます。
   * コントラクト側で呼び出し者のホワイトリスト検証が行われます。
   *
   * @param walletAddress - MultiSig Wallet のコントラクトアドレス
   * @param recipientAddress - JPYC の送金先アドレス
   * @param amount - 引き出し額（wei単位）
   * @returns トランザクションハッシュ
   * @throws {Error} ウォレット接続エラー、ホワイトリスト未登録、残高不足時
   */
  const withdraw = useCallback(
    async (walletAddress: `0x${string}`, recipientAddress: `0x${string}`, amount: bigint): Promise<`0x${string}`> => {
      if (!walletClient) {
        throw new Error("ウォレットが接続されていません。MetaMaskなどのウォレットを接続してください。")
      }

      try {
        setIsLoading(true)
        setError(null)

        // アカウントを取得
        const accounts = await walletClient.getAddresses()
        const account = accounts[0]

        // withdraw トランザクションを送信
        const txHash = await walletClient.writeContract({
          address: walletAddress,
          abi: INNOCENT_SUPPORT_WALLET_ABI,
          functionName: "withdraw",
          args: [recipientAddress, amount],
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
    [walletClient]
  )

  /**
   * 接続中のウォレットアドレスを取得
   *
   * @returns 接続中のアドレス
   * @throws {Error} ウォレットが接続されていない場合
   */
  const getConnectedAddress = useCallback(async (): Promise<`0x${string}`> => {
    if (!walletClient) {
      throw new Error("ウォレットが接続されていません。MetaMaskなどのウォレットを接続してください。")
    }

    const accounts = await walletClient.getAddresses()
    const account = accounts[0]
    if (!account) {
      throw new Error("接続中のウォレットアドレスが取得できませんでした。")
    }

    return account as `0x${string}`
  }, [walletClient])

  return {
    isWhitelisted,
    addRecipient,
    withdraw,
    getConnectedAddress,
    isLoading,
    error
  }
}
