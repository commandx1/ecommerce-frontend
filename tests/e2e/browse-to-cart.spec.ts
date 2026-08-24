import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { HomePage } from "./pages/home.page"
import { ProductDetailPage } from "./pages/product-detail.page"
import { ProductListingPage } from "./pages/product-listing.page"

/**
 * Home -> header search -> product detail; `/products` listing + the
 * "In Stock" filter (URL query updates); listing -> product detail ->
 * select a supplier -> add to cart -> header badge updates.
 *
 * Faz 8.2: `/products` and `/products/:id` are Server Components
 * (get-listing-page-data.ts / get-product-detail-page-data.ts) that fetch
 * `BACKEND_URL` directly from the Next.js server process - NOT through the
 * browser, so `apiMock`'s `page.route` interception never sees those
 * requests (see CLAUDE.md: "Server Components call BACKEND_URL directly,
 * bypassing the proxy"). This spec now runs against a dedicated e2e Next.js
 * instance (port 3100, see playwright.config.ts) whose `BACKEND_URL` points
 * at tests/e2e/mock-backend/server.mjs - a small deterministic fake backend,
 * NOT the real backend. Every product/supplier fact this spec asserts on
 * (name, price, supplier count, stock) comes from that fake backend, so the
 * flow is fully deterministic and does not depend on live data. Only
 * genuinely browser-issued calls (the header search's
 * `/api/products/public-search`, and the "Add to Cart" POST) go through
 * `apiMock` as before.
 */
test.describe("browse to cart", () => {
  test("home header search navigates to a product detail page", async ({ buyerPage, apiMock }) => {
    registerAllMocks(apiMock)

    const home = new HomePage(buyerPage)
    // BasePage.goto() uses the default `waitUntil: "load"`, which waits for
    // every resource on the page - the home page pulls in many product
    // images through `/api/images/*`, and apiMock intercepts ALL `/api/**`
    // traffic (proxying each one through this test's own route handler),
    // which is slow enough in aggregate to blow past playwright.config.ts's
    // 15s navigationTimeout. `domcontentloaded` is enough for this test (it
    // only needs the search box to be interactive).
    await buyerPage.goto(home.path, { waitUntil: "domcontentloaded" })

    await home.searchFor("a")
    // Debounced (300ms) + a real network round-trip; poll instead of a fixed sleep.
    await expect.poll(async () => home.searchResults.count(), { timeout: 10_000 }).toBeGreaterThan(0)

    const firstResultHref = await home.searchResults.first().getAttribute("href")
    expect(firstResultHref).toMatch(/^\/products\//)

    // The dropdown re-renders as the debounced query settles, so the click can
    // land on a node that is being replaced. Retry until the navigation the
    // click is supposed to cause actually happens.
    await expect(async () => {
      await home.searchResults.first().click()
      await expect(buyerPage).toHaveURL(/\/products\//, { timeout: 5_000 })
    }).toPass({ timeout: 20_000 })
  })

  test("listing page: applying the In Stock filter updates the URL query", async ({ buyerPage, apiMock }) => {
    registerAllMocks(apiMock)

    const listing = new ProductListingPage(buyerPage)
    await listing.goto()
    await expect(listing.mainHeading).toBeVisible()

    const filter = listing.inStockFilter
    const wasChecked = await filter.isChecked()

    await filter.click()
    // useProductFiltersNavigation -> router.push(`/products?...`) - real navigation.
    if (wasChecked) {
      await expect(buyerPage).toHaveURL(/inStock=false/)
    } else {
      await expect(buyerPage).not.toHaveURL(/inStock=false/)
    }

    // Toggling back removes/re-adds the param consistently.
    await filter.click()
    if (wasChecked) {
      await expect(buyerPage).not.toHaveURL(/inStock=false/)
    } else {
      await expect(buyerPage).toHaveURL(/inStock=false/)
    }
  })

  test("listing -> product detail -> select a supplier -> add to cart -> header badge updates", async ({
    buyerPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)

    const listing = new ProductListingPage(buyerPage)
    await listing.goto()
    await expect(listing.mainHeading).toBeVisible()

    // tests/e2e/mock-backend/server.mjs's GET /api/products/public always
    // returns exactly one product, so the listing always has a card to browse from.
    const firstProductHref = await listing.productLinks.first().getAttribute("href")
    expect(firstProductHref).toMatch(/^\/products\//)

    await listing.productLinks.first().click()
    await listing.expectUrl(/\/products\//)

    const productId = new URL(buyerPage.url()).pathname.split("/").pop() as string
    const detail = new ProductDetailPage(buyerPage, productId)
    await expect(detail.mainHeading).toBeVisible({ timeout: 15_000 })

    // The fake backend's GET /api/products/:id/with-user-products echoes the
    // requested id back as product.id, so this never 404s regardless of
    // which id the listing linked to.
    await expect(detail.mainHeading).not.toContainText("Product Not Found")

    // Supplier selection: the fake backend returns two userProducts (up-1 at
    // $56, the default-selected cheapest; up-2 at $62), so exactly one
    // "Select" button (for the non-selected up-2) is always present -
    // confirm the ?vendorId= URL param updates (useSupplierSelection.ts uses
    // router.replace).
    const selectButtons = detail.selectSupplierButtons
    await expect(selectButtons).toHaveCount(1)
    const urlBefore = buyerPage.url()
    await selectButtons.first().click()
    await expect.poll(() => buyerPage.url()).not.toBe(urlBefore)
    await expect(buyerPage).toHaveURL(/vendorId=/)

    // Both fake suppliers have stock > 0, so Add to Cart is always enabled.
    const addToCartButton = detail.addToCartButton
    await expect(addToCartButton).toBeVisible()
    await expect(addToCartButton).toBeEnabled()

    const addItemRequest = buyerPage.waitForRequest(
      (req) => req.url().includes("/backend-api/cart/items") && req.method() === "POST",
    )
    await addToCartButton.click()
    const request = await addItemRequest
    const body = request.postDataJSON() as { userProductId?: string; quantity?: number }
    expect(body).toHaveProperty("userProductId")
    expect(typeof body.userProductId).toBe("string")
    expect(body.quantity).toBe(1)

    // cartAPI.addItem resolves -> fetchCart() runs -> cartCount comes from
    // the mocked GET /backend-api/cart (registerCartMocks -> makeCart()).
    // cartStore sums cartItems[].quantity (src/stores/cartStore.ts), and
    // makeCartItem()'s default quantity is 2 (src/test/factories/cart.factory.ts) -
    // NOT the number of distinct line items, so the badge reads "2".
    await expect(detail.cartBadge).toContainText("2")
  })
})
