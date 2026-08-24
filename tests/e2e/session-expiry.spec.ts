import { expect, test } from "./fixtures/auth.fixture"
import { AUTH_COOKIE_NAME } from "./fixtures/auth-cookie"
import { registerAllMocks } from "./mocks"

/**
 * src/lib/api/client.ts's 401/403 interceptor, exercised on a real protected
 * page (/buyer-dashboard/orders). Read client.ts before writing this:
 *
 *  - `attachAuthInterceptors` is applied to BOTH `apiClient` and
 *    `appApiClient` - a response interceptor calls `handleAuthFailure()` on
 *    any `isAuthErrorStatus(status)` (401/403, see ./auth-error.ts).
 *  - `handleAuthFailure` is memoised on a module-level `authFailurePromise`:
 *    concurrent 401s from parallel in-flight requests all `await` the SAME
 *    promise, so `logout()` and the `window.location.assign` redirect only
 *    happen ONCE no matter how many requests failed together.
 *  - `buildLoginUrl()` sets `redirect=<current pathname+search>` (skipped
 *    only for "/", or if the current path already starts with "/login") and
 *    always sets `reason=session-expired`.
 *  - The actual navigation is `window.location.assign(...)`, a real
 *    browser navigation - Playwright observes it as a URL change.
 */

test.describe("session expiry (src/lib/api/client.ts 401 interceptor)", () => {
  test("a single 401 on a protected page logs out once and redirects to /login?reason=session-expired&redirect=<path>", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/orders/buyer", () => ({ status: 401, body: { message: "Unauthorized" } }))
    // authStore.logout() best-effort POSTs here (swallows any failure) before
    // clearing local state - not under test, just needs a response so it
    // doesn't count as an unmatched request.
    apiMock.on("POST", "/backend-api/auth/logout", () => ({ status: 200 }))
    registerAllMocks(apiMock)

    await buyerPage.goto("/buyer-dashboard/orders")

    await expect(buyerPage).toHaveURL(/\/login\?/, { timeout: 15000 })
    const url = new URL(buyerPage.url())
    expect(url.searchParams.get("reason")).toBe("session-expired")
    expect(url.searchParams.get("redirect")).toBe("/buyer-dashboard/orders")

    // logout() DELETES the auth-storage cookie (Y1). It used to only rewrite the
    // persisted zustand state into its logged-out shape, leaving the cookie in
    // place - any code that checks cookie *presence* rather than its contents
    // then still saw a session. `logout` now calls `persist.clearStorage()`,
    // which routes through cookieStorage.removeItem (see cookie-storage.ts) and
    // expires the cookie for real.
    const cookies = await buyerPage.context().cookies()
    const authCookie = cookies.find((cookie) => cookie.name === AUTH_COOKIE_NAME)
    expect(authCookie).toBeUndefined()
  })

  test("multiple concurrent 401s on the same page trigger exactly one redirect, not a redirect-loop or a stuck page", async ({
    buyerPage,
    apiMock,
  }) => {
    // Every GET /orders/buyer call (one per status-tab change, see
    // use-buyer-orders-page.ts) 401s, delayed slightly so the page's initial
    // load request is still in flight when the tab clicks below fire two
    // more - all three then resolve with 401 close together, exercising
    // client.ts's `authFailurePromise` memo under real overlap instead of
    // one clean request at a time.
    apiMock.on("GET", "/backend-api/orders/buyer", async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return { status: 401, body: { message: "Unauthorized" } }
    })
    apiMock.on("POST", "/backend-api/auth/logout", () => ({ status: 200 }))
    registerAllMocks(apiMock)

    await buyerPage.goto("/buyer-dashboard/orders")
    await expect(buyerPage.getByRole("button", { name: "Pending", exact: true })).toBeVisible()

    // Fire two tab-change requests back-to-back without awaiting either -
    // both hit the mocked (delayed) 401 while the initial load's request is
    // also still pending.
    await Promise.all([
      buyerPage.getByRole("button", { name: "Pending", exact: true }).click(),
      buyerPage.getByRole("button", { name: "Shipped", exact: true }).click(),
    ])

    await expect(buyerPage).toHaveURL(/\/login\?/, { timeout: 15000 })
    const url = new URL(buyerPage.url())
    expect(url.searchParams.get("reason")).toBe("session-expired")

    // Give any second (incorrect) redirect a chance to fire, then confirm
    // the URL is still exactly the single login redirect - not bounced
    // somewhere else by a second handleAuthFailure race.
    await buyerPage.waitForTimeout(500)
    await expect(buyerPage).toHaveURL(
      /\/login\?redirect=%2Fbuyer-dashboard%2Forders(%3FselectedTab%3D\w+)?&reason=session-expired/,
    )
  })
})
