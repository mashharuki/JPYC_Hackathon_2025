import { renderHook, waitFor } from "@testing-library/react"
import useSemaphoreDonation from "../useSemaphoreDonation"
import { readContract } from "viem/actions"

// viem actions のモック
jest.mock("viem/actions", () => ({
  readContract: jest.fn()
}))

// Semaphore proof generation のモック
jest.mock("@semaphore-protocol/proof", () => ({
  generateProof: jest.fn()
}))

// SemaphoreContext のモック
const mockUseSemaphore = jest.fn()
jest.mock("@/context/SemaphoreContext", () => ({
  useSemaphore: () => mockUseSemaphore()
}))

// Supabase client のモック
jest.mock("@/utils/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn()
    }))
  }
}))

const mockWalletClient = {
  getAddresses: jest.fn().mockResolvedValue(["0xdonor1" as `0x${string}`]),
  writeContract: jest.fn()
}

const mockPublicClient = {}

jest.mock("viem", () => ({
  createWalletClient: jest.fn(() => mockWalletClient),
  createPublicClient: jest.fn(() => mockPublicClient),
  http: jest.fn(),
  custom: jest.fn(),
  parseUnits: jest.fn((value: string) => BigInt(value) * BigInt(10 ** 18))
}))

// Mock window.ethereum
if (typeof window !== "undefined") {
  ;(window as any).ethereum = {}
} else {
  ;(global as any).window = { ethereum: {} }
}

