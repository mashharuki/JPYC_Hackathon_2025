"use client"

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"
import { createPublicClient, hexToString, http, parseAbiItem } from "viem"
import { baseSepolia } from "viem/chains"

// SemaphoreContextType: コンテキストで共有されるデータの型定義
export type SemaphoreContextType = {
  _users: string[] // グループに参加しているユーザー（Identity Commitment）のリスト
  _feedback: string[] // 送信されたフィードバック（メッセージ）のリスト
  refreshUsers: () => Promise<string[]> // メンバーリストを最新の状態に更新し、更新されたリストを返す関数
  addUser: (user: string) => void // ローカルの状態にユーザーを一時的に追加する関数
  refreshFeedback: () => Promise<void> // フィードバックリストを最新の状態に更新する関数
  addFeedback: (feedback: string) => void // ローカルの状態にフィードバックを一時的に追加する関数
}

const SemaphoreContext = createContext<SemaphoreContextType | null>(null)

interface ProviderProps {
  children: ReactNode
}

/**
 * viem publicClient: ブロックチェーンデータを読み取るためのクライアント
 */
const getPublicClient = () => {
  const rpcUrl =
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "localhost"
      ? "http://127.0.0.1:8545"
      : `https://${process.env.NEXT_PUBLIC_DEFAULT_NETWORK}.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`

  return createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl)
  })
}

/**
 * SemaphoreContextProvider: コンテキストプロバイダー
 * @param children
 * @returns
 */
export const SemaphoreContextProvider: React.FC<ProviderProps> = ({ children }) => {
  const [_users, setUsers] = useState<any[]>([])
  const [_feedback, setFeedback] = useState<string[]>([])

  /**
   * refreshUsers: Semaphoreグループのメンバー一覧をコントラクトから取得します。
   * viemのgetLogsを使用してMemberAddedイベントからメンバーを取得します。
   */
  const refreshUsers = useCallback(async (): Promise<string[]> => {
    try {
      const publicClient = getPublicClient()

      // MemberAddedイベントのABI定義
      const memberAddedEvent = parseAbiItem(
        "event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)"
      )

      // MemberAddedイベントログを取得
      const logs = await publicClient.getLogs({
        address: process.env.NEXT_PUBLIC_SEMAPHORE_CONTRACT_ADDRESS as `0x${string}`,
        event: memberAddedEvent,
        args: {
          groupId: BigInt(process.env.NEXT_PUBLIC_GROUP_ID as string)
        },
        fromBlock: 0n,
        toBlock: "latest"
      })

      // identityCommitmentを抽出してstringに変換
      const members = logs
        .map((log) => {
          const { args } = log
          return args.identityCommitment?.toString() || ""
        })
        .filter(Boolean)

      setUsers(members)
      return members // 更新されたメンバーリストを返す
    } catch (error) {
      console.error("Error refreshing users:", error)
      throw error
    }
  }, [])

  /**
   * addUser: ローカルの状態にユーザーを一時的に追加する関数
   * @param user
   */
  const addUser = useCallback(
    (user: any) => {
      setUsers([..._users, user])
    },
    [_users]
  )

  /**
   * refreshFeedback: 検証済みの証明（フィードバック）の一覧をコントラクトから取得します。
   * viemのgetLogsを使用してProofValidatedイベントからフィードバックを取得します。
   */
  const refreshFeedback = useCallback(async (): Promise<void> => {
    try {
      const publicClient = getPublicClient()

      // ProofValidatedイベントのABI定義
      const proofValidatedEvent = parseAbiItem(
        "event ProofValidated(uint256 indexed groupId, uint256 merkleTreeDepth, uint256 indexed merkleTreeRoot, uint256 nullifier, uint256 message, uint256 indexed scope, uint256[8] points)"
      )

      // ProofValidatedイベントログを取得
      const logs = await publicClient.getLogs({
        address: process.env.NEXT_PUBLIC_SEMAPHORE_CONTRACT_ADDRESS as `0x${string}`,
        event: proofValidatedEvent,
        args: {
          groupId: BigInt(process.env.NEXT_PUBLIC_GROUP_ID as string)
        },
        fromBlock: 0n,
        toBlock: "latest"
      })

      console.log("Fetched ProofValidated logs:", logs)

      // messageフィールドをデコードしてフィードバック文字列として取得
      const feedbackMessages = logs
        .map((log) => {
          const { args } = log
          if (!args.message) {
            console.log("No message in log:", log)
            return ""
          }

          try {
            // messageをbytes32形式の16進数文字列に変換してデコード
            const messageHex = `0x${args.message.toString(16).padStart(64, "0")}` as `0x${string}`
            console.log("Message value:", args.message)
            console.log("Message hex:", messageHex)

            // hexToStringでデコード（null文字を除去）
            const decoded = hexToString(messageHex, { size: 32 }).replace(/\0/g, "")
            console.log("Decoded message:", decoded)

            return decoded
          } catch (error) {
            console.error("Error decoding message:", error, "for log:", log)
            return ""
          }
        })
        .filter(Boolean)

      console.log("All decoded feedback messages:", feedbackMessages)

      setFeedback(feedbackMessages)
    } catch (error) {
      console.error("Error refreshing feedback:", error)
      throw error
    }
  }, [])

  const addFeedback = useCallback(
    (feedback: string) => {
      setFeedback([..._feedback, feedback])
    },
    [_feedback]
  )

  /**
   * コンポーネントのマウント時にデータを初回取得します。
   */
  useEffect(() => {
    refreshUsers()
    refreshFeedback()
  }, [refreshFeedback, refreshUsers])

  return (
    <SemaphoreContext.Provider
      value={{
        _users,
        _feedback,
        refreshUsers,
        addUser,
        refreshFeedback,
        addFeedback
      }}
    >
      {children}
    </SemaphoreContext.Provider>
  )
}

/**
 * useSemaphoreContext: どこからでもコンテキストのデータにアクセスできるようにするカスタムフック
 */
export const useSemaphoreContext = () => {
  const context = useContext(SemaphoreContext)
  if (context === null) {
    throw new Error("SemaphoreContext must be used within a SemaphoreContextProvider")
  }
  return context
}
