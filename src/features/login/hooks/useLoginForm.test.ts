import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { LoginFormData } from "@/features/login/types"
import { getRouterMock, setSearchParams } from "@/test/mocks/next-navigation"
import { useLoginForm } from "./useLoginForm"

const mockLogin = vi.fn()
vi.mock("@/features/login/services/login", () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}))

const mockToastInfo = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    info: (...args: unknown[]) => mockToastInfo(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    warning: (...args: unknown[]) => mockToastWarning(...args),
    success: vi.fn(),
  },
}))

const fillAndSubmit = async (data: Partial<LoginFormData> = {}) => {
  const { result } = renderHook(() => useLoginForm())

  act(() => {
    result.current.handleChange({
      target: { name: "email", value: data.email ?? "buyer@example.com" },
    } as never)
    result.current.handleChange({
      target: { name: "password", value: data.password ?? "secret123" },
    } as never)
  })

  await act(async () => {
    await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
  })

  return result
}

beforeEach(() => {
  mockLogin.mockReset()
  mockToastInfo.mockClear()
  mockToastError.mockClear()
  mockToastWarning.mockClear()
  setSearchParams()
})

describe("useLoginForm reason toast", () => {
  it("shows an info toast for reason=login-required", async () => {
    setSearchParams("reason=login-required")
    renderHook(() => useLoginForm())

    await waitFor(() =>
      expect(mockToastInfo).toHaveBeenCalledWith("Sign in to continue", "Please sign in to add products to your cart."),
    )
  })

  it("shows no toast for an unrecognised reason value", async () => {
    setSearchParams("reason=some-unknown-reason")
    renderHook(() => useLoginForm())

    // Give the deferred setTimeout(..., 0) a real chance to fire before asserting the negative.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(mockToastInfo).not.toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()
  })

  /**
   * The toast is deliberately deferred a tick (setTimeout(..., 0)) so the root layout's
   * <Toaster> has subscribed by the time it fires - a regression that fires it synchronously
   * would have sonner silently drop it. `hasShownAuthReasonToast` (a ref) must also survive a
   * re-render without firing a second time.
   */
  describe("defers the toast past the current tick, exactly once", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("does not fire synchronously on mount, but does after timers flush - and stays at one call across a re-render", () => {
      setSearchParams("reason=login-required")
      const { rerender } = renderHook(() => useLoginForm())

      expect(mockToastInfo).not.toHaveBeenCalled()

      vi.runAllTimers()
      expect(mockToastInfo).toHaveBeenCalledTimes(1)

      rerender()
      vi.runAllTimers()
      expect(mockToastInfo).toHaveBeenCalledTimes(1)
    })
  })
})

describe("useLoginForm 2FA redirect", () => {
  it("carries a valid redirect into the /verify-2fa link", async () => {
    setSearchParams("redirect=%2Fproducts%2Fabc")
    mockLogin.mockResolvedValue({ twoFactorRequired: true })

    await fillAndSubmit()

    await waitFor(() =>
      expect(getRouterMock().push).toHaveBeenCalledWith(
        "/verify-2fa?email=buyer%40example.com&redirect=%2Fproducts%2Fabc",
      ),
    )
  })

  it("omits redirect from the /verify-2fa link when none is present", async () => {
    mockLogin.mockResolvedValue({ twoFactorRequired: true })

    await fillAndSubmit()

    await waitFor(() => expect(getRouterMock().push).toHaveBeenCalledWith("/verify-2fa?email=buyer%40example.com"))
  })

  // The response-branch above resolves `{ twoFactorRequired: true }`; the real backend can also
  // signal 2FA by rejecting the login call instead (`err.requires2FA`) - both branches build the
  // /verify-2fa link the same way, and both must carry `redirect` through.
  it("carries a valid redirect into the /verify-2fa link on the thrown-error 2FA branch", async () => {
    setSearchParams("redirect=%2Fproducts%2Fabc")
    mockLogin.mockRejectedValue({ requires2FA: true })

    await fillAndSubmit()

    await waitFor(() =>
      expect(getRouterMock().push).toHaveBeenCalledWith(
        "/verify-2fa?email=buyer%40example.com&redirect=%2Fproducts%2Fabc",
      ),
    )
  })

  it("drops a hostile (tab-smuggled) redirect from the /verify-2fa link", async () => {
    setSearchParams("redirect=%2F%09%2Fevil.com")
    mockLogin.mockResolvedValue({ twoFactorRequired: true })

    await fillAndSubmit()

    await waitFor(() => expect(getRouterMock().push).toHaveBeenCalledWith("/verify-2fa?email=buyer%40example.com"))
  })
})

describe("useLoginForm post-login redirect safety", () => {
  it("pushes / on a plain successful login when the redirect is a hostile tab-smuggled value", async () => {
    setSearchParams("redirect=%2F%09%2Fevil.com")
    mockLogin.mockResolvedValue({
      id: "1",
      name: "Buyer",
      surname: "One",
      email: "buyer@example.com",
      phoneNumber: "555",
      emailConfirmed: true,
      phoneNumberConfirmed: true,
      twoFactorEnabled: false,
      lockoutEnd: null,
      createdDate: "2026-01-01",
      roleName: "BUYER",
      accessToken: "access-1",
      refreshToken: "refresh-1",
    })

    await fillAndSubmit()

    await waitFor(() => expect(getRouterMock().push).toHaveBeenCalledWith("/"))
  })
})
