import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { useDashboardAuthGuard } from "./useDashboardAuthGuard"

// Covers design doc §4.3 rows 1, 3, 7 and 13 (status transitions) as a `renderHook` complement
// to the layout characterization suites, which cover the full 13-row matrix through the
// rendered component. See `src/app/buyer-dashboard/layout.test.tsx` for why storage seeding
// must happen AFTER `setStoreState` whenever the two need to disagree (persist write-through).

const COOKIE_NAME = "auth-storage"

interface StoredUser {
  id: string
  name: string
  surname: string
  email: string
  phoneNumber: string
  emailConfirmed: boolean
  phoneNumberConfirmed: boolean
  twoFactorEnabled: boolean
  lockoutEnd: string | null
  createdDate: string
  roleName?: string
}

const buyerUser: StoredUser = {
  id: "buyer-1",
  name: "Bea",
  surname: "Buyer",
  email: "buyer@example.com",
  phoneNumber: "+15551234567",
  emailConfirmed: true,
  phoneNumberConfirmed: true,
  twoFactorEnabled: false,
  lockoutEnd: null,
  createdDate: "2026-01-01T00:00:00Z",
  roleName: "Dentist",
}

function persistedEnvelope(user: StoredUser | null, isAuthenticated: boolean): string {
  return JSON.stringify({
    state: {
      user,
      accessToken: isAuthenticated ? "access" : null,
      refreshToken: isAuthenticated ? "refresh" : null,
      isAuthenticated,
      isAdminImpersonating: false,
    },
    version: 0,
  })
}

function seedSession(raw: string): void {
  sessionStorage.setItem(COOKIE_NAME, raw)
}

function clearAuthStorage(): void {
  sessionStorage.removeItem(COOKIE_NAME)
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

function setStoreState(user: StoredUser | null, isAuthenticated: boolean): void {
  useAuthStore.setState({
    user,
    isAuthenticated,
    accessToken: isAuthenticated ? "access" : null,
    refreshToken: isAuthenticated ? "refresh" : null,
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  clearAuthStorage()
})

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers()
  })
  vi.useRealTimers()
  clearAuthStorage()
})

describe("useDashboardAuthGuard", () => {
  it("row 1: checking, then authorized at 100ms, no push", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    const { result } = renderHook(() => useDashboardAuthGuard("buyer"))

    expect(result.current.status).toBe("checking")

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.status).toBe("authorized")
    expect(getRouterMock().push).not.toHaveBeenCalled()
  })

  it("row 3: store user stays null at 100ms -> stays checking, pushes /login", () => {
    setStoreState(null, false)
    seedSession(persistedEnvelope(buyerUser, true))

    const { result } = renderHook(() => useDashboardAuthGuard("buyer"))
    expect(result.current.status).toBe("checking")

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    // The hydration-miss branch redirects without ever flipping `isChecking` - matches the
    // pre-extraction layout, which stays on its skeleton until the navigation actually lands.
    expect(result.current.status).toBe("checking")
  })

  it("row 7: authorized, then logout -> unauthorized, skeleton render for buyer", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    const { result } = renderHook(() => useDashboardAuthGuard("buyer"))
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current.status).toBe("authorized")

    act(() => {
      useAuthStore.getState().clearAuth()
    })

    expect(result.current.status).toBe("unauthorized")
    expect(result.current.unauthorizedRender).toBe("skeleton")
    expect(getRouterMock().push).toHaveBeenCalledWith("/")
  })

  it("row 13: effect re-run on store change reads the cookie once per run", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    const spy = vi.spyOn(tabSessionStorage, "getItem")

    renderHook(() => useDashboardAuthGuard("buyer"))
    expect(spy).toHaveBeenCalledTimes(1)

    act(() => {
      setStoreState({ ...buyerUser }, true)
    })
    expect(spy).toHaveBeenCalledTimes(2)

    spy.mockRestore()
  })

  it("row 7 (vendor): authorized, then logout -> unauthorized, renders nothing", () => {
    const vendorUser: StoredUser = { ...buyerUser, id: "vendor-1", roleName: "Vendor" }
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(vendorUser, true))

    const { result } = renderHook(() => useDashboardAuthGuard("vendor"))
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current.status).toBe("authorized")

    act(() => {
      useAuthStore.getState().clearAuth()
    })

    expect(result.current.status).toBe("unauthorized")
    expect(result.current.unauthorizedRender).toBe("nothing")
    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
  })
})
