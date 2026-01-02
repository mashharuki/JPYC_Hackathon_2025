import { Identity } from "@semaphore-protocol/core"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../utils/supabase"

/**
 * useSemaphoreIdentity:
 * SupabaseからSemaphoreアイデンティティを読み込むカスタムフック（Privy対応）。
 * アイデンティティが存在しない場合はトップページにリダイレクトします。
 */
export default function useSemaphoreIdentity() {
  const router = useRouter()
  const { user, ready } = useAuth()
  const [_identity, setIdentity] = useState<Identity>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchIdentity = async () => {
      // Privy初期化中は何もしない
      if (!ready) return

      // 未ログインの場合はトップページ（Identity作成ページ）へ
      if (!user) {
        router.push("/")
        return
      }

      try {
        // Supabaseのidentitiesテーブルから、Privyユーザーに対応する秘密鍵を取得
        const { data, error: fetchError } = await supabase
          .from("identities")
          .select("private_key")
          .eq("user_id", user.id)
          .single()

        if (fetchError) {
          setError(fetchError)
          // アイデンティティが未作成の場合はトップページへ
          router.push("/")
          return
        }

        if (!data) {
          // アイデンティティが未作成の場合はトップページへ
          router.push("/")
          return
        }

        // 取得した秘密鍵からIdentityオブジェクトを復元
        setIdentity(new Identity(data.private_key))
        setLoading(false)
      } catch (err) {
        setError(err as Error)
        router.push("/")
      }
    }

    fetchIdentity()
  }, [router, user, ready])

  return {
    _identity,
    loading: !ready || loading,
    error
  }
}
