"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export type CaseRecord = {
  id: string
  title: string
  description: string
  goal_amount: string | number
  current_amount: string | number
  wallet_address: string
  semaphore_group_id: string
  created_at: string
  updated_at?: string | null
}

type SortKey = "newest" | "progress" | "amount"

const toBigInt = (value: string | number) => {
  if (typeof value === "number") {
    return BigInt(Math.trunc(value))
  }
  return BigInt(value)
}

const formatNumberString = (value: bigint) => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const calculateProgress = (current: bigint, goal: bigint) => {
  if (goal === 0n) return 0
  const progress = Number((current * 10000n) / goal) / 100
  return Math.min(100, Math.max(0, progress))
}

export default function CaseDashboardClient({ cases }: { cases: CaseRecord[] }) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("newest")

  const visibleCases = useMemo(() => {
    const filtered = cases.filter((item) => {
      const target = `${item.title} ${item.description}`.toLowerCase()
      return target.includes(query.toLowerCase())
    })

    return filtered.sort((a, b) => {
      if (sortKey === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortKey === "amount") {
        const aGoal = toBigInt(a.goal_amount)
        const bGoal = toBigInt(b.goal_amount)
        return Number(bGoal - aGoal)
      }
      const aProgress = calculateProgress(toBigInt(a.current_amount), toBigInt(a.goal_amount))
      const bProgress = calculateProgress(toBigInt(b.current_amount), toBigInt(b.goal_amount))
      return bProgress - aProgress
    })
  }, [cases, query, sortKey])

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-950/80 via-slate-900/40 to-blue-900/20 p-5 shadow-[0_0_40px_rgba(37,49,131,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Cases</p>
            <h2 className="text-3xl font-semibold text-slate-100">支援ケースダッシュボード</h2>
            <p className="mt-2 text-sm text-slate-300">進捗率・目標金額・最新状況をリアルタイムに確認できます。</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Sort</span>
            <select
              className="rounded-full border border-slate-700/80 bg-slate-950/60 px-4 py-2 text-sm text-slate-100"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="newest">Newest</option>
              <option value="progress">Progress</option>
              <option value="amount">Goal Amount</option>
            </select>
          </div>
        </div>
        <Input
          placeholder="タイトルや概要で検索..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="bg-slate-950/60"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleCases.map((item) => {
          const goalAmount = toBigInt(item.goal_amount)
          const currentAmount = toBigInt(item.current_amount)
          const progress = calculateProgress(currentAmount, goalAmount)

          return (
            <Card key={item.id} className="border-slate-800/70 bg-slate-950/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-100">{item.title}</CardTitle>
                <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between text-sm text-slate-400">
                  <span>現在</span>
                  <span className="text-lg font-semibold text-slate-100">{formatNumberString(currentAmount)} JPYC</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>目標 {formatNumberString(goalAmount)} JPYC</span>
                  <span>{progress.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Group: {item.semaphore_group_id}</span>
                  <Link className="text-blue-300 hover:text-blue-200" href={`/cases/${item.id}`}>
                    詳細を見る →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {visibleCases.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700/70 p-8 text-center text-slate-400">
          条件に一致するケースが見つかりませんでした。
        </div>
      )}
    </section>
  )
}
