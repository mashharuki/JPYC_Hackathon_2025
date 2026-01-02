import { renderHook, waitFor } from "@testing-library/react"
import { Identity } from "@semaphore-protocol/core"
import useSemaphoreIdentity from "../useSemaphoreIdentity"
import { useRouter } from "next/navigation"

// モック
jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn()
}))

jest.mock("../../utils/supabase", () => ({
  supabase: {
    from: jest.fn()
  }
}))

jest.mock("next/navigation", () => ({
  useRouter: jest.fn()
}))

describe("useSemaphoreIdentity (Privy Integration)", () => {
  const mockUserId = "test-privy-user-id"
  const mockPrivateKey = "mock-private-key-base64"
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
  })

  it("should wait when Privy is not ready", () => {
    const { useAuth } = require("../../context/AuthContext")
    useAuth.mockReturnValue({
      user: null,
      ready: false
    })

    const { result } = renderHook(() => useSemaphoreIdentity())

    expect(result.current.loading).toBe(true)
    expect(result.current._identity).toBeUndefined()
  })

  it("should redirect to home when user is not authenticated", async () => {
    const { useAuth } = require("../../context/AuthContext")
    useAuth.mockReturnValue({
      user: null,
      ready: true
    })

    renderHook(() => useSemaphoreIdentity())

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })

  it("should fetch existing identity from Supabase when user is authenticated", async () => {
    const { useAuth } = require("../../context/AuthContext")
    const { supabase } = require("../../utils/supabase")

    useAuth.mockReturnValue({
      user: { id: mockUserId },
      ready: true
    })

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { private_key: mockPrivateKey },
          error: null
        })
      })
    })

    supabase.from.mockReturnValue({
      select: mockSelect
    })

    const { result } = renderHook(() => useSemaphoreIdentity())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current._identity).toBeInstanceOf(Identity)
    expect(mockSelect).toHaveBeenCalledWith("private_key")
  })

  it("should redirect when identity not found in Supabase", async () => {
    const { useAuth } = require("../../context/AuthContext")
    const { supabase } = require("../../utils/supabase")

    useAuth.mockReturnValue({
      user: { id: mockUserId },
      ready: true
    })

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
    })

    renderHook(() => useSemaphoreIdentity())

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })

  it("should handle Supabase errors gracefully", async () => {
    const { useAuth } = require("../../context/AuthContext")
    const { supabase } = require("../../utils/supabase")
    const mockError = new Error("Supabase connection error")

    useAuth.mockReturnValue({
      user: { id: mockUserId },
      ready: true
    })

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      })
    })

    const { result } = renderHook(() => useSemaphoreIdentity())

    await waitFor(() => {
      expect(result.current.error).toBe(mockError)
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })
})
