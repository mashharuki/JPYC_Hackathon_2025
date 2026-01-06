"use client"

import DonationForm from "@/components/DonationForm"
import { Spinner } from "@/components/ui"
import WithdrawalForm from "@/components/WithdrawalForm"
import { CaseContextProvider, useCaseContext } from "@/context/CaseContext"
import { formatEther } from "ethers"
import { useEffect, useMemo } from "react"

/**
 * 金額をフォーマットするヘルパー関数
 */
const formatNumberString = (value: string) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

const formatAmount = (value: bigint) => {
  const formatted = formatEther(value)
  const [whole, fraction] = formatted.split(".")
  const wholeWithCommas = formatNumberString(whole)

  if (!fraction || /^0+$/.test(fraction)) {
    return wholeWithCommas
  }

  const trimmedFraction = fraction.replace(/0+$/, "").slice(0, 6)
  return trimmedFraction ? `${wholeWithCommas}.${trimmedFraction}` : wholeWithCommas
}

/**
 * CaseActionPanelコンポーネント:
 * 選択されたケースに対するアクション（寄付、引き出し）を表示します。
 */
function CaseActionPanel() {
  const { cases, selectedCase, selectCase, isLoading, error } = useCaseContext()

  // 初期表示時に最初のケースを選択
  useEffect(() => {
    if (!selectedCase && cases.length > 0) {
      selectCase(cases[0].id)
    }
  }, [cases, selectCase, selectedCase])

  // 選択されたケースのサマリー情報
  const summary = useMemo(() => {
    if (!selectedCase) return null
    return {
      id: selectedCase.id,
      title: selectedCase.title,
      current: formatAmount(selectedCase.currentAmount),
      goal: formatAmount(selectedCase.goalAmount)
    }
  }, [selectedCase])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-6 text-sm text-slate-400">
        <Spinner size="sm" />
        ケース情報を読み込み中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-slate-950/60 p-6 text-sm text-red-200">
        ケース情報の取得に失敗しました。再読み込みしてください。
      </div>
    )
  }

  if (!selectedCase) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700/60 p-6 text-sm text-slate-400">
        ケースがまだ登録されていません。
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Case</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">{summary?.title}</h3>
            <p className="text-xs text-slate-400">
              現在 {summary?.current} / 目標 {summary?.goal} JPYC
            </p>
          </div>
          <select
            className="rounded-full border border-slate-700/80 bg-slate-950/60 px-4 py-2 text-sm text-slate-100"
            value={selectedCase.id}
            onChange={(event) => selectCase(event.target.value)}
          >
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DonationForm caseId={selectedCase.id} />
        <WithdrawalForm caseId={selectedCase.id} walletAddress={selectedCase.walletAddress} />
      </div>
    </section>
  )
}

/**
 * HomeClientコンポーネント:
 * ホームページのクライアントサイドロジックを管理します。
 * CaseContextProviderでラップし、ケース関連の状態管理を提供します。
 */
export default function HomeClient() {
  return (
    <CaseContextProvider>
      <CaseActionPanel />
    </CaseContextProvider>
  )
}
