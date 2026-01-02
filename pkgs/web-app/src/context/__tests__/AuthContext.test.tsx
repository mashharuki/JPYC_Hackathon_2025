import { render, screen, waitFor } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import { AuthProvider, useAuth } from "../AuthContext"
import { usePrivy } from "@privy-io/react-auth"

// Privyのモック
jest.mock("@privy-io/react-auth", () => ({
  usePrivy: jest.fn()
}))

const mockUsePrivy = usePrivy as jest.MockedFunction<typeof usePrivy>

describe("AuthContext (Privy対応)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("useAuth hook", () => {
    it("AuthProvider外で使用するとエラーをスローする", () => {
      // コンソールエラーを抑制
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow("useAuth must be used within an AuthProvider")

      consoleSpy.mockRestore()
    })
  })

  describe("AuthProvider", () => {
    it("Privy未認証の状態を正しく提供する", () => {
      mockUsePrivy.mockReturnValue({
        user: null,
        ready: true,
        authenticated: false,
        login: jest.fn(),
        logout: jest.fn()
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      expect(result.current.user).toBeNull()
      expect(result.current.ready).toBe(true)
      expect(result.current.authenticated).toBe(false)
    })

    it("Privy認証済みの状態を正しく提供する", () => {
      const mockUser = {
        id: "test-privy-user-id",
        wallet: {
          address: "0x1234567890abcdef1234567890abcdef12345678"
        }
      }

      mockUsePrivy.mockReturnValue({
        user: mockUser,
        ready: true,
        authenticated: true,
        login: jest.fn(),
        logout: jest.fn()
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.ready).toBe(true)
      expect(result.current.authenticated).toBe(true)
    })

    it("login関数を正しく提供する", () => {
      const mockLogin = jest.fn()

      mockUsePrivy.mockReturnValue({
        user: null,
        ready: true,
        authenticated: false,
        login: mockLogin,
        logout: jest.fn()
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      result.current.login()

      expect(mockLogin).toHaveBeenCalledTimes(1)
    })

    it("logout関数を正しく提供する", async () => {
      const mockLogout = jest.fn().mockResolvedValue(undefined)

      mockUsePrivy.mockReturnValue({
        user: {
          id: "test-user-id"
        },
        ready: true,
        authenticated: true,
        login: jest.fn(),
        logout: mockLogout
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await result.current.logout()

      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it("Privy初期化中（ready=false）の状態を正しく提供する", () => {
      mockUsePrivy.mockReturnValue({
        user: null,
        ready: false,
        authenticated: false,
        login: jest.fn(),
        logout: jest.fn()
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      expect(result.current.ready).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.authenticated).toBe(false)
    })
  })
})
