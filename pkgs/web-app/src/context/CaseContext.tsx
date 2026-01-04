"use client"

import { useBiconomy } from "@/hooks/useBiconomy"
import useMultiSigWallet from "@/hooks/useMultiSigWallet"
import useSemaphoreDonation from "@/hooks/useSemaphoreDonation"
import { CONTRACT_ADDRESSES } from "@/utils/web3/addresses"
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"

/**
 * Case 型定義: 支援ケースの情報を表す
 */
export interface Case {
  id: string
  title: string
  description: string
  goalAmount: bigint
  currentAmount: bigint
  walletAddress: `0x${string}`
  semaphoreGroupId: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * TransactionStatus 型定義: トランザクションの状態を表す
 */
export type TransactionStatus = "idle" | "pending" | "success" | "failed"

/**
 * CaseContextType: コンテキストで共有されるデータの型定義
 */
export type CaseContextType = {
  cases: Case[] // すべてのケース情報
  selectedCase: Case | null // 現在選択されているケース
  isLoading: boolean // データ読み込み中フラグ
  transactionStatus: TransactionStatus // トランザクション状態
  error: Error | null // エラー状態
  selectCase: (caseId: string | null) => void // ケースを選択する関数
  refreshCases: () => Promise<void> // ケース一覧を再取得する関数
  submitDonation: (caseId: string, amount: bigint) => Promise<`0x${string}`>
  requestWithdrawal: (caseId: string, amount: bigint) => Promise<`0x${string}`>
}

const CaseContext = createContext<CaseContextType | null>(null)

interface ProviderProps {
  children: ReactNode
}

/**
 * CaseContextProvider: ケース管理のコンテキストプロバイダー
 * @param children - 子コンポーネント
 * @returns Context Provider
 */
export const CaseContextProvider: React.FC<ProviderProps> = ({ children }) => {
  const [cases, setCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>("idle")
  const [error, setError] = useState<Error | null>(null)
  const { donateWithProof } = useSemaphoreDonation()
  const { withdraw, getConnectedAddress } = useMultiSigWallet()
  const { initializeBiconomyAccount, sendTransaction } = useBiconomy()

  const donationContractAddress = CONTRACT_ADDRESSES[84532].SemaphoreDonation as `0x${string}`

  const mapCase = useCallback((rawCase: any): Case => {
    return {
      id: rawCase.id,
      title: rawCase.title,
      description: rawCase.description,
      goalAmount: BigInt(rawCase.goal_amount),
      currentAmount: BigInt(rawCase.current_amount),
      walletAddress: rawCase.wallet_address as `0x${string}`,
      semaphoreGroupId: rawCase.semaphore_group_id,
      createdAt: new Date(rawCase.created_at),
      updatedAt: rawCase.updated_at ? new Date(rawCase.updated_at) : undefined
    }
  }, [])

  /**
   * fetchCases: Next.js API Routes からケースデータを取得
   */
  const fetchCases = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/cases")

      if (!response.ok) {
        throw new Error(`Failed to fetch cases: ${response.statusText}`)
      }

      const data = await response.json()

      // API レスポンスを Case 型に変換（bigint 変換を含む）
      const parsedCases: Case[] = data.cases.map((rawCase: any) => mapCase(rawCase))

      setCases(parsedCases)
      setIsLoading(false)
    } catch (err) {
      const error = err as Error
      setError(error)
      setIsLoading(false)
      // Don't rethrow - just set error state
    }
  }, [mapCase])

  /**
   * selectCase: ケース ID を指定してケースを選択
   * @param caseId - 選択するケースの ID（null で選択解除）
   */
  const selectCase = useCallback(
    (caseId: string | null) => {
      if (caseId === null) {
        setSelectedCase(null)
        return
      }

      const caseToSelect = cases.find((c) => c.id === caseId)
      if (caseToSelect) {
        setSelectedCase(caseToSelect)
      }
    },
    [cases]
  )

  /**
   * refreshCases: ケース一覧を再取得
   */
  const refreshCases = useCallback(async () => {
    await fetchCases()
  }, [fetchCases])

  const submitDonation = useCallback(
    async (caseId: string, amount: bigint): Promise<`0x${string}`> => {
      const targetCase = cases.find((c) => c.id === caseId)
      if (!targetCase) {
        throw new Error("Case not found")
      }

      try {
        setTransactionStatus("pending")
        setError(null)

        let txHash: `0x${string}`

        try {
          const { nexusClient } = await initializeBiconomyAccount()
          txHash = await donateWithProof(donationContractAddress, targetCase.walletAddress, amount, {
            sendTransaction,
            nexusClient
          })
        } catch (gaslessError) {
          txHash = await donateWithProof(donationContractAddress, targetCase.walletAddress, amount)
        }

        const newAmount = (targetCase.currentAmount + amount).toString()
        const response = await fetch(`/api/cases/${caseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentAmount: newAmount })
        })

        if (!response.ok) {
          throw new Error(`Failed to update case amount: ${response.statusText}`)
        }

        const updated = await response.json()
        const updatedCase = mapCase(updated)
        setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)))
        if (selectedCase?.id === updatedCase.id) {
          setSelectedCase(updatedCase)
        }

        setTransactionStatus("success")
        return txHash
      } catch (err) {
        const error = err as Error
        setError(error)
        setTransactionStatus("failed")
        throw error
      }
    },
    [cases, donateWithProof, donationContractAddress, initializeBiconomyAccount, mapCase, selectedCase, sendTransaction]
  )

  const requestWithdrawal = useCallback(
    async (caseId: string, amount: bigint): Promise<`0x${string}`> => {
      const targetCase = cases.find((c) => c.id === caseId)
      if (!targetCase) {
        throw new Error("Case not found")
      }

      try {
        setTransactionStatus("pending")
        setError(null)

        const recipientAddress = await getConnectedAddress()
        const txHash = await withdraw(targetCase.walletAddress, recipientAddress, amount)

        setTransactionStatus("success")
        return txHash
      } catch (err) {
        const error = err as Error
        setError(error)
        setTransactionStatus("failed")
        throw error
      }
    },
    [cases, getConnectedAddress, withdraw]
  )

  /**
   * コンポーネントのマウント時にケースデータを初回取得
   */
  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  return (
    <CaseContext.Provider
      value={{
        cases,
        selectedCase,
        isLoading,
        transactionStatus,
        error,
        selectCase,
        refreshCases,
        submitDonation,
        requestWithdrawal
      }}
    >
      {children}
    </CaseContext.Provider>
  )
}

/**
 * useCaseContext: どこからでもコンテキストのデータにアクセスできるようにするカスタムフック
 * @throws {Error} プロバイダー外で使用された場合
 */
export const useCaseContext = () => {
  const context = useContext(CaseContext)
  if (context === null) {
    throw new Error("CaseContext must be used within a CaseContextProvider")
  }
  return context
}
