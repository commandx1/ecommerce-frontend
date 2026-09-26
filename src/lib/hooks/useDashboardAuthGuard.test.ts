import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { CROSS_ROLE_REDIRECT_LIMIT, useDashboardAuthGuard } from "./useDashboardAuthGuard"

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
  // biome-ignore lint/suspicious/noDocumentCookie: test cleanup for the cookieStorage-backed auth cookie
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

describe("useDashboardAuthGuard - cross-tab safety", () => {
  const vendorUser: StoredUser = { ...buyerUser, id: "vendor-1", roleName: "Vendor" }

  /** What the shared cookie holds right now (decoded), i.e. what the proxy would judge by. */
  const sharedCookie = (): string | null => {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1)
    return raw ? decodeURIComponent(raw) : null
  }

  /** Simulates a sibling tab (different account) writing the shared cookie. */
  const siblingWritesCookie = (raw: string): void => {
    // biome-ignore lint/suspicious/noDocumentCookie: simulating another tab's cookieStorage write
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(raw)}; path=/`
  }

  it("scenario B: a vendor tab that landed on the buyer dashboard is sent back with ITS OWN cookie", () => {
    const vendorSession = persistedEnvelope(vendorUser, true)
    setStoreState(vendorUser, true)
    seedSession(vendorSession)
    // The proxy redirected this tab here because a focused buyer tab owned the cookie.
    siblingWritesCookie(persistedEnvelope(buyerUser, true))

    const cookieAtPush: Array<string | null> = []
    getRouterMock().push.mockImplementation(() => {
      cookieAtPush.push(sharedCookie())
    })

    renderHook(() => useDashboardAuthGuard("buyer"))

    expect(getRouterMock().push).toHaveBeenCalledWith("/vendor-dashboard")
    // The proxy will judge that navigation by this tab's vendor account, so it lets it through
    // instead of bouncing it straight back to /buyer-dashboard.
    expect(cookieAtPush).toEqual([vendorSession])
  })

  it("re-points the cookie at this tab right before a delayed (post-hydration) redirect", () => {
    // Session says buyer, but the store never hydrates a user -> the 100ms timer redirects.
    setStoreState(null, false)
    const ownSession = persistedEnvelope(buyerUser, true)
    seedSession(ownSession)

    const cookieAtPush: Array<string | null> = []
    getRouterMock().push.mockImplementation(() => {
      cookieAtPush.push(sharedCookie())
    })

    renderHook(() => useDashboardAuthGuard("buyer"))
    // A sibling tab takes the cookie during the hydration wait.
    siblingWritesCookie(persistedEnvelope(vendorUser, true))

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/login")
    expect(cookieAtPush).toEqual([ownSession])
  })

  it("never adopts a sibling's account from the cookie: a buyer tab stays a buyer while the cookie says vendor", () => {
    setStoreState(buyerUser, true)
    seedSession(persistedEnvelope(buyerUser, true))
    siblingWritesCookie(persistedEnvelope(vendorUser, true))

    const { result } = renderHook(() => useDashboardAuthGuard("buyer"))
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.status).toBe("authorized")
    expect(getRouterMock().push).not.toHaveBeenCalled()
    expect(useAuthStore.getState().user?.roleName).toBe("Dentist")
  })

  it("a tab whose redirect was bounced back re-checks when it is shown again", () => {
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(vendorUser, true))
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")

    renderHook(() => useDashboardAuthGuard("buyer"))
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)

    // The navigation was bounced (a sibling rewrote the cookie in between): the layout is still
    // mounted and nothing in the store changed. Being hidden, focus-less events do nothing...
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)

    // ...but once the user looks at the tab, the guard tries again.
    visibility.mockReturnValue("visible")
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(getRouterMock().push).toHaveBeenCalledTimes(2)
    expect(getRouterMock().push).toHaveBeenLastCalledWith("/vendor-dashboard")
    visibility.mockRestore()
  })

  it("caps buyer <-> vendor ping-pong, and showing the tab again re-arms it", () => {
    setStoreState(vendorUser, true)
    seedSession(persistedEnvelope(vendorUser, true))
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible")

    // Each bounce remounts a dashboard layout (the other one in a real ping-pong).
    for (let hop = 0; hop < CROSS_ROLE_REDIRECT_LIMIT + 2; hop++) {
      const { unmount } = renderHook(() => useDashboardAuthGuard("buyer"))
      unmount()
    }
    expect(getRouterMock().push).toHaveBeenCalledTimes(CROSS_ROLE_REDIRECT_LIMIT)

    const { unmount } = renderHook(() => useDashboardAuthGuard("buyer"))
    expect(getRouterMock().push).toHaveBeenCalledTimes(CROSS_ROLE_REDIRECT_LIMIT)
    act(() => {
      window.dispatchEvent(new Event("focus"))
    })
    expect(getRouterMock().push).toHaveBeenCalledTimes(CROSS_ROLE_REDIRECT_LIMIT + 1)
    unmount()
    visibility.mockRestore()
  })

  it("the cap does not apply to sign-out redirects", () => {
    setStoreState(null, false)
    for (let hop = 0; hop < CROSS_ROLE_REDIRECT_LIMIT + 2; hop++) {
      const { unmount } = renderHook(() => useDashboardAuthGuard("buyer"))
      unmount()
    }
    expect(getRouterMock().push).toHaveBeenCalledTimes(CROSS_ROLE_REDIRECT_LIMIT + 2)
    expect(getRouterMock().push).toHaveBeenLastCalledWith("/login")
  })
})
