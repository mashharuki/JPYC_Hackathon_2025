"use client"

import { usePrivy } from "@privy-io/react-auth"
import { createContext, ReactNode, useContext } from "react"

/**
 * AuthContextType: 認証コンテキストの型定義(Privy対応)。
 */
interface AuthContextType {
  user: any | null // Privy User型
  ready: boolean
  authenticated: boolean
  login: () => void
  logout: () => Promise<void>
}

// 認証状態を共有するためのコンテキスト
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider:
 * Privyの認証状態(ユーザー、セッション)を管理し、子コンポーネントに提供するプロバイダー。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, ready, authenticated, login, logout } = usePrivy()

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        authenticated,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth: 認証状態にアクセスするためのカスタムフック。
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
