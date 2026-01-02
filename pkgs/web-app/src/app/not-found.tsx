"use client"

import Link from "next/link"

export const dynamic = "force-dynamic"

/**
 * カスタム404ページ
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <p className="text-gray-400">The page you are looking for does not exist.</p>
      <Link href="/" className="button">
        Go Home
      </Link>
    </div>
  )
}
