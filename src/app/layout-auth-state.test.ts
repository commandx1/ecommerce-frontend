import { describe, expect, it } from "vitest"
import { buildNavbarInitialAuthState } from "./layout-auth-state"

/**
 * Security regression coverage for the P2 fix: `RootLayout` used to hand the *entire* persisted
 * `auth-storage` cookie state - including `accessToken`/`refreshToken` - to `ConditionalNavbar` as
 * a prop, which serialises it into every page's RSC payload and rendered HTML. These tests pin
 * `buildNavbarInitialAuthState` (the pure extraction `RootLayout` now delegates to) so a future
 * change can't silently start forwarding the tokens again.
 */

const ACCESS_TOKEN = "access-token-secret"
const REFRESH_TOKEN = "refresh-token-secret"

function envelope(state: Record<string, unknown>): string {
  return JSON.stringify({ state })
}

describe("buildNavbarInitialAuthState", () => {
  it("returns null when there is no cookie value", () => {
    expect(buildNavbarInitialAuthState(undefined)).toBeNull()
  })

  it("returns null when the cookie value is not valid JSON (even URI-decoded)", () => {
    expect(buildNavbarInitialAuthState("not-json{{{")).toBeNull()
  })

  it("keeps only the Navbar's minimal user fields and isAuthenticated, dropping the tokens", () => {
    const raw = envelope({
      user: {
        id: "u-1",
        name: "Serhat",
        surname: "Belen",
        email: "serhat@example.com",
        roleName: "Vendor",
        phoneNumber: "+15551234567",
        emailConfirmed: true,
      },
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      isAuthenticated: true,
    })

    const result = buildNavbarInitialAuthState(raw)

    expect(result).toEqual({
      user: {
        id: "u-1",
        name: "Serhat",
        surname: "Belen",
        email: "serhat@example.com",
        roleName: "Vendor",
      },
      isAuthenticated: true,
    })
    expect(JSON.stringify(result)).not.toContain(ACCESS_TOKEN)
    expect(JSON.stringify(result)).not.toContain(REFRESH_TOKEN)
  })

  it("also strips the tokens from a URI-encoded cookie value", () => {
    const raw = encodeURIComponent(
      envelope({
        user: { id: "u-2", name: "Bea", surname: "Buyer", email: "bea@example.com" },
        accessToken: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
        isAuthenticated: true,
      }),
    )

    const result = buildNavbarInitialAuthState(raw)

    expect(JSON.stringify(result)).not.toContain(ACCESS_TOKEN)
    expect(JSON.stringify(result)).not.toContain(REFRESH_TOKEN)
  })

  it("returns { user: null, isAuthenticated } when the state has no user (e.g. logged out)", () => {
    const raw = envelope({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })

    expect(buildNavbarInitialAuthState(raw)).toEqual({ user: null, isAuthenticated: false })
  })

  it("returns null when the parsed payload has no `state` at all", () => {
    expect(buildNavbarInitialAuthState(JSON.stringify({ notState: true }))).toBeNull()
  })
})
