import { act, renderHook, waitFor } from "@testing-library/react"
import { useBiconomy } from "../useBiconomy"

// モック
jest.mock("@privy-io/react-auth", () => ({
  useWallets: jest.fn()
}))

jest.mock("@biconomy/abstractjs", () => ({
  createSmartAccountClient: jest.fn(),
  toNexusAccount: jest.fn(),
  createBicoPaymasterClient: jest.fn(),
  getMEEVersion: jest.fn(),
  MEEVersion: {
    V2_1_0: "v2.1.0"
  }
}))

describe("useBiconomy", () => {
  const mockWalletAddress = "0x1234567890123456789012345678901234567890"
  const mockSmartAccountAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
  const mockProvider = {
    request: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_API_KEY = "test-bundler-key"
    process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY = "test-paymaster-key"
  })

  it("should initialize with null smartAccount", () => {
    const { useWallets } = require("@privy-io/react-auth")
    useWallets.mockReturnValue({ wallets: [] })

    const { result } = renderHook(() => useBiconomy())

    expect(result.current.smartAccount).toBeNull()
    expect(result.current.address).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("should initialize Biconomy account successfully", async () => {
    const { useWallets } = require("@privy-io/react-auth")
    const { createSmartAccountClient, toNexusAccount } = require("@biconomy/abstractjs")

    const mockWallet = {
      address: mockWalletAddress,
      getEthereumProvider: jest.fn().mockResolvedValue(mockProvider)
    }

    useWallets.mockReturnValue({ wallets: [mockWallet] })

    const mockNexusClient = {
      account: { address: mockSmartAccountAddress },
      sendTransaction: jest.fn()
    }

    toNexusAccount.mockResolvedValue({})
    createSmartAccountClient.mockReturnValue(mockNexusClient)

    const { result } = renderHook(() => useBiconomy())

    await act(async () => {
      await result.current.initializeBiconomyAccount()
    })

    await waitFor(() => {
      expect(result.current.smartAccount).toBe(mockNexusClient)
      expect(result.current.address).toBe(mockWalletAddress)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it("should handle initialization errors", async () => {
    const { useWallets } = require("@privy-io/react-auth")

    useWallets.mockReturnValue({ wallets: [] })

    const { result } = renderHook(() => useBiconomy())

    await act(async () => {
      await expect(result.current.initializeBiconomyAccount()).rejects.toThrow("Embedded wallet is not available")
    })

    expect(result.current.error).toBe("Embedded wallet is not available")
    expect(result.current.isLoading).toBe(false)
  })

  it("should send transaction successfully", async () => {
    const { useWallets } = require("@privy-io/react-auth")
    const { createSmartAccountClient, toNexusAccount } = require("@biconomy/abstractjs")

    const mockWallet = {
      address: mockWalletAddress,
      getEthereumProvider: jest.fn().mockResolvedValue(mockProvider)
    }

    useWallets.mockReturnValue({ wallets: [mockWallet] })

    const mockTxHash = "0xabcdef1234567890"
    const mockNexusClient = {
      account: { address: mockSmartAccountAddress },
      sendTransaction: jest.fn().mockResolvedValue(mockTxHash)
    }

    toNexusAccount.mockResolvedValue({})
    createSmartAccountClient.mockReturnValue(mockNexusClient)

    const { result } = renderHook(() => useBiconomy())

    let initializedAccount: any
    await act(async () => {
      initializedAccount = await result.current.initializeBiconomyAccount()
    })

    const mockTo = "0x9876543210987654321098765432109876543210"
    const mockData = "0x12345678"

    const txHash = await result.current.sendTransaction(mockTo, mockData, initializedAccount.nexusClient)

    expect(txHash).toBe(mockTxHash)
    expect(mockNexusClient.sendTransaction).toHaveBeenCalledWith(expect.objectContaining({
      to: mockTo,
      data: mockData,
      chain: expect.any(Object) // baseSepolia
    }))
  })

  it("should handle transaction errors", async () => {
    const { useWallets } = require("@privy-io/react-auth")
    const { createSmartAccountClient, toNexusAccount } = require("@biconomy/abstractjs")

    const mockWallet = {
      address: mockWalletAddress,
      getEthereumProvider: jest.fn().mockResolvedValue(mockProvider)
    }

    useWallets.mockReturnValue({ wallets: [mockWallet] })

    const mockNexusClient = {
      account: { address: mockSmartAccountAddress },
      sendTransaction: jest.fn().mockRejectedValue(new Error("Transaction failed"))
    }

    toNexusAccount.mockResolvedValue({})
    createSmartAccountClient.mockReturnValue(mockNexusClient)

    const { result } = renderHook(() => useBiconomy())

    let initializedAccount: any
    await act(async () => {
      initializedAccount = await result.current.initializeBiconomyAccount()
    })

    const mockTo = "0x9876543210987654321098765432109876543210"
    const mockData = "0x12345678"

    await expect(result.current.sendTransaction(mockTo, mockData, initializedAccount.nexusClient)).rejects.toThrow("Transaction failed")
  })
})
