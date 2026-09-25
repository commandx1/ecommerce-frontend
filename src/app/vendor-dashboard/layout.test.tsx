import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"
import { getRouterMock } from "@/test/mocks/next-navigation"
import VendorDashboardLayout from "./layout"

// Characterization suite (design doc Phase 4 §4.3, step G1) for today's `layout.tsx` guard,
// BEFORE any extraction. Stays unmodified once the guard moves to `useDashboardAuthGuard` (G2) -
// it is the oracle proving the extraction is behaviour-preserving. See the buyer layout's
// `layout.test.tsx` for why every mismatched-cookie-vs-store row sets the store FIRST and seeds
// storage LAST (persist write-through keeps them in sync otherwise).
//
// Vendor has no `wasAuthenticatedRef`: a hydration-miss always targets `/buyer-dashboard`, and
// an unauthenticated store always targets `/login` - no "was authenticated" branch to pin.

vi.mock("@/features/vendor-dashboard/shell/VendorHeader", () => ({
  default: () => <div data-testid="vendor-header" />,
}))
vi.mock("@/features/vendor-dashboard/shell/VendorSidebar", () => ({
  default: () => <div data-testid="vendor-sidebar" />,
}))
vi.mock("@/features/vendor-dashboard/shell/ImpersonationTabTitle", () => ({
  default: () => <div data-testid="impersonation-tab-title" />,
}))
vi.mock("@/features/notifications/components/NotificationSocketBridge", () => ({
  default: () => <div data-testid="notification-bridge" />,
}))
vi.mock("@/features/vendor-dashboard/shell/CompanyRoleContext", () => ({
  CompanyRoleProvider: ({ children }: { children: React.ReactNode }) => children,
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

const vendorUser: StoredUser = {
  id: "vendor-1",
  name: "Vince",
  surname: "Vendor",
  email: "vendor@example.com",
  phoneNumber: "+15551234567",
  emailConfirmed: true,
  phoneNumberConfirmed: true,
  twoFactorEnabled: false,
  lockoutEnd: null,
  createdDate: "2026-01-01T00:00:00Z",
  roleName: "Vendor",
}

const buyerUser: StoredUser = { ...vendorUser, id: "buyer-1", roleName: "Dentist" }

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

function skeletonVisible(): boolean {
  return screen.queryByRole("heading", { name: "Loading Vendor Dashboard" }) !== null
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

describe("VendorDashboardLayout guard (characterization)", () => {
  it("row 1: cookie right role + store right role - skeleton, then children at 100ms, no push before", () => {
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(vendorUser, true))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

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
    seedSession(persistedEnvelope(buyerUser, true))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/buyer-dashboard")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 3: cookie right role, store user stays null at 100ms -> /buyer-dashboard", () => {
    setStoreState(null, false)
    seedSession(persistedEnvelope(vendorUser, true))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)
    expect(getRouterMock().push).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/buyer-dashboard")
  })

  it("row 4: as row 3 but was authenticated earlier this mount -> still /buyer-dashboard (no wasAuth concept)", () => {
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(vendorUser, true))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

    act(() => {
      vi.advanceTimersByTime(10)
      setStoreState(null, false)
      vi.advanceTimersByTime(90)
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/buyer-dashboard")
  })

  it("row 5: cookie right role, store already has the wrong role by the 100ms check", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(vendorUser, true))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)
    expect(getRouterMock().push).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/buyer-dashboard")
  })

  it("row 6: no cookie, store unauthenticated -> immediate push to /login", () => {
    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 7: authorized, then logout (store cleared, cookie re-persisted empty) -> /login, renders nothing", () => {
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(vendorUser, true))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(childrenVisible()).toBe(true)

    act(() => {
      useAuthStore.getState().clearAuth()
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    expect(skeletonVisible()).toBe(false)
    expect(childrenVisible()).toBe(false)
  })

  it("row 8: no cookie, store wrong role -> immediate cross-role push", () => {
    setStoreState(buyerUser, true)
    clearAuthStorage()

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/buyer-dashboard")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 9: no cookie, store right role -> children immediately, no timer", () => {
    setStoreState(vendorUser, true)
    clearAuthStorage()

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

    expect(childrenVisible()).toBe(true)
    expect(getRouterMock().push).not.toHaveBeenCalled()
  })

  it("row 10: cookie present but isAuthenticated:false -> falls through to the store branch", () => {
    setStoreState(null, false)
    seedSession(persistedEnvelope(vendorUser, false))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })

  it("row 11: URI-encoded cookie JSON -> vendor decodes it and uses the cookie branch", () => {
    setStoreState(null, false)
    seedSession(encodeURIComponent(persistedEnvelope(vendorUser, true)))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

    // Decoded successfully: right role -> the setTimeout branch, not an immediate store-branch push.
    expect(getRouterMock().push).not.toHaveBeenCalled()
    expect(skeletonVisible()).toBe(true)
  })

  it("row 12: getItem throws -> store branch, no crash", () => {
    setStoreState(null, false)
    const spy = vi.spyOn(tabSessionStorage, "getItem").mockImplementation(() => {
      throw new Error("boom")
    })

    expect(() => render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)).not.toThrow()

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    spy.mockRestore()
  })

  it("row 13: effect re-run on store change reads the cookie once per run", () => {
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(vendorUser, true))

    const spy = vi.spyOn(tabSessionStorage, "getItem")

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)
    expect(spy).toHaveBeenCalledTimes(1)

    act(() => {
      setStoreState({ ...vendorUser }, true)
    })
    expect(spy).toHaveBeenCalledTimes(2)

    spy.mockRestore()
  })

  it("garbage (non-JSON) cookie also falls to the store branch without crashing", () => {
    setStoreState(null, false)
    seedSession("not-json{{{")

    expect(() => render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)).not.toThrow()
    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
  })

  it("G3: logout inside the 100ms window pushes exactly once (design doc §9 D3: today this pushes /login, then a stale /buyer-dashboard)", () => {
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(vendorUser, true))

    render(<VendorDashboardLayout>{children}</VendorDashboardLayout>)

    // A real logout mid-window re-runs the effect (immediate push to "/login") while the
    // original 100ms hydration timer from the first run is still pending. Uncleared, that
    // timer's hydration-miss branch also fires later and pushes "/buyer-dashboard" - the G3 fix
    // clears it on effect cleanup.
    act(() => {
      vi.advanceTimersByTime(10)
      useAuthStore.getState().clearAuth()
    })
    act(() => {
      vi.advanceTimersByTime(90)
    })

    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
  })
})
