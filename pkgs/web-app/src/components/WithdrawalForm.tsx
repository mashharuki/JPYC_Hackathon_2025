"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button, Input, Spinner } from "@/components/ui"
import { useCaseContext } from "@/context/CaseContext"
import useMultiSigWallet from "@/hooks/useMultiSigWallet"
import useJPYCBalance from "@/hooks/useJPYCBalance"

type WithdrawalFormValues = {
  amount: string
}

const parseAmount = (value: string) => {
  return BigInt(value)
}

export default function WithdrawalForm({ caseId, walletAddress }: { caseId: string; walletAddress: `0x${string}` }) {
  const { requestWithdrawal, transactionStatus, error } = useCaseContext()
  const { isWhitelisted, getConnectedAddress } = useMultiSigWallet()
  const [connectedAddress, setConnectedAddress] = useState<`0x${string}` | null>(null)
  const [whitelisted, setWhitelisted] = useState<boolean | null>(null)

  const { jpycBalance, isLoading: balanceLoading } = useJPYCBalance(walletAddress)

  useEffect(() => {
    getConnectedAddress()
      .then((address) => setConnectedAddress(address))
      .catch(() => setConnectedAddress(null))
  }, [getConnectedAddress])

  useEffect(() => {
    if (!connectedAddress) return
    isWhitelisted(walletAddress, connectedAddress)
      .then((value) => setWhitelisted(value))
      .catch(() => setWhitelisted(false))
  }, [connectedAddress, isWhitelisted, walletAddress])

  const schema = useMemo(() => {
    return z
      .object({
        amount: z.string().regex(/^\d+$/, { message: "引き出し額は数値で入力してください" })
      })
      .superRefine((values, ctx) => {
        const amount = parseAmount(values.amount)
        if (amount <= 0n) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "引き出し額は1以上で入力してください",
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
            Wallet残高: {jpycBalance !== undefined ? jpycBalance.toString() : "-"}
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
