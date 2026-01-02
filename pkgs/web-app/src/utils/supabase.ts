import { createClient } from "@supabase/supabase-js"

/**
 * Supabaseクライアントの初期化。
 * 環境変数からプロジェクトURLとアノンキーを取得します。
 * ビルド時にはプレースホルダーを使用してエラーを回避します。
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
