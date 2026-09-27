import { expect, test } from "./fixtures/auth.fixture"
import { buildAuthCookie, buildBuyerAuthCookie, buildVendorAuthCookie } from "./fixtures/auth-cookie"
import { registerAllMocks } from "./mocks"

/**
 * src/proxy.ts's redirect matrix, verified against real runtime behaviour -
 * NOT assumed. Read line-for-line before writing these:
 *
 *   1. auth-storage cookie parsed via decodeURIComponent -> JSON.parse, with
 *      a raw JSON.parse fallback; unparseable/missing -> `user = null`,
 *      `isAuthenticated = false`.
 *   2. Vendor guard (runs BEFORE the dashboard block, and independently of
 *      it): `isAuthenticated === true` AND `user.roleName === "Vendor"` AND
 *      path does not start with "/vendor-dashboard" AND is NOT an auth page
 *      (/login, /register, /verify-*, /forgot-password, /reset-password,
 *      /auth/*) -> redirect to /vendor-dashboard. This fires for ANY path,
 *      not just dashboard paths (e.g. Vendor hitting /products). Auth pages
 *      are exempt because sessions are per-tab: a new tab must be able to
 *      sign in as a different account even while a vendor cookie from
 *      another tab is still in the shared auth-storage cookie. (K14 fix: the guard now also checks
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

  test("Buyer hitting /vendor-dashboard is redirected to /buyer-dashboard/orders", async ({ buyerPage }) => {
    await buyerPage.goto("/vendor-dashboard", { waitUntil: "domcontentloaded" })
    await expect(buyerPage).toHaveURL(/\/buyer-dashboard\/orders$/)
  })

  test("Buyer hitting /buyer-dashboard lands on /buyer-dashboard/orders", async ({ buyerPage }) => {
    // Kök sayfa artık Orders'a redirect ediyor; overview dummy veri olduğu için gizlendi.
    await buyerPage.goto("/buyer-dashboard", { waitUntil: "domcontentloaded" })
    await expect(buyerPage).toHaveURL(/\/buyer-dashboard\/orders$/)
  })

  // next.config.ts redirects() (same fix as /buyer-dashboard above): these four legacy URLs used
  // to redirect() from inside their own page.tsx, which streams to the browser as a second,
  // client-side navigation because it sits under the dashboard's loading.tsx. Answered here, at
  // the edge, before the proxy and before any render.
  test.describe("legacy buyer-dashboard vendors/suppliers URLs redirect to the Vendors favorites tab", () => {
    for (const legacyPath of [
      "/buyer-dashboard/vendors",
      "/buyer-dashboard/vendors/favorites",
      "/buyer-dashboard/suppliers",
      "/buyer-dashboard/suppliers/favorites",
    ]) {
      test(`${legacyPath} - a real browser lands on the Vendors tab with the Favorites heading`, async ({
        buyerPage,
        apiMock,
      }) => {
        registerAllMocks(apiMock)
        await buyerPage.goto(legacyPath)
        await expect(buyerPage).toHaveURL(/\/buyer-dashboard\/favorites\?tab=vendors$/)
        await expect(buyerPage.getByRole("heading", { name: "Favorites", level: 1 })).toBeVisible()
      })

      // The assertion above alone would also pass for the OLD page-level `redirect()` (a page.goto
      // ultimately lands on the right URL either way) - it does not prove this is a single request
      // answered before the proxy. A raw, unauthenticated HTTP GET does: next.config's redirects()
      // answers with one 307 here; a page-level `redirect()` under app/buyer-dashboard/loading.tsx
      // instead streams a 200 (the RSC payload triggers the navigation only once it reaches the
      // browser), so this would fail against that old code.
      test(`${legacyPath} - answered by a single 307 before the proxy (unauthenticated is fine)`, async ({
        request,
      }) => {
        const response = await request.get(legacyPath, { maxRedirects: 0 })
        expect(response.status()).toBe(307)
        expect(response.headers().location).toBe("/buyer-dashboard/favorites?tab=vendors")
      })
    }
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

  test("Vendor hitting /register WITHOUT a token passes through (auth pages are exempt from the vendor jail)", async ({
    vendorPage,
  }) => {
    await vendorPage.goto("/register", { waitUntil: "domcontentloaded" })
    await expect(vendorPage).toHaveURL(/\/register$/)
  })

  test("Vendor hitting /login passes through", async ({ vendorPage }) => {
    await vendorPage.goto("/login", { waitUntil: "domcontentloaded" })
    await expect(vendorPage).toHaveURL(/\/login$/)
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

    // Assert the proxy's server redirect itself, not the in-page URL bar: this cookie carries
    // valid user + accessToken (only `isAuthenticated` is stale/false), and authStore's
    // `onRehydrateStorage` derives `isAuthenticated` from user+accessToken presence, ignoring the
    // persisted flag - so the client rehydrates to `isAuthenticated: true` and useLoginForm's
    // self-heal effect (see its own comment) immediately router.replaces to `?redirect=`'s target,
    // making the in-page URL only transiently /login. Same shape as the Buyer case below.
    const response = await page.goto("/vendor-dashboard")
    expect(response?.url()).toMatch(/\/login\?redirect=%2Fvendor-dashboard/)
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

    // Assert the proxy's server redirect itself: once /login hydrates, the login page may restore
    // the cookie's tokens and move on, so the in-page URL is only transiently /login.
    const response = await page.goto("/buyer-dashboard")
    expect(response?.url()).toMatch(/\/login\?redirect=%2Fbuyer-dashboard/)
  })
})

/**
 * The redirects above are only true for the cookie at that instant (the shared cookie mirrors
 * whichever tab wrote last - per-tab sessions), so none of them may ever be stored:
 *   - document / RSC navigation redirects carry `Cache-Control: private, no-store`;
 *   - App Router prefetches skip proxy.ts entirely (`config.matcher` `missing`), so the Router Cache
 *     can never remember "this link leads to the other dashboard". The navigation that follows a
 *     prefetch is a plain RSC request and is still redirected (second assertion).
 * Plain HTTP, `maxRedirects: 0`: this is about the proxy's raw answer, not where a browser ends up.
 */
