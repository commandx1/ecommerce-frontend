import { expect, test } from "./fixtures/auth.fixture"
import { buildAuthCookie, buildVendorAuthCookie } from "./fixtures/auth-cookie"

/**
 * src/proxy.ts's redirect matrix, verified against real runtime behaviour -
 * NOT assumed. Read line-for-line before writing these:
 *
 *   1. auth-storage cookie parsed via decodeURIComponent -> JSON.parse, with
 *      a raw JSON.parse fallback; unparseable/missing -> `user = null`,
 *      `isAuthenticated = false`.
 *   2. Vendor guard (runs BEFORE the dashboard block, and independently of
 *      it): `isAuthenticated === true` AND `user.roleName === "Vendor"` AND
 *      path does not start with "/vendor-dashboard" AND NOT the
 *      `/register?token=...` signup-link exception -> redirect to
 *      /vendor-dashboard. This fires for ANY path, not just dashboard paths
 *      (e.g. Vendor hitting /products). (K14 fix: the guard now also checks
 *      isAuthenticated - previously an unauthenticated-but-Vendor-shaped
 *      cookie was bounced here too, chaining into an infinite redirect loop
 *      with the dashboard block below. See the two K14 regression tests.)
 *   3. Dashboard block, only for paths starting with /vendor-dashboard or
 *      /buyer-dashboard:
 *      - no cookie OR no user OR !isAuthenticated -> /login?redirect=<path>
 *      - path starts with /vendor-dashboard AND roleName !== "Vendor" ->
 *        /buyer-dashboard
 *      - path starts with /buyer-dashboard AND roleName === "Vendor" ->
 *        /vendor-dashboard (in practice rule 2 already redirected an
 *        authenticated Vendor away from /buyer-dashboard before this block
 *        runs, so this branch mostly matters for cookies with a mismatched
 *        isAuthenticated flag)
 *   4. Otherwise: NextResponse.next() (page renders / SSR proceeds).
 *
 * These are proxy-level redirects (`matcher` excludes api/backend-api/_next
 * static assets), so a `page.goto` + URL assertion is enough - no need to
 * wait for page content, and no need to mock backend-api for SSR pages that
 * happen to fetch on the server (we only assert the final URL).
 */

