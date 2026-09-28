import { makeCart, makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories/cart.factory"
import { makeLicense } from "@/test/factories/user.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { CartPage } from "./pages/cart.page"

/**
 * Dental-license gate on a license-required cart item (src/features/cart/hooks/useCartPage.ts's
 * `onCheckout`, src/lib/helpers/dentalLicense.ts, src/lib/hooks/useDentalLicenseGate.ts). Unlike
 * checkout-happy-path.spec.ts/cart-management.spec.ts, which both deliberately keep
 * `GET /backend-api/licenses` empty/valid so the gate never engages, this spec drives the block
 * itself: `product.dentalLicenseRequired` is a free-form string column
 * (`isDentalLicenseRequiredValue` accepts "true"/"yes"/"1", case-insensitively) written by two
 * other codebases, so "Yes" here is a real, representative value - not an invented one.
 */
const LICENSED_ITEM = makeCartItem({
  id: "ci-1",
  userProduct: makeCartUserProduct({ userProductId: "up-1" }),
  product: makeCartProductInfo({ id: "p-1", name: "Dental X-Ray Sensor", dentalLicenseRequired: "Yes" }),
})

test.describe("cart license gate", () => {
  test("no license on file blocks checkout with a warning and does not navigate to /checkout", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart({ cartItems: [LICENSED_ITEM] }) }))
    apiMock.on("GET", "/backend-api/licenses", () => ({ body: { licenses: [], total: 0 } }))
    registerAllMocks(apiMock)

    const cart = new CartPage(buyerPage)
    await cart.goto()
    await expect(cart.mainHeading).toBeVisible()

    await expect(buyerPage.getByText("Dental license required")).toBeVisible()
    await expect(buyerPage.getByText("Add your license")).toBeVisible()

    await cart.checkoutButton.click()
    await expect(cart.toast).toContainText("Dental license required")
    await expect(buyerPage).toHaveURL(/\/cart$/)
  })

  test("an expired license blocks checkout with the renew-specific warning", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart({ cartItems: [LICENSED_ITEM] }) }))
    apiMock.on("GET", "/backend-api/licenses", () => ({
      body: { licenses: [makeLicense({ approved: true, expired: true })], total: 1 },
    }))
    registerAllMocks(apiMock)

    const cart = new CartPage(buyerPage)
    await cart.goto()
    await expect(cart.mainHeading).toBeVisible()

    await expect(buyerPage.getByText("Your dental license expired")).toBeVisible()

    await cart.checkoutButton.click()
    await expect(cart.toast).toContainText("Your dental license expired")
    await expect(buyerPage).toHaveURL(/\/cart$/)
  })

  test("a valid, approved license shows no warning and proceeds to checkout", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart({ cartItems: [LICENSED_ITEM] }) }))
    apiMock.on("GET", "/backend-api/licenses", () => ({
      body: { licenses: [makeLicense({ approved: true, expired: false })], total: 1 },
    }))
    // Proceeding past the gate lands on /checkout, whose shipping step immediately fetches
    // rates (see checkout-happy-path.spec.ts's identical route) - not this test's concern beyond
    // proving navigation actually happened, so a minimal empty-rates stub is enough.
    apiMock.on("POST", "/backend-api/shipment/rates", () => ({
      body: { shippoRates: [], uberQuote: null, defaultShipmentFee: 0 },
    }))
    registerAllMocks(apiMock)

    const cart = new CartPage(buyerPage)
    await cart.goto()
    await expect(cart.mainHeading).toBeVisible()

    await expect(buyerPage.getByText("Dental license required")).toHaveCount(0)
    await expect(buyerPage.getByText(/dental license/i)).toHaveCount(0)

    await expect(cart.checkoutButton).toBeEnabled()
    await cart.checkoutButton.click()
    await expect(buyerPage).toHaveURL(/\/checkout$/)
  })
})
