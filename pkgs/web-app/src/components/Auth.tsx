"use client"

import { Button } from "@/components/ui"
import { usePrivy } from "@privy-io/react-auth"

/**
 * Authコンポーネント:
 * Privy認証によるログイン機能を提供します。
 */
export default function Auth() {
  const { login, ready } = usePrivy()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Login with Privy</h3>
      <p className="text-sm text-slate-300">
        メール、ウォレット、またはGoogleアカウントを使用してログインし、Semaphoreアイデンティティを管理します。
      </p>

      <Button onClick={login} disabled={!ready} className="w-full" aria-label="Login with Privy" aria-busy={!ready}>
        {!ready ? "Loading..." : "Login with Privy"}
      </Button>
    </div>
  )
}
