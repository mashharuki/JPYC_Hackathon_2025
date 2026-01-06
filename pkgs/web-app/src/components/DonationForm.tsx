"use client"

import { Button, Input, Spinner } from "@/components/ui"
import { useCaseContext } from "@/context/CaseContext"
import { useBiconomy } from "@/hooks/useBiconomy"
import useJPYCBalance from "@/hooks/useJPYCBalance"
import { zodResolver } from "@hookform/resolvers/zod"
import { useWallets } from "@privy-io/react-auth"
import { formatEther, parseEther } from "ethers"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type DonationFormValues = {
  amount: string
}

/**
 * 入力値をBigInt (Wei単位) に変換するヘルパー関数
 */
const parseAmount = (value: string) => {
  try {
    return parseEther(value)
  } catch (e) {
    return 0n
  }
}

const formatAddress = (address: `0x${string}`) => `${address.slice(0, 6)}...${address.slice(-4)}`

/**
 * DonationFormコンポーネント:
 * JPYCによる寄付を行うためのフォームを提供します。
 *
 * @param caseId - 寄付対象のケースID
 */
export default function DonationForm({ caseId }: { caseId: string }) {
  const { submitDonation, transactionStatus, error } = useCaseContext()
  const { wallets } = useWallets()
  const { initializeBiconomyAccount } = useBiconomy()
  const [smartAccountAddress, setSmartAccountAddress] = useState<`0x${string}` | null>(null)
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle")
  const copyResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Privyの埋め込みウォレットアドレスを取得
  const walletAddress = (wallets?.[0]?.address as `0x${string}`) ?? null

  // JPYC残高の取得
  const { jpycBalance, isLoading: balanceLoading } = useJPYCBalance(
    smartAccountAddress ?? "0x0000000000000000000000000000000000000000"
  )

  useEffect(() => {
    if (!walletAddress || smartAccountAddress) return

    const fetchSmartAccountAddress = async () => {
      try {
        const { address } = await initializeBiconomyAccount()
        setSmartAccountAddress(address as `0x${string}`)
      } catch (initError) {
        console.error("Failed to initialize smart account:", initError)
      }
    }

    fetchSmartAccountAddress()
  }, [initializeBiconomyAccount, smartAccountAddress, walletAddress])

  useEffect(() => {
    return () => {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current)
      }
    }
  }, [])

  const handleCopyAddress = async () => {
    if (!smartAccountAddress) return
    try {
      await navigator.clipboard.writeText(smartAccountAddress)
      setCopyStatus("copied")
    } catch (copyError) {
      console.error("Failed to copy smart account address:", copyError)
      setCopyStatus("failed")
    }
    if (copyResetTimeout.current) {
      clearTimeout(copyResetTimeout.current)
    }
    copyResetTimeout.current = setTimeout(() => setCopyStatus("idle"), 2000)
  }

  // バリデーションスキーマの定義
  const schema = useMemo(() => {
    return z
      .object({
        amount: z.string().regex(/^\d+(\.\d+)?$/, { message: "寄付額は数値で入力してください" })
      })
      .superRefine((values, ctx) => {
        const amount = parseAmount(values.amount)
        if (amount <= 0n) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "寄付額は0より大きい値を入力してください",
            path: ["amount"]
          })
        }
        if (jpycBalance !== undefined && amount > jpycBalance) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "JPYC残高が不足しています",
            path: ["amount"]
          })
        }
      })
  }, [jpycBalance])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<DonationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" }
  })

  // フォーム送信時の処理
  const onSubmit = handleSubmit(async (values) => {
    const amount = parseAmount(values.amount)
    await submitDonation(caseId, amount)
    reset()
  })

  const statusLabel = {
    idle: "待機中",
    pending: "送信中",
    success: "送信成功",
    failed: "送信失敗"
  }[transactionStatus]

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">寄付する</h3>
          <p className="text-sm text-slate-400">JPYCで支援金を送ります。</p>
        </div>
        {balanceLoading ? (
          <Spinner size="sm" />
        ) : (
          <div className="space-y-2 text-right text-xs text-slate-400">
            <div className="flex items-center justify-end gap-2">
              <span>スマートアカウント:</span>
              <span className="font-mono text-slate-200" title={smartAccountAddress ?? undefined}>
                {smartAccountAddress ? formatAddress(smartAccountAddress) : "-"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-300 hover:text-slate-100"
                onClick={handleCopyAddress}
                disabled={!smartAccountAddress}
              >
                {copyStatus === "copied" ? "コピー済み" : copyStatus === "failed" ? "再試行" : "コピー"}
              </Button>
            </div>
            <div>
              スマートアカウント JPYC残高:{" "}
              {smartAccountAddress && jpycBalance !== undefined
                ? Number(formatEther(jpycBalance)).toLocaleString()
                : "-"}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300" htmlFor="donation-amount">
          寄付額（JPYC）
        </label>
        <Input id="donation-amount" placeholder="例: 100000" {...register("amount")} className="bg-slate-950/60" />
        {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>ステータス: {statusLabel}</span>
        {transactionStatus === "pending" && <span>Proof生成中...</span>}
      </div>

      {error && <p className="text-xs text-red-400">エラー: {error.message}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        寄付を送信
      </Button>
    </form>
  )
}
