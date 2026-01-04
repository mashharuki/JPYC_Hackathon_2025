import { act, renderHook, waitFor } from "@testing-library/react"
import { readContract } from "viem/actions"
import useMultiSigWallet from "../useMultiSigWallet"

// viem actions のモック
jest.mock("viem/actions", () => ({
  readContract: jest.fn()
}))

const mockWalletClient = {
  getAddresses: jest.fn().mockResolvedValue(["0xowner1" as `0x${string}`]),
  signTypedData: jest.fn(),
  writeContract: jest.fn()
}

const mockPublicClient = {}

jest.mock("viem", () => ({
  createWalletClient: jest.fn(() => mockWalletClient),
  createPublicClient: jest.fn(() => mockPublicClient),
  http: jest.fn(),
  custom: jest.fn()
}))

// Mock window.ethereum
if (typeof window !== "undefined") {
  ;(window as any).ethereum = {}
} else {
  ;(global as any).window = { ethereum: {} }
}

describe("useMultiSigWallet", () => {
  const mockWalletAddress = "0x1234567890123456789012345678901234567890" as `0x${string}`
  const mockRecipientAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`
  const mockNonce = BigInt(1)
  const mockAmount = BigInt("100000000000000000000") // 100 JPYC
  const mockTxHash = "0xtxhash123" as `0x${string}`

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("isWhitelisted", () => {
    it("should check if recipient is whitelisted successfully", async () => {
      ;(readContract as jest.Mock).mockResolvedValue(true)

      const { result } = renderHook(() => useMultiSigWallet())

      let isWhitelisted
      await act(async () => {
        isWhitelisted = await result.current.isWhitelisted(mockWalletAddress, mockRecipientAddress)
      })

      expect(isWhitelisted).toBe(true)
      expect(readContract).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          address: mockWalletAddress,
          functionName: "isWhitelisted",
          args: [mockRecipientAddress]
        })
      )
    })

    it("should return false when recipient is not whitelisted", async () => {
      ;(readContract as jest.Mock).mockResolvedValue(false)
      const { result } = renderHook(() => useMultiSigWallet())
      let isWhitelisted
      await act(async () => {
        isWhitelisted = await result.current.isWhitelisted(mockWalletAddress, mockRecipientAddress)
      })

      expect(isWhitelisted).toBe(false)
    })

    it("should handle read errors gracefully", async () => {
      const error = new Error("Network error")
      ;(readContract as jest.Mock).mockRejectedValue(error)

      const { result } = renderHook(() => useMultiSigWallet())

      await act(async () => {
        await expect(result.current.isWhitelisted(mockWalletAddress, mockRecipientAddress)).rejects.toThrow(
          "Network error"
        )
      })
    })
  })

  describe("addRecipient", () => {
    it("should collect 2 signatures and add recipient successfully", async () => {
      const mockSignature1 = "0xsignature1" as `0x${string}`
      const mockSignature2 = "0xsignature2" as `0x${string}`

      mockWalletClient.signTypedData.mockResolvedValueOnce(mockSignature1).mockResolvedValueOnce(mockSignature2)
      mockWalletClient.writeContract.mockResolvedValue(mockTxHash)

      const { result } = renderHook(() => useMultiSigWallet())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let txHash
      await act(async () => {
        txHash = await result.current.addRecipient(mockWalletAddress, mockRecipientAddress, mockNonce)
      })

      expect(txHash).toBe(mockTxHash)
      expect(mockWalletClient.signTypedData).toHaveBeenCalledTimes(2)
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockWalletAddress,
          functionName: "addRecipient",
          args: [mockRecipientAddress, [mockSignature1, mockSignature2], mockNonce]
        })
      )
    })

    it("should set loading state during transaction", async () => {
      mockWalletClient.signTypedData.mockResolvedValue("0xsig")
      mockWalletClient.writeContract.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTxHash), 100))
      )

      const { result } = renderHook(() => useMultiSigWallet())

      let addRecipientPromise
      await act(async () => {
        addRecipientPromise = result.current.addRecipient(mockWalletAddress, mockRecipientAddress, mockNonce)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        await addRecipientPromise
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle signature collection failure", async () => {
      const signError = new Error("User rejected signature")
      mockWalletClient.signTypedData.mockRejectedValue(signError)

      const { result } = renderHook(() => useMultiSigWallet())

      await act(async () => {
        await expect(result.current.addRecipient(mockWalletAddress, mockRecipientAddress, mockNonce)).rejects.toThrow(
          "User rejected signature"
        )
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle transaction failure", async () => {
      mockWalletClient.signTypedData.mockResolvedValue("0xsig")
      const txError = new Error("Transaction reverted")
      mockWalletClient.writeContract.mockRejectedValue(txError)

      const { result } = renderHook(() => useMultiSigWallet())

      await act(async () => {
        await expect(result.current.addRecipient(mockWalletAddress, mockRecipientAddress, mockNonce)).rejects.toThrow(
          "Transaction reverted"
        )
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe("withdraw", () => {
    it("should execute withdrawal successfully when whitelisted", async () => {
      mockWalletClient.writeContract.mockResolvedValue(mockTxHash)

      const { result } = renderHook(() => useMultiSigWallet())

      let txHash
      await act(async () => {
        txHash = await result.current.withdraw(mockWalletAddress, mockRecipientAddress, mockAmount)
      })

      expect(txHash).toBe(mockTxHash)
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockWalletAddress,
          functionName: "withdraw",
          args: [mockRecipientAddress, mockAmount]
        })
      )
    })

    it("should set loading state during withdrawal", async () => {
      mockWalletClient.writeContract.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTxHash), 100))
      )

      const { result } = renderHook(() => useMultiSigWallet())

      let withdrawPromise
      await act(async () => {
        withdrawPromise = result.current.withdraw(mockWalletAddress, mockRecipientAddress, mockAmount)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        await withdrawPromise
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle withdrawal failure when not whitelisted", async () => {
      const revertError = new Error("Caller not whitelisted")
      mockWalletClient.writeContract.mockRejectedValue(revertError)

      const { result } = renderHook(() => useMultiSigWallet())

      await act(async () => {
        await expect(result.current.withdraw(mockWalletAddress, mockRecipientAddress, mockAmount)).rejects.toThrow(
          "Caller not whitelisted"
        )
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle insufficient balance error", async () => {
      const balanceError = new Error("Insufficient JPYC balance")
      mockWalletClient.writeContract.mockRejectedValue(balanceError)

      const { result } = renderHook(() => useMultiSigWallet())

      await act(async () => {
        await expect(result.current.withdraw(mockWalletAddress, mockRecipientAddress, mockAmount)).rejects.toThrow(
          "Insufficient JPYC balance"
        )
      })
    })
  })

  describe("error handling", () => {
    it("should clear error when new operation starts", async () => {
      // First operation fails
      ;(readContract as jest.Mock).mockRejectedValue(new Error("First error"))

      const { result } = renderHook(() => useMultiSigWallet())

      await act(async () => {
        await expect(result.current.isWhitelisted(mockWalletAddress, mockRecipientAddress)).rejects.toThrow()
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      // Second operation succeeds
      ;(readContract as jest.Mock).mockResolvedValue(true)

      await act(async () => {
        await result.current.isWhitelisted(mockWalletAddress, mockRecipientAddress)
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })
  })
})
