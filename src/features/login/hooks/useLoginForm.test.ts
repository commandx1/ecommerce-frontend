import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { LoginFormData } from "@/features/login/types"
import { useAuthStore } from "@/stores/authStore"
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

const fillAndSubmit = async (data: Partial<LoginFormData> = {}, options: { keepSignedIn?: boolean } = {}) => {
  const { result } = renderHook(() => useLoginForm())

  act(() => {
    result.current.handleChange({
      target: { name: "email", value: data.email ?? "buyer@example.com" },
    } as never)
    result.current.handleChange({
      target: { name: "password", value: data.password ?? "secret123" },
    } as never)
    if (options.keepSignedIn) {
      result.current.handleKeepSignedInChange(true)
    }
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
  localStorage.clear()
  useAuthStore.getState().clearAuth()
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

  // The /verify-2fa hop has no access to the login form's state - the "Keep me signed in" choice
  // has to survive the redirect as a query param, or a checked box would be silently forgotten
  // the moment 2FA is required.
  it("carries a checked 'Keep me signed in' box into the /verify-2fa link", async () => {
    mockLogin.mockResolvedValue({ twoFactorRequired: true })

    await fillAndSubmit(undefined, { keepSignedIn: true })

    await waitFor(() =>
      expect(getRouterMock().push).toHaveBeenCalledWith("/verify-2fa?email=buyer%40example.com&keepSignedIn=1"),
    )
  })

  it("omits keepSignedIn from the /verify-2fa link when the box is unchecked", async () => {
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

/**
 * Old code (`REMEMBER_ME_EMAIL_KEY` / `REMEMBER_ME_PASSWORD_KEY`) wrote the shopper's password to
 * `localStorage` in plaintext whenever "Remember me" was checked. The new "Keep me signed in"
 * only ever changes the `auth-storage` cookie's lifetime - it must never touch `localStorage`.
 */
describe("useLoginForm Keep me signed in cookie mode", () => {
  const successResponse = {
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
  }

  it("writes a persistent (expires) cookie when the box is checked at login", async () => {
    mockLogin.mockResolvedValue(successResponse)
    const setSpy = vi.spyOn(document, "cookie", "set")

    await fillAndSubmit(undefined, { keepSignedIn: true })

    const written = setSpy.mock.calls
      .map((call) => call[0] as string)
      .filter((call) => call.includes("auth-storage="))
      .at(-1)
    expect(written).toContain("expires=")
    expect(useAuthStore.getState().keepSignedIn).toBe(true)
  })

  it("writes a session-only (no expires) cookie when the box is left unchecked at login", async () => {
    mockLogin.mockResolvedValue(successResponse)
    const setSpy = vi.spyOn(document, "cookie", "set")

    await fillAndSubmit()

    const written = setSpy.mock.calls
      .map((call) => call[0] as string)
      .filter((call) => call.includes("auth-storage="))
      .at(-1)
    expect(written).not.toContain("expires=")
    expect(useAuthStore.getState().keepSignedIn).toBe(false)
  })

  it("never writes anything to localStorage on a successful login, checked or not", async () => {
    mockLogin.mockResolvedValue(successResponse)
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem")

    await fillAndSubmit(undefined, { keepSignedIn: true })

    expect(setItemSpy).not.toHaveBeenCalledWith("remembered_email", expect.anything())
    expect(setItemSpy).not.toHaveBeenCalledWith("remembered_password", expect.anything())
    expect(localStorage.getItem("remembered_email")).toBeNull()
    expect(localStorage.getItem("remembered_password")).toBeNull()
  })
})

describe("useLoginForm legacy remember-me cleanup", () => {
  it("deletes the legacy remembered_email/remembered_password keys on mount", () => {
    localStorage.setItem("remembered_email", "buyer@example.com")
    localStorage.setItem("remembered_password", "hunter2")

    renderHook(() => useLoginForm())

    expect(localStorage.getItem("remembered_email")).toBeNull()
    expect(localStorage.getItem("remembered_password")).toBeNull()
  })

  it("does not auto-fill the form from the legacy keys", () => {
    localStorage.setItem("remembered_email", "buyer@example.com")
    localStorage.setItem("remembered_password", "hunter2")

    const { result } = renderHook(() => useLoginForm())

    expect(result.current.formData).toEqual({ email: "", password: "" })
  })

  // Register stashes { email, password } in sessionStorage to auto-login once /verify-email
  // confirms the code. A shopper who registers and then abandons verification (closes the tab,
  // comes back later and goes straight to /login) must not leave that plaintext password sitting
  // in sessionStorage indefinitely.
  it("clears an abandoned register-to-verify-email auto-login password on mount", () => {
    sessionStorage.setItem(
      "verify_email_autologin_credentials",
      JSON.stringify({ email: "buyer@example.com", password: "hunter2" }),
    )

    renderHook(() => useLoginForm())

    expect(sessionStorage.getItem("verify_email_autologin_credentials")).toBeNull()
  })
})
