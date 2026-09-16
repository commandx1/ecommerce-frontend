import { makeFavoriteProductItem } from "@/test/factories/product.factory"
import { makeVendorListItem } from "@/test/factories/vendor.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { FavoritesPage } from "./pages/favorites.page"
import { ProductDetailPage } from "./pages/product-detail.page"
import { ProductListingPage } from "./pages/product-listing.page"

/**
 * Favorite products - the heart toggle on /products and /products/:id
 * (FavoriteProductButton.tsx, POST|DELETE /backend-api/products/:id/favorite,
 * state hydrated once from GET /backend-api/products/favorite-ids), plus the
 * /buyer-dashboard/favorites page (FavoritesPage.tsx: "Products" tab -
 * FavoriteProductsTab.tsx, GET /backend-api/products/favorites - and
 * "Vendors" tab - the existing FavoriteSuppliersPage, GET
 * /backend-api/vendors/favorites) and its legacy-URL redirects.
 *
 * `GET /backend-api/products/favorite-ids` has a mandatory `[]` default in
 * registerProductsMocks (every buyerPage visit to /products or
 * /products/:id fires it on mount) - tests here that need it non-empty
 * override it BEFORE calling `registerAllMocks` (first-registered route
 * wins, see fixtures/api-mock.fixture.ts's doc-comment).
 */

const FAVORITE_PRODUCT = makeFavoriteProductItem()
const FAVORITE_VENDOR = makeVendorListItem()

test.describe("favorite products", () => {
  test("buyer toggles a product favorite on the listing page: POST then DELETE", async ({ buyerPage, apiMock }) => {
    registerAllMocks(apiMock)

    const listing = new ProductListingPage(buyerPage)
    await listing.goto()

    const toggle = listing.favoriteToggle()
    await expect(toggle).toHaveAccessibleName("Save to favorites")

    const addRequest = buyerPage.waitForRequest(
      (request) => request.method() === "POST" && request.url().endsWith("/backend-api/products/p-1/favorite"),
    )
    await toggle.click()
    await addRequest
    await expect(toggle).toHaveAccessibleName("Remove from favorites")

    const deleteRequests: string[] = []
    buyerPage.on("request", (request) => {
      if (request.method() === "DELETE" && request.url().endsWith("/backend-api/products/p-1/favorite")) {
        deleteRequests.push(request.url())
      }
    })
    await toggle.click()
    await buyerPage.getByRole("button", { name: "Cancel", exact: true }).click()
    expect(deleteRequests).toEqual([])
    await expect(toggle).toHaveAccessibleName("Remove from favorites")

    const removeRequest = buyerPage.waitForRequest(
      (request) => request.method() === "DELETE" && request.url().endsWith("/backend-api/products/p-1/favorite"),
    )
    await toggle.click()
    await buyerPage.getByRole("button", { name: "Remove", exact: true }).click()
    await removeRequest
    await expect(toggle).toHaveAccessibleName("Save to favorites")
  })

  test("buyer visiting a favorited product's detail page sees the hero toggle already active", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/products/favorite-ids", () => ({ body: ["p-1"] }))
    registerAllMocks(apiMock)

    const detail = new ProductDetailPage(buyerPage, "p-1")
    await detail.goto()

    await expect(detail.favoriteToggle()).toHaveAccessibleName("Remove from favorites")
  })

  test("guest clicking the toggle sees a login-required toast and sends no favorite request", async ({
    guestPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)

    const favoriteRequests: string[] = []
    guestPage.on("request", (request) => {
      if (request.url().includes("/favorite")) favoriteRequests.push(`${request.method()} ${request.url()}`)
    })

    const listing = new ProductListingPage(guestPage)
    await listing.goto()

    await listing.favoriteToggle().click()
    await expect(listing.toast).toContainText("Login required")
    expect(favoriteRequests).toEqual([])
  })

  test("favorites page: Products tab shows favorited products, switching to Vendors updates the URL and list", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/products/favorite-ids", () => ({ body: ["p-1"] }))
    registerAllMocks(apiMock)

    const favorites = new FavoritesPage(buyerPage)
    await favorites.goto()

    await expect(favorites.heading).toHaveText("Favorites")
    await expect(favorites.tab("Products")).toHaveAttribute("data-state", "active")
    await expect(favorites.productCard(FAVORITE_PRODUCT.productName)).toBeVisible()

    await favorites.tab("Vendors").click()
    await favorites.expectUrl(/\/buyer-dashboard\/favorites\?tab=vendors/)
    await expect(buyerPage.getByRole("heading", { name: FAVORITE_VENDOR.name, level: 3 })).toBeVisible()

    // Direct navigation with the query param lands on the Vendors tab too.
    await favorites.goto({ tab: "vendors" })
    await expect(favorites.tab("Vendors")).toHaveAttribute("data-state", "active")
    await expect(buyerPage.getByRole("heading", { name: FAVORITE_VENDOR.name, level: 3 })).toBeVisible()
  })

  test("removing a product from the favorites page deletes it and shows the empty state", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/products/favorite-ids", () => ({ body: ["p-1"] }))
    registerAllMocks(apiMock)

    const favorites = new FavoritesPage(buyerPage)
    await favorites.goto()
    await expect(favorites.productCard(FAVORITE_PRODUCT.productName)).toBeVisible()

    const removeRequest = buyerPage.waitForRequest(
      (request) => request.method() === "DELETE" && request.url().endsWith("/backend-api/products/p-1/favorite"),
    )
    await favorites.favoriteToggle(FAVORITE_PRODUCT.productName).click()
    await buyerPage.getByRole("button", { name: "Remove", exact: true }).click()
    await removeRequest

    await expect(favorites.productCard(FAVORITE_PRODUCT.productName)).toBeHidden()
    await expect(favorites.emptyState).toBeVisible()
  })

  test("legacy /buyer-dashboard/vendors/favorites redirects to the Vendors tab", async ({ buyerPage, apiMock }) => {
    registerAllMocks(apiMock)

    await buyerPage.goto("/buyer-dashboard/vendors/favorites")
    await expect(buyerPage).toHaveURL(/\/buyer-dashboard\/favorites\?tab=vendors/)
  })
})
