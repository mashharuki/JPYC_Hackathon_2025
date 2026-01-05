"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatEther } from "ethers"
import Link from "next/link"
import { useMemo, useState } from "react"

// Inline Icons to avoid dependency issues
const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)
const SlidersHorizontalIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="21" x2="14" y1="4" y2="4" />
    <line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" />
    <line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" />
    <line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="16" x2="16" y1="18" y2="22" />
  </svg>
)
const ArrowUpRightIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
)
const WalletIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </svg>
)
const TargetIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

/**
 * ケース情報の型定義
 */
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

/**
 * 値をBigIntに変換するヘルパー関数
 */
const toBigInt = (value: string | number) => {
  if (typeof value === "number") {
    return BigInt(Math.trunc(value))
  }
  return BigInt(value)
}

/**
 * 数値をフォーマットするヘルパー関数 (Ether単位、カンマ区切り)
 */
const formatNumberString = (value: bigint) => {
  return Number(formatEther(value)).toLocaleString()
}

/**
 * 進捗率を計算するヘルパー関数
 */
const calculateProgress = (current: bigint, goal: bigint) => {
  if (goal === 0n) return 0
  const progress = Number((current * 10000n) / goal) / 100
  return Math.min(100, Math.max(0, progress))
}

/**
 * CaseDashboardClientコンポーネント:
 * ケース一覧を表示し、検索・ソート・フィルタリング機能を提供します。
 *
 * @param cases - 表示するケース情報の配列
 */
export default function CaseDashboardClient({ cases }: { cases: CaseRecord[] }) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("newest")
  const [showAll, setShowAll] = useState(false)

  // フィルタリングとソートロジック
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

  // 表示するケースの制御 (デフォルトは2件、showAllで全件)
  const displayedCases = showAll ? visibleCases : visibleCases.slice(0, 2)

  return (
    <section className="space-y-8">
      {/* Hero / Header Section */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 opacity-50" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300">Innocence Ledger</p>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Support Cases
              </span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-slate-400">
              冤罪被害者支援のためのオンチェーン・プラットフォーム。
              <br className="hidden sm:block" />
              透明性と匿名性を両立し、確実な支援を届けます。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="group relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" />
              <Input
                placeholder="Search cases..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 w-full min-w-[240px] rounded-xl border-white/10 bg-slate-950/50 pl-10 text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-slate-950/80 focus:ring-blue-500/20"
              />
            </div>
            <div className="relative">
              <SlidersHorizontalIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <select
                className="h-11 appearance-none rounded-xl border border-white/10 bg-slate-950/50 pl-10 pr-8 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
              >
                <option value="newest">Newest</option>
                <option value="progress">Progress</option>
                <option value="amount">Goal Amount</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedCases.map((item, index) => {
          const goalAmount = toBigInt(item.goal_amount)
          const currentAmount = toBigInt(item.current_amount)
          const progress = calculateProgress(currentAmount, goalAmount)

          return (
            <Link href={`/cases/${item.id}`} key={item.id} className="group block h-full">
              <Card className="relative h-full overflow-hidden rounded-2xl border-white/5 bg-slate-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-slate-900/60 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-blue-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <CardHeader className="relative space-y-3 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-400/80">Case #{item.id.slice(0, 6)}</p>
                      <CardTitle className="line-clamp-1 text-lg font-semibold tracking-tight text-slate-100 group-hover:text-blue-100">
                        {item.title}
                      </CardTitle>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors group-hover:border-blue-500/30 group-hover:bg-blue-500/10 group-hover:text-blue-400">
                      <ArrowUpRightIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-400 group-hover:text-slate-300">
                    {item.description}
                  </p>
                </CardHeader>

                <CardContent className="relative space-y-5">
                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <WalletIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Raised</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">{formatNumberString(currentAmount)}</span>
                        <span className="ml-1 text-xs font-medium text-slate-500">JPYC</span>
                      </div>
                    </div>

                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800/50">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000 ease-out group-hover:shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <TargetIcon className="h-3.5 w-3.5" />
                        <span>Goal: {formatNumberString(goalAmount)}</span>
                      </div>
                      <span className="font-medium text-blue-400">{progress.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-500">
                    <span className="truncate font-mono opacity-60">
                      Group: {item.semaphore_group_id.slice(0, 8)}...
                    </span>
                    <span className="font-medium text-slate-400 group-hover:text-blue-300">View Details</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {!showAll && visibleCases.length > 2 && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
            className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            View All Cases
          </Button>
        </div>
      )}

      {visibleCases.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
          <div className="mb-4 rounded-full bg-slate-900 p-4">
            <SearchIcon className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300">No cases found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}
    </section>
  )
}
