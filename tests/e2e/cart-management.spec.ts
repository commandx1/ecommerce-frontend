import { makeCart, makeCartItem } from "@/test/factories/cart.factory"
import { makeLicense } from "@/test/factories/user.factory"
import type { ApiMock } from "./fixtures/api-mock.fixture"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { CartPage } from "./pages/cart.page"

/**
 * src/features/cart/**. All writes go through the SAME endpoint pair
 * (PUT/DELETE `/backend-api/cart/items`) - see cartStore.ts: quantity changes,
 * auto-order changes, and removal-via-zero-quantity all funnel through
 * `updateQuantity`/`setItemAutoOrder`/`removeFromCart`.
 */

/**
 * useCartPage.ts always calls `licenseAPI.getLicenses()` on mount (to derive
 * `isLicenseBlocked`). `GET /backend-api/licenses` is intentionally NOT
 * registered by account.mocks.ts (handler-literal `{ licenses, total }`
 * wrapper, no exported factory for the wrapper - see that file's header
 * comment), so every test in this spec needs it registered directly.
 */
function registerCartMocksWithLicense(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/licenses", () => ({ body: { licenses: [makeLicense()], total: 1 } }))
  registerAllMocks(apiMock)
}

test.describe("cart management", () => {
  test("rapid quantity clicks are debounced into a single PUT request", async ({ buyerPage, apiMock }) => {
    registerCartMocksWithLicense(apiMock)

    const requests: string[] = []
    buyerPage.on("request", (req) => {
      if (req.method() === "PUT" && req.url().includes("/backend-api/cart/items")) {
        requests.push(req.postData() ?? "")
      }
    })

    const cart = new CartPage(buyerPage)
    await cart.goto()
    await expect(cart.mainHeading).toBeVisible()

    // useDebouncedPerKeyCallback - QUANTITY_DEBOUNCE_MS = 450ms. Click fast (well
    // under the debounce window) so all three collapse into one scheduled write.
    await cart.increaseQuantityButton.first().click()
    await cart.increaseQuantityButton.first().click()
    await cart.increaseQuantityButton.first().click()

    // Wait past the debounce window, then assert exactly one PUT landed with
    // the FINAL quantity (base 2 + 3 clicks = 5, per makeCartItem()'s default).
    await expect.poll(() => requests.length, { timeout: 5_000 }).toBe(1)
    const body = JSON.parse(requests[0]) as { userProductId: string; quantity: number }
    expect(body.userProductId).toBe("up-1")
    expect(body.quantity).toBe(5)

    // No further request appears after the debounce fires - collapsing held.
    await buyerPage.waitForTimeout(300)
    expect(requests.length).toBe(1)
  })

  test("enabling auto-reorder sends the period on the cart items endpoint", async ({ buyerPage, apiMock }) => {
    registerCartMocksWithLicense(apiMock)

    const cart = new CartPage(buyerPage)
    await cart.goto()
    await expect(cart.mainHeading).toBeVisible()

    const putRequest = buyerPage.waitForRequest(
      (req) => req.method() === "PUT" && req.url().includes("/backend-api/cart/items"),
    )
    await cart.autoReorderCheckbox.click()
    const request = await putRequest
    const body = request.postDataJSON() as { userProductId: string; autoOrder: string | null }
    expect(body.userProductId).toBe("up-1")
    expect(body.autoOrder).not.toBeNull()

    await expect(cart.autoReorderFrequencySelect).toBeVisible()
  })

  test("removing a line item sends a DELETE with the userProductId", async ({ buyerPage, apiMock }) => {
    registerCartMocksWithLicense(apiMock)

    const cart = new CartPage(buyerPage)
    await cart.goto()
    await expect(cart.mainHeading).toBeVisible()

    const deleteRequest = buyerPage.waitForRequest(
      (req) => req.method() === "DELETE" && req.url().includes("/backend-api/cart/items"),
    )
    await cart.removeItemButtons.first().click()
    const request = await deleteRequest
    expect(request.postDataJSON()).toEqual({ userProductId: "up-1" })
  })

  test("empty cart shows the empty state instead of the item list", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart({ cartItems: [] }) }))
    registerCartMocksWithLicense(apiMock)

    const cart = new CartPage(buyerPage)
    await cart.goto()

    await expect(cart.emptyStateHeading).toBeVisible()
    await cart.continueShoppingButton.click()
    await cart.expectUrl("/")
  })

  test("a blocking alert on a line item prevents checkout from proceeding", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/cart", () => ({
      body: makeCart({
        cartItems: [
          makeCartItem({
            userProduct: {
              userProductId: "up-1",
              oldPrice: 70,
              price: 56,
              discount: 20,
              shipmentFee: 5,
              heavyShippingSurcharge: 0,
              stock: 0,
              // getCartItemAlerts() / hasBlockingCartAlert() (cart-alerts.ts) treats
              // any of these three alert strings as blocking.
              stockAlert: "This item is out of stock",
              userProductAlert: null,
              sellerId: "seller-1",
              sellerName: "Acme Dental",
            },
          }),
        ],
      }),
    }))
    registerCartMocksWithLicense(apiMock)

    const cart = new CartPage(buyerPage)
    await cart.goto()
    await expect(cart.mainHeading).toBeVisible()
    await expect(cart.checkoutBlockedNotice).toBeVisible()

    // useCartPage.onCheckout() shows a toast and returns early - it does NOT
    // disable the button (isCheckoutDisabled is only `items.length === 0`,
    // see CartContent.tsx) - so this locks the actual current behaviour.
    await cart.checkoutButton.click()
    await expect(cart.toast).toContainText("Checkout unavailable")
    await cart.expectUrl("/cart")
  })
})
