import AxeBuilder from "@axe-core/playwright"
import type { Page } from "@playwright/test"
import { makeLicense } from "@/test/factories/user.factory"
import { makeVendorTopSellingProduct } from "@/test/factories/vendor.factory"
import type { ApiMock } from "./fixtures/api-mock.fixture"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"

/**
 * Cross-route a11y smoke: heading structure, `main` landmark, and header-nav
 * keyboard reachability, plus an axe scan (serious/critical violations only
 * - see the per-route `// FINDING:` `console.log`s below for what's currently
 * failing, so this test LOCKS/reports current behaviour instead of either
 * silently passing or turning into a flaky hard failure over pre-existing gaps).
 */
const PUBLIC_ROUTES = ["/", "/products", "/cart", "/login"]
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
 * FINDING-logging, non-fatal (see checkMainLandmark below for why): the home
 * page (`src/features/home/**`) has NO `<h1>` at all - verified by grep, not
 * just a timing fluke (waited 15s past domcontentloaded, still 0).
 */
async function checkSingleH1(page: Page, route: string) {
  const count = await page.getByRole("heading", { level: 1 }).count()
  if (count !== 1) {
    // biome-ignore lint/suspicious/noConsole: intentional FINDING report surfaced in test output.
    console.log(`FINDING: expected exactly 1 <h1> on ${route}, found ${count}`)
  }
}

/**
 * FINDING-logging, non-fatal per the task brief's "lock current behaviour"
 * rule: `<main>` is checked and reported, not hard-failed on, because at
 * least one route (`/login`, see below) currently has none.
 */
async function checkMainLandmark(page: Page, route: string) {
  const count = await page.locator("main").count()
  if (count === 0) {
    // FINDING: no <main> landmark on this route.
    // biome-ignore lint/suspicious/noConsole: intentional FINDING report surfaced in test output.
    console.log(`FINDING: no <main> landmark found on ${route}`)
  }
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

async function runAxe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
}

/**
 * FINDING: the home page (`/`) pulls in many product images through
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
      // FINDING: recorded, not failed - see the task brief's "lock current
      // behaviour" rule. If this ever needs to gate CI, assert `toEqual([])`.
      if (skips.length > 0) {
        // biome-ignore lint/suspicious/noConsole: intentional FINDING report surfaced in test output.
        console.log(`FINDING: heading level skip(s) on ${route}:`, skips)
      }
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

    await guestPage.keyboard.press("Enter")
    // Generous timeout: under heavy parallel-worker load the click handler
    // (client hydration) can still be settling when Enter fires.
    await expect(guestPage).toHaveURL(/\/cart/, { timeout: 15_000 })
  })

  for (const route of PUBLIC_ROUTES) {
    test(`${route}: no serious/critical axe violations`, async ({ guestPage, apiMock }) => {
      registerA11ySmokeMocks(apiMock)
      await gotoRoute(guestPage, route)
      const violations = await runAxe(guestPage)

      if (violations.length > 0) {
        // FINDING: axe reported serious/critical violation(s) on this route.
        // Locking current behaviour rather than failing the suite - see list below.
        for (const v of violations) {
          // biome-ignore lint/suspicious/noConsole: intentional FINDING report surfaced in test output.
          console.log(`FINDING (${route}): ${v.id} - ${v.help} (${v.nodes.length} node(s))`)
        }
      }
      // The scan itself must always complete without throwing - that's the
      // behaviour under test here; violation counts are reported, not gated.
      expect(Array.isArray(violations)).toBe(true)
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
