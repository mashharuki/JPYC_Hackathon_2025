import PageContainer from "@/components/PageContainer"
import { AppProviders } from "@/providers/app-providers"
import type { Metadata } from "next"
import "./globals.css"

// Privy and other client-only providers require client-side rendering
export const dynamic = "force-dynamic"

import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })

/**
 * metadata: ページのメタデータ
 */
export const metadata: Metadata = {
  title: "Semaphore Demo",
  description: "A zero-knowledge protocol for anonymous signaling on Ethereum.",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  metadataBase: new URL("https://demo.semaphore.pse.dev"),
  openGraph: {
    type: "website",
    url: "https://demo.semaphore.pse.dev",
    title: "Semaphore Demo",
    description: "A zero-knowledge protocol for anonymous signaling on Ethereum.",
    siteName: "Semaphore Demo",
    images: [
      {
        url: "https://demo.semaphore.pse.dev/social-media.png"
      }
    ]
  },
  twitter: { card: "summary_large_image", images: "https://demo.semaphore.pse.dev/social-media.png" }
}

/**
 * ルートレイアウトコンポーネント
 * @param param0
 * @returns
 */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link rel="preconnect" href="https://fonts.gstatic.com"></link>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet"></link>
      </head>
      <body suppressHydrationWarning className={inter.className}>
        <AppProviders>
          <PageContainer>{children}</PageContainer>
        </AppProviders>
      </body>
    </html>
  )
}
