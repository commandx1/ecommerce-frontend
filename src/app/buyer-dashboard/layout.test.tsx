import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"
import { getRouterMock } from "@/test/mocks/next-navigation"
import BuyerDashboardLayout from "./layout"

// Characterization suite (design doc Phase 4 §4.3, step G1) for today's `layout.tsx` guard,
// BEFORE any extraction. Stays unmodified once the guard moves to `useDashboardAuthGuard` (G2) -
// it is the oracle proving the extraction is behaviour-preserving.
//
// `useAuthStore` is configured with `persist(..., { storage: tabSessionStorage })`, so ANY
// `useAuthStore.setState(...)` write-throughs to session/cookie storage synchronously, keeping
// them in sync with the store. To set up a scenario where the cookie and the store DISAGREE
// (the whole point of most of these rows - the guard reads the cookie first, the store only
// after the hydration wait), every test that needs a mismatch sets the store FIRST and then
// seeds storage with the desired (different) cookie content LAST, so the explicit seed is the
// value still on disk when the effect reads it. Rows that need the store to change again AFTER
// render (row 4) accept that the change also re-persists a matching cookie and can trigger a
// second, immediate effect run - documented inline where it applies.

vi.mock("@/features/buyer-dashboard/shell/BuyerHeader", () => ({ default: () => <div data-testid="buyer-header" /> }))
vi.mock("@/features/buyer-dashboard/shell/BuyerSidebar", () => ({ default: () => <div data-testid="buyer-sidebar" /> }))
vi.mock("@/features/notifications/components/NotificationSocketBridge", () => ({
  default: () => <div data-testid="notification-bridge" />,
}))

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

const vendorUser: StoredUser = { ...buyerUser, id: "vendor-1", roleName: "Vendor" }

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

/** Seeds the raw string `tabSessionStorage.getItem(COOKIE_NAME)` will return - a real browser
 * tab never sees anything else, so seeding `sessionStorage` directly is the correct seam. Call
 * this AFTER any `setStoreState` in the same test when the two must disagree. */
function seedSession(raw: string): void {
  sessionStorage.setItem(COOKIE_NAME, raw)
}

function clearAuthStorage(): void {
  sessionStorage.removeItem(COOKIE_NAME)
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/** Sets the store directly. Note: this ALSO write-throughs to storage (see file header). */
function setStoreState(user: StoredUser | null, isAuthenticated: boolean): void {
  useAuthStore.setState({
    user,
    isAuthenticated,
    accessToken: isAuthenticated ? "access" : null,
    refreshToken: isAuthenticated ? "refresh" : null,
  })
}

function skeletonVisible(): boolean {
  return screen.queryByRole("heading", { name: "Buyer Dashboard" }) !== null
}

const CHILDREN_TESTID = "dashboard-children"
function childrenVisible(): boolean {
  return screen.queryByTestId(CHILDREN_TESTID) !== null
}

const children = <div data-testid={CHILDREN_TESTID}>content</div>

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

describe("BuyerDashboardLayout guard (characterization)", () => {
  it("row 1: cookie right role + store right role - skeleton, then children at 100ms, no push before", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    expect(skeletonVisible()).toBe(true)
    expect(childrenVisible()).toBe(false)

    act(() => {
      vi.advanceTimersByTime(99)
    })
    expect(skeletonVisible()).toBe(true)
    expect(getRouterMock().push).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(childrenVisible()).toBe(true)
    expect(getRouterMock().push).not.toHaveBeenCalled()
  })

  it("row 2: cookie wrong role - immediate push to the cross-role target, no timer", () => {
    setStoreState(null, false)
    seedSession(persistedEnvelope(vendorUser, true))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/vendor-dashboard")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 3: cookie right role, store user stays null at 100ms, never authed this mount -> /login", () => {
    setStoreState(null, false)
    seedSession(persistedEnvelope(buyerUser, true))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)
    expect(getRouterMock().push).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
  })

  it("row 4: as row 3 but was authed earlier this mount -> /", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    // Logging out mid-window also re-persists {user:null} over the cookie (see file header),
    // which can fire a second, immediate effect run in addition to the original 100ms timer -
    // both read `wasAuthenticatedRef.current` as true and push the same target, so the
    // characterization only pins the eventual result, not which of the two pushed it.
    act(() => {
      vi.advanceTimersByTime(10)
      setStoreState(null, false)
      vi.advanceTimersByTime(90)
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/")
  })

  it("row 5: cookie right role, store already has the wrong role by the 100ms check", () => {
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)
    expect(getRouterMock().push).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/vendor-dashboard")
  })

  it("row 6: no cookie, store unauthenticated -> immediate push, wasAuth false -> /login", () => {
    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 7: authorized, then logout (store cleared, cookie re-persisted empty) -> / and skeleton renders", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(childrenVisible()).toBe(true)

    act(() => {
      useAuthStore.getState().clearAuth()
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/")
    expect(skeletonVisible()).toBe(true)
    expect(childrenVisible()).toBe(false)
  })

  it("row 8: no cookie, store wrong role -> immediate cross-role push", () => {
    setStoreState(vendorUser, true)
    clearAuthStorage()

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/vendor-dashboard")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 9: no cookie, store right role -> children immediately, no timer", () => {
    setStoreState(buyerUser, true)
    clearAuthStorage()

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    expect(childrenVisible()).toBe(true)
    expect(getRouterMock().push).not.toHaveBeenCalled()
  })

  it("row 10: cookie present but isAuthenticated:false -> falls through to the store branch", () => {
    setStoreState(null, false)
    seedSession(persistedEnvelope(buyerUser, false))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 11: URI-encoded cookie JSON -> buyer does not decode, falls to the store branch", () => {
    setStoreState(null, false)
    seedSession(encodeURIComponent(persistedEnvelope(buyerUser, true)))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 12: getItem throws -> store branch, no crash", () => {
    setStoreState(null, false)
    const spy = vi.spyOn(tabSessionStorage, "getItem").mockImplementation(() => {
      throw new Error("boom")
    })

    expect(() => render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)).not.toThrow()

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    spy.mockRestore()
  })

  it("row 13: effect re-run on store change reads the cookie once per run", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    const spy = vi.spyOn(tabSessionStorage, "getItem")

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)
    expect(spy).toHaveBeenCalledTimes(1)

    act(() => {
      setStoreState({ ...buyerUser }, true)
    })
    expect(spy).toHaveBeenCalledTimes(2)

    spy.mockRestore()
  })

  it("garbage (non-JSON) cookie also falls to the store branch without crashing", () => {
    setStoreState(null, false)
    seedSession("not-json{{{")

    expect(() => render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)).not.toThrow()
    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
  })

  it("G3: logout inside the 100ms window pushes exactly once, not once from the immediate branch and once from the stale timer", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))

    render(<BuyerDashboardLayout>{children}</BuyerDashboardLayout>)

    // A real logout mid-window re-runs the effect (immediate push, wasAuth true -> "/") while
    // the original 100ms hydration timer from the first run is still pending. Uncleared, that
    // timer also fires later and pushes again - the G3 fix clears it on effect cleanup.
    act(() => {
      vi.advanceTimersByTime(10)
      useAuthStore.getState().clearAuth()
    })
    act(() => {
      vi.advanceTimersByTime(90)
    })

    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
    expect(getRouterMock().push).toHaveBeenCalledWith("/")
  })
})
