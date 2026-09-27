import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "./authStore"
import { type PendingNewCard, useCheckoutStore } from "./checkoutStore"
import { useFavoriteProductsStore } from "./favoriteProductsStore"

const COOKIE_NAME = "auth-storage"

const store = () => useAuthStore.getState()

const user = {
  id: "user-1",
  name: "Serhat",
  surname: "Belen",
  email: "serhat.belen@example.com",
  phoneNumber: "+15551234567",
  emailConfirmed: true,
  phoneNumberConfirmed: true,
  twoFactorEnabled: false,
  lockoutEnd: null,
  createdDate: "2026-01-01T00:00:00Z",
  roleName: "Vendor",
}

/** Reads the raw (still URL-encoded) cookie value, exactly as a browser hands it over. */
async function readRawAuthCookie(): Promise<string | null> {
  const match = `; ${document.cookie}`.split(`; ${COOKIE_NAME}=`)
  if (match.length !== 2) {
    return null
  }

  return match.pop()?.split(";").shift() ?? null
}

function clearAuthCookie(): void {
  // biome-ignore lint/suspicious/noDocumentCookie: test cleanup for the cookieStorage-backed auth cookie
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

let logoutRequests: { authorization: string | null; body: unknown }[]

beforeEach(() => {
  clearAuthCookie()
  sessionStorage.clear()
  localStorage.clear()
  logoutRequests = []

  server.use(
    http.post("*/backend-api/auth/logout", async ({ request }) => {
      logoutRequests.push({
        authorization: request.headers.get("authorization"),
        body: await request.json(),
      })
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

describe("authStore setAuth", () => {
  it("marks the session authenticated and clears any previous error", () => {
    store().setError("Invalid credentials")

    store().setAuth(user, "access-1", "refresh-1")

    expect(store()).toMatchObject({
      user,
      accessToken: "access-1",
      refreshToken: "refresh-1",
      isAuthenticated: true,
      error: null,
    })
  })

  it("defaults isAdminImpersonating to false", () => {
    store().setAuth(user, "access-1", "refresh-1")

    expect(store().isAdminImpersonating).toBe(false)
  })

  it("honours an explicit isAdminImpersonating flag", () => {
    store().setAuth(user, "access-1", "refresh-1", true)

    expect(store().isAdminImpersonating).toBe(true)
  })

  it("resets impersonation when a normal login follows an impersonated session", () => {
    store().setAuth(user, "access-1", "refresh-1", true)

    store().setAuth(user, "access-2", "refresh-2")

    expect(store().isAdminImpersonating).toBe(false)
    expect(store().accessToken).toBe("access-2")
  })
})

describe("authStore small setters", () => {
  it("setUser authenticates without touching the tokens", () => {
    store().setUser(user)

    expect(store().user).toEqual(user)
    expect(store().isAuthenticated).toBe(true)
    expect(store().accessToken).toBeNull()
  })

  it("setTokens stores both tokens", () => {
    store().setTokens("access-1", "refresh-1")

    expect(store()).toMatchObject({ accessToken: "access-1", refreshToken: "refresh-1" })
  })

  it("setTokens alone does not authenticate the session", () => {
    store().setTokens("access-1", "refresh-1")

    expect(store().isAuthenticated).toBe(false)
  })

  it("setIsAdminImpersonating toggles the flag on its own", () => {
    store().setIsAdminImpersonating(true)
    expect(store().isAdminImpersonating).toBe(true)

    store().setIsAdminImpersonating(false)
    expect(store().isAdminImpersonating).toBe(false)
  })

  it("setLoading and setError are independent of the session flags", () => {
    store().setAuth(user, "access-1", "refresh-1")

    store().setLoading(true)
    store().setError("Something went wrong")

    expect(store()).toMatchObject({ isLoading: true, error: "Something went wrong", isAuthenticated: true })
  })
})

describe("authStore clearAuth", () => {
  it("returns every session field to its empty value", () => {
    store().setAuth(user, "access-1", "refresh-1", true)
    store().setError("boom")

    store().clearAuth()

    expect(store()).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdminImpersonating: false,
      error: null,
    })
  })

  it("leaves an emptied auth-storage cookie behind rather than deleting it", async () => {
    store().setAuth(user, "access-1", "refresh-1")
    expect(await readRawAuthCookie()).not.toBeNull()

    store().clearAuth()

    // The persist middleware writes the new (cleared) state instead of removing the cookie, so
    // `auth-storage` still exists - only its contents are empty. `src/proxy.ts` handles this by
    // checking `state.user` / `state.isAuthenticated`, not cookie presence alone.
    const raw = await readRawAuthCookie()
    expect(raw).not.toBeNull()
    const persisted = JSON.parse(decodeURIComponent(raw as string))
    expect(persisted.state.user).toBeNull()
    expect(persisted.state.accessToken).toBeNull()
    expect(persisted.state.isAuthenticated).toBe(false)
  })

  it("does not leave isLoading behind in the persisted cookie", async () => {
    store().setAuth(user, "access-1", "refresh-1")
    store().setLoading(true)

    const persisted = JSON.parse(decodeURIComponent((await readRawAuthCookie()) as string))

    // `partialize` keeps only the five session fields; `isLoading` and `error` are excluded so a
    // stale spinner state can never be rehydrated.
    expect(Object.keys(persisted.state).sort()).toEqual([
      "accessToken",
      "isAdminImpersonating",
      "isAuthenticated",
      "refreshToken",
      "user",
    ])
  })
})

/**
 * This is the exact shape `src/proxy.ts` (and the Playwright auth fixture) parses. If the cookie
 * name, the URL encoding, or the `state.user.roleName` path ever changes, the proxy's role
 * routing silently stops working - these assertions are the tripwire.
 */
describe("authStore persist + cookieStorage contract", () => {
  it("writes a URL-encoded auth-storage cookie readable via decodeURIComponent + JSON.parse", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    const raw = await readRawAuthCookie()
    expect(raw).not.toBeNull()
    // The value is stored percent-encoded, so the raw cookie must not contain a bare `{`.
    expect(raw).not.toContain("{")

    const persisted = JSON.parse(decodeURIComponent(raw as string))
    expect(persisted.state.user.roleName).toBe("Vendor")
    expect(persisted.state.isAuthenticated).toBe(true)
    expect(persisted.state.accessToken).toBe("access-1")
  })

  it("keeps the impersonation flag readable from the cookie", async () => {
    store().setAuth(user, "access-1", "refresh-1", true)

    const persisted = JSON.parse(decodeURIComponent((await readRawAuthCookie()) as string))

    expect(persisted.state.isAdminImpersonating).toBe(true)
  })

  it("survives a role name that needs escaping", async () => {
    store().setAuth({ ...user, roleName: "Vendor Manager;Buyer" }, "access-1", "refresh-1")

    const persisted = JSON.parse(decodeURIComponent((await readRawAuthCookie()) as string))

    // A raw `;` would truncate the cookie - encodeURIComponent is what keeps this parseable.
    expect(persisted.state.user.roleName).toBe("Vendor Manager;Buyer")
  })
})

describe("authStore logout", () => {
  it("calls the backend with the refresh token and bearer access token", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    await store().logout()

    expect(logoutRequests).toHaveLength(1)
    expect(logoutRequests[0]!.body).toEqual({ refreshToken: "refresh-1" })
    expect(logoutRequests[0]!.authorization).toBe("Bearer access-1")
  })

  it("clears the session state", async () => {
    store().setAuth(user, "access-1", "refresh-1", true)

    await store().logout()

    expect(store()).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdminImpersonating: false,
      error: null,
    })
  })

  it("resets the favorite products store on logout", async () => {
    store().setAuth(user, "access-1", "refresh-1")
    useFavoriteProductsStore.getState().setFavorite("p-1", true)
    expect(useFavoriteProductsStore.getState().ids.size).toBe(1)

    await store().logout()

    expect(useFavoriteProductsStore.getState().ids.size).toBe(0)
    expect(useFavoriteProductsStore.getState().hasHydrated).toBe(false)
  })

  it("issues only one logout request when called twice in sequence", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    await store().logout()
    await store().logout()

    // The second call finds the tokens already cleared and skips the network round trip.
    expect(logoutRequests).toHaveLength(1)
  })

  it("issues only one logout request when called concurrently (A4 fix)", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    // Without memoizing the in-flight logout promise, both calls would read the same
    // not-yet-cleared tokens and each fire its own POST /auth/logout.
    await Promise.all([store().logout(), store().logout()])

    expect(logoutRequests).toHaveLength(1)
  })

  it("re-arms for a later logout after a concurrent pair completes", async () => {
    store().setAuth(user, "access-1", "refresh-1")
    await Promise.all([store().logout(), store().logout()])
    expect(logoutRequests).toHaveLength(1)

    // A fresh session, then a genuinely new logout - the memoized promise must have been
    // cleared, not left stuck forever after the first concurrent pair.
    store().setAuth(user, "access-2", "refresh-2")
    await store().logout()

    expect(logoutRequests).toHaveLength(2)
    expect(logoutRequests[1]!.authorization).toBe("Bearer access-2")
  })

  it("makes no request at all when there is no session", async () => {
    await store().logout()

    expect(logoutRequests).toHaveLength(0)
    expect(store().isAuthenticated).toBe(false)
  })

  it("makes no request when only the access token is present", async () => {
    store().setTokens("access-1", "")

    await store().logout()

    expect(logoutRequests).toHaveLength(0)
  })

  it("clears the session even when the backend rejects the logout", async () => {
    server.use(http.post("*/backend-api/auth/logout", () => HttpResponse.error()))
    store().setAuth(user, "access-1", "refresh-1")

    await expect(store().logout()).resolves.toBeUndefined()

    expect(store().user).toBeNull()
    expect(store().isAuthenticated).toBe(false)
  })

  it("clears the session even when the backend answers 500", async () => {
    server.use(http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 500 })))
    store().setAuth(user, "access-1", "refresh-1")

    await expect(store().logout()).resolves.toBeUndefined()

    expect(store().isAuthenticated).toBe(false)
  })

  // Y1 fix: `logout()` used to rewrite the `auth-storage` cookie with an empty-but-present state
  // instead of actually deleting it. Any code that only checks cookie *presence* (rather than
  // parsing its contents) would keep treating the session as logged in. `logout()` now removes
  // the cookie outright via the persist middleware's `clearStorage()`.
  it("deletes the persisted cookie entirely, rather than just emptying it", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    await store().logout()

    expect(await readRawAuthCookie()).toBeNull()
  })

  it("broadcasts the logged-out user's id via the cross-tab logout event", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    await store().logout()

    const raw = localStorage.getItem("auth-logout")
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string).userId).toBe(user.id)
  })

  it("does not broadcast when there is no session to log out of", async () => {
    await store().logout()

    expect(localStorage.getItem("auth-logout")).toBeNull()
  })
})

