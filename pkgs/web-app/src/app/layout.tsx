import PageContainer from "@/components/PageContainer"
import { AppProviders } from "@/providers/app-providers"
import type { Metadata } from "next"
import "./globals.css"

// Privy and other client-only providers require client-side rendering
export const dynamic = "force-dynamic"

import { DM_Serif_Display, Space_Grotesk } from "next/font/google"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
})

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif"
})

/**
 * metadata: ページのメタデータ
 */
export const metadata: Metadata = {
  title: "Innocence Ledger",
  description: "冤罪被害者支援のための透明性とプライバシーを両立するオンチェーン支援インフラ。",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  metadataBase: new URL("https://github.com/mashharuki/JPYC_Hackathon_2025"),
  openGraph: {
    type: "website",
    url: "https://github.com/mashharuki/JPYC_Hackathon_2025",
    title: "Innocence Ledger",
    description: "冤罪被害者支援のための透明性とプライバシーを両立するオンチェーン支援インフラ。",
    siteName: "Innocence Ledger",
    images: [
      {
        url: "https://innocence-ledger.local/social-media.png"
      }
    ]
  },
  twitter: { card: "summary_large_image", images: "https://innocence-ledger.local/social-media.png" }
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
      <body suppressHydrationWarning className={`${spaceGrotesk.variable} ${dmSerif.variable}`}>
        <AppProviders>
          <PageContainer>{children}</PageContainer>
        </AppProviders>
      </body>
    </html>
  )
}
