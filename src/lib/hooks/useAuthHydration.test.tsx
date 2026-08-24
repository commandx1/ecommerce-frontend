/** biome-ignore-all lint/suspicious/noDocumentCookie: these suites drive the document.cookie-based auth storage on purpose */

import { waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cookieStorage } from "@/lib/storage/cookie-storage"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { renderWithProviders } from "@/test/render"
import { useAuthHydration } from "./useAuthHydration"

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

let fetchCart: ReturnType<typeof vi.fn>

/**
 * The cart action is swapped in `beforeEach`, never in `afterEach`: this file's `afterEach` runs
 * BEFORE the global one in `src/test/setup.ts` unmounts the tree, so a store write there would
 * re-render a still-mounted component outside `act()`.
 */
beforeEach(() => {
  renders.length = 0
  clearAllCookies()
  fetchCart = vi.fn(async () => {})
  useCartStore.setState({ fetchCart })
})

afterEach(() => {
  vi.restoreAllMocks()
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

  it("does not touch the cookie when the store is already fully populated", async () => {
    const getItem = vi.spyOn(cookieStorage, "getItem")
    useAuthStore.getState().setAuth(USER, "at", "rt")

    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(getItem).not.toHaveBeenCalled()
  })
})

describe("useAuthHydration cart bootstrap", () => {
  it("fetches the cart once the session is authenticated", async () => {
    writeAuthCookie({ user: USER, accessToken: "at", refreshToken: "rt", isAuthenticated: true })

    renderWithProviders(<Probe />)

    await waitFor(() => expect(fetchCart).toHaveBeenCalled())
  })

  it("does not fetch the cart while an admin is impersonating", async () => {
    useAuthStore.getState().setAuth(USER, "at", "rt", true)

    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(fetchCart).not.toHaveBeenCalled()
  })

  it("does not fetch the cart for an anonymous visitor", async () => {
    const { getByTestId } = renderWithProviders(<Probe />)

    await waitFor(() => expect(getByTestId("hydrated")).toHaveTextContent("true"))
    expect(fetchCart).not.toHaveBeenCalled()
  })
})
