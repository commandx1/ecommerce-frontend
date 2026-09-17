import AxeBuilder from "@axe-core/playwright"
import type { Page } from "@playwright/test"
import { makeLicense } from "@/test/factories/user.factory"
import { makeVendorTopSellingProduct } from "@/test/factories/vendor.factory"
import type { ApiMock } from "./fixtures/api-mock.fixture"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"

/**
 * Cross-route a11y smoke: heading structure, `main` landmark, and header-nav
 * keyboard reachability, plus an axe scan (serious/critical violations only).
 *
 * This spec used to `console.log("FINDING: ...")` every violation and then assert
 * something tautological (`expect(Array.isArray(violations)).toBe(true)`), so it
 * passed green while the app shipped missing `h1`s, a missing `main` landmark,
 * unnamed links and contrast failures. It is a real gate now: every check below
 * fails the run. The findings it used to only report were fixed in the 28 Aug 2026
 * a11y round (F88-F92); if one comes back, this spec is what catches it.
 */
// `/products/p-1` is here because the supplier-comparison table on the detail page carried an
// `aria-selected` on a plain <tr> for months and no scan ever saw it - the route was simply not
// in this list. The mock backend answers `/api/products/:id/with-user-products` for any id.
const PUBLIC_ROUTES = ["/", "/products", "/products/p-1", "/categories", "/cart", "/login"]
const BUYER_ROUTE = "/buyer-dashboard"
const VENDOR_ROUTE = "/vendor-dashboard"

/**
 * `/cart` needs `GET /backend-api/licenses` (useCartPage.ts, not registered
 * by account.mocks.ts - handler-literal wrapper, see that file's header) and
 * `/vendor-dashboard` needs `GET /backend-api/dashboard/vendor/top-selling-products`
 * (not registered by vendor.mocks.ts - same reason, see that file's header).
 */
function registerA11ySmokeMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/licenses", () => ({ body: { licenses: [makeLicense()], total: 1 } }))
  apiMock.on("GET", "/backend-api/dashboard/vendor/top-selling-products", () => ({
    body: { content: [makeVendorTopSellingProduct()], totalElements: 1, totalPages: 1, page: 0, size: 4 },
  }))
  registerAllMocks(apiMock)
}

/**
 * Exactly one `<h1>`: zero leaves a screen-reader user with no page title to
 * orient by, and more than one destroys the document outline. Loading/skeleton
 * states carry their own `sr-only` h1 so the count never dips to 0 mid-render.
 */
async function checkSingleH1(page: Page, route: string) {
  const count = await page.getByRole("heading", { level: 1 }).count()
  expect(count, `expected exactly 1 <h1> on ${route}, found ${count}`).toBe(1)
}

/**
 * Every route needs a `<main>` landmark - it is the "skip to main content"
 * target. `/login` had none until 28 Aug 2026 (LoginPage's wrapper `<section>`
 * became `<main>`; same classes, no visual change).
 */
async function checkMainLandmark(page: Page, route: string) {
  const count = await page.locator("main").count()
  expect(count, `no <main> landmark found on ${route}`).toBeGreaterThan(0)
}

async function assertNoHeadingLevelSkips(page: Page): Promise<string[]> {
  const levels = await page.evaluate(() =>
    Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((el) => Number(el.tagName[1])),
  )
  const skips: string[] = []
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      skips.push(`h${levels[i - 1]} -> h${levels[i]} at position ${i}`)
    }
  }
  return skips
}

async function scanOnce(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
}

/**
 * Scans twice when the first pass reports something, and returns the SECOND result.
 *
 * These pages are scanned at `domcontentloaded`, so an interactive control can still be mid
 * hydration when axe walks the tree - a button whose accessible name arrives with its client
 * component reads as `button-name` for those few milliseconds. That produced exactly one
 * `/products` failure in a full `--workers=1` run on 28 Aug 2026 that would not reproduce in
 * isolation (11/11) or on a re-run (134/134).
 *
 * This does NOT hide real violations: a genuine one is still there on the second pass and still
 * fails the test. It only removes the hydration race. A clean first pass returns immediately, so
 * the happy path costs nothing.
 */
