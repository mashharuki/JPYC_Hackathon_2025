/**
 * 環境変数のバリデーション
 * アプリケーション起動時に必須の環境変数が設定されているかチェック
 */

interface EnvConfig {
  // Privy
  NEXT_PUBLIC_PRIVY_APP_ID: string

  // Biconomy
  NEXT_PUBLIC_BICONOMY_BUNDLER_API_KEY: string
  NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY: string

  // Network
  NEXT_PUBLIC_CHAIN_ID: string
  NEXT_PUBLIC_RPC_URL: string

  // Supabase (optional - for identity storage)
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EnvValidationError"
  }
}

/**
 * 環境変数を検証し、設定されていない場合はエラーをスロー
 */
export function validateEnv(): EnvConfig {
  const requiredEnvVars = [
    "NEXT_PUBLIC_PRIVY_APP_ID",
    "NEXT_PUBLIC_BICONOMY_BUNDLER_API_KEY",
    "NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY",
    "NEXT_PUBLIC_CHAIN_ID",
    "NEXT_PUBLIC_RPC_URL"
  ] as const

  const missingVars: string[] = []

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  })

  if (missingVars.length > 0) {
    throw new EnvValidationError(
      `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join("\n")}\n\nPlease check your .env file and ensure all required variables are set.`
    )
  }

  return {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    NEXT_PUBLIC_BICONOMY_BUNDLER_API_KEY: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_API_KEY!,
    NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY!,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID!,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL!,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}

/**
 * 検証済みの環境変数を取得
 * サーバーサイドとクライアントサイドの両方で使用可能
 */
export const env = validateEnv()
