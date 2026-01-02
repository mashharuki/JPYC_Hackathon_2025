"use client"

import { Identity } from "@semaphore-protocol/core"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import Auth from "../components/Auth"
import Stepper from "../components/Stepper"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "../context/AuthContext"
import { useLogContext } from "../context/LogContext"
import { supabase } from "../utils/supabase"

/**
 * IdentitiesPage: ユーザーのSemaphoreアイデンティティを作成・表示するページ
 * @returns
 */
export default function IdentitiesPage() {
  const router = useRouter()
  const { setLog } = useLogContext()
  const { user, ready, logout } = useAuth()
  const [_identity, setIdentity] = useState<Identity>()
  const [fetchingIdentity, setFetchingIdentity] = useState(false)

  // コンポーネント読み込み時に、Supabaseに既存のアイデンティティがあるか確認
  useEffect(() => {
    /**
     * ユーザー情報を取得して、Supabaseに既存のアイデンティティがあるか確認
     * @returns
     */
    const fetchCurrentIdentity = async () => {
      if (!ready) return

      if (user) {
        setFetchingIdentity(true)
        // 認証済みユーザーに紐づく秘密鍵をDBから取得
        const { data, error } = await supabase.from("identities").select("private_key").eq("user_id", user.id).single()

        if (data && !error) {
          // DBから復元
          const identity = new Identity(data.private_key)
          setIdentity(identity)
          setLog("Welcome back! Your Semaphore identity has been securely loaded from Supabase 🔐")
        } else {
          setLog("Identity not found for this account. Create a new one below! 👇🏽")
        }
        setFetchingIdentity(false)
      } else {
        // 未ログイン状態
        setLog("Please sign in to manage or recover your Semaphore identity 👆🏽")
        setIdentity(undefined)
      }
    }

    fetchCurrentIdentity()
  }, [user, ready, setLog])

  /**
   * createIdentity: 新しいSemaphoreアイデンティティを生成し、Supabaseに保存
   */
  const createIdentity = useCallback(async () => {
    if (!user) return

    setFetchingIdentity(true)
    // 全く新しい秘密鍵を持つアイデンティティを作成
    const identity = new Identity()
    const privateKey = identity.export()

    // Supabaseのidentitiesテーブルに保存（既存のものがあれば値を更新）
    const { error } = await supabase.from("identities").upsert({
      user_id: user.id,
      private_key: privateKey,
      commitment: identity.commitment.toString(),
      updated_at: new Date().toISOString()
    })

    if (!error) {
      setIdentity(identity)
      setLog("Your new Semaphore identity has been saved to Supabase 🚀")
    } else {
      console.error(error)
      setLog("Error saving identity. Please try again.")
    }
    setFetchingIdentity(false)
  }, [user, setLog])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Identities</h2>
        {user && (
          <button className="button" onClick={logout} style={{ padding: "5px 10px", fontSize: "14px" }}>
            Logout
          </button>
        )}
      </div>

      {!user ? (
        <div className="key-wrapper">
          <Auth />
        </div>
      ) : (
        <>
          <p>
            Semaphoreプロトコルにおけるユーザーのアイデンティティ。{" "}
            <a
              href="https://docs.semaphore.pse.dev/guides/identities"
              target="_blank"
              rel="noreferrer noopener nofollow"
            >
              Semaphore identity
            </a>{" "}
            は、{" "}
            <a
              href="https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/eddsa-poseidon"
              target="_blank"
              rel="noreferrer noopener nofollow"
            >
              EdDSA
            </a>{" "}
            公開鍵・秘密鍵のペアと、公開識別子として使用される「コミットメント（Commitment）」で構成されます。
          </p>

          <div className="divider" />

          <div className="keys-header">
            <h3>Identity</h3>
          </div>

          {fetchingIdentity ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            _identity && (
              <div className="key-wrapper">
                <p>
                  <b>Private Key (base64)</b>:<br /> {_identity.export()}
                </p>
                <p>
                  <b>Public Key</b>:<br /> [{_identity.publicKey[0].toString()}, {_identity.publicKey[1].toString()}]
                </p>
                <p>
                  <b>Commitment</b>:<br /> {_identity.commitment.toString()}
                </p>
              </div>
            )
          )}

          {!_identity && (
            <div>
              <button className="button" onClick={createIdentity} type="button" disabled={fetchingIdentity}>
                Create identity
              </button>
            </div>
          )}

          <div className="divider" />

          <Stepper step={1} onNextClick={_identity && (() => router.push("/group"))} />
        </>
      )}
    </>
  )
}
