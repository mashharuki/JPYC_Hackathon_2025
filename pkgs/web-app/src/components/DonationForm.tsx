"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button, Input, Spinner } from "@/components/ui"
import { useCaseContext } from "@/context/CaseContext"
import useJPYCBalance from "@/hooks/useJPYCBalance"
import useMultiSigWallet from "@/hooks/useMultiSigWallet"

type DonationFormValues = {
  amount: string
}

const parseAmount = (value: string) => {
  return BigInt(value)
}

export default function DonationForm({ caseId }: { caseId: string }) {
  const { submitDonation, transactionStatus, error } = useCaseContext()
  const { getConnectedAddress } = useMultiSigWallet()
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(null)

  const { jpycBalance, isLoading: balanceLoading } = useJPYCBalance(
    walletAddress ?? "0x0000000000000000000000000000000000000000"
  )

  useEffect(() => {
    getConnectedAddress()
      .then((address) => setWalletAddress(address))
      .catch(() => {
        setWalletAddress(null)
      })
  }, [getConnectedAddress])

  const schema = useMemo(() => {
    return z
      .object({
        amount: z.string().regex(/^\d+$/, { message: "寄付額は数値で入力してください" })
      })
      .superRefine((values, ctx) => {
        const amount = parseAmount(values.amount)
        if (amount <= 0n) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "寄付額は1以上で入力してください",
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
          <div className="text-right text-xs text-slate-400">
            JPYC残高: {jpycBalance !== undefined ? jpycBalance.toString() : "-"}
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