describe("useSemaphoreDonation", () => {
  const mockDonationContractAddress = "0x1234567890123456789012345678901234567890" as `0x${string}`
  const mockJPYCAddress = "0xda683fe053b4344F3Aa5Db6Cbaf3046F7755e5E1" as `0x${string}`
  const mockWalletAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`
  const mockAmount = BigInt("100000000000000000000") // 100 JPYC
  const mockTxHash = "0xtxhash123" as `0x${string}`
  const mockMerkleRoot = BigInt("12345678901234567890")
  const mockNullifier = BigInt("98765432109876543210")
  const mockProof = [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6), BigInt(7), BigInt(8)] as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint
  ]

  const mockIdentity = {
    commitment: BigInt("11111111111111111111")
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock SemaphoreContext default behavior
    mockUseSemaphore.mockReturnValue({
      identity: mockIdentity,
      isLoading: false,
      error: null
    })
  })

  describe("donateWithProof", () => {
    it("should approve JPYC and execute donation with proof successfully", async () => {
      const { generateProof } = require("@semaphore-protocol/proof")
      const { supabase } = require("@/utils/supabase")

      // Mock Supabase response for Merkle root
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { merkle_root: mockMerkleRoot.toString() },
              error: null
            })
          }))
        }))
      })

      // Mock proof generation
      generateProof.mockResolvedValue({
        merkleTreeRoot: mockMerkleRoot,
        nullifier: mockNullifier,
        proof: mockProof
      })

      mockWalletClient.writeContract.mockResolvedValue(mockTxHash)

      const { result } = renderHook(() => useSemaphoreDonation())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const txHash = await result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)

      expect(txHash).toBe(mockTxHash)

      // Verify JPYC approve was called first
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockJPYCAddress,
          functionName: "approve",
          args: [mockDonationContractAddress, mockAmount]
        })
      )

      // Verify donateWithProof was called
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockDonationContractAddress,
          functionName: "donateWithProof",
          args: [mockMerkleRoot, mockNullifier, mockProof, mockWalletAddress, mockAmount]
        })
      )

      // Verify proof generation was called
      expect(generateProof).toHaveBeenCalled()
    })

    it("should set loading state during donation", async () => {
      const { generateProof } = require("@semaphore-protocol/proof")
      const { supabase } = require("@/utils/supabase")

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { merkle_root: mockMerkleRoot.toString() },
              error: null
            })
          }))
        }))
      })

      generateProof.mockResolvedValue({
        merkleTreeRoot: mockMerkleRoot,
        nullifier: mockNullifier,
        proof: mockProof
      })

      mockWalletClient.writeContract.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTxHash), 100))
      )

      const { result } = renderHook(() => useSemaphoreDonation())

      const donatePromise = result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await donatePromise

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle proof generation failure", async () => {
      const { generateProof } = require("@semaphore-protocol/proof")
      const { supabase } = require("@/utils/supabase")

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { merkle_root: mockMerkleRoot.toString() },
              error: null
            })
          }))
        }))
      })

      const proofError = new Error("Failed to generate proof")
      generateProof.mockRejectedValue(proofError)

      const { result } = renderHook(() => useSemaphoreDonation())

      await expect(
        result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)
      ).rejects.toThrow("Failed to generate proof")

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle Supabase error when fetching Merkle root", async () => {
      const { supabase } = require("@/utils/supabase")

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error("Database error")
            })
          }))
        }))
      })

      const { result } = renderHook(() => useSemaphoreDonation())

      await expect(
        result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)
      ).rejects.toThrow("Database error")

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
    })

    it("should handle JPYC approve failure", async () => {
      const { generateProof } = require("@semaphore-protocol/proof")
      const { supabase } = require("@/utils/supabase")

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { merkle_root: mockMerkleRoot.toString() },
              error: null
            })
          }))
        }))
      })

      generateProof.mockResolvedValue({
        merkleTreeRoot: mockMerkleRoot,
        nullifier: mockNullifier,
        proof: mockProof
      })

      const approveError = new Error("Insufficient balance")
      mockWalletClient.writeContract.mockRejectedValue(approveError)

      const { result } = renderHook(() => useSemaphoreDonation())

      await expect(
        result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)
      ).rejects.toThrow("Insufficient balance")

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle donation transaction failure", async () => {
      const { generateProof } = require("@semaphore-protocol/proof")
      const { supabase } = require("@/utils/supabase")

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { merkle_root: mockMerkleRoot.toString() },
              error: null
            })
          }))
        }))
      })

      generateProof.mockResolvedValue({
        merkleTreeRoot: mockMerkleRoot,
        nullifier: mockNullifier,
        proof: mockProof
      })

      // Approve succeeds, but donation fails
      const donationError = new Error("Proof verification failed")
      mockWalletClient.writeContract
        .mockResolvedValueOnce(mockTxHash) // approve succeeds
        .mockRejectedValueOnce(donationError) // donation fails

      const { result } = renderHook(() => useSemaphoreDonation())

      await expect(
        result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)
      ).rejects.toThrow("Proof verification failed")

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should throw error when Semaphore identity is not available", async () => {
      mockUseSemaphore.mockReturnValue({
        identity: null,
        isLoading: false,
        error: null
      })

      const { result } = renderHook(() => useSemaphoreDonation())

      await expect(
        result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)
      ).rejects.toThrow("Semaphore identity is not available")
    })
  })

  describe("joinGroup", () => {
    it("should add user to Semaphore group successfully", async () => {
      const { supabase } = require("@/utils/supabase")

      const mockGroupId = "group-123"

      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: { id: "member-1", group_id: mockGroupId, commitment: mockIdentity.commitment.toString() },
          error: null
        })
      })

      const { result } = renderHook(() => useSemaphoreDonation())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.joinGroup(mockGroupId)

      expect(supabase.from).toHaveBeenCalledWith("group_members")
    })

    it("should handle join group failure", async () => {
      const { supabase } = require("@/utils/supabase")

      const mockGroupId = "group-123"
      const joinError = new Error("Group does not exist")

      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: joinError
        })
      })

      const { result } = renderHook(() => useSemaphoreDonation())

      await expect(result.current.joinGroup(mockGroupId)).rejects.toThrow("Group does not exist")

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
    })

    it("should throw error when Semaphore identity is not available for joining group", async () => {
      mockUseSemaphore.mockReturnValue({
        identity: null,
        isLoading: false,
        error: null
      })

      const { result } = renderHook(() => useSemaphoreDonation())

      await expect(result.current.joinGroup("group-123")).rejects.toThrow("Semaphore identity is not available")
    })
  })

  describe("error handling", () => {
    it("should clear error when new operation starts", async () => {
      const { generateProof } = require("@semaphore-protocol/proof")
      const { supabase } = require("@/utils/supabase")

      // First operation fails
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error("First error")
            })
          }))
        }))
      })

      const { result } = renderHook(() => useSemaphoreDonation())

      await expect(
        result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)
      ).rejects.toThrow()

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      // Second operation succeeds
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { merkle_root: mockMerkleRoot.toString() },
              error: null
            })
          }))
        }))
      })

      generateProof.mockResolvedValue({
        merkleTreeRoot: mockMerkleRoot,
        nullifier: mockNullifier,
        proof: mockProof
      })

      mockWalletClient.writeContract.mockResolvedValue(mockTxHash)

      await result.current.donateWithProof(mockDonationContractAddress, mockWalletAddress, mockAmount)

      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })
  })
})
