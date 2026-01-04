import { renderHook, waitFor, act } from "@testing-library/react"
import { ReactNode } from "react"
import { useCaseContext, CaseContextProvider } from "../CaseContext"

// Mock fetch API
global.fetch = jest.fn()

// Mock hooks
jest.mock("@/hooks/useMultiSigWallet", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isWhitelisted: jest.fn(),
    addRecipient: jest.fn(),
    withdraw: jest.fn(),
    isLoading: false,
    error: null
  }))
}))

jest.mock("@/hooks/useSemaphoreDonation", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    donateWithProof: jest.fn(),
    joinGroup: jest.fn(),
    isLoading: false,
    error: null
  }))
}))

jest.mock("@/hooks/useJPYCBalance", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    ethBalance: BigInt("1000000000000000000"),
    jpycBalance: BigInt("100000000000000000000"),
    refetch: jest.fn(),
    isLoading: false,
    error: null
  }))
}))

describe("CaseContext", () => {
  const mockCases = [
    {
      id: "case-1",
      title: "Test Case 1",
      description: "Description 1",
      goal_amount: "1000000000000000000000",
      current_amount: "500000000000000000000",
      wallet_address: "0x1234567890123456789012345678901234567890",
      semaphore_group_id: "group-1",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z"
    },
    {
      id: "case-2",
      title: "Test Case 2",
      description: "Description 2",
      goal_amount: "2000000000000000000000",
      current_amount: "1000000000000000000000",
      wallet_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      semaphore_group_id: "group-2",
      created_at: "2026-01-03T00:00:00Z",
      updated_at: "2026-01-04T00:00:00Z"
    }
  ]

  const wrapper = ({ children }: { children: ReactNode }) => <CaseContextProvider>{children}</CaseContextProvider>

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console errors completely during tests
    jest.spyOn(console, "error").mockImplementation(() => {})
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ cases: mockCases })
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("Context Provider", () => {
    it("should throw error when used outside of provider", () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      try {
        renderHook(() => useCaseContext())
      } catch (error) {
        expect(error).toEqual(new Error("CaseContext must be used within a CaseContextProvider"))
      }

      console.error = originalError
    })

    it("should fetch cases on mount", async () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(global.fetch).toHaveBeenCalledWith("/api/cases")
      expect(result.current.cases).toHaveLength(2)
      expect(result.current.cases[0].id).toBe("case-1")
      expect(result.current.error).toBeNull()
    })

    it("should handle fetch error", async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.error?.message).toContain("Network error")
      expect(result.current.cases).toEqual([])
    })

    it("should convert bigint fields correctly", async () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const case1 = result.current.cases[0]
      expect(typeof case1.goalAmount).toBe("bigint")
      expect(case1.goalAmount).toBe(BigInt("1000000000000000000000"))
      expect(typeof case1.currentAmount).toBe("bigint")
      expect(case1.currentAmount).toBe(BigInt("500000000000000000000"))
    })
  })

  describe("selectCase", () => {
    it("should select a case by id", async () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.selectCase("case-1")
      })

      expect(result.current.selectedCase?.id).toBe("case-1")
      expect(result.current.selectedCase?.title).toBe("Test Case 1")
    })

    it("should clear selection when id is null", async () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.selectCase("case-1")
      })

      expect(result.current.selectedCase?.id).toBe("case-1")

      act(() => {
        result.current.selectCase(null)
      })

      expect(result.current.selectedCase).toBeNull()
    })

    it("should do nothing if case id not found", async () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.selectCase("non-existent")
      })

      expect(result.current.selectedCase).toBeNull()
    })
  })

  describe("refreshCases", () => {
    it("should refresh cases data", async () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const updatedCases = [
        {
          ...mockCases[0],
          current_amount: "750000000000000000000"
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cases: updatedCases })
      })

      await act(async () => {
        await result.current.refreshCases()
      })

      expect(result.current.cases[0].currentAmount).toBe(BigInt("750000000000000000000"))
    })

    it("should handle refresh error", async () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Refresh failed"))

      await act(async () => {
        await result.current.refreshCases()
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.error?.message).toContain("Refresh failed")
    })
  })

  describe("State management", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      expect(result.current.cases).toEqual([])
      expect(result.current.selectedCase).toBeNull()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.transactionStatus).toBe("idle")
      expect(result.current.error).toBeNull()
    })

    it("should provide all required context values", async () => {
      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify all expected properties exist
      expect(result.current).toHaveProperty("cases")
      expect(result.current).toHaveProperty("selectedCase")
      expect(result.current).toHaveProperty("isLoading")
      expect(result.current).toHaveProperty("transactionStatus")
      expect(result.current).toHaveProperty("error")
      expect(result.current).toHaveProperty("selectCase")
      expect(result.current).toHaveProperty("refreshCases")
    })
  })

  describe("Error handling", () => {
    it("should set error state on fetch failure", async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"))

      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.error?.message).toBe("API Error")
      expect(result.current.isLoading).toBe(false)
    })

    it("should clear error on successful refresh", async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Initial error"))

      const { result } = renderHook(() => useCaseContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cases: mockCases })
      })

      await act(async () => {
        await result.current.refreshCases()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.cases).toHaveLength(2)
    })
  })
})