test.describe("auth-routing (src/proxy.ts)", () => {
  // These redirects happen in proxy.ts before any page code runs, so none of
  // these tests register apiMock routes. But a page that DOES render (e.g. a
  // guest on /products, or a Vendor's request that resolves to
  // /vendor-dashboard) still hydrates client-side and may fire its own
  // backend-api calls unrelated to what this spec is testing (auth
  // wiring, not page data) - apiMockStrict is relaxed for the whole file so
  // those don't fail an otherwise-correct redirect assertion.
  test.use({ apiMockStrict: false })

  test("guest hitting /buyer-dashboard is redirected to /login with a redirect query", async ({ guestPage }) => {
    await guestPage.goto("/buyer-dashboard", { waitUntil: "domcontentloaded" })
    await expect(guestPage).toHaveURL(/\/login\?redirect=%2Fbuyer-dashboard/)
  })

  test("guest hitting /vendor-dashboard is redirected to /login with a redirect query", async ({ guestPage }) => {
    await guestPage.goto("/vendor-dashboard", { waitUntil: "domcontentloaded" })
    await expect(guestPage).toHaveURL(/\/login\?redirect=%2Fvendor-dashboard/)
  })

  test("guest hitting a non-dashboard page (e.g. /products) is NOT redirected", async ({ guestPage }) => {
    await guestPage.goto("/products", { waitUntil: "domcontentloaded" })
    await expect(guestPage).toHaveURL(/\/products$/)
  })

  test("Buyer hitting /vendor-dashboard is redirected to /buyer-dashboard", async ({ buyerPage }) => {
    await buyerPage.goto("/vendor-dashboard", { waitUntil: "domcontentloaded" })
    await expect(buyerPage).toHaveURL(/\/buyer-dashboard$/)
  })

  test("Buyer hitting their own /buyer-dashboard is NOT redirected", async ({ buyerPage }) => {
    await buyerPage.goto("/buyer-dashboard", { waitUntil: "domcontentloaded" })
    await expect(buyerPage).toHaveURL(/\/buyer-dashboard$/)
  })

  test("Vendor hitting a non-dashboard page (/products) is redirected to /vendor-dashboard", async ({ vendorPage }) => {
    // Rule 2 (the vendor guard) fires for ANY path outside /vendor-dashboard,
    // not just /buyer-dashboard - this is the case that proves it.
    await vendorPage.goto("/products", { waitUntil: "domcontentloaded" })
    await expect(vendorPage).toHaveURL(/\/vendor-dashboard$/)
  })

  test("Vendor hitting /buyer-dashboard is redirected to /vendor-dashboard", async ({ vendorPage }) => {
    await vendorPage.goto("/buyer-dashboard", { waitUntil: "domcontentloaded" })
    await expect(vendorPage).toHaveURL(/\/vendor-dashboard$/)
  })

  test("Vendor hitting their own /vendor-dashboard is NOT redirected", async ({ vendorPage }) => {
    await vendorPage.goto("/vendor-dashboard", { waitUntil: "domcontentloaded" })
    await expect(vendorPage).toHaveURL(/\/vendor-dashboard$/)
  })

  test("Vendor hitting /register?token=... (admin-invited signup link) passes through, not redirected to /login or /vendor-dashboard", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([buildVendorAuthCookie({}, baseURL)])
    await page.goto("/register?token=abc123", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/register\?token=abc123/)
  })

  test("Vendor hitting /register WITHOUT a token is redirected to /vendor-dashboard (the signup-link exception requires the token param)", async ({
    vendorPage,
  }) => {
    await vendorPage.goto("/register", { waitUntil: "domcontentloaded" })
    await expect(vendorPage).toHaveURL(/\/vendor-dashboard$/)
  })

  test("a broken/unparseable auth-storage cookie is treated as unauthenticated -> /login", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([
      {
        name: "auth-storage",
        // Neither valid encodeURIComponent-JSON nor valid raw JSON - both of
        // proxy.ts's parseAuthCookie fallbacks throw, so `user` stays null.
        value: "{not-valid-json-at-all",
        url: baseURL,
      },
    ])
    await page.goto("/buyer-dashboard/orders")
    await expect(page).toHaveURL(/\/login\?redirect=%2Fbuyer-dashboard%2Forders/)
  })

  test('isAuthenticated:false + roleName:"Vendor" on /vendor-dashboard is redirected cleanly to /login (K14 regression)', async ({
    page,
    baseURL,
  }) => {
    // K14 fixed: the vendor guard in proxy.ts now also requires
    // isAuthenticated. Previously this cookie shape caused an infinite
    // redirect loop between /vendor-dashboard and /login
    // (net::ERR_TOO_MANY_REDIRECTS); now it's a single clean hop to /login.
    await page.context().addCookies([
      buildAuthCookie(
        {
          user: {
            id: "u1",
            name: "V",
            surname: "V",
            email: "v@example.com",
            phoneNumber: "",
            emailConfirmed: true,
            phoneNumberConfirmed: true,
            twoFactorEnabled: false,
            lockoutEnd: null,
            createdDate: "2026-01-01T00:00:00Z",
            roleName: "Vendor",
          } as never,
          accessToken: "tok",
          refreshToken: "tok",
          isAuthenticated: false,
          isAdminImpersonating: false,
        },
        baseURL,
      ),
    ])

    await page.goto("/vendor-dashboard", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/login\?redirect=%2Fvendor-dashboard/)
  })

  test('isAuthenticated:false + roleName:"Vendor" starting from a non-dashboard path (/products) is NOT redirected (K14 regression)', async ({
    page,
    baseURL,
  }) => {
    // K14 fixed: the vendor guard now requires isAuthenticated, so a stale
    // Vendor-shaped cookie no longer bounces public pages to
    // /vendor-dashboard (which previously chained into an infinite loop).
    // /products now renders normally, like for any anonymous visitor.
    await page.context().addCookies([
      buildAuthCookie(
        {
          user: {
            id: "u1",
            name: "V",
            surname: "V",
            email: "v@example.com",
            phoneNumber: "",
            emailConfirmed: true,
            phoneNumberConfirmed: true,
            twoFactorEnabled: false,
            lockoutEnd: null,
            createdDate: "2026-01-01T00:00:00Z",
            roleName: "Vendor",
          } as never,
          accessToken: "tok",
          refreshToken: "tok",
          isAuthenticated: false,
          isAdminImpersonating: false,
        },
        baseURL,
      ),
    ])

    await page.goto("/products", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/products$/)
  })

  test("a Buyer cookie with isAuthenticated:false on /buyer-dashboard is redirected straight to /login", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([
      buildAuthCookie(
        {
          user: {
            id: "u1",
            name: "B",
            surname: "B",
            email: "b@example.com",
            phoneNumber: "",
            emailConfirmed: true,
            phoneNumberConfirmed: true,
            twoFactorEnabled: false,
            lockoutEnd: null,
            createdDate: "2026-01-01T00:00:00Z",
            roleName: "Buyer",
          } as never,
          accessToken: "tok",
          refreshToken: "tok",
          isAuthenticated: false,
          isAdminImpersonating: false,
        },
        baseURL,
      ),
    ])

    await page.goto("/buyer-dashboard")
    await expect(page).toHaveURL(/\/login\?redirect=%2Fbuyer-dashboard/)
  })
})