test.describe("auth-routing: redirects are never cacheable", () => {
  test.use({ apiMockStrict: false })

  test("navigations are redirected with no-store; App Router prefetches are never redirected", async ({
    request,
    baseURL,
  }) => {
    const buyer = buildBuyerAuthCookie({}, baseURL)
    const cookie = `${buyer.name}=${buyer.value}`

    const navigationVariants: Array<Record<string, string>> = [{ cookie }, { cookie, rsc: "1" }]
    for (const headers of navigationVariants) {
      const response = await request.get("/vendor-dashboard", { headers, maxRedirects: 0 })
      expect(response.status(), JSON.stringify(Object.keys(headers))).toBe(307)
      // `returnTo` lets a tab of the other role, bounced here by a sibling's cookie, go back.
      expect(response.headers().location).toBe("/buyer-dashboard?returnTo=%2Fvendor-dashboard")
      expect(response.headers()["cache-control"]).toBe("private, no-store")
    }

    const prefetchVariants: Array<Record<string, string>> = [
      { rsc: "1", "next-router-prefetch": "1", "next-router-segment-prefetch": "/_tree" },
      { rsc: "1", "next-router-prefetch": "1" },
    ]
    for (const prefetchHeaders of prefetchVariants) {
      const response = await request.get("/vendor-dashboard", {
        headers: { cookie, ...prefetchHeaders },
        maxRedirects: 0,
      })
      expect(response.status(), JSON.stringify(prefetchHeaders)).toBeLessThan(300)
      expect(response.headers().location).toBeUndefined()
    }
  })

  test("a signed-out dashboard prefetch is not redirected to /login either", async ({ request }) => {
    const response = await request.get("/buyer-dashboard/orders", {
      headers: { rsc: "1", "next-router-prefetch": "1" },
      maxRedirects: 0,
    })
    expect(response.status()).toBeLessThan(300)
    expect(response.headers().location).toBeUndefined()

    const navigation = await request.get("/buyer-dashboard/orders", { maxRedirects: 0 })
    expect(navigation.status()).toBe(307)
    expect(navigation.headers()["cache-control"]).toBe("private, no-store")
  })
})
