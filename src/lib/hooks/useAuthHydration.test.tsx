/** biome-ignore-all lint/suspicious/noDocumentCookie: these suites drive the document.cookie-based auth storage on purpose */

import { act, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { refreshCart } from "@/features/cart/api/cart-queries"
import { LOGOUT_EVENT_KEY } from "@/lib/storage/session-events"
import { __resetTabSessionStorageForTests, tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"
import { renderWithProviders } from "@/test/render"
import { useAuthHydration } from "./useAuthHydration"

/**
 * `useAuthHydration`'s cart bootstrap effect calls `refreshCart`, so it is mocked here at the
 * module boundary.
 */
vi.mock("@/features/cart/api/cart-queries", () => ({ refreshCart: vi.fn(async () => {}) }))

/**
 * `useAuthHydration` is the bridge that survives a hard refresh: React state starts empty, the
 * session lives only in the `auth-storage` cookie, and this hook copies it back into the store
 * before the rest of the tree reads it. It also gates the first cart fetch.
 */

const USER = {
  id: "u-1",
  name: "Ada",
  surname: "Lovelace",
  email: "ada@example.com",
  phoneNumber: "+900000000",
  emailConfirmed: true,
  phoneNumberConfirmed: true,
  twoFactorEnabled: false,
  lockoutEnd: null,
  createdDate: "2026-01-01T00:00:00Z",
  roleName: "Buyer",
}

const clearAllCookies = (): void => {
  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim()
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  }
}

const writeAuthCookie = (state: Record<string, unknown>, encodeTwice = false): void => {
  const json = JSON.stringify({ state })
  const value = encodeTwice ? encodeURIComponent(encodeURIComponent(json)) : encodeURIComponent(json)
  document.cookie = `auth-storage=${value}; path=/`
}

/** Records the hook's return value on every render so the pre-hydration value stays observable. */
const renders: boolean[] = []

function Probe() {
  const isHydrated = useAuthHydration()
  renders.push(isHydrated)
  return <span data-testid="hydrated">{String(isHydrated)}</span>
}

const mockedRefreshCart = vi.mocked(refreshCart)

beforeEach(() => {
  renders.length = 0
  clearAllCookies()
  sessionStorage.clear()
  localStorage.clear()
  // `tabSessionStorage` only inherits the cookie into a fresh sessionStorage once per page load;
  // each test below simulates a separate page load, so reset the gate.
  __resetTabSessionStorageForTests()
  mockedRefreshCart.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  localStorage.clear()
})

describe("useAuthHydration hydration flag", () => {
  it("starts false on the very first render and flips to true after the effect runs", async () => {
    const { getByTestId } = renderWithProviders(<Probe />)

    // The first recorded render is the SSR-equivalent pass, before any cookie is read.
    expect(renders[0]).toBe(false)
    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
  })

  it("reports hydrated even when there is nothing to restore", async () => {
    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe("useAuthHydration cookie restore", () => {
  it("restores user and tokens from the auth-storage cookie", async () => {
    writeAuthCookie({ user: USER, accessToken: "at", refreshToken: "rt", isAuthenticated: true })

    renderWithProviders(<Probe />)

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
    const state = useAuthStore.getState()
    expect(state.user?.email).toBe("ada@example.com")
    expect(state.accessToken).toBe("at")
    expect(state.refreshToken).toBe("rt")
  })

  it("defaults the refresh token to an empty string when the cookie has none", async () => {
    writeAuthCookie({ user: USER, accessToken: "at" })

    renderWithProviders(<Probe />)

    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe("at"))
    expect(useAuthStore.getState().refreshToken).toBe("")
  })

  it("restores the impersonation flag when the cookie carries it", async () => {
    writeAuthCookie({ user: USER, accessToken: "at", refreshToken: "rt", isAdminImpersonating: true })

    renderWithProviders(<Probe />)

    await waitFor(() => expect(useAuthStore.getState().isAdminImpersonating).toBe(true))
  })

  it("handles a double-encoded cookie through the decode fallback", async () => {
    writeAuthCookie({ user: USER, accessToken: "at", refreshToken: "rt" }, true)

    renderWithProviders(<Probe />)

    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe("at"))
  })

  it("restores nothing when the cookie has a user but no access token", async () => {
    writeAuthCookie({ user: USER, isAuthenticated: true })

    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it("survives a corrupt cookie: logs, restores nothing, still reports hydrated", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    document.cookie = "auth-storage=not-json-at-all; path=/"

    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(consoleError).toHaveBeenCalledWith("Error restoring auth from cookie:", expect.anything())
  })

  it("does not touch storage when the store is already fully populated", async () => {
    const getItem = vi.spyOn(tabSessionStorage, "getItem")
    useAuthStore.getState().setAuth(USER, "at", "rt")

    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(getItem).not.toHaveBeenCalled()
  })
})

describe("useAuthHydration bootstrap + real restore (persist's module-eval read never restores state)", () => {
  it("restores the session on mount after the bootstrap read adopted the cookie (persist itself never restores)", async () => {
    writeAuthCookie({ user: USER, accessToken: "at", refreshToken: "rt", isAuthenticated: true })

    // Simulates what zustand persist's module-eval `storage.getItem` call does: it's a STRING
    // return, which persist's v5 merge logic ignores (it expects `{state, version}`, not a JSON
    // string) - so this call's only observable effect is consuming the once-per-page-load
    // bootstrap adoption (copying the cookie into sessionStorage). The actual restore into the
    // store happens later, in this hook's own mount effect.
    tabSessionStorage.getItem("auth-storage")
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    renderWithProviders(<Probe />)

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
    const state = useAuthStore.getState()
    expect(state.user?.email).toBe("ada@example.com")
    expect(state.accessToken).toBe("at")
  })

  it("a guest render (no cookie, bootstrap already consumed) leaves the store empty and does not throw", async () => {
    // Bootstrap read with nothing in the cookie or sessionStorage - consumes the gate, same as
    // persist's module-eval read on a guest tab.
    tabSessionStorage.getItem("auth-storage")

    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })
})

describe("useAuthHydration cart bootstrap", () => {
  it("refreshes the cart once the session is authenticated", async () => {
    writeAuthCookie({ user: USER, accessToken: "at", refreshToken: "rt", isAuthenticated: true })

    renderWithProviders(<Probe />)

    await waitFor(() => expect(mockedRefreshCart).toHaveBeenCalled())
  })

  it("does not refresh the cart while an admin is impersonating", async () => {
    useAuthStore.getState().setAuth(USER, "at", "rt", true)

    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(mockedRefreshCart).not.toHaveBeenCalled()
  })

  it("does not refresh the cart for an anonymous visitor", async () => {
    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(mockedRefreshCart).not.toHaveBeenCalled()
  })

  /**
   * F9 regression guard: this effect used to be keyed on `accessToken`, so every silent token
   * refresh (same signed-in user) fired an extra `GET /cart`.
   */
  it("does not refetch the cart when only the access token changes for the same user", async () => {
    useAuthStore.getState().setAuth(USER, "at-1", "rt")
    renderWithProviders(<Probe />)
    await waitFor(() => expect(mockedRefreshCart).toHaveBeenCalledTimes(1))

    act(() => {
      useAuthStore.getState().setTokens("at-2", "rt")
    })
    // Give a (wrongly firing) extra effect a chance to run before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(mockedRefreshCart).toHaveBeenCalledTimes(1)
  })

  it("refetches the cart when a different user becomes authenticated", async () => {
    useAuthStore.getState().setAuth(USER, "at-1", "rt")
    renderWithProviders(<Probe />)
    await waitFor(() => expect(mockedRefreshCart).toHaveBeenCalledTimes(1))

    act(() => {
      useAuthStore.getState().setAuth({ ...USER, id: "u-2" }, "at-2", "rt")
    })

    await waitFor(() => expect(mockedRefreshCart).toHaveBeenCalledTimes(2))
  })
})

/** Dispatches a native `storage` event, the mechanism `onLogoutBroadcast` listens on. */
const dispatchLogoutBroadcast = (userId: string): void => {
  window.dispatchEvent(
    new StorageEvent("storage", { key: LOGOUT_EVENT_KEY, newValue: JSON.stringify({ userId, at: Date.now() }) }),
  )
}

describe("useAuthHydration cross-tab logout", () => {
  it("clears the store when a logout broadcast names the same user id", async () => {
    useAuthStore.getState().setAuth(USER, "at", "rt")
    const { getByTestId } = renderWithProviders(<Probe />)
    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))

    dispatchLogoutBroadcast(USER.id)

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false))
    expect(useAuthStore.getState().user).toBeNull()
  })

  it("ignores a logout broadcast for a different user id", async () => {
    useAuthStore.getState().setAuth(USER, "at", "rt")
    const { getByTestId } = renderWithProviders(<Probe />)
    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))

    dispatchLogoutBroadcast("some-other-user")

    // Give any (wrongly fired) async clear a chance to run before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user?.id).toBe(USER.id)
  })

  it("removes its storage/focus listeners on unmount", async () => {
    useAuthStore.getState().setAuth(USER, "at", "rt")
    const { getByTestId, unmount } = renderWithProviders(<Probe />)
    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))

    unmount()
    dispatchLogoutBroadcast(USER.id)

    // No listener left to react - the store must still show the session that was live at unmount.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
