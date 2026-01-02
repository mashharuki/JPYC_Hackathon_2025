"use client"

import { useEffect } from "react"

export const dynamic = "force-dynamic"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * カスタムエラーページ
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // エラーをログに記録
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-gray-400">{error.message || "An unexpected error occurred."}</p>
      <button className="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  )
}
