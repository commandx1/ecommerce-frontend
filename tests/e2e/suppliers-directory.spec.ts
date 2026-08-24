import { makeVendorListItem } from "@/test/factories/vendor.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { SuppliersDirectoryPage } from "./pages/suppliers-directory.page"

/**
 * Faz 8.2 - /vendors (public vendor directory, SuppliersDirectorySection).
 * `/suppliers` is a legacy route that `redirect()`s to `/vendors`
 * (src/app/suppliers/page.tsx), so `/vendors` is the real directory page.
 *
 * FINDING: neither this page nor any other page in the suppliers feature has
 * BOTH a search box and a card/table view toggle together:
 *  - `getVendors()` (src/lib/api/vendors.ts) accepts a `search` query param,
 *    but no component anywhere calls it with one - there is no search input
 *    in the UI at all (grepped src/features/suppliers/**). Not covered below.
 *  - The card/table toggle only exists on the buyer-dashboard favorites page
 *    (FavoriteSuppliersPage, /buyer-dashboard/vendors/favorites), which has
 *    no filter/sort of its own - it just lists whatever `getMyFavoriteVendors()`
 *    returns. Not covered below either; this spec sticks to what /vendors
 *    actually renders: rating filter, sort, favorite toggle and pagination.
 *
 * `GET /backend-api/vendors` and `GET /backend-api/vendors/favorite-ids` are
 * NOT registered by registerAllMocks (see mocks/vendor.mocks.ts's EXCEPT
 * list) - both are registered per-test here.
 */

const VENDOR_A = makeVendorListItem({ id: "vendor-a", name: "Alpha Dental", companyName: "Alpha Dental Supplies" })
const VENDOR_B = makeVendorListItem({ id: "vendor-b", name: "Beta Ortho", companyName: "Beta Ortho Supplies" })

test.describe("suppliers directory", () => {
  test("renders vendors from the default query (page 1, rating sort)", async ({ guestPage, apiMock }) => {
    const initialRequest = guestPage.waitForRequest(
      (request) => request.method() === "GET" && request.url().includes("/backend-api/vendors?"),
    )

    apiMock.on("GET", "/backend-api/vendors", () => ({
      body: { vendors: [VENDOR_A, VENDOR_B], totalCount: 2, page: 0, size: 6, totalPages: 1 },
    }))
    registerAllMocks(apiMock)

    const directory = new SuppliersDirectoryPage(guestPage)
    await directory.goto()

    await expect(directory.vendorsHeading).toBeVisible()
    await expect(directory.supplierCard(VENDOR_A.name)).toBeVisible()
    await expect(directory.supplierCard(VENDOR_B.name)).toBeVisible()

    const request = await initialRequest
    const query = new URL(request.url()).searchParams
    expect(query.get("page")).toBe("0")
    expect(query.get("size")).toBe("6")
    expect(query.get("sort")).toBe("rating")
    expect(query.get("minRating")).toBeNull()
  })

  test("changing the rating filter re-fetches with minRating and resets to page 1", async ({ guestPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/vendors", () => ({
      body: { vendors: [VENDOR_A], totalCount: 1, page: 0, size: 6, totalPages: 1 },
    }))
    registerAllMocks(apiMock)

    const directory = new SuppliersDirectoryPage(guestPage)
    await directory.goto()
    await expect(directory.supplierCard(VENDOR_A.name)).toBeVisible()

    const filteredRequest = guestPage.waitForRequest(
      (request) => request.method() === "GET" && request.url().includes("/backend-api/vendors?"),
    )
    await directory.ratingFilter.click()
    await directory.option("4+ Stars").click()

    const request = await filteredRequest
    const query = new URL(request.url()).searchParams
    expect(query.get("minRating")).toBe("4")
    expect(query.get("page")).toBe("0")
  })

  test("changing the sort order re-fetches with the mapped sort value", async ({ guestPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/vendors", () => ({
      body: { vendors: [VENDOR_A], totalCount: 1, page: 0, size: 6, totalPages: 1 },
    }))
    registerAllMocks(apiMock)

    const directory = new SuppliersDirectoryPage(guestPage)
    await directory.goto()
    await expect(directory.supplierCard(VENDOR_A.name)).toBeVisible()

    const sortedRequest = guestPage.waitForRequest(
      (request) => request.method() === "GET" && request.url().includes("/backend-api/vendors?"),
    )
    await directory.sortSelect.click()
    await directory.option("A-Z").click()

    const request = await sortedRequest
    expect(new URL(request.url()).searchParams.get("sort")).toBe("name")
  })

  test("clicking page 2 re-fetches with page=1", async ({ guestPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/vendors", () => ({
      body: { vendors: [VENDOR_A, VENDOR_B], totalCount: 12, page: 0, size: 6, totalPages: 2 },
    }))
    registerAllMocks(apiMock)

    const directory = new SuppliersDirectoryPage(guestPage)
    await directory.goto()
    await expect(directory.supplierCard(VENDOR_A.name)).toBeVisible()

    const pageTwoRequest = guestPage.waitForRequest(
      (request) => request.method() === "GET" && request.url().includes("/backend-api/vendors?"),
    )
    await directory.pageButton(2).click()

    const request = await pageTwoRequest
    expect(new URL(request.url()).searchParams.get("page")).toBe("1")
  })

  test("toggling a favorite as a logged-in buyer sends POST then DELETE", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/vendors", () => ({
      body: { vendors: [VENDOR_A], totalCount: 1, page: 0, size: 6, totalPages: 1 },
    }))
    apiMock.on("GET", "/backend-api/vendors/favorite-ids", () => ({ body: [] }))
    registerAllMocks(apiMock)

    const directory = new SuppliersDirectoryPage(buyerPage)
    await directory.goto()
    await expect(directory.supplierCard(VENDOR_A.name)).toBeVisible()

    const favoriteButton = directory.favoriteToggle(VENDOR_A.name)
    await expect(favoriteButton).toHaveAccessibleName("Save to favorites")

    const addRequest = buyerPage.waitForRequest(
      (request) =>
        request.method() === "POST" && request.url().endsWith(`/backend-api/vendors/${VENDOR_A.id}/favorite`),
    )
    await favoriteButton.click()
    await addRequest
    await expect(favoriteButton).toHaveAccessibleName("Remove from favorites")

    const removeRequest = buyerPage.waitForRequest(
      (request) =>
        request.method() === "DELETE" && request.url().endsWith(`/backend-api/vendors/${VENDOR_A.id}/favorite`),
    )
    await favoriteButton.click()
    await removeRequest
    await expect(favoriteButton).toHaveAccessibleName("Save to favorites")
  })

  test("toggling a favorite as a guest shows a login-required toast and sends no request", async ({
    guestPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/vendors", () => ({
      body: { vendors: [VENDOR_A], totalCount: 1, page: 0, size: 6, totalPages: 1 },
    }))
    registerAllMocks(apiMock)

    const directory = new SuppliersDirectoryPage(guestPage)
    await directory.goto()
    await expect(directory.supplierCard(VENDOR_A.name)).toBeVisible()

    await directory.favoriteToggle(VENDOR_A.name).click()
    await expect(directory.toast).toContainText("Login required")
    // No favorite request should have been made - a guest never has an
    // /vendors/favorite-ids call either, so registerAllMocks alone (without
    // registering /favorite) is enough; the apiMock teardown assertion would
    // fail this test if the click had fired one.
  })
})