async function runAxe(page: Page) {
  const first = await scanOnce(page)
  if (first.length === 0) return first

  await page.waitForTimeout(500)
  return scanOnce(page)
}

/**
 * Why `domcontentloaded`: the home page (`/`) pulls in many product images through
 * `/api/images/*`, and `apiMock` intercepts ALL `/api/**` traffic (proxying
 * each one through this test's own route handler) - slow enough in
 * aggregate that the default `waitUntil: "load"` blows past
 * playwright.config.ts's 15s navigationTimeout. `domcontentloaded` is
 * sufficient for every check in this spec (headings/landmarks/axe all run
 * against the rendered DOM, not image load completion).
 */
async function gotoRoute(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" })
}

test.describe("a11y smoke - public routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route}: single h1, main landmark, no heading-level skips`, async ({ guestPage, apiMock }) => {
      registerA11ySmokeMocks(apiMock)
      await gotoRoute(guestPage, route)
      await expect(guestPage).toHaveURL(new RegExp(route === "/" ? "/$" : route.replace(/\//g, "\\/")))

      await checkSingleH1(guestPage, route)
      await checkMainLandmark(guestPage, route)

      const skips = await assertNoHeadingLevelSkips(guestPage)
      expect(skips, `heading level skip(s) on ${route}`).toEqual([])
    })
  }

  test("keyboard: Tab reaches header nav links and Enter activates one", async ({ guestPage, apiMock }) => {
    registerA11ySmokeMocks(apiMock)
    await gotoRoute(guestPage, "/")

    // Scoped to <header> - the homepage body ALSO has a "Go to cart" link
    // whose accessible name loosely matches "Cart" under Playwright's default
    // substring/case-insensitive name matching, so an unscoped locator is ambiguous.
    const cartLink = guestPage.locator("header").getByRole("link", { name: "Cart", exact: true })
    await expect(cartLink).toBeVisible()
    await cartLink.focus()
    await expect(cartLink).toBeFocused()

    // Wait for the navigation the keypress starts, rather than pressing and then
    // polling the URL: the old shape raced client hydration and was the flakiest
    // test in the suite under load (infra note #21).
    await Promise.all([guestPage.waitForURL(/\/cart/, { timeout: 15_000 }), guestPage.keyboard.press("Enter")])
  })

  for (const route of PUBLIC_ROUTES) {
    test(`${route}: no serious/critical axe violations`, async ({ guestPage, apiMock }) => {
      registerA11ySmokeMocks(apiMock)
      await gotoRoute(guestPage, route)
      const violations = await runAxe(guestPage)

      // Named summaries rather than a bare count, so a failure says WHICH rule
      // broke and on how many nodes without having to re-run axe by hand.
      const summaries = violations.map((v) => `${v.id} - ${v.help} (${v.nodes.length} node(s))`)
      expect(summaries, `serious/critical axe violations on ${route}`).toEqual([])
    })
  }
})

test.describe("a11y smoke - dashboards", () => {
  test("buyer dashboard: single h1, main landmark", async ({ buyerPage, apiMock }) => {
    registerA11ySmokeMocks(apiMock)
    await gotoRoute(buyerPage, BUYER_ROUTE)
    await expect(buyerPage).toHaveURL(new RegExp(BUYER_ROUTE))
    await checkSingleH1(buyerPage, BUYER_ROUTE)
    await checkMainLandmark(buyerPage, BUYER_ROUTE)
  })

  test("vendor dashboard: single h1, main landmark", async ({ vendorPage, apiMock }) => {
    registerA11ySmokeMocks(apiMock)
    await gotoRoute(vendorPage, VENDOR_ROUTE)
    await expect(vendorPage).toHaveURL(new RegExp(VENDOR_ROUTE))
    await checkSingleH1(vendorPage, VENDOR_ROUTE)
    await checkMainLandmark(vendorPage, VENDOR_ROUTE)
  })
})
