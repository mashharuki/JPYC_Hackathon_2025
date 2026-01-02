"use client"

import { AuthProvider } from "@/context/AuthContext"
import { LogContextProvider } from "@/context/LogContext"
import { SemaphoreContextProvider } from "@/context/SemaphoreContext"
import { PrivyProvider } from "@/providers/privy-provider"
import { ToasterProvider } from "@/providers/toaster-provider"
import { ReactNode } from "react"

interface AppProvidersProps {
  children: ReactNode
}

/**
 * AppProviders: 全てのContextプロバイダーをまとめるクライアントコンポーネント
 * layout.tsxはサーバーコンポーネントとして保持し、プロバイダーはこのコンポーネントで管理する
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <PrivyProvider>
      <AuthProvider>
        <SemaphoreContextProvider>
          <LogContextProvider>
            <ToasterProvider>{children}</ToasterProvider>
          </LogContextProvider>
        </SemaphoreContextProvider>
      </AuthProvider>
    </PrivyProvider>
  )
}