describe("authStore clearLocalSession", () => {
  it("clears the session without calling the server", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    await store().clearLocalSession()

    expect(logoutRequests).toHaveLength(0)
    expect(store()).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdminImpersonating: false,
      error: null,
    })
  })

  it("does not write the cross-tab logout broadcast key", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    await store().clearLocalSession()

    expect(localStorage.getItem("auth-logout")).toBeNull()
  })

  it("deletes the persisted cookie", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    await store().clearLocalSession()

    expect(await readRawAuthCookie()).toBeNull()
  })
})

/**
 * Regression coverage for the buyer-A-card-charges-buyer-B leak: `checkoutStore` is an in-memory
 * singleton, so nothing about `useAuthStore` clearing itself touches it on its own. These tests
 * drive the store the way a real buyer would (fill in checkout fields, then sign in as someone
 * else in the same tab) rather than asserting on the reset function being called.
 */
describe("authStore identity change resets per-user client stores (checkout + favorites)", () => {
  const userB = { ...user, id: "user-b" }

  const pendingCardA: PendingNewCard = {
    paymentMethodId: "pm_A",
    brand: "visa",
    last4: "1111",
    expMonth: 12,
    expYear: 2030,
  }

  /** Drives the store the way a buyer reaching checkout step 4 with a new card would. */
  function fillInProgressCheckoutAsBuyerA(): void {
    const checkout = useCheckoutStore.getState()
    checkout.setStep(4)
    checkout.updateShippingAddress({
      firstName: "Alice",
      lastName: "Anderson",
      street: "1 Alpha St",
      city: "Alphaville",
      state: "CA",
      zipCode: "90001",
      phone: "555-0100",
    })
    checkout.updatePONumber("PO-ALICE-1")
    checkout.updateSpecialInstructions("Leave at the front desk")
    checkout.setTermsAgreed(true)
    checkout.setPendingNewCard(pendingCardA)
  }

  function expectNoTraceOfBuyerA(): void {
    const checkout = useCheckoutStore.getState()
    expect(checkout.pendingNewCard).toBeNull()
    expect(checkout.currentStep).toBe(1)
    expect(checkout.poNumber).toBe("")
    expect(checkout.specialInstructions).toBe("")
    expect(checkout.termsAgreed).toBe(false)
    expect(checkout.shippingAddress).toEqual({
      firstName: "",
      lastName: "",
      company: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
    })
  }

  it("(a) buyer B's billing step has no trace of buyer A's card/address/PO/terms after A logs out and B logs in", async () => {
    store().setAuth(user, "access-1", "refresh-1")
    fillInProgressCheckoutAsBuyerA()

    // A logs out via the Navbar.
    await store().logout()

    // B logs in, in the same tab.
    store().setAuth(userB, "access-2", "refresh-2")

    expectNoTraceOfBuyerA()
  })

  it("(b) same leak via login-over-session: B authenticating without A ever logging out still wipes A's checkout draft", async () => {
    store().setAuth(user, "access-1", "refresh-1")
    fillInProgressCheckoutAsBuyerA()

    // B reaches /login (or completes /verify-2fa, /verify-email) while A's session is still live -
    // setAuth is called directly, with no prior logout()/clearLocalSession() call.
    store().setAuth(userB, "access-2", "refresh-2")

    await vi.waitFor(() => expectNoTraceOfBuyerA())
  })

  it("(c) favorites: B sees only B's favorites, not A's, after logging in over A's session and hydrating", async () => {
    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(["fav-a-1", "fav-a-2"])))
    store().setAuth(user, "access-1", "refresh-1")
    await useFavoriteProductsStore.getState().hydrate()
    expect(useFavoriteProductsStore.getState().ids).toEqual(new Set(["fav-a-1", "fav-a-2"]))

    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(["fav-b-1"])))
    store().setAuth(userB, "access-2", "refresh-2")

    // A's ids must be gone before B's own hydrate ever runs - otherwise B would render A's hearts
    // for the frame(s) before the new GET resolves.
    await vi.waitFor(() => expect(useFavoriteProductsStore.getState().ids.size).toBe(0))
    expect(useFavoriteProductsStore.getState().hasHydrated).toBe(false)

    await useFavoriteProductsStore.getState().hydrate()
    expect(useFavoriteProductsStore.getState().ids).toEqual(new Set(["fav-b-1"]))
  })

  it("(d) does NOT wipe an in-progress checkout when the same user's tokens are re-set (2FA completing the same login / token refresh)", async () => {
    store().setAuth(user, "access-1", "refresh-1")
    fillInProgressCheckoutAsBuyerA()

    // Same user id re-authenticating - must be left alone.
    store().setAuth(user, "access-2", "refresh-2")

    // Give any (incorrectly) fired async reset a chance to land before asserting it did not happen.
    await new Promise((resolve) => setTimeout(resolve, 0))

    const checkout = useCheckoutStore.getState()
    expect(checkout.pendingNewCard).toEqual(pendingCardA)
    expect(checkout.currentStep).toBe(4)
    expect(checkout.poNumber).toBe("PO-ALICE-1")
    expect(checkout.termsAgreed).toBe(true)
  })

  it("revokes buyer A's session (best-effort) when B logs in over A's still-open session", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    store().setAuth(userB, "access-2", "refresh-2")

    await vi.waitFor(() => expect(logoutRequests).toHaveLength(1))
    expect(logoutRequests[0]).toEqual({ authorization: "Bearer access-1", body: { refreshToken: "refresh-1" } })
  })

  it("does not attempt to revoke anything on a plain login (null -> A)", async () => {
    store().setAuth(user, "access-1", "refresh-1")

    // Give the (absent) revocation call a chance to fire before asserting it did not.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(logoutRequests).toHaveLength(0)
  })
})

