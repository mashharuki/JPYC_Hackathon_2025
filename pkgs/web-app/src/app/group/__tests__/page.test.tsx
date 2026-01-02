import "@testing-library/jest-dom"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import GroupsPage from "../page"

// モック
jest.mock("../../../context/LogContext", () => ({
  useLogContext: jest.fn(() => ({
    setLog: jest.fn()
  }))
}))

jest.mock("../../../context/SemaphoreContext", () => ({
  useSemaphoreContext: jest.fn()
}))

jest.mock("../../../hooks/useSemaphoreIdentity", () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock("../../../hooks/useBiconomy", () => ({
  useBiconomy: jest.fn()
}))

jest.mock("viem", () => ({
  ...jest.requireActual("viem"),
  createPublicClient: jest.fn(() => ({
    waitForTransactionReceipt: jest.fn().mockResolvedValue({ status: "success" })
  })),
  http: jest.fn(),
  encodeFunctionData: jest.fn().mockReturnValue("0xencoded")
}))

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}))

jest.mock("react-hot-toast", () => {
  const toast = {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn()
  }
  return {
    __esModule: true,
    default: toast,
    toast
  }
})

describe("GroupsPage (AA Integration)", () => {
  const mockIdentity = {
    commitment: BigInt("12345678901234567890")
  }

  const mockUsers = ["11111111111111111111", "22222222222222222222"]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("should render the page with group information", () => {
    const { useSemaphoreContext } = require("../../../context/SemaphoreContext")
    const useSemaphoreIdentity = require("../../../hooks/useSemaphoreIdentity").default
    const { useBiconomy } = require("../../../hooks/useBiconomy")

    useSemaphoreContext.mockReturnValue({
      _users: mockUsers,
      refreshUsers: jest.fn(),
      addUser: jest.fn()
    })

    useSemaphoreIdentity.mockReturnValue({
      _identity: mockIdentity,
      loading: false
    })

    useBiconomy.mockReturnValue({
      smartAccount: null,
      address: null,
      isLoading: false,
      error: null,
      initializeBiconomyAccount: jest.fn(),
      sendTransaction: jest.fn()
    })

    render(<GroupsPage />)

    expect(screen.getByText("Groups")).toBeInTheDocument()
    expect(screen.getByText(`Group users (${mockUsers.length})`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /join the feedback group/i })).toBeInTheDocument()
  })

  it("should join group using Biconomy AA", async () => {
    const { useSemaphoreContext } = require("../../../context/SemaphoreContext")
    const useSemaphoreIdentity = require("../../../hooks/useSemaphoreIdentity").default
    const { useBiconomy } = require("../../../hooks/useBiconomy")
    const toast = require("react-hot-toast").toast

    const mockAddUser = jest.fn()
    const mockRefreshUsers = jest.fn().mockResolvedValue([...mockUsers, mockIdentity.commitment.toString()])
    const mockInitializeBiconomy = jest.fn().mockResolvedValue({
      nexusClient: {},
      address: "0xtest"
    })
    const mockSendTransaction = jest.fn().mockResolvedValue("0xtxhash")

    useSemaphoreContext.mockReturnValue({
      _users: mockUsers,
      refreshUsers: mockRefreshUsers,
      addUser: mockAddUser
    })

    useSemaphoreIdentity.mockReturnValue({
      _identity: mockIdentity,
      loading: false
    })

    useBiconomy.mockReturnValue({
      smartAccount: null,
      address: null,
      isLoading: false,
      error: null,
      initializeBiconomyAccount: mockInitializeBiconomy,
      sendTransaction: mockSendTransaction
    })

    render(<GroupsPage />)

    const joinButton = screen.getByRole("button", { name: /join the feedback group/i })
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(mockInitializeBiconomy).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockSendTransaction).toHaveBeenCalled()
    })

    await act(async () => {
      jest.advanceTimersByTime(3000)
    })

    await waitFor(() => {
      expect(mockRefreshUsers).toHaveBeenCalled()
    })

    expect(toast.success).toHaveBeenCalled()
  })

  it("should handle join group errors gracefully", async () => {
    const { useSemaphoreContext } = require("../../../context/SemaphoreContext")
    const useSemaphoreIdentity = require("../../../hooks/useSemaphoreIdentity").default
    const { useBiconomy } = require("../../../hooks/useBiconomy")
    const toast = require("react-hot-toast").toast

    const mockInitializeBiconomy = jest.fn().mockRejectedValue(new Error("Biconomy initialization failed"))

    useSemaphoreContext.mockReturnValue({
      _users: mockUsers,
      refreshUsers: jest.fn(),
      addUser: jest.fn()
    })

    useSemaphoreIdentity.mockReturnValue({
      _identity: mockIdentity,
      loading: false
    })

    useBiconomy.mockReturnValue({
      smartAccount: null,
      address: null,
      isLoading: false,
      error: null,
      initializeBiconomyAccount: mockInitializeBiconomy,
      sendTransaction: jest.fn()
    })

    render(<GroupsPage />)

    const joinButton = screen.getByRole("button", { name: /join the feedback group/i })
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it("should disable join button when user has already joined", () => {
    const { useSemaphoreContext } = require("../../../context/SemaphoreContext")
    const useSemaphoreIdentity = require("../../../hooks/useSemaphoreIdentity").default
    const { useBiconomy } = require("../../../hooks/useBiconomy")

    const usersWithIdentity = [...mockUsers, mockIdentity.commitment.toString()]

    useSemaphoreContext.mockReturnValue({
      _users: usersWithIdentity,
      refreshUsers: jest.fn(),
      addUser: jest.fn()
    })

    useSemaphoreIdentity.mockReturnValue({
      _identity: mockIdentity,
      loading: false
    })

    useBiconomy.mockReturnValue({
      smartAccount: null,
      address: null,
      isLoading: false,
      error: null,
      initializeBiconomyAccount: jest.fn(),
      sendTransaction: jest.fn()
    })

    render(<GroupsPage />)

    const joinButton = screen.getByRole("button", { name: /join the feedback group/i })
    expect(joinButton).toBeDisabled()
  })
})
