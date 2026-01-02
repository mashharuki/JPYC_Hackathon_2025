import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import Auth from "../Auth"

// Privyのモック
jest.mock("@privy-io/react-auth", () => ({
  usePrivy: jest.fn(() => ({
    login: jest.fn(),
    ready: true,
    authenticated: false
  }))
}))

describe("Auth Component (Privy Integration)", () => {
  it("should render login button with Privy", () => {
    render(<Auth />)

    // Privyのログインボタンが表示されることを確認
    const loginButton = screen.getByRole("button", { name: /login with privy/i })
    expect(loginButton).toBeInTheDocument()
  })

  it("should call login function when button is clicked", () => {
    const mockLogin = jest.fn()
    const { usePrivy } = require("@privy-io/react-auth")
    usePrivy.mockReturnValue({
      login: mockLogin,
      ready: true,
      authenticated: false
    })

    render(<Auth />)

    const loginButton = screen.getByRole("button", { name: /login with privy/i })
    loginButton.click()

    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it("should be disabled when Privy is not ready", () => {
    const { usePrivy } = require("@privy-io/react-auth")
    usePrivy.mockReturnValue({
      login: jest.fn(),
      ready: false,
      authenticated: false
    })

    render(<Auth />)

    const loginButton = screen.getByRole("button", { name: /loading/i })
    expect(loginButton).toBeDisabled()
  })
})
