"use client"

import { Button, Spinner } from "@/components/ui"
import useJPYCBalance from "@/hooks/useJPYCBalance"
import { formatUnits } from "viem"

const formatTokenAmount = (amount: bigint, decimals = 18, fractionDigits = 2) => {
  const raw = formatUnits(amount, decimals)
  const [integerPart, fractionPart = ""] = raw.split(".")
  const trimmedFraction = fractionPart.padEnd(fractionDigits, "0").slice(0, fractionDigits)
  const normalizedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `${normalizedInteger}.${trimmedFraction}`
}

export default function BalanceDisplay({ address, label }: { address: `0x${string}`; label?: string }) {
  const { ethBalance, jpycBalance, refetch, isLoading, error } = useJPYCBalance(address)

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-slate-950/60 p-4 text-sm text-red-200">
        <p className="mb-3">残高の取得に失敗しました。再試行してください。</p>
        <Button type="button" variant="outline" size="sm" onClick={refetch}>
          再試行
        </Button>
      </div>
    )
  }

  if (isLoading || ethBalance === undefined || jpycBalance === undefined) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4 text-sm text-slate-400">
        <Spinner size="sm" />
        残高を取得中...
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4">
      {label && <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>}
      <div className="mt-2 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">ETH</p>
          <p className="text-lg font-semibold">{formatTokenAmount(ethBalance, 18, 4)} ETH</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">JPYC</p>
          <p className="text-lg font-semibold">{formatTokenAmount(jpycBalance, 18, 2)} JPYC</p>
        </div>
      </div>
    </div>
  )
}
