import { act, renderHook, waitFor } from "@testing-library/react"
import { isAddress } from "viem"
import { getBalance, readContract, watchBlockNumber } from "viem/actions"
import useJPYCBalance from "../useJPYCBalance"

// viem actions のモック
jest.mock("viem/actions", () => ({
  getBalance: jest.fn(),
  readContract: jest.fn(),
  watchBlockNumber: jest.fn()
}))

jest.mock("viem", () => ({
  isAddress: jest.fn(),
  createPublicClient: jest.fn(),
  http: jest.fn()
}))

describe("useJPYCBalance", () => {
  const mockAddress = "0x1234567890123456789012345678901234567890" as `0x${string}`
  const mockETHBalance = BigInt("1000000000000000000") // 1 ETH
  const mockJPYCBalance = BigInt("100000000000000000000") // 100 JPYC

  beforeEach(() => {
    jest.clearAllMocks()
    ;(isAddress as jest.Mock).mockReturnValue(true)
  })

  it("should return undefined balances initially when loading", () => {
    ;(getBalance as jest.Mock).mockImplementation(() => new Promise(() => {}))
    ;(readContract as jest.Mock).mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useJPYCBalance(mockAddress))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.ethBalance).toBeUndefined()
    expect(result.current.jpycBalance).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it("should fetch ETH and JPYC balances successfully", async () => {
    ;(getBalance as jest.Mock).mockResolvedValue(mockETHBalance)
    ;(readContract as jest.Mock).mockResolvedValue(mockJPYCBalance)
    ;(watchBlockNumber as jest.Mock).mockImplementation(() => () => {}) // return unwatch function

    const { result } = renderHook(() => useJPYCBalance(mockAddress))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.ethBalance).toBe(mockETHBalance)
    expect(result.current.jpycBalance).toBe(mockJPYCBalance)
    expect(result.current.error).toBeNull()
    expect(getBalance).toHaveBeenCalled()
    expect(readContract).toHaveBeenCalled()
  })

  it("should validate address using isAddress", () => {
    ;(isAddress as jest.Mock).mockReturnValue(false)
    ;(getBalance as jest.Mock).mockResolvedValue(mockETHBalance)
    ;(readContract as jest.Mock).mockResolvedValue(mockJPYCBalance)

    const { result } = renderHook(() => useJPYCBalance("invalid-address" as `0x${string}`))

    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.message).toContain("Invalid address")
  })

  it("should handle network errors gracefully", async () => {
    const networkError = new Error("Network connection failed")
    ;(getBalance as jest.Mock).mockRejectedValue(networkError)
    ;(readContract as jest.Mock).mockRejectedValue(networkError)

    const { result } = renderHook(() => useJPYCBalance(mockAddress))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(networkError)
    expect(result.current.ethBalance).toBeUndefined()
    expect(result.current.jpycBalance).toBeUndefined()
  })

  it("should provide refetch function to manually update balances", async () => {
    ;(getBalance as jest.Mock).mockResolvedValue(mockETHBalance)
    ;(readContract as jest.Mock).mockResolvedValue(mockJPYCBalance)
    ;(watchBlockNumber as jest.Mock).mockImplementation(() => () => {})

    const { result } = renderHook(() => useJPYCBalance(mockAddress))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Clear previous calls
    jest.clearAllMocks()

    const newETHBalance = BigInt("2000000000000000000")
    const newJPYCBalance = BigInt("200000000000000000000")
    ;(getBalance as jest.Mock).mockResolvedValue(newETHBalance)
    ;(readContract as jest.Mock).mockResolvedValue(newJPYCBalance)

    // Call refetch
    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.ethBalance).toBe(newETHBalance)
      expect(result.current.jpycBalance).toBe(newJPYCBalance)
    })

    expect(getBalance).toHaveBeenCalled()
    expect(readContract).toHaveBeenCalled()
  })

  it("should auto-update balances when new block is detected", async () => {
    let blockCallback: ((blockNumber: bigint) => void) | undefined
    ;(getBalance as jest.Mock).mockResolvedValue(mockETHBalance)
    ;(readContract as jest.Mock).mockResolvedValue(mockJPYCBalance)
    ;(watchBlockNumber as jest.Mock).mockImplementation((_client, { onBlockNumber }) => {
      blockCallback = onBlockNumber
      return () => {} // unwatch function
    })

    const { result } = renderHook(() => useJPYCBalance(mockAddress))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Clear previous calls
    jest.clearAllMocks()

    const newETHBalance = BigInt("3000000000000000000")
    const newJPYCBalance = BigInt("300000000000000000000")
    ;(getBalance as jest.Mock).mockResolvedValue(newETHBalance)
    ;(readContract as jest.Mock).mockResolvedValue(newJPYCBalance)

    // Simulate new block
    if (blockCallback) {
      await act(async () => {
        blockCallback!(BigInt(123456))
      })
    }

    await waitFor(() => {
      expect(result.current.ethBalance).toBe(newETHBalance)
      expect(result.current.jpycBalance).toBe(newJPYCBalance)
    })

    expect(getBalance).toHaveBeenCalled()
    expect(readContract).toHaveBeenCalled()
  })

  it("should cleanup block watcher on unmount", async () => {
    const mockUnwatch = jest.fn()
    ;(getBalance as jest.Mock).mockResolvedValue(mockETHBalance)
    ;(readContract as jest.Mock).mockResolvedValue(mockJPYCBalance)
    ;(watchBlockNumber as jest.Mock).mockImplementation(() => mockUnwatch)

    const { unmount } = renderHook(() => useJPYCBalance(mockAddress))

    await waitFor(() => {
      expect(watchBlockNumber).toHaveBeenCalled()
    })

    unmount()

    expect(mockUnwatch).toHaveBeenCalled()
  })
})