/**
 * `getInitialState()` returns the object the `persist` creator produced at module load, which
 * `set()` calls never mutate in place (zustand always replaces `state`, never `initialState`).
 * That makes it the one reliable way to see the store's true defaults, immune to whatever a
 * previous test in this file left behind in the live singleton.
 */
describe("authStore defaults", () => {
  it("starts every session flag false before any action runs", () => {
    const initial = useAuthStore.getInitialState()

    expect(initial.isAuthenticated).toBe(false)
    expect(initial.isAdminImpersonating).toBe(false)
    expect(initial.isLoading).toBe(false)
  })
})

/**
 * `onRehydrateStorage` is the `persist` middleware's post-rehydration hook (proxy.ts's cookie
 * parsing has its own coverage; this is the mirror-image callback zustand runs after reading the
 * cookie back on the client). It is never invoked by calling store actions directly, so it needs
 * to be pulled off the persist options and driven by hand.
 */
describe("authStore onRehydrateStorage", () => {
  const getListener = () => {
    const { onRehydrateStorage } = useAuthStore.persist.getOptions()
    const listener = onRehydrateStorage?.(useAuthStore.getState())
    if (!listener) throw new Error("onRehydrateStorage did not return a listener")
    return listener
  }

  it("marks the session authenticated when both user and accessToken survived rehydration", () => {
    const listener = getListener()
    const state = { user, accessToken: "access-1", isAuthenticated: false, isAdminImpersonating: false } as ReturnType<
      typeof useAuthStore.getState
    >

    listener(state)

    expect(state.isAuthenticated).toBe(true)
  })

  it("clears isAuthenticated and isAdminImpersonating when the user and token did not both survive", () => {
    const listener = getListener()
    const state = { user: null, accessToken: null, isAuthenticated: true, isAdminImpersonating: true } as ReturnType<
      typeof useAuthStore.getState
    >

    listener(state)

    expect(state.isAuthenticated).toBe(false)
    expect(state.isAdminImpersonating).toBe(false)
  })

  it("does not authenticate a user with no access token, even with a stale isAuthenticated flag", () => {
    // Distinguishes `&&` from `||`: a `user`-only survivor must NOT authenticate.
    const listener = getListener()
    const state = { user, accessToken: null, isAuthenticated: false, isAdminImpersonating: false } as ReturnType<
      typeof useAuthStore.getState
    >

    listener(state)

    expect(state.isAuthenticated).toBe(false)
  })

  it("does nothing when rehydration produced no state at all", () => {
    const listener = getListener()

    expect(() => listener(undefined as unknown as ReturnType<typeof useAuthStore.getState>)).not.toThrow()
  })
})
