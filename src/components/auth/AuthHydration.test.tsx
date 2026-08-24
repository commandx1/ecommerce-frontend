/** biome-ignore-all lint/suspicious/noDocumentCookie: these suites drive the document.cookie-based auth storage on purpose */

import { waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { renderWithProviders } from "@/test/render"
import AuthHydration from "./AuthHydration"

/**
 * `AuthHydration` is mounted once in the root layout. It renders nothing — it exists purely to
 * run `useAuthHydration` on the client, so these tests pin the two contracts the layout relies
 * on: it never contributes markup, and mounting it is what restores the session from the cookie.
 *
 * Note: the component accepts no `children`; it is a sibling of the tree, not a gate in front of
 * it. Nothing in the app is therefore blocked on hydration finishing.
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

// Swapped in `beforeEach` only — see the note in `useAuthHydration.test.tsx` about `afterEach`
// running before the global unmount.
beforeEach(() => {
  clearAllCookies()
  useCartStore.setState({ fetchCart: vi.fn(async () => {}) })
})

describe("AuthHydration", () => {
  it("renders no markup at all", () => {
    // Asserted against an explicit slot: the shared `ThemeProvider` wrapper injects its own
    // inline script into the render container, so the container itself is never empty.
    const { getByTestId } = renderWithProviders(
      <div data-testid="slot">
        <AuthHydration />
      </div>,
    )

    expect(getByTestId("slot")).toBeEmptyDOMElement()
  })

  it("renders nothing even after hydration has completed", async () => {
    document.cookie = `auth-storage=${encodeURIComponent(
      JSON.stringify({ state: { user: USER, accessToken: "at", refreshToken: "rt", isAuthenticated: true } }),
    )}; path=/`

    const { getByTestId } = renderWithProviders(
      <div data-testid="slot">
        <AuthHydration />
      </div>,
    )

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
    expect(getByTestId("slot")).toBeEmptyDOMElement()
  })

  it("restores the session from the auth-storage cookie on mount", async () => {
    document.cookie = `auth-storage=${encodeURIComponent(
      JSON.stringify({ state: { user: USER, accessToken: "at", refreshToken: "rt", isAuthenticated: true } }),
    )}; path=/`

    renderWithProviders(<AuthHydration />)

    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe("at"))
    expect(useAuthStore.getState().user?.email).toBe("ada@example.com")
  })

  it("leaves the store anonymous when no cookie is present", async () => {
    const { getByTestId } = renderWithProviders(
      <div data-testid="slot">
        <AuthHydration />
      </div>,
    )

    await waitFor(() => expect(getByTestId("slot")).toBeEmptyDOMElement())
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it("does not throw on a corrupt cookie", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    document.cookie = "auth-storage=not-json-at-all; path=/"

    expect(() => renderWithProviders(<AuthHydration />)).not.toThrow()

    await waitFor(() => expect(consoleError).toHaveBeenCalled())
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    consoleError.mockRestore()
  })

  it("is idempotent when mounted twice", async () => {
    document.cookie = `auth-storage=${encodeURIComponent(
      JSON.stringify({ state: { user: USER, accessToken: "at", refreshToken: "rt", isAuthenticated: true } }),
    )}; path=/`

    const { getByTestId } = renderWithProviders(
      <div data-testid="slot">
        <AuthHydration />
        <AuthHydration />
      </div>,
    )

    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe("at"))
    expect(getByTestId("slot")).toBeEmptyDOMElement()
  })
})
