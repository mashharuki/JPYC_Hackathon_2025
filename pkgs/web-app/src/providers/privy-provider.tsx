"use client"

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth"
import { baseSepolia } from "viem/chains"
import { useEffect, useState } from "react"

interface PrivyProviderProps {
  children: React.ReactNode
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (!appId) {
      console.error("NEXT_PUBLIC_PRIVY_APP_ID is not set. Please check your environment variables.")
    }
  }, [appId])

  // サーバーサイドレンダリング時は子要素のみ返す
  if (!isClient || !appId) {
    return <>{children}</>
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        // ログイン方法の設定
        loginMethods: ["email", "wallet", "google"],
        // サポートするチェーンの設定
        supportedChains: [baseSepolia],
        // デフォルトチェーン
        defaultChain: baseSepolia,
        // 外観設定
        appearance: {
          theme: "dark",
          accentColor: "#4771ea"
        }
      }}
    >
      {children}
    </PrivyProviderBase>
  )
}
