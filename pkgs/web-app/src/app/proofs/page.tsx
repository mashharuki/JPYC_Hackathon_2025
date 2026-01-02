"use client"

import Stepper from "@/components/Stepper"
import { useLogContext } from "@/context/LogContext"
import { useSemaphoreContext } from "@/context/SemaphoreContext"
import { useBiconomy } from "@/hooks/useBiconomy"
import useSemaphoreIdentity from "@/hooks/useSemaphoreIdentity"
import { generateProof, Group } from "@semaphore-protocol/core"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { type Address, encodeFunctionData, stringToHex } from "viem"
import Feedback from "../../../contract-artifacts/Feedback.json"

/**
 * ProofPageコンポーネント（Biconomy AA対応）
 */
export default function ProofsPage() {
  const router = useRouter()
  const { setLog } = useLogContext()
  const { _users, _feedback, refreshUsers, refreshFeedback, addFeedback } = useSemaphoreContext()
  const [_loading, setLoading] = useState(false)
  const { _identity, loading: identityLoading } = useSemaphoreIdentity()
  const { initializeBiconomyAccount, sendTransaction, isLoading: biconomyLoading } = useBiconomy()

  // ページマウント時に最新のグループメンバーとフィードバックを取得
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([refreshUsers(), refreshFeedback()])
      } catch (error) {
        console.error("Error fetching initial data:", error)
      }
    }

    fetchInitialData()
  }, [refreshUsers, refreshFeedback])

  useEffect(() => {
    if (_feedback.length > 0) {
      setLog(`${_feedback.length} feedback retrieved from the group 🤙🏽`)
    }
  }, [_feedback, setLog])

  const feedback = useMemo(() => [..._feedback].reverse(), [_feedback])

  /**
   * フィードバックを送信する（Biconomy AA経由）
   */
  const sendFeedback = useCallback(async () => {
    if (!_identity) {
      return
    }

    const feedbackMessage = prompt("Please enter your feedback:")

    if (feedbackMessage && _users) {
      setLoading(true)
      setLog(`Generating zero-knowledge proof...`)

      const toastId = toast.loading("Refreshing group members...")

      try {
        // 1. 最新のグループメンバーリストを取得
        const latestUsers = await refreshUsers()
        toast.loading("Generating proof...", { id: toastId })

        // デバッグ: ユーザーのcommitmentとグループメンバーを確認
        console.log("User's identity commitment:", _identity.commitment.toString())
        console.log("Latest group members:", latestUsers)
        console.log("Is user in group?", latestUsers.includes(_identity.commitment.toString()))

        // ユーザーがグループに参加しているか確認
        if (!latestUsers.includes(_identity.commitment.toString())) {
          throw new Error(
            "You must join the group before sending feedback. Please go to the Groups page and join first."
          )
        }

        // 2. Groupインスタンスを作成（文字列をBigIntに変換）
        // Semaphore の Group クラスは BigInt の配列を期待します
        const group = new Group(latestUsers.map((member) => BigInt(member)))

        // 3. メッセージをエンコーディングする（文字列を直接bytes32に変換）
        // stringToHexを使用して文字列をhexに変換し、32バイトにパディング
        const messageHex = stringToHex(feedbackMessage, { size: 32 })
        const message = BigInt(messageHex)

        // 4. ZK Proofを生成する
        toast.loading("Generating zero-knowledge proof...", { id: toastId })
        const { points, merkleTreeDepth, merkleTreeRoot, nullifier } = await generateProof(
          _identity,
          group,
          message,
          process.env.NEXT_PUBLIC_GROUP_ID as string
        )

        // 5. Biconomyスマートアカウントを初期化
        toast.loading("Initializing smart account...", { id: toastId })
        const { nexusClient } = await initializeBiconomyAccount()

        // 6. sendFeedbackトランザクションデータをエンコード
        toast.loading("Sending anonymous feedback...", { id: toastId })
        const functionCallData = encodeFunctionData({
          abi: Feedback.abi,
          functionName: "sendFeedback",
          args: [merkleTreeDepth, merkleTreeRoot, nullifier, message, points]
        })

        // 7. トランザクションを送信（初期化したnexusClientを渡す）
        const txHash = await sendTransaction(
          process.env.NEXT_PUBLIC_FEEDBACK_CONTRACT_ADDRESS as Address,
          functionCallData,
          nexusClient
        )

        if (txHash) {
          // フィードバック送信成功
          addFeedback(feedbackMessage)
          setLog(`Your anonymous feedback has been posted! 🎉 Transaction: ${txHash}`)
          toast.success("Feedback posted successfully!", { id: toastId })
        } else {
          throw new Error("Transaction hash not returned")
        }
      } catch (error) {
        console.error("Error sending feedback:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        setLog(`Error sending feedback: ${errorMessage}`)
        toast.error(`Failed to send feedback: ${errorMessage}`, { id: toastId })
      } finally {
        setLoading(false)
      }
    }
  }, [_identity, _users, addFeedback, setLog, refreshUsers, initializeBiconomyAccount, sendTransaction])

  if (identityLoading) {
    return <div className="loader"></div>
  }

  return (
    <>
      <h2>Proofs</h2>

      <p>
        Semaphore members can anonymously{" "}
        <a href="https://docs.semaphore.pse.dev/guides/proofs" target="_blank" rel="noreferrer noopener nofollow">
          prove
        </a>{" "}
        that they are part of a group and send their anonymous messages. Messages could be votes, leaks, reviews,
        feedback, etc.
      </p>

      <div className="divider"></div>

      <div className="text-top">
        <h3>Feedback ({_feedback.length})</h3>
        <button className="refresh-button" onClick={refreshFeedback}>
          <span className="refresh-span">
            <svg viewBox="0 0 24 24" focusable="false" className="refresh-icon">
              <path
                fill="currentColor"
                d="M5.463 4.43301C7.27756 2.86067 9.59899 1.99666 12 2.00001C17.523 2.00001 22 6.47701 22 12C22 14.136 21.33 16.116 20.19 17.74L17 12H20C20.0001 10.4316 19.5392 8.89781 18.6747 7.58927C17.8101 6.28072 16.5799 5.25517 15.1372 4.64013C13.6944 4.0251 12.1027 3.84771 10.56 4.13003C9.0172 4.41234 7.59145 5.14191 6.46 6.22801L5.463 4.43301ZM18.537 19.567C16.7224 21.1393 14.401 22.0034 12 22C6.477 22 2 17.523 2 12C2 9.86401 2.67 7.88401 3.81 6.26001L7 12H4C3.99987 13.5684 4.46075 15.1022 5.32534 16.4108C6.18992 17.7193 7.42007 18.7449 8.86282 19.3599C10.3056 19.9749 11.8973 20.1523 13.44 19.87C14.9828 19.5877 16.4085 18.8581 17.54 17.772L18.537 19.567Z"
              ></path>
            </svg>
          </span>
          Refresh
        </button>
      </div>

      {_feedback.length > 0 && (
        <div className="users-wrapper">
          {feedback.map((f, i) => (
            <div key={i}>
              <p className="box box-text">{f}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <button
          className="button"
          onClick={sendFeedback}
          disabled={_loading || biconomyLoading || !_identity}
          type="button"
        >
          <span>Send Feedback</span>
          {(_loading || biconomyLoading) && <div className="loader"></div>}
        </button>
      </div>

      <div className="divider" />

      <Stepper step={3} onPrevClick={() => router.push("/group")} />
    </>
  )
}
