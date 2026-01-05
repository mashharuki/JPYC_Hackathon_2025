"use client"

import { Button, Input, Spinner } from "@/components/ui"
import { useCaseContext } from "@/context/CaseContext"
import useJPYCBalance from "@/hooks/useJPYCBalance"
import useMultiSigWallet from "@/hooks/useMultiSigWallet"
import { zodResolver } from "@hookform/resolvers/zod"
import { formatEther, parseEther } from "ethers"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type WithdrawalFormValues = {
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

/**
 * WithdrawalFormコンポーネント:
 * 寄付金の引き出しを行うためのフォームを提供します。
 * ホワイトリストに登録されたアドレスのみが実行可能です。
 *
 * @param caseId - 引き出し対象のケースID
 * @param walletAddress - ケースに関連付けられたMultiSigウォレットのアドレス
 */
export default function WithdrawalForm({ caseId, walletAddress }: { caseId: string; walletAddress: `0x${string}` }) {
  const { requestWithdrawal, transactionStatus, error } = useCaseContext()
  const { isWhitelisted, getConnectedAddress } = useMultiSigWallet()
  const [connectedAddress, setConnectedAddress] = useState<`0x${string}` | null>(null)
  const [whitelisted, setWhitelisted] = useState<boolean | null>(null)

  // JPYC残高の取得
  const { jpycBalance, isLoading: balanceLoading } = useJPYCBalance(walletAddress)

  // 接続中のウォレットアドレスを取得
  useEffect(() => {
    getConnectedAddress()
      .then((address) => setConnectedAddress(address))
      .catch(() => setConnectedAddress(null))
  }, [getConnectedAddress])

  // ホワイトリスト登録状況の確認
  useEffect(() => {
    if (!connectedAddress) return
    isWhitelisted(walletAddress, connectedAddress)
      .then((value) => setWhitelisted(value))
      .catch(() => setWhitelisted(false))
  }, [connectedAddress, isWhitelisted, walletAddress])

  // バリデーションスキーマの定義
  const schema = useMemo(() => {
    return z
      .object({
        amount: z.string().regex(/^\d+(\.\d+)?$/, { message: "引き出し額は数値で入力してください" })
      })
      .superRefine((values, ctx) => {
        const amount = parseAmount(values.amount)
        if (amount <= 0n) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "引き出し額は0より大きい値を入力してください",
            path: ["amount"]
          })
        }
        if (jpycBalance !== undefined && amount > jpycBalance) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "MultiSig Wallet の残高が不足しています",
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
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" }
  })

  // フォーム送信時の処理
  const onSubmit = handleSubmit(async (values) => {
    if (whitelisted === false) {
      return
    }
    const amount = parseAmount(values.amount)
    await requestWithdrawal(caseId, amount)
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
          <h3 className="text-lg font-semibold text-slate-100">引き出し</h3>
          <p className="text-sm text-slate-400">ホワイトリスト済みの受取人のみ実行できます。</p>
        </div>
        {balanceLoading ? (
          <Spinner size="sm" />
        ) : (
          <div className="text-right text-xs text-slate-400">
            Wallet残高: {jpycBalance !== undefined ? Number(formatEther(jpycBalance)).toLocaleString() : "-"}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300" htmlFor="withdrawal-amount">
          引き出し額（JPYC）
        </label>
        <Input id="withdrawal-amount" placeholder="例: 50000" {...register("amount")} className="bg-slate-950/60" />
        {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
      </div>

      {whitelisted === false && (
        <p className="text-xs text-red-400">受取人が未登録です。管理者にホワイトリスト登録を依頼してください。</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>ステータス: {statusLabel}</span>
        {transactionStatus === "pending" && <span>トランザクション送信中...</span>}
      </div>

      {error && <p className="text-xs text-red-400">エラー: {error.message}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting || whitelisted === false}>
        引き出しを送信
      </Button>
    </form>
  )
}
