import {
  type NexusClient,
  createBicoPaymasterClient,
  createSmartAccountClient,
  toNexusAccount,
  getMEEVersion,
  MEEVersion
} from "@biconomy/abstractjs"
import { useWallets } from "@privy-io/react-auth"
import { useCallback, useState } from "react"
import { type Address, type Hex, http, createPublicClient } from "viem"
import { waitForTransactionReceipt } from "viem/actions"
import { baseSepolia } from "viem/chains"

/**
 * チェーンIDとブロックエクスプローラーのベースURLのマッピング
 */
const BLOCK_EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io", // Ethereum Mainnet
  84532: "https://sepolia.basescan.org", // Base Sepolia
  8453: "https://basescan.org", // Base Mainnet
  11155111: "https://sepolia.etherscan.io", // Sepolia
  137: "https://polygonscan.com", // Polygon Mainnet
  80002: "https://amoy.polygonscan.com", // Polygon Amoy (Testnet)
  10: "https://optimistic.etherscan.io", // Optimism Mainnet
  42161: "https://arbiscan.io" // Arbitrum One
}

/**
 * チェーンIDからブロックエクスプローラーのトランザクションURLを生成する
 *
 * @param chainId チェーンID
 * @param txHash トランザクションハッシュ
 * @returns ブロックエクスプローラーのURL
 */
const getBlockExplorerUrl = (chainId: number, txHash: string): string => {
  const baseUrl = BLOCK_EXPLORER_URLS[chainId]
  if (!baseUrl) {
    return `Chain ID ${chainId} - Transaction: ${txHash}`
  }
  return `${baseUrl}/tx/${txHash}`
}

/**
 * Biconomyアカウントの状態を管理する型
 */
interface BiconomyAccountState {
  nexusAccount: NexusClient | null
  address: string | null
  isLoading: boolean
  error: string | null
}

/**
 * initializeBiconomyAccount の戻り値の型
 */
interface InitializeAccountResult {
  nexusClient: NexusClient
  address: string
}

/**
 * useBiconomy: Biconomyスマートアカウント管理フック
 *
 * Privy + Biconomy AA統合によるガスレストランザクション送信を実現。
 *
 * @returns Biconomyアカウントの状態と操作メソッド
 */
export const useBiconomy = () => {
  const { wallets } = useWallets()

  // エンベデッドウォレットの取得
  const embeddedWallet = wallets?.[0]

  // トランザクション確認用のPublicClientを作成
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  })

  // Biconomyアカウントの状態を管理する
  const [accountState, setAccountState] = useState<BiconomyAccountState>({
    nexusAccount: null,
    address: null,
    isLoading: false,
    error: null
  })

  /**
   * Biconomyスマートアカウントを初期化する
   *
   * @returns 初期化されたnexusClientとアドレス
   * @throws Privyウォレットが利用できない場合、または初期化に失敗した場合
   */
  const initializeBiconomyAccount = useCallback(async (): Promise<InitializeAccountResult> => {
    try {
      setAccountState((prev) => ({ ...prev, isLoading: true, error: null }))

      if (!embeddedWallet) {
        throw new Error("Embedded wallet is not available")
      }

      const provider = await embeddedWallet.getEthereumProvider()

      console.log("Embedded Wallet address:", embeddedWallet.address)

      // Biconomy Nexus Accountの作成
      const nexusClient = createSmartAccountClient({
        account: await toNexusAccount({
          signer: provider as any,
          chainConfiguration: {
            chain: baseSepolia,
            transport: http(),
            version: getMEEVersion(MEEVersion.V2_1_0)
          }
        }),
        chain: baseSepolia,
        transport: http(
          `https://bundler.biconomy.io/api/v3/${baseSepolia.id}/${process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_API_KEY}`
        ),
        paymaster: createBicoPaymasterClient({
          paymasterUrl: `https://paymaster.biconomy.io/api/v2/${baseSepolia.id}/${process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY}`
        })
      })

      // スマートアカウントアドレスの取得
      const address = await nexusClient.account.address

      console.log("Nexus Account:", address)
      console.log("Biconomy account initialized successfully")

      setAccountState({
        nexusAccount: nexusClient,
        address: embeddedWallet.address,
        isLoading: false,
        error: null
      })

      return { nexusClient, address }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setAccountState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }, [embeddedWallet])

  /**
   * トランザクションを送信する（汎用メソッド）
   *
   * @param to トランザクション送信先アドレス
   * @param data トランザクションデータ（encodeFunctionDataで生成）
   * @returns トランザクションハッシュ
   * @throws スマートアカウントが初期化されていない場合、またはトランザクション送信に失敗した場合
   */
  const sendTransaction = useCallback(
    async (
      to: Address,
      data: Hex,
      nexusClient?: NexusClient,
      gasLimits?: { callGasLimit?: bigint; verificationGasLimit?: bigint }
    ): Promise<string | null> => {
      try {
        // 引数で渡されたnexusClientを優先、なければ内部状態を使用
        const clientToUse = nexusClient || accountState.nexusAccount

        if (!clientToUse) {
          throw new Error("Smart account is not initialized. Call initializeBiconomyAccount first.")
        }

        console.log("Sending transaction to:", to)
        console.log("Transaction data:", data)
        console.log("Gas limits:", gasLimits)

        // トランザクションを送信
        // デフォルトはZK証明検証用の高いガス制限、オプションで上書き可能
        const hash = await clientToUse.sendTransaction({
          to,
          data,
          chain: baseSepolia,
          callGasLimit: gasLimits?.callGasLimit ?? BigInt(1000000),
          verificationGasLimit: gasLimits?.verificationGasLimit ?? BigInt(500000)
        })

        console.log("Transaction hash:", hash)
        console.log("Check transaction:", getBlockExplorerUrl(baseSepolia.id, hash))

        return hash
      } catch (error) {
        console.error("Error sending transaction:", error)
        throw error
      }
    },
    [accountState.nexusAccount]
  )

  return {
    // アカウント状態
    smartAccount: accountState.nexusAccount,
    address: accountState.address,
    isLoading: accountState.isLoading,
    error: accountState.error,

    // メソッド
    initializeBiconomyAccount,
    sendTransaction
  }
}
