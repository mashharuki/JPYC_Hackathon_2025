"use client"

import { Toaster } from "react-hot-toast"

interface ToasterProviderProps {
  children: React.ReactNode
}

/**
 * ToasterProvider - react-hot-toastのToasterコンポーネントをアプリケーションに統合
 *
 * @description
 * このプロバイダーは、アプリケーション全体でトースト通知を表示するために
 * react-hot-toastのToasterコンポーネントをレンダリングします。
 *
 * @param children - 子コンポーネント
 *
 * @example
 * ```tsx
 * import { ToasterProvider } from '@/providers/toaster-provider'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ToasterProvider>
 *           {children}
 *         </ToasterProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * Requirements: 6.3
 */
export function ToasterProvider({ children }: ToasterProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        reverseOrder={false}
        toastOptions={{
          // デフォルトスタイル
          duration: 4000,
          style: {
            background: "#1F2937",
            color: "#F9FAFB",
            border: "1px solid #374151",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            padding: "0.75rem 1rem"
          },
          // 成功時のスタイル
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#F9FAFB"
            }
          },
          // エラー時のスタイル
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#F9FAFB"
            },
            duration: 5000
          },
          // ローディング時のスタイル
          loading: {
            iconTheme: {
              primary: "#3B82F6",
              secondary: "#F9FAFB"
            }
          }
        }}
      />
    </>
  )
}
