import { JPYC_ABI } from "@/utils/web3/abi"
import { CONTRACT_ADDRESSES } from "@/utils/web3/addresses"
import { useCallback, useEffect, useMemo, useState } from "react"
import { createPublicClient, http, isAddress } from "viem"
import { getBalance, readContract, watchBlockNumber } from "viem/actions"
import { baseSepolia } from "viem/chains"

// Base Sepolia の JPYC Token Address
const JPYC_TOKEN_ADDRESS = CONTRACT_ADDRESSES[84532].JPYCToken as `0x${string}`

/**
 * Hook の返り値の型定義
 */
export interface UseJPYCBalanceResult {
  ethBalance: bigint | undefined
  jpycBalance: bigint | undefined
  refetch: () => Promise<void>
  isLoading: boolean
  error: Error | null
}

/**
 * useJPYCBalance:
 * 指定されたウォレットアドレスのETHおよびJPYC残高を取得・監視するカスタムフック
 *
 * @param address - 残高を確認するウォレットアドレス (0x...)
 * @returns {UseJPYCBalanceResult} 残高情報とユーティリティ関数
 */
export default function useJPYCBalance(address: `0x${string}`): UseJPYCBalanceResult {
  const [ethBalance, setEthBalance] = useState<bigint | undefined>(undefined)
  const [jpycBalance, setJpycBalance] = useState<bigint | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
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
   * 残高を取得する関数
   */
  const fetchBalances = useCallback(async () => {
    // アドレスの妥当性を検証
    if (!isAddress(address)) {
      setError(new Error("Invalid address format"))
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // ETH残高を取得
      const ethBal = await getBalance(publicClient, {
        address
      })

      // JPYC残高を取得
      const jpycBal = (await readContract(publicClient, {
        address: JPYC_TOKEN_ADDRESS,
        abi: JPYC_ABI,
        functionName: "balanceOf",
        args: [address]
      })) as bigint

      setEthBalance(ethBal)
      setJpycBalance(jpycBal)
      setIsLoading(false)
    } catch (err) {
      setError(err as Error)
      setIsLoading(false)
    }
  }, [address, publicClient])

  /**
   * 手動で残高を再取得する関数
   */
  const refetch = useCallback(async () => {
    await fetchBalances()
  }, [fetchBalances])

  // 初回ロード時に残高を取得
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  // ブロック更新を監視して残高を自動更新
  useEffect(() => {
    const unwatch = watchBlockNumber(publicClient, {
      onBlockNumber: () => {
        fetchBalances()
      }
    })

    // クリーンアップ関数でウォッチャーを解除
    return () => {
      if (typeof unwatch === "function") {
        unwatch()
      }
    }
  }, [publicClient, fetchBalances])

  return {
    ethBalance,
    jpycBalance,
    refetch,
    isLoading,
    error
  }
}
