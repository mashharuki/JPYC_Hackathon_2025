"use client"
import Stepper from "@/components/Stepper"
import { Spinner } from "@/components/ui/spinner"
import { useLogContext } from "@/context/LogContext"
import { useSemaphoreContext } from "@/context/SemaphoreContext"
import { useBiconomy } from "@/hooks/useBiconomy"
import useSemaphoreIdentity from "@/hooks/useSemaphoreIdentity"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { type Address, encodeFunctionData, createPublicClient, http } from "viem"
import { baseSepolia } from "viem/chains"
import Feedback from "../../../contract-artifacts/Feedback.json"

/**
 * GroupsPageコンポーネント（Biconomy AA対応）
 * @returns
 */
export default function GroupsPage() {
  const router = useRouter()
  const { setLog } = useLogContext()
  const { _users, refreshUsers, addUser } = useSemaphoreContext()
  const [_loading, setLoading] = useState(false)
  const { _identity, loading: identityLoading } = useSemaphoreIdentity()
  const { initializeBiconomyAccount, sendTransaction, isLoading: biconomyLoading } = useBiconomy()

  // ページマウント時に最新のグループメンバーを取得
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await refreshUsers()
      } catch (error) {
        console.error("Error fetching group members:", error)
      }
    }

    fetchInitialData()
  }, [refreshUsers])

  useEffect(() => {
    if (_users.length > 0) {
      setLog(`${_users.length} user${_users.length > 1 ? "s" : ""} retrieved from the group 🤙🏽`)
    }
  }, [_users, setLog])

  const users = useMemo(() => [..._users].reverse(), [_users])

  /**
   * グループに参加する（Biconomy AA経由）
   */
  const joinGroup = useCallback(async () => {
    if (!_identity) {
      return
    }

    setLoading(true)
    setLog(`Joining the Feedback group via Biconomy AA...`)

    const toastId = toast.loading("Initializing smart account...")

    try {
      // 1. Biconomyスマートアカウントを初期化
      const { nexusClient } = await initializeBiconomyAccount()
      toast.loading("Sending transaction...", { id: toastId })

      // 2. joinGroupトランザクションデータをエンコード
      const functionCallData = encodeFunctionData({
        abi: Feedback.abi,
        functionName: "joinGroup",
        args: [_identity.commitment]
      })

      // 3. トランザクションを送信（joinGroupは低めのガス制限で十分）
      const txHash = await sendTransaction(
        process.env.NEXT_PUBLIC_FEEDBACK_CONTRACT_ADDRESS as Address,
        functionCallData,
        nexusClient,
        {
          callGasLimit: BigInt(300000), // joinGroupは300K
          verificationGasLimit: BigInt(200000) // 検証は200K
        }
      )

      if (txHash) {
        // トランザクションがブロックに含まれるまで待機
        toast.loading("Waiting for transaction confirmation...", { id: toastId })

        console.log("Transaction hash:", txHash)
        console.log("User commitment:", _identity.commitment.toString())

        // publicClientを作成してトランザクションレシートを確認
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http()
        })

        try {
          // トランザクションレシートを取得（最大60秒待機）
          console.log("Waiting for transaction receipt...")
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash as `0x${string}`,
            timeout: 60_000
          })

          console.log("Transaction receipt:", receipt)
          console.log("Transaction status:", receipt.status === "success" ? "SUCCESS" : "FAILED")

          if (receipt.status === "reverted") {
            throw new Error("Transaction was reverted on-chain")
          }

          // トランザクション成功後、グループメンバーを確認
          toast.loading("Verifying group membership...", { id: toastId })

          let confirmed = false
          let attempts = 0
          const maxAttempts = 6

          while (!confirmed && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 3000))
            const latestMembers = await refreshUsers()

            if (latestMembers.includes(_identity.commitment.toString())) {
              confirmed = true
              console.log("User successfully added to group!")
            } else {
              attempts++
              console.log(`Attempt ${attempts}/${maxAttempts}: User not yet in group, retrying...`)
            }
          }

          if (!confirmed) {
            console.warn("Transaction succeeded but user not found in group yet. This may be due to indexing delay.")
            toast("Transaction succeeded! If you don't see yourself in the group, please refresh the page.", {
              id: toastId,
              duration: 8000,
              icon: "⚠️"
            })
          } else {
            setLog(`You have joined the Feedback group! 🎉 Transaction: ${txHash}`)
            toast.success("Successfully joined the group!", { id: toastId })
          }
        } catch (error) {
          console.error("Error waiting for transaction receipt:", error)
          throw new Error(
            `Transaction may have failed. Please check on Base Sepolia explorer: https://sepolia.basescan.org/tx/${txHash}`
          )
        }
      } else {
        throw new Error("Transaction hash not returned")
      }
    } catch (error) {
      console.error("Error joining group:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setLog(`Error joining group: ${errorMessage}`)
      toast.error(`Failed to join group: ${errorMessage}`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }, [_identity, setLog, refreshUsers, initializeBiconomyAccount, sendTransaction])

  const userHasJoined = useMemo(
    () => _identity !== undefined && _users.includes(_identity.commitment.toString()),
    [_identity, _users]
  )

  if (identityLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <h2>Groups</h2>

      <p>
        <a href="https://docs.semaphore.pse.dev/guides/groups" target="_blank" rel="noreferrer noopener nofollow">
          Semaphore groups
        </a>{" "}
        are{" "}
        <a
          href="https://zkkit.pse.dev/classes/_zk_kit_lean_imt.LeanIMT.html"
          target="_blank"
          rel="noreferrer noopener nofollow"
        >
          Lean incremental Merkle trees
        </a>{" "}
        in which each leaf contains an identity commitment for a user. Groups can be abstracted to represent events,
        polls, or organizations.
      </p>

      <div className="divider"></div>

      <div className="text-top">
        <h3 className="users-header">Group users ({_users.length})</h3>
        <button className="refresh-button" onClick={refreshUsers}>
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

      {/* 参加状態の表示 */}
      {_identity && userHasJoined && (
        <div
          style={{
            padding: "10px",
            marginBottom: "10px",
            backgroundColor: "#2d3748",
            borderRadius: "8px",
            border: "1px solid #4a5568"
          }}
        >
          <p style={{ margin: 0, color: "#48bb78" }}>✓ You are already a member of this group</p>
        </div>
      )}

      {_users.length > 0 && (
        <div className="users-wrapper">
          {users.map((user, i) => (
            <div key={i}>
              <p className="box box-text">{_identity?.commitment.toString() === user ? <b>{user}</b> : user}</p>
            </div>
          ))}
        </div>
      )}

      <div className="join-group-button">
        <button
          className="button"
          onClick={joinGroup}
          disabled={_loading || biconomyLoading || !_identity || userHasJoined}
          type="button"
        >
          <span>Join group</span>
          {(_loading || biconomyLoading) && <Spinner size="sm" className="ml-2" />}
        </button>
      </div>

      <div className="divider" />

      <Stepper
        step={2}
        onPrevClick={() => router.push("/")}
        onNextClick={userHasJoined ? () => router.push("/proofs") : undefined}
      />
    </>
  )
}
