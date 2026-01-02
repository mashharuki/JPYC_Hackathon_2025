import "@testing-library/jest-dom"
import { render, screen, waitFor } from "@testing-library/react"
import IdentitiesPage from "../page"

// モック
jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn()
}))

jest.mock("../../context/LogContext", () => ({
  useLogContext: jest.fn()
}))

jest.mock("../../utils/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}))

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}))

jest.mock("../../components/Auth", () => {
  return function Auth() {
    return <div>Auth Component</div>
  }
})

jest.mock("../../components/Stepper", () => {
  return function Stepper() {
    return <div>Stepper Component</div>
  }
})

describe("IdentitiesPage (Privy Integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useLogContext } = require("../../context/LogContext")
    useLogContext.mockReturnValue({
      setLog: jest.fn()
    })
  })

  it("should show Auth component when user is not authenticated", () => {
    const { useAuth } = require("../../context/AuthContext")
    useAuth.mockReturnValue({
      user: null,
      ready: true,
      authenticated: false,
      login: jest.fn(),
      logout: jest.fn()
    })

    render(<IdentitiesPage />)

    expect(screen.getByText("Auth Component")).toBeInTheDocument()
  })

  it("should show logout button when user is authenticated", async () => {
    const { useAuth } = require("../../context/AuthContext")
    const { useLogContext } = require("../../context/LogContext")
    const mockSetLog = jest.fn()
    useLogContext.mockReturnValue({
      setLog: mockSetLog
    })
    const mockLogout = jest.fn()
    useAuth.mockReturnValue({
      user: { id: "test-privy-user-id" },
      ready: true,
      authenticated: true,
      login: jest.fn(),
      logout: mockLogout
    })

    render(<IdentitiesPage />)

    const logoutButton = screen.getByRole("button", { name: /logout/i })
    expect(logoutButton).toBeInTheDocument()

    await waitFor(() => {
      expect(mockSetLog).toHaveBeenCalledWith("Identity not found for this account. Create a new one below! 👇🏽")
    })
  })

  it("should call logout when logout button is clicked", async () => {
    const { useAuth } = require("../../context/AuthContext")
    const { useLogContext } = require("../../context/LogContext")
    const mockSetLog = jest.fn()
    useLogContext.mockReturnValue({
      setLog: mockSetLog
    })
    const mockLogout = jest.fn()
    useAuth.mockReturnValue({
      user: { id: "test-privy-user-id" },
      ready: true,
      authenticated: true,
      login: jest.fn(),
      logout: mockLogout
    })

    render(<IdentitiesPage />)

    await waitFor(() => {
      expect(mockSetLog).toHaveBeenCalledWith("Identity not found for this account. Create a new one below! 👇🏽")
    })

    const logoutButton = screen.getByRole("button", { name: /logout/i })
    logoutButton.click()

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  it("should show loading indicator when Privy is not ready", () => {
    const { useAuth } = require("../../context/AuthContext")
    useAuth.mockReturnValue({
      user: null,
      ready: false,
      authenticated: false,
      login: jest.fn(),
      logout: jest.fn()
    })

    render(<IdentitiesPage />)

    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})
