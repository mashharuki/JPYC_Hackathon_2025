"use client"

import { usePrivy } from "@privy-io/react-auth"

/**
 * Authコンポーネント:
 * Privy認証によるログイン機能を提供します。
 */
export default function Auth() {
  const { login, ready } = usePrivy()

  return (
    <div className="auth-container">
      <h3>Login with Privy</h3>
      <p style={{ fontSize: "14px", marginBottom: "20px" }}>
        メール、ウォレット、またはGoogleアカウントを使用してログインし、Semaphoreアイデンティティを管理します。
      </p>

      <button
        className="button secondary"
        onClick={login}
        disabled={!ready}
        style={{ width: "100%", backgroundColor: "#3B82F6", color: "white" }}
      >
        {!ready ? "Loading..." : "Login with Privy"}
      </button>
    </div>
  )
}
